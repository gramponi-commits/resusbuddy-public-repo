import { useTranslation } from 'react-i18next';
import { Baby, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PathwayMode } from '@/types/acls';

interface PediatricToggleProps {
  mode: PathwayMode;
  onToggle: (mode: PathwayMode) => void;
}

/**
 * PediatricToggle - Segmented control for Adult/Pediatric mode selection
 * Shows both options side-by-side with dynamic color theming
 * Active segment highlights in mode color, inactive shows gray
 */
export function PediatricToggle({ mode, onToggle }: PediatricToggleProps) {
  const { t } = useTranslation();
  const isPediatric = mode === 'pediatric';

  return (
    <div
      className="w-full"
      role="radiogroup"
      aria-label={t('pathway.selectMode')}
    >
      <div className="flex gap-2 w-full">
        {/* Adult Button */}
        <button
          onClick={() => onToggle('adult')}
          className={cn(
            'flex-1 min-h-[48px] h-14',
            'flex flex-col items-center justify-center gap-1',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'btn-3d-sm',
            !isPediatric
              ? 'bg-acls-critical text-white focus:ring-acls-critical btn-3d-critical'
              : 'bg-muted text-muted-foreground focus:ring-border btn-3d-muted'
          )}
          role="radio"
          aria-checked={!isPediatric}
          aria-label={t('pathway.adult')}
        >
          <User className="h-5 w-5" />
          <span className="text-sm font-bold">
            {t('pathway.adult')}
          </span>
        </button>

        {/* Pediatric Button */}
        <button
          onClick={() => onToggle('pediatric')}
          className={cn(
            'flex-1 min-h-[48px] h-14',
            'flex flex-col items-center justify-center gap-1',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'btn-3d-sm',
            isPediatric
              ? 'bg-pals-primary text-white focus:ring-pals-primary btn-3d-pals'
              : 'bg-muted text-muted-foreground focus:ring-border btn-3d-muted'
          )}
          role="radio"
          aria-checked={isPediatric}
          aria-label={t('pathway.pediatric')}
        >
          <Baby className="h-5 w-5" />
          <span className="text-sm font-bold">
            {t('pathway.pediatric')}
          </span>
        </button>
      </div>
    </div>
  );
}
