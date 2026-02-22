use std::{
    io::{BufRead, BufReader, Write},
    path::PathBuf,
    process::{Child, ChildStdin, Command, Stdio},
    sync::Arc,
    thread,
    time::Instant,
};

use anyhow::{anyhow, Context, Result};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::asr::protocol::{AsrControl, AsrRequest, AsrResponse};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AsrStatus {
    pub running: bool,
    pub model_loaded: bool,
    pub model_path: Option<String>,
    pub last_latency_ms: Option<u64>,
    pub last_transcript: Option<String>,
}

#[derive(Debug, Error)]
pub enum AsrError {
    #[error("asr process is not running")]
    ProcessNotRunning,
}

#[derive(Debug)]
struct AsrProcess {
    child: Child,
    stdin: ChildStdin,
}

#[derive(Debug)]
pub struct ASRService {
    process: Mutex<Option<AsrProcess>>,
    status: Mutex<AsrStatus>,
}

impl ASRService {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            process: Mutex::new(None),
            status: Mutex::new(AsrStatus::default()),
        })
    }

    pub fn start(self: &Arc<Self>, sidecar_path: PathBuf) -> Result<()> {
        if self.status.lock().running {
            return Ok(());
        }

        let mut child = Command::new("python3")
            .arg(sidecar_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .context("failed to spawn ASR sidecar")?;

        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| anyhow!("failed to capture sidecar stdin"))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| anyhow!("failed to capture sidecar stdout"))?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| anyhow!("failed to capture sidecar stderr"))?;

        *self.process.lock() = Some(AsrProcess { child, stdin });
        {
            let mut status = self.status.lock();
            status.running = true;
        }

        let service = Arc::clone(self);
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines() {
                match line {
                    Ok(text) => {
                        if text.trim().is_empty() {
                            continue;
                        }
                        if let Ok(resp) = serde_json::from_str::<AsrResponse>(&text) {
                            let mut status = service.status.lock();
                            status.last_latency_ms = Some(resp.latency_ms);
                            status.last_transcript = Some(resp.text);
                        }
                    }
                    Err(err) => {
                        log::warn!("asr stdout read error: {err}");
                        break;
                    }
                }
            }
            service.status.lock().running = false;
        });

        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(text) = line {
                    log::warn!("asr stderr: {text}");
                }
            }
        });

        Ok(())
    }

    pub fn stop(&self) -> Result<()> {
        if let Some(mut proc) = self.process.lock().take() {
            let _ = proc.child.kill();
            let _ = proc.child.wait();
        }
        self.status.lock().running = false;
        Ok(())
    }

    pub fn restart(self: &Arc<Self>, sidecar_path: PathBuf) -> Result<()> {
        self.stop()?;
        self.start(sidecar_path)
    }

    pub fn send_audio_chunk(&self, audio: Vec<f32>) -> Result<()> {
        let request = AsrRequest::transcribe(audio, 16_000);
        self.send_json(&request)
    }

    pub fn load_model(&self, path: String) -> Result<()> {
        let control = AsrControl::load_model(path.clone());
        self.send_json(&control)?;
        let mut status = self.status.lock();
        status.model_loaded = true;
        status.model_path = Some(path);
        Ok(())
    }

    pub fn request_status(&self) -> Result<()> {
        self.send_json(&AsrControl::status())
    }

    pub fn status(&self) -> AsrStatus {
        self.status.lock().clone()
    }

    pub fn transcribe_blocking(&self, audio: Vec<f32>) -> Result<Option<AsrResponse>> {
        let request = AsrRequest::transcribe(audio, 16_000);
        let started = Instant::now();
        self.send_json(&request)?;

        let latency = started.elapsed().as_millis() as u64;
        let maybe_text = self.status.lock().last_transcript.clone();
        Ok(maybe_text.map(|text| AsrResponse {
            kind: "transcript".to_string(),
            text,
            is_final: false,
            latency_ms: latency,
        }))
    }

    fn send_json<T: Serialize>(&self, value: &T) -> Result<()> {
        let mut process_guard = self.process.lock();
        let proc = process_guard
            .as_mut()
            .ok_or(AsrError::ProcessNotRunning)
            .map_err(anyhow::Error::from)?;

        let payload = serde_json::to_string(value)?;
        proc.stdin
            .write_all(payload.as_bytes())
            .context("failed to write sidecar stdin")?;
        proc.stdin
            .write_all(b"\n")
            .context("failed to write sidecar newline")?;
        proc.stdin
            .flush()
            .context("failed to flush sidecar stdin")?;
        Ok(())
    }
}
