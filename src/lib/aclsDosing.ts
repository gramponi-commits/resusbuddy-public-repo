// ACLS Adult Fixed Dosing
// Based on AHA 2025 ACLS Cardiac Arrest Algorithm

export interface ACLSDose {
  value: number;
  display: string;
  unit: string;
}

export interface ACLSDosingConfig {
  epinephrineDose: number; // 1 mg fixed
  amiodaroneFirstDose: number; // 300 mg
  amiodaroneSecondDose: number; // 150 mg
  lidocaineFirstDose: number; // 1-1.5 mg/kg or ~100mg for 70kg adult
  lidocaineMaintenanceDose: number; // 0.5-0.75 mg/kg
  defaultShockEnergy: number; // 200J biphasic
  maxShockEnergy: number; // 360J
  epinephrineIntervalMs: number; // 4 minutes
}

export const DEFAULT_ACLS_DOSING_CONFIG: ACLSDosingConfig = {
  epinephrineDose: 1, // mg
  amiodaroneFirstDose: 300, // mg
  amiodaroneSecondDose: 150, // mg
  lidocaineFirstDose: 100, // mg (approx for adult)
  lidocaineMaintenanceDose: 50, // mg
  defaultShockEnergy: 200, // J
  maxShockEnergy: 360, // J
  epinephrineIntervalMs: 4 * 60 * 1000, // 4 minutes
};

/**
 * Get fixed epinephrine dose for adult patient
 * Dose: 1 mg IV/IO every 4 minutes
 */
export function getAdultEpinephrineDose(): ACLSDose {
  return {
    value: DEFAULT_ACLS_DOSING_CONFIG.epinephrineDose,
    display: '1 mg',
    unit: 'mg',
  };
}

/**
 * Get amiodarone dose for adult patient
 * First dose: 300 mg IV/IO
 * Second dose: 150 mg IV/IO
 */
export function getAdultAmiodaroneDose(doseNumber: number): ACLSDose {
  const isFirstDose = doseNumber === 0;
  const dose = isFirstDose 
    ? DEFAULT_ACLS_DOSING_CONFIG.amiodaroneFirstDose 
    : DEFAULT_ACLS_DOSING_CONFIG.amiodaroneSecondDose;
  
  return {
    value: dose,
    display: `${dose} mg`,
    unit: 'mg',
  };
}

/**
 * Get lidocaine dose for adult patient
 * First dose: 1-1.5 mg/kg (~100mg for average adult)
 * Maintenance: 0.5-0.75 mg/kg
 */
export function getAdultLidocaineDose(doseNumber: number): ACLSDose {
  const isFirstDose = doseNumber === 0;
  const dose = isFirstDose 
    ? DEFAULT_ACLS_DOSING_CONFIG.lidocaineFirstDose 
    : DEFAULT_ACLS_DOSING_CONFIG.lidocaineMaintenanceDose;
  
  return {
    value: dose,
    display: `${dose} mg`,
    unit: 'mg',
  };
}

/**
 * Get shock energy for adult patient
 * Uses fixed energy from settings (default 200J biphasic)
 * Can escalate to max 360J
 */
export function getAdultShockEnergy(shockNumber: number, defibrillatorEnergy: number = 200): ACLSDose {
  // For adults, typically use fixed energy or escalate
  // First shock at configured energy, can escalate to max
  const energy = Math.min(defibrillatorEnergy, DEFAULT_ACLS_DOSING_CONFIG.maxShockEnergy);
  
  return {
    value: energy,
    display: `${energy}J`,
    unit: 'J',
  };
}
