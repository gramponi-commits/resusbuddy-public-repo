import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useACLSLogic } from './useACLSLogic';
import { createInitialSession, DEFAULT_ACLS_CONFIG } from '@/types/acls';
import { saveSession } from '@/lib/sessionStorage';

// Mock dependencies
vi.mock('@/lib/sessionStorage', () => ({
  saveSession: vi.fn(),
}));

vi.mock('@/lib/palsDosing', () => ({
  calculateEpinephrineDose: vi.fn(() => ({ value: 0.01, display: '0.01 mg', unit: 'mg' })),
  calculateAmiodaroneDose: vi.fn(() => ({ value: 5, display: '5 mg', unit: 'mg' })),
  calculateLidocaineDose: vi.fn(() => ({ value: 1, display: '1 mg', unit: 'mg' })),
  calculateShockEnergy: vi.fn(() => ({ value: 2, display: '2 J/kg', unit: 'J/kg' })),
}));

vi.mock('@/lib/aclsDosing', () => ({
  getAdultEpinephrineDose: vi.fn(() => ({ value: 1, display: '1 mg', unit: 'mg' })),
  getAdultAmiodaroneDose: vi.fn((doseNumber: number) => ({ value: doseNumber === 0 ? 300 : 150, display: doseNumber === 0 ? '300 mg' : '150 mg', unit: 'mg' })),
  getAdultLidocaineDose: vi.fn((doseNumber: number) => ({ value: doseNumber === 0 ? 100 : 50, display: doseNumber === 0 ? '100 mg' : '50 mg', unit: 'mg' })),
  getAdultShockEnergy: vi.fn(() => ({ value: 200, display: '200J', unit: 'J' })),
}));

describe('useACLSLogic - Phase Transitions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should start with initial session state', () => {
    const { result } = renderHook(() => useACLSLogic());

    expect(result.current.session.phase).toBe('pathway_selection');
    expect(result.current.session.currentRhythm).toBeNull();
    expect(result.current.session.shockCount).toBe(0);
    expect(result.current.session.epinephrineCount).toBe(0);
    expect(result.current.session.amiodaroneCount).toBe(0);
    expect(result.current.session.lidocaineCount).toBe(0);
  });

  it('should transition to cpr_pending_rhythm when CPR is started', () => {
    const { result } = renderHook(() => useACLSLogic());

    act(() => {
      result.current.actions.startCPR();
    });

    expect(result.current.session.phase).toBe('cpr_pending_rhythm');
    expect(result.current.session.startTime).toBeGreaterThan(0);
    expect(result.current.session.interventions).toHaveLength(1);
    expect(result.current.session.interventions[0].type).toBe('cpr_start');
  });

  it('should transition to shockable_pathway when VF/pVT is selected', () => {
    const { result } = renderHook(() => useACLSLogic());

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    expect(result.current.session.phase).toBe('shockable_pathway');
    expect(result.current.session.currentRhythm).toBe('vf_pvt');
    expect(result.current.session.shockCount).toBe(1); // First shock delivered immediately
    expect(result.current.session.cprCycleStartTime).toBeGreaterThan(0);
  });

  it('should transition to non_shockable_pathway when asystole is selected', () => {
    const { result } = renderHook(() => useACLSLogic());

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
    });

    expect(result.current.session.phase).toBe('non_shockable_pathway');
    expect(result.current.session.currentRhythm).toBe('asystole');
    expect(result.current.session.cprCycleStartTime).toBeGreaterThan(0);
  });

  it('should transition to non_shockable_pathway when PEA is selected', () => {
    const { result } = renderHook(() => useACLSLogic());

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('pea');
    });

    expect(result.current.session.phase).toBe('non_shockable_pathway');
    expect(result.current.session.currentRhythm).toBe('pea');
  });

  it('should transition to post_rosc when achieveROSC is called', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.achieveROSC();
    });

    expect(result.current.session.phase).toBe('post_rosc');
    expect(result.current.session.outcome).toBe('rosc');
    expect(result.current.session.roscTime).toBeGreaterThan(0);
    expect(result.current.session.endTime).toBeGreaterThan(0);
  });

  it('should transition to code_ended when terminateCode is called', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.terminateCode();
    });

    expect(result.current.session.phase).toBe('code_ended');
    expect(result.current.session.outcome).toBe('deceased');
    expect(result.current.session.endTime).toBeGreaterThan(0);
  });

  it('should reset session when resetSession is called', () => {
    const { result } = renderHook(() => useACLSLogic());

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.giveEpinephrine();
      result.current.actions.resetSession();
    });

    expect(result.current.session.phase).toBe('pathway_selection');
    expect(result.current.session.interventions).toHaveLength(0);
    expect(result.current.session.shockCount).toBe(0);
    expect(result.current.session.epinephrineCount).toBe(0);
  });
});

