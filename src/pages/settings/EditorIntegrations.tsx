import { useState, useEffect } from 'react';
import { useSettings } from '../../hooks';
import { Toggle } from '../../components/shared';
import { connectEditor, disconnectEditor, getEditorStatus } from '../../types/commands';


interface EditorConfig {
  id: string;
  name: string;
  description: string;
}

export function EditorIntegrations() {
  const { updateIntegrations } = useSettings();
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});

  const editors: EditorConfig[] = [
    { id: 'claude_code', name: 'Claude Code', description: 'Terminal-based AI assistant' },
    { id: 'cursor', name: 'Cursor', description: 'AI-powered code editor' },
    { id: 'codex', name: 'Codex', description: 'OpenAI code editor' },
    { id: 'opencode', name: 'OpenCode', description: 'Open-source AI coding tool' },
  ];

  useEffect(() => {
    editors.forEach(async (editor) => {
      const running = await getEditorStatus(editor.id as 'claude_code' | 'cursor' | 'codex' | 'opencode');
      setStatuses((prev) => ({
        ...prev,
        [editor.id]: running,
      }));
    });
  }, []);

  const handleToggle = async (editorId: string, enabled: boolean) => {
    if (enabled) {
      await connectEditor(editorId as 'claude_code' | 'cursor' | 'codex' | 'opencode');
    } else {
      await disconnectEditor(editorId as 'claude_code' | 'cursor' | 'codex' | 'opencode');
    }
    const running = await getEditorStatus(editorId as 'claude_code' | 'cursor' | 'codex' | 'opencode');
    setStatuses((prev) => ({
      ...prev,
      [editorId]: running,
    }));
    updateIntegrations({ [editorId]: enabled });
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

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
  };

  const nameStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    fontSize: '15px',
    fontWeight: 600,
    marginBottom: '4px',
  };

  const descriptionStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    fontSize: '13px',
  };

  const statusContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  const statusDotStyle = (connected: boolean): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: connected ? 'var(--color-success)' : 'var(--color-text-secondary)',
  });

  return (
    <div style={containerStyle}>
      <div style={sectionHeaderStyle}>Editor Integrations</div>
      
      {editors.map((editor) => (
        <div key={editor.id} style={cardStyle}>
          <div style={infoStyle}>
            <div style={nameStyle}>{editor.name}</div>
            <div style={descriptionStyle}>{editor.description}</div>
          </div>
          <div style={statusContainerStyle}>
            <div style={statusDotStyle(statuses[editor.id] ?? false)} />
            <Toggle
              checked={statuses[editor.id] ?? false}
              onChange={(value) => handleToggle(editor.id, value)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}