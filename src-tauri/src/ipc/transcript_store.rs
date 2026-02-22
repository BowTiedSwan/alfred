use std::fs;
use std::path::PathBuf;

use anyhow::{anyhow, Context, Result};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};

use crate::settings::config::app_support_dir;

const TRANSCRIPTS_FILE: &str = "transcripts.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptEntry {
    pub id: String,
    pub text: String,
    pub timestamp: u64,
    #[serde(rename = "type")]
    pub entry_type: String,
    pub command_name: Option<String>,
}

#[derive(Debug)]
pub struct TranscriptStore {
    path: PathBuf,
    cache: Mutex<Vec<TranscriptEntry>>,
}

impl TranscriptStore {
    pub fn new() -> Result<Self> {
        let path = app_support_dir()
            .map_err(|e| anyhow!(e.to_string()))?
            .join(TRANSCRIPTS_FILE);

        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).context("failed to create transcript directory")?;
        }

        let initial = if path.exists() {
            let raw = fs::read_to_string(&path).context("failed to read transcript history")?;
            if raw.trim().is_empty() {
                Vec::new()
            } else {
                serde_json::from_str::<Vec<TranscriptEntry>>(&raw)
                    .context("failed to parse transcript history")?
            }
        } else {
            Vec::new()
        };

        Ok(Self {
            path,
            cache: Mutex::new(initial),
        })
    }

    pub fn load(&self) -> Result<Vec<TranscriptEntry>> {
        let entries = if self.path.exists() {
            let raw =
                fs::read_to_string(&self.path).context("failed to read transcript history")?;
            if raw.trim().is_empty() {
                Vec::new()
            } else {
                serde_json::from_str::<Vec<TranscriptEntry>>(&raw)
                    .context("failed to parse transcript history")?
            }
        } else {
            Vec::new()
        };

        *self.cache.lock() = entries.clone();
        Ok(entries)
    }

    pub fn save(&self) -> Result<()> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent).context("failed to create transcript directory")?;
        }

        let raw = serde_json::to_string_pretty(&*self.cache.lock())
            .context("failed to serialize transcript history")?;
        fs::write(&self.path, raw).context("failed to write transcript history")?;
        Ok(())
    }

    pub fn add(&self, entry: TranscriptEntry) -> Result<()> {
        self.cache.lock().insert(0, entry);
        self.save()
    }

    pub fn delete(&self, id: &str) -> Result<()> {
        self.cache.lock().retain(|entry| entry.id != id);
        self.save()
    }

    pub fn clear(&self) -> Result<()> {
        self.cache.lock().clear();
        self.save()
    }

    pub fn list(&self) -> Vec<TranscriptEntry> {
        self.cache.lock().clone()
    }
}
