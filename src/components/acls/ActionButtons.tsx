import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Syringe, Pill, Stethoscope, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoScaleText } from '@/hooks/useAutoScaleText';
import {
  calculateEpinephrineDose,
  calculateAmiodaroneDose,
  calculateLidocaineDose,
} from '@/lib/palsDosing';
import {
  getAdultEpinephrineDose,
  getAdultAmiodaroneDose,
  getAdultLidocaineDose,
} from '@/lib/aclsDosing';
import { PathwayMode } from '@/types/acls';

interface ActionButtonsProps {
  canGiveEpinephrine: boolean;
  canGiveAmiodarone: boolean;
  canGiveLidocaine: boolean;
  epiDue: boolean;
  rhythmCheckDue: boolean;
  epinephrineCount: number;
  amiodaroneCount: number;
  lidocaineCount: number;
  preferLidocaine: boolean;
  patientWeight: number | null;
  pathwayMode: PathwayMode;
  onEpinephrine: () => void;
  onAmiodarone: () => void;
  onLidocaine: () => void;
  onRhythmCheck: () => void;
}

export function ActionButtons({
  canGiveEpinephrine,
  canGiveAmiodarone,
  canGiveLidocaine,
  epiDue,
  rhythmCheckDue,
  epinephrineCount,
  amiodaroneCount,
  lidocaineCount,
  preferLidocaine,
  patientWeight,
  pathwayMode,
  onEpinephrine,
  onAmiodarone,
  onLidocaine,
  onRhythmCheck,
}: ActionButtonsProps) {
  const { t } = useTranslation();

  // Auto-scale hooks for button text
  const { ref: rhythmCheckRef, scale: rhythmCheckScale } = useAutoScaleText();
  const { ref: epiRef, scale: epiScale } = useAutoScaleText();
  const { ref: antiarrhythmicRef, scale: antiarrhythmicScale } = useAutoScaleText();

  // Loading and success states
  const [loadingState, setLoadingState] = useState<{
    epi: boolean;
    antiarrhythmic: boolean;
    rhythmCheck: boolean;
  }>({
    epi: false,
    antiarrhythmic: false,
    rhythmCheck: false,
  });

  const [successState, setSuccessState] = useState<{
    epi: boolean;
    antiarrhythmic: boolean;
    rhythmCheck: boolean;
  }>({
    epi: false,
    antiarrhythmic: false,
    rhythmCheck: false,
  });

  // Handle button clicks with loading and success animations
  const handleEpinephrine = async () => {
    setLoadingState(prev => ({ ...prev, epi: true }));
    await new Promise(resolve => setTimeout(resolve, 200)); // Brief loading state
    onEpinephrine();
    setLoadingState(prev => ({ ...prev, epi: false }));
    setSuccessState(prev => ({ ...prev, epi: true }));
    setTimeout(() => setSuccessState(prev => ({ ...prev, epi: false })), 1500);
  };

  const handleAntiarrhythmic = async () => {
    setLoadingState(prev => ({ ...prev, antiarrhythmic: true }));
    await new Promise(resolve => setTimeout(resolve, 200));
    showLidocaine ? onLidocaine() : onAmiodarone();
    setLoadingState(prev => ({ ...prev, antiarrhythmic: false }));
    setSuccessState(prev => ({ ...prev, antiarrhythmic: true }));
    setTimeout(() => setSuccessState(prev => ({ ...prev, antiarrhythmic: false })), 1500);
  };

  const handleRhythmCheck = async () => {
    setLoadingState(prev => ({ ...prev, rhythmCheck: true }));
    await new Promise(resolve => setTimeout(resolve, 200));
    onRhythmCheck();
    setLoadingState(prev => ({ ...prev, rhythmCheck: false }));
  };

  // Calculate doses based on pathway mode
  const epiDose = pathwayMode === 'pediatric' 
    ? calculateEpinephrineDose(patientWeight)
    : getAdultEpinephrineDose();
  
  const amioDose = pathwayMode === 'pediatric'
    ? calculateAmiodaroneDose(patientWeight, amiodaroneCount)
    : getAdultAmiodaroneDose(amiodaroneCount);
  
  const lidoDose = pathwayMode === 'pediatric'
    ? calculateLidocaineDose(patientWeight)
    : getAdultLidocaineDose(lidocaineCount);

  // Show lidocaine if preferred, otherwise amiodarone
  const showLidocaine = preferLidocaine;
  const antiarrhythmicCount = showLidocaine ? lidocaineCount : amiodaroneCount;
  const canGiveAntiarrhythmic = showLidocaine ? canGiveLidocaine : canGiveAmiodarone;
  const onAntiarrhythmic = showLidocaine ? onLidocaine : onAmiodarone;
  const antiarrhythmicDose = showLidocaine ? lidoDose : amioDose;

  // Theme colors based on pathway
  const isAdult = pathwayMode === 'adult';

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Rhythm Check Button - Most prominent when due */}
      <Button
        onClick={handleRhythmCheck}
        disabled={loadingState.rhythmCheck}
        className={cn(
          'w-full h-14 sm:h-16 text-base sm:text-lg font-bold gap-2 sm:gap-3 touch-target btn-3d btn-3d-critical',
          rhythmCheckDue
            ? 'bg-acls-critical hover:bg-acls-critical/90 text-white pulse-critical'
            : 'bg-acls-critical/80 hover:bg-acls-critical/70 text-white'
        )}
        aria-label={rhythmCheckDue ? t('actions.rhythmCheckNow') : t('actions.rhythmCheck')}
        aria-live="polite"
      >
        {loadingState.rhythmCheck ? (
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
        ) : (
          <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
        <span ref={rhythmCheckRef} style={{ fontSize: `${rhythmCheckScale}em` }}>
          {rhythmCheckDue ? t('actions.rhythmCheckNow') : t('actions.rhythmCheck')}
        </span>
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {/* Epinephrine Button */}
        <Button
          onClick={handleEpinephrine}
          disabled={!canGiveEpinephrine || loadingState.epi}
          className={cn(
            'w-full h-20 sm:h-24 flex-col gap-0.5 sm:gap-1 text-sm sm:text-base font-bold touch-target btn-3d',
            epiDue && canGiveEpinephrine
              ? 'bg-acls-critical hover:bg-acls-critical/90 text-white pulse-critical btn-3d-critical'
              : canGiveEpinephrine
              ? 'bg-acls-medication hover:bg-acls-medication/90 text-white btn-3d-medication'
              : 'bg-muted text-muted-foreground btn-3d-muted'
          )}
          aria-label={`${t('actions.epinephrine')} ${epiDose.display}`}
          aria-live="polite"
          aria-disabled={!canGiveEpinephrine}
        >
          {loadingState.epi ? (
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
          ) : successState.epi ? (
            <Check className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Syringe className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
          <span ref={epiRef} className="text-clinical-sm sm:text-clinical-base" style={{ fontSize: `${epiScale}em` }}>
            {t('actions.epinephrine')}
          </span>
          <span className="text-clinical-xs font-normal">
            {epiDose.display} IV/IO (#{epinephrineCount + 1})
          </span>
        </Button>

        {/* Amiodarone/Lidocaine Button */}
        <Button
          onClick={handleAntiarrhythmic}
          disabled={!canGiveAntiarrhythmic || loadingState.antiarrhythmic}
          className={cn(
            'w-full h-20 sm:h-24 flex-col gap-0.5 sm:gap-1 text-sm sm:text-base font-bold touch-target btn-3d',
            canGiveAntiarrhythmic
              ? 'bg-acls-medication hover:bg-acls-medication/90 text-white btn-3d-medication'
              : 'bg-muted text-muted-foreground btn-3d-muted'
          )}
          aria-label={`${showLidocaine ? t('actions.lidocaine') : t('actions.amiodarone')} ${antiarrhythmicDose.display}`}
          aria-live="polite"
          aria-disabled={!canGiveAntiarrhythmic}
        >
          {loadingState.antiarrhythmic ? (
            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
          ) : successState.antiarrhythmic ? (
            <Check className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Pill className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
          <span ref={antiarrhythmicRef} className="text-clinical-sm sm:text-clinical-base" style={{ fontSize: `${antiarrhythmicScale}em` }}>
            {showLidocaine ? t('actions.lidocaine') : t('actions.amiodarone')}
          </span>
          <span className="text-clinical-xs font-normal">
            {antiarrhythmicDose.display} (#{antiarrhythmicCount + 1})
          </span>
        </Button>
      </div>
    </div>
  );
}