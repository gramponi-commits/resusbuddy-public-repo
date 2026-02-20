import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WeightInput, WeightDisplay } from '../WeightInput';
import { ActionButtons } from '../ActionButtons';
import { CycleTimers, CodeTimers } from '../TimerDisplay';
import { CPRQualityPanel } from '../CPRQualityPanel';
import { HsAndTsChecklist } from '../HsAndTsChecklist';
import { PregnancyChecklist } from '../PregnancyChecklist';
import { SpecialCircumstancesChecklist } from '../SpecialCircumstancesChecklist';
import { ECMOPanel } from '../ECMOPanel';
import { CodeTimeline } from '../CodeTimeline';
import type {
  PathwayMode,
  Intervention,
  HsAndTs,
  AirwayStatus,
  PregnancyCauses,
  PregnancyInterventions,
  CPRRatio,
  SpecialCircumstances,
} from '@/types/acls';
import type { ETCO2Unit } from '@/lib/etco2Units';

// Use HsAndTs directly instead of HsAndTsState alias
type HsAndTsState = HsAndTs;

interface ActiveCodeViewProps {
  // Session state
  pathwayMode: PathwayMode;
  patientWeight: number | null;
  epinephrineCount: number;
  amiodaroneCount: number;
  lidocaineCount: number;
  airwayStatus: AirwayStatus;
  cprRatio: CPRRatio;
  hsAndTs: HsAndTsState;
  interventions: Intervention[];
  startTime: number | null;
  bradyTachyStartTime?: number | null;
  pregnancyActive?: boolean;
  pregnancyCauses?: PregnancyCauses;
  pregnancyInterventions?: PregnancyInterventions;
  pregnancyStartTime?: number | null;
  // Special Circumstances
  specialCircumstances: SpecialCircumstances;

  // Timer state
  cprCycleRemaining: number;
  epiRemaining: number;
  preShockAlert: boolean;
  rhythmCheckDue: boolean;
  totalElapsed: number;
  totalCPRTime: number;

  // Button states
  canGiveEpinephrine: boolean;
  canGiveAmiodarone: boolean;
  canGiveLidocaine: boolean;
  epiDue: boolean;
  antiarrhythmicDue: boolean;

  // Settings
  preferLidocaine: boolean;
  vibrationEnabled: boolean;
  cowboyMode?: boolean;
  etco2Unit: ETCO2Unit;

  // Actions
  onSetWeight: (weight: number | null) => void;
  onEpinephrine: () => void;
  onAmiodarone: () => void;
  onLidocaine: () => void;
  onRhythmCheck: () => void;
  onAirwayChange: (status: AirwayStatus) => void;
  onETCO2Record: (value: number) => void;
  onCPRRatioChange: (ratio: CPRRatio) => void;
  onUpdateHsAndTs: (updates: Partial<HsAndTsState>) => void;
  onTogglePregnancy: (active: boolean) => void;
  onUpdatePregnancyCauses: (updates: Partial<PregnancyCauses>) => void;
  onUpdatePregnancyInterventions: (updates: Partial<PregnancyInterventions>) => void;
  onDeliveryAlert: () => void;
  // Special Circumstances actions
  onToggleSpecialCircumstance: (key: keyof SpecialCircumstances, active: boolean) => void;

  // ECMO/ECPR
  ecmoEnabled: boolean;
  ecmoActivationTimeMinutes: number;
  ecmoInclusionCriteria: string[];
  ecmoExclusionCriteria: string[];
  onActivateECMO: () => void;
  onECMOAvailable?: () => void;
}

/**
 * Active Code View - Main interface during active resuscitation
 * Shows action buttons, timers, quality metrics, and timeline
 * Memoized to prevent unnecessary re-renders during timer updates
 */
