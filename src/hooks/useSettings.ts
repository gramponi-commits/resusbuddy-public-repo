import { useState, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';
import type { ETCO2Unit } from '@/lib/etco2Units';

export type ThemeMode = 'dark' | 'light';
export type AdultDefibrillatorEnergy = 120 | 150 | 200 | 360;
export type EpinephrineIntervalMinutes = 3 | 4 | 5;
export type { ETCO2Unit } from '@/lib/etco2Units';

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
  etco2Unit: ETCO2Unit;
  ecmoEnabled: boolean;
  ecmoActivationTimeMinutes: number;
  ecmoInclusionCriteria: string[];
  ecmoExclusionCriteria: string[];
  cowboyMode: boolean;
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
  etco2Unit: 'mmhg',
  ecmoEnabled: false,
  ecmoActivationTimeMinutes: 15,
  ecmoInclusionCriteria: [],
  ecmoExclusionCriteria: [],
  cowboyMode: false,
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

        // Validate ETCO2 unit
        const validEtco2Units: ETCO2Unit[] = ['mmhg', 'kpa'];
        if (parsed.etco2Unit != null && !validEtco2Units.includes(parsed.etco2Unit)) {
          logger.warn('Invalid ETCO2 unit, resetting to default', {
            unit: parsed.etco2Unit
          });
          parsed.etco2Unit = DEFAULT_SETTINGS.etco2Unit;
        }

        // Validate ECMO activation time (5-60 minutes)
        if (parsed.ecmoActivationTimeMinutes != null &&
            (typeof parsed.ecmoActivationTimeMinutes !== 'number' ||
             parsed.ecmoActivationTimeMinutes < 5 || parsed.ecmoActivationTimeMinutes > 60)) {
          logger.warn('Invalid ECMO activation time, resetting to default', {
            time: parsed.ecmoActivationTimeMinutes
          });
          parsed.ecmoActivationTimeMinutes = DEFAULT_SETTINGS.ecmoActivationTimeMinutes;
        }

        // Validate ECMO criteria arrays
        if (parsed.ecmoInclusionCriteria != null && !Array.isArray(parsed.ecmoInclusionCriteria)) {
          parsed.ecmoInclusionCriteria = DEFAULT_SETTINGS.ecmoInclusionCriteria;
        }
        if (parsed.ecmoExclusionCriteria != null && !Array.isArray(parsed.ecmoExclusionCriteria)) {
          parsed.ecmoExclusionCriteria = DEFAULT_SETTINGS.ecmoExclusionCriteria;
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