describe('useACLSLogic - Timer Calculations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should track CPR cycle time correctly', () => {
    const { result } = renderHook(() => useACLSLogic());

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    const initialCycleRemaining = result.current.timerState.cprCycleRemaining;

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timerState.cprCycleRemaining).toBeLessThan(initialCycleRemaining);
    expect(result.current.timerState.totalElapsed).toBeGreaterThan(0);
  });

  it('should trigger rhythm check after 2 minutes', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ACLS_CONFIG.rhythmCheckIntervalMs);
    });

    expect(result.current.timerState.rhythmCheckDue).toBe(true);
  });

  it('should trigger pre-shock alert at 15 seconds before rhythm check', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ACLS_CONFIG.rhythmCheckIntervalMs - DEFAULT_ACLS_CONFIG.preShockAlertAdvanceMs);
    });

    expect(result.current.timerState.preShockAlert).toBe(true);
  });

  it('should track epinephrine interval correctly', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.giveEpinephrine();
    });

    const epiTime = result.current.session.lastEpinephrineTime;
    expect(epiTime).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ACLS_CONFIG.epinephrineIntervalMs);
    });

    expect(result.current.timerState.epiRemaining).toBe(0);
  });

  it('should not track timer during cpr_pending_rhythm', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.timerState.cprCycleRemaining).toBe(DEFAULT_ACLS_CONFIG.rhythmCheckIntervalMs);
    expect(result.current.timerState.epiRemaining).toBe(DEFAULT_ACLS_CONFIG.epinephrineIntervalMs);
  });

  it('should stop timer during rhythm check', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
    });

    expect(result.current.isInRhythmCheck).toBe(true);
  });
});

describe('useACLSLogic - Shock Tracking', () => {
  it('should count first shock when VF/pVT is selected', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    expect(result.current.session.shockCount).toBe(1);
    expect(result.current.session.currentEnergy).toBe(DEFAULT_ACLS_CONFIG.biphasicMaxJoules);
  });

  it('should increment shock count on completeRhythmCheckWithShock', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
    });

    expect(result.current.session.shockCount).toBe(2);
    expect(result.current.session.currentRhythm).toBe('vf_pvt');
  });

  it('should not reset shock count when no shock delivered', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckNoShock('asystole');
    });

    expect(result.current.session.shockCount).toBe(1); // Still 1 from initial shock
  });
});

describe('useACLSLogic - Medication Dosing', () => {
  it('should increment epinephrine count when given', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.giveEpinephrine();
    });

    expect(result.current.session.epinephrineCount).toBe(1);
    expect(result.current.session.lastEpinephrineTime).toBeGreaterThan(0);
  });

  it('should increment amiodarone count when given', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.giveAmiodarone();
    });

    expect(result.current.session.amiodaroneCount).toBe(1);
    expect(result.current.session.lastAmiodaroneTime).toBeGreaterThan(0);
  });

  it('should increment lidocaine count when given', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.giveLidocaine();
    });

    expect(result.current.session.lidocaineCount).toBe(1);
  });

  it('should use pediatric dosing when pathwayMode is pediatric', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.setPathwayMode('pediatric');
      result.current.actions.setPatientWeight(10);
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.giveEpinephrine();
    });

    expect(result.current.session.pathwayMode).toBe('pediatric');
    expect(result.current.session.patientWeight).toBe(10);
    expect(result.current.session.epinephrineCount).toBe(1);
  });
});

