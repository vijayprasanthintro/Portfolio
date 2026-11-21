import { useEffect, useState } from 'react';

// Reusable typing engine for terminal-style components.
//
// Script steps:
//   { type: 'cmd',   text: 'whoami', speed: 60, hold: 500, color: 'cmd' }
//   { type: 'out',   text: '...',    delay: 260, hold: 620, color: 'out' | 'accent' | 'ok' | 'dim' }
//   { type: 'pause', ms: 700 }
//
// `cycle` is bumped by the caller to restart the sequence (looping terminals).
export function useTypewriter({ script, startDelay = 0, reduced = false, cycle = 0, active = true }) {
  const [done, setDone] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const pending = new Set();

    const wait = (ms) =>
      new Promise((resolve) => {
        const done = () => {
          pending.delete(done);
          resolve();
        };
        pending.add(done);
        timers.push(setTimeout(done, ms));
      });

    if (!active) {
      return () => {
        cancelled = true;
      };
    }

    if (reduced) {
      setDone(
        script
          .filter((s) => s.type === 'cmd' || s.type === 'out')
          .map((s) => ({ type: s.type, text: s.text, color: s.color }))
      );
      setActiveStep(null);
      setFinished(true);
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const run = async () => {
      setDone([]);
      setActiveStep(null);
      setFinished(false);
      await wait(startDelay);

      const completed = [];
      for (const step of script) {
        if (cancelled) return;

        if (step.type === 'cmd') {
          setActiveStep({ text: '', target: step.text, color: step.color });
          for (let i = 1; i <= step.text.length; i++) {
            await wait(step.speed || 60);
            if (cancelled) return;
            setActiveStep({ text: step.text.slice(0, i), target: step.text, color: step.color });
          }
          completed.push({ type: 'cmd', text: step.text, color: step.color });
          setDone([...completed]);
          setActiveStep(null);
          await wait(step.hold ?? 500);
        } else if (step.type === 'out') {
          await wait(step.delay ?? 260);
          completed.push({ type: 'out', text: step.text, color: step.color });
          setDone([...completed]);
          await wait(step.hold ?? 620);
        } else if (step.type === 'pause') {
          await wait(step.ms ?? 700);
        }
      }

      if (cancelled) return;
      setFinished(true);
    };

    run();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      // Resolve pending waits so the async loop can exit instead of staying
      // suspended on a timer that will never fire.
      pending.forEach((done) => done());
    };
  }, [script, startDelay, reduced, cycle, active]);

  return { done, active: activeStep, finished };
}
