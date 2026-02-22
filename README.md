# Alfred

A macOS-native voice transcription and command execution app built with [Tauri v2](https://v2.tauri.app/). Push-to-talk, hot mic (always-on voice commands), and direct paste into AI code editors — all running locally on-device.

## Features

### Voice Transcription
- **Push-to-Talk** — Press `Cmd+\` to record, release to transcribe. Result auto-pastes into your active editor.
- **Hot Mic** — Always-on listening that accumulates 3-second audio chunks, transcribes, and matches against a built-in command registry.
- **On-device inference** — Uses [whisper.cpp](https://github.com/ggerganov/whisper.cpp) via `whisper-rs` for fast, private, local transcription. No audio ever leaves your machine.
- **Model management** — Download Whisper models (tiny, base, small) from HuggingFace with progress tracking. Models stored in `~/Library/Application Support/dev.alfred.app/models/`.

### Voice Commands (44 built-in)

Commands are matched via fuzzy string matching from transcribed speech.

| Category | Examples |
|---|---|
| Dictation Control | "submit", "paste that", "cancel" |
| Window & Terminal | "next window", "close window", "minimize", "new window" |
| Media & System | "play/pause", "next track", "volume up", "mute", "lock screen" |
| App Switching | "open Safari", "hide Slack", "quit Finder", "start Claude", "start Codex" |
| Window Layout | "snap left", "snap right", "top left", "maximize", "grid", "cascade" |
| Portable Commands | User-defined commands loaded from a local directory |

### Editor Integrations
- **Claude Code** — Auto-paste transcription into Claude Code terminal
- **Cursor** — Auto-paste into Cursor editor
- **Codex** — Auto-paste into Codex
- **OpenCode** — Auto-paste into OpenCode

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Cmd+\` | Toggle push-to-talk recording |
| `Alt+Space` | Show/focus Alfred window |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Tauri v2](https://v2.tauri.app/) (Rust backend, WebView frontend) |
| Frontend | React 19 + TypeScript + Vite |
| ASR Engine | [whisper-rs](https://github.com/tazz4843/whisper-rs) (whisper.cpp bindings) |
| Audio Capture | [cpal](https://github.com/RustAudio/cpal) |
| UI Animations | [Rive](https://rive.app/) via `@rive-app/react-canvas` |
| Styling | CSS custom properties, light/dark theme |

## Prerequisites

- **macOS 14.0+** (Sonoma or later)
- **Rust** 1.77.2+ (`rustup install 1.77.2`)
- **Node.js** 18+
- **Xcode Command Line Tools** (`xcode-select --install`)

### System Permissions

Alfred requires these macOS permissions (prompted on first launch):

- **Microphone** — Audio capture for transcription
- **Accessibility** — Window management, keyboard shortcuts, editor paste
- **Screen Recording** — Optional, for screenshot capture
- **Notifications** — Status alerts

## Getting Started

```bash
# Clone
git clone https://github.com/bowtiedswan/alfred.git
cd alfred/alfred-app

# Install frontend dependencies
npm install

# Run in development mode (starts both Vite dev server and Tauri)
npm run tauri:dev

# Build for production
npm run tauri:build
```

The production `.app` and `.dmg` will be in `src-tauri/target/release/bundle/`.

### First Run

1. Launch Alfred — grant microphone and accessibility permissions when prompted.
2. Go to **Audio & Transcription** settings and download a Whisper model (start with `base` for a good speed/accuracy balance).
3. Press `Cmd+\` to test push-to-talk. Speech will be transcribed and pasted into any connected editor.
4. Enable **Hot Mic** for always-on voice commands.

## Project Structure

```
alfred-app/
├── src/                          # React frontend
│   ├── components/               # Shared UI components
│   │   ├── animations/           # Mic indicator, Rive wrappers
│   │   ├── layout/               # AppShell, Sidebar
│   │   └── shared/               # Button, Card, Toggle, PermissionRow
│   ├── hooks/                    # React hooks (useAudio, useSettings, useTranscription, useTheme)
│   ├── pages/                    # Route pages
│   │   ├── Home.tsx              # Main transcription view
│   │   ├── Onboarding.tsx        # First-run setup
│   │   └── settings/             # Settings sub-pages
│   ├── stores/                   # State management
│   ├── types/                    # TypeScript type definitions
│   └── lib/                      # Utility functions
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # App setup, global shortcuts, audio thread
│   │   ├── ipc/
│   │   │   ├── commands.rs       # All Tauri IPC commands
│   │   │   └── events.rs         # Event payload structs
│   │   ├── asr/
│   │   │   └── whisper_native.rs # WhisperTranscriber (whisper-rs)
│   │   ├── audio/
│   │   │   └── capture.rs        # cpal microphone capture
│   │   ├── commands/
│   │   │   ├── registry.rs       # 44 voice commands, 7 categories
│   │   │   └── matcher.rs        # Fuzzy command matching
│   │   ├── integrations/
│   │   │   └── editor.rs         # Editor paste (Claude Code, Cursor, Codex, OpenCode)
│   │   ├── model/
│   │   │   ├── download.rs       # HuggingFace model downloader
│   │   │   └── storage.rs        # Model file management
│   │   └── settings/
│   │       └── config.rs         # Settings persistence
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── vite.config.ts
```

## Configuration

Settings are stored in `~/Library/Application Support/dev.alfred.app/settings.json`.

| Setting | Description |
|---|---|
| Audio engine | `whisper` (default). Qwen ASR planned. |
| Model | Which Whisper model to use (tiny/base/small) |
| Priority microphone | Preferred input device |
| Theme | Light / Dark / System |
| Accent color | UI accent color picker |
| Word corrections | Custom word replacement rules |
| Editor connections | Toggle Claude Code, Cursor, Codex, OpenCode |

## Roadmap

- [ ] Qwen ASR engine integration (model entries exist, runtime not yet implemented)
- [ ] Rive animation files (component wrappers ready, `.riv` assets pending)
- [ ] Transcription history persistence
- [ ] Screenshot capture integration
- [ ] Menu bar mode (tray-only, no dock icon)

## License

MIT
