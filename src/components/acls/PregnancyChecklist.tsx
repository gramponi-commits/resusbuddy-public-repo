import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { PregnancyCauses, PregnancyInterventions } from '@/types/acls';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, AlertTriangle, Clock, Stethoscope, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Pregnant belly silhouette icon
function PregnantIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C10.34 2 9 3.34 9 5C9 6.66 10.34 8 12 8C13.66 8 15 6.66 15 5C15 3.34 13.66 2 12 2ZM15.5 9H8.5C7.67 9 7 9.67 7 10.5V11C7 11.55 7.45 12 8 12H8.5V14C8.5 15.38 9.22 16.59 10.27 17.3C9.03 18.08 8.5 19.54 8.5 21C8.5 21.55 8.95 22 9.5 22H14.5C15.05 22 15.5 21.55 15.5 21C15.5 19.54 14.97 18.08 13.73 17.3C14.78 16.59 15.5 15.38 15.5 14V12H16C16.55 12 17 11.55 17 11V10.5C17 9.67 16.33 9 15.5 9Z"/>
    </svg>
  );
}

// Detailed diagnostic and management information for each cause
const CAUSE_DETAILS: Record<keyof PregnancyCauses, { diagnosticKey: string; managementKey: string }> = {
  anestheticComplications: {
    diagnosticKey: 'pregnancy.anestheticDiagnostic',
    managementKey: 'pregnancy.anestheticManagement',
  },
  bleeding: {
    diagnosticKey: 'pregnancy.bleedingDiagnostic',
    managementKey: 'pregnancy.bleedingManagement',
  },
  cardiovascular: {
    diagnosticKey: 'pregnancy.cardiovascularDiagnostic',
    managementKey: 'pregnancy.cardiovascularManagement',
  },
  drugs: {
    diagnosticKey: 'pregnancy.drugsDiagnostic',
    managementKey: 'pregnancy.drugsManagement',
  },
  embolic: {
    diagnosticKey: 'pregnancy.embolicDiagnostic',
    managementKey: 'pregnancy.embolicManagement',
  },
  fever: {
    diagnosticKey: 'pregnancy.feverDiagnostic',
    managementKey: 'pregnancy.feverManagement',
  },
  generalCauses: {
    diagnosticKey: 'pregnancy.generalCausesDiagnostic',
    managementKey: 'pregnancy.generalCausesManagement',
  },
  hypertension: {
    diagnosticKey: 'pregnancy.hypertensionDiagnostic',
    managementKey: 'pregnancy.hypertensionManagement',
  },
};

