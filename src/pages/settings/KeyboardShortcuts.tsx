import { useSettings } from '../../hooks';
import { ShortcutInput } from '../../components/shared';

export function KeyboardShortcuts() {
  const { settings, updateShortcuts } = useSettings();

  const containerStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '11px',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.8px',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '8px',
    marginBottom: '16px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 0',
    borderBottom: '1px solid var(--color-border)',
  };

  const labelStyle: React.CSSProperties = {
    flex: 1,
    color: 'var(--color-text)',
    fontSize: '14px',
  };

  const shortcuts = [
    { key: 'open_alfred', label: 'Open Alfred' },
    { key: 'record_transcription', label: 'Record Transcription' },
    { key: 'take_screenshot', label: 'Take Screenshot' },
    { key: 'take_fullscreen_screenshot', label: 'Fullscreen Screenshot' },
    { key: 'take_window_screenshot', label: 'Window Screenshot' },
    { key: 'terminal_image_paste', label: 'Terminal Image Paste' },
    { key: 'command_launcher', label: 'Command Launcher' },
    { key: 'toggle_hot_mic', label: 'Toggle Hot Mic' },
  ];

  return (
    <div style={containerStyle}>
      <div style={sectionHeaderStyle}>Keyboard Shortcuts</div>
      {shortcuts.map(({ key, label }) => (
        <div key={key} style={rowStyle}>
          <span style={labelStyle}>{label}</span>
          <ShortcutInput
            value={settings.shortcuts?.[key] ?? ''}
            onChange={(value) => updateShortcuts({ [key]: value })}
          />
        </div>
      ))}
    </div>
  );
}