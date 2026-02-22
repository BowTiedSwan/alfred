use anyhow::{Context, Result};
use std::process::Command;

use crate::automation::run_osascript;

pub fn open_app(name: &str) -> Result<()> {
    let status = Command::new("open")
        .arg("-a")
        .arg(name)
        .status()
        .context("failed to run open -a")?;
    if status.success() {
        Ok(())
    } else {
        anyhow::bail!("failed to open app: {name}")
    }
}

pub fn focus_app(name: &str) -> Result<()> {
    run_osascript(&format!("tell app \"{name}\" to activate"))?;
    Ok(())
}

pub fn hide_app(name: &str) -> Result<()> {
    let script =
        format!("tell app \"System Events\" to set visible of process \"{name}\" to false");
    run_osascript(&script)?;
    Ok(())
}

pub fn quit_app(name: &str) -> Result<()> {
    run_osascript(&format!("tell app \"{name}\" to quit"))?;
    Ok(())
}

pub fn minimize_frontmost() -> Result<()> {
    let script = "tell app \"System Events\" to keystroke \"m\" using {command down}";
    run_osascript(script)?;
    Ok(())
}

pub fn close_frontmost_window() -> Result<()> {
    let script = "tell app \"System Events\" to keystroke \"w\" using {command down}";
    run_osascript(script)?;
    Ok(())
}
