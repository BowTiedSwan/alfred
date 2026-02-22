import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks';
import { Button, ShortcutInput } from '../../components/shared';
import { completeOnboarding } from '../../types/commands';

export function ConfigureShortcuts() {
  const navigate = useNavigate();
  const { settings, updateShortcuts } = useSettings();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '48px',
    backgroundColor: 'var(--color-background)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '480px',
    width: '100%',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    marginBottom: '32px',
  };

  const shortcutRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 0',
    borderBottom: '1px solid var(--color-border)',
  };

  const labelStyle: React.CSSProperties = {
    flex: 1,
    color: 'var(--color-text)',
    fontWeight: 500,
  };

  const checkStyle: React.CSSProperties = {
    color: 'var(--color-success)',
    marginLeft: '12px',
    fontSize: '16px',
  };

  const dotsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '32px',
  };

  const dotStyle = (active: boolean): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-border)',
  });

  const handleComplete = async () => {
    await completeOnboarding();
    navigate('/');
  };

  const shortcuts = [
    { key: 'open_alfred' as const, label: 'Open Alfred' },
    { key: 'record_transcription' as const, label: 'Record Transcription' },
    { key: 'take_screenshot' as const, label: 'Take Screenshot' },
  ];

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Configure Your Shortcuts</h1>
        <p style={subtitleStyle}>Click to customize, or keep the defaults.</p>

        <div>
          {shortcuts.map(({ key, label }) => (
            <div key={key} style={shortcutRowStyle}>
              <span style={labelStyle}>{label}</span>
              <ShortcutInput
                value={settings.shortcuts[key]}
                onChange={(newValue) => updateShortcuts({ [key]: newValue })}
              />
              <span style={checkStyle}>✓</span>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          style={{ width: '100%', marginTop: '24px' }}
          onClick={handleComplete}
        >
          Get Started
        </Button>

        <div style={dotsContainerStyle}>
          <div style={dotStyle(false)} />
          <div style={dotStyle(false)} />
          <div style={dotStyle(true)} />
        </div>
      </div>
    </div>
  );
}