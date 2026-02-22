use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use cpal::traits::{DeviceTrait, HostTrait};
use parking_lot::Mutex;
use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_clipboard_manager::ClipboardExt;
use uuid::Uuid;

use crate::asr::sidecar::ASRService;
use crate::asr::whisper_native::WhisperTranscriber;
use crate::audio::capture::AudioCaptureService;
use crate::audio::priority_mic::PriorityMicService;
use crate::automation;
use crate::commands::matcher::CommandMatcher;
use crate::commands::registry::CommandAction;
use crate::integrations::editor::EditorIntegration;

use crate::ipc::events::{
    DownloadProgressPayload, DOWNLOAD_PROGRESS,
};
use crate::ipc::transcript_store::{self, TranscriptStore};
use crate::model::download::ModelDownloadManager;
use crate::model::storage;
use crate::permissions;
use crate::settings::config::{app_support_dir, AppSettings, SettingsStore};

#[derive(Debug)]
pub struct AppState {
    pub settings: Arc<SettingsStore>,
    pub audio: Arc<AudioCaptureService>,
    pub priority_mic: Arc<PriorityMicService>,
    pub asr: Arc<ASRService>,
    pub command_matcher: CommandMatcher,
    pub model_downloads: Arc<ModelDownloadManager>,
    pub model_status: Arc<Mutex<String>>,
    pub transcript_store: Arc<TranscriptStore>,
    pub connected_editors: Arc<Mutex<HashSet<String>>>,
    pub commands_directory: Arc<Mutex<Option<String>>>,
    pub hot_mic_status: Arc<Mutex<String>>,
    pub onboarding_complete: Arc<Mutex<bool>>,
    pub word_corrections: Arc<Mutex<Vec<WordCorrection>>>,
    pub audio_buffer: Arc<Mutex<Vec<f32>>>,
    pub recording_active: Arc<AtomicBool>,
    pub hot_mic_active: Arc<AtomicBool>,
    pub whisper: Arc<Mutex<Option<WhisperTranscriber>>>,
}

#[derive(Debug, Clone, Serialize)]
pub struct WordCorrection {
    pub id: String,
    pub heard_as: String,
    pub change_to: String,
}

#[tauri::command]
pub fn start_recording(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    state.audio_buffer.lock().clear();
    state.recording_active.store(true, Ordering::SeqCst);
    state
        .priority_mic
        .start_with_priority()
        .map_err(|e| e.to_string())?;
    let _ = app.emit("recording_status", json!({"status": "recording"}));
    Ok(())
}

#[tauri::command]
pub async fn stop_recording(app: AppHandle, state: State<'_, AppState>) -> Result<String, String> {
    state.recording_active.store(false, Ordering::SeqCst);
    state.audio.stop();

    let _ = app.emit("recording_status", json!({"status": "processing"}));

    let audio_samples = std::mem::take(&mut *state.audio_buffer.lock());
    if audio_samples.is_empty() {
        let _ = app.emit("recording_status", json!({"status": "idle"}));
        return Ok(String::new());
    }

    let whisper = state.whisper.lock().clone();
    let transcript = if let Some(whisper) = whisper {
        whisper.transcribe(&audio_samples).map_err(|e| e.to_string())?
    } else {
        let _ = app.emit("recording_status", json!({"status": "idle"}));
        return Err("No model loaded. Please download a model first.".to_string());
    };

    let timestamp = unix_timestamp_ms();
    let _ = app.emit(
        "transcription_update",
        json!({
            "text": transcript,
            "is_final": true,
            "timestamp": timestamp
        }),
    );


    // Auto-paste to connected editors
    if !transcript.is_empty() {
        let editors = state.connected_editors.lock().clone();
        for editor_id in &editors {
            let process_name = EditorIntegration::process_name_for_editor(editor_id);
            if let Err(err) = EditorIntegration::paste_to_editor(process_name, &transcript, &app) {
                log::warn!("failed to paste to editor {editor_id}: {err}");
            }
        }
    }

    let _ = app.emit("recording_status", json!({"status": "idle"}));

    Ok(transcript)
}

