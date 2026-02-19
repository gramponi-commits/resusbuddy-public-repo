import { describe, it, expect } from 'vitest';
import {
  getAdultEpinephrineDose,
  getAdultAmiodaroneDose,
  getAdultLidocaineDose,
  getAdultShockEnergy,
} from './aclsDosing';

describe('ACLS Adult Dosing Calculations', () => {
  describe('getAdultEpinephrineDose', () => {
    it('should return fixed 1mg dose for adults', () => {
      const dose = getAdultEpinephrineDose();

      expect(dose.value).toBe(1);
      expect(dose.display).toBe('1 mg');
      expect(dose.unit).toBe('mg');
    });

    it('should return same dose for all administrations', () => {
      const dose1 = getAdultEpinephrineDose();
      const dose2 = getAdultEpinephrineDose();
      const dose3 = getAdultEpinephrineDose();

      expect(dose1.value).toBe(dose2.value);
      expect(dose2.value).toBe(dose3.value);
      expect(dose1.value).toBe(1);
    });
  });

  describe('getAdultAmiodaroneDose', () => {
    it('should return 300mg for first dose (doseNumber = 0)', () => {
      const dose = getAdultAmiodaroneDose(0);

      expect(dose.value).toBe(300);
      expect(dose.display).toBe('300 mg');
      expect(dose.unit).toBe('mg');
    });

    it('should return 150mg for second dose (doseNumber = 1)', () => {
      const dose = getAdultAmiodaroneDose(1);

      expect(dose.value).toBe(150);
      expect(dose.display).toBe('150 mg');
      expect(dose.unit).toBe('mg');
    });

    it('should return 150mg for subsequent doses (doseNumber >= 2)', () => {
      const dose2 = getAdultAmiodaroneDose(2);
      const dose3 = getAdultAmiodaroneDose(3);
      const dose10 = getAdultAmiodaroneDose(10);

      expect(dose2.value).toBe(150);
      expect(dose3.value).toBe(150);
      expect(dose10.value).toBe(150);
    });

    it('should follow AHA 2025 guidelines for amiodarone dosing', () => {
      // First dose after 3rd shock: 300mg
      const firstDose = getAdultAmiodaroneDose(0);
      expect(firstDose.value).toBe(300);

      // Second dose: 150mg (max 2 doses)
      const secondDose = getAdultAmiodaroneDose(1);
      expect(secondDose.value).toBe(150);
    });
  });

  describe('getAdultLidocaineDose', () => {
    it('should return 100mg for first dose (doseNumber = 0)', () => {
      const dose = getAdultLidocaineDose(0);

      expect(dose.value).toBe(100);
      expect(dose.display).toBe('100 mg');
      expect(dose.unit).toBe('mg');
    });

    it('should return 50mg for maintenance doses (doseNumber >= 1)', () => {
      const dose1 = getAdultLidocaineDose(1);
      const dose2 = getAdultLidocaineDose(2);
      const dose5 = getAdultLidocaineDose(5);

      expect(dose1.value).toBe(50);
      expect(dose2.value).toBe(50);
      expect(dose5.value).toBe(50);
    });

    it('should provide alternative to amiodarone per AHA guidelines', () => {
      // Lidocaine is given as alternative to amiodarone
      // First dose: 1-1.5 mg/kg (~100mg for average 70kg adult)
      const firstDose = getAdultLidocaineDose(0);
      expect(firstDose.value).toBe(100);

      // Maintenance: 0.5-0.75 mg/kg (~50mg for average adult)
      const maintenanceDose = getAdultLidocaineDose(1);
      expect(maintenanceDose.value).toBe(50);
    });
  });

  describe('getAdultShockEnergy', () => {
    it('should return configured energy for default 200J defibrillator', () => {
      const energy = getAdultShockEnergy(1, 200);

      expect(energy.value).toBe(200);
      expect(energy.display).toBe('200J');
      expect(energy.unit).toBe('J');
    });

    it('should return configured energy for 360J defibrillator', () => {
      const energy = getAdultShockEnergy(1, 360);

      expect(energy.value).toBe(360);
      expect(energy.display).toBe('360J');
      expect(energy.unit).toBe('J');
    });

    it('should cap energy at 360J maximum', () => {
      const energy = getAdultShockEnergy(1, 500); // Invalid high energy

      expect(energy.value).toBe(360);
      expect(energy.display).toBe('360J');
    });

    it('should accept valid defibrillator energies', () => {
      const validEnergies = [120, 150, 200, 360];

      validEnergies.forEach((configuredEnergy) => {
        const energy = getAdultShockEnergy(1, configuredEnergy);
        expect(energy.value).toBe(configuredEnergy);
      });
    });

    it('should use same energy for all shocks (biphasic)', () => {
      const shock1 = getAdultShockEnergy(1, 200);
      const shock2 = getAdultShockEnergy(2, 200);
      const shock5 = getAdultShockEnergy(5, 200);

      expect(shock1.value).toBe(200);
      expect(shock2.value).toBe(200);
      expect(shock5.value).toBe(200);
    });

    it('should default to 200J when no energy specified', () => {
      const energy = getAdultShockEnergy(1);

      expect(energy.value).toBe(200);
    });
  });

  describe('AHA 2025 ACLS Guideline Compliance', () => {
    it('should match epinephrine guidelines: 1mg IV/IO every 4 minutes', () => {
      const dose = getAdultEpinephrineDose();
      expect(dose.value).toBe(1); // 1mg fixed dose
    });

    it('should match amiodarone guidelines: 300mg then 150mg', () => {
      const firstDose = getAdultAmiodaroneDose(0);
      const secondDose = getAdultAmiodaroneDose(1);

      expect(firstDose.value).toBe(300);
      expect(secondDose.value).toBe(150);
      // Total max: 450mg (300 + 150)
      expect(firstDose.value + secondDose.value).toBe(450);
    });

    it('should match lidocaine guidelines as amiodarone alternative', () => {
      const initialDose = getAdultLidocaineDose(0);
      const maintenanceDose = getAdultLidocaineDose(1);

      // Initial: 1-1.5 mg/kg (100mg for ~70kg adult)
      expect(initialDose.value).toBe(100);
      // Maintenance: 0.5-0.75 mg/kg (50mg for ~70kg adult)
      expect(maintenanceDose.value).toBe(50);
    });

    it('should use biphasic defibrillator energies per guidelines', () => {
      // Modern biphasic defibrillators: 200J or manufacturer recommendation
      const energy200 = getAdultShockEnergy(1, 200);
      const energy360 = getAdultShockEnergy(1, 360);

      expect(energy200.value).toBe(200);
      expect(energy360.value).toBe(360);
    });
  });
});
