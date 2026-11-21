import { useEffect, useRef } from 'react';
import { subscribeScroll } from '../lib/scrollTracker';

// Drives the progress bar with a direct style write inside the shared rAF.
// No React state update per frame, and no extra scroll listener.
export function useScrollProgress() {
  const ref = useRef(null);

  useEffect(
    () =>
      subscribeScroll((y) => {
        const el = ref.current;
        if (!el) return;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const next = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        el.style.transform = `scaleX(${next})`;
      }),
    []
  );

  return ref;
}