#[tauri::command]
pub fn toggle_hot_mic(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let currently_active = state.hot_mic_active.load(Ordering::SeqCst);

    if currently_active {
        state.hot_mic_active.store(false, Ordering::SeqCst);
        state.audio.stop();
        *state.hot_mic_status.lock() = "off".to_string();
        let _ = app.emit("hot_mic_status", json!({"status": "off"}));
    } else {
        if state.whisper.lock().is_none() {
            return Err("No model loaded. Please download a model first.".to_string());
        }
        state.hot_mic_active.store(true, Ordering::SeqCst);
        state
            .priority_mic
            .start_with_priority()
            .map_err(|e| e.to_string())?;
        *state.hot_mic_status.lock() = "listening".to_string();
        let _ = app.emit("hot_mic_status", json!({"status": "listening"}));
    }

    let new_enabled = !currently_active;
    state
        .settings
        .update(|s| s.hot_mic.enabled = new_enabled)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_hot_mic_status(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.hot_mic_status.lock().clone())
}

#[tauri::command]
pub fn set_hot_mic_enabled(state: State<'_, AppState>, enabled: bool) -> Result<(), String> {
    state
        .settings
        .update(|s| s.hot_mic.enabled = enabled)
        .map_err(|e| e.to_string())?;
    *state.hot_mic_status.lock() = if enabled {
        "listening".to_string()
    } else {
        "off".to_string()
    };
    Ok(())
}

#[tauri::command]
pub fn get_audio_devices() -> Result<Vec<Value>, String> {
    let devices = AudioCaptureService::list_input_devices().map_err(|e| e.to_string())?;
    let default_name = cpal::default_host()
        .default_input_device()
        .and_then(|d| d.name().ok());

    Ok(devices
        .into_iter()
        .map(|name| {
            json!({
                "name": name,
                "is_default": default_name.as_ref() == Some(&name)
            })
        })
        .collect())
}

#[tauri::command]
pub fn set_priority_mic(state: State<'_, AppState>, name: Option<String>) -> Result<(), String> {
    if let Some(device) = name {
        state
            .priority_mic
            .set_priority_device(device)
            .map_err(|e| e.to_string())
    } else {
        state
            .priority_mic
            .clear_priority_device()
            .map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    Ok(state.settings.cached())
}

#[tauri::command]
pub fn update_settings(state: State<'_, AppState>, settings: Value) -> Result<AppSettings, String> {
    let current = state.settings.cached();
    let mut current_value = serde_json::to_value(current).map_err(|e| e.to_string())?;
    merge_json_value(&mut current_value, settings);
    let merged: AppSettings = serde_json::from_value(current_value).map_err(|e| e.to_string())?;
    state.settings.save(&merged).map_err(|e| e.to_string())?;
    Ok(merged)
}

#[tauri::command]
pub fn reset_settings(state: State<'_, AppState>) -> Result<AppSettings, String> {
    let defaults = AppSettings::default();
    state.settings.save(&defaults).map_err(|e| e.to_string())?;
    Ok(defaults)
}

#[tauri::command]
pub fn get_permissions_status() -> Result<Value, String> {
    Ok(json!({
        "microphone": permissions::check_microphone().map_err(|e| e.to_string())?,
        "accessibility": permissions::check_accessibility().map_err(|e| e.to_string())?,
        "screen_recording": permissions::check_screen_recording().map_err(|e| e.to_string())?,
    }))
}

#[tauri::command]
pub fn request_permission(perm_type: String) -> Result<bool, String> {
    match perm_type.as_str() {
        "microphone" => permissions::open_microphone_settings().map_err(|e| e.to_string())?,
        "accessibility" => {
            permissions::open_accessibility_settings().map_err(|e| e.to_string())?
        }
        "screen_recording" => {
            permissions::open_screen_recording_settings().map_err(|e| e.to_string())?
        }
        _ => return Err(format!("unknown permission type: {perm_type}")),
    }
    Ok(true)
}

#[tauri::command]
pub fn open_system_settings(section: String) -> Result<(), String> {
    let status = std::process::Command::new("open")
        .arg(match section.as_str() {
            "microphone" => {
                "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"
            }
            "accessibility" => {
                "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
            }
            "screen_recording" => {
                "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
            }
            _ => "x-apple.systempreferences:",
        })
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(())
    } else {
        Err("failed to open System Settings".to_string())
    }
}

