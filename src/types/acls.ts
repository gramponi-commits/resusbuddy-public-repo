// ACLS/PALS Decision Support System Types
// Based on 2025 AHA Cardiac Arrest Algorithm

export type RhythmType = 'vf_pvt' | 'asystole' | 'pea' | null;

// CPR ratio options for pediatric
export type CPRRatio = '15:2' | '30:2';

// Pathway mode: Adult ACLS or Pediatric PALS
export type PathwayMode = 'adult' | 'pediatric';

export type ACLSPhase = 
  | 'pathway_selection'
  | 'initial'
  | 'cpr_pending_rhythm'
  | 'rhythm_selection'
  | 'shockable_pathway'
  | 'non_shockable_pathway'
  | 'post_rosc'
  | 'code_ended';

export type AirwayStatus = 'ambu' | 'sga' | 'ett';

export interface Intervention {
  id: string;
  timestamp: number;
  type: 'shock' | 'epinephrine' | 'amiodarone' | 'lidocaine' | 'rhythm_change' | 'rosc' | 'airway' | 'cpr_start' | 'note' | 'hs_ts_check' | 'etco2' |
        'atropine' | 'adenosine' | 'cardioversion' | 'dopamine' | 'epi_infusion' | 'beta_blocker' | 'calcium_blocker' | 'procainamide' | 'vagal_maneuver';
  details: string;
  value?: number | string;
  translationKey?: string;
  translationParams?: Record<string, string | number>;
}

export interface VitalReading {
  timestamp: number;
  etco2?: number;
  spo2?: number;
  paco2?: number;
  map?: number;
  temperature?: number;
  glucose?: number;
}

export interface HsAndTs {
  hypovolemia: boolean;
  hypoxia: boolean;
  hydrogenIon: boolean;
  hypoHyperkalemia: boolean;
  hypothermia: boolean;
  tensionPneumothorax: boolean;
  tamponade: boolean;
  toxins: boolean;
  thrombosisPulmonary: boolean;
  thrombosisCoronary: boolean;
}

// Alias for backward compatibility
export type HsAndTsState = HsAndTs;

// Pregnancy-specific causes (A-H for obstetric cardiac arrest)
export interface PregnancyCauses {
  anestheticComplications: boolean;
  bleeding: boolean;
  cardiovascular: boolean;
  drugs: boolean;
  embolic: boolean;
  fever: boolean;
  generalCauses: boolean;
  hypertension: boolean;
}

// Pregnancy-specific interventions
export interface PregnancyInterventions {
  leftUterineDisplacement: boolean;
  earlyAirway: boolean;
  ivAboveDiaphragm: boolean;
  stopMagnesiumGiveCalcium: boolean;
  detachFetalMonitors: boolean;
  massiveTransfusion: boolean;
}

export const DEFAULT_PREGNANCY_CAUSES: PregnancyCauses = {
  anestheticComplications: false,
  bleeding: false,
  cardiovascular: false,
  drugs: false,
  embolic: false,
  fever: false,
  generalCauses: false,
  hypertension: false,
};

export const DEFAULT_PREGNANCY_INTERVENTIONS: PregnancyInterventions = {
  leftUterineDisplacement: false,
  earlyAirway: false,
  ivAboveDiaphragm: false,
  stopMagnesiumGiveCalcium: false,
  detachFetalMonitors: false,
  massiveTransfusion: false,
};

// ==================== SPECIAL CIRCUMSTANCES ====================
// 8 special circumstances from 2025 AHA Guidelines (separate from pregnancy)

export interface SpecialCircumstances {
  anaphylaxis: boolean;
  asthma: boolean;
  hyperthermia: boolean;
  opioidOverdose: boolean;
  drowning: boolean;
  electrocution: boolean;
  lvadFailure: boolean;
}

export const DEFAULT_SPECIAL_CIRCUMSTANCES: SpecialCircumstances = {
  anaphylaxis: false,
  asthma: false,
  hyperthermia: false,
  opioidOverdose: false,
  drowning: false,
  electrocution: false,
  lvadFailure: false,
};

// Per-condition checklists
export interface AnaphylaxisChecklist {
  identifyTrigger: boolean;
  ivFluids: boolean;
  epinephrine: boolean;
  glucagonIfBetaBlocked: boolean;
  considerECPR: boolean;
}

export interface AsthmaChecklist {
  evaluateTensionPneumo: boolean;
  lowTidalVolumeVent: boolean;
  activeExhalation: boolean;
  bronchodilators: boolean;
  considerECLS: boolean;
}

export interface HyperthermiaChecklist {
  measureCoreTemp: boolean;
  iceWaterImmersion: boolean;
  tepidWaterCooling: boolean;
  monitorTempDuringCooling: boolean;
  stopCoolingAt38_6: boolean;
}

