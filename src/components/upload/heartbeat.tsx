"use client";

import { useEffect, useRef } from "react";

/**
 * Moved by JavaScript on every frame on purpose: CSS animations run on the compositor and keep
 * moving even when the main thread is blocked, which would hide the freeze we want to show.
 */
export function Heartbeat() {
  const dot = useRef<HTMLSpanElement>(null);
  const trail = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const loop = (time: number) => {
      const angle = (time / 6) % 360;
      dot.current?.style.setProperty("transform", `rotate(${angle}deg) translateX(30px)`);
      trail.current?.style.setProperty("transform", `rotate(${angle}deg)`);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span aria-hidden className="relative grid size-20 place-items-center">
      <span className="absolute inset-0 rounded-full border-4 border-surface-2" />
      <span
        ref={trail}
        className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue border-r-violet"
      />
      <span ref={dot} className="absolute size-3 rounded-full bg-red shadow-[0_0_12px_var(--red)]" />
    </span>
  );
}
