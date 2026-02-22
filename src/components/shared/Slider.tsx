import React from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  showValue?: boolean;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  showValue = true,
}: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  };

  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '6px',
    backgroundColor: 'var(--color-border)',
    borderRadius: '3px',
    cursor: disabled ? 'not-allowed' : 'pointer',
  };

  const fillStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    width: `${percentage}%`,
    backgroundColor: 'var(--color-primary)',
    borderRadius: '3px',
    transition: 'width 0.1s ease',
  };

  const thumbStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: `${percentage}%`,
    transform: 'translate(-50%, -50%)',
    width: '16px',
    height: '16px',
    backgroundColor: 'var(--color-primary)',
    borderRadius: '50%',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    cursor: disabled ? 'not-allowed' : 'grab',
    transition: 'transform 0.1s ease',
  };

  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    opacity: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    margin: 0,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  return (
    <div style={containerStyle}>
      {(label || showValue) && (
        <div style={labelRowStyle}>
          {label && (
            <span style={{
              fontSize: '14px',
              color: 'var(--color-text)',
            }}>
              {label}
            </span>
          )}
          {showValue && (
            <span style={{
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              fontWeight: 500,
            }}>
              {value}
            </span>
          )}
        </div>
      )}
      <div style={trackStyle}>
        <div style={fillStyle} />
        <div style={thumbStyle} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          style={inputStyle}
        />
      </div>
    </div>
  );
}