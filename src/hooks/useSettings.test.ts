import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from './useSettings';

describe('useSettings Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should initialize with default settings', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual({
        soundEnabled: true,
        vibrationEnabled: true,
        metronomeEnabled: false,
        metronomeBPM: 110,
        voiceAnnouncementsEnabled: false,
        preferLidocaine: false,
        theme: 'dark',
        adultDefibrillatorEnergy: 200,
        epinephrineIntervalMinutes: 4,
      });
    });

    it('should load settings from localStorage if available', () => {
      const savedSettings = {
        soundEnabled: false,
        vibrationEnabled: false,
        metronomeEnabled: true,
        metronomeBPM: 120,
        voiceAnnouncementsEnabled: true,
        preferLidocaine: true,
        theme: 'light',
        adultDefibrillatorEnergy: 360,
        epinephrineIntervalMinutes: 4,
      };

      localStorage.setItem('acls-settings', JSON.stringify(savedSettings));

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings).toEqual(savedSettings);
    });

    it('should merge saved settings with defaults for missing fields', () => {
      const partialSettings = {
        soundEnabled: false,
        theme: 'light',
      };

      localStorage.setItem('acls-settings', JSON.stringify(partialSettings));

      const { result } = renderHook(() => useSettings());

      // Should have saved values for specified fields
      expect(result.current.settings.soundEnabled).toBe(false);
      expect(result.current.settings.theme).toBe('light');

      // Should have defaults for unspecified fields
      expect(result.current.settings.vibrationEnabled).toBe(true);
      expect(result.current.settings.metronomeBPM).toBe(110);
    });

    it('should fallback to defaults if localStorage has invalid JSON', () => {
      localStorage.setItem('acls-settings', 'invalid-json{');

      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.soundEnabled).toBe(true);
      expect(result.current.settings.theme).toBe('dark');
    });
  });

  describe('updateSetting', () => {
    it('should update individual settings', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('soundEnabled', false);
      });

      expect(result.current.settings.soundEnabled).toBe(false);
      expect(result.current.settings.vibrationEnabled).toBe(true); // Others unchanged
    });

    it('should persist settings to localStorage', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('metronomeBPM', 120);
      });

      const saved = JSON.parse(localStorage.getItem('acls-settings') || '{}');
      expect(saved.metronomeBPM).toBe(120);
    });

    it('should update multiple settings independently', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('soundEnabled', false);
        result.current.updateSetting('theme', 'light');
        result.current.updateSetting('adultDefibrillatorEnergy', 360);
      });

      expect(result.current.settings.soundEnabled).toBe(false);
      expect(result.current.settings.theme).toBe('light');
      expect(result.current.settings.adultDefibrillatorEnergy).toBe(360);
    });

    it('should preserve type safety for settings values', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('theme', 'light');
        result.current.updateSetting('metronomeBPM', 100);
        result.current.updateSetting('soundEnabled', true);
      });

      expect(typeof result.current.settings.theme).toBe('string');
      expect(typeof result.current.settings.metronomeBPM).toBe('number');
      expect(typeof result.current.settings.soundEnabled).toBe('boolean');
    });
  });

  describe('resetSettings', () => {
    it('should reset all settings to defaults', () => {
      const { result } = renderHook(() => useSettings());

      // Change some settings
      act(() => {
        result.current.updateSetting('soundEnabled', false);
        result.current.updateSetting('theme', 'light');
        result.current.updateSetting('metronomeBPM', 90);
      });

      expect(result.current.settings.soundEnabled).toBe(false);

      // Reset
      act(() => {
        result.current.resetSettings();
      });

      // Should be back to defaults
      expect(result.current.settings).toEqual({
        soundEnabled: true,
        vibrationEnabled: true,
        metronomeEnabled: false,
        metronomeBPM: 110,
        voiceAnnouncementsEnabled: false,
        preferLidocaine: false,
        theme: 'dark',
        adultDefibrillatorEnergy: 200,
        epinephrineIntervalMinutes: 4,
      });
    });

    it('should persist reset settings to localStorage', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('soundEnabled', false);
      });

      act(() => {
        result.current.resetSettings();
      });

      const saved = JSON.parse(localStorage.getItem('acls-settings') || '{}');
      expect(saved.soundEnabled).toBe(true); // Back to default
    });
  });

  describe('Audio and Alert Settings', () => {
    it('should toggle sound enabled', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.soundEnabled).toBe(true);

      act(() => {
        result.current.updateSetting('soundEnabled', false);
      });

      expect(result.current.settings.soundEnabled).toBe(false);
    });

    it('should toggle vibration enabled', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.vibrationEnabled).toBe(true);

      act(() => {
        result.current.updateSetting('vibrationEnabled', false);
      });

      expect(result.current.settings.vibrationEnabled).toBe(false);
    });

    it('should toggle voice announcements', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.voiceAnnouncementsEnabled).toBe(false);

      act(() => {
        result.current.updateSetting('voiceAnnouncementsEnabled', true);
      });

      expect(result.current.settings.voiceAnnouncementsEnabled).toBe(true);
    });
  });

  describe('Metronome Settings', () => {
    it('should toggle metronome enabled', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.metronomeEnabled).toBe(false);

      act(() => {
        result.current.updateSetting('metronomeEnabled', true);
      });

      expect(result.current.settings.metronomeEnabled).toBe(true);
    });

    it('should update metronome BPM', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('metronomeBPM', 100);
      });

      expect(result.current.settings.metronomeBPM).toBe(100);
    });

    it('should allow BPM within valid CPR range (100-120)', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('metronomeBPM', 100);
      });
      expect(result.current.settings.metronomeBPM).toBe(100);

      act(() => {
        result.current.updateSetting('metronomeBPM', 110);
      });
      expect(result.current.settings.metronomeBPM).toBe(110);

      act(() => {
        result.current.updateSetting('metronomeBPM', 120);
      });
      expect(result.current.settings.metronomeBPM).toBe(120);
    });
  });

  describe('Medication Preferences', () => {
    it('should toggle lidocaine preference', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.preferLidocaine).toBe(false);

      act(() => {
        result.current.updateSetting('preferLidocaine', true);
      });

      expect(result.current.settings.preferLidocaine).toBe(true);
    });
  });

  describe('Defibrillator Energy Settings', () => {
    it('should update adult defibrillator energy', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('adultDefibrillatorEnergy', 360);
      });

      expect(result.current.settings.adultDefibrillatorEnergy).toBe(360);
    });

    it('should update adult defibrillator energy', () => {
      const { result } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('adultDefibrillatorEnergy', 360);
      });

      expect(result.current.settings.adultDefibrillatorEnergy).toBe(360);
    });

    it('should accept valid defibrillator energies', () => {
      const { result } = renderHook(() => useSettings());
      const validEnergies = [120, 150, 200, 360];

      validEnergies.forEach((energy) => {
        act(() => {
          result.current.updateSetting('adultDefibrillatorEnergy', energy as any);
        });
        expect(result.current.settings.adultDefibrillatorEnergy).toBe(energy);
      });
    });
  });

  describe('Theme Settings', () => {
    it('should toggle between dark and light themes', () => {
      const { result } = renderHook(() => useSettings());

      expect(result.current.settings.theme).toBe('dark');

      act(() => {
        result.current.updateSetting('theme', 'light');
      });

      expect(result.current.settings.theme).toBe('light');

      act(() => {
        result.current.updateSetting('theme', 'dark');
      });

      expect(result.current.settings.theme).toBe('dark');
    });
  });

  describe('Persistence Across Remounts', () => {
    it('should persist settings across hook unmount/remount', () => {
      const { result, unmount } = renderHook(() => useSettings());

      act(() => {
        result.current.updateSetting('soundEnabled', false);
        result.current.updateSetting('metronomeBPM', 115);
      });

      unmount();

      const { result: result2 } = renderHook(() => useSettings());

      expect(result2.current.settings.soundEnabled).toBe(false);
      expect(result2.current.settings.metronomeBPM).toBe(115);
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const { result } = renderHook(() => useSettings());

      // Mock localStorage.setItem to throw error (e.g., quota exceeded)
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = () => {
        throw new Error('QuotaExceededError');
      };

      // Should not throw, just log error
      expect(() => {
        act(() => {
          result.current.updateSetting('soundEnabled', false);
        });
      }).not.toThrow();

      // Restore original
      Storage.prototype.setItem = originalSetItem;
    });

    it('should handle localStorage.getItem errors gracefully', () => {
      const originalGetItem = Storage.prototype.getItem;
      Storage.prototype.getItem = () => {
        throw new Error('SecurityError');
      };

      expect(() => {
        renderHook(() => useSettings());
      }).not.toThrow();

      Storage.prototype.getItem = originalGetItem;
    });
  });
});
