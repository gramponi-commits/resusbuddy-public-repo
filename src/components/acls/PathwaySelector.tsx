import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeightInput } from './WeightInput';
import { PediatricToggle } from './PediatricToggle';
import { PathwayMode } from '@/types/acls';
import {
  getPathwayMode,
  savePathwayMode,
  getPathwayWeight,
  savePathwayWeight,
} from '@/lib/activeSessionStorage';

export type { PathwayMode };

interface PathwaySelectorProps {
  onSelectPathway: (mode: PathwayMode) => void;
  onStartCPR: () => void;
  onSetWeight: (weight: number | null) => void;
  currentWeight: number | null;
  onSelectBradyTachy?: () => void;
}

/**
 * PathwaySelector - Redesigned with pediatric toggle at top
 * - Single toggle controls adult/pediatric mode
 * - Weight selector appears when pediatric is on
 * - Cardiac Arrest button changes color based on mode
 * - Brady/Tachy button stays yellow
 */
export function PathwaySelector({
  onSelectPathway,
  onStartCPR,
  onSetWeight,
  currentWeight,
  onSelectBradyTachy,
}: PathwaySelectorProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PathwayMode>(() => getPathwayMode());
  const [showWeightDialog, setShowWeightDialog] = useState(false);

  // Load persisted weight when mode changes to pediatric
  useEffect(() => {
    if (mode === 'pediatric') {
      const savedWeight = getPathwayWeight();
      if (savedWeight !== null && savedWeight !== currentWeight) {
        onSetWeight(savedWeight);
      }
    }
  }, [mode, currentWeight, onSetWeight]);

  const handleToggleMode = (newMode: PathwayMode) => {
    setMode(newMode);
    savePathwayMode(newMode);
    onSelectPathway(newMode);

    // Clear weight when switching to adult
    if (newMode === 'adult' && currentWeight !== null) {
      onSetWeight(null);
      savePathwayWeight(null);
    }
  };

  const handleWeightSet = (weight: number | null) => {
    onSetWeight(weight);
    savePathwayWeight(weight);
    setShowWeightDialog(false);
  };

  const handleStartCardiacArrest = () => {
    // Ensure parent has the correct mode before starting CPR
    onSelectPathway(mode);
    onStartCPR();
  };

  const isPediatric = mode === 'pediatric';

  return (
    <div className="flex flex-col items-center pt-6 pb-12">
      <div className="w-full max-w-sm">
        {/* Pediatric Toggle - At the top */}
        <PediatricToggle mode={mode} onToggle={handleToggleMode} />

        {/* Weight Selector Area - Fixed height container */}
        <div className="h-28 relative mt-4">
          {isPediatric && (
            <div className="absolute inset-0 animate-in fade-in slide-in-from-top-2 duration-200">
              <Button
                onClick={() => setShowWeightDialog(true)}
                variant="outline"
                className={cn(
                  'w-full h-16 flex items-center justify-center gap-3',
                  'border-2 border-pals-primary text-pals-primary hover:bg-pals-primary/10'
                )}
              >
                <Scale className="h-6 w-6" />
                <div className="text-lg font-bold">
                  {currentWeight ? `${currentWeight} kg` : t('weight.setWeight')}
                </div>
              </Button>

              <WeightInput
                currentWeight={currentWeight}
                onWeightChange={handleWeightSet}
                isOpen={showWeightDialog}
                onOpenChange={setShowWeightDialog}
                showTrigger={false}
              />

              <p className="text-xs text-muted-foreground text-center mt-2">
                {t('pathway.weightCanBeSetLater')}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {/* Cardiac Arrest Button - Primary emergency action */}
        <Button
          onClick={handleStartCardiacArrest}
          className={cn(
            'w-full h-24 flex flex-col items-center justify-center gap-1 mt-6 btn-3d',
            isPediatric
              ? 'bg-pals-primary hover:bg-pals-primary/90 text-white btn-3d-pals'
              : 'bg-acls-critical hover:bg-acls-critical/90 text-white btn-3d-critical'
          )}
        >
          <span className="text-2xl font-bold">{t('pathway.cardiacArrest')}</span>
          <span className="text-sm opacity-80">
            {isPediatric
              ? currentWeight
                ? `${currentWeight} kg`
                : t('weight.unknownWeight')
              : t('pathway.adultDescription')}
          </span>
        </Button>

        {/* Brady/Tachy Button - Secondary protocol */}
        {onSelectBradyTachy && (
          <Button
            onClick={onSelectBradyTachy}
            className={cn(
              'w-[90%] mx-auto h-16 flex items-center justify-center px-6 mt-8 btn-3d btn-3d-yellow',
              'bg-yellow-500 hover:bg-yellow-600 text-black'
            )}
          >
            <span className="text-lg font-bold">
              {t('bradyTachy.moduleTitle')}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
