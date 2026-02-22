use serde::{Deserialize, Serialize};

pub const TRANSCRIPTION_UPDATE: &str = "transcription_update";
pub const COMMAND_DETECTED: &str = "command_detected";
pub const RECORDING_STATUS: &str = "recording_status";
pub const HOT_MIC_STATUS: &str = "hot_mic_status";
pub const DOWNLOAD_PROGRESS: &str = "download_progress";
pub const PERMISSION_CHANGED: &str = "permission_changed";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionUpdatePayload {
    pub text: String,
    pub is_final: bool,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandDetectedPayload {
    pub command_name: String,
    pub command_text: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingStatusPayload {
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotMicStatusPayload {
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgressPayload {
    pub model_id: String,
    pub percent: f32,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PermissionChangedPayload {
    pub permission: String,
    pub granted: bool,
}
