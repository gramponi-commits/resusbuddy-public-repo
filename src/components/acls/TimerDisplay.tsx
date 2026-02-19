import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Clock, Syringe, Timer, Activity } from 'lucide-react';

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface CycleTimersProps {
  cprCycleRemaining: number;
  epiRemaining: number;
  preShockAlert: boolean;
  rhythmCheckDue: boolean;
}

export function CycleTimers({ 
  cprCycleRemaining, 
  epiRemaining, 
  preShockAlert, 
  rhythmCheckDue,
  showEpiTimer = true 
}: CycleTimersProps & { showEpiTimer?: boolean }) {
  const { t } = useTranslation();
  const epiDue = epiRemaining === 0;

  return (
    <div className={cn('grid gap-3', showEpiTimer ? 'grid-cols-2' : 'grid-cols-1')}>
      {/* CPR Cycle Timer */}
      <div
        className={cn(
          'rounded-lg p-4 text-center border-2 transition-all',
          rhythmCheckDue
            ? 'bg-acls-critical/20 border-acls-critical animate-pulse'
            : preShockAlert
            ? 'bg-acls-warning/20 border-acls-warning animate-pulse'
            : 'bg-card border-border'
        )}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Timer className="h-4 w-4" />
          <span className="text-sm font-medium text-muted-foreground">
            {t('timers.rhythmCheck')}
          </span>
        </div>
        <div className={cn(
          'text-3xl font-mono font-bold',
          rhythmCheckDue ? 'text-acls-critical' : preShockAlert ? 'text-acls-warning' : 'text-foreground'
        )}>
          {rhythmCheckDue ? t('timers.now') : formatTime(cprCycleRemaining)}
        </div>
        {preShockAlert && !rhythmCheckDue && (
          <div className="text-xs text-acls-warning font-bold mt-1 animate-pulse">
            ⚡ {t('timers.preCharge')}
          </div>
        )}
        {rhythmCheckDue && (
          <div className="text-xs text-acls-critical font-bold mt-1">
            {t('timers.tapRhythmCheck')}
          </div>
        )}
      </div>

      {/* Epinephrine Timer - only shown after first dose */}
      {showEpiTimer && (
        <div
          className={cn(
            'rounded-lg p-4 text-center border-2 transition-all',
            epiDue
              ? 'bg-acls-critical/20 border-acls-critical animate-pulse'
              : 'bg-card border-border'
          )}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <Syringe className="h-4 w-4" />
            <span className="text-sm font-medium text-muted-foreground">{t('timers.epiDueIn')}</span>
          </div>
          <div className={cn(
            'text-3xl font-mono font-bold',
            epiDue ? 'text-acls-critical' : 'text-foreground'
          )}>
            {epiDue ? t('timers.now') : formatTime(epiRemaining)}
          </div>
          {epiDue && (
            <div className="text-xs text-acls-critical font-bold mt-1">
              {t('timers.giveEpi')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CodeTimersProps {
  totalElapsed: number;
  totalCPRTime: number;
}

export function CodeTimers({ totalElapsed, totalCPRTime }: CodeTimersProps) {
  const { t } = useTranslation();
  const cprFraction = totalElapsed > 0 ? ((totalCPRTime / totalElapsed) * 100).toFixed(0) : '100';

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Total Code Time */}
      <div className="rounded-lg p-2 text-center bg-card border border-border">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('timers.total')}</span>
        </div>
        <div className="text-lg font-mono font-semibold text-foreground">
          {formatDuration(totalElapsed)}
        </div>
      </div>

      {/* CPR Time */}
      <div className="rounded-lg p-2 text-center bg-card border border-border">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Activity className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('timers.cpr')}</span>
        </div>
        <div className="text-lg font-mono font-semibold text-foreground">
          {formatDuration(totalCPRTime)}
        </div>
      </div>

      {/* CPR Fraction */}
      <div className={cn(
        'rounded-lg p-2 text-center border',
        parseInt(cprFraction, 10) >= 80
          ? 'bg-acls-success/10 border-acls-success'
          : parseInt(cprFraction, 10) >= 60
          ? 'bg-acls-warning/10 border-acls-warning'
          : 'bg-acls-critical/10 border-acls-critical'
      )}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="text-xs text-muted-foreground">{t('timers.cpr')}%</span>
        </div>
        <div className={cn(
          'text-lg font-mono font-bold',
          parseInt(cprFraction, 10) >= 80
            ? 'text-acls-success'
            : parseInt(cprFraction, 10) >= 60
            ? 'text-acls-warning'
            : 'text-acls-critical'
        )}>
          {cprFraction}%
        </div>
      </div>
    </div>
  );
}
