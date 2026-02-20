import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { RhythmType } from '@/types/acls';

interface FooterStatsBarProps {
  epinephrineCount: number;
  amiodaroneCount: number;
  lidocaineCount: number;
  shockCount: number;
  preferLidocaine: boolean;
  initialRhythm: Exclude<RhythmType, null> | null;
}

/**
 * Footer Stats Bar - Shows medication and shock counts
 * Displayed during active code, CPR pending, and post-ROSC
 * Memoized to prevent unnecessary re-renders
 */
export const FooterStatsBar = memo<FooterStatsBarProps>(({
  epinephrineCount,
  amiodaroneCount,
  lidocaineCount,
  shockCount,
  preferLidocaine,
  initialRhythm,
}) => {
  const { t } = useTranslation();
  const antiarrhythmicLabel = preferLidocaine ? t('codeEnded.lido') : t('codeEnded.amio');
  const antiarrhythmicCount = preferLidocaine ? lidocaineCount : amiodaroneCount;
  const initialRhythmLabel = initialRhythm === 'vf_pvt'
    ? t('rhythm.vfPvt')
    : initialRhythm === 'asystole'
      ? t('rhythm.asystole')
      : initialRhythm === 'pea'
        ? t('rhythm.pea')
        : '-';

  return (
    <div className="surface-1 border-t border-moderate p-1.5 sm:p-2 pb-safe">
      <div className="flex justify-around text-center text-clinical-xs sm:text-clinical-sm max-w-lg mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="text-muted-foreground">{t('codeEnded.epi')}</span>
          <span className="font-bold text-foreground text-clinical-sm sm:text-clinical-base">
            {epinephrineCount}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="text-muted-foreground">{antiarrhythmicLabel}</span>
          <span className="font-bold text-foreground text-clinical-sm sm:text-clinical-base">
            {antiarrhythmicCount}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="text-muted-foreground">{t('codeEnded.shocks')}</span>
          <span className="font-bold text-foreground text-clinical-sm sm:text-clinical-base">
            {shockCount}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="text-muted-foreground">{t('pdf.initialRhythm')}</span>
          <span className="font-bold text-foreground text-clinical-sm sm:text-clinical-base">
            {initialRhythmLabel}
          </span>
        </div>
      </div>
    </div>
  );
});

FooterStatsBar.displayName = 'FooterStatsBar';
