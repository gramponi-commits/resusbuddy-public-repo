import { memo } from 'react';
import { useTranslation } from 'react-i18next';

interface FooterStatsBarProps {
  epinephrineCount: number;
  amiodaroneCount: number;
  lidocaineCount: number;
  shockCount: number;
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
}) => {
  const { t } = useTranslation();

  return (
    <div className="surface-1 border-t border-moderate p-2 sm:p-3 pb-safe">
      <div className="flex justify-around text-center text-clinical-xs sm:text-clinical-sm max-w-lg mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="text-muted-foreground">{t('codeEnded.epi')}</span>
          <span className="font-bold text-foreground text-clinical-sm sm:text-clinical-base">
            {epinephrineCount}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="text-muted-foreground">{t('codeEnded.amio')}</span>
          <span className="font-bold text-foreground text-clinical-sm sm:text-clinical-base">
            {amiodaroneCount}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="text-muted-foreground">{t('codeEnded.lido')}</span>
          <span className="font-bold text-foreground text-clinical-sm sm:text-clinical-base">
            {lidocaineCount}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
          <span className="text-muted-foreground">{t('codeEnded.shocks')}</span>
          <span className="font-bold text-foreground text-clinical-sm sm:text-clinical-base">
            {shockCount}
          </span>
        </div>
      </div>
    </div>
  );
});

FooterStatsBar.displayName = 'FooterStatsBar';
