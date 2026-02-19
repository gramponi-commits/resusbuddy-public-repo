import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Scale, Calculator, X } from 'lucide-react';
import {
  calculateEpinephrineDose,
  calculateAmiodaroneDose,
  calculateShockEnergy,
} from '@/lib/palsDosing';
import { parseWeight, isValidWeightInput } from '@/lib/weightValidation';
import { toast } from 'sonner';

interface WeightInputProps {
  currentWeight: number | null;
  onWeightChange: (weight: number | null) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function WeightInput({
  currentWeight,
  onWeightChange,
  isOpen,
  onOpenChange,
  showTrigger = true,
}: WeightInputProps) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState<string>(
    currentWeight ? String(currentWeight) : ''
  );
  const [localOpen, setLocalOpen] = useState(false);
  
  const open = isOpen ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;

  const handleSubmit = () => {
    const result = parseWeight(inputValue);
    if (result.success === true) {
      onWeightChange(result.weight);
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  };

  const handleClear = () => {
    onWeightChange(null);
    setInputValue('');
    setOpen(false);
  };

  const previewWeight = parseFloat(inputValue) || null;
  const epiDose = calculateEpinephrineDose(previewWeight);
  const amioDose = calculateAmiodaroneDose(previewWeight, 0);
  const shockEnergy = calculateShockEnergy(previewWeight, 0);

  return (
    <>
      {showTrigger && (
        <Button
          onClick={() => setOpen(true)}
          variant={currentWeight ? 'secondary' : 'outline'}
          className="gap-2 h-12"
        >
          <Scale className="h-4 w-4" />
          {currentWeight ? `${currentWeight} kg` : t('weight.setWeight')}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              {t('weight.title')}
            </DialogTitle>
            <DialogDescription>
              {t('weight.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Weight Input */}
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder={t('weight.placeholder')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="h-14 text-2xl font-mono text-center"
                min={0.5}
                max={150}
                step={0.1}
              />
              <span className="text-lg font-medium text-muted-foreground">kg</span>
            </div>

            {/* Quick Weight Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {[5, 10, 15, 20, 30].map((weight) => (
                <Button
                  key={weight}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(String(weight))}
                  className="h-10"
                >
                  {weight}
                </Button>
              ))}
            </div>

            {/* Dose Preview */}
            {previewWeight && (
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                  <Calculator className="h-4 w-4" />
                  {t('weight.calculatedDoses')}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('actions.epinephrine')}:</span>
                    <span className="font-mono font-bold">{epiDose.display}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('actions.amiodarone')}:</span>
                    <span className="font-mono font-bold">{amioDose.display}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('weight.firstShock')}:</span>
                    <span className="font-mono font-bold">{shockEnergy.display}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={!isValidWeightInput(inputValue)}
                className="flex-1 h-12"
              >
                {t('weight.confirm')}
              </Button>
              {currentWeight && (
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="h-12 gap-2"
                >
                  <X className="h-4 w-4" />
                  {t('weight.clear')}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {t('weight.unknownHint')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Compact weight display for the header area
interface WeightDisplayProps {
  weight: number | null;
  onEdit: () => void;
}

export function WeightDisplay({ weight, onEdit }: WeightDisplayProps) {
  const { t } = useTranslation();
  
  return (
    <button
      onClick={onEdit}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
    >
      <Scale className="h-4 w-4 text-primary" />
      <span className="font-medium text-sm">
        {weight ? `${weight} kg` : t('weight.unknown')}
      </span>
    </button>
  );
}