interface CauseItemProps {
  causeKey: keyof PregnancyCauses;
  letter: string;
  labelKey: string;
  descKey: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function CauseItem({ causeKey, letter, labelKey, descKey, checked, onCheckedChange }: CauseItemProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const details = CAUSE_DETAILS[causeKey];

  return (
    <div className="border border-pink-400/30 rounded-lg overflow-hidden">
      <div className="flex items-start gap-3 p-2 hover:bg-muted/50 transition-colors">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="mt-1 border-pink-400 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-start gap-2 text-left min-w-0"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-pink-500/20 text-pink-400 text-xs font-bold mr-2">
                {letter}
              </span>
              {t(labelKey)}
            </div>
            <div className="text-xs text-muted-foreground ml-7">{t(descKey)}</div>
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-pink-400 transition-transform flex-shrink-0 mt-1',
              isExpanded && 'rotate-90'
            )}
          />
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 bg-pink-500/10 space-y-3 animate-in slide-in-from-top-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-semibold text-blue-600">{t('pregnancy.diagnosticEval')}</h4>
            </div>
            <p className="text-xs text-foreground leading-relaxed pl-6">{t(details.diagnosticKey)}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Wrench className="h-4 w-4 text-green-600" />
              <h4 className="text-xs font-semibold text-green-600">{t('pregnancy.management')}</h4>
            </div>
            <p className="text-xs text-foreground leading-relaxed pl-6">{t(details.managementKey)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface PregnancyChecklistProps {
  pregnancyActive: boolean;
  pregnancyCauses: PregnancyCauses;
  pregnancyInterventions: PregnancyInterventions;
  pregnancyStartTime: number | null;
  cprStartTime: number;
  onTogglePregnancy: (active: boolean) => void;
  onUpdateCauses: (updates: Partial<PregnancyCauses>) => void;
  onUpdateInterventions: (updates: Partial<PregnancyInterventions>) => void;
  onDeliveryAlert?: () => void;
}

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function PregnancyChecklist({
  pregnancyActive,
  pregnancyCauses,
  pregnancyInterventions,
  pregnancyStartTime,
  cprStartTime,
  onTogglePregnancy,
  onUpdateCauses,
  onUpdateInterventions,
  onDeliveryAlert,
}: PregnancyChecklistProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const alertFiredRef = useRef(false);

  // Calculate time since CPR started (not pregnancy activation)
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const fundusAtUmbilicus = pregnancyInterventions.fundusAtUmbilicus === true;
  const deliveryEligible = pregnancyActive && fundusAtUmbilicus;
  const deliveryDeadlineReached = deliveryEligible && timeElapsed >= FIVE_MINUTES_MS;
  // Calculate remaining time for countdown (5 minutes - elapsed time)
  const timeRemaining = Math.max(0, FIVE_MINUTES_MS - timeElapsed);

  useEffect(() => {
    if (!cprStartTime) {
      setTimeElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - cprStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [cprStartTime]);

  // Allow deadline alert to fire again if delivery eligibility is toggled off then on.
  useEffect(() => {
    if (!deliveryEligible) {
      alertFiredRef.current = false;
    }
  }, [deliveryEligible]);

  // Fire delivery alert callback once when 5 min deadline is reached.
  useEffect(() => {
    if (deliveryDeadlineReached && !alertFiredRef.current && onDeliveryAlert) {
      alertFiredRef.current = true;
      onDeliveryAlert();
    }
  }, [deliveryDeadlineReached, onDeliveryAlert]);

  const handleTogglePregnancy = (checked: boolean) => {
    // Once activated, cannot be deactivated
    if (pregnancyActive) return;
    onTogglePregnancy(checked);
    if (checked) {
      setIsOpen(true);
    }
  };

  const formatTime = (ms: number) => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const CAUSES_ITEMS: { key: keyof PregnancyCauses; letter: string; labelKey: string; descKey: string }[] = [
    { key: 'anestheticComplications', letter: 'A', labelKey: 'pregnancy.anesthetic', descKey: 'pregnancy.anestheticDesc' },
    { key: 'bleeding', letter: 'B', labelKey: 'pregnancy.bleeding', descKey: 'pregnancy.bleedingDesc' },
    { key: 'cardiovascular', letter: 'C', labelKey: 'pregnancy.cardiovascular', descKey: 'pregnancy.cardiovascularDesc' },
    { key: 'drugs', letter: 'D', labelKey: 'pregnancy.drugs', descKey: 'pregnancy.drugsDesc' },
    { key: 'embolic', letter: 'E', labelKey: 'pregnancy.embolic', descKey: 'pregnancy.embolicDesc' },
    { key: 'fever', letter: 'F', labelKey: 'pregnancy.fever', descKey: 'pregnancy.feverDesc' },
    { key: 'generalCauses', letter: 'G', labelKey: 'pregnancy.generalCauses', descKey: 'pregnancy.generalCausesDesc' },
    { key: 'hypertension', letter: 'H', labelKey: 'pregnancy.hypertension', descKey: 'pregnancy.hypertensionDesc' },
  ];

  const INTERVENTIONS_ITEMS: { key: keyof PregnancyInterventions; labelKey: string; descKey: string }[] = [
    { key: 'leftUterineDisplacement', labelKey: 'pregnancy.leftUterine', descKey: 'pregnancy.leftUterineDesc' },
    { key: 'earlyAirway', labelKey: 'pregnancy.earlyAirway', descKey: 'pregnancy.earlyAirwayDesc' },
    { key: 'ivAboveDiaphragm', labelKey: 'pregnancy.ivAbove', descKey: 'pregnancy.ivAboveDesc' },
    { key: 'stopMagnesiumGiveCalcium', labelKey: 'pregnancy.stopMagnesium', descKey: 'pregnancy.stopMagnesiumDesc' },
    { key: 'detachFetalMonitors', labelKey: 'pregnancy.detachFetal', descKey: 'pregnancy.detachFetalDesc' },
    { key: 'massiveTransfusion', labelKey: 'pregnancy.massiveTransfusion', descKey: 'pregnancy.massiveTransfusionDesc' },
  ];

  const checkedCausesCount = Object.values(pregnancyCauses).filter(Boolean).length;
  const checkedInterventionsCount = Object.values(pregnancyInterventions).filter(Boolean).length;
  const totalChecked = checkedCausesCount + checkedInterventionsCount;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          'flex items-center justify-between px-3 py-2 rounded-lg border-2 transition-all',
          pregnancyActive
            ? 'bg-gray-200/60 dark:bg-gray-700/40 border-gray-400 dark:border-gray-500'
            : 'bg-gray-100/50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600 hover:bg-gray-200/50 dark:hover:bg-gray-700/30'
        )}>
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-fuchsia-500/15 flex items-center justify-center shrink-0 self-center">
              <PregnantIcon className="h-5 w-5 text-fuchsia-500" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">{t('pregnancy.title')}</div>
              <div className="text-sm text-muted-foreground">
                {pregnancyActive 
                  ? (totalChecked > 0 
                      ? t('pregnancy.itemsChecked', { count: totalChecked }) 
                      : t('pregnancy.activeReview'))
                  : t('pregnancy.tapToActivate')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pregnancyActive && deliveryDeadlineReached && (
              <Badge variant="destructive" className="animate-pulse gap-1">
                <AlertTriangle className="h-3 w-3" />
                {t('pregnancy.deliveryAlert')}
              </Badge>
            )}
            <ChevronDown className={cn(
              'h-5 w-5 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )} />
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-3 space-y-4 p-4 bg-card rounded-lg border border-pink-400/30">
          {/* Pregnancy Toggle */}
          <label className={cn(
            "flex items-center gap-3 p-3 rounded-lg bg-pink-500/10 border border-pink-400/30",
            pregnancyActive ? "cursor-default" : "cursor-pointer"
          )}>
            <Checkbox
              checked={pregnancyActive}
              onCheckedChange={handleTogglePregnancy}
              disabled={pregnancyActive}
              className="border-pink-400 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-pink-400">
                {pregnancyActive ? t('pregnancy.protocolActive') : t('pregnancy.activatePregnancy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('pregnancy.activateDesc')}
              </div>
            </div>
          </label>

          {/* Delivery eligibility checkpoint */}
          {pregnancyActive && (
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-pink-500/10 border border-pink-400/30 hover:bg-pink-500/15 transition-colors">
              <Checkbox
                checked={fundusAtUmbilicus}
                onCheckedChange={(checked) => onUpdateInterventions({ fundusAtUmbilicus: checked === true })}
                className="mt-0.5 border-pink-400 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{t('pregnancy.fundusAtUmbilicus')}</div>
                <div className="text-xs text-muted-foreground">{t('pregnancy.fundusAtUmbilicusDesc')}</div>
              </div>
            </label>
          )}

          {/* Pre-5 minute delivery preparation guidance */}
          {deliveryEligible && !deliveryDeadlineReached && (
            <div className="bg-amber-500/15 border border-amber-500 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-500 font-semibold">
                  <AlertTriangle className="h-5 w-5" />
                  {t('pregnancy.deliveryPrepNow')}
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                  <Clock className="h-3 w-3" />
                  {formatTime(timeRemaining)}
                </div>
              </div>
              <p className="text-xs text-amber-500/90 mt-1">
                {t('pregnancy.deliveryPrepDesc')}
              </p>
            </div>
          )}

          {/* 5-minute Delivery Alert */}
          {deliveryDeadlineReached && (
            <div className="bg-destructive/20 border-2 border-destructive rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-2 text-destructive font-bold text-lg">
                <AlertTriangle className="h-6 w-6" />
                {t('pregnancy.emergencyDelivery')}
              </div>
              <p className="text-sm text-destructive/80 mt-1">
                {t('pregnancy.emergencyDeliveryDesc')}
              </p>
            </div>
          )}

          {pregnancyActive && (
            <>
              {/* Key Interventions */}
              <div>
                <h3 className="text-sm font-bold text-pink-400 mb-3">{t('pregnancy.interventionsTitle')}</h3>
                <div className="space-y-2">
                  {INTERVENTIONS_ITEMS.map((item) => (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 cursor-pointer p-2 rounded hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={pregnancyInterventions[item.key]}
                        onCheckedChange={(checked) => onUpdateInterventions({ [item.key]: checked })}
                        className="mt-0.5 border-pink-400 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground">{t(item.labelKey)}</div>
                        <div className="text-xs text-muted-foreground">{t(item.descKey)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Causes (A-H) */}
              <div>
                <h3 className="text-sm font-bold text-pink-400 mb-3">{t('pregnancy.causesTitle')}</h3>
                <div className="space-y-2">
                  {CAUSES_ITEMS.map((item) => (
                    <CauseItem
                      key={item.key}
                      causeKey={item.key}
                      letter={item.letter}
                      labelKey={item.labelKey}
                      descKey={item.descKey}
                      checked={pregnancyCauses[item.key]}
                      onCheckedChange={(checked) => onUpdateCauses({ [item.key]: checked })}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
