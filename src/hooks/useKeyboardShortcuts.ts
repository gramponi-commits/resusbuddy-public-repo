import { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { logger } from '@/utils/logger';

interface KeyboardShortcutsOptions {
  onShock?: () => void;
  onEpinephrine?: () => void;
  onRhythmCheck?: () => void;
  onAmiodarone?: () => void;
  onLidocaine?: () => void;
  enabled?: boolean;
}

/**
 * Global keyboard shortcuts for critical ACLS actions
 * Designed for accessibility and rapid response during codes
 */
export function useKeyboardShortcuts({
  onShock,
  onEpinephrine,
  onRhythmCheck,
  onAmiodarone,
  onLidocaine,
  enabled = true,
}: KeyboardShortcutsOptions) {
  // Log when shortcuts are enabled/disabled
  useEffect(() => {
    if (enabled) {
      logger.info('Keyboard shortcuts enabled');
    } else {
      logger.info('Keyboard shortcuts disabled');
    }
  }, [enabled]);

  // Ctrl/Cmd + E: Epinephrine
  useHotkeys(
    'ctrl+e, cmd+e',
    (event) => {
      event.preventDefault();
      if (onEpinephrine) {
        logger.info('Keyboard shortcut: Epinephrine (Ctrl+E)');
        onEpinephrine();
      }
    },
    { enabled: enabled && !!onEpinephrine },
    [onEpinephrine, enabled]
  );

  // Ctrl/Cmd + R: Rhythm Check
  useHotkeys(
    'ctrl+r, cmd+r',
    (event) => {
      event.preventDefault();
      if (onRhythmCheck) {
        logger.info('Keyboard shortcut: Rhythm Check (Ctrl+R)');
        onRhythmCheck();
      }
    },
    { enabled: enabled && !!onRhythmCheck },
    [onRhythmCheck, enabled]
  );

  // Ctrl/Cmd + A: Amiodarone
  useHotkeys(
    'ctrl+a, cmd+a',
    (event) => {
      event.preventDefault();
      if (onAmiodarone) {
        logger.info('Keyboard shortcut: Amiodarone (Ctrl+A)');
        onAmiodarone();
      }
    },
    { enabled: enabled && !!onAmiodarone },
    [onAmiodarone, enabled]
  );

  // Ctrl/Cmd + L: Lidocaine
  useHotkeys(
    'ctrl+l, cmd+l',
    (event) => {
      event.preventDefault();
      if (onLidocaine) {
        logger.info('Keyboard shortcut: Lidocaine (Ctrl+L)');
        onLidocaine();
      }
    },
    { enabled: enabled && !!onLidocaine },
    [onLidocaine, enabled]
  );

  // Ctrl/Cmd + S: Shock (if applicable)
  useHotkeys(
    'ctrl+s, cmd+s',
    (event) => {
      event.preventDefault();
      if (onShock) {
        logger.info('Keyboard shortcut: Shock (Ctrl+S)');
        onShock();
      }
    },
    { enabled: enabled && !!onShock },
    [onShock, enabled]
  );

  return {
    shortcuts: {
      epinephrine: 'Ctrl+E',
      rhythmCheck: 'Ctrl+R',
      amiodarone: 'Ctrl+A',
      lidocaine: 'Ctrl+L',
      shock: 'Ctrl+S',
    },
  };
}
