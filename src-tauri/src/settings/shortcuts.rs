use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShortcutSettings {
    pub open_alfred: String,
    pub record_transcription: String,
    pub take_screenshot: String,
    pub command_launcher: String,
    pub toggle_hot_mic: Option<String>,
}

impl Default for ShortcutSettings {
    fn default() -> Self {
        Self {
            open_alfred: "Alt+Space".to_string(),
            record_transcription: "Cmd+\\".to_string(),
            take_screenshot: "Alt+4".to_string(),
            command_launcher: "Cmd+Shift+K".to_string(),
            toggle_hot_mic: None,
        }
    }
}
