#![allow(dead_code)]
mod asr;
mod audio;
mod automation;
mod commands;
mod integrations;
mod ipc;
mod model;
mod permissions;
mod settings;

use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use crossbeam_channel;
use parking_lot::Mutex;
use serde_json::json;
use tauri::{Emitter, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

use crate::asr::whisper_native::WhisperTranscriber;

pub fn run() {
    let settings_store = Arc::new(
        settings::config::SettingsStore::new().expect("failed to initialize settings"),
    );
    let (audio_tx, audio_rx) = crossbeam_channel::unbounded::<Vec<f32>>();
    let audio_service = audio::capture::AudioCaptureService::new(audio_tx);
    let priority_mic =
        audio::priority_mic::PriorityMicService::new(settings_store.clone(), audio_service.clone());
    let asr_service = asr::sidecar::ASRService::new();
    let registry = commands::registry::CommandRegistry::new();
    let command_matcher = commands::matcher::CommandMatcher::new(registry);
    let audio_buffer = Arc::new(Mutex::new(Vec::<f32>::new()));
    let recording_active = Arc::new(AtomicBool::new(false));
    let hot_mic_active = Arc::new(AtomicBool::new(false));
    let whisper = Arc::new(Mutex::new(None::<WhisperTranscriber>));
    let model_status = Arc::new(Mutex::new("not_downloaded".to_string()));
    let transcript_store = Arc::new(
        ipc::transcript_store::TranscriptStore::new()
            .expect("failed to initialize transcript store"),
    );

    if let Ok(models_dir) = model::storage::models_dir() {
        if let Ok(entries) = std::fs::read_dir(models_dir) {
            let mut model_paths = entries
                .flatten()
                .map(|entry| entry.path())
                .filter(|path| {
                    path.file_name()
                        .and_then(|n| n.to_str())
                        .map(|name| name.starts_with("ggml-") && name.ends_with(".bin"))
                        .unwrap_or(false)
                })
                .collect::<Vec<_>>();
            model_paths.sort();
            if let Some(model_path) = model_paths.into_iter().next() {
                match WhisperTranscriber::new(&model_path) {
                    Ok(transcriber) => {
                        *whisper.lock() = Some(transcriber);
                        *model_status.lock() = "ready".to_string();
                    }
                    Err(err) => {
                        log::warn!("failed to load whisper model at startup: {err}");
                    }
                }
            }
        }
    }

    let app_state = ipc::commands::AppState {
        settings: settings_store,
        audio: audio_service,
        priority_mic,
        asr: asr_service,
        command_matcher: command_matcher.clone(),
        model_downloads: Arc::new(model::download::ModelDownloadManager::new()),
        model_status: model_status.clone(),
        transcript_store,
        connected_editors: Arc::new(Mutex::new(HashSet::new())),
        commands_directory: Arc::new(Mutex::new(None)),
        hot_mic_status: Arc::new(Mutex::new("off".to_string())),
        onboarding_complete: Arc::new(Mutex::new(false)),
        word_corrections: Arc::new(Mutex::new(Vec::new())),
        audio_buffer: audio_buffer.clone(),
        recording_active: recording_active.clone(),
        hot_mic_active: hot_mic_active.clone(),
        whisper: whisper.clone(),
    };

    let hot_mic_status = app_state.hot_mic_status.clone();

    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            ipc::commands::start_recording,
            ipc::commands::stop_recording,
            ipc::commands::toggle_hot_mic,
            ipc::commands::get_hot_mic_status,
            ipc::commands::set_hot_mic_enabled,
            ipc::commands::get_audio_devices,
            ipc::commands::set_priority_mic,
            ipc::commands::get_settings,
            ipc::commands::update_settings,
            ipc::commands::reset_settings,
            ipc::commands::get_permissions_status,
            ipc::commands::request_permission,
            ipc::commands::open_system_settings,
            ipc::commands::start_model_download,
            ipc::commands::get_model_status,
            ipc::commands::get_available_models,
            ipc::commands::delete_model,
            ipc::commands::get_transcription_history,
            ipc::commands::clear_transcription_history,
            ipc::commands::delete_transcript_entry,
            ipc::commands::save_transcript_entry,
            ipc::commands::execute_command,
            ipc::commands::get_portable_commands,
            ipc::commands::set_commands_directory,
            ipc::commands::get_word_corrections,
            ipc::commands::add_word_correction,
            ipc::commands::remove_word_correction,
            ipc::commands::connect_editor,
            ipc::commands::disconnect_editor,
            ipc::commands::get_editor_status,
            ipc::commands::copy_to_clipboard,
            ipc::commands::paste_from_clipboard,
            ipc::commands::take_screenshot,
            ipc::commands::get_app_version,
            ipc::commands::check_for_updates,
            ipc::commands::complete_onboarding,
            ipc::commands::is_onboarding_complete
        ])
        .setup(move |app| {
            let app_handle = app.app_handle().clone();
            let recording_active_for_thread = recording_active.clone();
            let hot_mic_active_for_thread = hot_mic_active.clone();
            let audio_buffer_for_thread = audio_buffer.clone();
            let whisper_for_thread = whisper.clone();
            let command_matcher_for_thread = command_matcher.clone();
            let hot_mic_status_for_thread = hot_mic_status.clone();

            std::thread::spawn(move || {
                let mut hot_mic_buffer = Vec::<f32>::new();
                let hot_mic_chunk_samples = 16_000 * 3;

                while let Ok(chunk) = audio_rx.recv() {
                    if recording_active_for_thread.load(Ordering::SeqCst) {
                        audio_buffer_for_thread.lock().extend_from_slice(&chunk);
                    }

                    if hot_mic_active_for_thread.load(Ordering::SeqCst) {
                        hot_mic_buffer.extend_from_slice(&chunk);
                        if hot_mic_buffer.len() >= hot_mic_chunk_samples {
                            let samples = std::mem::take(&mut hot_mic_buffer);
                            let _ = app_handle
                                .emit("hot_mic_status", json!({"status": "processing"}));
                            *hot_mic_status_for_thread.lock() = "processing".to_string();

                            let whisper_instance = whisper_for_thread.lock().clone();
                            if let Some(whisper) = whisper_instance {
                                match whisper.transcribe(&samples) {
                                    Ok(text) => {
                                        let cleaned = text.trim().to_string();
                                        if !cleaned.is_empty() {
                                            if let Some((action, _remaining)) =
                                                command_matcher_for_thread.match_command(&cleaned)
                                            {
                                                if let Err(err) =
                                                    ipc::commands::dispatch_action(action.clone())
                                                {
                                                    log::warn!(
                                                        "hot mic action dispatch failed: {err}"
                                                    );
                                                }
                                                let timestamp = unix_timestamp_ms();
                                                let _ = app_handle.emit(
                                                    "command_detected",
                                                    json!({
                                                        "command_name": ipc::commands::command_action_name(&action),
                                                        "command_text": cleaned,
                                                        "timestamp": timestamp
                                                    }),
                                                );
                                            } else {
                                                let timestamp = unix_timestamp_ms();
                                                let _ = app_handle.emit(
                                                    "transcription_update",
                                                    json!({
                                                        "text": cleaned,
                                                        "is_final": true,
                                                        "timestamp": timestamp
                                                    }),
                                                );
                                            }
                                        }
                                    }
                                    Err(err) => {
                                        log::warn!("hot mic transcription failed: {err}");
                                    }
                                }
                            }

                            if hot_mic_active_for_thread.load(Ordering::SeqCst) {
                                *hot_mic_status_for_thread.lock() = "listening".to_string();
                                let _ = app_handle
                                    .emit("hot_mic_status", json!({"status": "listening"}));
                            }
                        }
                    } else if !hot_mic_buffer.is_empty() {
                        hot_mic_buffer.clear();
                    }
                }
            });

            // Register global shortcuts
            let record_shortcut = Shortcut::new(Some(Modifiers::META), Code::Backslash);
            let show_shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);

            let rec_active = recording_active.clone();
            let rec_buffer = audio_buffer.clone();
            let rec_whisper = whisper.clone();
            let app_handle_shortcut = app.app_handle().clone();
            let shortcut_audio = {
                let st = app.state::<ipc::commands::AppState>();
                st.audio.clone()
            };
            let shortcut_priority_mic = {
                let st = app.state::<ipc::commands::AppState>();
                st.priority_mic.clone()
            };
            let app_handle_for_rec = app.app_handle().clone();
            if let Err(err) = app_handle_shortcut.global_shortcut().on_shortcut(record_shortcut, move |_app, _shortcut, event| {
                if event.state != ShortcutState::Pressed {
                    return;
                }
                let is_recording = rec_active.load(Ordering::SeqCst);
                if is_recording {
                    // Stop recording
                    rec_active.store(false, Ordering::SeqCst);
                    shortcut_audio.stop();
                    let _ = app_handle_for_rec.emit("recording_status", json!({"status": "processing"}));

                    let samples = std::mem::take(&mut *rec_buffer.lock());
                    if !samples.is_empty() {
                        let whisper_instance = rec_whisper.lock().clone();
                        if let Some(w) = whisper_instance {
                            match w.transcribe(&samples) {
                                Ok(text) => {
                                    let timestamp = unix_timestamp_ms();
                                    let _ = app_handle_for_rec.emit(
                                        "transcription_update",
                                        json!({ "text": text, "is_final": true, "timestamp": timestamp }),
                                    );
                                }
                                Err(err) => {
                                    log::warn!("shortcut transcription failed: {err}");
                                }
                            }
                        }
                    }
                    let _ = app_handle_for_rec.emit("recording_status", json!({"status": "idle"}));
                } else {
                    // Start recording
                    rec_buffer.lock().clear();
                    rec_active.store(true, Ordering::SeqCst);
                    if let Err(err) = shortcut_priority_mic.start_with_priority() {
                        log::warn!("shortcut start mic failed: {err}");
                        return;
                    }
                    let _ = app_handle_for_rec.emit("recording_status", json!({"status": "recording"}));
                }
            }) {
                log::warn!("failed to register Cmd+\\ shortcut: {err}");
            }

            let app_handle_for_show = app.app_handle().clone();
            let app_handle_shortcut2 = app.app_handle().clone();
            if let Err(err) = app_handle_shortcut2.global_shortcut().on_shortcut(show_shortcut, move |_app, _shortcut, event| {
                if event.state != ShortcutState::Pressed {
                    return;
                }
                if let Some(window) = app_handle_for_show.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }) {
                log::warn!("failed to register Alt+Space shortcut: {err}");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn unix_timestamp_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
