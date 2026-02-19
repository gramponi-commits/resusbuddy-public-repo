import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PostROSCChecklist, PostROSCVitals } from '@/types/acls';
import { cn } from '@/lib/utils';
import { Heart, Thermometer, Activity, Droplet, RotateCcw, Save, CheckCircle } from 'lucide-react';

interface PostROSCScreenProps {
  checklist: PostROSCChecklist;
  vitals: PostROSCVitals;
  onChecklistUpdate: (updates: Partial<PostROSCChecklist>) => void;
  onVitalsUpdate: (updates: Partial<PostROSCVitals>) => void;
  onExport: () => void;
  onNewCode: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

function VitalInput({ 
  label, 
  value, 
  onChange, 
  unit, 
  target,
  targetLabel,
  icon: Icon,
  isInRange,
  inRangeText,
  outOfRangeText
}: { 
  label: string; 
  value: number | null; 
  onChange: (v: number | null) => void; 
  unit: string; 
  target: string;
  targetLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isInRange: boolean | null;
  inRangeText: string;
  outOfRangeText: string;
}) {
  return (
    <div className="bg-card rounded-lg p-3 border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
          className="h-10 text-lg font-mono"
          placeholder="—"
        />
        <span className="text-sm text-muted-foreground whitespace-nowrap">{unit}</span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{targetLabel}: {target}</span>
        {isInRange !== null && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded',
            isInRange ? 'bg-acls-success/20 text-acls-success' : 'bg-acls-critical/20 text-acls-critical'
          )}>
            {isInRange ? inRangeText : outOfRangeText}
          </span>
        )}
      </div>
    </div>
  );
}

