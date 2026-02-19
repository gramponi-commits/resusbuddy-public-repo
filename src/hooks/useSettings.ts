import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

export type ThemeMode = 'dark' | 'light';
export type AdultDefibrillatorEnergy = 120 | 150 | 200 | 360;
export type EpinephrineIntervalMinutes = 3 | 4 | 5;

export interface AppSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  metronomeEnabled: boolean;
  metronomeBPM: number;
  voiceAnnouncementsEnabled: boolean;
  preferLidocaine: boolean;
  theme: ThemeMode;
  adultDefibrillatorEnergy: AdultDefibrillatorEnergy;
  epinephrineIntervalMinutes: EpinephrineIntervalMinutes;
}

const SETTINGS_KEY = 'acls-settings';

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  metronomeEnabled: false,
  metronomeBPM: 110,
  voiceAnnouncementsEnabled: false,
  preferLidocaine: false,
  theme: 'dark',
  adultDefibrillatorEnergy: 200,
  epinephrineIntervalMinutes: 4,
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Migration: Remove deprecated defibrillatorEnergy field
        if ('defibrillatorEnergy' in parsed) {
          logger.warn('Migrating deprecated defibrillatorEnergy setting');
          delete parsed.defibrillatorEnergy;
        }

        // Validate metronome BPM range
        if (parsed.metronomeBPM && (parsed.metronomeBPM < 80 || parsed.metronomeBPM > 140)) {
          logger.warn('Invalid metronome BPM, resetting to default', { bpm: parsed.metronomeBPM });
          parsed.metronomeBPM = DEFAULT_SETTINGS.metronomeBPM;
        }

        // Validate defibrillator energy
        const validEnergies: AdultDefibrillatorEnergy[] = [120, 150, 200, 360];
        if (parsed.adultDefibrillatorEnergy && !validEnergies.includes(parsed.adultDefibrillatorEnergy)) {
          logger.warn('Invalid defibrillator energy, resetting to default', {
            energy: parsed.adultDefibrillatorEnergy
          });
          parsed.adultDefibrillatorEnergy = DEFAULT_SETTINGS.adultDefibrillatorEnergy;
        }

        // Validate epinephrine interval
        const validIntervals: EpinephrineIntervalMinutes[] = [3, 4, 5];
        if (parsed.epinephrineIntervalMinutes && !validIntervals.includes(parsed.epinephrineIntervalMinutes)) {
          logger.warn('Invalid epinephrine interval, resetting to default', {
            interval: parsed.epinephrineIntervalMinutes
          });
          parsed.epinephrineIntervalMinutes = DEFAULT_SETTINGS.epinephrineIntervalMinutes;
        }

        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      logger.error('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      logger.debug('Settings saved');
    } catch (e) {
      logger.error('Failed to save settings', e);
    }
  }, [settings]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    resetSettings,
  };
}