export const ActiveCodeView = memo<ActiveCodeViewProps>(({
  pathwayMode,
  patientWeight,
  epinephrineCount,
  amiodaroneCount,
  lidocaineCount,
  airwayStatus,
  cprRatio,
  hsAndTs,
  interventions,
  startTime,
  bradyTachyStartTime,
  pregnancyActive,
  pregnancyCauses,
  pregnancyInterventions,
  pregnancyStartTime,
  specialCircumstances,
  cprCycleRemaining,
  epiRemaining,
  preShockAlert,
  rhythmCheckDue,
  totalElapsed,
  totalCPRTime,
  canGiveEpinephrine,
  canGiveAmiodarone,
  canGiveLidocaine,
  epiDue,
  antiarrhythmicDue,
  preferLidocaine,
  vibrationEnabled,
  cowboyMode,
  etco2Unit,
  onSetWeight,
  onEpinephrine,
  onAmiodarone,
  onLidocaine,
  onRhythmCheck,
  onAirwayChange,
  onETCO2Record,
  onCPRRatioChange,
  onUpdateHsAndTs,
  onTogglePregnancy,
  onUpdatePregnancyCauses,
  onUpdatePregnancyInterventions,
  onDeliveryAlert,
  onToggleSpecialCircumstance,
  ecmoEnabled,
  ecmoActivationTimeMinutes,
  ecmoInclusionCriteria,
  ecmoExclusionCriteria,
  onActivateECMO,
  onECMOAvailable,
}) => {
  const { t } = useTranslation();
  const [showWeightDialog, setShowWeightDialog] = useState(false);

  return (
    <>
      {/* Weight Display + Edit Button - Only for Pediatric */}
      {pathwayMode === 'pediatric' && (
        <>
          <div className="flex items-center justify-center gap-3">
            <WeightDisplay
              weight={patientWeight}
              onEdit={() => setShowWeightDialog(true)}
            />
          </div>

          <WeightInput
            currentWeight={patientWeight}
            onWeightChange={onSetWeight}
            isOpen={showWeightDialog}
            onOpenChange={setShowWeightDialog}
            showTrigger={false}
          />
        </>
      )}

      {/* Action Buttons */}
      <ActionButtons
        canGiveEpinephrine={canGiveEpinephrine}
        canGiveAmiodarone={canGiveAmiodarone}
        canGiveLidocaine={canGiveLidocaine}
        epiDue={epiDue}
        antiarrhythmicDue={antiarrhythmicDue}
        rhythmCheckDue={rhythmCheckDue}
        epinephrineCount={epinephrineCount}
        amiodaroneCount={amiodaroneCount}
        lidocaineCount={lidocaineCount}
        preferLidocaine={preferLidocaine}
        patientWeight={patientWeight}
        pathwayMode={pathwayMode}
        cowboyMode={cowboyMode}
        onEpinephrine={onEpinephrine}
        onAmiodarone={onAmiodarone}
        onLidocaine={onLidocaine}
        onRhythmCheck={onRhythmCheck}
      />

      {/* Cycle Timers - Rhythm Check & Epi */}
      <CycleTimers
        cprCycleRemaining={cprCycleRemaining}
        epiRemaining={epiRemaining}
        preShockAlert={preShockAlert}
        rhythmCheckDue={rhythmCheckDue}
        showEpiTimer={epinephrineCount > 0}
      />

      {/* CPR Quality */}
      <CPRQualityPanel
        airwayStatus={airwayStatus}
        onAirwayChange={onAirwayChange}
        onETCO2Record={onETCO2Record}
        etco2Unit={etco2Unit}
        cprRatio={cprRatio}
        onCPRRatioChange={onCPRRatioChange}
        pathwayMode={pathwayMode}
      />

      {/* H's & T's */}
      <HsAndTsChecklist
        hsAndTs={hsAndTs}
        onUpdate={onUpdateHsAndTs}
      />

      {/* Pregnancy Checklist - Adult only */}
      {pathwayMode === 'adult' && (
        <PregnancyChecklist
          pregnancyActive={pregnancyActive!}
          pregnancyCauses={pregnancyCauses!}
          pregnancyInterventions={pregnancyInterventions!}
          pregnancyStartTime={pregnancyStartTime!}
          cprStartTime={startTime}
          onTogglePregnancy={onTogglePregnancy}
          onUpdateCauses={onUpdatePregnancyCauses}
          onUpdateInterventions={onUpdatePregnancyInterventions}
          onDeliveryAlert={onDeliveryAlert}
        />
      )}

      {/* Special Circumstances - Both adult and pediatric */}
      <SpecialCircumstancesChecklist
        specialCircumstances={specialCircumstances}
        onToggleCondition={onToggleSpecialCircumstance}
      />

      {/* ECMO/ECPR Panel - Only when enabled in settings */}
      <ECMOPanel
        ecmoEnabled={ecmoEnabled}
        activationTimeMinutes={ecmoActivationTimeMinutes}
        totalElapsed={totalElapsed}
        inclusionCriteria={ecmoInclusionCriteria}
        exclusionCriteria={ecmoExclusionCriteria}
        onActivateECMO={onActivateECMO}
        onECMOAvailable={onECMOAvailable}
      />

      {/* Code Timers - Total & CPR */}
      <CodeTimers
        totalElapsed={totalElapsed}
        totalCPRTime={totalCPRTime}
      />

      {/* Code Timeline */}
      <CodeTimeline
        interventions={interventions}
        startTime={startTime}
        bradyTachyStartTime={bradyTachyStartTime}
        etco2Unit={etco2Unit}
      />
    </>
  );
});

ActiveCodeView.displayName = 'ActiveCodeView';
