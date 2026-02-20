import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Check, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EcmoIcon } from '@/components/icons/ClinicalIcons';

interface ECMOPanelProps {
  ecmoEnabled: boolean;
  activationTimeMinutes: number;
  totalElapsed: number;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  onActivateECMO: () => void;
  onECMOAvailable?: () => void;
}

function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function ECMOPanel({
  ecmoEnabled,
  activationTimeMinutes,
  totalElapsed,
  inclusionCriteria,
  exclusionCriteria,
  onActivateECMO,
  onECMOAvailable,
}: ECMOPanelProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activated, setActivated] = useState(false);
  const alertFiredRef = useRef(false);

  if (!ecmoEnabled) return null;

  const activationThresholdMs = activationTimeMinutes * 60 * 1000;
  const canActivate = totalElapsed >= activationThresholdMs;
  const remainingMs = activationThresholdMs - totalElapsed;
  const ecmoAlertActive = canActivate && !activated;

  // Fire ECMO available alert callback once when threshold reached
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (ecmoAlertActive && !alertFiredRef.current && onECMOAvailable) {
      alertFiredRef.current = true;
      onECMOAvailable();
    }
  }, [ecmoAlertActive, onECMOAvailable]);

  const handleActivate = () => {
    setActivated(true);
    onActivateECMO();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          'flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all',
          activated
            ? 'bg-green-100/50 dark:bg-green-900/30 border-green-400 dark:border-green-600'
            : 'bg-gray-100/50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600 hover:bg-gray-200/50 dark:hover:bg-gray-700/30'
          )}>
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 self-center">
              <EcmoIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">{t('ecmo.title')}</div>
              <div className="text-sm text-muted-foreground">
                {activated
                  ? t('ecmo.active')
                  : canActivate
                    ? t('ecmo.activateButton')
                    : t('ecmo.availableIn', { time: formatCountdown(remainingMs) })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ecmoAlertActive && (
              <Badge variant="destructive" className="animate-pulse gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t('ecmo.availableNow')}
              </Badge>
            )}
            <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-4 p-4 bg-card rounded-lg border border-border">
          {/* ECMO Available Alert */}
          {ecmoAlertActive && (
            <div className="bg-destructive/20 border-2 border-destructive rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-2 text-destructive font-bold text-lg">
                <AlertTriangle className="h-6 w-6" />
                {t('ecmo.availableNow')}
              </div>
              <p className="text-sm text-destructive/80 mt-1">
                {t('ecmo.availableNowDesc')}
              </p>
            </div>
          )}

          {/* Activate Button */}
          {!activated ? (
            <Button
              onClick={(e) => { e.stopPropagation(); handleActivate(); }}
              disabled={!canActivate}
              className={cn(
                'w-full',
                canActivate
                  ? 'bg-acls-critical hover:bg-acls-critical/90 text-white'
                  : ''
              )}
              size="lg"
            >
              {canActivate ? (
                <>
                  <EcmoIcon className="h-5 w-5 mr-2" />
                  {t('ecmo.activateButton')}
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  {t('ecmo.availableIn', { time: formatCountdown(remainingMs) })}
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
              <Check className="h-5 w-5" />
              <span className="font-semibold">{t('ecmo.active')}</span>
            </div>
          )}

          {/* Inclusion Criteria */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">{t('ecmo.inclusionCriteria')}</div>
            {inclusionCriteria.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {inclusionCriteria.map((item, index) => (
                  <Badge key={index} variant="secondary">{item}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('ecmo.noneConfigured')}</p>
            )}
          </div>

          {/* Exclusion Criteria */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">{t('ecmo.exclusionCriteria')}</div>
            {exclusionCriteria.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {exclusionCriteria.map((item, index) => (
                  <Badge key={index} variant="destructive">{item}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('ecmo.noneConfigured')}</p>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
