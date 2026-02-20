import { useTranslation } from 'react-i18next';
import { RhythmType } from '@/types/acls';
import { Zap, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FlatlineIcon } from '@/components/icons/ClinicalIcons';

interface RhythmSelectorProps {
  currentRhythm: RhythmType;
  onSelectRhythm: (rhythm: RhythmType) => void;
  isInitial?: boolean;
}

export function RhythmSelector({ currentRhythm, onSelectRhythm, isInitial = true }: RhythmSelectorProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">
        {isInitial ? t('rhythm.selectInitial') : t('rhythm.changeRhythm')}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => onSelectRhythm('vf_pvt')}
          className={cn(
            'w-full flex items-center justify-start gap-3 h-14 px-4 py-2.5 text-lg font-bold focus:outline-none rounded-lg btn-3d btn-3d-shockable',
            currentRhythm === 'vf_pvt'
              ? 'bg-acls-shockable text-white hover:bg-acls-shockable/90 ring-2 ring-acls-shockable ring-offset-2 ring-offset-background'
              : 'bg-muted text-acls-shockable hover:bg-acls-shockable/20'
          )}
          role="radio"
          aria-checked={currentRhythm === 'vf_pvt'}
          aria-label={t('rhythm.vfPvt')}
        >
          <Zap className="h-6 w-6" />
          <div className="text-left">
            <div>{t('rhythm.vfPvt')}</div>
            <div className="text-xs font-normal opacity-80">{t('rhythm.shockable')}</div>
          </div>
        </button>

        <button
          onClick={() => onSelectRhythm('asystole')}
          className={cn(
            'w-full flex items-center justify-start gap-3 h-14 px-4 py-2.5 text-lg font-bold focus:outline-none rounded-lg btn-3d btn-3d-non-shockable',
            currentRhythm === 'asystole'
              ? 'bg-acls-non-shockable text-white hover:bg-acls-non-shockable/90 ring-2 ring-acls-non-shockable ring-offset-2 ring-offset-background'
              : 'bg-muted text-acls-non-shockable hover:bg-acls-non-shockable/20'
          )}
          role="radio"
          aria-checked={currentRhythm === 'asystole'}
          aria-label={t('rhythm.asystole')}
        >
          <FlatlineIcon className="h-6 w-6" />
          <div className="text-left">
            <div>{t('rhythm.asystole')}</div>
            <div className="text-xs font-normal opacity-80">{t('rhythm.nonShockable')}</div>
          </div>
        </button>

        <button
          onClick={() => onSelectRhythm('pea')}
          className={cn(
            'w-full flex items-center justify-start gap-3 h-14 px-4 py-2.5 text-lg font-bold focus:outline-none rounded-lg btn-3d btn-3d-pea',
            currentRhythm === 'pea'
              ? 'bg-acls-pea text-white hover:bg-acls-pea/90 ring-2 ring-acls-pea ring-offset-2 ring-offset-background'
              : 'bg-muted text-acls-pea hover:bg-acls-pea/20'
          )}
          role="radio"
          aria-checked={currentRhythm === 'pea'}
          aria-label={t('rhythm.pea')}
        >
          <Activity className="h-6 w-6" />
          <div className="text-left">
            <div>{t('rhythm.pea')}</div>
            <div className="text-xs font-normal opacity-80">{t('rhythm.nonShockable')}</div>
          </div>
        </button>
      </div>
    </div>
  );
}
