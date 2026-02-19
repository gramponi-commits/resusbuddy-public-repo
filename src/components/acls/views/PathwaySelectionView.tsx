import { memo } from 'react';
import { PathwaySelector, PathwayMode } from '../PathwaySelector';

interface PathwaySelectionViewProps {
  onSelectPathway: (mode: PathwayMode) => void;
  onStartCPR: () => void;
  onSetWeight: (weight: number | null) => void;
  currentWeight: number | null;
  onSelectBradyTachy: () => void;
}

/**
 * Pathway Selection View - Initial screen for selecting Adult/Pediatric/BradyTachy
 * Memoized to prevent unnecessary re-renders
 */
export const PathwaySelectionView = memo<PathwaySelectionViewProps>(({
  onSelectPathway,
  onStartCPR,
  onSetWeight,
  currentWeight,
  onSelectBradyTachy,
}) => {
  return (
    <PathwaySelector
      onSelectPathway={onSelectPathway}
      onStartCPR={onStartCPR}
      onSetWeight={onSetWeight}
      currentWeight={currentWeight}
      onSelectBradyTachy={onSelectBradyTachy}
    />
  );
});

PathwaySelectionView.displayName = 'PathwaySelectionView';