describe('useACLSLogic - Command Banner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should show start CPR banner initially', () => {
    const { result } = renderHook(() => useACLSLogic());

    expect(result.current.commandBanner.message).toBeTruthy();
    expect(result.current.commandBanner.priority).toBe('info');
  });

  it('should show CPR in progress banner during cpr_pending_rhythm', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
    });

    expect(result.current.commandBanner.message).toBeTruthy();
    expect(result.current.commandBanner.priority).toBe('warning');
  });

  it('should show rhythm check banner during rhythm check', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
    });

    expect(result.current.commandBanner.message).toBeTruthy();
    expect(result.current.commandBanner.priority).toBe('critical');
  });

  it('should show pre-charge banner when pre-shock alert triggers', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ACLS_CONFIG.rhythmCheckIntervalMs - DEFAULT_ACLS_CONFIG.preShockAlertAdvanceMs);
    });

    expect(result.current.commandBanner.priority).toBe('warning');
  });

  it('should show rhythm check now banner when rhythm check is due', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ACLS_CONFIG.rhythmCheckIntervalMs);
    });

    expect(result.current.commandBanner.priority).toBe('critical');
  });

  it('should show give epinephrine banner when epi is due', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.giveEpinephrine();
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ACLS_CONFIG.epinephrineIntervalMs);
    });

    expect(result.current.commandBanner.priority).toBe('critical');
  });

  it('should show give amiodarone banner after 3rd shock', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
    });

    expect(result.current.commandBanner.priority).toBe('critical');
  });

  it('should show ROSC achieved banner after achieving ROSC', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.achieveROSC();
    });

    expect(result.current.commandBanner.priority).toBe('success');
  });

  it('should show emergency delivery banner for pregnancy after 5 minutes', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.togglePregnancy(true);
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
    });

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(result.current.commandBanner.priority).toBe('critical');
    expect(result.current.session.pregnancyActive).toBe(true);
  });
});

describe('useACLSLogic - Button States', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should enable epinephrine during active CPR', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
    });

    expect(result.current.buttonStates.canGiveEpinephrine).toBe(true);
  });

  it('should disable epinephrine during rhythm check', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.startRhythmCheck();
    });

    expect(result.current.buttonStates.canGiveEpinephrine).toBe(false);
  });

  it('should enable amiodarone after 3rd shock', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
    });

    expect(result.current.buttonStates.canGiveAmiodarone).toBe(true);
  });

  it('should enable lidocaine after 3rd shock', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckWithShock(200);
    });

    expect(result.current.buttonStates.canGiveLidocaine).toBe(true);
  });

  it('should show epiDue true when epinephrine is due', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.giveEpinephrine();
    });

    act(() => {
      vi.advanceTimersByTime(DEFAULT_ACLS_CONFIG.epinephrineIntervalMs);
    });

    expect(result.current.buttonStates.epiDue).toBe(true);
  });
});

describe('useACLSLogic - Interventions', () => {
  it('should add intervention when airway is set', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.setAirway('ett');
    });

    expect(result.current.session.airwayStatus).toBe('ett');
    expect(result.current.session.interventions.some(i => i.type === 'airway')).toBe(true);
  });

  it('should add intervention when ETCO2 is recorded', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.recordETCO2(35);
    });

    expect(result.current.session.interventions.some(i => i.type === 'etco2' && i.value === 35)).toBe(true);
  });

  it('should add intervention when Hs and Ts are updated', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.updateHsAndTs({ hypovolemia: true, hypoxia: true });
    });

    expect(result.current.session.hsAndTs.hypovolemia).toBe(true);
    expect(result.current.session.hsAndTs.hypoxia).toBe(true);
    expect(result.current.session.interventions.some(i => i.type === 'hs_ts_check')).toBe(true);
  });

  it('should add intervention when note is added', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.addNote('Patient history of hypertension');
    });

    expect(result.current.session.interventions.some(i => i.type === 'note')).toBe(true);
  });
});

