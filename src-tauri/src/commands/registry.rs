use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum CommandCategory {
    DictationControl,
    WindowTerminal,
    MediaSystem,
    AppSwitching,
    WindowLayout,
    PortableCommand,
    FastReply,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum CommandAction {
    Submit,
    Paste,
    Cancel,
    NextWindow,
    PrevWindow,
    NewWindow,
    CloseWindow,
    Minimize,
    HideApp,
    QuitApp,
    StartClaude,
    StartCodex,
    StartOpenCode,
    RestartServer,
    PlayPause,
    NextTrack,
    PrevTrack,
    VolumeUp,
    VolumeDown,
    Mute,
    Unmute,
    Sleep,
    LockScreen,
    OpenApp(String),
    HideNamedApp(String),
    QuitNamedApp(String),
    Grid,
    ShowAll,
    FocusMode,
    Horizontal,
    Vertical,
    Cascade,
    SnapLeft,
    SnapRight,
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
    Maximize,
    ExitFullscreen,
    Center,
    Restore,
    UseCommand(String),
    UseCommands(Vec<String>),
    Type(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceCommand {
    pub action: CommandAction,
    pub phrases: Vec<String>,
    pub category: CommandCategory,
}

#[derive(Debug, Clone)]
pub struct CommandRegistry {
    commands: Vec<VoiceCommand>,
}

impl CommandRegistry {
    pub fn new() -> Self {
        Self {
            commands: vec![
                VoiceCommand {
                    action: CommandAction::Submit,
                    phrases: vec!["go ahead", "send it", "submit", "do it"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::DictationControl,
                },
                VoiceCommand {
                    action: CommandAction::Paste,
                    phrases: vec!["paste", "paste it", "transcribe"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::DictationControl,
                },
                VoiceCommand {
                    action: CommandAction::Cancel,
                    phrases: vec!["stop", "abort"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::DictationControl,
                },
                VoiceCommand {
                    action: CommandAction::NextWindow,
                    phrases: vec!["next window", "switch"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::PrevWindow,
                    phrases: vec!["previous window"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::NewWindow,
                    phrases: vec!["new window"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::CloseWindow,
                    phrases: vec!["close window", "close the window", "close this window"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::Minimize,
                    phrases: vec!["minimize", "minimize window"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::HideApp,
                    phrases: vec!["hide", "hide app"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::QuitApp,
                    phrases: vec!["quit app"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::StartClaude,
                    phrases: vec!["start claude", "start cloud", "run claude"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::StartCodex,
                    phrases: vec!["start codex", "run codex"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::StartOpenCode,
                    phrases: vec!["start opencode", "run opencode"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::RestartServer,
                    phrases: vec!["restart server", "restart dev"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowTerminal,
                },
                VoiceCommand {
                    action: CommandAction::PlayPause,
                    phrases: vec!["play", "pause", "play pause"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::NextTrack,
                    phrases: vec!["next track", "next song", "skip song"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::PrevTrack,
                    phrases: vec!["previous track", "previous song"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::VolumeUp,
                    phrases: vec!["louder", "volume up", "turn it up"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::VolumeDown,
                    phrases: vec!["softer", "quieter", "volume down"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::Mute,
                    phrases: vec!["mute", "mute audio"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::Unmute,
                    phrases: vec!["unmute"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::Sleep,
                    phrases: vec!["go to sleep", "sleep computer"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::LockScreen,
                    phrases: vec!["lock screen", "lock computer"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::MediaSystem,
                },
                VoiceCommand {
                    action: CommandAction::Grid,
                    phrases: vec!["grid", "tile"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::ShowAll,
                    phrases: vec!["show all"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::FocusMode,
                    phrases: vec!["focus", "focus mode", "hide others"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::Horizontal,
                    phrases: vec!["horizontal", "side by side"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::Vertical,
                    phrases: vec!["vertical", "stack windows"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::Cascade,
                    phrases: vec!["cascade"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::SnapLeft,
                    phrases: vec!["snap left"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::SnapRight,
                    phrases: vec!["snap right"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::TopLeft,
                    phrases: vec!["top left corner"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::TopRight,
                    phrases: vec!["top right corner"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::BottomLeft,
                    phrases: vec!["bottom left corner"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::BottomRight,
                    phrases: vec!["bottom right corner"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::Maximize,
                    phrases: vec!["maximize", "full screen", "fullscreen"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::ExitFullscreen,
                    phrases: vec!["exit full screen"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::Center,
                    phrases: vec!["center", "center window"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::Restore,
                    phrases: vec!["restore"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::WindowLayout,
                },
                VoiceCommand {
                    action: CommandAction::Type("1".to_string()),
                    phrases: vec!["first option"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::FastReply,
                },
                VoiceCommand {
                    action: CommandAction::Type("2".to_string()),
                    phrases: vec!["second option"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::FastReply,
                },
                VoiceCommand {
                    action: CommandAction::Type("3".to_string()),
                    phrases: vec!["third option"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::FastReply,
                },
                VoiceCommand {
                    action: CommandAction::Type("4".to_string()),
                    phrases: vec!["fourth option"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::FastReply,
                },
                VoiceCommand {
                    action: CommandAction::Type("y".to_string()),
                    phrases: vec!["allow", "approve"]
                        .into_iter()
                        .map(str::to_string)
                        .collect(),
                    category: CommandCategory::FastReply,
                },
                VoiceCommand {
                    action: CommandAction::Type("a".to_string()),
                    phrases: vec!["always"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::FastReply,
                },
                VoiceCommand {
                    action: CommandAction::Type("n".to_string()),
                    phrases: vec!["deny"].into_iter().map(str::to_string).collect(),
                    category: CommandCategory::FastReply,
                },
            ],
        }
    }

    pub fn commands(&self) -> &[VoiceCommand] {
        &self.commands
    }
}

impl Default for CommandRegistry {
    fn default() -> Self {
        Self::new()
    }
}
