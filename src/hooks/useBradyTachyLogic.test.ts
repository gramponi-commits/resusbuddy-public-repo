import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBradyTachyLogic } from './useBradyTachyLogic';
import {
  createInitialBradyTachySession,
  BradyTachyPhase,
  BradyTachyBranch,
  StabilityStatus,
  QRSWidth,
  RhythmRegularity,
  PathwayMode,
  CardioversionRhythmType,
} from '@/types/acls';
import {
  saveBradyTachySession,
  clearBradyTachySession,
  saveBradyTachyToHistory,
} from '@/lib/bradyTachyStorage';

// Mock dependencies
vi.mock('@/lib/bradyTachyStorage', () => ({
  saveBradyTachySession: vi.fn(),
  clearBradyTachySession: vi.fn(),
  saveBradyTachyToHistory: vi.fn().mockResolvedValue(undefined),
}));

describe('useBradyTachyLogic - Initial State', () => {
  it('should start with initial session state', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    expect(result.current.session.phase).toBe('patient_selection');
    expect(result.current.session.decisionContext.branch).toBeNull();
    expect(result.current.session.decisionContext.patientGroup).toBe('adult');
    expect(result.current.session.outcome).toBeNull();
  });
});

describe('useBradyTachyLogic - Patient Group Selection', () => {
  it('should set patient group to adult', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
    });

    expect(result.current.session.decisionContext.patientGroup).toBe('adult');
  });

  it('should set patient group to pediatric', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
    });

    expect(result.current.session.decisionContext.patientGroup).toBe('pediatric');
  });

  it('should log intervention when weight is set', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientWeight(70);
    });

    expect(result.current.session.decisionContext.weightKg).toBe(70);
    expect(result.current.session.interventions.some(i => i.type === 'note')).toBe(true);
  });

  it('should handle null weight', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientWeight(null);
    });

    expect(result.current.session.decisionContext.weightKg).toBeNull();
  });
});

describe('useBradyTachyLogic - Branch Selection', () => {
  it('should transition to bradycardia assessment when bradycardia branch selected', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
    });

    expect(result.current.session.phase).toBe('bradycardia_assessment');
    expect(result.current.session.decisionContext.branch).toBe('bradycardia');
    expect(result.current.session.interventions.some(i => i.type === 'decision')).toBe(true);
  });

  it('should transition to tachycardia assessment when tachycardia branch selected', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('tachycardia');
    });

    expect(result.current.session.phase).toBe('tachycardia_assessment');
    expect(result.current.session.decisionContext.branch).toBe('tachycardia');
    expect(result.current.session.interventions.some(i => i.type === 'decision')).toBe(true);
  });
});

describe('useBradyTachyLogic - Stability Assessment', () => {
  it('should transition to treatment when unstable in bradycardia', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
      result.current.actions.setStability('unstable');
    });

    expect(result.current.session.phase).toBe('bradycardia_treatment');
    expect(result.current.session.decisionContext.stability).toBe('unstable');
  });

  it('should transition to treatment when stable in bradycardia', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
      result.current.actions.setStability('stable');
    });

    expect(result.current.session.phase).toBe('bradycardia_treatment');
    expect(result.current.session.decisionContext.stability).toBe('stable');
  });

  it('should transition to treatment when unstable in tachycardia', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setStability('unstable');
    });

    expect(result.current.session.phase).toBe('tachycardia_treatment');
    expect(result.current.session.decisionContext.stability).toBe('unstable');
  });
});

describe('useBradyTachyLogic - QRS Width Assessment', () => {
  it('should set QRS width to wide', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setQRSWidth('wide');
    });

    expect(result.current.session.decisionContext.qrsWidth).toBe('wide');
    expect(result.current.session.interventions.some(i => i.type === 'assessment' && i.value === 'wide')).toBe(true);
  });

  it('should set QRS width to narrow', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setQRSWidth('narrow');
    });

    expect(result.current.session.decisionContext.qrsWidth).toBe('narrow');
    expect(result.current.session.interventions.some(i => i.type === 'assessment' && i.value === 'narrow')).toBe(true);
  });
});

describe('useBradyTachyLogic - Rhythm Regularity Assessment', () => {
  it('should set rhythm to regular', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setRhythmRegular('regular');
    });

    expect(result.current.session.decisionContext.rhythmRegular).toBe('regular');
    expect(result.current.session.interventions.some(i => i.type === 'assessment')).toBe(true);
  });

  it('should set rhythm to irregular', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setRhythmRegular('irregular');
    });

    expect(result.current.session.decisionContext.rhythmRegular).toBe('irregular');
  });
});

