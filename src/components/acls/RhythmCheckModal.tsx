import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Zap, Heart, Activity, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoScaleText } from '@/hooks/useAutoScaleText';
import { FlatlineIcon, MonitorLineIcon } from '@/components/icons/ClinicalIcons';

interface RhythmCheckModalProps {
  isShockable: boolean;
  currentEnergy: string; // Now a display string like "10J" or "2 J/kg"
  shockNumber: number;
  onShock: () => void;
  onNoShockAsystole: () => void;
  onNoShockPEA: () => void;
  onROSC: () => void;
  onTerminate: () => void;
}

export function RhythmCheckModal({
  isShockable,
  currentEnergy,
  shockNumber,
  onShock,
  onNoShockAsystole,
  onNoShockPEA,
  onROSC,
  onTerminate,
}: RhythmCheckModalProps) {
  const { t } = useTranslation();

  // Auto-scale hooks for button text
  const { ref: shockRef, scale: shockScale } = useAutoScaleText();
  const { ref: shockNumberRef, scale: shockNumberScale } = useAutoScaleText();
  const { ref: roscRef, scale: roscScale } = useAutoScaleText();
  const { ref: terminateRef, scale: terminateScale } = useAutoScaleText();

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md space-y-4 my-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-acls-warning/20 mb-4">
            <MonitorLineIcon className="h-8 w-8 text-acls-warning" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{t('rhythmCheckModal.title')}</h2>
          <p className="text-muted-foreground mt-2">
            {t('rhythmCheckModal.subtitle')}
          </p>
        </div>

        <div className="space-y-3">
          {/* SHOCK Button - Most prominent */}
          <Button
            onClick={onShock}
            className={cn(
              'w-full h-[5.5rem] px-4 py-3 text-xl font-bold gap-3 touch-target btn-3d btn-3d-shockable',
              'bg-acls-shockable hover:bg-acls-shockable/90 text-white',
              'shadow-lg shadow-acls-shockable/30'
            )}
          >
            <Zap className="h-8 w-8" />
            <div className="text-left">
              <div ref={shockRef} style={{ fontSize: `${shockScale}em` }}>
                {t('rhythmCheckModal.shockVfPvt')}
              </div>
              <div className="text-sm font-normal opacity-90" ref={shockNumberRef} style={{ fontSize: `${shockNumberScale}em` }}>
                {t('rhythmCheckModal.shockNumber', { number: shockNumber })} - {currentEnergy}
              </div>
            </div>
          </Button>

          {/* No Shock Options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onNoShockAsystole}
              variant="outline"
              className={cn(
                'h-[5.25rem] px-4 py-3 flex-col gap-1 text-base font-bold touch-target btn-3d btn-3d-non-shockable',
                'border-2 border-acls-non-shockable text-acls-non-shockable',
                'hover:bg-acls-non-shockable hover:text-white'
              )}
            >
              <FlatlineIcon className="h-5 w-5" />
              <span>{t('rhythm.asystole')}</span>
              <span className="text-xs font-normal">{t('rhythmCheckModal.noShock')}</span>
            </Button>

            <Button
              onClick={onNoShockPEA}
              variant="outline"
              className={cn(
                'h-[5.25rem] px-4 py-3 flex-col gap-1 text-base font-bold touch-target btn-3d btn-3d-pea',
                'border-2 border-acls-pea text-acls-pea',
                'hover:bg-acls-pea hover:text-white'
              )}
            >
              <Activity className="h-5 w-5" />
              <span>{t('rhythm.pea')}</span>
              <span className="text-xs font-normal">{t('rhythmCheckModal.noShock')}</span>
            </Button>
          </div>


          {/* ROSC */}
          <Button
            onClick={onROSC}
            className={cn(
              'w-full h-[4.5rem] px-4 py-3 text-lg font-bold gap-3 touch-target btn-3d btn-3d-success',
              'bg-acls-success hover:bg-acls-success/90 text-white'
            )}
          >
            <Heart className="h-6 w-6" />
            <div className="text-left">
              <div ref={roscRef} style={{ fontSize: `${roscScale}em` }}>
                {t('actions.rosc')} - {t('postRosc.roscAchieved')}
              </div>
              <div className="text-sm font-normal opacity-90">{t('postRosc.beginCare')}</div>
            </div>
          </Button>

          {/* Terminate Code */}
          <Button
            onClick={onTerminate}
            variant="outline"
            className={cn(
              'w-full h-[3.85rem] px-4 py-3 text-base font-semibold gap-2 touch-target btn-3d btn-3d-critical',
              'border-2 border-destructive text-destructive',
              'hover:bg-destructive hover:text-destructive-foreground'
            )}
          >
            <XCircle className="h-5 w-5" />
            <span ref={terminateRef} style={{ fontSize: `${terminateScale}em` }}>
              {t('actions.terminate')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
