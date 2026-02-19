import { describe, it, expect } from 'vitest';
import {
  getAdultTachyCardioversion,
  getAdultTachyDiltiazem,
  getAdultTachyVerapamil,
  getAdultTachyMetoprolol,
  getAdultTachyEsmolol,
} from './bradyTachyDosing';

describe('Brady/Tachy Adult Tachycardia Dosing', () => {
  describe('getAdultTachyCardioversion', () => {
    it('should return 200J for atrial fibrillation', () => {
      const energy = getAdultTachyCardioversion('afib');
      
      expect(energy.value).toBe(200);
      expect(energy.display).toBe('200 J');
      expect(energy.unit).toBe('J');
    });

    it('should return 200J for atrial flutter', () => {
      const energy = getAdultTachyCardioversion('aflutter');
      
      expect(energy.value).toBe(200);
      expect(energy.display).toBe('200 J');
      expect(energy.unit).toBe('J');
    });

    it('should return 100J for narrow-complex tachycardia', () => {
      const energy = getAdultTachyCardioversion('narrow');
      
      expect(energy.value).toBe(100);
      expect(energy.display).toBe('100 J');
      expect(energy.unit).toBe('J');
    });

    it('should return 100J for monomorphic VT', () => {
      const energy = getAdultTachyCardioversion('monomorphic_vt');
      
      expect(energy.value).toBe(100);
      expect(energy.display).toBe('100 J');
      expect(energy.unit).toBe('J');
    });

    it('should return defibrillation message for polymorphic VT', () => {
      const energy = getAdultTachyCardioversion('polymorphic_vt');
      
      expect(energy.value).toBeNull();
      expect(energy.display).toBe('Defibrillation (NOT synchronized)');
      expect(energy.unit).toBe('J');
    });

    it('should return default 200J when no rhythm specified', () => {
      const energy = getAdultTachyCardioversion();
      
      expect(energy.value).toBe(200);
      expect(energy.display).toContain('200 J');
    });
  });

  describe('getAdultTachyDiltiazem', () => {
    it('should return loading and maintenance doses', () => {
      const doses = getAdultTachyDiltiazem();
      
      expect(doses.loading.display).toBe('0.25 mg/kg IV over 2 min');
      expect(doses.loading.unit).toBe('mg/kg');
      
      expect(doses.maintenance.display).toBe('5-10 mg/h');
      expect(doses.maintenance.unit).toBe('mg/h');
    });

    it('should have null values for weight-based loading dose', () => {
      const doses = getAdultTachyDiltiazem();
      
      expect(doses.loading.value).toBeNull();
    });
  });

  describe('getAdultTachyVerapamil', () => {
    it('should return initial and repeat doses', () => {
      const doses = getAdultTachyVerapamil();
      
      expect(doses.initial.display).toBe('2.5-5 mg IV over 2 min');
      expect(doses.initial.unit).toBe('mg');
      
      expect(doses.repeat.display).toBe('5-10 mg (if needed)');
      expect(doses.repeat.unit).toBe('mg');
    });

    it('should have null values for range doses', () => {
      const doses = getAdultTachyVerapamil();
      
      expect(doses.initial.value).toBeNull();
      expect(doses.repeat.value).toBeNull();
    });
  });

  describe('getAdultTachyMetoprolol', () => {
    it('should return dose with max doses', () => {
      const dose = getAdultTachyMetoprolol();
      
      expect(dose.display).toBe('2.5-5 mg IV over 2 min (up to 3 doses)');
      expect(dose.unit).toBe('mg');
      expect(dose.value).toBeNull();
    });
  });

  describe('getAdultTachyEsmolol', () => {
    it('should return loading and maintenance doses', () => {
      const doses = getAdultTachyEsmolol();
      
      expect(doses.loading.value).toBe(500);
      expect(doses.loading.display).toBe('500 mcg/kg over 1 min');
      expect(doses.loading.unit).toBe('mcg/kg');
      
      expect(doses.maintenance.display).toBe('50-300 mcg/kg/min');
      expect(doses.maintenance.unit).toBe('mcg/kg/min');
    });
  });

  describe('AHA 2025 Cardioversion Energy Guidelines', () => {
    it('should use rhythm-specific energies per AHA guidelines', () => {
      // AF/AFL: 200J
      expect(getAdultTachyCardioversion('afib').value).toBe(200);
      expect(getAdultTachyCardioversion('aflutter').value).toBe(200);
      
      // Narrow-complex and monomorphic VT: 100J
      expect(getAdultTachyCardioversion('narrow').value).toBe(100);
      expect(getAdultTachyCardioversion('monomorphic_vt').value).toBe(100);
      
      // Polymorphic VT: Defibrillation (not synchronized)
      expect(getAdultTachyCardioversion('polymorphic_vt').value).toBeNull();
      expect(getAdultTachyCardioversion('polymorphic_vt').display).toContain('NOT synchronized');
    });
  });

  describe('Second-line medication dosing', () => {
    it('should provide calcium channel blocker options', () => {
      const diltiazem = getAdultTachyDiltiazem();
      const verapamil = getAdultTachyVerapamil();
      
      // Both should have loading/initial and maintenance/repeat doses
      expect(diltiazem.loading).toBeDefined();
      expect(diltiazem.maintenance).toBeDefined();
      expect(verapamil.initial).toBeDefined();
      expect(verapamil.repeat).toBeDefined();
    });

    it('should provide beta-blocker options', () => {
      const metoprolol = getAdultTachyMetoprolol();
      const esmolol = getAdultTachyEsmolol();
      
      // Both should have appropriate dosing information
      expect(metoprolol.display).toContain('2.5-5 mg');
      expect(esmolol.loading.value).toBe(500);
      expect(esmolol.maintenance.display).toContain('50-300');
    });
  });
});
