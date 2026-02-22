import { useState } from 'react';
import type { TranscriptEntry } from '../../types';

interface TranscriptViewProps {
  transcripts: TranscriptEntry[];
  onDelete: (id: string) => void;
  currentText: string;
}

export function TranscriptView({ transcripts, onDelete, currentText }: TranscriptViewProps) {
  const [searchText, setSearchText] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    gap: '12px',
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-xl)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text)',
    fontSize: '14px',
    outline: 'none',
  };

  const listStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const entryStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px 14px',
    gap: '12px',
    borderRadius: 'var(--radius-md)',
    transition: 'background-color 200ms ease',
  };

  const iconStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    flexShrink: 0,
    color: 'var(--color-text-secondary)',
    marginTop: '2px',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const textStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    fontSize: '14px',
    wordBreak: 'break-word',
    lineHeight: 1.5,
  };



  const metaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0,
    minWidth: '64px',
  };

  const timeStyle: React.CSSProperties = {
    fontSize: '11px',
    color: 'var(--color-text-tertiary)',
    textAlign: 'right',
    width: '100%',
  };

  const deleteButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    opacity: 0,
    padding: '2px',
    borderRadius: 'var(--radius-full)',
    alignSelf: 'flex-end',
    transition: 'all 200ms ease',
  };

  const liveEntryStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: 'var(--color-card-hover)',
    borderRadius: 'var(--radius-md)',
    gap: '12px',
    color: 'var(--color-text-secondary)',
  };

  const pulseDotStyle: React.CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-success)',
    animation: 'pulse 1.5s ease-in-out infinite',
  };

  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    padding: '32px 24px',
    gap: '10px',
  };

  const emptyTitleStyle: React.CSSProperties = {
    fontSize: '17px',
    fontWeight: 500,
    color: 'var(--color-text)',
  };

  const emptySubtitleStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  };

  const emptyIconStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    color: 'var(--color-text-tertiary)',
    marginBottom: '4px',
  };

  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = Math.floor((now - timestamp) / 1000);

    if (diff < 10) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const filteredTranscripts = transcripts.filter((entry) =>
    entry.text.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={containerStyle}>
      <input
        type="text"
        placeholder="Search transcriptions..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={searchInputStyle}
      />

      <div style={listStyle}>
        {currentText && (
          <div style={liveEntryStyle}>
            <div style={pulseDotStyle} />
            <span style={textStyle}>{currentText}</span>
          </div>
        )}

        {filteredTranscripts.length === 0 && !currentText ? (
          <div style={emptyStateStyle}>
            <svg style={emptyIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v18" />
              <path d="M3 12h18" />
              <circle cx="12" cy="12" r="9" />
            </svg>
            <p style={emptyTitleStyle}>No transcriptions yet.</p>
            <p style={emptySubtitleStyle}>Press ⌘+\ to start recording.</p>
          </div>
        ) : (
          filteredTranscripts.map((entry) => (
            <div
              key={entry.id}
              style={{
                ...entryStyle,
                backgroundColor: hoveredId === entry.id ? 'var(--color-card-hover)' : 'transparent',
              }}
              onMouseEnter={() => setHoveredId(entry.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {entry.type === 'command' ? (
                <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
                </svg>
              ) : (
                <svg style={iconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="2" width="6" height="12" rx="3" ry="3" />
                  <path d="M5 11a7 7 0 0 0 14 0" />
                  <path d="M12 18v4" />
                </svg>
              )}
              <div style={contentStyle}>
                <span style={textStyle}>
                  {entry.text}
                </span>
              </div>
              <div style={metaStyle}>
                <span style={timeStyle}>{getRelativeTime(entry.timestamp)}</span>
                <button
                  style={{
                    ...deleteButtonStyle,
                    opacity: hoveredId === entry.id ? 1 : 0,
                  }}
                  onClick={() => onDelete(entry.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                    e.currentTarget.style.color = 'var(--color-text)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
