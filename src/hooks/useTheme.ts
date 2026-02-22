import { useEffect, useCallback } from 'react';
import type { AppSettings } from '../types';

export function useTheme(settings: AppSettings | null) {
  const applyTheme = useCallback((darkMode: boolean) => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    // Let CSS variables from index.css handle body colors — no hardcoding
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }, []);

  const applyAccentColor = useCallback((color: string) => {
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-color-hover', adjustBrightness(color, -20));
    // Wire accent color into the design system so components visibly change
    document.documentElement.style.setProperty('--color-accent', color);
    document.documentElement.style.setProperty('--color-info', color);
  }, []);

  useEffect(() => {
    if (settings) {
      applyTheme(settings.appearance.dark_mode);
      applyAccentColor(settings.appearance.accent_color);
    }
  }, [settings, applyTheme, applyAccentColor]);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !settings?.appearance.dark_mode;
    applyTheme(newDarkMode);
  }, [settings?.appearance.dark_mode, applyTheme]);

  return {
    isDarkMode: settings?.appearance.dark_mode ?? false,
    accentColor: settings?.appearance.accent_color ?? '#2D4739',
    toggleDarkMode,
    applyTheme,
    applyAccentColor,
  };
}

function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
