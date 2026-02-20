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
    'etco2Unit',
    'etco2UnitDesc',
    'etco2UnitMmhg',
    'etco2UnitKpa',
    'minutes',
    'adultDefibrillator',
    'adultDefibrillatorDesc',
  ];

  Object.entries(translations).forEach(([lang, translation]) => {
    describe(`${lang.toUpperCase()} translations`, () => {
      it('should have all required settings keys', () => {
        requiredSettingsKeys.forEach((key) => {
          expect(translation.settings).toHaveProperty(key);
          expect(translation.settings[key as keyof typeof translation.settings]).toBeTruthy();
        });
      });

      it('should NOT have pediatricDefibrillator key', () => {
        expect(translation.settings).not.toHaveProperty('pediatricDefibrillator');
      });

      it('should have non-empty epinephrine interval translations', () => {
        expect(translation.settings.epinephrineInterval).toMatch(/\p{L}/u);
        expect(translation.settings.epinephrineIntervalDesc).toMatch(/\p{L}/u);
        expect(translation.settings.minutes).toMatch(/\p{L}/u);
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
      expect(frTranslations.settings.epinephrineInterval).toBe('Intervalle \u00c9pin\u00e9phrine/Adr\u00e9naline');
      expect(frTranslations.settings.epinephrineIntervalDesc).toContain('AHA recommande 3-5 min');
      expect(frTranslations.settings.minutes).toBe('min');
    });

    it('DE - should have correct German translations', () => {
      expect(deTranslations.settings.epinephrineInterval).toBe('Epinephrin/Adrenalin Intervall');
      expect(deTranslations.settings.epinephrineIntervalDesc).toContain('AHA empfiehlt 3-5 Min');
      expect(deTranslations.settings.minutes).toBe('Min');
    });

    it('EL - should have correct Greek translations', () => {
      expect(elTranslations.settings.epinephrineInterval).toBe('\u0394\u03b9\u03ac\u03c3\u03c4\u03b7\u03bc\u03b1 \u0395\u03c0\u03b9\u03bd\u03b5\u03c6\u03c1\u03af\u03bd\u03b7\u03c2/\u0391\u03b4\u03c1\u03b5\u03bd\u03b1\u03bb\u03af\u03bd\u03b7\u03c2');
      expect(elTranslations.settings.epinephrineIntervalDesc).toContain('AHA \u03c3\u03c5\u03bd\u03b9\u03c3\u03c4\u03ac 3-5 \u03bb\u03b5\u03c0\u03c4\u03ac');
      expect(elTranslations.settings.minutes).toBe('\u03bb\u03b5\u03c0');
    });
  });

  describe('Translation Structure Consistency', () => {
    it('should have the same structure across all languages', () => {
      const enKeys = Object.keys(enTranslations.settings);

      Object.entries(translations).forEach(([, translation]) => {
        const langKeys = Object.keys(translation.settings);
        expect(langKeys).toEqual(enKeys);
      });
    });
  });
});
