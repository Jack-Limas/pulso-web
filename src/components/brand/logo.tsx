interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

/** Electric blue block over a red shadow, crossed by a heartbeat line. */
export function LogoMark({ size = 36, className }: Omit<LogoProps, "withWordmark">) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Pulso"
    >
      <rect x="7" y="7" width="38" height="38" rx="11" fill="var(--red)" />
      <rect x="3" y="3" width="38" height="38" rx="11" fill="var(--blue)" />
      <polyline
        points="9,23 15,23 18.5,14 24,32 28,19 30,23 36,23"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="60 140"
        className="animate-pulse-line"
      />
      <circle cx="36" cy="23" r="2.6" fill="var(--yellow)" />
    </svg>
  );
}

export function Logo({ size = 36, withWordmark = true, className }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className="font-display text-xl font-bold tracking-tight">
          Pulso<span className="text-red">.</span>
        </span>
      )}
    </span>
  );
}
