import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, resetSettings } from '../types/commands';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const loadedSettings = await getSettings();
      setSettings(loadedSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettingsValue = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      await updateSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    }
  }, []);

  const resetAllSettings = useCallback(async () => {
    try {
      const defaultSettings = await resetSettings();
      setSettings(defaultSettings);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
      throw err;
    }
  }, []);

  const updateAppearance = useCallback((appearance: Partial<AppSettings['appearance']>) => {
    return updateSettingsValue({
      appearance: { ...settings.appearance, ...appearance }
    });
  }, [settings.appearance, updateSettingsValue]);

  const updateAudio = useCallback((audio: Partial<AppSettings['audio']>) => {
    return updateSettingsValue({
      audio: { ...settings.audio, ...audio }
    });
  }, [settings.audio, updateSettingsValue]);

  const updateShortcuts = useCallback((shortcuts: Partial<AppSettings['shortcuts']>) => {
    return updateSettingsValue({
      shortcuts: { ...settings.shortcuts, ...shortcuts }
    });
  }, [settings.shortcuts, updateSettingsValue]);

  const updateHotMic = useCallback((hotMic: Partial<AppSettings['hot_mic']>) => {
    return updateSettingsValue({
      hot_mic: { ...settings.hot_mic, ...hotMic }
    });
  }, [settings.hot_mic, updateSettingsValue]);

  const updateIntegrations = useCallback((integrations: Partial<AppSettings['integrations']>) => {
    return updateSettingsValue({
      integrations: { ...settings.integrations, ...integrations }
    });
  }, [settings.integrations, updateSettingsValue]);

  const updateDataRetention = useCallback((dataRetention: Partial<AppSettings['data_retention']>) => {
    return updateSettingsValue({
      data_retention: { ...settings.data_retention, ...dataRetention }
    });
  }, [settings.data_retention, updateSettingsValue]);

  return {
    settings,
    loading,
    error,
    updateSettings: updateSettingsValue,
    resetSettings: resetAllSettings,
    reloadSettings: loadSettings,
    updateAppearance,
    updateAudio,
    updateShortcuts,
    updateHotMic,
    updateIntegrations,
    updateDataRetention,
  };
}