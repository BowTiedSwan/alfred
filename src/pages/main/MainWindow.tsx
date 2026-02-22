import { useNavigate } from 'react-router-dom';
import { useAudio, useTranscription, useSettings } from '../../hooks';
import { Button } from '../../components/shared';
import { AppShell } from '../../components/layout';
import { MicIndicator, HotMicPulse } from '../../components/animations';
import { TranscriptView } from './TranscriptView';

export function MainWindow() {
  const navigate = useNavigate();
  const { audioDevices, priorityMic, setPriorityMic, recordingStatus, hotMicStatus, startRecording, stopRecording, toggleHotMic } = useAudio();
  const { transcripts, currentText, deleteEntry } = useTranscription();
  const {} = useSettings();

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: 'var(--color-background)',
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
    overflow: 'hidden',
    gap: '16px',
  };

  const statusRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 6px',
  };

  const statusTextStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text-secondary)',
    letterSpacing: '0.2px',
  };

  const centerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-card)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: 'var(--shadow-md)',
    padding: '32px',
    gap: '24px',
  };

  const micAreaStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-card-hover)',
    boxShadow: 'inset 0 0 0 6px var(--color-card)',
  };

  const actionRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
  };

  const transcriptContainerStyle: React.CSSProperties = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--color-card)',
    borderRadius: 'var(--radius-2xl)',
    boxShadow: 'var(--shadow-md)',
    padding: '20px',
  };

  const bottomBarStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    backgroundColor: 'var(--color-card)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-sm)',
  };

  const linkStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: 'var(--radius-full)',
    transition: 'all 200ms ease',
  };

  const countStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  };

  const versionStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--color-text-secondary)',
  };

  const hotMicPulseContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  };

  const getStatusText = () => {
    if (recordingStatus === 'recording') return 'Recording...';
    if (hotMicStatus !== 'off') return 'Hot Mic Active';
    return 'Ready';
  };

  const handleRecordToggle = () => {
    if (recordingStatus === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <AppShell showMicSelector audioDevices={audioDevices} priorityMic={priorityMic} onMicChange={setPriorityMic}>
      <div style={containerStyle}>
        {hotMicStatus !== 'off' && (
          <div style={hotMicPulseContainerStyle}>
            <HotMicPulse status="listening" />
          </div>
        )}

        <div style={contentStyle}>
          <div style={statusRowStyle}>
            <span style={statusTextStyle}>{getStatusText()}</span>
            <span style={countStyle}>{transcripts.length} transcripts</span>
          </div>

          <div style={centerStyle}>
            <div style={micAreaStyle}>
              <MicIndicator
                size="lg"
                status={recordingStatus === 'recording' ? 'recording' : 'idle'}
              />
            </div>

            <div style={actionRowStyle}>
              <Button
                variant="primary"
                size="md"
                onClick={handleRecordToggle}
              >
                {recordingStatus === 'recording' ? 'Stop' : 'Record'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={toggleHotMic}
              >
                {hotMicStatus !== 'off' ? 'Disable Hot Mic' : 'Hot Mic'}
              </Button>
            </div>
          </div>

          <div style={transcriptContainerStyle}>
            <TranscriptView
              transcripts={transcripts}
              onDelete={deleteEntry}
              currentText={currentText}
            />
          </div>
        </div>

        <div style={bottomBarStyle}>
          <span
            style={linkStyle}
            onClick={() => navigate('/settings')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </span>
          <span style={countStyle}>Ready to capture</span>
          <span style={versionStyle}>v0.1.0</span>
        </div>
      </div>
    </AppShell>
  );
}
