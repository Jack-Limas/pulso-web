"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { type IconName, Icons } from "@/components/ui/icons";
import { type Alert, AlertKind, AlertSeverity } from "@/gen/pulso/v1/insights_service_pb";
import { markSeen, readSeen } from "@/lib/alerts/seen-alerts";
import { api } from "@/lib/api/browser";
import { formatDate, formatMoney, formatMonth } from "@/lib/format";
import { format } from "@/lib/i18n/get-dictionary";
import { useRealtime } from "@/lib/realtime/realtime-provider";

type SeverityKey = "HIGH" | "MEDIUM" | "LOW";
type KindKey = "ANOMALY" | "ANT_EXPENSE" | "LOW_LIQUIDITY" | "FAILED_STATEMENT";

const SEVERITY_STYLE: Record<SeverityKey, { bar: string; badge: string; card: string }> = {
  HIGH: { bar: "bg-red", badge: "bg-red/10 text-red", card: "bg-red" },
  MEDIUM: { bar: "bg-yellow", badge: "bg-yellow/25 text-[#8a6a00] dark:text-yellow", card: "bg-yellow" },
  LOW: { bar: "bg-blue", badge: "bg-blue/10 text-blue", card: "bg-blue" },
};
const KIND_ICON: Record<KindKey, IconName> = {
  ANOMALY: "alert",
  ANT_EXPENSE: "coffee",
  LOW_LIQUIDITY: "trend",
  FAILED_STATEMENT: "upload",
};
const SEVERITIES: SeverityKey[] = ["HIGH", "MEDIUM", "LOW"];

const severityOf = (alert: Alert) => AlertSeverity[alert.severity] as SeverityKey;
const kindOf = (alert: Alert) => AlertKind[alert.kind] as KindKey;

export function AlertsCenter() {
  const { locale, dictionary } = useI18n();
  const t = dictionary.app.alerts;
  const [alerts, setAlerts] = useState<Alert[]>();
  // Captured once per load, so alerts stay marked "new" while the user reads them.
  const [unseen, setUnseen] = useState<Set<string>>(new Set());
  const [severity, setSeverity] = useState<SeverityKey | null>(null);
  const [kind, setKind] = useState<KindKey | null>(null);

  const show = useCallback((list: Alert[]) => {
    const seen = readSeen();
    setUnseen(new Set(list.filter((alert) => !seen.has(alert.id)).map((alert) => alert.id)));
    setAlerts(list);
    // Opening the center counts as seeing them; the "new" marks stay until the next visit.
    markSeen(list.map((alert) => alert.id));
  }, []);

  useEffect(() => {
    void api.insights.listAlerts({}).then((response) => show(response.alerts));
  }, [show]);

  useRealtime((event) => {
    if (event.type === "statement.status" && event.status === "COMPLETED") {
      void api.insights.listAlerts({}).then((response) => show(response.alerts));
    }
  });

  const visible = useMemo(
    () =>
      (alerts ?? []).filter(
        (alert) => (!severity || severityOf(alert) === severity) && (!kind || kindOf(alert) === kind),
      ),
    [alerts, severity, kind],
  );

  function describe(alert: Alert): { title: string; detail: string } {
    const amount = formatMoney(alert.amountCents, locale);
    switch (kindOf(alert)) {
      case "ANT_EXPENSE":
        return { title: alert.subject, detail: format(t.antDetail, { count: alert.count, amount }) };
      case "LOW_LIQUIDITY":
        return { title: t.liquidityTitle, detail: format(t.liquidityDetail, { amount }) };
      case "FAILED_STATEMENT":
        return { title: alert.subject, detail: t.failedDetail };
      default:
        return { title: alert.subject, detail: alert.reason };
    }
  }

  if (!alerts) {
    return <div className="card h-40 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {SEVERITIES.map((key) => {
          const count = alerts.filter((alert) => severityOf(alert) === key).length;
          const active = severity === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setSeverity(active ? null : key)}
              className={`card relative overflow-hidden p-5 text-left transition hover:-translate-y-0.5 ${
                active ? "ring-2 ring-blue" : ""
              }`}
            >
              <span
                aria-hidden
                className={`absolute -top-10 -right-10 size-28 rounded-full opacity-25 blur-2xl ${SEVERITY_STYLE[key].card}`}
              />
              <p className="text-sm text-muted">{t.severity[key]}</p>
              <p data-testid={`alerts-${key.toLowerCase()}`} className="mt-2 font-display text-3xl font-bold">
                {count}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[null, ...(Object.keys(KIND_ICON) as KindKey[])].map((key) => (
          <button
            key={key ?? "all"}
            type="button"
            onClick={() => setKind(key)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              kind === key ? "border-blue bg-blue text-white" : "border-line bg-surface text-muted hover:text-text"
            }`}
          >
            {key ? t.kinds[key] : t.all}
          </button>
        ))}
        {unseen.size > 0 && (
          <span className="ml-auto text-sm font-semibold text-violet">{format(t.unseen, { count: unseen.size })}</span>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="card p-10 text-center text-muted">{alerts.length === 0 ? t.empty : t.emptyFilter}</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((alert) => {
            const key = severityOf(alert);
            const Icon = Icons[KIND_ICON[kindOf(alert)]];
            const { title, detail } = describe(alert);
            return (
              <li key={alert.id} data-testid="alert-item" className="card relative flex animate-rise gap-4 overflow-hidden p-5 pl-7">
                <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 ${SEVERITY_STYLE[key].bar}`} />
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${SEVERITY_STYLE[key].badge}`}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[key].badge}`}>
                      {t.severity[key]}
                    </span>
                    <span className="text-xs font-semibold text-muted">{t.kinds[kindOf(alert)]}</span>
                    {unseen.has(alert.id) && (
                      <span className="rounded-full bg-violet px-2 py-0.5 text-xs font-semibold text-white">{t.isNew}</span>
                    )}
                  </div>
                  <p className="mt-1.5 truncate font-semibold">{title}</p>
                  <p className="text-sm text-muted">{detail}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>{formatMonth(alert.periodStart, locale)}</span>
                    {kindOf(alert) === "ANOMALY" && <span>{formatDate(alert.occurredOn, locale)}</span>}
                    {kindOf(alert) !== "FAILED_STATEMENT" && (
                      <Link
                        href={`/${locale}/app/dashboard?statement=${alert.statementId}`}
                        className="font-semibold text-blue hover:underline"
                      >
                        {t.viewAnalysis}
                      </Link>
                    )}
                  </p>
                </div>
                {kindOf(alert) !== "FAILED_STATEMENT" && (
                  <p className={`shrink-0 font-display text-lg font-bold ${alert.amountCents < 0n || key === "HIGH" ? "text-red" : ""}`}>
                    {formatMoney(alert.amountCents, locale)}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
