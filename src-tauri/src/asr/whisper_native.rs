use std::path::Path;
use std::sync::Arc;

use anyhow::{Context, Result};
use parking_lot::Mutex;
use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

#[derive(Clone)]
pub struct WhisperTranscriber {
    context: Arc<Mutex<WhisperContext>>,
}

impl std::fmt::Debug for WhisperTranscriber {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("WhisperTranscriber").finish_non_exhaustive()
    }
}

impl WhisperTranscriber {
    pub fn new(model_path: &Path) -> Result<Self> {
        let model_path_str = model_path.to_string_lossy().to_string();
        let context =
            WhisperContext::new_with_params(&model_path_str, WhisperContextParameters::default())
                .with_context(|| {
                format!("failed to load whisper model from {}", model_path.display())
            })?;

        Ok(Self {
            context: Arc::new(Mutex::new(context)),
        })
    }

    pub fn transcribe(&self, audio: &[f32]) -> Result<String> {
        if audio.is_empty() {
            return Ok(String::new());
        }

        let context = self.context.lock();
        let mut state = context
            .create_state()
            .context("failed to create whisper state")?;

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_language(Some("en"));
        params.set_translate(false);
        params.set_no_context(true);
        params.set_print_special(false);
        params.set_print_progress(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);

        state
            .full(params, audio)
            .context("whisper inference failed")?;

        let segment_count = state
            .full_n_segments()
            .context("failed to read whisper segment count")?;
        let mut transcript = String::new();
        for i in 0..segment_count {
            let segment = state
                .full_get_segment_text(i)
                .with_context(|| format!("failed to read whisper segment {i}"))?;
            transcript.push_str(&segment);
        }

        Ok(transcript.trim().to_string())
    }
}
