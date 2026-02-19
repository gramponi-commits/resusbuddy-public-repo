import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Hook to automatically scale text down when it overflows its container.
 * Only scales when necessary, preserving original font size for text that fits.
 *
 * @returns { ref, scale } - ref to attach to text element, scale factor (0.75 to 1.0)
 */
export function useAutoScaleText() {
  const ref = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1.0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if text overflows container
    const isOverflowing = element.scrollWidth > element.clientWidth;

    if (!isOverflowing) {
      setScale(1.0);
      return;
    }

    // Calculate minimum scale needed to fit
    const overflowRatio = element.clientWidth / element.scrollWidth;
    let newScale = overflowRatio;

    // Snap to predefined scale levels for consistency
    if (overflowRatio >= 0.95) {
      newScale = 0.95;
    } else if (overflowRatio >= 0.90) {
      newScale = 0.90;
    } else if (overflowRatio >= 0.85) {
      newScale = 0.85;
    } else if (overflowRatio >= 0.80) {
      newScale = 0.80;
    } else if (overflowRatio >= 0.75) {
      newScale = 0.75;
    } else {
      // Fallback: clamp to 70% minimum
      newScale = 0.70;
    }

    setScale(newScale);
  }, [ref.current?.textContent, ref.current?.clientWidth]);

  return { ref, scale };
}
