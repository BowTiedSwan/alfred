import React from 'react';
import { NavLink } from 'react-router-dom';
import type { SettingsRoute, NavItem } from '../../types';

const navItems: NavItem[] = [
  { id: 'appearance', label: 'Appearance & System' },
  { id: 'audio', label: 'Audio & Transcription' },
  { id: 'shortcuts', label: 'Keyboard Shortcuts' },
  { id: 'hot-mic', label: 'Hot Mic' },
  { id: 'commands', label: 'Portable Commands' },
  { id: 'integrations', label: 'Editor Integrations' },
];

interface SidebarProps {
  activeRoute?: SettingsRoute;
  onNavigate?: (route: SettingsRoute) => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const containerStyle: React.CSSProperties = {
    width: '250px',
    minWidth: '250px',
    backgroundColor: 'var(--color-card)',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '0 20px 20px 0',
    boxShadow: 'var(--shadow-md)',
  };

  const headerStyle: React.CSSProperties = {
    padding: '44px 18px 14px',
    marginBottom: '6px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--color-text)',
    margin: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const getNavItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    fontWeight: 500,
    color: isActive ? 'var(--color-card)' : 'var(--color-text)',
    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    borderRadius: 'var(--radius-full)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  });

  const iconStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    flexShrink: 0,
  };

  const renderNavIcon = (id: SettingsRoute) => {
    switch (id) {
      case 'appearance':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="13.5" cy="6.5" r="2.5" />
            <circle cx="18" cy="13" r="2" />
            <circle cx="6" cy="12" r="2" />
            <path d="M13.5 9v3.5" />
            <path d="M15.5 14.5H9.5" />
            <path d="M7.5 9.5l3 4" />
          </svg>
        );
      case 'audio':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H3v6h3l5 4V5z" />
            <path d="M15 9a4 4 0 0 1 0 6" />
            <path d="M17.5 6.5a7 7 0 0 1 0 11" />
          </svg>
        );
      case 'shortcuts':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="3" />
            <path d="M7 10h.01" />
            <path d="M11 10h.01" />
            <path d="M15 10h.01" />
            <path d="M7 14h10" />
          </svg>
        );
      case 'hot-mic':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="2" width="6" height="12" rx="3" ry="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v4" />
          </svg>
        );
      case 'commands':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 17l6-5-6-5" />
            <path d="M12 17h8" />
          </svg>
        );
      case 'integrations':
        return (
          <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 3v6" />
            <path d="M15 15v6" />
            <path d="M15 9V3" />
            <path d="M9 21v-6" />
            <path d="M7 9h4" />
            <path d="M13 15h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleClick = (route: SettingsRoute) => {
    onNavigate?.(route);
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
          </svg>
          Settings
        </h2>
      </div>
      <nav style={navStyle}>
        {navItems.map(item => (
          <NavLink
            key={item.id}
            to={`/settings/${item.id}`}
            style={({ isActive }) => getNavItemStyle(isActive)}
            onClick={() => handleClick(item.id)}
            onMouseEnter={(e) => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.backgroundColor = 'var(--color-background-secondary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {renderNavIcon(item.id)}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
