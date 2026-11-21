import { useCallback, useEffect, useRef } from 'react';

// Card with a soft spotlight that follows the cursor (pointer-only).
// Exposes both pixel (--mouse-x/--mouse-y) and percent (--mx/--my) coordinates.
export function SpotlightCard({ children, className = '' }) {
  const ref = useRef(null);
  const raf = useRef(0);
  const point = useRef({ x: 0, y: 0 });

  const onMove = useCallback((e) => {
    if (e.pointerType !== 'mouse') return;
    point.current.x = e.clientX;
    point.current.y = e.clientY;
    if (raf.current) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = point.current.x - rect.left;
      const y = point.current.y - rect.top;
      el.style.setProperty('--mouse-x', `${x}px`);
      el.style.setProperty('--mouse-y', `${y}px`);
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    });
  }, []);

  useEffect(
    () => () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    },
    []
  );

  return (
    <div ref={ref} onPointerMove={onMove} className={`spotlight-card ${className}`.trim()}>
      {children}
    </div>
  );
}
