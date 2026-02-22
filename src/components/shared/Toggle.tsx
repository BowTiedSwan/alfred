import React from 'react';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
}: ToggleProps) {
  const dimensions = size === 'sm' 
    ? { width: 42, height: 24, thumb: 18 }
    : { width: 52, height: 30, thumb: 24 };

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-toggle-off)',
    borderRadius: dimensions.height,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color 200ms ease',
    border: 'none',
    padding: 0,
    flexShrink: 0,
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: (dimensions.height - dimensions.thumb) / 2,
    left: checked ? dimensions.width - dimensions.thumb - 2 : 2,
    width: dimensions.thumb,
    height: dimensions.thumb,
    backgroundColor: 'var(--color-card)',
    borderRadius: '50%',
    boxShadow: 'var(--shadow-sm)',
    transition: 'left 200ms ease',
  };

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleClick}
        style={trackStyle}
        disabled={disabled}
      >
        <span style={thumbStyle} />
      </button>
      {label && (
        <span style={{
          fontSize: '14px',
          color: 'var(--color-text)',
          userSelect: 'none',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