export interface OpioidOverdoseChecklist {
  ventilationFirst: boolean;
  naloxoneAdministered: boolean;
  repeatNaloxoneIfNeeded: boolean;
  observeForRecurrence: boolean;
}

export interface DrowningChecklist {
  earlyVentilation: boolean;
  supplementalOxygen: boolean;
  standardCPR: boolean;
  considerSpinalPrecautions: boolean;
}

export interface ElectrocutionChecklist {
  ensureSceneSafety: boolean;
  rapidDefibrillation: boolean;
  standardResuscitation: boolean;
  prolongedCPRConsideration: boolean;
}

export interface LVADFailureChecklist {
  startCompressionsImmediately: boolean;
  auscultateForHum: boolean;
  checkController: boolean;
  checkDriveline: boolean;
  checkPowerSource: boolean;
  measureBPDoppler: boolean;
}

export const DEFAULT_ANAPHYLAXIS_CHECKLIST: AnaphylaxisChecklist = {
  identifyTrigger: false,
  ivFluids: false,
  epinephrine: false,
  glucagonIfBetaBlocked: false,
  considerECPR: false,
};

export const DEFAULT_ASTHMA_CHECKLIST: AsthmaChecklist = {
  evaluateTensionPneumo: false,
  lowTidalVolumeVent: false,
  activeExhalation: false,
  bronchodilators: false,
  considerECLS: false,
};

export const DEFAULT_HYPERTHERMIA_CHECKLIST: HyperthermiaChecklist = {
  measureCoreTemp: false,
  iceWaterImmersion: false,
  tepidWaterCooling: false,
  monitorTempDuringCooling: false,
  stopCoolingAt38_6: false,
};

export const DEFAULT_OPIOID_OVERDOSE_CHECKLIST: OpioidOverdoseChecklist = {
  ventilationFirst: false,
  naloxoneAdministered: false,
  repeatNaloxoneIfNeeded: false,
  observeForRecurrence: false,
};

export const DEFAULT_DROWNING_CHECKLIST: DrowningChecklist = {
  earlyVentilation: false,
  supplementalOxygen: false,
  standardCPR: false,
  considerSpinalPrecautions: false,
};

export const DEFAULT_ELECTROCUTION_CHECKLIST: ElectrocutionChecklist = {
  ensureSceneSafety: false,
  rapidDefibrillation: false,
  standardResuscitation: false,
  prolongedCPRConsideration: false,
};

export const DEFAULT_LVAD_FAILURE_CHECKLIST: LVADFailureChecklist = {
  startCompressionsImmediately: false,
  auscultateForHum: false,
  checkController: false,
  checkDriveline: false,
  checkPowerSource: false,
  measureBPDoppler: false,
};

export interface PostROSCChecklist {
  airwaySecured: boolean;
  ventilationOptimized: boolean;
  twelveLeadECG: boolean;
  labsOrdered: boolean;
  ctHeadOrdered: boolean;
  echoOrdered: boolean;
  temperatureManagement: boolean;
  hemodynamicsOptimized: boolean;
  neurologicalAssessment: boolean;
  followingCommands: boolean | null;
  eegOrdered: boolean;
  stElevation: boolean | null;
  cardiogenicShock: boolean | null;
}

export interface PostROSCVitals {
  spo2: number | null; // Target 90-98%
  paco2: number | null; // Target 35-45 mmHg
  map: number | null; // Target ≥65 mmHg
  temperature: number | null; // Target 32-37.5°C
  glucose: number | null; // Target 70-180 mg/dL
}

export type CodeOutcome = 'rosc' | 'deceased' | null;

export interface ACLSSession {
  id: string;
  startTime: number;
  endTime: number | null;
  currentRhythm: RhythmType;
  phase: ACLSPhase;
  outcome: CodeOutcome;
  shockCount: number;
  currentEnergy: number;
  epinephrineCount: number;
  amiodaroneCount: number;
  lidocaineCount: number;
  lastEpinephrineTime: number | null;
  lastAmiodaroneTime: number | null;
  airwayStatus: AirwayStatus;
  interventions: Intervention[];
  vitalReadings: VitalReading[];
  hsAndTs: HsAndTs;
  postROSCChecklist: PostROSCChecklist;
  postROSCVitals: PostROSCVitals;
  cprCycleStartTime: number | null;
  roscTime: number | null;
  // PALS-specific fields (optional for adult mode)
  patientWeight: number | null;
  cprRatio: CPRRatio;
  // Pathway mode
  pathwayMode: PathwayMode;
  // Pregnancy-specific fields (adult only)
  pregnancyActive: boolean;
  pregnancyCauses: PregnancyCauses;
  pregnancyInterventions: PregnancyInterventions;
  pregnancyStartTime: number | null;
  // Special Circumstances (applies to both adult and pediatric)
  specialCircumstances: SpecialCircumstances;
  anaphylaxisChecklist: AnaphylaxisChecklist;
  asthmaChecklist: AsthmaChecklist;
  hyperthermiaChecklist: HyperthermiaChecklist;
  opioidOverdoseChecklist: OpioidOverdoseChecklist;
  drowningChecklist: DrowningChecklist;
  electrocutionChecklist: ElectrocutionChecklist;
  lvadFailureChecklist: LVADFailureChecklist;
  // BradyTachy-specific field (for combined sessions)
  bradyTachyStartTime: number | null;
}

