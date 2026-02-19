import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeightInput, WeightDisplay } from '../WeightInput';
import { RhythmSelector } from '../RhythmSelector';
import { CodeTimers } from '../TimerDisplay';
import { CPRQualityPanel } from '../CPRQualityPanel';
import { HsAndTsChecklist } from '../HsAndTsChecklist';
import { PregnancyChecklist } from '../PregnancyChecklist';
import { SpecialCircumstancesChecklist } from '../SpecialCircumstancesChecklist';
import { CodeTimeline } from '../CodeTimeline';
import type {
  PathwayMode,
  Intervention,
  HsAndTs,
  AirwayStatus,
  PregnancyCauses,
  PregnancyInterventions,
  CPRRatio,
  RhythmType,
  SpecialCircumstances,
} from '@/types/acls';

// Use HsAndTs directly instead of HsAndTsState alias
type HsAndTsState = HsAndTs;

interface CPRPendingRhythmViewProps {
  pathwayMode: PathwayMode;
  patientWeight: number | null;
  currentRhythm: RhythmType;
  totalElapsed: number;
  totalCPRTime: number;
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
  vibrationEnabled: boolean;
  onSetWeight: (weight: number | null) => void;
  onSelectRhythm: (rhythm: RhythmType) => void;
  onSetRhythmAnalysisActive: (active: boolean) => void;
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
}

/**
 * CPR Pending Rhythm View - Shows when CPR is active but rhythm analysis not yet done
 * Includes analyze rhythm button, timers, quality metrics, and timeline
 */
export const CPRPendingRhythmView = memo<CPRPendingRhythmViewProps>(({
  pathwayMode,
  patientWeight,
  currentRhythm,
  totalElapsed,
  totalCPRTime,
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
  vibrationEnabled,
  onSetWeight,
  onSelectRhythm,
  onSetRhythmAnalysisActive,
  onAirwayChange,
  onETCO2Record,
  onCPRRatioChange,
  onUpdateHsAndTs,
  onTogglePregnancy,
  onUpdatePregnancyCauses,
  onUpdatePregnancyInterventions,
  onDeliveryAlert,
  onToggleSpecialCircumstance,
}) => {
  const { t } = useTranslation();
  const [showRhythmSelector, setShowRhythmSelector] = useState(false);
  const [showWeightDialog, setShowWeightDialog] = useState(false);

  return (
    <>
      {/* Weight Display + Edit Button - Only for Pediatric */}
      {pathwayMode === 'pediatric' && (
        <div className="flex items-center justify-center gap-3">
          <WeightDisplay
            weight={patientWeight}
            onEdit={() => setShowWeightDialog(true)}
          />
        </div>
      )}

      {/* Weight Input Dialog - only for pediatric */}
      {pathwayMode === 'pediatric' && (
        <WeightInput
          currentWeight={patientWeight}
          onWeightChange={onSetWeight}
          isOpen={showWeightDialog}
          onOpenChange={setShowWeightDialog}
          showTrigger={false}
        />
      )}

      {/* Analyze Rhythm Button or Rhythm Selector */}
      {!showRhythmSelector ? (
        <Button
          onClick={() => {
            setShowRhythmSelector(true);
            onSetRhythmAnalysisActive(true);
          }}
          className="h-14 sm:h-16 w-full text-lg sm:text-xl font-bold bg-acls-critical hover:bg-acls-critical/90 text-white touch-target btn-3d btn-3d-critical"
          aria-label={t('actions.analyzeRhythm')}
        >
          <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
          {t('actions.analyzeRhythm')}
        </Button>
      ) : (
        <RhythmSelector
          currentRhythm={currentRhythm}
          onSelectRhythm={(rhythm) => {
            onSetRhythmAnalysisActive(false);
            onSelectRhythm(rhythm);
          }}
          isInitial={false}
        />
      )}

      {/* Code Timers - Total & CPR */}
      <CodeTimers
        totalElapsed={totalElapsed}
        totalCPRTime={totalCPRTime}
      />

      {/* CPR Quality */}
      <CPRQualityPanel
        airwayStatus={airwayStatus}
        onAirwayChange={onAirwayChange}
        onETCO2Record={onETCO2Record}
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

      {/* Special Circumstances Checklist */}
      <SpecialCircumstancesChecklist
        specialCircumstances={specialCircumstances}
        onToggleCondition={onToggleSpecialCircumstance}
      />

      {/* Code Timeline */}
      <CodeTimeline
        interventions={interventions}
        startTime={startTime}
        bradyTachyStartTime={bradyTachyStartTime}
      />
    </>
  );
});

CPRPendingRhythmView.displayName = 'CPRPendingRhythmView';