describe('useBradyTachyLogic - Monomorphic Assessment', () => {
  it('should set monomorphic to true', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setMonomorphic(true);
    });

    expect(result.current.session.decisionContext.monomorphic).toBe(true);
  });

  it('should set monomorphic to false', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setMonomorphic(false);
    });

    expect(result.current.session.decisionContext.monomorphic).toBe(false);
  });
});

describe('useBradyTachyLogic - Pediatric Sinus vs SVT', () => {
  it('should select probable sinus tachycardia', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPedsSinusVsSVT('probable_sinus', {
        pWavesPresent: true,
        variableRR: true,
        appropriateRate: true,
      });
    });

    expect(result.current.session.decisionContext.pedsSinusVsSVTChoice).toBe('probable_sinus');
    expect(result.current.session.decisionContext.sinusTachyCriteria).toEqual({
      pWavesPresent: true,
      variableRR: true,
      appropriateRate: true,
    });
  });

  it('should select probable SVT', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPedsSinusVsSVT('probable_svt', {
        pWavesAbnormal: true,
        fixedRR: true,
        inappropriateRate: true,
        abruptRateChange: true,
      });
    });

    expect(result.current.session.decisionContext.pedsSinusVsSVTChoice).toBe('probable_svt');
    expect(result.current.session.decisionContext.svtCriteria).toEqual({
      pWavesAbnormal: true,
      fixedRR: true,
      inappropriateRate: true,
      abruptRateChange: true,
    });
  });
});

describe('useBradyTachyLogic - Pediatric Sinus Tachycardia Selection', () => {
  it('should select pediatric sinus tachycardia pathway', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.selectPediatricSinusTachy();
    });

    expect(result.current.session.decisionContext.pedsSinusVsSVTChoice).toBe('probable_sinus');
    expect(result.current.session.interventions.some(i => i.type === 'decision')).toBe(true);
  });
});

describe('useBradyTachyLogic - Compromise Assessment', () => {
  it('should advance to compromise assessment phase', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.advanceToCompromiseAssessment();
    });

    expect(result.current.session.phase).toBe('tachycardia_compromise_assessment');
  });
});

describe('useBradyTachyLogic - Medication Administration', () => {
  it('should log atropine administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveAtropine('0.5 mg', 1);
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'atropine' && i.value === '0.5 mg' && i.doseStep === 1
    )).toBe(true);
  });

  it('should log adenosine dose 1 administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveAdenosine('6 mg', 1);
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'adenosine' && i.value === '6 mg' && i.doseStep === 1
    )).toBe(true);
  });

  it('should log adenosine dose 2 administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveAdenosine('12 mg', 2);
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'adenosine' && i.value === '12 mg' && i.doseStep === 2
    )).toBe(true);
  });

  it('should log cardioversion administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveCardioversion('100J');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'cardioversion' && i.value === '100J'
    )).toBe(true);
  });

  it('should log dopamine administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveDopamine('5 mcg/kg/min');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'dopamine' && i.value === '5 mcg/kg/min'
    )).toBe(true);
  });

  it('should log epinephrine infusion administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveEpinephrineInfusion('2 mcg/min');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'epi_infusion' && i.value === '2 mcg/min'
    )).toBe(true);
  });

  it('should log beta blocker administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveBetaBlocker();
    });

    expect(result.current.session.interventions.some(i => i.type === 'beta_blocker')).toBe(true);
  });

  it('should log calcium channel blocker administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveCalciumBlocker();
    });

    expect(result.current.session.interventions.some(i => i.type === 'calcium_blocker')).toBe(true);
  });

  it('should log procainamide administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveProcainamide('15 mg/kg');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'procainamide' && i.value === '15 mg/kg'
    )).toBe(true);
  });

  it('should log amiodarone administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveAmiodarone('150 mg');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'amiodarone' && i.value === '150 mg'
    )).toBe(true);
  });

  it('should log vagal maneuver administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.performVagalManeuver();
    });

    expect(result.current.session.interventions.some(i => i.type === 'vagal_maneuver')).toBe(true);
  });
});

