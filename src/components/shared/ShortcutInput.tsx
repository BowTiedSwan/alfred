import React, { useState, useEffect, useCallback } from 'react';

interface ShortcutInputProps {
  value: string;
  onChange: (shortcut: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

function formatShortcut(shortcut: string): string {
  return shortcut
    .replace(/CommandOrControl/g, '⌘')
    .replace(/Command/g, '⌘')
    .replace(/Control/g, 'Ctrl')
    .replace(/Alt/g, 'Alt')
    .replace(/Shift/g, '⇧')
    .replace(/Super/g, '⌘')
    .replace(/\+/g, ' + ');
}

export function ShortcutInput({
  value,
  onChange,
  placeholder = 'Click to record shortcut',
  disabled = false,
}: ShortcutInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isRecording) return;

    event.preventDefault();
    event.stopPropagation();

    const modifiers: string[] = [];
    if (event.metaKey) modifiers.push('Command');
    if (event.ctrlKey) modifiers.push('Control');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');

    const key = event.key.length === 1 ? event.key.toUpperCase() : event.key;

    if (modifiers.length === 0 && key.length > 1) {
      return;
    }

    if (modifiers.length > 0) {
      const shortcut = [...modifiers, key].join('+');
      onChange(shortcut);
      setIsRecording(false);
      setError(null);
    }
  }, [isRecording, onChange]);

  useEffect(() => {
    if (isRecording) {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [isRecording, handleKeyDown]);

  const handleClick = () => {
    if (!disabled) {
      setIsRecording(true);
      setError(null);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsRecording(false);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: isRecording ? 'var(--color-primary-light)' : 'var(--color-card)',
    border: `1px solid ${isRecording ? 'var(--color-primary)' : 'var(--color-border)'}`,
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minWidth: '160px',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
  };

  const textStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '14px',
    color: value ? 'var(--color-text)' : 'var(--color-text-secondary)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const clearButtonStyle: React.CSSProperties = {
    padding: '2px 6px',
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    opacity: 0.6,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={containerStyle} onClick={handleClick}>
        <span style={textStyle}>
          {isRecording ? 'Press a shortcut...' : value ? formatShortcut(value) : placeholder}
        </span>
        {value && !isRecording && !disabled && (
          <button style={clearButtonStyle} onClick={handleClear}>
            ✕
          </button>
        )}
      </div>
      {error && (
        <span style={{ fontSize: '12px', color: '#E53935' }}>{error}</span>
      )}
    </div>
  );
}