"use client";

import { type PointerEvent, type ReactNode, useRef } from "react";

const MAX_TILT_DEGREES = 8;

/** Leans toward the pointer in 3D and moves a light spot with it. */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(event: PointerEvent<HTMLDivElement>) {
    const card = ref.current;
    if (!card || event.pointerType !== "mouse") {
      return;
    }
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    card.style.setProperty("--rx", `${(0.5 - y) * MAX_TILT_DEGREES}deg`);
    card.style.setProperty("--ry", `${(x - 0.5) * MAX_TILT_DEGREES}deg`);
    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
  }

  function onLeave() {
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`card relative transition-transform duration-200 ease-out [transform:perspective(900px)_rotateX(var(--rx,0))_rotateY(var(--ry,0))] ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 [background:radial-gradient(16rem_circle_at_var(--mx,50%)_var(--my,50%),var(--glow),transparent_70%)] group-hover:opacity-100 hover:opacity-100"
      />
      <div className="relative">{children}</div>
    </div>
  );
}
