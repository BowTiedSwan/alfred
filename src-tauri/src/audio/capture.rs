use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

use anyhow::{anyhow, Context, Result};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use crossbeam_channel::Sender;
use parking_lot::Mutex;
use thiserror::Error;

const TARGET_SAMPLE_RATE: u32 = 16_000;

#[derive(Debug, Error)]
pub enum AudioError {
    #[error("input device not found")]
    InputDeviceNotFound,
    #[error("no default input config available")]
    NoDefaultInputConfig,
}

struct StreamHolder(Option<cpal::Stream>);

// SAFETY: cpal::Stream is !Send+!Sync due to platform raw pointers.
// We only access it behind a parking_lot::Mutex, which serialises all access,
// and we never move it across threads — start/stop happen on the main thread.
unsafe impl Send for StreamHolder {}
unsafe impl Sync for StreamHolder {}

impl std::fmt::Debug for StreamHolder {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "StreamHolder({})", if self.0.is_some() { "active" } else { "none" })
    }
}
#[derive(Debug)]
pub struct AudioCaptureService {
    audio_tx: Sender<Vec<f32>>,
    running: AtomicBool,
    stream: Mutex<StreamHolder>,
    selected_device: Mutex<Option<String>>,
}

impl AudioCaptureService {
    pub fn new(audio_tx: Sender<Vec<f32>>) -> Arc<Self> {
        Arc::new(Self {
            audio_tx,
            running: AtomicBool::new(false),
            stream: Mutex::new(StreamHolder(None)),
            selected_device: Mutex::new(None),
        })
    }

    pub fn start(&self, preferred_device: Option<String>) -> Result<()> {
        if self.running.load(Ordering::SeqCst) {
            return Ok(());
        }

        let host = cpal::default_host();
        let device = select_input_device(&host, preferred_device.as_deref())?;
        let device_name = device
            .name()
            .unwrap_or_else(|_| "Unknown Device".to_string());

        let default_config = device
            .default_input_config()
            .map_err(|_| AudioError::NoDefaultInputConfig)?;
        let sample_format = default_config.sample_format();
        let config = default_config.config();
        let channels = config.channels as usize;
        let input_rate = config.sample_rate.0;

        let tx = self.audio_tx.clone();
        let err_fn = move |err| {
            log::error!("audio input stream error: {err}");
        };

        let stream = match sample_format {
            cpal::SampleFormat::F32 => {
                build_stream_f32(&device, &config, channels, input_rate, tx, err_fn)?
            }
            cpal::SampleFormat::I16 => {
                build_stream_i16(&device, &config, channels, input_rate, tx, err_fn)?
            }
            cpal::SampleFormat::U16 => {
                build_stream_u16(&device, &config, channels, input_rate, tx, err_fn)?
            }
            other => return Err(anyhow!("unsupported sample format: {other:?}")),
        };

        stream.play().context("failed to play microphone stream")?;
        self.stream.lock().0 = Some(stream);
        *self.selected_device.lock() = Some(device_name);
        self.running.store(true, Ordering::SeqCst);
        Ok(())
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::SeqCst);
        let _ = self.stream.lock().0.take();
    }

    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::SeqCst)
    }

    pub fn current_device(&self) -> Option<String> {
        self.selected_device.lock().clone()
    }

    pub fn list_input_devices() -> Result<Vec<String>> {
        let host = cpal::default_host();
        let devices = host
            .input_devices()
            .context("failed to list input devices")?;
        let mut out = Vec::new();
        for device in devices {
            if let Ok(name) = device.name() {
                out.push(name);
            }
        }
        out.sort();
        Ok(out)
    }
}

fn select_input_device(host: &cpal::Host, preferred: Option<&str>) -> Result<cpal::Device> {
    if let Some(name) = preferred {
        let mut devices = host
            .input_devices()
            .context("failed to list input devices")?;
        if let Some(device) = devices.find(|d| d.name().ok().as_deref() == Some(name)) {
            return Ok(device);
        }
        return Err(AudioError::InputDeviceNotFound.into());
    }

    host.default_input_device()
        .ok_or(AudioError::InputDeviceNotFound)
        .map_err(Into::into)
}

fn downmix_and_resample(raw: &[f32], channels: usize, input_rate: u32) -> Vec<f32> {
    if raw.is_empty() || channels == 0 {
        return Vec::new();
    }

    let mono: Vec<f32> = raw
        .chunks(channels)
        .map(|frame| frame.iter().copied().sum::<f32>() / channels as f32)
        .collect();

    if input_rate == TARGET_SAMPLE_RATE {
        return mono;
    }

    let ratio = input_rate as f32 / TARGET_SAMPLE_RATE as f32;
    let mut idx = 0.0f32;
    let mut out = Vec::with_capacity((mono.len() as f32 / ratio).ceil() as usize);
    while (idx as usize) < mono.len() {
        out.push(mono[idx as usize]);
        idx += ratio;
    }
    out
}

fn build_stream_f32(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    channels: usize,
    input_rate: u32,
    tx: Sender<Vec<f32>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<cpal::Stream> {
    let stream = device.build_input_stream(
        config,
        move |data: &[f32], _| {
            let chunk = downmix_and_resample(data, channels, input_rate);
            if !chunk.is_empty() {
                let _ = tx.send(chunk);
            }
        },
        err_fn,
        None,
    )?;
    Ok(stream)
}

fn build_stream_i16(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    channels: usize,
    input_rate: u32,
    tx: Sender<Vec<f32>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<cpal::Stream> {
    let stream = device.build_input_stream(
        config,
        move |data: &[i16], _| {
            let converted: Vec<f32> = data.iter().map(|x| *x as f32 / i16::MAX as f32).collect();
            let chunk = downmix_and_resample(&converted, channels, input_rate);
            if !chunk.is_empty() {
                let _ = tx.send(chunk);
            }
        },
        err_fn,
        None,
    )?;
    Ok(stream)
}

fn build_stream_u16(
    device: &cpal::Device,
    config: &cpal::StreamConfig,
    channels: usize,
    input_rate: u32,
    tx: Sender<Vec<f32>>,
    err_fn: impl FnMut(cpal::StreamError) + Send + 'static,
) -> Result<cpal::Stream> {
    let stream = device.build_input_stream(
        config,
        move |data: &[u16], _| {
            let converted: Vec<f32> = data
                .iter()
                .map(|x| (*x as f32 / u16::MAX as f32) * 2.0 - 1.0)
                .collect();
            let chunk = downmix_and_resample(&converted, channels, input_rate);
            if !chunk.is_empty() {
                let _ = tx.send(chunk);
            }
        },
        err_fn,
        None,
    )?;
    Ok(stream)
}
