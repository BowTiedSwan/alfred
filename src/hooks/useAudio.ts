import { useState, useEffect, useCallback, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import {
  startRecording,
  stopRecording,
  toggleHotMic,
  getHotMicStatus,
  getAudioDevices,
  setPriorityMic,
} from '../types/commands';
import type { RecordingStatus, HotMicStatus, AudioDevice, RecordingStatusPayload, HotMicStatusPayload } from '../types';

export function useAudio() {
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [hotMicStatus, setHotMicStatus] = useState<HotMicStatus>('off');
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [priorityMic, setPriorityMicState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listenersReady = useRef(false);

  useEffect(() => {
    loadAudioState();

    let cancelled = false;
    const unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      if (listenersReady.current) return;

      const unlistenRecording = await listen<RecordingStatusPayload>('recording_status', (event) => {
        setRecordingStatus(event.payload.status);
      });

      if (cancelled) { unlistenRecording(); return; }

      const unlistenHotMic = await listen<HotMicStatusPayload>('hot_mic_status', (event) => {
        setHotMicStatus(event.payload.status);
      });

      if (cancelled) { unlistenRecording(); unlistenHotMic(); return; }

      unlisteners.push(unlistenRecording, unlistenHotMic);
      listenersReady.current = true;
    };

    setupListeners();

    return () => {
      cancelled = true;
      listenersReady.current = false;
      unlisteners.forEach(unlisten => unlisten());
    };
  }, []);

  const loadAudioState = useCallback(async () => {
    try {
      setLoading(true);
      const [devices, hotMic] = await Promise.all([
        getAudioDevices(),
        getHotMicStatus(),
      ]);
      setAudioDevices(devices);
      setHotMicStatus(hotMic);
      const defaultDevice = devices.find(d => d.is_default);
      if (defaultDevice) {
        setPriorityMicState(defaultDevice.name);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio state');
    } finally {
      setLoading(false);
    }
  }, []);

  const startRecordingAction = useCallback(async () => {
    try {
      setRecordingStatus('recording');
      await startRecording();
      setError(null);
    } catch (err) {
      setRecordingStatus('idle');
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      throw err;
    }
  }, []);

  const stopRecordingAction = useCallback(async () => {
    try {
      setRecordingStatus('processing');
      const result = await stopRecording();
      setRecordingStatus('idle');
      setError(null);
      return result;
    } catch (err) {
      setRecordingStatus('idle');
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      throw err;
    }
  }, []);

  const toggleHotMicAction = useCallback(async () => {
    try {
      await toggleHotMic();
      setHotMicStatus(prev => prev === 'off' ? 'listening' : 'off');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle hot mic');
      throw err;
    }
  }, []);

  const setPriorityMicAction = useCallback(async (name: string | null) => {
    try {
      await setPriorityMic(name);
      setPriorityMicState(name);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set priority mic');
      throw err;
    }
  }, []);

  return {
    recordingStatus,
    hotMicStatus,
    audioDevices,
    priorityMic,
    loading,
    error,
    startRecording: startRecordingAction,
    stopRecording: stopRecordingAction,
    toggleHotMic: toggleHotMicAction,
    setPriorityMic: setPriorityMicAction,
    reloadAudioState: loadAudioState,
  };
}
