export function animateCount(target: number, onFrame: (v: number) => void, duration = 1100) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    onFrame(target);
    return () => {};
  }
  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  let raf = 0;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    onFrame(target * ease(t));
    if (t < 1) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}