import React from 'react';
import type { PermissionType } from '../../types';

interface PermissionRowProps {
  type: PermissionType;
  label: string;
  description: string;
  granted: boolean;
  canRequestDirectly: boolean;
  onRequest: () => void;
  onOpenSettings: () => void;
}

export function PermissionRow({
  label,
  description,
  granted,
  canRequestDirectly,
  onRequest,
  onOpenSettings,
}: PermissionRowProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    gap: '16px',
  };

  const infoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  };

  const statusDotStyle: React.CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: granted ? '#4CAF50' : 'var(--color-border)',
    flexShrink: 0,
    transition: 'background-color 0.2s ease',
  };

  const textStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--color-text)',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    border: granted ? '1px solid var(--color-border)' : 'none',
    backgroundColor: granted ? 'transparent' : 'var(--color-primary)',
    color: granted ? 'var(--color-text-secondary)' : 'var(--color-background)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={containerStyle}>
      <div style={infoStyle}>
        <div style={statusDotStyle} />
        <div style={textStyle}>
          <span style={labelStyle}>{label}</span>
          <span style={descriptionStyle}>{description}</span>
        </div>
      </div>
      {granted ? (
        <button style={buttonStyle} disabled>
          Granted
        </button>
      ) : canRequestDirectly ? (
        <button style={buttonStyle} onClick={onRequest}>
          Allow
        </button>
      ) : (
        <button style={buttonStyle} onClick={onOpenSettings}>
          Open Settings
        </button>
      )}
    </div>
  );
}