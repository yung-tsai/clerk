import { useEffect, useRef, useState } from "react";

/**
 * Returns `true` after `ms` of no user activity.
 * Listens to pointer/keyboard/scroll/touch events on the window.
 * `enabled=false` disables the timer and forces `idle=false`.
 */
export function useIdle(ms: number, enabled: boolean = true): boolean {
  const [idle, setIdle] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIdle(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }

    const reset = () => {
      setIdle(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setIdle(true), ms);
    };

    const events: (keyof WindowEventMap)[] = [
      "pointermove",
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [ms, enabled]);

  return idle;
}
