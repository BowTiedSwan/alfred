import { useSettings, usePermissions } from '../../hooks';
import { Toggle, PermissionRow } from '../../components/shared';
import { openSystemSettings, requestPermission } from '../../types/commands';

export function AppearanceSystem() {
  const { settings, updateAppearance, updateDataRetention } = useSettings();
  const { permissions } = usePermissions();

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

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border)',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    fontSize: '14px',
  };

  const colorSwatchesStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  };

  const swatchStyle = (color: string, isSelected: boolean): React.CSSProperties => ({
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: color,
    cursor: 'pointer',
    outline: isSelected ? '2px solid var(--color-text)' : 'none',
    outlineOffset: '2px',
  });

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text)',
    fontSize: '14px',
    cursor: 'pointer',
  };

  const accentColors = [
    '#2D4739',
    '#4A90E2',
    '#E57373',
    '#F5A623',
    '#8E24AA',
    '#26A69A',
  ];

  const retentionOptions = [
    { value: 'never', label: 'Never' },
    { value: '1', label: '1 day' },
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
  ];

  const permissionsList: Array<{
    type: 'microphone' | 'accessibility' | 'screen_recording' | 'system_events';
    label: string;
    description: string;
    canRequestDirectly: boolean;
    settingsSection: string;
  }> = [
    {
      type: 'microphone',
      label: 'Microphone',
      description: 'Required for voice transcription',
      canRequestDirectly: true,
      settingsSection: 'Privacy_Microphone',
    },
    {
      type: 'accessibility',
      label: 'Accessibility',
      description: 'Required for keyboard shortcuts and text paste',
      canRequestDirectly: false,
      settingsSection: 'Privacy_Accessibility',
    },
    {
      type: 'screen_recording',
      label: 'Screen Recording',
      description: 'Required for screenshots',
      canRequestDirectly: false,
      settingsSection: 'Privacy_ScreenCapture',
    },
  ];

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Appearance</div>
        <div style={rowStyle}>
          <span style={labelStyle}>Dark Mode</span>
          <Toggle
            checked={settings.appearance?.dark_mode ?? true}
            onChange={(value) => updateAppearance({ dark_mode: value })}
          />
        </div>
        <div style={{ ...rowStyle, borderBottom: 'none' }}>
          <span style={labelStyle}>Accent Color</span>
        </div>
        <div style={colorSwatchesStyle}>
          {accentColors.map((color) => (
            <div
              key={color}
              style={swatchStyle(color, settings.appearance?.accent_color === color)}
              onClick={() => updateAppearance({ accent_color: color })}
            />
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>System Access</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {permissionsList.map((perm) => (
            <PermissionRow
              key={perm.type}
              type={perm.type}
              label={perm.label}
              description={perm.description}
              granted={permissions[perm.type] ?? false}
              canRequestDirectly={perm.canRequestDirectly}
              onRequest={() => requestPermission(perm.type)}
              onOpenSettings={() => openSystemSettings(perm.settingsSection)}
            />
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Data Retention</div>
        <div style={rowStyle}>
          <span style={labelStyle}>Auto-delete transcripts after</span>
          <select
            style={selectStyle}
            value={settings.data_retention?.auto_delete_after ?? 'never'}
            onChange={(e) => updateDataRetention({ auto_delete_after: e.target.value })}
          >
            {retentionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
