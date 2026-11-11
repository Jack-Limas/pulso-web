/**
 * Measures the longest gap between animation frames. At 60 fps a frame arrives every ~16 ms;
 * a gap of several hundred ms is a frozen interface the user can feel.
 */
export function startFrameMonitor(): () => number {
  let last = performance.now();
  let longest = 0;
  let frame = requestAnimationFrame(function tick(now) {
    longest = Math.max(longest, now - last);
    last = now;
    frame = requestAnimationFrame(tick);
  });
  return () => {
    cancelAnimationFrame(frame);
    return Math.round(Math.max(longest, performance.now() - last));
  };
}

/** Chromium only; other browsers report nothing rather than a made-up number. */
export function usedHeapBytes(): number | undefined {
  const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return memory?.usedJSHeapSize;
}
