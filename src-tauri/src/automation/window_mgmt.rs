use anyhow::{anyhow, Result};

use crate::automation::run_osascript;

#[derive(Debug, Clone, Copy)]
struct Rect {
    x: i32,
    y: i32,
    w: i32,
    h: i32,
}

pub fn get_screen_size() -> Result<(i32, i32)> {
    let raw = run_osascript("tell application \"Finder\" to get bounds of window of desktop")?;
    let vals = parse_csv_i32(&raw)?;
    if vals.len() != 4 {
        return Err(anyhow!("expected 4 desktop bounds values, got: {raw}"));
    }
    Ok((vals[2] - vals[0], vals[3] - vals[1]))
}

pub fn snap_left() -> Result<()> {
    let s = screen_rect()?;
    set_front_window_bounds(Rect {
        x: s.x,
        y: s.y,
        w: s.w / 2,
        h: s.h,
    })
}

pub fn snap_right() -> Result<()> {
    let s = screen_rect()?;
    set_front_window_bounds(Rect {
        x: s.x + s.w / 2,
        y: s.y,
        w: s.w / 2,
        h: s.h,
    })
}

pub fn maximize() -> Result<()> {
    set_front_window_bounds(screen_rect()?)
}

pub fn center() -> Result<()> {
    let s = screen_rect()?;
    let current = front_window_bounds()?;
    let w = current.w.min(s.w);
    let h = current.h.min(s.h);
    let x = s.x + (s.w - w) / 2;
    let y = s.y + (s.h - h) / 2;
    set_front_window_bounds(Rect { x, y, w, h })
}

pub fn top_left() -> Result<()> {
    let s = screen_rect()?;
    set_front_window_bounds(Rect {
        x: s.x,
        y: s.y,
        w: s.w / 2,
        h: s.h / 2,
    })
}

pub fn top_right() -> Result<()> {
    let s = screen_rect()?;
    set_front_window_bounds(Rect {
        x: s.x + s.w / 2,
        y: s.y,
        w: s.w / 2,
        h: s.h / 2,
    })
}

pub fn bottom_left() -> Result<()> {
    let s = screen_rect()?;
    set_front_window_bounds(Rect {
        x: s.x,
        y: s.y + s.h / 2,
        w: s.w / 2,
        h: s.h / 2,
    })
}

pub fn bottom_right() -> Result<()> {
    let s = screen_rect()?;
    set_front_window_bounds(Rect {
        x: s.x + s.w / 2,
        y: s.y + s.h / 2,
        w: s.w / 2,
        h: s.h / 2,
    })
}

pub fn horizontal() -> Result<()> {
    let script = r#"
tell application "System Events"
    tell process (name of first application process whose frontmost is true)
        if (count of windows) < 2 then return
        tell application "Finder" to set desktopBounds to bounds of window of desktop
        set leftBound to item 1 of desktopBounds
        set topBound to item 2 of desktopBounds
        set screenW to (item 3 of desktopBounds) - leftBound
        set screenH to (item 4 of desktopBounds) - topBound
        set position of window 1 to {leftBound, topBound}
        set size of window 1 to {screenW / 2, screenH}
        set position of window 2 to {leftBound + (screenW / 2), topBound}
        set size of window 2 to {screenW / 2, screenH}
    end tell
end tell
"#;
    run_osascript(script)?;
    Ok(())
}

pub fn vertical() -> Result<()> {
    let script = r#"
tell application "System Events"
    tell process (name of first application process whose frontmost is true)
        if (count of windows) < 2 then return
        tell application "Finder" to set desktopBounds to bounds of window of desktop
        set leftBound to item 1 of desktopBounds
        set topBound to item 2 of desktopBounds
        set screenW to (item 3 of desktopBounds) - leftBound
        set screenH to (item 4 of desktopBounds) - topBound
        set position of window 1 to {leftBound, topBound}
        set size of window 1 to {screenW, screenH / 2}
        set position of window 2 to {leftBound, topBound + (screenH / 2)}
        set size of window 2 to {screenW, screenH / 2}
    end tell
end tell
"#;
    run_osascript(script)?;
    Ok(())
}