export function PostROSCScreen({ 
  checklist, 
  vitals, 
  onChecklistUpdate, 
  onVitalsUpdate, 
  onExport, 
  onNewCode,
  onSave,
  isSaved = false 
}: PostROSCScreenProps) {
  const { t } = useTranslation();
  
  const checkSpo2 = vitals.spo2 !== null ? vitals.spo2 >= 90 && vitals.spo2 <= 98 : null;
  const checkPaco2 = vitals.paco2 !== null ? vitals.paco2 >= 35 && vitals.paco2 <= 45 : null;
  const checkMap = vitals.map !== null ? vitals.map >= 65 : null;
  const checkTemp = vitals.temperature !== null ? vitals.temperature >= 32 && vitals.temperature <= 37.5 : null;
  const checkGlucose = vitals.glucose !== null ? vitals.glucose >= 70 && vitals.glucose <= 180 : null;

  const CHECKLIST_ITEMS: { key: keyof PostROSCChecklist; labelKey: string; sectionKey: string }[] = [
    { key: 'airwaySecured', labelKey: 'postRosc.airwaySecured', sectionKey: 'postRosc.initialStabilization' },
    { key: 'ventilationOptimized', labelKey: 'postRosc.ventilationOptimized', sectionKey: 'postRosc.initialStabilization' },
    { key: 'hemodynamicsOptimized', labelKey: 'postRosc.hemodynamicsOptimized', sectionKey: 'postRosc.initialStabilization' },
    { key: 'twelveLeadECG', labelKey: 'postRosc.twelveLeadECG', sectionKey: 'postRosc.diagnostics' },
    { key: 'labsOrdered', labelKey: 'postRosc.labsOrdered', sectionKey: 'postRosc.diagnostics' },
    { key: 'ctHeadOrdered', labelKey: 'postRosc.ctHeadOrdered', sectionKey: 'postRosc.diagnostics' },
    { key: 'echoOrdered', labelKey: 'postRosc.echoOrdered', sectionKey: 'postRosc.diagnostics' },
    { key: 'temperatureManagement', labelKey: 'postRosc.temperatureManagement', sectionKey: 'postRosc.neuroprotection' },
    { key: 'neurologicalAssessment', labelKey: 'postRosc.neurologicalAssessment', sectionKey: 'postRosc.neuroprotection' },
    { key: 'eegOrdered', labelKey: 'postRosc.eegOrdered', sectionKey: 'postRosc.neuroprotection' },
  ];

  const sections = CHECKLIST_ITEMS.reduce((acc, item) => {
    const sectionName = t(item.sectionKey);
    if (!acc[sectionName]) acc[sectionName] = [];
    acc[sectionName].push(item);
    return acc;
  }, {} as Record<string, typeof CHECKLIST_ITEMS>);

  return (
    <div className="space-y-6 pb-6">
      {/* Vital Targets */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">{t('postRosc.vitalTargets')}</h2>
        <div className="grid grid-cols-2 gap-3">
          <VitalInput
            label="SpO₂"
            value={vitals.spo2}
            onChange={(v) => onVitalsUpdate({ spo2: v })}
            unit="%"
            target="90-98%"
            targetLabel={t('postRosc.target')}
            icon={Droplet}
            isInRange={checkSpo2}
            inRangeText={t('postRosc.inRange')}
            outOfRangeText={t('postRosc.outOfRange')}
          />
          <VitalInput
            label="PaCO₂"
            value={vitals.paco2}
            onChange={(v) => onVitalsUpdate({ paco2: v })}
            unit="mmHg"
            target="35-45"
            targetLabel={t('postRosc.target')}
            icon={Activity}
            isInRange={checkPaco2}
            inRangeText={t('postRosc.inRange')}
            outOfRangeText={t('postRosc.outOfRange')}
          />
          <VitalInput
            label="MAP"
            value={vitals.map}
            onChange={(v) => onVitalsUpdate({ map: v })}
            unit="mmHg"
            target="≥65"
            targetLabel={t('postRosc.target')}
            icon={Heart}
            isInRange={checkMap}
            inRangeText={t('postRosc.inRange')}
            outOfRangeText={t('postRosc.outOfRange')}
          />
          <VitalInput
            label="Temp"
            value={vitals.temperature}
            onChange={(v) => onVitalsUpdate({ temperature: v })}
            unit="°C"
            target="32-37.5"
            targetLabel={t('postRosc.target')}
            icon={Thermometer}
            isInRange={checkTemp}
            inRangeText={t('postRosc.inRange')}
            outOfRangeText={t('postRosc.outOfRange')}
          />
          <div className="col-span-2">
            <VitalInput
              label="Glucose"
              value={vitals.glucose}
              onChange={(v) => onVitalsUpdate({ glucose: v })}
              unit="mg/dL"
              target="70-180"
              targetLabel={t('postRosc.target')}
              icon={Droplet}
              isInRange={checkGlucose}
              inRangeText={t('postRosc.inRange')}
              outOfRangeText={t('postRosc.outOfRange')}
            />
          </div>
        </div>
      </div>

      {/* Checklist by Section */}
      {Object.entries(sections).map(([section, items]) => (
        <div key={section}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">{section}</h3>
          <div className="space-y-2 bg-card rounded-lg p-3 border border-border">
            {items.map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={checklist[item.key] as boolean}
                  onCheckedChange={(checked) => onChecklistUpdate({ [item.key]: checked })}
                />
                <span className="text-sm font-medium text-foreground">{t(item.labelKey)}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Special Assessments */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t('postRosc.specialAssessments')}</h3>
        <div className="space-y-3 bg-card rounded-lg p-3 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('postRosc.followingCommands')}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={checklist.followingCommands === true ? 'default' : 'outline'}
                onClick={() => onChecklistUpdate({ followingCommands: true })}
              >
                {t('postRosc.yes')}
              </Button>
              <Button
                size="sm"
                variant={checklist.followingCommands === false ? 'default' : 'outline'}
                onClick={() => onChecklistUpdate({ followingCommands: false })}
              >
                {t('postRosc.no')}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('postRosc.stElevation')}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={checklist.stElevation === true ? 'destructive' : 'outline'}
                onClick={() => onChecklistUpdate({ stElevation: true })}
              >
                {t('postRosc.yes')}
              </Button>
              <Button
                size="sm"
                variant={checklist.stElevation === false ? 'default' : 'outline'}
                onClick={() => onChecklistUpdate({ stElevation: false })}
              >
                {t('postRosc.no')}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('postRosc.cardiogenicShock')}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={checklist.cardiogenicShock === true ? 'destructive' : 'outline'}
                onClick={() => onChecklistUpdate({ cardiogenicShock: true })}
              >
                {t('postRosc.yes')}
              </Button>
              <Button
                size="sm"
                variant={checklist.cardiogenicShock === false ? 'default' : 'outline'}
                onClick={() => onChecklistUpdate({ cardiogenicShock: false })}
              >
                {t('postRosc.no')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onExport}
            variant="outline"
            className="h-12 gap-2"
          >
            <Save className="h-4 w-4" />
            {t('actions.save')}
          </Button>
          <Button
            onClick={onNewCode}
            variant="outline"
            className="h-12 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('actions.newCode')}
          </Button>
        </div>
      </div>
    </div>
  );
}
