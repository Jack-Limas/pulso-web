import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const BASE =
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.97]";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-blue via-violet to-red text-white shadow-[0_10px_30px_-10px_var(--blue)] hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_var(--red)]",
  secondary: "border border-line bg-surface text-text hover:-translate-y-0.5 hover:border-blue",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  danger: "bg-red text-white hover:-translate-y-0.5",
};

function Shine({ variant }: { variant: Variant }) {
  if (variant !== "primary") {
    return null;
  }
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/30 blur-md animate-shine"
    />
  );
}

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={buttonClass(variant, className)} {...props}>
      <Shine variant={variant} />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      <Shine variant={variant} />
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </Link>
  );
}
