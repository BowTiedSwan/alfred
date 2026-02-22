use anyhow::{Context, Result};
use std::process::Command;

use crate::automation::run_osascript;

pub fn sleep() -> Result<()> {
    let status = Command::new("pmset")
        .arg("sleepnow")
        .status()
        .context("failed to run pmset sleepnow")?;
    if status.success() {
        Ok(())
    } else {
        anyhow::bail!("pmset sleepnow failed")
    }
}

pub fn lock_screen() -> Result<()> {
    run_osascript(
        "tell app \"System Events\" to keystroke \"q\" using {command down, control down}",
    )?;
    Ok(())
}
