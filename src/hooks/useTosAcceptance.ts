import { useState, useEffect, useCallback } from 'react';
import { isNativeApp } from '@/hooks/useIsNativeApp';

const TOS_ACCEPTANCE_KEY = 'resusbuddy-tos-accepted';
const NATIVE_FIRST_ACCESS_KEY = 'resusbuddy-native-first-access';
const TOS_VERSION = '1.0'; // Increment this when TOS changes significantly

interface TosAcceptanceState {
  hasAccepted: boolean;
  isLoading: boolean;
}

export function useTosAcceptance() {
  const [state, setState] = useState<TosAcceptanceState>({
    hasAccepted: true, // Default to true to prevent flash
    isLoading: true,
  });

  useEffect(() => {
    try {
      const runningNative = isNativeApp();
      const nativeFirstAccess = runningNative
        ? localStorage.getItem(NATIVE_FIRST_ACCESS_KEY)
        : 'complete';

      const stored = localStorage.getItem(TOS_ACCEPTANCE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      const hasAccepted = parsed?.version === TOS_VERSION && parsed?.accepted === true;

      if (runningNative && !nativeFirstAccess) {
        setState({ hasAccepted: false, isLoading: false });
        return;
      }

      setState({ hasAccepted, isLoading: false });
    } catch {
      setState({ hasAccepted: false, isLoading: false });
    }
  }, []);

  const acceptTos = useCallback(() => {
    try {
      localStorage.setItem(
        TOS_ACCEPTANCE_KEY,
        JSON.stringify({
          accepted: true,
          version: TOS_VERSION,
          timestamp: new Date().toISOString(),
        })
      );

      if (isNativeApp()) {
        localStorage.setItem(
          NATIVE_FIRST_ACCESS_KEY,
          JSON.stringify({
            completed: true,
            timestamp: new Date().toISOString(),
          })
        );
      }

      setState({ hasAccepted: true, isLoading: false });
    } catch {
      // If localStorage fails, still allow usage but it won't persist
      setState({ hasAccepted: true, isLoading: false });
    }
  }, []);

  return {
    hasAccepted: state.hasAccepted,
    isLoading: state.isLoading,
    acceptTos,
  };
}