export interface ACLSConfig {
  biphasicMinJoules: number;
  biphasicMaxJoules: number;
  epinephrineIntervalMs: number;
  rhythmCheckIntervalMs: number;
  preShockAlertAdvanceMs: number;
  amiodaroneFirstDose: number;
  amiodaroneSecondDose: number;
  lidocaineDose: number;
  epinephrineDose: number;
}

// Config uses 4 minute epi interval for both ACLS and PALS
export const DEFAULT_ACLS_CONFIG: ACLSConfig = {
  biphasicMinJoules: 2, // 2 J/kg for first shock (PALS) or 200J (ACLS)
  biphasicMaxJoules: 4, // 4 J/kg for subsequent shocks (PALS) or 360J (ACLS)
  epinephrineIntervalMs: 4 * 60 * 1000, // 4 minutes for BOTH ACLS and PALS
  rhythmCheckIntervalMs: 2 * 60 * 1000, // 2 minutes
  preShockAlertAdvanceMs: 15 * 1000, // 15 seconds
  amiodaroneFirstDose: 5, // 5 mg/kg (PALS) or 300mg (ACLS)
  amiodaroneSecondDose: 5, // 5 mg/kg (PALS) or 150mg (ACLS)
  lidocaineDose: 1, // 1 mg/kg (PALS) or 100mg (ACLS)
  epinephrineDose: 0.01, // 0.01 mg/kg (PALS) or 1mg (ACLS)
};

export const DEFAULT_HS_AND_TS: HsAndTs = {
  hypovolemia: false,
  hypoxia: false,
  hydrogenIon: false,
  hypoHyperkalemia: false,
  hypothermia: false,
  tensionPneumothorax: false,
  tamponade: false,
  toxins: false,
  thrombosisPulmonary: false,
  thrombosisCoronary: false,
};

export const DEFAULT_POST_ROSC_CHECKLIST: PostROSCChecklist = {
  airwaySecured: false,
  ventilationOptimized: false,
  twelveLeadECG: false,
  labsOrdered: false,
  ctHeadOrdered: false,
  echoOrdered: false,
  temperatureManagement: false,
  hemodynamicsOptimized: false,
  neurologicalAssessment: false,
  followingCommands: null,
  eegOrdered: false,
  stElevation: null,
  cardiogenicShock: null,
};

export const DEFAULT_POST_ROSC_VITALS: PostROSCVitals = {
  spo2: null,
  paco2: null,
  map: null,
  temperature: null,
  glucose: null,
};

export function createInitialSession(): ACLSSession {
  return {
    id: crypto.randomUUID(),
    startTime: Date.now(),
    endTime: null,
    currentRhythm: null,
    phase: 'pathway_selection', // Start with pathway selection
    outcome: null,
    shockCount: 0,
    currentEnergy: 0,
    epinephrineCount: 0,
    amiodaroneCount: 0,
    lidocaineCount: 0,
    lastEpinephrineTime: null,
    lastAmiodaroneTime: null,
    airwayStatus: 'ambu',
    interventions: [],
    vitalReadings: [],
    hsAndTs: { ...DEFAULT_HS_AND_TS },
    postROSCChecklist: { ...DEFAULT_POST_ROSC_CHECKLIST },
    postROSCVitals: { ...DEFAULT_POST_ROSC_VITALS },
    cprCycleStartTime: null,
    roscTime: null,
    patientWeight: null,
    cprRatio: '15:2', // Default to 2-rescuer pediatric ratio (will be ignored for adult)
    pathwayMode: 'adult', // Default, will be set by pathway selector
    pregnancyActive: false,
    pregnancyCauses: { ...DEFAULT_PREGNANCY_CAUSES },
    pregnancyInterventions: { ...DEFAULT_PREGNANCY_INTERVENTIONS },
    pregnancyStartTime: null,
    specialCircumstances: { ...DEFAULT_SPECIAL_CIRCUMSTANCES },
    anaphylaxisChecklist: { ...DEFAULT_ANAPHYLAXIS_CHECKLIST },
    asthmaChecklist: { ...DEFAULT_ASTHMA_CHECKLIST },
    hyperthermiaChecklist: { ...DEFAULT_HYPERTHERMIA_CHECKLIST },
    opioidOverdoseChecklist: { ...DEFAULT_OPIOID_OVERDOSE_CHECKLIST },
    drowningChecklist: { ...DEFAULT_DROWNING_CHECKLIST },
    electrocutionChecklist: { ...DEFAULT_ELECTROCUTION_CHECKLIST },
    lvadFailureChecklist: { ...DEFAULT_LVAD_FAILURE_CHECKLIST },
    bradyTachyStartTime: null,
  };
}

