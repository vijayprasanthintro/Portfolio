import { useEffect } from 'react';

// Several overlays (preloader, mobile menu, modals) can be open at once.
// A shared counter keeps one overlay from unlocking scroll while another is
// still open, which otherwise causes visible flicker.
let locks = 0;
let previousOverflow = '';

function apply() {
  document.body.style.overflow = locks > 0 ? 'hidden' : previousOverflow;
}

export function useBodyScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    if (locks === 0) previousOverflow = document.body.style.overflow;
    locks += 1;
    apply();
    return () => {
      locks = Math.max(0, locks - 1);
      apply();
    };
  }, [active]);
}
