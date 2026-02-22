use anyhow::Result;

use crate::automation::run_osascript;

pub fn play_pause() -> Result<()> {
    run_osascript("tell application \"System Events\" to key code 49")?;
    Ok(())
}

pub fn next_track() -> Result<()> {
    run_osascript("tell application \"System Events\" to key code 19")?;
    Ok(())
}

pub fn prev_track() -> Result<()> {
    run_osascript("tell application \"System Events\" to key code 20")?;
    Ok(())
}

pub fn volume_up() -> Result<()> {
    run_osascript("set volume output volume ((output volume of (get volume settings)) + 10)")?;
    Ok(())
}

pub fn volume_down() -> Result<()> {
    run_osascript("set volume output volume ((output volume of (get volume settings)) - 10)")?;
    Ok(())
}

pub fn mute() -> Result<()> {
    run_osascript("set volume with output muted")?;
    Ok(())
}

pub fn unmute() -> Result<()> {
    run_osascript("set volume without output muted")?;
    Ok(())
}
