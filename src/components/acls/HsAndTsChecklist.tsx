import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { HsAndTs } from '@/types/acls';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, AlertTriangle, Stethoscope, Wrench } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HsAndTsChecklistProps {
  hsAndTs: HsAndTs;
  onUpdate: (updates: Partial<HsAndTs>) => void;
}

// Detailed diagnostic and management information for each cause
const CAUSE_DETAILS: Record<keyof HsAndTs, { diagnosticKey: string; managementKey: string }> = {
  hypovolemia: {
    diagnosticKey: 'hsTs.hypovolemiaDiagnostic',
    managementKey: 'hsTs.hypovolemiaManagement',
  },
  hypoxia: {
    diagnosticKey: 'hsTs.hypoxiaDiagnostic',
    managementKey: 'hsTs.hypoxiaManagement',
  },
  hydrogenIon: {
    diagnosticKey: 'hsTs.hydrogenIonDiagnostic',
    managementKey: 'hsTs.hydrogenIonManagement',
  },
  hypoHyperkalemia: {
    diagnosticKey: 'hsTs.hypoHyperkalemiaDiagnostic',
    managementKey: 'hsTs.hypoHyperkalemiaManagement',
  },
  hypothermia: {
    diagnosticKey: 'hsTs.hypothermiaDiagnostic',
    managementKey: 'hsTs.hypothermiaManagement',
  },
  tensionPneumothorax: {
    diagnosticKey: 'hsTs.tensionPneumoDiagnostic',
    managementKey: 'hsTs.tensionPneumoManagement',
  },
  tamponade: {
    diagnosticKey: 'hsTs.tamponadeDiagnostic',
    managementKey: 'hsTs.tamponadeManagement',
  },
  toxins: {
    diagnosticKey: 'hsTs.toxinsDiagnostic',
    managementKey: 'hsTs.toxinsManagement',
  },
  thrombosisPulmonary: {
    diagnosticKey: 'hsTs.thrombosisPulmDiagnostic',
    managementKey: 'hsTs.thrombosisPulmManagement',
  },
  thrombosisCoronary: {
    diagnosticKey: 'hsTs.thrombosisCoroDiagnostic',
    managementKey: 'hsTs.thrombosisCoroManagement',
  },
};

interface CauseItemProps {
  causeKey: keyof HsAndTs;
  labelKey: string;
  descKey: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function CauseItem({ causeKey, labelKey, descKey, checked, onCheckedChange }: CauseItemProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const details = CAUSE_DETAILS[causeKey];

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-start gap-3 p-2 hover:bg-muted/50 transition-colors">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="mt-1"
          onClick={(e) => e.stopPropagation()}
        />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-start gap-2 text-left min-w-0"
        >
          <div className="flex-1 min-w-0">
            <div className="font-medium text-foreground">{t(labelKey)}</div>
            <div className="text-xs text-muted-foreground">{t(descKey)}</div>
          </div>
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 mt-1',
              isExpanded && 'rotate-90'
            )}
          />
        </button>
      </div>
      
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 bg-muted/30 space-y-3 animate-in slide-in-from-top-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Stethoscope className="h-4 w-4 text-blue-600" />
              <h4 className="text-xs font-semibold text-blue-600">{t('hsTs.diagnosticEval')}</h4>
            </div>
            <p className="text-xs text-foreground leading-relaxed pl-6">{t(details.diagnosticKey)}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Wrench className="h-4 w-4 text-green-600" />
              <h4 className="text-xs font-semibold text-green-600">{t('hsTs.management')}</h4>
            </div>
            <p className="text-xs text-foreground leading-relaxed pl-6">{t(details.managementKey)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function HsAndTsChecklist({ hsAndTs, onUpdate }: HsAndTsChecklistProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const checkedCount = Object.values(hsAndTs).filter(Boolean).length;

  const HS_ITEMS: { key: keyof HsAndTs; labelKey: string; descKey: string }[] = [
    { key: 'hypovolemia', labelKey: 'hsTs.hypovolemia', descKey: 'hsTs.hypovolemiaDesc' },
    { key: 'hypoxia', labelKey: 'hsTs.hypoxia', descKey: 'hsTs.hypoxiaDesc' },
    { key: 'hydrogenIon', labelKey: 'hsTs.hydrogenIon', descKey: 'hsTs.hydrogenIonDesc' },
    { key: 'hypoHyperkalemia', labelKey: 'hsTs.hypoHyperkalemia', descKey: 'hsTs.hypoHyperkalemiaDesc' },
    { key: 'hypothermia', labelKey: 'hsTs.hypothermia', descKey: 'hsTs.hypothermiaDesc' },
  ];

  const TS_ITEMS: { key: keyof HsAndTs; labelKey: string; descKey: string }[] = [
    { key: 'tensionPneumothorax', labelKey: 'hsTs.tensionPneumo', descKey: 'hsTs.tensionPneumoDesc' },
    { key: 'tamponade', labelKey: 'hsTs.tamponade', descKey: 'hsTs.tamponadeDesc' },
    { key: 'toxins', labelKey: 'hsTs.toxins', descKey: 'hsTs.toxinsDesc' },
    { key: 'thrombosisPulmonary', labelKey: 'hsTs.thrombosisPulm', descKey: 'hsTs.thrombosisPulmDesc' },
    { key: 'thrombosisCoronary', labelKey: 'hsTs.thrombosisCoro', descKey: 'hsTs.thrombosisCoroDesc' },
  ];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={cn(
          'flex items-center justify-between p-4 rounded-lg border-2 transition-all',
          'bg-acls-warning/10 border-acls-warning hover:bg-acls-warning/20'
        )}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-acls-warning" />
            <div className="text-left">
              <div className="font-semibold text-foreground">{t('hsTs.title')}</div>
              <div className="text-sm text-muted-foreground">
                {checkedCount > 0 ? t('hsTs.itemsChecked', { count: checkedCount }) : t('hsTs.tapToReview')}
              </div>
            </div>
          </div>
          <ChevronDown className={cn(
            'h-5 w-5 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )} />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-3 space-y-4 p-4 bg-card rounded-lg border border-border">
          {/* H's */}
          <div>
            <h3 className="text-sm font-bold text-acls-shockable mb-3">{t('hsTs.hs')}</h3>
            <div className="space-y-2">
              {HS_ITEMS.map((item) => (
                <CauseItem
                  key={item.key}
                  causeKey={item.key}
                  labelKey={item.labelKey}
                  descKey={item.descKey}
                  checked={hsAndTs[item.key]}
                  onCheckedChange={(checked) => onUpdate({ [item.key]: checked })}
                />
              ))}
            </div>
          </div>

          {/* T's */}
          <div>
            <h3 className="text-sm font-bold text-acls-non-shockable mb-3">{t('hsTs.ts')}</h3>
            <div className="space-y-2">
              {TS_ITEMS.map((item) => (
                <CauseItem
                  key={item.key}
                  causeKey={item.key}
                  labelKey={item.labelKey}
                  descKey={item.descKey}
                  checked={hsAndTs[item.key]}
                  onCheckedChange={(checked) => onUpdate({ [item.key]: checked })}
                />
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
