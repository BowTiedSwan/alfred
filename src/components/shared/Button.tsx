import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-card)',
    border: 'none',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    border: '1.5px solid var(--color-primary)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    border: 'none',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: '8px 18px',
    fontSize: '13px',
    borderRadius: 'var(--radius-full)',
  },
  md: {
    padding: '10px 24px',
    fontSize: '14px',
    borderRadius: 'var(--radius-full)',
  },
  lg: {
    padding: '12px 28px',
    fontSize: '16px',
    borderRadius: 'var(--radius-full)',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 500,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    transition: 'all 200ms ease',
    outline: 'none',
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      onMouseEnter?.(e);
      return;
    }

    if (variant === 'primary') {
      e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
    }
    if (variant === 'secondary') {
      e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
    }
    if (variant === 'ghost') {
      e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
      e.currentTarget.style.color = 'var(--color-text)';
    }

    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (variant === 'primary') {
      e.currentTarget.style.backgroundColor = 'var(--color-primary)';
    }
    if (variant === 'secondary') {
      e.currentTarget.style.backgroundColor = 'transparent';
    }
    if (variant === 'ghost') {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'var(--color-text-secondary)';
    }

    onMouseLeave?.(e);
  };

  return (
    <button
      style={baseStyle}
      disabled={disabled || loading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading ? (
        <span style={{
          width: '14px',
          height: '14px',
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      ) : icon}
      {children}
    </button>
  );
}
