use std::path::PathBuf;

use anyhow::{anyhow, Context, Result};
use tokio::io::AsyncWriteExt;
use tokio::sync::watch;

#[derive(Debug, Default, Clone)]
pub struct ModelDownloadManager {
    client: reqwest::Client,
}

impl ModelDownloadManager {
    pub fn new() -> Self {
        Self {
            client: reqwest::Client::new(),
        }
    }

    pub async fn download_model(
        &self,
        url: &str,
        dest: PathBuf,
        progress_tx: watch::Sender<(u64, u64)>,
    ) -> Result<()> {
        if let Some(parent) = dest.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .context("failed to create model directory")?;
        }

        let response = self
            .client
            .get(url)
            .send()
            .await
            .context("failed to start model download")?;

        if !response.status().is_success() {
            return Err(anyhow!(
                "model download failed with status {}",
                response.status()
            ));
        }

        let total_bytes = response.content_length();
        let mut file = tokio::fs::File::create(&dest)
            .await
            .context("failed to create destination model file")?;
        let mut downloaded_bytes: u64 = 0;
        let mut response = response;

        while let Some(chunk) = response
            .chunk()
            .await
            .context("download stream error")?
        {
            file.write_all(&chunk)
                .await
                .context("failed to write downloaded model bytes")?;
            downloaded_bytes += chunk.len() as u64;

            if let Some(total) = total_bytes {
                if total > 0 {
                    let _ = progress_tx.send((downloaded_bytes, total));
                }
            }
        }

        file.flush()
            .await
            .context("failed to flush destination model file")?;
        let _ = progress_tx.send((downloaded_bytes, total_bytes.unwrap_or(downloaded_bytes)));
        Ok(())
    }
}
