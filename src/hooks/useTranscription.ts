import { useState, useEffect, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getTranscriptionHistory, clearTranscriptionHistory, deleteTranscriptEntry } from '../types/commands';
import type { TranscriptEntry, TranscriptionUpdatePayload, CommandDetectedPayload } from '../types';

export function useTranscription() {
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState('');
  const listenersReady = useRef(false);

  useEffect(() => {
    loadHistory();

    let cancelled = false;
    const unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      // Prevent double-registration from StrictMode
      if (listenersReady.current) return;

      const unlistenTranscription = await listen<TranscriptionUpdatePayload>('transcription_update', (event) => {
        const { text, is_final, timestamp } = event.payload;

        if (is_final) {
          const newEntry: TranscriptEntry = {
            id: `transcript-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text,
            timestamp,
            type: 'transcription',
          };
          setTranscripts(prev => [newEntry, ...prev]);
          setCurrentText('');
        } else {
          setCurrentText(text);
        }
      });

      if (cancelled) { unlistenTranscription(); return; }

      const unlistenCommand = await listen<CommandDetectedPayload>('command_detected', (event) => {
        const { command_name, command_text, timestamp } = event.payload;
        const newEntry: TranscriptEntry = {
          id: `command-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          text: command_text,
          timestamp,
          type: 'command',
          command_name,
        };
        setTranscripts(prev => [newEntry, ...prev]);
      });

      if (cancelled) { unlistenTranscription(); unlistenCommand(); return; }

      unlisteners.push(unlistenTranscription, unlistenCommand);
      listenersReady.current = true;
    };

    setupListeners();

    return () => {
      cancelled = true;
      listenersReady.current = false;
      unlisteners.forEach(unlisten => unlisten());
    };
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const history = await getTranscriptionHistory();
      setTranscripts(history);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transcription history');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      await clearTranscriptionHistory();
      setTranscripts([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
      throw err;
    }
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await deleteTranscriptEntry(id);
      setTranscripts(prev => prev.filter(t => t.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      throw err;
    }
  }, []);

  return {
    transcripts,
    currentText,
    loading,
    error,
    clearHistory,
    deleteEntry,
    reloadHistory: loadHistory,
  };
}
