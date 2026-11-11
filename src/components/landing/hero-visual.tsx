"use client";

import dynamic from "next/dynamic";
import { LogoMark } from "@/components/brand/logo";

// WebGL only exists in the browser, so the scene is client rendered (CSR) inside a static page.
const HeroScene = dynamic(() => import("./hero-scene"), {
  ssr: false,
  loading: () => (
    <div className="grid size-full place-items-center">
      <LogoMark size={160} className="animate-float" />
    </div>
  ),
});

interface FloatingNote {
  label: string;
  value: string;
  tone: "red" | "yellow" | "blue";
  className: string;
}

const TONES = {
  red: "bg-red/15 text-red",
  yellow: "bg-yellow/25 text-[#8a6a00] dark:text-yellow",
  blue: "bg-blue/15 text-blue",
};

export function HeroVisual({ notes }: { notes: FloatingNote[] }) {
  return (
    <div className="relative aspect-square w-full max-w-[560px]">
      <div aria-hidden className="absolute inset-[12%] rounded-full bg-blue/30 blur-3xl" />
      <HeroScene />
      {notes.map((note) => (
        <div
          key={note.label}
          className={`card absolute animate-float px-4 py-3 text-sm shadow-xl ${note.className}`}
        >
          <p className="text-xs text-muted">{note.label}</p>
          <p className={`mt-1 inline-block rounded-full px-2 py-0.5 font-display font-bold ${TONES[note.tone]}`}>
            {note.value}
          </p>
        </div>
      ))}
    </div>
  );
}
