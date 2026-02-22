pub mod app_control;
pub mod media;
pub mod system;
pub mod window_mgmt;

use anyhow::{anyhow, Context, Result};
use std::process::Command;

pub(crate) fn run_osascript(script: &str) -> Result<String> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
        .context("failed to execute osascript")?;

    if !output.status.success() {
        return Err(anyhow!(
            "osascript failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}
