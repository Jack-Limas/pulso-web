import type { ReactNode } from "react";
import { type IconName, Icons } from "@/components/ui/icons";

export function Panel({
  title,
  icon,
  tone = "text-blue bg-blue/10",
  children,
  className = "",
}: {
  title: string;
  icon: IconName;
  tone?: string;
  children: ReactNode;
  className?: string;
}) {
  const Icon = Icons[icon];
  return (
    <section className={`card animate-rise p-6 ${className}`}>
      <h2 className="mb-5 flex items-center gap-3 font-display text-lg font-bold">
        <span className={`grid size-9 place-items-center rounded-xl ${tone}`}>
          <Icon className="size-5" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  accent,
  delay = 0,
}: {
  label: string;
  value: string;
  accent: string;
  delay?: number;
}) {
  return (
    <div className="card relative animate-rise overflow-hidden p-5" style={{ animationDelay: `${delay}ms` }}>
      <span aria-hidden className={`absolute -top-10 -right-10 size-28 rounded-full opacity-25 blur-2xl ${accent}`} />
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      <span aria-hidden className={`mt-4 block h-1 w-14 rounded-full ${accent}`} />
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-surface-2/60 px-4 py-6 text-center text-sm text-muted">{children}</p>;
}
