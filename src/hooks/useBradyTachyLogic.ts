import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BradyTachySession,
  BradyTachyPhase,
  BradyTachyBranch,
  PathwayMode,
  StabilityStatus,
  QRSWidth,
  RhythmRegularity,
  PedsSinusVsSVT,
  CardioversionRhythmType,
  BradyTachyIntervention,
  createInitialBradyTachySession,
} from '@/types/acls';
import { saveBradyTachySession, clearBradyTachySession, StoredBradyTachySession, saveBradyTachyToHistory } from '@/lib/bradyTachyStorage';
import { logger } from '@/utils/logger';

export interface UseBradyTachyLogicOptions {
  /** If provided, skips patient selection and starts at branch selection with this mode */
  initialMode?: PathwayMode;
  /** If provided, sets the initial weight (only used with pediatric mode) */
  initialWeight?: number | null;
}

export function useBradyTachyLogic(options: UseBradyTachyLogicOptions = {}) {
  const { t } = useTranslation();
  const [session, setSession] = useState<BradyTachySession>(() => {
    const initial = createInitialBradyTachySession();
    // If initialMode is provided, skip patient_selection and go directly to branch_selection
    if (options.initialMode) {
      return {
        ...initial,
        phase: 'branch_selection',
        decisionContext: {
          ...initial.decisionContext,
          patientGroup: options.initialMode,
          weightKg: options.initialMode === 'pediatric' ? (options.initialWeight ?? null) : null,
        },
      };
    }
    return initial;
  });

  // Add intervention with enhanced logging
  const addIntervention = useCallback((
    type: BradyTachyIntervention['type'],
    details: string,
    value?: number | string,
    doseStep?: number,
    calculatedDose?: string,
    translationKey?: string,
    translationParams?: Record<string, string | number>
  ) => {
    const intervention: BradyTachyIntervention = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      details,
      value,
      doseStep,
      calculatedDose,
      decisionContext: { ...session.decisionContext },
      translationKey,
      translationParams,
    };

    setSession(prev => {
      const updated = {
        ...prev,
        interventions: [...prev.interventions, intervention],
      };

      // Persist to localStorage
      saveBradyTachySession({
        id: updated.id,
        startTime: updated.startTime,
        endTime: updated.endTime,
        patientGroup: updated.decisionContext.patientGroup,
        weightKg: updated.decisionContext.weightKg,
        branch: updated.decisionContext.branch,
        interventions: updated.interventions.map(i => ({
          timestamp: i.timestamp,
          type: i.type,
          details: i.details,
          value: i.value,
          doseStep: i.doseStep,
          calculatedDose: i.calculatedDose,
          decisionContext: i.decisionContext,
          translationKey: i.translationKey,
          translationParams: i.translationParams,
        })),
        outcome: updated.outcome,
      });

      return updated;
    });
  }, [session.decisionContext]);

  // Set patient group (adult/pediatric)
  const setPatientGroup = useCallback((group: PathwayMode) => {
    setSession(prev => ({
      ...prev,
      decisionContext: {
        ...prev.decisionContext,
        patientGroup: group,
      },
    }));
  }, []);

  // Set patient weight
  const setPatientWeight = useCallback((weight: number | null) => {
    setSession(prev => ({
      ...prev,
      decisionContext: {
        ...prev.decisionContext,
        weightKg: weight,
      },
    }));
    if (weight) {
      addIntervention('note', t('interventions.weightSet', { weight }), undefined, undefined, undefined, 'interventions.weightSet', { weight });
    }
  }, [addIntervention, t]);

  // Set branch (brady/tachy)
  const setBranch = useCallback((branch: BradyTachyBranch) => {
    setSession(prev => ({
      ...prev,
      phase: branch === 'bradycardia' ? 'bradycardia_assessment' : 'tachycardia_assessment',
      decisionContext: {
        ...prev.decisionContext,
        branch,
      },
    }));
    const translationKey = branch === 'bradycardia' ? 'bradyTachy.branchSelectedBradycardia' : 'bradyTachy.branchSelectedTachycardia';
    addIntervention('decision', t(translationKey), undefined, undefined, undefined, translationKey);
  }, [addIntervention, t]);

  // Set stability status
  const setStability = useCallback((stability: StabilityStatus) => {
    setSession(prev => ({
      ...prev,
      phase: prev.decisionContext.branch === 'bradycardia'
        ? 'bradycardia_treatment'
        : 'tachycardia_treatment',
      decisionContext: {
        ...prev.decisionContext,
        stability,
      },
    }));
    const translationKey = stability === 'unstable' ? 'bradyTachy.stabilityUnstable' : 'bradyTachy.stabilityStable';
    addIntervention('assessment', t(translationKey), undefined, undefined, undefined, translationKey);
  }, [addIntervention, t]);

  // Set QRS width
  const setQRSWidth = useCallback((qrsWidth: QRSWidth) => {
    setSession(prev => ({
      ...prev,
      decisionContext: {
        ...prev.decisionContext,
        qrsWidth,
      },
    }));
    const translationKey = qrsWidth === 'wide' ? 'bradyTachy.qrsWide' : 'bradyTachy.qrsNarrow';
    addIntervention('assessment', t(translationKey), qrsWidth, undefined, undefined, translationKey);
  }, [addIntervention, t]);

  // Set rhythm regularity
  const setRhythmRegular = useCallback((regular: RhythmRegularity) => {
    setSession(prev => ({
      ...prev,
      decisionContext: {
        ...prev.decisionContext,
        rhythmRegular: regular,
      },
    }));
    const translationKey = regular === 'regular' ? 'bradyTachy.rhythmRegular' : 'bradyTachy.rhythmIrregular';
    addIntervention('assessment', t(translationKey), regular, undefined, undefined, translationKey);
  }, [addIntervention, t]);

  // Set monomorphic status
  const setMonomorphic = useCallback((monomorphic: boolean) => {
    setSession(prev => ({
      ...prev,
      decisionContext: {
        ...prev.decisionContext,
        monomorphic,
      },
    }));
    const translationKey = monomorphic ? 'bradyTachy.monomorphicYes' : 'bradyTachy.monomorphicNo';
    addIntervention('assessment', t(translationKey), undefined, undefined, undefined, translationKey);
  }, [addIntervention, t]);

  // Set pediatric sinus vs SVT choice
  const setPedsSinusVsSVT = useCallback((choice: PedsSinusVsSVT, criteria?: { pWavesPresent: boolean; variableRR: boolean; appropriateRate: boolean } | { pWavesAbnormal: boolean; fixedRR: boolean; inappropriateRate: boolean; abruptRateChange: boolean }) => {
    setSession(prev => ({
      ...prev,
      phase: 'tachycardia_treatment',
      decisionContext: {
        ...prev.decisionContext,
        pedsSinusVsSVTChoice: choice,
        ...(choice === 'probable_sinus' && criteria ? { sinusTachyCriteria: criteria as { pWavesPresent: boolean; variableRR: boolean; appropriateRate: boolean } } : {}),
        ...(choice === 'probable_svt' && criteria ? { svtCriteria: criteria as { pWavesAbnormal: boolean; fixedRR: boolean; inappropriateRate: boolean; abruptRateChange: boolean } } : {}),
      },
    }));
    const translationKey = choice === 'probable_sinus' ? 'bradyTachy.pedsSinusTachyIdentified' : 'bradyTachy.pedsSVTIdentified';
    addIntervention('decision', t(translationKey), choice, undefined, undefined, translationKey);
  }, [addIntervention, t]);

  // New: Select pediatric sinus tachycardia (treat cause pathway)
  const selectPediatricSinusTachy = useCallback(() => {
    setSession(prev => ({
      ...prev,
      decisionContext: {
        ...prev.decisionContext,
        pedsSinusVsSVTChoice: 'probable_sinus',
      },
    }));
    addIntervention('decision', t('bradyTachy.pedsSinusTachyIdentified'), undefined, undefined, undefined, 'bradyTachy.pedsSinusTachyIdentified');
  }, [addIntervention, t]);

  // New: Advance to compromise assessment phase
  const advanceToCompromiseAssessment = useCallback(() => {
    setSession(prev => ({
      ...prev,
      phase: 'tachycardia_compromise_assessment',
    }));
    addIntervention('decision', t('bradyTachy.concerningRhythmProceedingToCompromise'), undefined, undefined, undefined, 'bradyTachy.concerningRhythmProceedingToCompromise');
  }, [addIntervention, t]);

  // Treatment actions
  const giveAtropine = useCallback((dose: string, doseNumber: number) => {
    addIntervention('atropine', t('bradyTachy.atropineGiven'), dose, doseNumber, dose, 'bradyTachy.atropineGiven');
  }, [addIntervention, t]);

  const giveAdenosine = useCallback((dose: string, doseNumber: 1 | 2) => {
    const translationKey = doseNumber === 1 ? 'bradyTachy.adenosineDose1Given' : 'bradyTachy.adenosineDose2Given';
    addIntervention('adenosine', t(translationKey), dose, doseNumber, dose, translationKey);
  }, [addIntervention, t]);

  const giveCardioversion = useCallback((energy: string) => {
    addIntervention('cardioversion', t('bradyTachy.cardioversionGiven'), energy, undefined, energy, 'bradyTachy.cardioversionGiven');
  }, [addIntervention, t]);

  const giveDopamine = useCallback((dose: string) => {
    addIntervention('dopamine', t('bradyTachy.dopamineGiven'), dose, undefined, dose, 'bradyTachy.dopamineGiven');
  }, [addIntervention, t]);

  const giveEpinephrineInfusion = useCallback((dose: string) => {
    addIntervention('epi_infusion', t('bradyTachy.epiInfusionGiven'), dose, undefined, dose, 'bradyTachy.epiInfusionGiven');
  }, [addIntervention, t]);

  const giveBetaBlocker = useCallback(() => {
    addIntervention('beta_blocker', t('bradyTachy.betaBlockerGiven'), undefined, undefined, undefined, 'bradyTachy.betaBlockerGiven');
  }, [addIntervention, t]);

  const giveCalciumBlocker = useCallback(() => {
    addIntervention('calcium_blocker', t('bradyTachy.calciumBlockerGiven'), undefined, undefined, undefined, 'bradyTachy.calciumBlockerGiven');
  }, [addIntervention, t]);

  const giveProcainamide = useCallback((dose: string) => {
    addIntervention('procainamide', t('bradyTachy.procainamideGiven'), dose, undefined, dose, 'bradyTachy.procainamideGiven');
  }, [addIntervention, t]);

  const giveAmiodarone = useCallback((dose: string) => {
    addIntervention('amiodarone', t('bradyTachy.amiodaroneBTGiven'), dose, undefined, dose, 'bradyTachy.amiodaroneBTGiven');
  }, [addIntervention, t]);

  const performVagalManeuver = useCallback(() => {
    addIntervention('vagal_maneuver', t('bradyTachy.vagalManeuverGiven'), undefined, undefined, undefined, 'bradyTachy.vagalManeuverGiven');
  }, [addIntervention, t]);

  // Specific medication actions for second-line narrow-complex tachycardia
  const giveDiltiazem = useCallback((dose: string) => {
    addIntervention('diltiazem', t('bradyTachy.diltiazemGiven'), dose, undefined, dose, 'bradyTachy.diltiazemGiven');
  }, [addIntervention, t]);

  const giveVerapamil = useCallback((dose: string) => {
    addIntervention('verapamil', t('bradyTachy.verapamilGiven'), dose, undefined, dose, 'bradyTachy.verapamilGiven');
  }, [addIntervention, t]);

  const giveMetoprolol = useCallback((dose: string) => {
    addIntervention('metoprolol', t('bradyTachy.metoprololGiven'), dose, undefined, dose, 'bradyTachy.metoprololGiven');
  }, [addIntervention, t]);

  const giveEsmolol = useCallback((dose: string) => {
    addIntervention('esmolol', t('bradyTachy.esmololGiven'), dose, undefined, dose, 'bradyTachy.esmololGiven');
  }, [addIntervention, t]);

  // Mapping of internal rhythm types to their translation keys
  const rhythmTypeTranslationKeys: Record<CardioversionRhythmType, string> = {
    afib: 'bradyTachy.rhythmAtrialFib',
    aflutter: 'bradyTachy.rhythmAtrialFlutter',
    narrow: 'bradyTachy.rhythmNarrowComplex',
    monomorphic_vt: 'bradyTachy.rhythmMonomorphicVT',
    polymorphic_vt: 'bradyTachy.rhythmPolymorphicVT',
  };

  // Set cardioversion rhythm type
  const setCardioversionRhythmType = useCallback((rhythmType: CardioversionRhythmType) => {
    setSession(prev => ({
      ...prev,
      decisionContext: {
        ...prev.decisionContext,
        cardioversionRhythmType: rhythmType,
      },
    }));
    if (rhythmType) {
      const translationKey = rhythmTypeTranslationKeys[rhythmType];
      addIntervention('decision', t('bradyTachy.rhythmTypeSelected', { rhythm: t(translationKey) }), rhythmType, undefined, undefined, 'bradyTachy.rhythmTypeSelected', { rhythm: t(translationKey) });
    }
  }, [addIntervention, t]);

  // Switch to cardiac arrest
  // Note: history is saved only when a Brady/Tachy session ends (resolved/transferred).
  // When switching to arrest, the combined session will be saved by the ACLS flow at ROSC/death.
  const switchToArrest = useCallback(async () => {
    const now = Date.now();
    
    // Create the final session state before switching
    const finalSession = {
      ...session,
      outcome: 'switched_to_arrest' as const,
      switchedToArrestTime: now,
      endTime: now,
      phase: 'session_ended' as const,
    };
    
    // Update the session state
    setSession(finalSession);
    addIntervention('switch_to_arrest', t('bradyTachy.switchedToArrest'), undefined, undefined, undefined, 'bradyTachy.switchedToArrest');
    
    // Note: We do NOT clear the session here - it will be cleared after merging in CodeScreen
    return true; // Signal to parent to switch to arrest mode
  }, [session, addIntervention, t]);

  // End session
  const endSession = useCallback(async (outcome: 'resolved' | 'transferred') => {
    const now = Date.now();
    setSession(prev => {
      const updated = {
        ...prev,
        outcome,
        endTime: now,
        phase: 'session_ended' as const,
      };
      
      // Save to history before clearing
      const sessionForHistory: StoredBradyTachySession = {
        id: updated.id,
        startTime: updated.startTime,
        endTime: updated.endTime,
        patientGroup: updated.decisionContext.patientGroup,
        weightKg: updated.decisionContext.weightKg,
        branch: updated.decisionContext.branch,
        interventions: updated.interventions.map(i => ({
          timestamp: i.timestamp,
          type: i.type,
          details: i.details,
          value: i.value,
          doseStep: i.doseStep,
          calculatedDose: i.calculatedDose,
          decisionContext: i.decisionContext,
          translationKey: i.translationKey,
          translationParams: i.translationParams,
        })),
        outcome: updated.outcome,
      };
      
      // Save to history (async, but don't wait)
      saveBradyTachyToHistory(sessionForHistory).catch(err => {
        logger.error('Failed to save session to history', err);
      });
      
      return updated;
    });

    const outcomeTranslationKey = outcome === 'resolved' ? 'bradyTachy.outcomeResolved' : 'outcomeTransferred';
    const translatedOutcome = t(outcomeTranslationKey);
    addIntervention('note', t('bradyTachy.sessionEnded', { outcome: translatedOutcome }), undefined, 'bradyTachy.sessionEnded', { outcome: translatedOutcome });

    // Clear the persisted active session after a brief delay to ensure intervention is saved
    setTimeout(() => {
      clearBradyTachySession();
    }, 100);
  }, [addIntervention, t]);

  // Reset session
  const resetSession = useCallback(() => {
    setSession(createInitialBradyTachySession());
  }, []);

  // Move to next phase
  const setPhase = useCallback((phase: BradyTachyPhase) => {
    setSession(prev => ({
      ...prev,
      phase,
    }));
  }, []);

  return {
    session,
    actions: {
      setPatientGroup,
      setPatientWeight,
      setBranch,
      setStability,
      setQRSWidth,
      setRhythmRegular,
      setMonomorphic,
      setPedsSinusVsSVT,
      selectPediatricSinusTachy,
      advanceToCompromiseAssessment,
      giveAtropine,
      giveAdenosine,
      giveCardioversion,
      giveDopamine,
      giveEpinephrineInfusion,
      giveBetaBlocker,
      giveCalciumBlocker,
      giveProcainamide,
      giveAmiodarone,
      performVagalManeuver,
      giveDiltiazem,
      giveVerapamil,
      giveMetoprolol,
      giveEsmolol,
      setCardioversionRhythmType,
      switchToArrest,
      endSession,
      resetSession,
      setPhase,
      addIntervention,
    },
  };
}

export type BradyTachyActions = ReturnType<typeof useBradyTachyLogic>['actions'];
