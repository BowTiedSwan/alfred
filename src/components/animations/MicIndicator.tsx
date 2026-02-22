import React from 'react';
import type { RecordingStatus, HotMicStatus } from '../../types';

type MicStatus = RecordingStatus | HotMicStatus;

interface MicIndicatorProps {
  status: MicStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function MicIndicator({ status, size = 'md' }: MicIndicatorProps) {
  const dimensions = size === 'sm' ? 40 : size === 'md' ? 64 : 96;
  const iconSize = size === 'sm' ? 18 : size === 'md' ? 26 : 34;

  const containerStyle: React.CSSProperties = {
    width: dimensions,
    height: dimensions,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: `1.5px solid ${getRingColor(status)}`,
    backgroundColor: getBackgroundColor(status),
    transition: 'all 300ms ease',
    animation: status === 'recording' ? 'breathe 2s ease-in-out infinite' : undefined,
    boxShadow: status === 'recording' ? '0 0 0 6px var(--color-error-light)' : 'none',
  };

  const iconStyle: React.CSSProperties = {
    width: iconSize,
    height: iconSize,
    color: getIconColor(status),
    transition: 'color 300ms ease, transform 300ms ease',
    animation: status === 'processing' ? 'spin 1s linear infinite' : undefined,
  };

  return (
    <div style={containerStyle}>
      {status === 'processing' ? (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      ) : (
        <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="2" width="6" height="12" rx="3" ry="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v4" />
        </svg>
      )}
    </div>
  );
}

function getRingColor(status: MicStatus): string {
  switch (status) {
    case 'recording':
      return 'var(--color-error)';
    case 'listening':
      return 'var(--color-primary)';
    case 'processing':
      return 'var(--color-warning)';
    default:
      return 'var(--color-border)';
  }
}

function getBackgroundColor(status: MicStatus): string {
  switch (status) {
    case 'recording':
      return 'var(--color-error-light)';
    case 'listening':
      return 'var(--color-card-hover)';
    case 'processing':
      return 'var(--color-warning-light)';
    default:
      return 'var(--color-card-hover)';
  }
}

function getIconColor(status: MicStatus): string {
  switch (status) {
    case 'recording':
      return 'var(--color-error)';
    case 'listening':
      return 'var(--color-text)';
    case 'processing':
      return 'var(--color-warning)';
    default:
      return 'var(--color-text)';
  }
}
