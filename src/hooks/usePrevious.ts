import { useEffect, useRef } from 'react';

/**
 * Hook to track previous value of a variable
 * Useful for comparing current vs previous state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
