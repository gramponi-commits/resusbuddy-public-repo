import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AirwayStatus, CPRRatio, PathwayMode } from '@/types/acls';
import { cn } from '@/lib/utils';
import { Wind, Users } from 'lucide-react';
import { CapnographyWaveIcon } from '@/components/icons/ClinicalIcons';
import type { ETCO2Unit } from '@/lib/etco2Units';
import {
  getEtco2ThresholdDisplay,
  getEtco2UnitLabel,
  isEtco2Adequate,
  parseEtco2InputToCanonical,
} from '@/lib/etco2Units';

interface CPRQualityPanelProps {
  airwayStatus: AirwayStatus;
  onAirwayChange: (status: AirwayStatus) => void;
  onETCO2Record?: (value: number) => void;
  etco2Unit: ETCO2Unit;
  cprRatio?: CPRRatio;
  onCPRRatioChange?: (ratio: CPRRatio) => void;
  pathwayMode?: PathwayMode;
}

export function CPRQualityPanel({
  airwayStatus,
  onAirwayChange,
  onETCO2Record,
  etco2Unit,
  cprRatio = '15:2',
  onCPRRatioChange,
  pathwayMode = 'pediatric',
}: CPRQualityPanelProps) {
  const { t } = useTranslation();
  const [etco2, setEtco2] = useState('');
  const [lastRecordedValue, setLastRecordedValue] = useState<number | null>(null);

  useEffect(() => {
    setEtco2('');
  }, [etco2Unit]);

  const handleETCO2Submit = () => {
    const canonicalValue = parseEtco2InputToCanonical(etco2, etco2Unit);
    if (canonicalValue === null || !onETCO2Record) {
      return;
    }

    const isDuplicate = lastRecordedValue !== null && Math.abs(canonicalValue - lastRecordedValue) < 0.001;
    if (!isDuplicate) {
      onETCO2Record(canonicalValue);
      setLastRecordedValue(canonicalValue);
    }
  };

  const handleETCO2KeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleETCO2Submit();
    }
  };

  const canonicalEtco2Value = parseEtco2InputToCanonical(etco2, etco2Unit);
  const etco2Status = canonicalEtco2Value === null
    ? null
    : isEtco2Adequate(canonicalEtco2Value) ? 'good' : 'low';
  const thresholdDisplay = getEtco2ThresholdDisplay(etco2Unit);
  const unitLabel = getEtco2UnitLabel(etco2Unit);
  const isAdult = pathwayMode === 'adult';

  return (
    <div className="space-y-2">
      {/* ETCO2 and Airway - Side by side */}
      <div className="grid grid-cols-2 gap-2">
        {/* ETCO2 */}
        <div className="bg-card rounded-lg p-2 border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <CapnographyWaveIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">ETCO2</span>
            {etco2Status && (
              <span
                className={cn(
                  'ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium',
                  etco2Status === 'good'
                    ? 'bg-acls-success/20 text-acls-success'
                    : 'bg-acls-critical/20 text-acls-critical',
                )}
              >
                {etco2Status === 'good' ? `>=${thresholdDisplay}✓` : `<${thresholdDisplay}⚠`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              inputMode={etco2Unit === 'kpa' ? 'decimal' : 'numeric'}
              step={etco2Unit === 'kpa' ? '0.1' : '1'}
              placeholder={unitLabel}
              value={etco2}
              onChange={(e) => setEtco2(e.target.value)}
              onKeyDown={handleETCO2KeyDown}
              className="h-9 text-sm font-mono flex-1"
            />
            <Button
              onClick={handleETCO2Submit}
              disabled={canonicalEtco2Value === null}
              size="sm"
              className="h-9 px-2"
            >
              {t('cpr.record')}
            </Button>
          </div>
        </div>

        {/* Airway Status */}
        <div className="bg-card rounded-lg p-2 border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Wind className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">{t('airway.title')}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => onAirwayChange('ambu')}
              className={cn(
                'flex flex-col items-center justify-center p-1.5 btn-3d-sm',
                airwayStatus === 'ambu'
                  ? 'bg-primary text-primary-foreground btn-3d-muted'
                  : 'bg-muted border-border hover:bg-accent btn-3d-muted',
              )}
            >
              <span className="font-semibold text-xs">{t('airway.ambu')}</span>
            </button>
            <button
              onClick={() => onAirwayChange('sga')}
              className={cn(
                'flex flex-col items-center justify-center p-1.5 btn-3d-sm',
                airwayStatus === 'sga'
                  ? 'bg-acls-warning text-white btn-3d-warning'
                  : 'bg-muted border-border hover:bg-accent btn-3d-muted',
              )}
            >
              <span className="font-semibold text-xs">{t('airway.sga')}</span>
            </button>
            <button
              onClick={() => onAirwayChange('ett')}
              className={cn(
                'flex flex-col items-center justify-center p-1.5 btn-3d-sm',
                airwayStatus === 'ett'
                  ? 'bg-acls-success text-white btn-3d-success'
                  : 'bg-muted border-border hover:bg-accent btn-3d-muted',
              )}
            >
              <span className="font-semibold text-xs">{t('airway.ett')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* CPR Ratio - Only show for Pediatric mode */}
      {!isAdult && (
        <div className="bg-card rounded-lg p-2 border border-border">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('cpr.ratio')}</span>
            <div className="flex-1 grid grid-cols-2 gap-2 ml-2">
              <button
                onClick={() => onCPRRatioChange?.('15:2')}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 btn-3d-sm',
                  cprRatio === '15:2'
                    ? 'bg-primary text-primary-foreground btn-3d-muted'
                    : 'bg-muted border-border hover:bg-accent btn-3d-muted',
                )}
              >
                <span className="font-bold text-sm">15:2</span>
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    cprRatio === '15:2' ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {t('cpr.twoRescuers')}
                </span>
              </button>
              <button
                onClick={() => onCPRRatioChange?.('30:2')}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 btn-3d-sm',
                  cprRatio === '30:2'
                    ? 'bg-primary text-primary-foreground btn-3d-muted'
                    : 'bg-muted border-border hover:bg-accent btn-3d-muted',
                )}
              >
                <span className="font-bold text-sm">30:2</span>
                <span
                  className={cn(
                    'text-[10px] leading-tight',
                    cprRatio === '30:2' ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {t('cpr.oneRescuer')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
