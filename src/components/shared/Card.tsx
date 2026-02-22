import React from 'react';

interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
}

const paddingStyles = {
  none: { padding: 0 },
  sm: { padding: '16px' },
  md: { padding: '24px' },
  lg: { padding: '32px' },
};

export function Card({
  children,
  padding = 'md',
  style,
  onClick,
  hoverable = false,
}: CardProps) {
  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-card)',
    border: 'none',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-md)',
    cursor: onClick || hoverable ? 'pointer' : 'default',
    transition: hoverable ? 'box-shadow 200ms ease' : 'none',
    ...paddingStyles[padding],
    ...style,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable) {
      const target = e.currentTarget;
      target.style.boxShadow = 'var(--shadow-lg)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hoverable) {
      const target = e.currentTarget;
      target.style.boxShadow = 'var(--shadow-md)';
    }
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '12px',
    }}>
      <div>
        <h3 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: 'var(--color-text)',
          margin: 0,
        }}>
          {title}
        </h3>
        {subtitle && (
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            margin: '4px 0 0 0',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

interface CardSectionProps {
  title?: string;
  children: React.ReactNode;
  border?: boolean;
}

export function CardSection({ title, children, border = true }: CardSectionProps) {
  return (
    <div style={{
      paddingTop: '16px',
      borderTop: border ? '1px solid var(--color-border)' : 'none',
      marginTop: border ? '16px' : 0,
    }}>
      {title && (
        <h4 style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          margin: '0 0 12px 0',
        }}>
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}
