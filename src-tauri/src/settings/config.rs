use std::{
    fs,
    path::PathBuf,
    time::{Duration, SystemTime},
};

use anyhow::Result;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::settings::shortcuts::ShortcutSettings;

const APP_SUPPORT_SUBDIR: &str = "Library/Application Support/dev.alfred.app";
const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Error)]
pub enum SettingsError {
    #[error("home directory not found")]
    HomeDirNotFound,
    #[error("failed to read settings: {0}")]
    Read(String),
    #[error("failed to write settings: {0}")]
    Write(String),
    #[error("failed to parse settings: {0}")]
    Parse(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppearanceSettings {
    pub dark_mode: bool,
    pub accent_color: String,
}

impl Default for AppearanceSettings {
    fn default() -> Self {
        Self {
            dark_mode: true,
            accent_color: "#4A90E2".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioSettings {
    pub priority_mic_name: Option<String>,
    pub engine: String,
    pub model_path: Option<String>,
}

impl Default for AudioSettings {
    fn default() -> Self {
        Self {
            priority_mic_name: None,
            engine: "whisper".to_string(),
            model_path: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotMicSettings {
    pub enabled: bool,
    pub command_phrases: Vec<String>,
    pub voice_filter_enabled: bool,
    pub voice_filter_strictness: f32,
}

impl Default for HotMicSettings {
    fn default() -> Self {
        Self {
            enabled: false,
            command_phrases: vec!["go ahead".to_string(), "stop".to_string()],
            voice_filter_enabled: false,
            voice_filter_strictness: 0.5,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct IntegrationSettings {
    pub claude_code: bool,
    pub cursor: bool,
    pub codex: bool,
    pub opencode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataRetentionSettings {
    #[serde(default, with = "duration_option_seconds")]
    pub auto_delete_after: Option<Duration>,
}

impl Default for DataRetentionSettings {
    fn default() -> Self {
        Self {
            auto_delete_after: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AppSettings {
    pub appearance: AppearanceSettings,
    pub audio: AudioSettings,
    pub shortcuts: ShortcutSettings,
    pub hot_mic: HotMicSettings,
    pub integrations: IntegrationSettings,
    pub data_retention: DataRetentionSettings,
}

#[derive(Debug)]
pub struct SettingsStore {
    path: PathBuf,
    cache: Mutex<AppSettings>,
    last_loaded: Mutex<SystemTime>,
}

impl SettingsStore {
    pub fn new() -> Result<Self, SettingsError> {
        let path = settings_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| SettingsError::Write(e.to_string()))?;
        }

        let initial = if path.exists() {
            let raw = fs::read_to_string(&path).map_err(|e| SettingsError::Read(e.to_string()))?;
            serde_json::from_str::<AppSettings>(&raw)
                .map_err(|e| SettingsError::Parse(e.to_string()))?
        } else {
            let defaults = AppSettings::default();
            let raw = serde_json::to_string_pretty(&defaults)
                .map_err(|e| SettingsError::Write(e.to_string()))?;
            fs::write(&path, raw).map_err(|e| SettingsError::Write(e.to_string()))?;
            defaults
        };

        Ok(Self {
            path,
            cache: Mutex::new(initial),
            last_loaded: Mutex::new(SystemTime::now()),
        })
    }

    pub fn load(&self) -> Result<AppSettings> {
        if self.path.exists() {
            let raw = fs::read_to_string(&self.path)?;
            let parsed = serde_json::from_str::<AppSettings>(&raw)?;
            *self.cache.lock() = parsed.clone();
            *self.last_loaded.lock() = SystemTime::now();
            Ok(parsed)
        } else {
            let defaults = AppSettings::default();
            self.save(&defaults)?;
            Ok(defaults)
        }
    }

    pub fn save(&self, settings: &AppSettings) -> Result<()> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }
        let raw = serde_json::to_string_pretty(settings)?;
        fs::write(&self.path, raw)?;
        *self.cache.lock() = settings.clone();
        *self.last_loaded.lock() = SystemTime::now();
        Ok(())
    }

    pub fn update<F>(&self, update_fn: F) -> Result<AppSettings>
    where
        F: FnOnce(&mut AppSettings),
    {
        let mut current = self.load()?;
        update_fn(&mut current);
        self.save(&current)?;
        Ok(current)
    }

    pub fn cached(&self) -> AppSettings {
        self.cache.lock().clone()
    }
}

pub fn app_support_dir() -> Result<PathBuf, SettingsError> {
    let home = dirs::home_dir().ok_or(SettingsError::HomeDirNotFound)?;
    Ok(home.join(APP_SUPPORT_SUBDIR))
}

pub fn settings_path() -> Result<PathBuf, SettingsError> {
    Ok(app_support_dir()?.join(SETTINGS_FILE))
}

mod duration_option_seconds {
    use std::time::Duration;

    use serde::{Deserialize, Deserializer, Serialize, Serializer};

    pub fn serialize<S>(value: &Option<Duration>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        value.map(|d| d.as_secs()).serialize(serializer)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<Duration>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let secs = Option::<u64>::deserialize(deserializer)?;
        Ok(secs.map(Duration::from_secs))
    }
}
