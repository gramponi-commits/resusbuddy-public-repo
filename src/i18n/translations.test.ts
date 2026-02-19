import { describe, it, expect } from 'vitest';
import enTranslations from './locales/en.json';
import itTranslations from './locales/it.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import elTranslations from './locales/el.json';

describe('Translation Completeness', () => {
  const translations = {
    en: enTranslations,
    it: itTranslations,
    es: esTranslations,
    fr: frTranslations,
    de: deTranslations,
    el: elTranslations,
  };

  const requiredSettingsKeys = [
    'epinephrineInterval',
    'epinephrineIntervalDesc',
    'minutes',
    'adultDefibrillator',
    'adultDefibrillatorDesc',
  ];

  Object.entries(translations).forEach(([lang, translation]) => {
    describe(`${lang.toUpperCase()} translations`, () => {
      it('should have all required settings keys', () => {
        requiredSettingsKeys.forEach(key => {
          expect(translation.settings).toHaveProperty(key);
          expect(translation.settings[key as keyof typeof translation.settings]).toBeTruthy();
        });
      });

      it('should NOT have pediatricDefibrillator key', () => {
        expect(translation.settings).not.toHaveProperty('pediatricDefibrillator');
      });

      it('should have non-empty epinephrine interval translations', () => {
        expect(translation.settings.epinephrineInterval).toMatch(/[a-zA-Zα-ωΑ-Ω]/);
        expect(translation.settings.epinephrineIntervalDesc).toMatch(/[a-zA-Zα-ωΑ-Ω]/);
        expect(translation.settings.minutes).toMatch(/[a-zA-Zα-ωΑ-Ω]/);
      });
    });
  });

  describe('Epinephrine Interval Translations', () => {
    it('EN - should have correct English translations', () => {
      expect(enTranslations.settings.epinephrineInterval).toBe('Epinephrine/Adrenaline Interval');
      expect(enTranslations.settings.epinephrineIntervalDesc).toContain('AHA recommends 3-5 min');
      expect(enTranslations.settings.minutes).toBe('min');
    });

    it('IT - should have correct Italian translations', () => {
      expect(itTranslations.settings.epinephrineInterval).toBe('Intervallo Epinefrina/Adrenalina');
      expect(itTranslations.settings.epinephrineIntervalDesc).toContain('AHA raccomanda 3-5 min');
      expect(itTranslations.settings.minutes).toBe('min');
    });

    it('ES - should have correct Spanish translations', () => {
      expect(esTranslations.settings.epinephrineInterval).toBe('Intervalo Epinefrina/Adrenalina');
      expect(esTranslations.settings.epinephrineIntervalDesc).toContain('AHA recomienda 3-5 min');
      expect(esTranslations.settings.minutes).toBe('min');
    });

    it('FR - should have correct French translations', () => {
      expect(frTranslations.settings.epinephrineInterval).toBe('Intervalle Épinéphrine/Adrénaline');
      expect(frTranslations.settings.epinephrineIntervalDesc).toContain('AHA recommande 3-5 min');
      expect(frTranslations.settings.minutes).toBe('min');
    });

    it('DE - should have correct German translations', () => {
      expect(deTranslations.settings.epinephrineInterval).toBe('Epinephrin/Adrenalin Intervall');
      expect(deTranslations.settings.epinephrineIntervalDesc).toContain('AHA empfiehlt 3-5 Min');
      expect(deTranslations.settings.minutes).toBe('Min');
    });

    it('EL - should have correct Greek translations', () => {
      expect(elTranslations.settings.epinephrineInterval).toBe('Διάστημα Επινεφρίνης/Αδρεναλίνης');
      expect(elTranslations.settings.epinephrineIntervalDesc).toContain('AHA συνιστά 3-5 λεπτά');
      expect(elTranslations.settings.minutes).toBe('λεπ');
    });
  });

  describe('Translation Structure Consistency', () => {
    it('should have the same structure across all languages', () => {
      const enKeys = Object.keys(enTranslations.settings);

      Object.entries(translations).forEach(([lang, translation]) => {
        const langKeys = Object.keys(translation.settings);
        expect(langKeys).toEqual(enKeys);
      });
    });
  });
});