// ==================== BRADYCARDIA/TACHYCARDIA MODULE TYPES ====================
// New module for managing symptomatic bradycardia and tachycardia (with pulse)

export type BradyTachyPhase =
  | 'patient_selection'
  | 'branch_selection'
  | 'bradycardia_assessment'
  | 'bradycardia_treatment'
  | 'tachycardia_assessment'
  | 'tachycardia_sinus_evaluation'      // NEW: first decision for pediatric
  | 'tachycardia_compromise_assessment' // NEW: cardiopulmonary compromise check
  | 'tachycardia_sinus_vs_svt'
  | 'tachycardia_treatment'
  | 'session_ended';

export type BradyTachyBranch = 'bradycardia' | 'tachycardia' | null;

export type StabilityStatus = 'stable' | 'unstable' | null;

export type QRSWidth = 'narrow' | 'wide' | null;

export type RhythmRegularity = 'regular' | 'irregular' | null;

export type PedsSinusVsSVT = 'probable_sinus' | 'probable_svt' | null;

export type CardioversionRhythmType = 'afib' | 'aflutter' | 'narrow' | 'monomorphic_vt' | 'polymorphic_vt' | null;

// Decision context for enhanced logging
export interface BradyTachyDecisionContext {
  patientGroup: PathwayMode;
  weightKg: number | null;
  branch: BradyTachyBranch;
  stability: StabilityStatus;
  qrsWidth: QRSWidth;
  rhythmRegular: RhythmRegularity;
  monomorphic: boolean | null;
  pedsSinusVsSVTChoice: PedsSinusVsSVT;
  cardioversionRhythmType: CardioversionRhythmType;
  // Criteria tracking for pediatric SVT/Sinus distinction
  sinusTachyCriteria?: {
    pWavesPresent: boolean;
    variableRR: boolean;
    appropriateRate: boolean;
  };
  svtCriteria?: {
    pWavesAbnormal: boolean;
    fixedRR: boolean;
    inappropriateRate: boolean;
    abruptRateChange: boolean;
  };
}

// Intervention specific to brady/tachy module
export interface BradyTachyIntervention {
  id: string;
  timestamp: number;
  type: 'atropine' | 'adenosine' | 'cardioversion' | 'dopamine' | 'epi_infusion' |
        'beta_blocker' | 'calcium_blocker' | 'procainamide' | 'amiodarone' | 'vagal_maneuver' |
        'diltiazem' | 'verapamil' | 'metoprolol' | 'esmolol' |
        'switch_to_arrest' | 'note' | 'assessment' | 'decision';
  details: string;
  value?: number | string;
  doseStep?: number; // e.g., adenosine dose 1 vs dose 2
  calculatedDose?: string; // calculated dose if weight present
  decisionContext?: Partial<BradyTachyDecisionContext>; // capture decision at time of intervention
  translationKey?: string;
  translationParams?: Record<string, string | number>;
}

export interface BradyTachySession {
  id: string;
  startTime: number;
  endTime: number | null;
  phase: BradyTachyPhase;
  decisionContext: BradyTachyDecisionContext;
  interventions: BradyTachyIntervention[];
  outcome: 'resolved' | 'switched_to_arrest' | 'transferred' | null;
  switchedToArrestTime: number | null;
}

export function createInitialBradyTachySession(): BradyTachySession {
  return {
    id: crypto.randomUUID(),
    startTime: Date.now(),
    endTime: null,
    phase: 'patient_selection',
    decisionContext: {
      patientGroup: 'adult',
      weightKg: null,
      branch: null,
      stability: null,
      qrsWidth: null,
      rhythmRegular: null,
      monomorphic: null,
      pedsSinusVsSVTChoice: null,
      cardioversionRhythmType: null,
    },
    interventions: [],
    outcome: null,
    switchedToArrestTime: null,
  };
}
