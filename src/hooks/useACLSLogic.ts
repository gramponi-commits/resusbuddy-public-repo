import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ACLSSession,
  ACLSConfig,
  DEFAULT_ACLS_CONFIG,
  RhythmType,
  AirwayStatus,
  Intervention,
  HsAndTs,
  PostROSCChecklist,
  PostROSCVitals,
  CodeOutcome,
  CPRRatio,
  PathwayMode,
  PregnancyCauses,
  PregnancyInterventions,
  SpecialCircumstances,
  AnaphylaxisChecklist,
  AsthmaChecklist,
  HyperthermiaChecklist,
  OpioidOverdoseChecklist,
  DrowningChecklist,
  ElectrocutionChecklist,
  LVADFailureChecklist,
  createInitialSession,
} from '@/types/acls';
import { StoredSession, saveSession } from '@/lib/sessionStorage';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import {
  calculateEpinephrineDose,
  calculateAmiodaroneDose,
  calculateLidocaineDose,
  calculateShockEnergy,
} from '@/lib/palsDosing';
import {
  getAdultEpinephrineDose,
  getAdultAmiodaroneDose,
  getAdultLidocaineDose,
  getAdultShockEnergy,
} from '@/lib/aclsDosing';
import { formatEtco2Value, getEtco2UnitLabel } from '@/lib/etco2Units';

interface CommandBanner {
  message: string;
  priority: 'critical' | 'warning' | 'info' | 'success';
  subMessage?: string;
}

interface TimerState {
  cprCycleRemaining: number;
  epiRemaining: number;
  totalElapsed: number;
  totalCPRTime: number;
  preShockAlert: boolean;
  rhythmCheckDue: boolean;
}

type InitialRhythm = Exclude<RhythmType, null>;

function parseRhythmCode(value: unknown): InitialRhythm | null {
  if (value === 'vf_pvt' || value === 'asystole' || value === 'pea') {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized.includes('vf') || normalized.includes('pvt')) return 'vf_pvt';
  if (normalized.includes('pea')) return 'pea';
  if (normalized.includes('asyst')) return 'asystole';

  return null;
}

function inferInitialRhythm(session: ACLSSession): InitialRhythm | null {
  if (session.initialRhythm) {
    return session.initialRhythm;
  }

  const identifiedEvent = [...session.interventions]
    .sort((a, b) => a.timestamp - b.timestamp)
    .find(i => i.translationKey === 'interventions.rhythmIdentified' || i.type === 'rhythm_change');

  const fromValue = parseRhythmCode(identifiedEvent?.value);
  if (fromValue) {
    return fromValue;
  }

  const fromParam = parseRhythmCode(identifiedEvent?.translationParams?.rhythm);
  if (fromParam) {
    return fromParam;
  }

  // Legacy fallback for sessions where first identified rhythm details are unavailable.
  if (session.interventions.some(i => i.type === 'shock')) {
    return 'vf_pvt';
  }

  if (session.shockCount > 0) {
    return 'vf_pvt';
  }

  return parseRhythmCode(session.currentRhythm);
}