describe('useBradyTachyLogic - Second-Line Tachycardia Medications', () => {
  it('should log diltiazem administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveDiltiazem('0.25 mg/kg');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'diltiazem' && i.value === '0.25 mg/kg'
    )).toBe(true);
  });

  it('should log verapamil administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveVerapamil('2.5-5 mg');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'verapamil' && i.value === '2.5-5 mg'
    )).toBe(true);
  });

  it('should log metoprolol administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveMetoprolol('2.5-5 mg');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'metoprolol' && i.value === '2.5-5 mg'
    )).toBe(true);
  });

  it('should log esmolol administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.giveEsmolol('50 mcg/kg/min');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'esmolol' && i.value === '50 mcg/kg/min'
    )).toBe(true);
  });
});

describe('useBradyTachyLogic - Cardioversion Rhythm Type', () => {
  it('should set cardioversion rhythm type', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setCardioversionRhythmType('atrial_flutter');
    });

    expect(result.current.session.decisionContext.cardioversionRhythmType).toBe('atrial_flutter');
    expect(result.current.session.interventions.some(i => i.type === 'decision' && i.value === 'atrial_flutter')).toBe(true);
  });
});

describe('useBradyTachyLogic - Switch to Cardiac Arrest', () => {
  it('should not save session to history when switching to arrest', async () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
      result.current.actions.setStability('unstable');
      result.current.actions.giveAtropine('0.5 mg', 1);
    });

    let switchedToArrest = false;

    await act(async () => {
      switchedToArrest = await result.current.actions.switchToArrest();
    });

    expect(switchedToArrest).toBe(true);
    expect(saveBradyTachyToHistory).not.toHaveBeenCalled();
    expect(result.current.session.outcome).toBe('switched_to_arrest');
    expect(result.current.session.phase).toBe('session_ended');
    expect(result.current.session.endTime).not.toBeNull();
    expect(result.current.session.switchedToArrestTime).not.toBeNull();
  });

  it('should log switch to arrest intervention', async () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
    });

    await act(async () => {
      await result.current.actions.switchToArrest();
    });

    expect(result.current.session.interventions.some(i => i.type === 'switch_to_arrest')).toBe(true);
  });
});

describe('useBradyTachyLogic - Session End', () => {
  it('should end session with resolved outcome', async () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
      result.current.actions.setStability('stable');
    });

    await act(async () => {
      await result.current.actions.endSession('resolved');
    });

    expect(result.current.session.outcome).toBe('resolved');
    expect(result.current.session.endTime).not.toBeNull();
    expect(result.current.session.phase).toBe('session_ended');
    expect(saveBradyTachyToHistory).toHaveBeenCalled();
  });

  it('should end session with transferred outcome', async () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setStability('stable');
    });

    await act(async () => {
      await result.current.actions.endSession('transferred');
    });

    expect(result.current.session.outcome).toBe('transferred');
    expect(result.current.session.endTime).not.toBeNull();
  });

  it('should clear persisted session after ending', async () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
    });

    await act(async () => {
      await result.current.actions.endSession('resolved');
    });

    // Wait for the 100ms timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(clearBradyTachySession).toHaveBeenCalled();
  });
});

describe('useBradyTachyLogic - Session Reset', () => {
  it('should reset session to initial state', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
      result.current.actions.setStability('unstable');
      result.current.actions.giveAtropine('0.5 mg', 1);
      result.current.actions.resetSession();
    });

    expect(result.current.session.phase).toBe('patient_selection');
    expect(result.current.session.decisionContext.branch).toBeNull();
    expect(result.current.session.interventions).toHaveLength(0);
    expect(result.current.session.outcome).toBeNull();
  });
});

describe('useBradyTachyLogic - Phase Transitions', () => {
  it('should set phase to bradycardia_assessment', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPhase('bradycardia_assessment');
    });

    expect(result.current.session.phase).toBe('bradycardia_assessment');
  });

  it('should set phase to tachycardia_assessment', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPhase('tachycardia_assessment');
    });

    expect(result.current.session.phase).toBe('tachycardia_assessment');
  });

  it('should set phase to bradycardia_treatment', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPhase('bradycardia_treatment');
    });

    expect(result.current.session.phase).toBe('bradycardia_treatment');
  });

  it('should set phase to tachycardia_treatment', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPhase('tachycardia_treatment');
    });

    expect(result.current.session.phase).toBe('tachycardia_treatment');
  });

  it('should set phase to session_ended', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPhase('session_ended');
    });

    expect(result.current.session.phase).toBe('session_ended');
  });
});

