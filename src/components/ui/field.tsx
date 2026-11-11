import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const CONTROL =
  "w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-text outline-none transition placeholder:text-muted/70 focus:border-blue focus:bg-surface focus:ring-4 focus:ring-blue/15";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  hint?: string | undefined;
}

export function Field({ label, hint, name, ...props }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <input name={name} className={CONTROL} {...props} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <select className={CONTROL} {...props}>
        {children}
      </select>
    </label>
  );
}
