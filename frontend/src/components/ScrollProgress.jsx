import { useScrollProgress } from '../hooks/useScrollProgress';

export function ScrollProgress() {
  const ref = useScrollProgress();
  return <div className="scroll-progress" ref={ref} aria-hidden="true" />;
}
