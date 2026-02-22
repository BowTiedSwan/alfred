import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSettings, useTheme } from './hooks';
import { isOnboardingComplete } from './types/commands';

import { SetupPermissions } from './pages/onboarding/SetupPermissions';
import { DownloadModel } from './pages/onboarding/DownloadModel';
import { ConfigureShortcuts } from './pages/onboarding/ConfigureShortcuts';

import { MainWindow } from './pages/main/MainWindow';

import { SettingsLayout } from './pages/settings/SettingsLayout';
import { AppearanceSystem } from './pages/settings/AppearanceSystem';
import { AudioTranscription } from './pages/settings/AudioTranscription';
import { KeyboardShortcuts } from './pages/settings/KeyboardShortcuts';
import { HotMicSettings } from './pages/settings/HotMicSettings';
import { PortableCommands } from './pages/settings/PortableCommands';
import { EditorIntegrations } from './pages/settings/EditorIntegrations';

function AppRoutes() {
  const { settings, loading } = useSettings();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useTheme(settings);

  useEffect(() => {
    isOnboardingComplete()
      .then(done => setOnboardingDone(done))
      .catch(() => setOnboardingDone(false));
  }, []);

  if (loading || onboardingDone === null) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: 'var(--color-background)',
        color: 'var(--color-text)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Onboarding */}
      <Route path="/onboarding/permissions" element={<SetupPermissions />} />
      <Route path="/onboarding/download" element={<DownloadModel />} />
      <Route path="/onboarding/shortcuts" element={<ConfigureShortcuts />} />
      <Route path="/onboarding" element={<Navigate to="/onboarding/permissions" replace />} />

      {/* Settings */}
      <Route path="/settings" element={<SettingsLayout />}>
        <Route index element={<Navigate to="appearance" replace />} />
        <Route path="appearance" element={<AppearanceSystem />} />
        <Route path="audio" element={<AudioTranscription />} />
        <Route path="shortcuts" element={<KeyboardShortcuts />} />
        <Route path="hot-mic" element={<HotMicSettings />} />
        <Route path="commands" element={<PortableCommands />} />
        <Route path="integrations" element={<EditorIntegrations />} />
      </Route>

      {/* Main */}
      <Route path="/" element={
        onboardingDone ? <MainWindow /> : <Navigate to="/onboarding" replace />
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
