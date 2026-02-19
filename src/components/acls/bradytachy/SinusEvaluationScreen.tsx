import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { BradyTachySession } from '@/types/acls';
import { BradyTachyActions } from '@/hooks/useBradyTachyLogic';

interface SinusEvaluationScreenProps {
  session: BradyTachySession;
  actions: BradyTachyActions;
}

export function SinusEvaluationScreen({ session, actions }: SinusEvaluationScreenProps) {
  const { t } = useTranslation();

  const handleProbableSinus = () => {
    // This will end the session with "treat cause" guidance
    actions.selectPediatricSinusTachy();
  };

  const handleConcerningRhythm = () => {
    // This will advance to compromise assessment
    actions.advanceToCompromiseAssessment();
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      {/* Option A: Probable Sinus Tachycardia */}
      <div className="bg-card rounded-lg p-3 sm:p-4 border-2 border-border overflow-hidden">
        <h3 className="font-bold text-base sm:text-lg break-words mb-3">
          {t('bradyTachy.pedsProbableSinus')}
        </h3>

        <div className="mb-3">
          <p className="text-sm font-medium mb-2">{t('bradyTachy.pedsSinusCriteria')}</p>
          <ul className="space-y-1 text-xs sm:text-sm list-disc list-inside">
            <li>{t('bradyTachy.pedsSinusPWaves')}</li>
            <li>{t('bradyTachy.pedsSinusVariableRR')}</li>
            <li>{t('bradyTachy.pedsSinusInfantRate')}</li>
            <li>{t('bradyTachy.pedsSinusChildRate')}</li>
          </ul>
        </div>

          <Button
            onClick={handleProbableSinus}
            className="w-full min-h-11 sm:min-h-12 h-auto px-4 py-3 sm:py-3.5 text-sm sm:text-lg font-bold whitespace-normal text-center leading-snug btn-3d btn-3d-muted"
          >
            <span className="whitespace-normal break-words">{t('bradyTachy.pedsProbableSinus')}</span>
          </Button>
        </div>

        {/* Option B: Not Sinus / Concerning Rhythm OR Compromise */}
        <div className="bg-card rounded-lg p-3 sm:p-4 border-2 border-border overflow-hidden">
          <h3 className="font-bold text-base sm:text-lg break-words mb-3">
            {t('bradyTachy.notSinusConcerningRhythm')}
          </h3>

          <p className="text-xs sm:text-sm mb-3 break-words">
            {t('bradyTachy.orCompromiseSuspected')}
          </p>

          <Button
            onClick={handleConcerningRhythm}
            className="w-full min-h-11 sm:min-h-12 h-auto px-4 py-3 sm:py-3.5 text-sm sm:text-lg font-bold whitespace-normal text-center leading-snug btn-3d btn-3d-muted"
          >
            <span className="whitespace-normal break-words">
              {t('bradyTachy.continueToCompromiseAssessment')}
            </span>
          </Button>
        </div>
    </div>
  );
}
