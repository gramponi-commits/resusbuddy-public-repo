import { act, fireEvent, render, screen } from '@/test/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { PregnancyChecklist } from './PregnancyChecklist';
import {
  DEFAULT_PREGNANCY_CAUSES,
  DEFAULT_PREGNANCY_INTERVENTIONS,
  type PregnancyCauses,
  type PregnancyInterventions,
} from '@/types/acls';

interface HarnessProps {
  cprStartTime: number;
  onDeliveryAlert?: () => void;
}

function PregnancyChecklistHarness({ cprStartTime, onDeliveryAlert }: HarnessProps) {
  const [pregnancyCauses, setPregnancyCauses] = useState<PregnancyCauses>({
    ...DEFAULT_PREGNANCY_CAUSES,
  });
  const [pregnancyInterventions, setPregnancyInterventions] = useState<PregnancyInterventions>({
    ...DEFAULT_PREGNANCY_INTERVENTIONS,
  });

  return (
    <PregnancyChecklist
      pregnancyActive
      pregnancyCauses={pregnancyCauses}
      pregnancyInterventions={pregnancyInterventions}
      pregnancyStartTime={cprStartTime}
      cprStartTime={cprStartTime}
      onTogglePregnancy={() => undefined}
      onUpdateCauses={(updates) => {
        setPregnancyCauses((prev) => ({ ...prev, ...updates }));
      }}
      onUpdateInterventions={(updates) => {
        setPregnancyInterventions((prev) => ({ ...prev, ...updates }));
      }}
      onDeliveryAlert={onDeliveryAlert}
    />
  );
}

function openPregnancyChecklist() {
  fireEvent.click(screen.getByText('Pregnancy - Obstetric Arrest'));
}

function toggleFundusEligibility() {
  fireEvent.click(screen.getByText('Fundus at/above umbilicus (~20 weeks)'));
}

describe('PregnancyChecklist', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows immediate preparation warning before 5 minutes once fundus eligibility is checked', () => {
    const cprStartTime = Date.now();
    render(<PregnancyChecklistHarness cprStartTime={cprStartTime} />);

    openPregnancyChecklist();
    toggleFundusEligibility();

    expect(screen.getByText('BEGIN EMERGENCY DELIVERY PREPARATION NOW')).toBeInTheDocument();
    expect(screen.getByText('Target completion by 5:00 from arrest/CPR start if no ROSC.')).toBeInTheDocument();
  });

  it('shows a decreasing countdown toward the 5-minute deadline', () => {
    const cprStartTime = Date.now();
    render(<PregnancyChecklistHarness cprStartTime={cprStartTime} />);

    openPregnancyChecklist();
    toggleFundusEligibility();
    expect(screen.getByText('5:00')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('4:58')).toBeInTheDocument();
  });

  it('shows critical emergency delivery alert at or after 5 minutes', () => {
    const cprStartTime = Date.now();
    const onDeliveryAlert = vi.fn();
    render(<PregnancyChecklistHarness cprStartTime={cprStartTime} onDeliveryAlert={onDeliveryAlert} />);

    openPregnancyChecklist();
    toggleFundusEligibility();

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(screen.getByText('EMERGENCY DELIVERY NOW')).toBeInTheDocument();
    expect(onDeliveryAlert).toHaveBeenCalledTimes(1);
  });

  it('fires delivery alert callback once at 5 minutes and not before', () => {
    const cprStartTime = Date.now();
    const onDeliveryAlert = vi.fn();
    render(<PregnancyChecklistHarness cprStartTime={cprStartTime} onDeliveryAlert={onDeliveryAlert} />);

    openPregnancyChecklist();
    toggleFundusEligibility();

    act(() => {
      vi.advanceTimersByTime((5 * 60 * 1000) - 1000);
    });
    expect(onDeliveryAlert).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDeliveryAlert).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(onDeliveryAlert).toHaveBeenCalledTimes(1);
  });

  it('supports reversible fundus eligibility checkbox behavior', () => {
    const cprStartTime = Date.now();
    render(<PregnancyChecklistHarness cprStartTime={cprStartTime} />);

    openPregnancyChecklist();
    toggleFundusEligibility();
    expect(screen.getByText('BEGIN EMERGENCY DELIVERY PREPARATION NOW')).toBeInTheDocument();

    toggleFundusEligibility();
    expect(screen.queryByText('BEGIN EMERGENCY DELIVERY PREPARATION NOW')).not.toBeInTheDocument();
  });
});
