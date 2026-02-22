import { invoke } from '@tauri-apps/api/core';
import type {
  AppSettings,
  PermissionStatus,
  PermissionType,
  TranscriptEntry,
  HotMicStatus,
  ModelStatus,
  AudioDevice,
  PortableCommand,
  VoiceModel,
  WordCorrection,
} from './index';

// Recording Commands
export async function startRecording(): Promise<void> {
  await invoke('start_recording');
}

export async function stopRecording(): Promise<string> {
  return await invoke<string>('stop_recording');
}

// Hot Mic Commands
export async function toggleHotMic(): Promise<void> {
  await invoke('toggle_hot_mic');
}

export async function getHotMicStatus(): Promise<HotMicStatus> {
  return await invoke<HotMicStatus>('get_hot_mic_status');
}

export async function setHotMicEnabled(enabled: boolean): Promise<void> {
  await invoke('set_hot_mic_enabled', { enabled });
}

// Audio Device Commands
export async function getAudioDevices(): Promise<AudioDevice[]> {
  return await invoke<AudioDevice[]>('get_audio_devices');
}

export async function setPriorityMic(name: string | null): Promise<void> {
  await invoke('set_priority_mic', { name });
}

// Settings Commands
export async function getSettings(): Promise<AppSettings> {
  return await invoke<AppSettings>('get_settings');
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  await invoke('update_settings', { settings });
}

export async function resetSettings(): Promise<AppSettings> {
  return await invoke<AppSettings>('reset_settings');
}

// Permission Commands
export async function getPermissionsStatus(): Promise<PermissionStatus> {
  return await invoke<PermissionStatus>('get_permissions_status');
}

export async function requestPermission(type: PermissionType): Promise<boolean> {
  return await invoke<boolean>('request_permission', { type });
}

export async function openSystemSettings(section: string): Promise<void> {
  await invoke('open_system_settings', { section });
}

// Model Commands
export async function startModelDownload(modelId: string): Promise<void> {
  await invoke('start_model_download', { modelId });
}

export async function getModelStatus(): Promise<ModelStatus> {
  return await invoke<ModelStatus>('get_model_status');
}

export async function getAvailableModels(): Promise<VoiceModel[]> {
  return await invoke<VoiceModel[]>('get_available_models');
}

export async function deleteModel(modelId: string): Promise<void> {
  await invoke('delete_model', { modelId });
}

// Transcript Commands
export async function getTranscriptionHistory(): Promise<TranscriptEntry[]> {
  return await invoke<TranscriptEntry[]>('get_transcription_history');
}

export async function clearTranscriptionHistory(): Promise<void> {
  await invoke('clear_transcription_history');
}

export async function deleteTranscriptEntry(id: string): Promise<void> {
  await invoke('delete_transcript_entry', { id });
}

export async function saveTranscriptEntry(
  id: string,
  text: string,
  timestamp: number,
  entryType: string,
  commandName?: string
): Promise<void> {
  await invoke('save_transcript_entry', {
    id,
    text,
    timestamp,
    entryType,
    commandName: commandName ?? null,
  });
}

// Command Execution
export async function executeCommand(action: string): Promise<void> {
  await invoke('execute_command', { action });
}

export async function getPortableCommands(): Promise<PortableCommand[]> {
  return await invoke<PortableCommand[]>('get_portable_commands');
}

export async function setCommandsDirectory(path: string): Promise<void> {
  await invoke('set_commands_directory', { path });
}

// Word Corrections
export async function getWordCorrections(): Promise<WordCorrection[]> {
  return await invoke<WordCorrection[]>('get_word_corrections');
}

export async function addWordCorrection(heardAs: string, changeTo: string): Promise<void> {
  await invoke('add_word_correction', { heardAs, changeTo });
}

export async function removeWordCorrection(id: string): Promise<void> {
  await invoke('remove_word_correction', { id });
}

// Integration Commands
export async function connectEditor(editor: 'claude_code' | 'cursor' | 'codex' | 'opencode'): Promise<boolean> {
  return await invoke<boolean>('connect_editor', { editor });
}

export async function disconnectEditor(editor: 'claude_code' | 'cursor' | 'codex' | 'opencode'): Promise<void> {
  await invoke('disconnect_editor', { editor });
}

export async function getEditorStatus(editor: 'claude_code' | 'cursor' | 'codex' | 'opencode'): Promise<boolean> {
  return await invoke<boolean>('get_editor_status', { editor });
}

// Utility Commands
export async function copyToClipboard(text: string): Promise<void> {
  await invoke('copy_to_clipboard', { text });
}

export async function pasteFromClipboard(): Promise<void> {
  await invoke('paste_from_clipboard');
}

export async function takeScreenshot(type: 'region' | 'fullscreen' | 'window'): Promise<string> {
  return await invoke<string>('take_screenshot', { type });
}

export async function getAppVersion(): Promise<string> {
  return await invoke<string>('get_app_version');
}

export async function checkForUpdates(): Promise<{ available: boolean; version?: string }> {
  return await invoke<{ available: boolean; version?: string }>('check_for_updates');
}

// Onboarding Commands
export async function completeOnboarding(): Promise<void> {
  await invoke('complete_onboarding');
}

export async function isOnboardingComplete(): Promise<boolean> {
  return await invoke<boolean>('is_onboarding_complete');
}
