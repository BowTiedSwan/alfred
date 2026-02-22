use anyhow::Result;
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::automation::run_osascript;

#[derive(Debug, Default)]
pub struct EditorIntegration;

impl EditorIntegration {
    /// Map frontend editor ID to the actual macOS process name
    pub fn process_name_for_editor(editor: &str) -> &str {
        match editor {
            "claude_code" => "Terminal",
            "cursor" => "Cursor",
            "codex" => "Codex",
            "opencode" => "OpenCode",
            other => other,
        }
    }
    pub fn is_editor_running(editor: &str) -> Result<bool> {
        let app = escape_applescript_string(Self::process_name_for_editor(editor));
        let script = format!(
            "tell application \"System Events\" to return application process \"{}\" exists",
            app
        );
        let output = run_osascript(&script)?;
        Ok(output.eq_ignore_ascii_case("true"))
    }

    pub fn paste_to_editor(editor: &str, text: &str, app_handle: &AppHandle) -> Result<()> {
        app_handle.clipboard().write_text(text.to_string())?;
        let app = escape_applescript_string(editor);
        run_osascript(&format!("tell application \"{app}\" to activate"))?;
        run_osascript(
            "tell application \"System Events\" to keystroke \"v\" using {command down}",
        )?;
        Ok(())
    }

    pub fn detect_running_editors() -> Result<Vec<String>> {
        let known = ["Terminal", "Cursor", "Codex", "OpenCode"];
        let mut running = Vec::new();

        for editor in known {
            if Self::is_editor_running(editor)? {
                let label = if editor == "Terminal" {
                    "Claude Code (Terminal)".to_string()
                } else {
                    editor.to_string()
                };
                running.push(label);
            }
        }

        Ok(running)
    }
}

fn escape_applescript_string(input: &str) -> String {
    input.replace('"', "\\\"")
}
