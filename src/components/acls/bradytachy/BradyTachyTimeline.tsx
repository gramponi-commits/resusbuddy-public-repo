import { useTranslation } from 'react-i18next';
import { BradyTachyIntervention } from '@/types/acls';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Clock, Zap, Syringe, Pill, Activity, Wind, FileText, Heart, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BradyTachyTimelineProps {
  interventions: BradyTachyIntervention[];
  startTime: number;
}

function formatTimestamp(timestamp: number, startTime: number): string {
  const elapsed = Math.floor((timestamp - startTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getInterventionIcon(type: BradyTachyIntervention['type']) {
  switch (type) {
    case 'cardioversion':
      return <Zap className="h-4 w-4 text-acls-shockable" />;
    case 'atropine':
    case 'adenosine':
      return <Syringe className="h-4 w-4 text-acls-medication" />;
    case 'dopamine':
    case 'epi_infusion':
      return <Syringe className="h-4 w-4 text-acls-info" />;
    case 'beta_blocker':
    case 'calcium_blocker':
    case 'procainamide':
    case 'amiodarone':
      return <Pill className="h-4 w-4 text-acls-medication" />;
    case 'vagal_maneuver':
      return <Wind className="h-4 w-4 text-acls-info" />;
    case 'assessment':
      return <Activity className="h-4 w-4 text-acls-warning" />;
    case 'decision':
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    case 'switch_to_arrest':
      return <Heart className="h-4 w-4 text-destructive" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

export function BradyTachyTimeline({ interventions, startTime }: BradyTachyTimelineProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false); // Collapsed by default
  const sortedInterventions = [...interventions].sort((a, b) => b.timestamp - a.timestamp);

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
                      {formatTimestamp(intervention.timestamp, startTime)}
                    </div>
                    <div className="pt-0.5">
                      {getInterventionIcon(intervention.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{displayText}</p>
                      {intervention.calculatedDose && (
                        <p className="text-xs text-muted-foreground mt-0.5">{intervention.calculatedDose}</p>
                      )}
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
