use std::sync::Arc;

use anyhow::{anyhow, Result};
use parking_lot::Mutex;

use crate::{audio::capture::AudioCaptureService, settings::config::SettingsStore};

#[derive(Debug)]
pub struct PriorityMicService {
    settings: Arc<SettingsStore>,
    capture: Arc<AudioCaptureService>,
    priority_device: Mutex<Option<String>>,
}

impl PriorityMicService {
    pub fn new(settings: Arc<SettingsStore>, capture: Arc<AudioCaptureService>) -> Arc<Self> {
        let preferred = settings.cached().audio.priority_mic_name;
        Arc::new(Self {
            settings,
            capture,
            priority_device: Mutex::new(preferred),
        })
    }

    pub fn load_from_settings(&self) {
        *self.priority_device.lock() = self.settings.cached().audio.priority_mic_name;
    }

    pub fn set_priority_device(&self, device_name: String) -> Result<()> {
        let available = AudioCaptureService::list_input_devices()?;
        if !available.iter().any(|d| d == &device_name) {
            return Err(anyhow!("input device '{device_name}' is not available"));
        }

        self.settings.update(|s| {
            s.audio.priority_mic_name = Some(device_name.clone());
        })?;
        *self.priority_device.lock() = Some(device_name);
        Ok(())
    }

    pub fn clear_priority_device(&self) -> Result<()> {
        self.settings.update(|s| {
            s.audio.priority_mic_name = None;
        })?;
        *self.priority_device.lock() = None;
        Ok(())
    }

    pub fn preferred_device(&self) -> Option<String> {
        self.priority_device.lock().clone()
    }

    pub fn start_with_priority(&self) -> Result<()> {
        let preferred = self.priority_device.lock().clone();
        match self.capture.start(preferred.clone()) {
            Ok(()) => Ok(()),
            Err(e) => {
                if preferred.is_some() {
                    log::warn!("preferred mic unavailable, falling back to default input: {e}");
                    self.capture.start(None)
                } else {
                    Err(e)
                }
            }
        }
    }

    pub fn handle_device_change(&self) -> Result<()> {
        let preferred = self.priority_device.lock().clone();
        if preferred.is_none() {
            return Ok(());
        }

        let available = AudioCaptureService::list_input_devices()?;
        if let Some(name) = preferred {
            let should_switch = available.iter().any(|d| d == &name)
                && self.capture.current_device().as_deref() != Some(name.as_str());
            if should_switch {
                self.capture.stop();
                self.capture.start(Some(name))?;
            }
        }
        Ok(())
    }
}