#[tauri::command]
pub async fn start_model_download(
    app: AppHandle,
    state: State<'_, AppState>,
    model_id: String,
) -> Result<(), String> {
    let models = available_models_map();
    let Some(url) = models.get(model_id.as_str()) else {
        return Err(format!("unknown model id: {model_id}"));
    };

    let filename = url
        .split('/')
        .next_back()
        .filter(|f| !f.is_empty())
        .unwrap_or("model.bin");
    let dest = storage::model_file_path(filename).map_err(|e| e.to_string())?;
    let dest_for_load = dest.clone();

    *state.model_status.lock() = "downloading".to_string();
    let manager = Arc::clone(&state.model_downloads);
    let model_status = Arc::clone(&state.model_status);

    let (tx, mut rx) = tokio::sync::watch::channel((0u64, 0u64));
    let app_for_events = app.clone();
    let model_for_events = model_id.clone();
    tokio::spawn(async move {
        while rx.changed().await.is_ok() {
            let (downloaded, total) = *rx.borrow();
            let percent = if total > 0 {
                (downloaded as f32 / total as f32 * 100.0).clamp(0.0, 100.0)
            } else {
                0.0
            };
            let payload = DownloadProgressPayload {
                model_id: model_for_events.clone(),
                percent,
                bytes_downloaded: downloaded,
                total_bytes: total,
            };
            let _ = app_for_events.emit(DOWNLOAD_PROGRESS, payload);
        }
    });

    let result = manager.download_model(url, dest, tx).await;
    match result {
        Ok(()) => {
            *model_status.lock() = "ready".to_string();
            if let Ok(transcriber) = WhisperTranscriber::new(&dest_for_load) {
                *state.whisper.lock() = Some(transcriber);
            }
            Ok(())
        }
        Err(err) => {
            *model_status.lock() = "error".to_string();
            Err(err.to_string())
        }
    }
}

#[tauri::command]
pub fn get_model_status(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.model_status.lock().clone())
}

#[tauri::command]
pub fn get_available_models() -> Result<Vec<Value>, String> {
    available_models_map()
        .into_iter()
        .map(|(id, url)| {
            let filename = url
                .split('/')
                .next_back()
                .filter(|f| !f.is_empty())
                .unwrap_or("model.bin")
                .to_string();
            let downloaded = storage::is_model_downloaded(&filename).map_err(|e| e.to_string())?;
            Ok(json!({
                "id": id,
                "url": url,
                "downloaded": downloaded
            }))
        })
        .collect()
}

