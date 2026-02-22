import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { AudioDevice } from '../../types';

interface AppShellProps {
  children: React.ReactNode;
  showMicSelector?: boolean;
  audioDevices?: AudioDevice[];
  priorityMic?: string | null;
  onMicChange?: (name: string | null) => void;
}

export function AppShell({
  children,
  showMicSelector = true,
  audioDevices = [],
  priorityMic,
  onMicChange,
}: AppShellProps) {
  const navigate = useNavigate();
  const titleBarStyle: React.CSSProperties & { WebkitAppRegion: string } = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '52px',
    paddingLeft: '70px',
    paddingRight: '20px',
    backgroundColor: 'var(--color-background-secondary)',
    WebkitAppRegion: 'drag',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--color-text)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '0.2px',
  };

  const micSelectorStyle: React.CSSProperties & { WebkitAppRegion: string } = {
    WebkitAppRegion: 'no-drag',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 14px',
    fontSize: '12px',
    backgroundColor: 'var(--color-card-hover)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-full)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minWidth: '180px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
  };

  const handleMicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onMicChange?.(value === 'default' ? null : value);
  };

  return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        paddingTop: '44px',
        backgroundColor: 'var(--color-background)',
      }}>
      <div style={titleBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', ...titleStyle }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
            </svg>
            Alfred
          </span>
          <button
            onClick={() => navigate('/settings')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              WebkitAppRegion: 'no-drag',
              color: 'var(--color-text-secondary)',
              borderRadius: 'var(--radius-full)',
              transition: 'all 200ms ease',
            } as any}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-text)';
              e.currentTarget.style.backgroundColor = 'var(--color-card)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
        {showMicSelector && (
          <div style={{ ...micSelectorStyle, backgroundColor: 'var(--color-card)', padding: '6px', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-sm)' }}>
            <select
              style={selectStyle}
              value={priorityMic || 'default'}
              onChange={handleMicChange}
            >
              <option value="default">Default</option>
              {audioDevices.map(device => (
                <option key={device.name} value={device.name}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div style={contentStyle}>
        {children}
      </div>
    </div>
  );
}