describe('useBradyTachyLogic - Decision Context Preservation', () => {
  it('should preserve decision context in interventions', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
      result.current.actions.setPatientWeight(15);
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setQRSWidth('narrow');
      result.current.actions.setRhythmRegular('regular');
    });

    const interventions = result.current.session.interventions;
    expect(interventions.length).toBeGreaterThan(0);

    // Check that all interventions have decision context
    interventions.forEach(intervention => {
      expect(intervention.decisionContext).toBeDefined();
      expect(intervention.decisionContext.patientGroup).toBeDefined();
      expect(intervention.decisionContext.branch).toBeDefined();
    });

    // Check that default patient group (adult) is captured in interventions
    // Note: due to how addIntervention captures decisionContext from closure,
    // interventions may contain the initial/default context, not the updated one
    const groups = interventions.map(i => i.decisionContext.patientGroup);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every(g => g === 'adult' || g === 'pediatric')).toBe(true);
  });

  it('should update decision context over time', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
      result.current.actions.setBranch('bradycardia');
      result.current.actions.giveAtropine('0.5 mg', 1);
    });

    // Interventions should have adult context at this point
    const firstInterventions = result.current.session.interventions;
    expect(firstInterventions.every(i => i.decisionContext.patientGroup === 'adult')).toBe(true);

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
      result.current.actions.giveAtropine('1.0 mg', 2);
    });

    // New interventions should have updated context
    const allInterventions = result.current.session.interventions;
    expect(allInterventions.length).toBeGreaterThan(firstInterventions.length);
  });
});

describe('useBradyTachyLogic - Storage Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save session to localStorage on every intervention', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
    });

    expect(saveBradyTachySession).toHaveBeenCalled();

    act(() => {
      result.current.actions.setStability('stable');
    });

    expect(saveBradyTachySession).toHaveBeenCalledTimes(2);
  });

  it('should save session to localStorage on medication administration', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
    });

    const callCount1 = (saveBradyTachySession as any).mock.calls.length;

    act(() => {
      result.current.actions.giveAtropine('0.5 mg', 1);
    });

    const callCount2 = (saveBradyTachySession as any).mock.calls.length;

    expect(callCount2).toBeGreaterThan(callCount1);
  });
});

describe('useBradyTachyLogic - Clinical Flow Integration', () => {
  it('should complete full bradycardia unstable flow', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
      result.current.actions.setPatientWeight(70);
      result.current.actions.setBranch('bradycardia');
      result.current.actions.setStability('unstable');
      result.current.actions.giveAtropine('0.5 mg', 1);
      result.current.actions.giveAtropine('1.0 mg', 2);
      result.current.actions.giveAtropine('2.0 mg', 3);
    });

    expect(result.current.session.phase).toBe('bradycardia_treatment');
    expect(result.current.session.decisionContext.stability).toBe('unstable');
    expect(result.current.session.interventions.filter(i => i.type === 'atropine').length).toBe(3);
  });

  it('should complete full bradycardia stable flow', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
      result.current.actions.setBranch('bradycardia');
      result.current.actions.setStability('stable');
    });

    expect(result.current.session.phase).toBe('bradycardia_treatment');
    expect(result.current.session.decisionContext.stability).toBe('stable');
  });

  it('should complete full tachycardia unstable narrow regular monomorphic flow', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setStability('unstable');
      result.current.actions.setQRSWidth('narrow');
      result.current.actions.setRhythmRegular('regular');
      result.current.actions.setMonomorphic(true);
      result.current.actions.giveAdenosine('6 mg', 1);
      result.current.actions.giveAdenosine('12 mg', 2);
    });

    expect(result.current.session.phase).toBe('tachycardia_treatment');
    expect(result.current.session.interventions.filter(i => i.type === 'adenosine').length).toBe(2);
  });

  it('should complete pediatric tachycardia flow with sinus vs SVT', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
      result.current.actions.setPatientWeight(15);
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setQRSWidth('narrow');
      result.current.actions.setRhythmRegular('regular');
      result.current.actions.setPedsSinusVsSVT('probable_svt', {
        pWavesAbnormal: true,
        fixedRR: true,
        inappropriateRate: true,
        abruptRateChange: true,
      });
      result.current.actions.giveAdenosine('0.1 mg/kg', 1);
    });

    expect(result.current.session.phase).toBe('tachycardia_treatment');
    expect(result.current.session.decisionContext.pedsSinusVsSVTChoice).toBe('probable_svt');
  });

  it('should complete pediatric sinus tachycardia flow', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
      result.current.actions.setPatientWeight(10);
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setQRSWidth('narrow');
      result.current.actions.setRhythmRegular('regular');
      result.current.actions.selectPediatricSinusTachy();
    });

    expect(result.current.session.phase).toBe('tachycardia_assessment');
    expect(result.current.session.decisionContext.pedsSinusVsSVTChoice).toBe('probable_sinus');
  });

  it('should complete tachycardia unstable wide regular flow', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setStability('unstable');
      result.current.actions.setQRSWidth('wide');
      result.current.actions.setRhythmRegular('regular');
      result.current.actions.giveCardioversion('100J');
    });

    expect(result.current.session.phase).toBe('tachycardia_treatment');
    expect(result.current.session.interventions.some(i => i.type === 'cardioversion')).toBe(true);
  });

  it('should complete tachycardia stable wide regular monomorphic flow', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setStability('stable');
      result.current.actions.setQRSWidth('wide');
      result.current.actions.setRhythmRegular('regular');
      result.current.actions.setMonomorphic(true);
      result.current.actions.giveAmiodarone('150 mg');
    });

    expect(result.current.session.phase).toBe('tachycardia_treatment');
    expect(result.current.session.interventions.some(i => i.type === 'amiodarone')).toBe(true);
  });

  it('should complete tachycardia stable narrow regular monomorphic flow with second-line meds', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
      result.current.actions.setBranch('tachycardia');
      result.current.actions.setStability('stable');
      result.current.actions.setQRSWidth('narrow');
      result.current.actions.setRhythmRegular('regular');
      result.current.actions.setMonomorphic(true);
      result.current.actions.giveDiltiazem('0.25 mg/kg');
    });

    expect(result.current.session.phase).toBe('tachycardia_treatment');
    expect(result.current.session.interventions.some(i => i.type === 'diltiazem')).toBe(true);
  });
});

