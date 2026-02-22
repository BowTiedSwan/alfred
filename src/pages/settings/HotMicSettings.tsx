import { useState } from 'react';
import { useSettings } from '../../hooks';
import { Toggle, Slider, Button } from '../../components/shared';

export function HotMicSettings() {
  const { settings, updateHotMic } = useSettings();
  const [newSubmitPhrase, setNewSubmitPhrase] = useState('');
  const [newPastePhrase, setNewPastePhrase] = useState('');
  const [newCancelPhrase, setNewCancelPhrase] = useState('');

  const hotMic = settings.hot_mic ?? {
    enabled: false,
    voice_filter_enabled: false,
    voice_filter_strictness: 50,
    submit_phrases: ['send it', 'submit'],
    paste_phrases: ['paste it'],
    cancel_phrases: ['cancel', 'never mind'],
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

  const badgeContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-primary-light)',
    color: 'var(--color-primary)',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const badgeRemoveStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    padding: 0,
    fontSize: '14px',
    lineHeight: 1,
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

  const defaultPhrases = {
    submit_phrases: ['send it', 'submit'],
    paste_phrases: ['paste it'],
    cancel_phrases: ['cancel', 'never mind'],
  };

  const addPhrase = (type: 'submit_phrases' | 'paste_phrases' | 'cancel_phrases', phrase: string) => {
    const current = hotMic[type] ?? [];
    if (phrase.trim() && !current.includes(phrase.trim())) {
      updateHotMic({ [type]: [...current, phrase.trim()] });
    }
  };

  const removePhrase = (type: 'submit_phrases' | 'paste_phrases' | 'cancel_phrases', phrase: string) => {
    const current = hotMic[type] ?? [];
    updateHotMic({ [type]: current.filter((p: string) => p !== phrase) });
  };

  const resetToDefaults = () => {
    updateHotMic({
      submit_phrases: defaultPhrases.submit_phrases,
      paste_phrases: defaultPhrases.paste_phrases,
      cancel_phrases: defaultPhrases.cancel_phrases,
    });
  };

  const renderPhraseList = (
    type: 'submit_phrases' | 'paste_phrases' | 'cancel_phrases',
    title: string,
    newPhrase: string,
    setNewPhrase: (v: string) => void
  ) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ ...labelStyle, marginBottom: '8px' }}>{title}</div>
      <div style={badgeContainerStyle}>
        {(hotMic[type] ?? []).map((phrase: string) => (
          <div key={phrase} style={badgeStyle}>
            {phrase}
            <button
              style={badgeRemoveStyle}
              onClick={() => removePhrase(type, phrase)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={formStyle}>
        <input
          type="text"
          placeholder="Add phrase..."
          style={inputStyle}
          value={newPhrase}
          onChange={(e) => setNewPhrase(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addPhrase(type, newPhrase);
              setNewPhrase('');
            }
          }}
        />
        <Button
          variant="ghost"
          onClick={() => {
            addPhrase(type, newPhrase);
            setNewPhrase('');
          }}
        >
          Add
        </Button>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>Hot Mic</div>
        <div style={rowStyle}>
          <span style={labelStyle}>Enable Hot Mic</span>
          <Toggle
            checked={hotMic.enabled}
            onChange={(value) => updateHotMic({ enabled: value })}
          />
        </div>
      </div>

      {hotMic.enabled && (
        <>
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Voice Filter</div>
            <div style={rowStyle}>
              <span style={labelStyle}>Background Voice Filter</span>
              <Toggle
                checked={hotMic.voice_filter_enabled}
                onChange={(value) => updateHotMic({ voice_filter_enabled: value })}
              />
            </div>
            {hotMic.voice_filter_enabled && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ ...labelStyle, marginBottom: '8px' }}>Strictness</div>
                <Slider
                  min={0}
                  max={100}
                  value={hotMic.voice_filter_strictness}
                  onChange={(value) => updateHotMic({ voice_filter_strictness: value })}
                />
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>Command Phrases</div>
            {renderPhraseList('submit_phrases', 'Submit Phrases', newSubmitPhrase, setNewSubmitPhrase)}
            {renderPhraseList('paste_phrases', 'Paste Phrases', newPastePhrase, setNewPastePhrase)}
            {renderPhraseList('cancel_phrases', 'Cancel Phrases', newCancelPhrase, setNewCancelPhrase)}
          </div>

          <Button variant="ghost" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </>
      )}
    </div>
  );
}