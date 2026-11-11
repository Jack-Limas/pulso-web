import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const Icons = {
  coffee: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z" />
      <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3" />
    </svg>
  ),
  alert: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4M12 17h.01" />
    </svg>
  ),
  repeat: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M17 2l3 3-3 3M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3M21 13v2a4 4 0 0 1-4 4H4" />
    </svg>
  ),
  trend: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
    </svg>
  ),
  sparkles: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3ZM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </svg>
  ),
  bolt: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
    </svg>
  ),
  upload: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  ),
  cpu: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </svg>
  ),
  chart: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  shield: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  arrow: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  home: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />
    </svg>
  ),
  list: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  logout: (p: SVGProps<SVGSVGElement>) => (
    <svg {...base(p)}>
      <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  ),
};

export type IconName = keyof typeof Icons;
