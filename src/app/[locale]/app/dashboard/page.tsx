import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { CashflowBars, CATEGORY_COLORS, CategoryDonut } from "@/components/dashboard/charts";
import { EmptyNote, Panel, StatCard } from "@/components/dashboard/panel";
import { ButtonLink } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { privateClients } from "@/lib/api/server";
import { formatDate, formatMoney } from "@/lib/format";
import { isLocale } from "@/lib/i18n/config";
import { format, getDictionary } from "@/lib/i18n/get-dictionary";

// SSR: the dashboard is built on the server for each request with the user's own data.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ account?: string }>;
}) {
  const { locale: raw } = await params;
  const { account } = await searchParams;
  const locale = isLocale(raw) ? raw : "es";
  const dictionary = getDictionary(locale);
  const t = dictionary.app.dashboard;
  const api = await privateClients(locale);
  const [{ accounts }, dashboard] = await Promise.all([
    api.bankAccounts.listBankAccounts({}),
    api.insights.getDashboard(account ? { bankAccountId: account } : {}),
  ]);
  const money = (cents: bigint) => formatMoney(cents, locale);
  const hasData = dashboard.incomeCents > 0n || dashboard.expenseCents > 0n;
  const forecast = dashboard.forecast;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-muted">
            {t.subtitle}
            <span className="rounded-full bg-blue/10 px-2 py-0.5 text-xs font-semibold text-blue">{t.live}</span>
          </p>
        </div>
        {accounts.length > 1 && (
          <nav className="ml-auto flex flex-wrap gap-2 text-sm">
            {[{ id: "", alias: t.allAccounts }, ...accounts].map((item) => {
              const active = (account ?? "") === item.id;
              return (
                <Link
                  key={item.id || "all"}
                  href={`/${locale}/app/dashboard${item.id ? `?account=${item.id}` : ""}`}
                  className={`rounded-full border px-3 py-1.5 font-semibold transition ${
                    active ? "border-blue bg-blue text-white" : "border-line bg-surface text-muted hover:text-text"
                  }`}
                >
                  {item.alias}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {!hasData ? (
        <section className="card flex flex-col items-center gap-4 p-14 text-center">
          <LogoMark size={88} className="animate-float" />
          <h2 className="font-display text-2xl font-bold">{t.empty}</h2>
          <p className="max-w-md text-muted">{t.emptyBody}</p>
          <ButtonLink href={`/${locale}/app/upload`}>
            <Icons.upload className="size-4" />
            {dictionary.nav.upload}
          </ButtonLink>
        </section>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label={t.balance} value={money(dashboard.balanceCents)} accent="bg-blue" />
            <StatCard label={t.income} value={money(dashboard.incomeCents)} accent="bg-green" delay={60} />
            <StatCard label={t.expenses} value={money(dashboard.expenseCents)} accent="bg-red" delay={120} />
            <StatCard
              label={t.net}
              value={money(dashboard.incomeCents - dashboard.expenseCents)}
              accent="bg-violet"
              delay={180}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title={t.byCategory} icon="chart" className="xl:col-span-2">
              <div className="grid items-center gap-6 md:grid-cols-[1fr_1fr]">
                <CategoryDonut
                  total={money(dashboard.expenseCents)}
                  slices={dashboard.categoryTotals.map((total) => ({
                    code: total.categoryCode,
                    label: dictionary.categories[total.categoryCode as keyof typeof dictionary.categories] ?? total.categoryCode,
                    value: Number(total.totalCents),
                  }))}
                />
                <ul className="space-y-3">
                  {dashboard.categoryTotals.map((total) => {
                    const share = Number((total.totalCents * 1000n) / (dashboard.expenseCents || 1n)) / 10;
                    const color = CATEGORY_COLORS[total.categoryCode] ?? CATEGORY_COLORS.other;
                    return (
                      <li key={total.categoryCode}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full" style={{ background: color }} />
                            {dictionary.categories[total.categoryCode as keyof typeof dictionary.categories] ??
                              total.categoryCode}
                          </span>
                          <span className="font-semibold">{money(total.totalCents)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full" style={{ width: `${share}%`, background: color }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Panel>

            <Panel title={t.liquidity} icon="trend" tone="text-violet bg-violet/10">
              <p className="text-sm text-muted">{t.current}</p>
              <p className="font-display text-3xl font-bold">{money(forecast?.currentCents ?? 0n)}</p>
              <div className="my-5 h-px bg-line" />
              <p className="text-sm text-muted">{t.projected}</p>
              <p
                className={`font-display text-3xl font-bold ${
                  (forecast?.projectedCents ?? 0n) < 0n ? "text-red" : "text-gradient"
                }`}
              >
                {money(forecast?.projectedCents ?? 0n)}
              </p>
              <p className="mt-4 flex items-center gap-2 text-sm">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    (forecast?.dailyTrendCents ?? 0n) < 0n ? "bg-red/10 text-red" : "bg-green/10 text-green"
                  }`}
                >
                  {money(forecast?.dailyTrendCents ?? 0n)}
                </span>
                <span className="text-muted">{t.trend}</span>
              </p>
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title={t.cashflow} icon="chart" tone="text-green bg-green/10">
              <CashflowBars
                data={[
                  { label: t.income, value: Number(dashboard.incomeCents), color: "#00b37e" },
                  { label: t.expenses, value: Number(dashboard.expenseCents), color: "#ff2e4d" },
                  { label: t.projected, value: Math.max(0, Number(forecast?.projectedCents ?? 0n)), color: "#7a3cff" },
                ]}
              />
            </Panel>

            <Panel title={t.anomalies} icon="alert" tone="text-red bg-red/10" className="xl:col-span-2">
              {dashboard.anomalies.length === 0 ? (
                <EmptyNote>{t.none}</EmptyNote>
              ) : (
                <ul className="divide-y divide-line">
                  {dashboard.anomalies.map((anomaly) => (
                    <li key={anomaly.transactionId} className="flex gap-4 py-3">
                      <span className="mt-1 size-2 shrink-0 animate-pulse rounded-full bg-red" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{anomaly.description}</p>
                        <p className="text-sm text-muted">{anomaly.reason}</p>
                      </div>
                      <p className="font-display font-bold text-red">{money(anomaly.amountCents)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel title={t.ant} icon="coffee" tone="text-[#8a6a00] bg-yellow/25 dark:text-yellow">
              {dashboard.antExpenses.length === 0 ? (
                <EmptyNote>{t.none}</EmptyNote>
              ) : (
                <ul className="space-y-3">
                  {dashboard.antExpenses.map((ant) => (
                    <li key={ant.merchant} className="rounded-xl bg-surface-2/60 p-4">
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold">{ant.merchant}</p>
                        <p className="font-display font-bold">{money(ant.totalCents)}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {format(t.times, { count: ant.count })} · {money(ant.averageCents)} {t.average} ·{" "}
                        {formatDate(ant.periodStart, locale)} – {formatDate(ant.periodEnd, locale)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title={t.recurring} icon="repeat" tone="text-violet bg-violet/10">
              {dashboard.recurringExpenses.length === 0 ? (
                <EmptyNote>{t.none}</EmptyNote>
              ) : (
                <ul className="divide-y divide-line">
                  {dashboard.recurringExpenses.map((item) => (
                    <li key={item.merchant} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold">{item.merchant}</p>
                        <p className="text-xs text-muted">{format(t.every, { days: item.intervalDays })}</p>
                      </div>
                      <p className="font-display font-bold">{money(item.averageCents)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            <Panel title={t.advice} icon="sparkles" tone="text-blue bg-gradient-to-br from-blue/15 to-red/15">
              {dashboard.recommendations.length === 0 ? (
                <EmptyNote>{t.none}</EmptyNote>
              ) : (
                <ul className="space-y-3">
                  {dashboard.recommendations.map((tip) => (
                    <li key={tip.title} className="rounded-xl border border-line p-4">
                      <p className="font-semibold">{tip.title}</p>
                      <p className="mt-1 text-sm text-muted">{tip.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