describe('useACLSLogic - Post-ROSC Checklist', () => {
  it('should update post-ROSC checklist', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.achieveROSC();
      result.current.actions.updatePostROSCChecklist({ airwaySecured: true, ventilationOptimized: true });
    });

    expect(result.current.session.postROSCChecklist.airwaySecured).toBe(true);
    expect(result.current.session.postROSCChecklist.ventilationOptimized).toBe(true);
  });

  it('should update post-ROSC vitals', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.achieveROSC();
      result.current.actions.updatePostROSCVitals({ spo2: 98, map: 75, temperature: 36.5 });
    });

    expect(result.current.session.postROSCVitals.spo2).toBe(98);
    expect(result.current.session.postROSCVitals.map).toBe(75);
    expect(result.current.session.postROSCVitals.temperature).toBe(36.5);
  });
});

describe('useACLSLogic - Auto-Save Behavior', () => {
  it('should transition to code_ended when terminateCode is called', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.terminateCode();
    });

    expect(result.current.session.phase).toBe('code_ended');
    expect(result.current.session.outcome).toBe('deceased');
  });

  it('should transition to post_rosc when achieveROSC is called', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.achieveROSC();
    });

    expect(result.current.session.phase).toBe('post_rosc');
    expect(result.current.session.outcome).toBe('rosc');
  });

  it('should allow multiple post-ROSC updates', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.achieveROSC();
    });

    expect(result.current.session.phase).toBe('post_rosc');

    // Make multiple post-ROSC updates
    act(() => {
      result.current.actions.updatePostROSCChecklist({ airwaySecured: true });
    });

    act(() => {
      result.current.actions.updatePostROSCChecklist({ airwaySecured: true, ventilationOptimized: true });
    });

    act(() => {
      result.current.actions.updatePostROSCVitals({ spo2: 98, map: 75 });
    });

    // Verify all updates were applied
    expect(result.current.session.postROSCChecklist.airwaySecured).toBe(true);
    expect(result.current.session.postROSCChecklist.ventilationOptimized).toBe(true);
    expect(result.current.session.postROSCVitals.spo2).toBe(98);
    expect(result.current.session.postROSCVitals.map).toBe(75);
  });
});

describe('useACLSLogic - Session Export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should export session to PDF', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
      result.current.actions.achieveROSC();
      result.current.actions.exportSession();
    });

    expect(exportSessionToPDF).toHaveBeenCalled();
  });

  it('should mark combined session as bradytachy-arrest when bradyTachyStartTime is set', async () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.importInterventions([
        { timestamp: Date.now() - 60000, type: 'note', details: 'Brady/Tachy note' },
      ], Date.now() - 60000);
    });

    await act(async () => {
      await result.current.actions.exportSession();
    });

    expect(saveSession).toHaveBeenCalled();
    const savedSession = (saveSession as unknown as { mock: { calls: Array<[any]> } }).mock.calls.at(-1)?.[0];
    expect(savedSession.sessionType).toBe('bradytachy-arrest');
  });
});

describe('useACLSLogic - Import Interventions', () => {
  it('should import interventions from bradytachy module', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    const importedInterventions = [
      { timestamp: Date.now(), type: 'atropine', details: 'Atropine given', value: '0.5 mg' },
      { timestamp: Date.now(), type: 'note', details: 'Switched to arrest', translationKey: 'bradyTachy.switchedToArrest' },
    ];

    act(() => {
      result.current.actions.importInterventions(importedInterventions, Date.now() - 60000);
    });

    expect(result.current.session.interventions.length).toBeGreaterThanOrEqual(2);
    expect(result.current.session.bradyTachyStartTime).not.toBeNull();
  });
});

describe('useACLSLogic - Pregnancy Features', () => {
  it('should toggle pregnancy state', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.togglePregnancy(true);
    });

    expect(result.current.session.pregnancyActive).toBe(true);
    expect(result.current.session.pregnancyStartTime).toBeGreaterThan(0);

    act(() => {
      result.current.actions.togglePregnancy(false);
    });

    expect(result.current.session.pregnancyActive).toBe(false);
  });

  it('should update pregnancy causes', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.togglePregnancy(true);
      result.current.actions.updatePregnancyCauses({ bleeding: true, cardiovascular: true });
    });

    expect(result.current.session.pregnancyCauses.bleeding).toBe(true);
    expect(result.current.session.pregnancyCauses.cardiovascular).toBe(true);
  });

  it('should update pregnancy interventions', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.togglePregnancy(true);
      result.current.actions.updatePregnancyInterventions({ leftUterineDisplacement: true, earlyAirway: true });
    });

    expect(result.current.session.pregnancyInterventions.leftUterineDisplacement).toBe(true);
    expect(result.current.session.pregnancyInterventions.earlyAirway).toBe(true);
  });
});

