use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AsrClientMessage {
    Transcribe { audio: Vec<f32>, sample_rate: u32 },
    LoadModel { path: String },
    Status,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AsrRequest {
    #[serde(rename = "type")]
    pub kind: String,
    pub audio: Vec<f32>,
    pub sample_rate: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AsrResponse {
    #[serde(rename = "type")]
    pub kind: String,
    pub text: String,
    pub is_final: bool,
    pub latency_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AsrControl {
    #[serde(rename = "type")]
    pub kind: String,
    pub path: Option<String>,
}

impl AsrRequest {
    pub fn transcribe(audio: Vec<f32>, sample_rate: u32) -> Self {
        Self {
            kind: "transcribe".to_string(),
            audio,
            sample_rate,
        }
    }
}

impl AsrControl {
    pub fn load_model(path: String) -> Self {
        Self {
            kind: "load_model".to_string(),
            path: Some(path),
        }
    }

    pub fn status() -> Self {
        Self {
            kind: "status".to_string(),
            path: None,
        }
    }
}
