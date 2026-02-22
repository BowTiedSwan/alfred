use std::process::Command;

use anyhow::{Context, Result};

unsafe extern "C" {
    fn AXIsProcessTrusted() -> bool;
}

pub fn check_microphone() -> Result<bool> {
    Ok(true)
}

pub fn check_accessibility() -> Result<bool> {
    Ok(unsafe { AXIsProcessTrusted() })
}

pub fn check_screen_recording() -> Result<bool> {
    let output = Command::new("osascript")
        .arg("-e")
        .arg("tell application \"System Events\" to return true")
        .output()
        .context("failed to check screen recording permission")?;
    Ok(output.status.success())
}

pub fn open_microphone_settings() -> Result<()> {
    open_settings("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone")
}

pub fn open_accessibility_settings() -> Result<()> {
    open_settings("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
}

pub fn open_screen_recording_settings() -> Result<()> {
    open_settings("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
}

fn open_settings(url: &str) -> Result<()> {
    let status = Command::new("open")
        .arg(url)
        .status()
        .context("failed to open System Settings")?;
    if status.success() {
        Ok(())
    } else {
        anyhow::bail!("open command failed for System Settings url: {url}")
    }
}
