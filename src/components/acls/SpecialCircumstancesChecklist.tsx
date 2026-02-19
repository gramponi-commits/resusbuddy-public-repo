import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { SpecialCircumstances } from '@/types/acls';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, AlertCircle, Stethoscope, Wrench } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SpecialCircumstancesChecklistProps {
  specialCircumstances: SpecialCircumstances;
  onToggleCondition: (key: keyof SpecialCircumstances, active: boolean) => void;
}

interface SpecialCircumstanceItemProps {
  conditionKey: keyof SpecialCircumstances;
  titleKey: string;
  descKey: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  diagnosticKey: string;
  managementKey: string;
}

function SpecialCircumstanceItem({
  conditionKey,
  titleKey,
  descKey,
  checked,
  onCheckedChange,
  diagnosticKey,
  managementKey,
}: SpecialCircumstanceItemProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-start gap-3 p-2 hover:bg-muted/50 transition-colors">
        <Checkbox checked={checked} onCheckedChange={onCheckedChange} className="mt-1" onClick={(e) => e.stopPropagation()} />
        <button onClick={() => setIsExpanded(!isExpanded)} className="flex-1 flex items-start gap-2 text-left min-w-0">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground">{t(titleKey)}</div>
            <div className="text-xs text-muted-foreground">{t(descKey)}</div>
          </div>
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 mt-1', isExpanded && 'rotate-90')} />
        </button>
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 bg-muted/30 space-y-3 animate-in slide-in-from-top-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-semibold text-blue-600">{t('specialCircumstances.diagnosticEval')}</h4>
            </div>
            <p className="text-xs text-foreground leading-relaxed pl-6">{t(diagnosticKey)}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Wrench className="h-4 w-4 text-green-600" />
              <h4 className="text-xs font-semibold text-green-600">{t('specialCircumstances.management')}</h4>
            </div>
            <p className="text-xs text-foreground leading-relaxed pl-6">{t(managementKey)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SpecialCircumstancesChecklist({
  specialCircumstances,
  onToggleCondition,
}: SpecialCircumstancesChecklistProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const checkedCount = Object.values(specialCircumstances).filter(Boolean).length;

  const CONDITION_ITEMS = [
    {
      key: 'anaphylaxis' as keyof SpecialCircumstances,
      titleKey: 'specialCircumstances.anaphylaxis.title',
      descKey: 'specialCircumstances.anaphylaxis.desc',
      diagnosticKey: 'specialCircumstances.anaphylaxis.diagnostic',
      managementKey: 'specialCircumstances.anaphylaxis.management',
    },
    {
      key: 'asthma' as keyof SpecialCircumstances,
      titleKey: 'specialCircumstances.asthma.title',
      descKey: 'specialCircumstances.asthma.desc',
      diagnosticKey: 'specialCircumstances.asthma.diagnostic',
      managementKey: 'specialCircumstances.asthma.management',
    },
    {
      key: 'hyperthermia' as keyof SpecialCircumstances,
      titleKey: 'specialCircumstances.hyperthermia.title',
      descKey: 'specialCircumstances.hyperthermia.desc',
      diagnosticKey: 'specialCircumstances.hyperthermia.diagnostic',
      managementKey: 'specialCircumstances.hyperthermia.management',
    },
    {
      key: 'opioidOverdose' as keyof SpecialCircumstances,
      titleKey: 'specialCircumstances.opioidOverdose.title',
      descKey: 'specialCircumstances.opioidOverdose.desc',
      diagnosticKey: 'specialCircumstances.opioidOverdose.diagnostic',
      managementKey: 'specialCircumstances.opioidOverdose.management',
    },
    {
      key: 'drowning' as keyof SpecialCircumstances,
      titleKey: 'specialCircumstances.drowning.title',
      descKey: 'specialCircumstances.drowning.desc',
      diagnosticKey: 'specialCircumstances.drowning.diagnostic',
      managementKey: 'specialCircumstances.drowning.management',
    },
    {
      key: 'electrocution' as keyof SpecialCircumstances,
      titleKey: 'specialCircumstances.electrocution.title',
      descKey: 'specialCircumstances.electrocution.desc',
      diagnosticKey: 'specialCircumstances.electrocution.diagnostic',
      managementKey: 'specialCircumstances.electrocution.management',
    },
    {
      key: 'lvadFailure' as keyof SpecialCircumstances,
      titleKey: 'specialCircumstances.lvadFailure.title',
      descKey: 'specialCircumstances.lvadFailure.desc',
      diagnosticKey: 'specialCircumstances.lvadFailure.diagnostic',
      managementKey: 'specialCircumstances.lvadFailure.management',
    },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn('flex items-center justify-between p-4 rounded-lg border-2 transition-all', 'bg-gray-100/50 dark:bg-gray-800/30 border-gray-300 dark:border-gray-600 hover:bg-gray-200/50 dark:hover:bg-gray-700/30')}>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-gray-500" />
            <div className="text-left">
              <div className="font-semibold text-foreground">{t('specialCircumstances.title')}</div>
              <div className="text-sm text-muted-foreground">{checkedCount > 0 ? t('specialCircumstances.activeCount', { count: checkedCount }) : t('specialCircumstances.tapToReview')}</div>
            </div>
          </div>
          <ChevronDown className={cn('h-5 w-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-2 p-4 bg-card rounded-lg border border-border">
          {CONDITION_ITEMS.map((item) => (
            <SpecialCircumstanceItem 
              key={item.key} 
              conditionKey={item.key} 
              titleKey={item.titleKey} 
              descKey={item.descKey} 
              checked={specialCircumstances[item.key]} 
              onCheckedChange={(checked) => onToggleCondition(item.key, checked)} 
              diagnosticKey={item.diagnosticKey} 
              managementKey={item.managementKey} 
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
