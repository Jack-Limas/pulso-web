"use client";

import { useI18n } from "@/components/i18n/i18n-provider";
import { THEME_KEY } from "./theme";

export function ThemeToggle() {
  const { dictionary } = useI18n();

  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // Private mode can block storage; the theme still changes for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dictionary.nav.theme}
      title={dictionary.nav.theme}
      className="relative grid size-10 place-items-center overflow-hidden rounded-full border border-line bg-surface transition hover:scale-105 hover:border-blue"
    >
      <svg viewBox="0 0 24 24" className="size-5 text-yellow transition dark:-translate-y-8" aria-hidden>
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </g>
      </svg>
      <svg
        viewBox="0 0 24 24"
        className="absolute size-5 translate-y-8 text-violet transition dark:translate-y-0"
        aria-hidden
      >
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" fill="currentColor" />
      </svg>
    </button>
  );
}
