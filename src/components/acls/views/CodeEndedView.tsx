import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { XCircle, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeTimeline } from '../CodeTimeline';
import type { Intervention } from '@/types/acls';

interface CodeEndedViewProps {
  interventions: Intervention[];
  startTime: number | null;
  bradyTachyStartTime?: number | null;
  endTime: number | null;
  totalElapsed: number;
  totalCPRTime: number;
  shockCount: number;
  epinephrineCount: number;
  amiodaroneCount: number;
  onExport: () => void;
  onNewCode: () => void;
}

/**
 * Code Ended View - Shows when code is terminated
 * Displays summary statistics and timeline
 */
export const CodeEndedView = memo<CodeEndedViewProps>(({
  interventions,
  startTime,
  bradyTachyStartTime,
  endTime,
  totalElapsed,
  totalCPRTime,
  shockCount,
  epinephrineCount,
  amiodaroneCount,
  onExport,
  onNewCode,
}) => {
  const { t } = useTranslation();

  const formatDuration = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="text-center py-6">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-destructive/20 mb-4">
          <XCircle className="h-8 w-8 sm:h-10 sm:w-10 text-destructive" />
        </div>
        <h2 className="text-clinical-2xl font-bold text-foreground">
          {t('codeEnded.title')}
        </h2>
        <p className="text-clinical-sm text-muted-foreground mt-2">
          {t('codeEnded.deathDeclared')} {new Date(endTime || Date.now()).toLocaleTimeString()}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="surface-2 rounded-lg p-4 border border-moderate">
        <h3 className="font-bold text-clinical-base text-foreground mb-3">
          {t('codeEnded.summary')}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-clinical-xs sm:text-clinical-sm">
          <div>
            <span className="text-muted-foreground">{t('codeEnded.duration')}:</span>
            <span className="ml-2 font-semibold">{formatDuration(totalElapsed)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('codeEnded.cprTime')}:</span>
            <span className="ml-2 font-semibold">{formatDuration(totalCPRTime)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('codeEnded.cprFraction')}:</span>
            <span className="ml-2 font-semibold">
              {totalElapsed > 0
                ? ((totalCPRTime / totalElapsed) * 100).toFixed(1) + '%'
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('codeEnded.shocks')}:</span>
            <span className="ml-2 font-semibold">{shockCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('actions.epinephrine')}:</span>
            <span className="ml-2 font-semibold">
              {epinephrineCount} {t('codeEnded.doses')}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t('actions.amiodarone')}:</span>
            <span className="ml-2 font-semibold">
              {amiodaroneCount} {t('codeEnded.doses')}
            </span>
          </div>
        </div>
      </div>

      <CodeTimeline interventions={interventions} startTime={startTime} bradyTachyStartTime={bradyTachyStartTime} />

      {/* Actions */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Button
            onClick={onExport}
            variant="outline"
            className="h-10 sm:h-12 gap-1 sm:gap-2 touch-target btn-3d-sm btn-3d-muted"
            aria-label={t('actions.save')}
          >
            <Save className="h-3 w-3 sm:h-4 sm:w-4" />
            {t('actions.save')}
          </Button>
          <Button
            onClick={onNewCode}
            variant="outline"
            className="h-10 sm:h-12 gap-1 sm:gap-2 touch-target btn-3d-sm btn-3d-muted"
            aria-label={t('actions.newCode')}
          >
            <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            {t('actions.newCode')}
          </Button>
        </div>
      </div>
    </>
  );
});

CodeEndedView.displayName = 'CodeEndedView';
