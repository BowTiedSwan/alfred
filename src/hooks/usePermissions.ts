import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { getPermissionsStatus, requestPermission, openSystemSettings } from '../types/commands';
import type { PermissionStatus, PermissionType } from '../types';

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    microphone: false,
    accessibility: false,
    screen_recording: false,
    system_events: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();

    const unlisteners: (() => void)[] = [];

    const setupListeners = async () => {
      const unlisten = await listen<PermissionStatus>('permissions_changed', (event) => {
        setPermissions(event.payload);
      });
      unlisteners.push(unlisten);
    };

    setupListeners();

    return () => {
      unlisteners.forEach(unlisten => unlisten());
    };
  }, []);

  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      const status = await getPermissionsStatus();
      setPermissions(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestPermissionAction = useCallback(async (type: PermissionType): Promise<boolean> => {
    try {
      const granted = await requestPermission(type);
      if (granted) {
        setPermissions(prev => ({ ...prev, [type]: true }));
      }
      setError(null);
      return granted;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      return false;
    }
  }, []);

  const openSystemSettingsAction = useCallback(async (section: string) => {
    try {
      await openSystemSettings(section);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open system settings');
      throw err;
    }
  }, []);

  const allGranted = permissions.microphone && permissions.accessibility && permissions.screen_recording;

  const requiredPermissions: { type: PermissionType; label: string; description: string; canRequestDirectly: boolean }[] = [
    {
      type: 'microphone',
      label: 'Microphone',
      description: 'Handles voice transcription',
      canRequestDirectly: true,
    },
    {
      type: 'accessibility',
      label: 'Accessibility',
      description: 'Handles copying and pasting into applications',
      canRequestDirectly: false,
    },
    {
      type: 'screen_recording',
      label: 'Screenshots',
      description: 'Allows taking screenshots of your screen',
      canRequestDirectly: false,
    },
  ];

  return {
    permissions,
    loading,
    error,
    allGranted,
    requiredPermissions,
    requestPermission: requestPermissionAction,
    openSystemSettings: openSystemSettingsAction,
    reloadPermissions: loadPermissions,
  };
}