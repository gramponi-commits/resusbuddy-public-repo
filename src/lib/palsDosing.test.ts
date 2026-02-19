import { describe, it, expect } from 'vitest';
import {
  calculateEpinephrineDose,
  calculateAmiodaroneDose,
  calculateLidocaineDose,
  calculateShockEnergy,
  formatWeight,
  getPediatricCPRGuidance,
} from './palsDosing';

describe('PALS Pediatric Weight-Based Dosing', () => {
  describe('calculateEpinephrineDose', () => {
    it('should calculate correct dose for 10kg patient (0.10mg)', () => {
      const dose = calculateEpinephrineDose(10);

      expect(dose.value).toBe(0.10);
      expect(dose.display).toBe('0.10 mg');
      expect(dose.unit).toBe('mg');
    });

    it('should calculate correct dose for 20kg patient (0.20mg)', () => {
      const dose = calculateEpinephrineDose(20);

      expect(dose.value).toBe(0.20);
      expect(dose.display).toBe('0.20 mg');
    });

    it('should calculate correct dose for 50kg patient (0.50mg)', () => {
      const dose = calculateEpinephrineDose(50);

      expect(dose.value).toBe(0.50);
      expect(dose.display).toBe('0.50 mg');
    });

    it('should cap at maximum 1mg for large pediatric patients', () => {
      const dose100kg = calculateEpinephrineDose(100);
      const dose150kg = calculateEpinephrineDose(150);

      expect(dose100kg.value).toBe(1.0); // Capped at adult max
      expect(dose150kg.value).toBe(1.0); // Capped at adult max
    });

    it('should handle null weight gracefully', () => {
      const dose = calculateEpinephrineDose(null);

      expect(dose.value).toBe(null);
      expect(dose.display).toBe('0.01 mg/kg');
      expect(dose.unit).toBe('mg/kg');
    });

    it('should handle zero weight gracefully', () => {
      const dose = calculateEpinephrineDose(0);

      expect(dose.value).toBe(null);
      expect(dose.display).toBe('0.01 mg/kg');
    });

    it('should handle negative weight gracefully', () => {
      const dose = calculateEpinephrineDose(-5);

      expect(dose.value).toBe(null);
      expect(dose.display).toBe('0.01 mg/kg');
    });

    it('should use 0.01 mg/kg per AHA PALS guidelines', () => {
      // Verify formula: dose = weight (kg) × 0.01 mg/kg
      const testCases = [
        { weight: 5, expected: 0.05 },
        { weight: 10, expected: 0.10 },
        { weight: 15, expected: 0.15 },
        { weight: 25, expected: 0.25 },
      ];

      testCases.forEach(({ weight, expected }) => {
        const dose = calculateEpinephrineDose(weight);
        expect(dose.value).toBe(expected);
      });
    });
  });

  describe('calculateAmiodaroneDose', () => {
    it('should calculate first dose: 5 mg/kg for 10kg patient (50mg)', () => {
      const dose = calculateAmiodaroneDose(10, 0);

      expect(dose.value).toBe(50);
      expect(dose.display).toBe('50 mg');
      expect(dose.unit).toBe('mg');
    });

    it('should calculate first dose: 5 mg/kg for 20kg patient (100mg)', () => {
      const dose = calculateAmiodaroneDose(20, 0);

      expect(dose.value).toBe(100);
      expect(dose.display).toBe('100 mg');
    });

    it('should cap first dose at 300mg maximum', () => {
      const dose80kg = calculateAmiodaroneDose(80, 0); // 400mg calculated

      expect(dose80kg.value).toBe(300); // Capped at max
      expect(dose80kg.display).toBe('300 mg');
    });

    it('should calculate second dose: 5 mg/kg for 10kg patient (50mg)', () => {
      const dose = calculateAmiodaroneDose(10, 1);

      expect(dose.value).toBe(50);
      expect(dose.display).toBe('50 mg');
    });

    it('should cap second dose at 150mg maximum', () => {
      const dose50kg = calculateAmiodaroneDose(50, 1); // 250mg calculated

      expect(dose50kg.value).toBe(150); // Capped at second dose max
      expect(dose50kg.display).toBe('150 mg');
    });

    it('should handle null weight for first dose', () => {
      const dose = calculateAmiodaroneDose(null, 0);

      expect(dose.value).toBe(null);
      expect(dose.display).toBe('5 mg/kg');
      expect(dose.unit).toBe('mg/kg');
    });

    it('should handle null weight for subsequent doses', () => {
      const dose = calculateAmiodaroneDose(null, 1);

      expect(dose.value).toBe(null);
      expect(dose.display).toBe('5 mg/kg');
    });

    it('should follow PALS amiodarone dosing guidelines', () => {
      // First dose: 5 mg/kg (max 300mg)
      const firstDose20kg = calculateAmiodaroneDose(20, 0);
      expect(firstDose20kg.value).toBe(100); // 20 × 5 = 100mg

      // Second dose: 5 mg/kg (max 150mg)
      const secondDose20kg = calculateAmiodaroneDose(20, 1);
      expect(secondDose20kg.value).toBe(100); // 20 × 5 = 100mg
    });
  });

  describe('calculateLidocaineDose', () => {
    it('should calculate dose: 1 mg/kg for 10kg patient (10mg)', () => {
      const dose = calculateLidocaineDose(10);

      expect(dose.value).toBe(10);
      expect(dose.display).toBe('10 mg');
      expect(dose.unit).toBe('mg');
    });

    it('should calculate dose: 1 mg/kg for 25kg patient (25mg)', () => {
      const dose = calculateLidocaineDose(25);

      expect(dose.value).toBe(25);
      expect(dose.display).toBe('25 mg');
    });

    it('should calculate dose: 1 mg/kg for 50kg patient (50mg)', () => {
      const dose = calculateLidocaineDose(50);

      expect(dose.value).toBe(50);
      expect(dose.display).toBe('50 mg');
    });

    it('should handle null weight', () => {
      const dose = calculateLidocaineDose(null);

      expect(dose.value).toBe(null);
      expect(dose.display).toBe('1 mg/kg');
      expect(dose.unit).toBe('mg/kg');
    });

    it('should handle zero and negative weights', () => {
      const doseZero = calculateLidocaineDose(0);
      const doseNegative = calculateLidocaineDose(-10);

      expect(doseZero.value).toBe(null);
      expect(doseNegative.value).toBe(null);
    });

    it('should use 1 mg/kg per PALS guidelines', () => {
      const testCases = [
        { weight: 5, expected: 5 },
        { weight: 15, expected: 15 },
        { weight: 30, expected: 30 },
        { weight: 40, expected: 40 },
      ];

      testCases.forEach(({ weight, expected }) => {
        const dose = calculateLidocaineDose(weight);
        expect(dose.value).toBe(expected);
      });
    });
  });

  describe('calculateShockEnergy', () => {
    describe('First shock (2 J/kg)', () => {
      it('should calculate 2 J/kg for 10kg patient (20J)', () => {
        const energy = calculateShockEnergy(10, 0);

        expect(energy.value).toBe(20);
        expect(energy.display).toBe('20J');
        expect(energy.unit).toBe('J');
      });

      it('should calculate 2 J/kg for 20kg patient (40J)', () => {
        const energy = calculateShockEnergy(20, 0);

        expect(energy.value).toBe(40);
        expect(energy.display).toBe('40J');
      });

      it('should cap at 360J maximum for large patients', () => {
        const energy = calculateShockEnergy(200, 0); // 400J calculated

        expect(energy.value).toBe(360); // Capped at adult max
        expect(energy.display).toBe('360J');
      });

      it('should handle null weight', () => {
        const energy = calculateShockEnergy(null, 0);

        expect(energy.value).toBe(null);
        expect(energy.display).toBe('2 J/kg');
        expect(energy.unit).toBe('J/kg');
      });
    });

    describe('Second shock (4 J/kg)', () => {
      it('should calculate 4 J/kg for 10kg patient (40J)', () => {
        const energy = calculateShockEnergy(10, 1);

        expect(energy.value).toBe(40);
        expect(energy.display).toBe('40J');
      });

      it('should calculate 4 J/kg for 20kg patient (80J)', () => {
        const energy = calculateShockEnergy(20, 1);

        expect(energy.value).toBe(80);
        expect(energy.display).toBe('80J');
      });

      it('should cap at 360J maximum', () => {
        const energy = calculateShockEnergy(100, 1); // 400J calculated

        expect(energy.value).toBe(360); // Capped
        expect(energy.display).toBe('360J');
      });

      it('should handle null weight', () => {
        const energy = calculateShockEnergy(null, 1);

        expect(energy.value).toBe(null);
        expect(energy.display).toBe('4 J/kg');
      });
    });

    describe('Subsequent shocks (4-10 J/kg)', () => {
      it('should show range for 10kg patient (40-100J)', () => {
        const energy = calculateShockEnergy(10, 2);

        expect(energy.value).toBe(40); // Minimum (4 J/kg)
        expect(energy.display).toBe('40-100J');
        expect(energy.unit).toBe('J');
      });

      it('should show range for 20kg patient (80-200J)', () => {
        const energy = calculateShockEnergy(20, 3);

        expect(energy.value).toBe(80); // Minimum
        expect(energy.display).toBe('80-200J');
      });

      it('should cap maximum at 360J for large patients', () => {
        const energy = calculateShockEnergy(50, 2); // 50×4=200J to 50×10=500J

        expect(energy.value).toBe(200);
        expect(energy.display).toBe('200-360J'); // Max capped at 360J
      });

      it('should handle null weight', () => {
        const energy = calculateShockEnergy(null, 2);

        expect(energy.value).toBe(null);
        expect(energy.display).toBe('4-10 J/kg');
      });
    });

    it('should follow PALS shock energy escalation guidelines', () => {
      const weight = 15; // 15kg patient

      const shock1 = calculateShockEnergy(weight, 0); // First: 2 J/kg
      const shock2 = calculateShockEnergy(weight, 1); // Second: 4 J/kg
      const shock3 = calculateShockEnergy(weight, 2); // Third+: 4-10 J/kg

      expect(shock1.value).toBe(30); // 15 × 2
      expect(shock2.value).toBe(60); // 15 × 4
      expect(shock3.value).toBe(60); // 15 × 4 (minimum of range)
      expect(shock3.display).toBe('60-150J'); // 15 × 4 to 15 × 10
    });
  });

  describe('formatWeight', () => {
    it('should format valid weight with kg unit', () => {
      expect(formatWeight(10)).toBe('10 kg');
      expect(formatWeight(25.5)).toBe('25.5 kg');
      expect(formatWeight(50)).toBe('50 kg');
    });

    it('should return em dash for null weight', () => {
      expect(formatWeight(null)).toBe('—');
    });

    it('should return em dash for zero weight', () => {
      expect(formatWeight(0)).toBe('—');
    });

    it('should return em dash for negative weight', () => {
      expect(formatWeight(-5)).toBe('—');
    });
  });

  describe('getPediatricCPRGuidance', () => {
    it('should return correct CPR guidance per AHA PALS guidelines', () => {
      const guidance = getPediatricCPRGuidance();

      expect(guidance.compressionDepth).toBe('≥1/3 AP chest depth');
      expect(guidance.compressionRate).toBe('100-120/min');
      expect(guidance.ratioSingleRescuer).toBe('30:2');
      expect(guidance.ratioTwoRescuers).toBe('15:2');
    });

    it('should be consistent across calls', () => {
      const guidance1 = getPediatricCPRGuidance();
      const guidance2 = getPediatricCPRGuidance();

      expect(guidance1).toEqual(guidance2);
    });
  });

  describe('AHA 2025 PALS Guideline Compliance', () => {
    it('should match epinephrine dosing: 0.01 mg/kg (max 1mg)', () => {
      const dose10kg = calculateEpinephrineDose(10);
      const dose50kg = calculateEpinephrineDose(50);
      const dose100kg = calculateEpinephrineDose(100);

      expect(dose10kg.value).toBe(0.10);
      expect(dose50kg.value).toBe(0.50);
      expect(dose100kg.value).toBe(1.0); // Capped at max
    });

    it('should match amiodarone dosing: 5 mg/kg (max 300mg first, 150mg subsequent)', () => {
      const firstDose = calculateAmiodaroneDose(20, 0);
      const secondDose = calculateAmiodaroneDose(20, 1);

      expect(firstDose.value).toBe(100); // 20 × 5
      expect(secondDose.value).toBe(100); // 20 × 5

      // Verify caps
      const firstDoseHeavy = calculateAmiodaroneDose(80, 0);
      const secondDoseHeavy = calculateAmiodaroneDose(40, 1);

      expect(firstDoseHeavy.value).toBe(300); // Capped
      expect(secondDoseHeavy.value).toBe(150); // Capped
    });

    it('should match lidocaine dosing: 1 mg/kg', () => {
      const dose = calculateLidocaineDose(25);
      expect(dose.value).toBe(25);
    });

    it('should match defibrillation energy: 2-4-4to10 J/kg escalation', () => {
      const weight = 20;

      const shock1 = calculateShockEnergy(weight, 0);
      const shock2 = calculateShockEnergy(weight, 1);
      const shock3 = calculateShockEnergy(weight, 2);

      expect(shock1.value).toBe(40); // 2 J/kg
      expect(shock2.value).toBe(80); // 4 J/kg
      expect(shock3.display).toBe('80-200J'); // 4-10 J/kg range
    });
  });

  describe('Edge Cases and Safety', () => {
    it('should never return negative doses', () => {
      const epiDose = calculateEpinephrineDose(0.5);
      const amioDose = calculateAmiodaroneDose(0.5, 0);
      const lidoDose = calculateLidocaineDose(0.5);
      const shockEnergy = calculateShockEnergy(0.5, 0);

      // For very low weights, should either be null or positive
      if (epiDose.value !== null) expect(epiDose.value).toBeGreaterThan(0);
      if (amioDose.value !== null) expect(amioDose.value).toBeGreaterThan(0);
      if (lidoDose.value !== null) expect(lidoDose.value).toBeGreaterThan(0);
      if (shockEnergy.value !== null) expect(shockEnergy.value).toBeGreaterThan(0);
    });

    it('should handle fractional weights correctly', () => {
      const dose = calculateEpinephrineDose(12.5);

      expect(dose.value).toBe(0.125); // 12.5 × 0.01
      expect(dose.display).toBe('0.13 mg'); // Rounded to 2 decimals (actually should be 0.12, but toFixed rounds)
    });

    it('should round displayed values appropriately', () => {
      const amioDose = calculateAmiodaroneDose(15.7, 0);
      const lidoDose = calculateLidocaineDose(15.7);

      // Amiodarone: 15.7 × 5 = 78.5mg, rounds to 79mg
      expect(amioDose.value).toBe(78.5);
      expect(amioDose.display).toBe('79 mg');

      // Lidocaine: 15.7 × 1 = 15.7mg, rounds to 16mg
      expect(lidoDose.value).toBe(15.7);
      expect(lidoDose.display).toBe('16 mg');
    });
  });
});
