import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout';

export function SettingsLayout() {
  const navigate = useNavigate();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flex: 1,
    backgroundColor: 'var(--color-background)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: 0,
    padding: '20px 20px 20px 0',
    gap: '16px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    padding: '32px',
    overflowY: 'auto',
    maxWidth: '600px',
    backgroundColor: 'var(--color-card)',
    borderRadius: '20px 0 0 20px',
    boxShadow: 'var(--shadow-md)',
  };

  const backStyle: React.CSSProperties = {
    cursor: 'pointer',
    color: 'var(--color-text-secondary)',
    marginBottom: '24px',
    fontSize: '13px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: 'var(--radius-full)',
    transition: 'all 200ms ease',
  };

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={contentStyle}>
        <div
          style={backStyle}
          onClick={() => navigate('/')}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
            e.currentTarget.style.color = 'var(--color-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </div>
        <Outlet />
      </div>
    </div>
  );
}
