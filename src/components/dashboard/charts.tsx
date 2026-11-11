"use client";

import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useI18n } from "@/components/i18n/i18n-provider";
import { formatMoney } from "@/lib/format";

export const CATEGORY_COLORS: Record<string, string> = {
  food: "#ff2e4d",
  transport: "#1f4bff",
  housing: "#7a3cff",
  entertainment: "#ff7a00",
  utilities: "#00b8a9",
  health: "#00c853",
  education: "#ffb800",
  technology: "#00a3ff",
  shopping: "#ff4fa3",
  other: "#8a8fa3",
};

interface Slice {
  code: string;
  label: string;
  value: number;
}

function MoneyTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  const { locale } = useI18n();
  const item = payload?.[0];
  if (!active || !item) {
    return null;
  }
  return (
    <div className="card px-3 py-2 text-sm">
      <p className="text-muted">{item.name}</p>
      <p className="font-display font-bold">{formatMoney(item.value, locale)}</p>
    </div>
  );
}

export function CategoryDonut({ slices, total }: { slices: Slice[]; total: string }) {
  return (
    <div className="relative h-64">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={3}
            cornerRadius={8}
            stroke="none"
          >
            {slices.map((slice) => (
              <Cell key={slice.code} fill={CATEGORY_COLORS[slice.code] ?? CATEGORY_COLORS.other} />
            ))}
          </Pie>
          <Tooltip content={<MoneyTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <p className="pointer-events-none absolute inset-0 grid place-items-center text-center font-display text-xl font-bold">
        {total}
      </p>
    </div>
  );
}

export function CashflowBars({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis hide />
          <Tooltip cursor={{ fill: "var(--surface-2)" }} content={<MoneyTooltip />} />
          <Bar dataKey="value" name="" radius={[12, 12, 4, 4]} maxBarSize={72}>
            {data.map((bar) => (
              <Cell key={bar.label} fill={bar.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
