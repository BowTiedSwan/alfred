// App Settings Types
export interface AppSettings {
  appearance: AppearanceSettings;
  audio: AudioSettings;
  shortcuts: ShortcutSettings;
  hot_mic: HotMicSettings;
  integrations: IntegrationSettings;
  data_retention: DataRetentionSettings;
  onboarding_complete: boolean;
}

export interface AppearanceSettings {
  dark_mode: boolean;
  accent_color: string;
}

export interface AudioSettings {
  priority_mic_name: string | null;
  engine: 'whisper' | 'qwen';
  model_path: string | null;
}

export interface ShortcutSettings {
  open_alfred: string;
  record_transcription: string;
  take_screenshot: string;
  take_fullscreen_screenshot: string;
  take_window_screenshot: string;
  terminal_image_paste: string;
  command_launcher: string;
  toggle_hot_mic: string | null;
}

export interface HotMicSettings {
  enabled: boolean;
  voice_filter_enabled: boolean;
  voice_filter_strictness: number;
  submit_phrases: string[];
  paste_phrases: string[];
  cancel_phrases: string[];
}

export interface IntegrationSettings {
  claude_code: boolean;
  cursor: boolean;
  codex: boolean;
  opencode: boolean;
}

export interface DataRetentionSettings {
  auto_delete_after: string | null;
}

// Permission Types
export interface PermissionStatus {
  microphone: boolean;
  accessibility: boolean;
  screen_recording: boolean;
  system_events: boolean;
}

export type PermissionType = 'microphone' | 'accessibility' | 'screen_recording' | 'system_events';

// Transcript Types
export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  type: 'transcription' | 'command';
  command_name?: string;
}

// Status Types
export type RecordingStatus = 'idle' | 'recording' | 'processing';

export type HotMicStatus = 'off' | 'listening' | 'processing';

export type ModelStatus = 'not_downloaded' | 'downloading' | 'ready' | 'error';

// Download Types
export interface DownloadProgress {
  percent: number;
  bytes_downloaded: number;
  total_bytes: number;
}

// Audio Device Types
export interface AudioDevice {
  name: string;
  is_default: boolean;
}

// Command Types
export interface PortableCommand {
  name: string;
  path: string;
  description?: string;
}

// Model Types
export interface VoiceModel {
  id: string;
  name: string;
  size_bytes: number;
  status: ModelStatus;
  language: string;
  recommended: boolean;
}

// Word Correction Types
export interface WordCorrection {
  id: string;
  heard_as: string;
  change_to: string;
}

// Navigation Types
export type SettingsRoute = 
  | 'appearance'
  | 'audio'
  | 'shortcuts'
  | 'hot-mic'
  | 'commands'
  | 'integrations';

export interface NavItem {
  id: SettingsRoute;
  label: string;
  icon?: string;
}

// Event Payload Types
export interface TranscriptionUpdatePayload {
  text: string;
  is_final: boolean;
  timestamp: number;
}

export interface CommandDetectedPayload {
  command_name: string;
  command_text: string;
  timestamp: number;
}

export interface RecordingStatusPayload {
  status: RecordingStatus;
}

export interface HotMicStatusPayload {
  status: HotMicStatus;
}

// Default Settings
export const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    dark_mode: false,
    accent_color: '#2D4739',
  },
  audio: {
    priority_mic_name: null,
    engine: 'whisper',
    model_path: null,
  },
  shortcuts: {
    open_alfred: 'Alt+Space',
    record_transcription: 'Command+Backslash',
    take_screenshot: 'Alt+4',
    take_fullscreen_screenshot: 'Alt+5',
    take_window_screenshot: 'Alt+6',
    terminal_image_paste: 'Command+Shift+V',
    command_launcher: 'Command+Shift+P',
    toggle_hot_mic: null,
  },
  hot_mic: {
    enabled: false,
    voice_filter_enabled: true,
    voice_filter_strictness: 50,
    submit_phrases: ['send it', 'submit', 'done'],
    paste_phrases: ['paste it', 'paste that'],
    cancel_phrases: ['cancel', 'never mind', 'scratch that'],
  },
  integrations: {
    claude_code: false,
    cursor: false,
    codex: false,
    opencode: false,
  },
  data_retention: {
    auto_delete_after: null,
  },
  onboarding_complete: false,
};