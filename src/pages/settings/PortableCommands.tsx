import { useState, useEffect } from 'react';
import { Button } from '../../components/shared';
import { getPortableCommands, setCommandsDirectory } from '../../types/commands';
import type { PortableCommand } from '../../types';

export function PortableCommands() {
  const [commands, setCommands] = useState<PortableCommand[]>([]);
  const [directory, setDirectory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCommands();
  }, []);

  const loadCommands = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPortableCommands();
      setCommands(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setCommands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowse = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === 'string') {
        await setCommandsDirectory(selected);
        setDirectory(selected);
        await loadCommands();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const containerStyle: React.CSSProperties = {
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '11px',
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: '0.8px',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '8px',
    marginBottom: '16px',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border)',
  };

  const labelStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    fontSize: '14px',
  };

  const pathStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    fontSize: '13px',
    fontFamily: 'monospace',
  };

  const commandItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    backgroundColor: 'var(--color-card)',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid var(--color-border)',
  };

  const commandNameStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '4px',
  };

  const commandPathStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    fontSize: '12px',
    fontFamily: 'monospace',
  };

  const emptyStateStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    fontSize: '14px',
    padding: '24px 0',
    textAlign: 'center',
  };

  const errorStyle: React.CSSProperties = {
    color: 'var(--color-error)',
    fontSize: '13px',
    padding: '12px 0',
    textAlign: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={sectionHeaderStyle}>Portable Commands</div>
      
      <div style={rowStyle}>
        <div>
          <div style={labelStyle}>Command Directory</div>
          <div style={pathStyle}>
            {directory ?? 'Not set'}
          </div>
        </div>
        <Button variant="primary" onClick={handleBrowse}>
          Browse
        </Button>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={{ marginTop: '24px' }}>
        <div style={{ ...sectionHeaderStyle, marginTop: '16px' }}>Commands</div>
        
        {loading ? (
          <div style={emptyStateStyle}>Loading...</div>
        ) : commands.length === 0 ? (
          <div style={emptyStateStyle}>
            No commands found. Set a directory containing .md command files.
          </div>
        ) : (
          commands.map((command) => (
            <div key={command.name} style={commandItemStyle}>
              <div style={commandNameStyle}>{command.name}</div>
              <div style={commandPathStyle}>{command.path}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
