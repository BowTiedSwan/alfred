import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/shared';
import { startModelDownload, connectEditor } from '../../types/commands';
import { listen } from '@tauri-apps/api/event';
import type { DownloadProgress } from '../../types';

export function DownloadModel() {
  const navigate = useNavigate();
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [progress, setProgress] = useState(0);
  const [editors, setEditors] = useState<Record<string, boolean>>({
    claude_code: false,
    cursor: false,
    codex: false,
    opencode: false,
  });

  useEffect(() => {
    const unlisten = listen<DownloadProgress>('download_progress', (event) => {
      setProgress(event.payload.percent);
      if (event.payload.percent >= 100) {
        setDownloadState('done');
      }
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleDownload = async () => {
    setDownloadState('downloading');
    try {
      await startModelDownload('base');
    } catch {
      setDownloadState('idle');
    }
  };

  const handleConnect = async (editor: 'claude_code' | 'cursor' | 'codex' | 'opencode') => {
    const result = await connectEditor(editor);
    if (result) {
      setEditors((prev) => ({ ...prev, [editor]: true }));
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '48px',
    backgroundColor: 'var(--color-background)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '480px',
    width: '100%',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: '8px',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'var(--color-text-secondary)',
    marginBottom: '24px',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '32px',
  };

  const modelRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  };

  const modelLabelStyle: React.CSSProperties = {
    fontWeight: 600,
    color: 'var(--color-text)',
  };

  const modelSizeStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    marginLeft: '8px',
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
    fontSize: '11px',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 500,
  };

  const modelDescStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  };

  const progressContainerStyle: React.CSSProperties = {
    height: '6px',
    backgroundColor: 'var(--color-border)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '12px',
  };

  const progressFillStyle: React.CSSProperties = {
    height: '100%',
    width: `${progress}%`,
    backgroundColor: 'var(--color-success)',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  };

  const downloadedStyle: React.CSSProperties = {
    color: 'var(--color-success)',
    fontWeight: 500,
    marginTop: '12px',
  };

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border)',
    paddingBottom: '8px',
    marginBottom: '16px',
  };

  const editorRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid var(--color-border)',
  };

  const editorNameStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    fontWeight: 500,
  };

  const dotsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '32px',
  };

  const dotStyle = (active: boolean): React.CSSProperties => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: active ? 'var(--color-primary)' : 'var(--color-border)',
  });

  const editorNames: Record<string, string> = {
    claude_code: 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex',
    opencode: 'OpenCode',
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Download Voice Model</h1>
        <p style={subtitleStyle}>
          This model runs locally on your Mac for private, offline transcription.
        </p>

        <div style={cardStyle}>
          <div style={modelRowStyle}>
            <div>
              <span style={modelLabelStyle}>English Model</span>
              <span style={modelSizeStyle}>466 MB</span>
            </div>
            <span style={badgeStyle}>RECOMMENDED</span>
          </div>
          <p style={modelDescStyle}>Fast and reliable accuracy for English</p>

          {downloadState === 'idle' && (
            <Button variant="primary" size="md" onClick={handleDownload} style={{ marginTop: '12px', width: '100%' }}>
              Download
            </Button>
          )}

          {downloadState === 'downloading' && (
            <div style={progressContainerStyle}>
              <div style={progressFillStyle} />
            </div>
          )}

          {downloadState === 'done' && (
            <p style={downloadedStyle}>Downloaded ✓</p>
          )}
        </div>

        <div>
          <div style={sectionLabelStyle}>EDITOR INTEGRATIONS</div>
          {(Object.keys(editors) as Array<keyof typeof editors>).map((editor) => (
            <div key={editor} style={editorRowStyle}>
              <span style={editorNameStyle}>{editorNames[editor]}</span>
              {editors[editor] ? (
                <Button variant="secondary" size="sm" disabled>
                  Connected
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => handleConnect(editor as 'claude_code' | 'cursor' | 'codex' | 'opencode')}>
                  Connect
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          size="lg"
          style={{ width: '100%', marginTop: '24px' }}
          onClick={() => navigate('/onboarding/shortcuts')}
        >
          Continue
        </Button>

        <div style={dotsContainerStyle}>
          <div style={dotStyle(false)} />
          <div style={dotStyle(true)} />
          <div style={dotStyle(false)} />
        </div>
      </div>
    </div>
  );
}