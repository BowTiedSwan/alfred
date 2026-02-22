use regex::Regex;
use strsim::normalized_levenshtein;

use crate::commands::registry::{CommandAction, CommandRegistry};

const FUZZY_THRESHOLD: f64 = 0.85;

#[derive(Debug, Clone)]
pub struct CommandMatcher {
    registry: CommandRegistry,
    app_open_re: Regex,
    app_hide_re: Regex,
    app_quit_re: Regex,
    use_command_re: Regex,
    use_commands_re: Regex,
}

impl CommandMatcher {
    pub fn new(registry: CommandRegistry) -> Self {
        Self {
            registry,
            app_open_re: Regex::new(
                r"(?i)(?P<prefix>.*)\b(?:open|switch to|go to)\s+(?P<app>[a-z0-9 ._\-+]+)$",
            )
            .expect("valid app open regex"),
            app_hide_re: Regex::new(r"(?i)(?P<prefix>.*)\bhide\s+(?P<app>[a-z0-9 ._\-+]+)$")
                .expect("valid app hide regex"),
            app_quit_re: Regex::new(
                r"(?i)(?P<prefix>.*)\b(?:quit|close|kill)\s+(?P<app>[a-z0-9 ._\-+]+)$",
            )
            .expect("valid app quit regex"),
            use_command_re: Regex::new(r"(?i)(?P<prefix>.*)\buse the\s+(?P<name>.+?)\s+command$")
                .expect("valid use-command regex"),
            use_commands_re: Regex::new(r"(?i)(?P<prefix>.*)\buse the commands\s+(?P<names>.+)$")
                .expect("valid use-commands regex"),
        }
    }

    pub fn match_command(&self, transcript: &str) -> Option<(CommandAction, String)> {
        let normalized = normalize_text(transcript);
        if normalized.is_empty() {
            return None;
        }

        if let Some(result) = self.match_dynamic(&normalized) {
            return Some(result);
        }

        if let Some(result) = self.match_exact_suffix(&normalized) {
            return Some(result);
        }

        self.match_fuzzy_suffix(&normalized)
    }

    fn match_dynamic(&self, normalized: &str) -> Option<(CommandAction, String)> {
        if let Some(caps) = self.app_open_re.captures(normalized) {
            let app = caps.name("app")?.as_str().trim().to_string();
            let prefix = caps
                .name("prefix")
                .map(|m| m.as_str().trim().to_string())
                .unwrap_or_default();
            return Some((CommandAction::OpenApp(app), prefix));
        }

        if let Some(caps) = self.app_hide_re.captures(normalized) {
            let app = caps.name("app")?.as_str().trim().to_string();
            let prefix = caps
                .name("prefix")
                .map(|m| m.as_str().trim().to_string())
                .unwrap_or_default();
            return Some((CommandAction::HideNamedApp(app), prefix));
        }

        if let Some(caps) = self.app_quit_re.captures(normalized) {
            let app = caps.name("app")?.as_str().trim().to_string();
            let prefix = caps
                .name("prefix")
                .map(|m| m.as_str().trim().to_string())
                .unwrap_or_default();
            return Some((CommandAction::QuitNamedApp(app), prefix));
        }

        if let Some(caps) = self.use_command_re.captures(normalized) {
            let name = caps.name("name")?.as_str().trim().to_string();
            let prefix = caps
                .name("prefix")
                .map(|m| m.as_str().trim().to_string())
                .unwrap_or_default();
            return Some((CommandAction::UseCommand(name), prefix));
        }

        if let Some(caps) = self.use_commands_re.captures(normalized) {
            let raw = caps.name("names")?.as_str();
            let names = raw
                .replace(" and ", ",")
                .split(',')
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(str::to_string)
                .collect::<Vec<_>>();
            if !names.is_empty() {
                let prefix = caps
                    .name("prefix")
                    .map(|m| m.as_str().trim().to_string())
                    .unwrap_or_default();
                return Some((CommandAction::UseCommands(names), prefix));
            }
        }

        None
    }

    fn match_exact_suffix(&self, normalized: &str) -> Option<(CommandAction, String)> {
        for command in self.registry.commands() {
            for phrase in &command.phrases {
                if let Some(prefix) = strip_suffix_phrase(normalized, phrase) {
                    return Some((command.action.clone(), prefix));
                }
            }
        }
        None
    }

    fn match_fuzzy_suffix(&self, normalized: &str) -> Option<(CommandAction, String)> {
        for command in self.registry.commands() {
            for phrase in &command.phrases {
                let word_count = phrase.split_whitespace().count();
                if word_count == 0 {
                    continue;
                }

                let words: Vec<&str> = normalized.split_whitespace().collect();
                if words.len() < word_count {
                    continue;
                }

                let candidate_suffix = words[words.len() - word_count..].join(" ");
                let score = normalized_levenshtein(&candidate_suffix, phrase);
                if score >= FUZZY_THRESHOLD {
                    let remaining = words[..words.len() - word_count].join(" ");
                    return Some((command.action.clone(), remaining.trim().to_string()));
                }
            }
        }
        None
    }
}

fn normalize_text(input: &str) -> String {
    input
        .trim()
        .trim_end_matches(|c: char| ".,!?;:".contains(c))
        .to_lowercase()
}

fn strip_suffix_phrase(text: &str, phrase: &str) -> Option<String> {
    if !text.ends_with(phrase) {
        return None;
    }
    let prefix = text[..text.len() - phrase.len()].trim_end();
    if prefix.is_empty() {
        return Some(String::new());
    }
    if prefix.ends_with(' ') {
        return Some(prefix.trim().to_string());
    }

    if text == phrase {
        Some(String::new())
    } else {
        Some(prefix.to_string())
    }
}
