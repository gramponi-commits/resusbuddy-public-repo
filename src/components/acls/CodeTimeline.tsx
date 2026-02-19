import { useTranslation } from 'react-i18next';
import { Intervention } from '@/types/acls';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Clock, Zap, Syringe, Pill, Heart, Activity, Wind, FileText, Gauge, Droplets, HandHeart } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CodeTimelineProps {
  interventions: Intervention[];
  startTime: number;
  bradyTachyStartTime?: number | null;
}

// Helper function to determine the reference time for elapsed time calculations
function getReferenceTime(interventions: Intervention[], startTime: number, bradyTachyStartTime?: number | null): number {
  // If bradyTachyStartTime is explicitly set and earlier than startTime, use it
  if (bradyTachyStartTime && bradyTachyStartTime < startTime) {
    return bradyTachyStartTime;
  }

  // Otherwise, auto-detect by finding the earliest intervention timestamp
  // This handles old sessions that don't have bradyTachyStartTime set
  if (interventions.length > 0) {
    const earliestTimestamp = Math.min(...interventions.map(i => i.timestamp));

    // If the earliest intervention is before startTime, use it as reference
    // This indicates a BradyTachy-to-arrest transition in an old session
    if (earliestTimestamp < startTime) {
      return earliestTimestamp;
    }
  }

  // Default to startTime
  return startTime;
}

function formatTimestamp(timestamp: number, referenceTime: number): string {
  const elapsed = Math.floor((timestamp - referenceTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getInterventionIcon(type: Intervention['type']) {
  switch (type) {
    case 'shock':
      return <Zap className="h-4 w-4 text-acls-shockable" />;
    case 'cardioversion':
      return <Zap className="h-4 w-4 text-acls-tachycardia" />;
    case 'epinephrine':
      return <Syringe className="h-4 w-4 text-acls-medication" />;
    case 'atropine':
      return <Syringe className="h-4 w-4 text-acls-bradycardia" />;
    case 'adenosine':
      return <Syringe className="h-4 w-4 text-acls-tachycardia" />;
    case 'amiodarone':
    case 'lidocaine':
      return <Pill className="h-4 w-4 text-acls-medication" />;
    case 'beta_blocker':
    case 'calcium_blocker':
    case 'procainamide':
      return <Pill className="h-4 w-4 text-acls-tachycardia" />;
    case 'dopamine':
    case 'epi_infusion':
      return <Droplets className="h-4 w-4 text-acls-bradycardia" />;
    case 'vagal_maneuver':
      return <HandHeart className="h-4 w-4 text-acls-tachycardia" />;
    case 'rosc':
      return <Heart className="h-4 w-4 text-acls-success" />;
    case 'rhythm_change':
      return <Activity className="h-4 w-4 text-acls-warning" />;
    case 'airway':
      return <Wind className="h-4 w-4 text-acls-info" />;
    case 'cpr_start':
      return <Clock className="h-4 w-4 text-foreground" />;
    case 'etco2':
      return <Gauge className="h-4 w-4 text-acls-info" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

export function CodeTimeline({ interventions, startTime, bradyTachyStartTime }: CodeTimelineProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const sortedInterventions = [...interventions].sort((a, b) => b.timestamp - a.timestamp);

  // Calculate reference time once for all interventions
  const referenceTime = getReferenceTime(interventions, startTime, bradyTachyStartTime);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-foreground">{t('timeline.title')}</span>
            <span className="text-sm text-muted-foreground">({interventions.length} {t('timeline.events')})</span>
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ScrollArea className="h-48 mt-2 rounded-lg border border-border bg-card">
          <div className="p-3 space-y-2">
            {sortedInterventions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('timeline.noInterventions')}
              </p>
            ) : (
              sortedInterventions.map((intervention) => {
                const displayText = intervention.translationKey
                  ? t(intervention.translationKey, intervention.translationParams || {})
                  : intervention.details;

                return (
                  <div
                    key={intervention.id}
                    className="flex items-start gap-3 p-2 rounded bg-muted/30"
                  >
                    <div className="font-mono text-xs text-muted-foreground whitespace-nowrap pt-0.5">
                      {formatTimestamp(intervention.timestamp, referenceTime)}
                    </div>
                    <div className="pt-0.5">
                      {getInterventionIcon(intervention.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{displayText}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  );
}