pub fn grid() -> Result<()> {
    let script = r#"
tell application "System Events"
    tell process (name of first application process whose frontmost is true)
        set winCount to count of windows
        if winCount is 0 then return
        tell application "Finder" to set desktopBounds to bounds of window of desktop
        set leftBound to item 1 of desktopBounds
        set topBound to item 2 of desktopBounds
        set screenW to (item 3 of desktopBounds) - leftBound
        set screenH to (item 4 of desktopBounds) - topBound
        set cols to round (winCount ^ 0.5) rounding up
        set rows to round (winCount / cols) rounding up
        set cellW to screenW / cols
        set cellH to screenH / rows
        repeat with i from 1 to winCount
            set col to (i - 1) mod cols
            set row to (i - 1) div cols
            set position of window i to {leftBound + (col * cellW), topBound + (row * cellH)}
            set size of window i to {cellW, cellH}
        end repeat
    end tell
end tell
"#;
    run_osascript(script)?;
    Ok(())
}

pub fn cascade() -> Result<()> {
    let script = r#"
tell application "System Events"
    tell process (name of first application process whose frontmost is true)
        set offsetStep to 36
        set idx to 0
        repeat with w in windows
            set position of w to {40 + (idx * offsetStep), 40 + (idx * offsetStep)}
            set idx to idx + 1
        end repeat
    end tell
end tell
"#;
    run_osascript(script)?;
    Ok(())
}

pub fn show_all() -> Result<()> {
    run_osascript("tell application \"System Events\" to key code 126 using {control down}")?;
    Ok(())
}

pub fn focus_mode() -> Result<()> {
    run_osascript(
        "tell application \"System Events\" to keystroke \"h\" using {command down, option down}",
    )?;
    Ok(())
}

pub fn restore() -> Result<()> {
    let s = screen_rect()?;
    let w = (s.w as f32 * 0.75) as i32;
    let h = (s.h as f32 * 0.75) as i32;
    let x = s.x + (s.w - w) / 2;
    let y = s.y + (s.h - h) / 2;
    set_front_window_bounds(Rect { x, y, w, h })
}

pub fn exit_fullscreen() -> Result<()> {
    run_osascript(
        "tell application \"System Events\" to keystroke \"f\" using {command down, control down}",
    )?;
    Ok(())
}

fn screen_rect() -> Result<Rect> {
    let raw = run_osascript("tell application \"Finder\" to get bounds of window of desktop")?;
    let vals = parse_csv_i32(&raw)?;
    if vals.len() != 4 {
        return Err(anyhow!("expected 4 desktop bounds values, got: {raw}"));
    }
    Ok(Rect {
        x: vals[0],
        y: vals[1],
        w: vals[2] - vals[0],
        h: vals[3] - vals[1],
    })
}

fn front_window_bounds() -> Result<Rect> {
    let script = r#"
tell application "System Events"
    tell process (name of first application process whose frontmost is true)
        set p to position of window 1
        set s to size of window 1
        return (item 1 of p as string) & "," & (item 2 of p as string) & "," & (item 1 of s as string) & "," & (item 2 of s as string)
    end tell
end tell
"#;
    let raw = run_osascript(script)?;
    let vals = parse_csv_i32(&raw)?;
    if vals.len() != 4 {
        return Err(anyhow!("expected 4 front-window values, got: {raw}"));
    }
    Ok(Rect {
        x: vals[0],
        y: vals[1],
        w: vals[2],
        h: vals[3],
    })
}

fn set_front_window_bounds(rect: Rect) -> Result<()> {
    let script = format!(
        "tell application \"System Events\" to tell process (name of first application process whose frontmost is true) to set position of window 1 to {{{}, {}}}",
        rect.x, rect.y
    );
    run_osascript(&script)?;

    let script = format!(
        "tell application \"System Events\" to tell process (name of first application process whose frontmost is true) to set size of window 1 to {{{}, {}}}",
        rect.w.max(100),
        rect.h.max(100)
    );
    run_osascript(&script)?;
    Ok(())
}

fn parse_csv_i32(raw: &str) -> Result<Vec<i32>> {
    raw.split(',')
        .map(|part| part.trim().parse::<i32>())
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| anyhow!("failed to parse integer list: {raw}"))
}