export function useACLSLogic(config: ACLSConfig = DEFAULT_ACLS_CONFIG, defibrillatorEnergy: number = 200) {
  const { t } = useTranslation();
  const [session, setSession] = useState<ACLSSession>(createInitialSession);
  const [timerState, setTimerState] = useState<TimerState>({
    cprCycleRemaining: config.rhythmCheckIntervalMs,
    epiRemaining: config.epinephrineIntervalMs,
    totalElapsed: 0,
    totalCPRTime: 0,
    preShockAlert: false,
    rhythmCheckDue: false,
  });
  const [isInRhythmCheck, setIsInRhythmCheck] = useState(false);
  const [emergencyDeliveryBannerDismissed, setEmergencyDeliveryBannerDismissed] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const cprActiveRef = useRef<boolean>(false);
  const lastTickRef = useRef<number>(Date.now());

  // Timer logic - now also runs during cpr_pending_rhythm
  useEffect(() => {
    const isActive = session.phase === 'shockable_pathway' || 
                     session.phase === 'non_shockable_pathway' ||
                     session.phase === 'cpr_pending_rhythm';
    
    if (isActive && !isInRhythmCheck) {
      cprActiveRef.current = true;
      lastTickRef.current = Date.now();
      
      intervalRef.current = window.setInterval(() => {
        const now = Date.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        
        setTimerState(prev => {
          // During cpr_pending_rhythm, don't track rhythm check cycle yet
          const cprCycleRemaining = session.phase === 'cpr_pending_rhythm' 
            ? config.rhythmCheckIntervalMs
            : session.cprCycleStartTime 
              ? Math.max(0, config.rhythmCheckIntervalMs - (now - session.cprCycleStartTime))
              : config.rhythmCheckIntervalMs;
          
          // During cpr_pending_rhythm, epi timer doesn't run (we don't know pathway yet)
          const epiRemaining = session.phase === 'cpr_pending_rhythm'
            ? config.epinephrineIntervalMs
            : session.lastEpinephrineTime
              ? Math.max(0, config.epinephrineIntervalMs - (now - session.lastEpinephrineTime))
              : (session.phase === 'non_shockable_pathway' && session.epinephrineCount === 0) ? 0 : prev.epiRemaining;
          
          const preShockAlert = session.phase !== 'cpr_pending_rhythm' && 
            cprCycleRemaining > 0 && 
            cprCycleRemaining <= config.preShockAlertAdvanceMs;
          
          const rhythmCheckDue = session.phase !== 'cpr_pending_rhythm' && cprCycleRemaining === 0;

          // Only accumulate CPR time when actively doing CPR (not in rhythm check)
          const totalCPRTime = cprActiveRef.current ? prev.totalCPRTime + delta : prev.totalCPRTime;

          return { 
            cprCycleRemaining, 
            epiRemaining, 
            preShockAlert,
            rhythmCheckDue,
            totalElapsed: now - session.startTime,
            totalCPRTime,
          };
        });
      }, 100);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        cprActiveRef.current = false;
      };
    } else {
      cprActiveRef.current = false;
    }
  }, [session.phase, session.cprCycleStartTime, session.lastEpinephrineTime, session.startTime, session.epinephrineCount, isInRhythmCheck, config]);

  // Update total elapsed even during rhythm check
  useEffect(() => {
    if (isInRhythmCheck) {
      const interval = window.setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          totalElapsed: Date.now() - session.startTime,
        }));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isInRhythmCheck, session.startTime]);

  // Auto-save session when code ends (ROSC or death)
  // For post-ROSC: continuous autosave with debouncing
  // For code_ended: single autosave
  const hasAutoSavedRef = useRef(false);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  const sessionRef = useRef(session);
  const timerRef = useRef(timerState);
  
  // Keep refs updated with latest values
  useEffect(() => {
    sessionRef.current = session;
    timerRef.current = timerState;
  }, [session, timerState]);
  
  useEffect(() => {
    const isPostROSC = session.phase === 'post_rosc';
    const isCodeEnded = session.phase === 'code_ended';
    const isTerminalPhase = isPostROSC || isCodeEnded;
    const hasEndTime = session.endTime !== null;
    
    if (isTerminalPhase && hasEndTime) {
      // For code_ended: save once
      // For post_rosc: save on every update with debouncing
      const shouldSaveOnce = isCodeEnded && !hasAutoSavedRef.current;
      const shouldSaveContinuously = isPostROSC;
      
      if (shouldSaveOnce) {
        hasAutoSavedRef.current = true;
      }
      
      if (shouldSaveOnce || shouldSaveContinuously) {
        // Clear any pending save timeout
        if (autoSaveTimeoutRef.current !== null) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        
        // Debounce: save after 2 seconds of no changes
        autoSaveTimeoutRef.current = window.setTimeout(async () => {
          try {
            // Use refs to get latest values at save time
            const sessionSnapshot = sessionRef.current;
            const timerSnapshot = timerRef.current;
            
            const cprFraction = timerSnapshot.totalElapsed > 0
              ? (timerSnapshot.totalCPRTime / timerSnapshot.totalElapsed) * 100
              : 0;

            const hasBradyTachySwitch = sessionSnapshot.bradyTachyStartTime !== null;

            const storedSession: StoredSession = {
              id: sessionSnapshot.id,
              savedAt: Date.now(),
              startTime: sessionSnapshot.startTime,
              endTime: sessionSnapshot.endTime,
              roscTime: sessionSnapshot.roscTime,
              outcome: sessionSnapshot.outcome,
              duration: timerSnapshot.totalElapsed,
              totalCPRTime: timerSnapshot.totalCPRTime,
              cprFraction,
              shockCount: sessionSnapshot.shockCount,
              epinephrineCount: sessionSnapshot.epinephrineCount,
              amiodaroneCount: sessionSnapshot.amiodaroneCount,
              lidocaineCount: sessionSnapshot.lidocaineCount,
              sessionType: hasBradyTachySwitch ? 'bradytachy-arrest' : 'cardiac-arrest',
              pathwayMode: sessionSnapshot.pathwayMode,
              patientWeight: sessionSnapshot.patientWeight,
              interventions: sessionSnapshot.interventions.map(i => ({
                timestamp: i.timestamp,
                type: i.type,
                details: i.details,
                value: i.value,
                translationKey: i.translationKey,
                translationParams: i.translationParams,
              })),
              etco2Readings: sessionSnapshot.vitalReadings
                .filter(v => v.etco2 !== undefined)
                .map(v => ({ timestamp: v.timestamp, value: v.etco2! })),
              hsAndTs: sessionSnapshot.hsAndTs,
              postROSCChecklist: sessionSnapshot.phase === 'post_rosc' || sessionSnapshot.outcome === 'rosc' ? sessionSnapshot.postROSCChecklist : null,
              postROSCVitals: sessionSnapshot.phase === 'post_rosc' || sessionSnapshot.outcome === 'rosc' ? sessionSnapshot.postROSCVitals : null,
              airwayStatus: sessionSnapshot.airwayStatus,
              pregnancyActive: sessionSnapshot.pregnancyActive,
              pregnancyCauses: sessionSnapshot.pregnancyActive ? sessionSnapshot.pregnancyCauses : undefined,
              pregnancyInterventions: sessionSnapshot.pregnancyActive ? sessionSnapshot.pregnancyInterventions : undefined,
              bradyTachyStartTime: sessionSnapshot.bradyTachyStartTime,
            };

            await saveSession(storedSession);
            logger.sessionEvent('Session auto-saved successfully', {
              id: storedSession.id,
              outcome: storedSession.outcome,
              phase: sessionSnapshot.phase,
              duration: storedSession.duration,
              interventions: storedSession.interventions.length,
              postROSCData: storedSession.postROSCChecklist ? 'included' : 'not included'
            });
          } catch (error) {
            logger.error('Failed to auto-save session', error);
          }
        }, 2000);
      }
    }
    
    return () => {
      if (autoSaveTimeoutRef.current !== null) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    session.phase, 
    session.endTime, 
    session.postROSCChecklist, 
    session.postROSCVitals,
    session.interventions.length  // Track new interventions during post-ROSC
  ]);

  // Reset auto-save flag when starting a new session
  useEffect(() => {
    if (session.phase === 'initial' || session.phase === 'rhythm_selection' || session.phase === 'pathway_selection' || session.phase === 'cpr_pending_rhythm') {
      if (hasAutoSavedRef.current) {
        logger.sessionEvent('Resetting auto-save flag - new session started');
        hasAutoSavedRef.current = false;
      }
    }
  }, [session.phase]);

  // Backfill initial rhythm once for legacy/in-flight sessions that don't have it yet.
  useEffect(() => {
    if (session.initialRhythm !== null) {
      return;
    }

    const inferred = inferInitialRhythm(session);
    if (!inferred) {
      return;
    }

    setSession(prev => {
      if (prev.initialRhythm !== null) {
        return prev;
      }
      return {
        ...prev,
        initialRhythm: inferred,
      };
    });
  }, [session.initialRhythm, session.currentRhythm, session.interventions, session.shockCount]);

  const addIntervention = useCallback((
    type: Intervention['type'],
    details: string,
    value?: number | string,
    translationKey?: string,
    translationParams?: Record<string, string | number>
  ) => {
    const intervention: Intervention = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      details,
      value,
      translationKey,
      translationParams,
    };
    setSession(prev => ({
      ...prev,
      interventions: [...prev.interventions, intervention],
    }));
    // Auto-dismiss emergency delivery banner on any intervention
    setEmergencyDeliveryBannerDismissed(true);
  }, []);

  // Import interventions from brady/tachy module
  const importInterventions = useCallback((interventions: Array<{
    timestamp: number;
    type: string;
    details: string;
    value?: number | string;
    translationKey?: string;
    translationParams?: Record<string, string | number>;
  }>, bradyTachyStartTime?: number) => {
    setSession(prev => ({
      ...prev,
      interventions: interventions.map(i => ({
        id: crypto.randomUUID(),
        timestamp: i.timestamp,
        type: i.type as Intervention['type'],
        details: i.details,
        value: i.value,
        translationKey: i.translationKey,
        translationParams: i.translationParams,
      })),
      bradyTachyStartTime: bradyTachyStartTime || null,
    }));
  }, []);

  // NEW: Start CPR without rhythm selection
  const startCPR = useCallback(() => {
    const now = Date.now();
    setSession(prev => ({
      ...prev,
      startTime: now,
      phase: 'cpr_pending_rhythm',
      interventions: [...prev.interventions, {
        id: crypto.randomUUID(),
        timestamp: now,
        type: 'cpr_start' as const,
        details: t('interventions.cprInitiated'),
        translationKey: 'interventions.cprInitiated',
      }],
    }));
  }, [t]);

  // Modified: selectRhythm now handles both initial selection and rhythm analysis during cpr_pending_rhythm
  // When VF/pVT is identified, first shock is delivered immediately
  const selectRhythm = useCallback((rhythm: RhythmType) => {
    const now = Date.now();
    const isShockable = rhythm === 'vf_pvt';
    const rhythmName = rhythm === 'vf_pvt' ? 'VF/pVT' : rhythm === 'asystole' ? t('rhythm.asystole') : 'PEA';

    setSession(prev => {
      const newPhase = isShockable ? 'shockable_pathway' : 'non_shockable_pathway';
      const interventions: Intervention[] = [...prev.interventions, {
        id: crypto.randomUUID(),
        timestamp: now,
        type: 'rhythm_change' as const,
        details: t('interventions.rhythmIdentified', { rhythm: rhythmName }),
        value: rhythm,
        translationKey: 'interventions.rhythmIdentified',
        translationParams: { rhythm: rhythmName },
      }];

      // If shockable rhythm, deliver first shock immediately
      if (isShockable) {
        // Calculate correct shock energy based on pathway mode
        const firstShockEnergy = prev.pathwayMode === 'pediatric'
          ? calculateShockEnergy(prev.patientWeight, 0).value  // First shock (count = 0)
          : getAdultShockEnergy(0, defibrillatorEnergy).value;  // First shock (count = 0)

        interventions.push({
          id: crypto.randomUUID(),
          timestamp: now,
          type: 'shock' as const,
          details: t('interventions.shockDelivered', { number: 1, energy: firstShockEnergy }),
          value: firstShockEnergy,
          translationKey: 'interventions.shockDelivered',
          translationParams: { number: 1, energy: firstShockEnergy },
        });
      }

      return {
        ...prev,
        currentRhythm: rhythm,
        initialRhythm: prev.initialRhythm ?? rhythm,
        phase: newPhase,
        cprCycleStartTime: now,
        interventions,
        // If shockable, count first shock and set energy for next shock
        shockCount: isShockable ? 1 : prev.shockCount,
        currentEnergy: isShockable ? config.biphasicMaxJoules : prev.currentEnergy,
      };
    });
  }, [t, defibrillatorEnergy, config.biphasicMaxJoules]);

  const startRhythmCheck = useCallback(() => {
    setIsInRhythmCheck(true);
    cprActiveRef.current = false;
    addIntervention('note', t('interventions.rhythmCheckPaused'), undefined, 'interventions.rhythmCheckPaused');
  }, [addIntervention, t]);

  const completeRhythmCheckWithShock = useCallback((defibrillatorEnergy: number) => {
    const now = Date.now();
    const shockNumber = session.shockCount + 1;
    
    setSession(prev => {
      const newShockCount = prev.shockCount + 1;
      
      return {
        ...prev,
        shockCount: newShockCount,
        cprCycleStartTime: now,
        phase: 'shockable_pathway',
        currentRhythm: 'vf_pvt',
      };
    });

    addIntervention('shock', t('interventions.shockDelivered', { number: shockNumber, energy: defibrillatorEnergy }), defibrillatorEnergy, 'interventions.shockDelivered', { number: shockNumber, energy: defibrillatorEnergy });
    setIsInRhythmCheck(false);
  }, [session.shockCount, addIntervention, t]);

  const completeRhythmCheckNoShock = useCallback((newRhythm: 'asystole' | 'pea') => {
    const now = Date.now();
    const rhythmName = newRhythm === 'asystole' ? t('rhythm.asystole') : 'PEA';
    
    setSession(prev => ({
      ...prev,
      currentRhythm: newRhythm,
      phase: 'non_shockable_pathway',
      cprCycleStartTime: now,
    }));

    addIntervention(
      'rhythm_change',
      t('interventions.noShockResume', { rhythm: rhythmName }),
      newRhythm,
      'interventions.noShockResume',
      { rhythm: rhythmName },
    );
    setIsInRhythmCheck(false);
  }, [addIntervention, t]);

  const completeRhythmCheckResumeCPR = useCallback(() => {
    const now = Date.now();
    setSession(prev => ({
      ...prev,
      cprCycleStartTime: now,
    }));

    addIntervention('cpr_start', t('interventions.cprResumedSame'), undefined, 'interventions.cprResumedSame');
    setIsInRhythmCheck(false);
  }, [addIntervention, t]);

  const achieveROSC = useCallback(() => {
    const now = Date.now();
    setSession(prev => ({
      ...prev,
      phase: 'post_rosc',
      outcome: 'rosc',
      roscTime: now,
      endTime: now,
    }));

    addIntervention('rosc', t('interventions.roscAchieved'), undefined, 'interventions.roscAchieved');
    setIsInRhythmCheck(false);
  }, [addIntervention, t]);

  const terminateCode = useCallback(() => {
    const now = Date.now();
    setSession(prev => ({
      ...prev,
      phase: 'code_ended',
      outcome: 'deceased',
      endTime: now,
    }));

    addIntervention('note', t('interventions.codeTerminated'), undefined, 'interventions.codeTerminated');
    setIsInRhythmCheck(false);
  }, [addIntervention, t]);

  const giveEpinephrine = useCallback(() => {
    const now = Date.now();
    // Use pathway-appropriate dosing
    const dose = session.pathwayMode === 'pediatric' 
      ? calculateEpinephrineDose(session.patientWeight)
      : getAdultEpinephrineDose();
    
    setSession(prev => ({
      ...prev,
      epinephrineCount: prev.epinephrineCount + 1,
      lastEpinephrineTime: now,
    }));

    addIntervention('epinephrine', t('interventions.epinephrineGiven', { dose: dose.display }), dose.display, 'interventions.epinephrineGiven', { dose: dose.display });
  }, [session.patientWeight, session.pathwayMode, addIntervention, t]);

  const giveAmiodarone = useCallback(() => {
    // Use pathway-appropriate dosing
    const dose = session.pathwayMode === 'pediatric'
      ? calculateAmiodaroneDose(session.patientWeight, session.amiodaroneCount)
      : getAdultAmiodaroneDose(session.amiodaroneCount);
    
    setSession(prev => ({
      ...prev,
      amiodaroneCount: prev.amiodaroneCount + 1,
      lastAmiodaroneTime: Date.now(),
    }));

    addIntervention('amiodarone', t('interventions.amiodaroneGiven', { dose: dose.display }), dose.display, 'interventions.amiodaroneGiven', { dose: dose.display });
  }, [session.patientWeight, session.amiodaroneCount, session.pathwayMode, addIntervention, t]);

  const giveLidocaine = useCallback(() => {
    // Use pathway-appropriate dosing
    const dose = session.pathwayMode === 'pediatric'
      ? calculateLidocaineDose(session.patientWeight)
      : getAdultLidocaineDose(session.lidocaineCount);
    
    setSession(prev => ({
      ...prev,
      lidocaineCount: prev.lidocaineCount + 1,
    }));

    addIntervention('lidocaine', t('interventions.lidocaineGiven', { dose: dose.display }), dose.display, 'interventions.lidocaineGiven', { dose: dose.display });
  }, [session.patientWeight, session.lidocaineCount, session.pathwayMode, addIntervention, t]);

  const setAirway = useCallback((status: AirwayStatus) => {
    setSession(prev => ({
      ...prev,
      airwayStatus: status,
    }));

    const airwayKey = status === 'ett'
      ? 'interventions.airwayEtt'
      : status === 'sga'
        ? 'interventions.airwaySga'
        : 'interventions.airwayAmbu';
    const airwayText = t(airwayKey);
    addIntervention('airway', airwayText, undefined, airwayKey);
  }, [addIntervention, t]);

  const recordETCO2 = useCallback((value: number) => {
    const timestamp = Date.now();
    const displayValue = formatEtco2Value(value, 'mmhg');
    const displayUnit = getEtco2UnitLabel('mmhg');

    setSession(prev => ({
      ...prev,
      vitalReadings: [...prev.vitalReadings, { timestamp, etco2: value }],
    }));

    addIntervention(
      'etco2',
      t('interventions.etco2Recorded', { value: displayValue, unit: displayUnit }),
      value,
      'interventions.etco2Recorded',
      { value: displayValue, unit: displayUnit },
    );
  }, [addIntervention, t]);

  const updateHsAndTs = useCallback((updates: Partial<HsAndTs>) => {
    setSession(prev => ({
      ...prev,
      hsAndTs: { ...prev.hsAndTs, ...updates },
    }));

    const checkedItems = Object.entries(updates)
      .filter(([, value]) => value)
      .map(([key]) => key);

    if (checkedItems.length > 0) {
      const translatedItems = checkedItems
        .map(key => t(`hsTs.${key}`))
        .join(', ');
      addIntervention('hs_ts_check', t('interventions.hsTsChecked', { items: translatedItems }), undefined, 'interventions.hsTsChecked', { items: translatedItems });
    }
  }, [addIntervention, t]);

  const updatePostROSCChecklist = useCallback((updates: Partial<PostROSCChecklist>) => {
    setSession(prev => ({
      ...prev,
      postROSCChecklist: { ...prev.postROSCChecklist, ...updates },
    }));
  }, []);

  const updatePostROSCVitals = useCallback((updates: Partial<PostROSCVitals>) => {
    setSession(prev => ({
      ...prev,
      postROSCVitals: { ...prev.postROSCVitals, ...updates },
    }));
  }, []);

  const endCode = useCallback((outcome: 'rosc' | 'deceased' | 'transferred') => {
    setSession(prev => ({
      ...prev,
      phase: 'code_ended',
      endTime: Date.now(),
    }));

    addIntervention('note', t('interventions.codeEnded', { outcome }), undefined, 'interventions.codeEnded', { outcome });
  }, [addIntervention, t]);

  const resetSession = useCallback(() => {
    setSession(createInitialSession());
    setTimerState({
      cprCycleRemaining: config.rhythmCheckIntervalMs,
      epiRemaining: config.epinephrineIntervalMs,
      totalElapsed: 0,
      totalCPRTime: 0,
      preShockAlert: false,
      rhythmCheckDue: false,
    });
    setIsInRhythmCheck(false);
    setEmergencyDeliveryBannerDismissed(false);
  }, [config]);

  const resumeSession = useCallback((savedSession: ACLSSession, savedTimerState: { totalElapsed: number; totalCPRTime: number; savedAt: number }) => {
    const now = Date.now();
    const elapsedSinceSave = now - savedTimerState.savedAt;
    
    // Recalculate times based on how long ago the session was saved
    const newSession = {
      ...savedSession,
      initialRhythm: inferInitialRhythm(savedSession),
      // Update cprCycleStartTime to account for time passed
      cprCycleStartTime: savedSession.cprCycleStartTime 
        ? savedSession.cprCycleStartTime + elapsedSinceSave 
        : null,
      // Update lastEpinephrineTime to account for time passed
      lastEpinephrineTime: savedSession.lastEpinephrineTime 
        ? savedSession.lastEpinephrineTime + elapsedSinceSave 
        : null,
    };
    
    setSession(newSession);
    setTimerState({
      cprCycleRemaining: config.rhythmCheckIntervalMs,
      epiRemaining: config.epinephrineIntervalMs,
      totalElapsed: savedTimerState.totalElapsed,
      totalCPRTime: savedTimerState.totalCPRTime,
      preShockAlert: false,
      rhythmCheckDue: false,
    });
    setIsInRhythmCheck(false);
  }, [config]);

  const dismissEmergencyDeliveryBanner = useCallback(() => {
    setEmergencyDeliveryBannerDismissed(true);
  }, []);

  const exportSession = useCallback(async () => {
    const cprFraction = timerState.totalElapsed > 0
      ? (timerState.totalCPRTime / timerState.totalElapsed) * 100
      : 0;

    const hasBradyTachySwitch = session.bradyTachyStartTime !== null;

    // Convert current session to StoredSession format for saving
    const storedSession: StoredSession = {
      id: session.id,
      savedAt: Date.now(),
      startTime: session.startTime,
      endTime: session.endTime,
      roscTime: session.roscTime,
      outcome: session.outcome,
      duration: timerState.totalElapsed,
      totalCPRTime: timerState.totalCPRTime,
      cprFraction,
      shockCount: session.shockCount,
      epinephrineCount: session.epinephrineCount,
      amiodaroneCount: session.amiodaroneCount,
      lidocaineCount: session.lidocaineCount,
      sessionType: hasBradyTachySwitch ? 'bradytachy-arrest' : 'cardiac-arrest',
      pathwayMode: session.pathwayMode,
      patientWeight: session.patientWeight,
      interventions: session.interventions.map(i => ({
        timestamp: i.timestamp,
        type: i.type,
        details: i.details,
        value: i.value,
        translationKey: i.translationKey,
        translationParams: i.translationParams,
      })),
      etco2Readings: session.vitalReadings
        .filter(v => v.etco2 !== undefined)
        .map(v => ({ timestamp: v.timestamp, value: v.etco2! })),
      hsAndTs: session.hsAndTs,
      postROSCChecklist: session.phase === 'post_rosc' || session.outcome === 'rosc' ? session.postROSCChecklist : null,
      postROSCVitals: session.phase === 'post_rosc' || session.outcome === 'rosc' ? session.postROSCVitals : null,
      airwayStatus: session.airwayStatus,
      pregnancyActive: session.pregnancyActive,
      pregnancyCauses: session.pregnancyActive ? session.pregnancyCauses : undefined,
      pregnancyInterventions: session.pregnancyActive ? session.pregnancyInterventions : undefined,
      bradyTachyStartTime: session.bradyTachyStartTime,
    };

    // Save session to IndexedDB
    try {
      await saveSession(storedSession);
      logger.sessionEvent('Session manually saved via Save button', {
        id: storedSession.id,
        outcome: storedSession.outcome,
      });
      toast.success(t('actions.saved'));
    } catch (error) {
      logger.error('Failed to save session', { error });
      toast.error('Failed to save session');
    }
  }, [session, timerState.totalCPRTime, timerState.totalElapsed, t]);

  // Command banner logic
  const getCommandBanner = useCallback((): CommandBanner => {
    const { phase, currentRhythm, shockCount, epinephrineCount, lastEpinephrineTime, amiodaroneCount, pregnancyActive, startTime } = session;
    const now = Date.now();
    const seconds = Math.ceil(timerState.cprCycleRemaining / 1000);

    // Emergency delivery alert - highest priority for obstetric arrest
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const timeElapsed = startTime ? now - startTime : 0;
    if (pregnancyActive && timeElapsed >= FIVE_MINUTES_MS && phase !== 'post_rosc' && phase !== 'code_ended' && !emergencyDeliveryBannerDismissed) {
      return {
        message: t('banner.emergencyDelivery'),
        priority: 'critical',
        subMessage: t('banner.emergencyDeliverySub'),
      };
    }

    if (phase === 'initial' || phase === 'rhythm_selection') {
      return {
        message: t('banner.startCPR'),
        priority: 'critical',
        subMessage: t('banner.startCPRSub'),
      };
    }

    // NEW: CPR in progress, waiting for rhythm analysis
    if (phase === 'cpr_pending_rhythm') {
      return {
        message: t('banner.cprInProgress'),
        priority: 'warning',
        subMessage: t('banner.analyzeRhythmWhenReady'),
      };
    }

    if (phase === 'post_rosc') {
      return {
        message: t('banner.roscAchieved'),
        priority: 'success',
        subMessage: t('banner.beginPostCare'),
      };
    }

    // During rhythm check
    if (isInRhythmCheck) {
      if (currentRhythm === 'vf_pvt') {
        return {
          message: t('banner.rhythmCheckVfPvt'),
          priority: 'critical',
          subMessage: t('banner.rhythmCheckVfPvtSub'),
        };
      }
      return {
        message: t('banner.rhythmCheckGeneric'),
        priority: 'warning',
        subMessage: t('banner.rhythmCheckGenericSub'),
      };
    }

    // Pre-shock alert - 15 seconds before rhythm check
    if (timerState.preShockAlert) {
      return {
        message: t('banner.preCharge'),
        priority: 'warning',
        subMessage: t('banner.preChargeSub', { seconds }),
      };
    }

    // Rhythm check due
    if (timerState.rhythmCheckDue) {
      return {
        message: t('banner.rhythmCheckNow'),
        priority: 'critical',
        subMessage: t('banner.rhythmCheckNowSub'),
      };
    }

    // Shockable pathway
    if (phase === 'shockable_pathway') {
      // Check for epinephrine timing (after shock #2)
      if (shockCount >= 2 && (!lastEpinephrineTime || (now - lastEpinephrineTime) >= config.epinephrineIntervalMs)) {
        return {
          message: t('banner.giveEpi'),
          priority: 'critical',
          subMessage: t('banner.giveEpiRepeat'),
        };
      }

      // Check for amiodarone timing (after shock #3)
      if (shockCount >= 3 && amiodaroneCount === 0) {
        return {
          message: t('banner.giveAmio300'),
          priority: 'critical',
          subMessage: t('banner.giveAmio300Sub'),
        };
      }

      return {
        message: t('banner.continueHQCPR'),
        priority: 'info',
        subMessage: t('banner.rhythmCheckIn', { seconds }),
      };
    }

    // Non-shockable pathway
    if (phase === 'non_shockable_pathway') {
      // Immediate epi for non-shockable
      if (epinephrineCount === 0) {
        return {
          message: t('banner.giveEpiNow'),
          priority: 'critical',
          subMessage: currentRhythm === 'asystole' ? t('banner.asystoleEpi') : t('banner.peaEpi'),
        };
      }

      // Subsequent epi doses
      if (lastEpinephrineTime && (now - lastEpinephrineTime) >= config.epinephrineIntervalMs) {
        return {
          message: t('banner.giveEpi'),
          priority: 'critical',
          subMessage: t('banner.giveEpiRepeat'),
        };
      }

      return {
        message: t('banner.continueHQCPR'),
        priority: 'info',
        subMessage: t('banner.considerHsTs', { seconds }),
      };
    }

    return {
      message: t('banner.aclsInProgress'),
      priority: 'info',
    };
  }, [session, timerState, isInRhythmCheck, config.epinephrineIntervalMs, emergencyDeliveryBannerDismissed, t]);

  // Button state calculations - now includes cpr_pending_rhythm
  const isCPRActive = session.phase === 'shockable_pathway' || session.phase === 'non_shockable_pathway';
  const canGiveEpinephrine = (() => {
    if (!isCPRActive || isInRhythmCheck) return false;

    // VF/pVT: first epi after the 2nd shock.
    if (session.phase === 'shockable_pathway') {
      return session.shockCount >= 2;
    }

    // Asystole/PEA: epi available immediately.
    return session.phase === 'non_shockable_pathway';
  })();
  const canGiveAmiodarone = session.phase === 'shockable_pathway' && session.shockCount >= 3 && session.amiodaroneCount < 2 && !isInRhythmCheck;
  const canGiveLidocaine = session.phase === 'shockable_pathway' && session.shockCount >= 3 && !isInRhythmCheck;
  const antiarrhythmicDue = session.phase === 'shockable_pathway'
    && session.shockCount >= 3
    && session.amiodaroneCount === 0
    && session.lidocaineCount === 0
    && !isInRhythmCheck;
  
  // Epinephrine timing:
  // - VF/pVT (shockable): after 2nd shock, then every 3-5 minutes
  // - Asystole/PEA (non-shockable): immediately, then every 3-5 minutes
  const epiDue = (() => {
    if (!isCPRActive) return false;
    
    // If we've given epi before, check interval
    if (session.lastEpinephrineTime) {
      return (Date.now() - session.lastEpinephrineTime) >= config.epinephrineIntervalMs;
    }
    
    // First dose timing
    if (session.phase === 'shockable_pathway') {
      // VF/pVT: after 2nd shock
      return session.shockCount >= 2;
    }
    
    // Non-shockable: immediately
    return session.phase === 'non_shockable_pathway';
  })();

  const addNote = useCallback((note: string) => {
    addIntervention('note', t('interventions.noteAdded', { note }), undefined, 'interventions.noteAdded', { note });
  }, [addIntervention, t]);

  // Pregnancy-related actions
  const togglePregnancy = useCallback((active: boolean) => {
    setSession(prev => ({
      ...prev,
      pregnancyActive: active,
      pregnancyStartTime: active ? Date.now() : null,
    }));
    if (active) {
      addIntervention('note', t('interventions.pregnancyActivated'), undefined, 'interventions.pregnancyActivated');
    }
  }, [addIntervention, t]);

  const updatePregnancyCauses = useCallback((updates: Partial<PregnancyCauses>) => {
    setSession(prev => ({
      ...prev,
      pregnancyCauses: { ...prev.pregnancyCauses, ...updates },
    }));
  }, []);

  const updatePregnancyInterventions = useCallback((updates: Partial<PregnancyInterventions>) => {
    setSession(prev => ({
      ...prev,
      pregnancyInterventions: { ...prev.pregnancyInterventions, ...updates },
    }));
  }, []);

  // Special Circumstances actions
  const toggleSpecialCircumstance = useCallback((key: keyof SpecialCircumstances, active: boolean) => {
    setSession(prev => ({
      ...prev,
      specialCircumstances: { ...prev.specialCircumstances, [key]: active },
    }));
    if (active) {
      // Map each condition key to its specific translation key
      const interventionKeyMap: Record<keyof SpecialCircumstances, string> = {
        anaphylaxis: 'interventions.anaphylaxisActivated',
        asthma: 'interventions.asthmaActivated',
        hyperthermia: 'interventions.hyperthermiaActivated',
        opioidOverdose: 'interventions.opioidOverdoseActivated',
        drowning: 'interventions.drowningActivated',
        electrocution: 'interventions.electrocutionActivated',
        lvadFailure: 'interventions.lvadFailureActivated',
      };
      const translationKey = interventionKeyMap[key];
      addIntervention('note', t(translationKey), undefined, translationKey, {});
    }
  }, [addIntervention, t]);

  const updateAnaphylaxisChecklist = useCallback((updates: Partial<AnaphylaxisChecklist>) => {
    setSession(prev => ({
      ...prev,
      anaphylaxisChecklist: { ...prev.anaphylaxisChecklist, ...updates },
    }));
  }, []);

  const updateAsthmaChecklist = useCallback((updates: Partial<AsthmaChecklist>) => {
    setSession(prev => ({
      ...prev,
      asthmaChecklist: { ...prev.asthmaChecklist, ...updates },
    }));
  }, []);

  const updateHyperthermiaChecklist = useCallback((updates: Partial<HyperthermiaChecklist>) => {
    setSession(prev => ({
      ...prev,
      hyperthermiaChecklist: { ...prev.hyperthermiaChecklist, ...updates },
    }));
  }, []);

  const updateOpioidOverdoseChecklist = useCallback((updates: Partial<OpioidOverdoseChecklist>) => {
    setSession(prev => ({
      ...prev,
      opioidOverdoseChecklist: { ...prev.opioidOverdoseChecklist, ...updates },
    }));
  }, []);

  const updateDrowningChecklist = useCallback((updates: Partial<DrowningChecklist>) => {
    setSession(prev => ({
      ...prev,
      drowningChecklist: { ...prev.drowningChecklist, ...updates },
    }));
  }, []);

  const updateElectrocutionChecklist = useCallback((updates: Partial<ElectrocutionChecklist>) => {
    setSession(prev => ({
      ...prev,
      electrocutionChecklist: { ...prev.electrocutionChecklist, ...updates },
    }));
  }, []);

  const updateLVADFailureChecklist = useCallback((updates: Partial<LVADFailureChecklist>) => {
    setSession(prev => ({
      ...prev,
      lvadFailureChecklist: { ...prev.lvadFailureChecklist, ...updates },
    }));
  }, []);

  // Allow external control of rhythm analysis state (for initial rhythm selection)
  const setRhythmAnalysisActive = useCallback((active: boolean) => {
    setIsInRhythmCheck(active);
  }, []);

  // Set patient weight
  const setPatientWeight = useCallback((weight: number | null) => {
    setSession(prev => ({
      ...prev,
      patientWeight: weight,
    }));
    if (weight) {
      addIntervention('note', t('interventions.weightSet', { weight }), undefined, 'interventions.weightSet', { weight });
    }
  }, [addIntervention, t]);

  // Set CPR ratio
  const setCPRRatio = useCallback((ratio: CPRRatio) => {
    setSession(prev => ({
      ...prev,
      cprRatio: ratio,
    }));
  }, []);

  // Set pathway mode - don't change phase, let the UI handle flow
  const setPathwayMode = useCallback((mode: PathwayMode) => {
    setSession(prev => ({
      ...prev,
      pathwayMode: mode,
      // Set default CPR ratio based on pathway
      cprRatio: mode === 'adult' ? '30:2' : '15:2',
    }));
  }, []);

  return {
    session,
    timerState,
    isInRhythmCheck,
    commandBanner: getCommandBanner(),
    actions: {
      startCPR,
      selectRhythm,
      startRhythmCheck,
      completeRhythmCheckWithShock,
      completeRhythmCheckNoShock,
      completeRhythmCheckResumeCPR,
      giveEpinephrine,
      giveAmiodarone,
      giveLidocaine,
      setAirway,
      achieveROSC,
      terminateCode,
      updateHsAndTs,
      updatePostROSCChecklist,
      updatePostROSCVitals,
      endCode,
      resetSession,
      resumeSession,
      exportSession,
      dismissEmergencyDeliveryBanner,
      addIntervention,
      importInterventions,
      addNote,
      setRhythmAnalysisActive,
      recordETCO2,
      setPatientWeight,
      setCPRRatio,
      setPathwayMode,
      togglePregnancy,
      updatePregnancyCauses,
      updatePregnancyInterventions,
      toggleSpecialCircumstance,
      updateAnaphylaxisChecklist,
      updateAsthmaChecklist,
      updateHyperthermiaChecklist,
      updateOpioidOverdoseChecklist,
      updateDrowningChecklist,
      updateElectrocutionChecklist,
      updateLVADFailureChecklist,
    },
    buttonStates: {
      canGiveEpinephrine,
      canGiveAmiodarone,
      canGiveLidocaine,
      epiDue,
      antiarrhythmicDue,
      rhythmCheckDue: timerState.rhythmCheckDue,
    },
    config,
  };
}