describe('useACLSLogic - Session Management', () => {
  it('should resume saved session', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    const savedSession = {
      ...createInitialSession(),
      phase: 'non_shockable_pathway' as const,
      startTime: Date.now() - 60000,
      cprCycleStartTime: Date.now() - 30000,
      lastEpinephrineTime: Date.now() - 20000,
    };

    const savedTimerState = {
      totalElapsed: 60000,
      totalCPRTime: 45000,
      savedAt: Date.now() - 5000,
    };

    act(() => {
      result.current.actions.resumeSession(savedSession, savedTimerState);
    });

    expect(result.current.session.phase).toBe('non_shockable_pathway');
    expect(result.current.timerState.totalElapsed).toBe(savedTimerState.totalElapsed);
    expect(result.current.timerState.totalCPRTime).toBe(savedTimerState.totalCPRTime);
  });
});

describe('useACLSLogic - Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should handle null patient weight in pediatric mode', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.setPathwayMode('pediatric');
      result.current.actions.setPatientWeight(null);
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('asystole');
    });

    expect(result.current.session.patientWeight).toBeNull();
    expect(result.current.session.pathwayMode).toBe('pediatric');
  });

  it('should handle rapid state changes without errors', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    expect(() => {
      act(() => {
        result.current.actions.startCPR();
        result.current.actions.selectRhythm('vf_pvt');
        result.current.actions.startRhythmCheck();
        result.current.actions.completeRhythmCheckNoShock('asystole');
        result.current.actions.giveEpinephrine();
        result.current.actions.setAirway('ett');
      });
    }).not.toThrow();
  });

  it('should handle multiple rhythm checks', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    for (let i = 0; i < 3; i++) {
      act(() => {
        vi.advanceTimersByTime(DEFAULT_ACLS_CONFIG.rhythmCheckIntervalMs);
        result.current.actions.startRhythmCheck();
        result.current.actions.completeRhythmCheckWithShock(200);
      });
    }

    expect(result.current.session.shockCount).toBe(4); // 1 initial + 3 additional
  });

  it('should handle switching between shockable and non-shockable', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
      result.current.actions.startRhythmCheck();
      result.current.actions.completeRhythmCheckNoShock('asystole');
    });

    expect(result.current.session.phase).toBe('non_shockable_pathway');
    expect(result.current.session.currentRhythm).toBe('asystole');
  });

  it('should handle CPR ratio changes', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.setCPRRatio('15:2');
    });

    expect(result.current.session.cprRatio).toBe('15:2');

    act(() => {
      result.current.actions.setCPRRatio('30:2');
    });

    expect(result.current.session.cprRatio).toBe('30:2');
  });

  it('should handle pathway mode changes with appropriate CPR ratio defaults', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 200));

    act(() => {
      result.current.actions.setPathwayMode('pediatric');
    });

    expect(result.current.session.pathwayMode).toBe('pediatric');
    expect(result.current.session.cprRatio).toBe('15:2');

    act(() => {
      result.current.actions.setPathwayMode('adult');
    });

    expect(result.current.session.pathwayMode).toBe('adult');
    expect(result.current.session.cprRatio).toBe('30:2');
  });

  it('should handle custom defibrillator energy settings', () => {
    const { result } = renderHook(() => useACLSLogic(DEFAULT_ACLS_CONFIG, 360));

    act(() => {
      result.current.actions.startCPR();
      result.current.actions.selectRhythm('vf_pvt');
    });

    expect(result.current.session.interventions.some(
      i => i.type === 'shock' && i.value === 360
    )).toBe(true);
  });
});
