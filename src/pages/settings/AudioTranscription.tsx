import { useState, useEffect } from 'react';
import { useSettings, useAudio } from '../../hooks';
import { Button } from '../../components/shared';
import { getWordCorrections, addWordCorrection, removeWordCorrection, getAvailableModels, startModelDownload } from '../../types/commands';
import { listen } from '@tauri-apps/api/event';
import type { WordCorrection } from '../../types';

interface VoiceModel {
  id: string;
  url: string;
  downloaded: boolean;
}

interface DownloadProgress {
  model_id: string;
  percent: number;
  bytes_downloaded: number;
  total_bytes: number;
}

export function AudioTranscription() {
  const { settings, updateAudio } = useSettings();
  const { audioDevices, priorityMic, setPriorityMic } = useAudio();
  const [corrections, setCorrections] = useState<WordCorrection[]>([]);
  const [newHeardAs, setNewHeardAs] = useState('');
  const [newChangeTo, setNewChangeTo] = useState('');
  const [models, setModels] = useState<VoiceModel[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgress>>({});
  const [downloading, setDownloading] = useState<Set<string>>(new Set());


  useEffect(() => {
    getWordCorrections().then(setCorrections);
    loadModels();
    const unlistenPromise = listen<DownloadProgress>('download_progress', (event) => {
      setDownloadProgress((prev) => ({
        ...prev,
        [event.payload.model_id]: event.payload,
      }));
      if (event.payload.percent >= 100) {
        setTimeout(() => {
          loadModels();
        }, 500);
      }
    });
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const loadModels = async () => {
    try {
      const availableModels = await getAvailableModels() as unknown as VoiceModel[];
      setModels(availableModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };



  const handleDownloadModel = async (modelId: string) => {
    setDownloading((prev) => new Set([...prev, modelId]));
    try {
      await startModelDownload(modelId);
    } catch (error) {
      console.error('Failed to download model:', error);
      setDownloading((prev) => {
        const next = new Set(prev);
        next.delete(modelId);
        return next;
      });
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

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px',
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

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text)',
    fontSize: '14px',
    cursor: 'pointer',
    minWidth: '200px',
  };

  const modelListStyle: React.CSSProperties = {
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const modelItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'var(--color-card)',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
  };

  const modelInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const modelNameStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    fontSize: '14px',
    fontWeight: 500,
  };

  const modelSizeStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    fontSize: '12px',
  };

  const progressBarStyle: React.CSSProperties = {
    width: '100%',
    height: '4px',
    backgroundColor: 'var(--color-border)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '8px',
  };

  const progressFillStyle: (percent: number) => React.CSSProperties = (percent) => ({
    height: '100%',
    width: `${percent}%`,
    backgroundColor: 'var(--color-success)',
    transition: 'width 0.2s ease',
  });

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: 'var(--color-success)',
    color: 'white',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
  };

  const downloadButtonStyle: React.CSSProperties = {
    padding: '6px 16px',
    backgroundColor: 'var(--color-text)',
    color: 'var(--color-card)',
    border: 'none',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const correctionItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: 'var(--color-card)',
    borderRadius: '6px',
    marginBottom: '8px',
  };

  const correctionTextStyle: React.CSSProperties = {
    color: 'var(--color-text)',
    fontSize: '14px',
  };

  const arrowStyle: React.CSSProperties = {
    color: 'var(--color-text-secondary)',
    margin: '0 12px',
  };

  const deleteBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--color-error)',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px 8px',
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-card)',
    color: 'var(--color-text)',
    fontSize: '14px',
  };

  const engineOptions = [
    { value: 'whisper', label: 'Whisper' },
    { value: 'qwen', label: 'Qwen' },
  ];

  const modelSizes: Record<string, string> = {
    tiny: '~39MB',
    base: '~142MB',
    small: '~466MB',
  };

  const handleAddCorrection = async () => {
    if (newHeardAs.trim() && newChangeTo.trim()) {
      await addWordCorrection(newHeardAs.trim(), newChangeTo.trim());
      const updated = await getWordCorrections();
      setCorrections(updated);
      setNewHeardAs('');
      setNewChangeTo('');
    }
  };

  const handleRemoveCorrection = async (heardAs: string) => {
    await removeWordCorrection(heardAs);
    const updated = await getWordCorrections();
    setCorrections(updated);
  };

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Microphone</div>
        <div style={rowStyle}>
          <span style={labelStyle}>Priority Mic</span>
          <select
            style={selectStyle}
            value={priorityMic ?? 'default'}
            onChange={(e) => setPriorityMic(e.target.value === 'default' ? null : e.target.value)}
          >
            <option value="default">System Default</option>
            {audioDevices.map((device) => (
              <option key={device.name} value={device.name}>
                {device.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Transcription Engine</div>
        <div style={rowStyle}>
          <span style={labelStyle}>Engine</span>
          <select
            style={selectStyle}
            value={settings.audio?.engine ?? 'whisper'}
            onChange={(e) => updateAudio({ engine: e.target.value as 'whisper' | 'qwen' })}
          >
            {engineOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div style={modelListStyle}>
          {models.map((model) => {
            const progress = downloadProgress[model.id];
            const isDownloading = downloading.has(model.id) || (progress && progress.percent < 100);
            
            return (
              <div key={model.id} style={modelItemStyle}>
                <div style={modelInfoStyle}>
                  <div style={modelNameStyle}>{model.id.charAt(0).toUpperCase() + model.id.slice(1)}</div>
                  <div style={modelSizeStyle}>{modelSizes[model.id] || 'Unknown size'}</div>
                  {isDownloading && progress && (
                    <>
                      <div style={progressBarStyle}>
                        <div style={progressFillStyle(progress.percent)} />
                      </div>
                      <div style={modelSizeStyle}>{progress.percent}% ({Math.round(progress.bytes_downloaded / 1024 / 1024)}MB / {Math.round(progress.total_bytes / 1024 / 1024)}MB)</div>
                    </>
                  )}
                </div>
                <div>
                  {model.downloaded ? (
                    <div style={badgeStyle}>Installed</div>
                  ) : (
                    <button
                      style={downloadButtonStyle}
                      onClick={() => handleDownloadModel(model.id)}
                      disabled={isDownloading}
                    >
                      {isDownloading ? 'Downloading...' : 'Download'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Word Corrections</div>
        {corrections.length === 0 ? (
          <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px', padding: '12px 0' }}>
            No word corrections configured.
          </div>
        ) : (
          corrections.map((correction) => (
            <div key={correction.heard_as} style={correctionItemStyle}>
              <div>
                <span style={correctionTextStyle}>{correction.heard_as}</span>
                <span style={arrowStyle}>→</span>
                <span style={correctionTextStyle}>{correction.change_to}</span>
              </div>
              <button
                style={deleteBtnStyle}
                onClick={() => handleRemoveCorrection(correction.heard_as)}
              >
                ×
              </button>
            </div>
          ))
        )}
        <div style={formStyle}>
          <input
            type="text"
            placeholder="Heard as"
            style={inputStyle}
            value={newHeardAs}
            onChange={(e) => setNewHeardAs(e.target.value)}
          />
          <input
            type="text"
            placeholder="Change to"
            style={inputStyle}
            value={newChangeTo}
            onChange={(e) => setNewChangeTo(e.target.value)}
          />
          <Button variant="primary" onClick={handleAddCorrection}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