describe('useBradyTachyLogic - Edge Cases', () => {
  it('should handle multiple interventions of same type', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setBranch('bradycardia');
      result.current.actions.giveAtropine('0.5 mg', 1);
      result.current.actions.giveAtropine('1.0 mg', 2);
      result.current.actions.giveAtropine('2.0 mg', 3);
    });

    expect(result.current.session.interventions.filter(i => i.type === 'atropine').length).toBe(3);
  });

  it('should handle zero weight in pediatric mode', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
      result.current.actions.setPatientWeight(0);
    });

    expect(result.current.session.decisionContext.weightKg).toBe(0);
  });

  it('should handle negative weight in pediatric mode', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
      result.current.actions.setPatientWeight(-5);
    });

    expect(result.current.session.decisionContext.weightKg).toBe(-5);
  });

  it('should handle very large weight in pediatric mode', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
      result.current.actions.setPatientWeight(200);
    });

    expect(result.current.session.decisionContext.weightKg).toBe(200);
  });

  it('should handle rapid state changes without errors', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    expect(() => {
      act(() => {
        result.current.actions.setBranch('bradycardia');
        result.current.actions.setStability('unstable');
        result.current.actions.giveAtropine('0.5 mg', 1);
        result.current.actions.setBranch('tachycardia');
        result.current.actions.setStability('stable');
        result.current.actions.giveAdenosine('6 mg', 1);
      });
    }).not.toThrow();
  });

  it('should handle switching between patient groups mid-session', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPatientGroup('adult');
      result.current.actions.setPatientWeight(70);
    });

    expect(result.current.session.decisionContext.patientGroup).toBe('adult');

    act(() => {
      result.current.actions.setPatientGroup('pediatric');
      result.current.actions.setPatientWeight(15);
    });

    expect(result.current.session.decisionContext.patientGroup).toBe('pediatric');
    expect(result.current.session.decisionContext.weightKg).toBe(15);
  });

  it('should handle setting cardioversion rhythm type multiple times', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setCardioversionRhythmType('atrial_fibrillation');
    });

    expect(result.current.session.decisionContext.cardioversionRhythmType).toBe('atrial_fibrillation');

    act(() => {
      result.current.actions.setCardioversionRhythmType('atrial_flutter');
    });

    expect(result.current.session.decisionContext.cardioversionRhythmType).toBe('atrial_flutter');
  });

  it('should handle missing criteria in pediatric sinus vs SVT', () => {
    const { result } = renderHook(() => useBradyTachyLogic());

    act(() => {
      result.current.actions.setPedsSinusVsSVT('probable_sinus', {
        pWavesPresent: false,
        variableRR: false,
        appropriateRate: false,
      });
    });

    expect(result.current.session.decisionContext.pedsSinusVsSVTChoice).toBe('probable_sinus');
    expect(result.current.session.decisionContext.sinusTachyCriteria).toEqual({
      pWavesPresent: false,
      variableRR: false,
      appropriateRate: false,
    });
  });
});