#[tauri::command]
pub fn delete_model(model_id: String) -> Result<(), String> {
    let models = available_models_map();
    let Some(url) = models.get(model_id.as_str()) else {
        return Err(format!("unknown model id: {model_id}"));
    };
    let filename = url.split('/').next_back().unwrap_or("model.bin");
    let path = storage::model_file_path(filename).map_err(|e| e.to_string())?;
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_transcription_history(state: State<'_, AppState>) -> Result<Vec<Value>, String> {
    state
        .transcript_store
        .load()
        .map_err(|e| e.to_string())?
        .into_iter()
        .map(|entry| serde_json::to_value(entry).map_err(|e| e.to_string()))
        .collect()
}

#[tauri::command]
pub fn clear_transcription_history(state: State<'_, AppState>) -> Result<(), String> {
    state.transcript_store.clear().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_transcript_entry(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state.transcript_store.delete(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_transcript_entry(
    state: State<'_, AppState>,
    id: String,
    text: String,
    timestamp: u64,
    entry_type: String,
    command_name: Option<String>,
) -> Result<(), String> {
    let entry = transcript_store::TranscriptEntry {
        id,
        text,
        timestamp,
        entry_type,
        command_name,
    };
    state.transcript_store.add(entry).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn execute_command(action: String) -> Result<(), String> {
    let normalized = action.trim().to_lowercase();
    let parsed = parse_action(&normalized)
        .or_else(|| {
            let matcher = CommandMatcher::new(crate::commands::registry::CommandRegistry::new());
            matcher.match_command(&normalized).map(|(a, _)| a)
        })
        .ok_or_else(|| format!("unknown action: {action}"))?;

    dispatch_action(parsed).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_portable_commands() -> Result<Vec<Value>, String> {
    Ok(Vec::new())
}

#[tauri::command]
pub fn set_commands_directory(state: State<'_, AppState>, path: String) -> Result<(), String> {
    *state.commands_directory.lock() = Some(path.clone());
    let support = app_support_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&support).map_err(|e| e.to_string())?;
    let file = support.join("commands_directory.txt");
    std::fs::write(file, path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_word_corrections(state: State<'_, AppState>) -> Result<Vec<Value>, String> {
    Ok(state
        .word_corrections
        .lock()
        .iter()
        .map(|c| {
            json!({
                "id": c.id,
                "heard_as": c.heard_as,
                "change_to": c.change_to
            })
        })
        .collect())
}

#[tauri::command]
pub fn add_word_correction(
    state: State<'_, AppState>,
    heard_as: String,
    change_to: String,
) -> Result<(), String> {
    state.word_corrections.lock().push(WordCorrection {
        id: Uuid::new_v4().to_string(),
        heard_as,
        change_to,
    });
    Ok(())
}

#[tauri::command]
pub fn remove_word_correction(state: State<'_, AppState>, id: String) -> Result<(), String> {
    state.word_corrections.lock().retain(|c| c.id != id);
    Ok(())
}

#[tauri::command]
pub fn connect_editor(state: State<'_, AppState>, editor: String) -> Result<bool, String> {
    state.connected_editors.lock().insert(editor);
    Ok(true)
}

#[tauri::command]
pub fn disconnect_editor(state: State<'_, AppState>, editor: String) -> Result<(), String> {
    state.connected_editors.lock().remove(&editor);
    Ok(())
}

#[tauri::command]
pub fn get_editor_status(state: State<'_, AppState>, editor: String) -> Result<bool, String> {
    Ok(state.connected_editors.lock().contains(&editor))
}

#[tauri::command]
pub fn copy_to_clipboard(app: AppHandle, text: String) -> Result<(), String> {
    app.clipboard().write_text(text).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn paste_from_clipboard(_app: AppHandle) -> Result<(), String> {
    automation::run_osascript(
        "tell application \"System Events\" to keystroke \"v\" using {command down}",
    )
    .map(|_| ())
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn take_screenshot(_screenshot_type: String) -> Result<String, String> {
    Ok(String::new())
}

#[tauri::command]
pub fn get_app_version() -> Result<String, String> {
    Ok("0.1.0".to_string())
}

#[tauri::command]
pub fn check_for_updates() -> Result<Value, String> {
    Ok(json!({ "available": false }))
}

#[tauri::command]
pub fn complete_onboarding(state: State<'_, AppState>) -> Result<(), String> {
    *state.onboarding_complete.lock() = true;
    // Persist to disk so it survives restarts
    let support = app_support_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&support).map_err(|e| e.to_string())?;
    std::fs::write(support.join("onboarding_complete"), "1").map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn is_onboarding_complete(state: State<'_, AppState>) -> Result<bool, String> {
    // Check in-memory first, fallback to disk
    if *state.onboarding_complete.lock() {
        return Ok(true);
    }
    let support = app_support_dir().map_err(|e| e.to_string())?;
    let flag = support.join("onboarding_complete");
    if flag.exists() {
        *state.onboarding_complete.lock() = true;
        Ok(true)
    } else {
        Ok(false)
    }
}

struct ModelEntry {
    id: &'static str,
    engine: &'static str,
    url: &'static str,
    label: &'static str,
    size: &'static str,
}

fn available_models_list() -> Vec<ModelEntry> {
    vec![
        ModelEntry {
            id: "whisper-tiny",
            engine: "whisper",
            url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin",
            label: "Tiny",
            size: "~39MB",
        },
        ModelEntry {
            id: "whisper-base",
            engine: "whisper",
            url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin",
            label: "Base",
            size: "~142MB",
        },
        ModelEntry {
            id: "whisper-small",
            engine: "whisper",
            url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin",
            label: "Small",
            size: "~466MB",
        },
        ModelEntry {
            id: "qwen2-audio-0.6b",
            engine: "qwen",
            url: "",
            label: "Qwen2-Audio 0.6B",
            size: "~1.2GB",
        },
    ]
}
fn available_models_map() -> HashMap<&'static str, &'static str> {
    available_models_list()
        .into_iter()
        .filter(|m| !m.url.is_empty())
        .map(|m| (m.id, m.url))
        .collect()
}

fn parse_action(action: &str) -> Option<CommandAction> {
    match action {
        "play_pause" => Some(CommandAction::PlayPause),
        "next_track" => Some(CommandAction::NextTrack),
        "prev_track" => Some(CommandAction::PrevTrack),
        "volume_up" => Some(CommandAction::VolumeUp),
        "volume_down" => Some(CommandAction::VolumeDown),
        "mute" => Some(CommandAction::Mute),
        "unmute" => Some(CommandAction::Unmute),
        "sleep" => Some(CommandAction::Sleep),
        "lock_screen" => Some(CommandAction::LockScreen),
        "grid" => Some(CommandAction::Grid),
        "show_all" => Some(CommandAction::ShowAll),
        "focus_mode" => Some(CommandAction::FocusMode),
        "horizontal" => Some(CommandAction::Horizontal),
        "vertical" => Some(CommandAction::Vertical),
        "cascade" => Some(CommandAction::Cascade),
        "snap_left" => Some(CommandAction::SnapLeft),
        "snap_right" => Some(CommandAction::SnapRight),
        "top_left" => Some(CommandAction::TopLeft),
        "top_right" => Some(CommandAction::TopRight),
        "bottom_left" => Some(CommandAction::BottomLeft),
        "bottom_right" => Some(CommandAction::BottomRight),
        "maximize" => Some(CommandAction::Maximize),
        "exit_fullscreen" => Some(CommandAction::ExitFullscreen),
        "center" => Some(CommandAction::Center),
        "restore" => Some(CommandAction::Restore),
        _ if action.starts_with("open_app:") => {
            Some(CommandAction::OpenApp(action["open_app:".len()..].trim().to_string()))
        }
        _ if action.starts_with("hide_app:") => Some(CommandAction::HideNamedApp(
            action["hide_app:".len()..].trim().to_string(),
        )),
        _ if action.starts_with("quit_app:") => Some(CommandAction::QuitNamedApp(
            action["quit_app:".len()..].trim().to_string(),
        )),
        _ => None,
    }
}

pub(crate) fn dispatch_action(action: CommandAction) -> anyhow::Result<()> {
    match action {
        CommandAction::PlayPause => automation::media::play_pause(),
        CommandAction::NextTrack => automation::media::next_track(),
        CommandAction::PrevTrack => automation::media::prev_track(),
        CommandAction::VolumeUp => automation::media::volume_up(),
        CommandAction::VolumeDown => automation::media::volume_down(),
        CommandAction::Mute => automation::media::mute(),
        CommandAction::Unmute => automation::media::unmute(),
        CommandAction::Sleep => automation::system::sleep(),
        CommandAction::LockScreen => automation::system::lock_screen(),
        CommandAction::Grid => automation::window_mgmt::grid(),
        CommandAction::ShowAll => automation::window_mgmt::show_all(),
        CommandAction::FocusMode => automation::window_mgmt::focus_mode(),
        CommandAction::Horizontal => automation::window_mgmt::horizontal(),
        CommandAction::Vertical => automation::window_mgmt::vertical(),
        CommandAction::Cascade => automation::window_mgmt::cascade(),
        CommandAction::SnapLeft => automation::window_mgmt::snap_left(),
        CommandAction::SnapRight => automation::window_mgmt::snap_right(),
        CommandAction::TopLeft => automation::window_mgmt::top_left(),
        CommandAction::TopRight => automation::window_mgmt::top_right(),
        CommandAction::BottomLeft => automation::window_mgmt::bottom_left(),
        CommandAction::BottomRight => automation::window_mgmt::bottom_right(),
        CommandAction::Maximize => automation::window_mgmt::maximize(),
        CommandAction::ExitFullscreen => automation::window_mgmt::exit_fullscreen(),
        CommandAction::Center => automation::window_mgmt::center(),
        CommandAction::Restore => automation::window_mgmt::restore(),
        CommandAction::OpenApp(app) => automation::app_control::open_app(&app),
        CommandAction::HideNamedApp(app) => automation::app_control::hide_app(&app),
        CommandAction::QuitNamedApp(app) => automation::app_control::quit_app(&app),
        CommandAction::HideApp => {
            automation::run_osascript(
                "tell application \"System Events\" to keystroke \"h\" using {command down}",
            )?;
            Ok(())
        }
        CommandAction::QuitApp => {
            automation::run_osascript(
                "tell application \"System Events\" to keystroke \"q\" using {command down}",
            )?;
            Ok(())
        }
        CommandAction::Minimize => automation::app_control::minimize_frontmost(),
        CommandAction::CloseWindow => automation::app_control::close_frontmost_window(),
        CommandAction::NextWindow => {
            automation::run_osascript(
                "tell application \"System Events\" to keystroke \"`\" using {command down}",
            )?;
            Ok(())
        }
        CommandAction::PrevWindow => {
            automation::run_osascript(
                "tell application \"System Events\" to keystroke \"`\" using {command down, shift down}",
            )?;
            Ok(())
        }
        CommandAction::NewWindow => {
            automation::run_osascript(
                "tell application \"System Events\" to keystroke \"n\" using {command down}",
            )?;
            Ok(())
        }
        CommandAction::Submit => {
            automation::run_osascript("tell application \"System Events\" to key code 36")?;
            Ok(())
        }
        CommandAction::Paste => {
            automation::run_osascript(
                "tell application \"System Events\" to keystroke \"v\" using {command down}",
            )?;
            Ok(())
        }
        CommandAction::Cancel => {
            automation::run_osascript("tell application \"System Events\" to key code 53")?;
            Ok(())
        }
        CommandAction::Type(text) => {
            automation::run_osascript(&format!(
                "tell application \"System Events\" to keystroke \"{}\"",
                text.replace('"', "\\\"")
            ))?;
            Ok(())
        }
        CommandAction::StartClaude => automation::app_control::open_app("Claude"),
        CommandAction::StartCodex => automation::app_control::open_app("Codex"),
        CommandAction::StartOpenCode => automation::app_control::open_app("OpenCode"),
        CommandAction::RestartServer => {
            automation::run_osascript(
                "tell application \"System Events\" to keystroke \"r\" using {command down}",
            )?;
            Ok(())
        }
        CommandAction::UseCommand(_) | CommandAction::UseCommands(_) => Ok(()),
    }
}

pub(crate) fn command_action_name(action: &CommandAction) -> String {
    match action {
        CommandAction::PlayPause => "play_pause",
        CommandAction::NextTrack => "next_track",
        CommandAction::PrevTrack => "prev_track",
        CommandAction::VolumeUp => "volume_up",
        CommandAction::VolumeDown => "volume_down",
        CommandAction::Mute => "mute",
        CommandAction::Unmute => "unmute",
        CommandAction::Sleep => "sleep",
        CommandAction::LockScreen => "lock_screen",
        CommandAction::Grid => "grid",
        CommandAction::ShowAll => "show_all",
        CommandAction::FocusMode => "focus_mode",
        CommandAction::Horizontal => "horizontal",
        CommandAction::Vertical => "vertical",
        CommandAction::Cascade => "cascade",
        CommandAction::SnapLeft => "snap_left",
        CommandAction::SnapRight => "snap_right",
        CommandAction::TopLeft => "top_left",
        CommandAction::TopRight => "top_right",
        CommandAction::BottomLeft => "bottom_left",
        CommandAction::BottomRight => "bottom_right",
        CommandAction::Maximize => "maximize",
        CommandAction::ExitFullscreen => "exit_fullscreen",
        CommandAction::Center => "center",
        CommandAction::Restore => "restore",
        CommandAction::OpenApp(_) => "open_app",
        CommandAction::HideNamedApp(_) => "hide_named_app",
        CommandAction::QuitNamedApp(_) => "quit_named_app",
        CommandAction::HideApp => "hide_app",
        CommandAction::QuitApp => "quit_app",
        CommandAction::Minimize => "minimize",
        CommandAction::CloseWindow => "close_window",
        CommandAction::NextWindow => "next_window",
        CommandAction::PrevWindow => "prev_window",
        CommandAction::NewWindow => "new_window",
        CommandAction::Submit => "submit",
        CommandAction::Paste => "paste",
        CommandAction::Cancel => "cancel",
        CommandAction::Type(_) => "type",
        CommandAction::StartClaude => "start_claude",
        CommandAction::StartCodex => "start_codex",
        CommandAction::StartOpenCode => "start_opencode",
        CommandAction::RestartServer => "restart_server",
        CommandAction::UseCommand(_) => "use_command",
        CommandAction::UseCommands(_) => "use_commands",
    }
    .to_string()
}

fn unix_timestamp_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn merge_json_value(base: &mut Value, patch: Value) {
    match (base, patch) {
        (Value::Object(base_map), Value::Object(patch_map)) => {
            for (k, v) in patch_map {
                merge_json_value(base_map.entry(k).or_insert(Value::Null), v);
            }
        }
        (base_slot, patch_val) => {
            *base_slot = patch_val;
        }
    }
}
