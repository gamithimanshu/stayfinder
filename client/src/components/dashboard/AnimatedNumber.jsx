import { useEffect, useMemo, useState } from "react";

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function rafCountUp({ from, to, durationMs, onUpdate, onDone }) {
  const start = performance.now();
  const diff = to - from;

  function tick(now) {
    const elapsed = now - start;
    const t = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
    const eased = easeOutCubic(t);
    const next = from + diff * eased;
    onUpdate(next);
    if (t >= 1) {
      onDone?.();
      return;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

export function AnimatedNumber({ value, durationMs = 900, formatter }) {
  const target = useMemo(() => {
    const num = Number(value ?? 0);
    return Number.isFinite(num) ? num : 0;
  }, [value]);

  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const from = display;
    const to = target;

    // Avoid counting up for no-ops.
    if (from === to) return;

    rafCountUp({
      from,
      to,
      durationMs,
      onUpdate: setDisplay,
      onDone: () => setDisplay(to),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const formatted = formatter ? formatter(display) : display;

  return <span>{formatted}</span>;
}

