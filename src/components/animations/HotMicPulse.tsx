import React, { useState, useEffect } from 'react';

interface HotMicPulseProps {
  status: 'off' | 'listening' | 'processing';
  transcript?: string;
  wordCount?: number;
}

export function HotMicPulse({ status, transcript = '', wordCount = 0 }: HotMicPulseProps) {
  const [expanded, setExpanded] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'off') {
      setVisible(true);
      if (wordCount >= 5) {
        setExpanded(true);
      }
    } else {
      setExpanded(false);
      const timeout = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [status, wordCount]);

  useEffect(() => {
    if (status === 'off') {
      setExpanded(false);
    }
  }, [status]);

  if (!visible) return null;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '12px',
    left: '50%',
    transform: `translateX(-50%) ${expanded ? 'scale(1)' : 'scale(0.95)'}`,
    backgroundColor: expanded ? 'var(--color-card)' : 'rgba(0, 0, 0, 0.75)',
    borderRadius: expanded ? '12px' : '20px',
    padding: expanded ? '12px 16px' : '6px 12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: expanded ? '12px' : '8px',
    minWidth: expanded ? '200px' : 'auto',
    maxWidth: expanded ? '400px' : 'none',
    transition: 'all 0.3s ease',
    zIndex: 1000,
    opacity: status === 'off' ? 0 : 1,
  };

  const dotStyle: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: status === 'listening' ? '#FF9800' : status === 'processing' ? '#4CAF50' : '#9E9E9E',
    animation: status === 'listening' ? 'pulse 1.5s ease-in-out infinite' : 'none',
    flexShrink: 0,
  };

  const textStyle: React.CSSProperties = {
    fontSize: expanded ? '14px' : '12px',
    color: expanded ? 'var(--color-text)' : '#FFFFFF',
    whiteSpace: expanded ? 'normal' : 'nowrap',
    overflow: expanded ? 'hidden' : 'visible',
    textOverflow: expanded ? 'ellipsis' : 'none',
    maxWidth: expanded ? '300px' : 'none',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const statusTextStyle: React.CSSProperties = {
    fontSize: '11px',
    color: expanded ? 'var(--color-text-secondary)' : 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  };

  return (
    <div style={containerStyle}>
      <div style={dotStyle} />
      {expanded ? (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={textStyle}>{transcript || 'Listening...'}</div>
          <div style={statusTextStyle}>{status === 'listening' ? 'Hot Mic Active' : 'Processing'}</div>
        </div>
      ) : (
        <span style={textStyle}>
          {status === 'listening' ? 'Listening' : 'Processing'}
        </span>
      )}
    </div>
  );
}