import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { TiltCard } from "@/components/ui/tilt-card";
import { StatementStatus } from "@/gen/pulso/v1/common_pb";
import { privateClients } from "@/lib/api/server";
import { formatMoney, formatMonth } from "@/lib/format";
import { isLocale } from "@/lib/i18n/config";
import { format, getDictionary } from "@/lib/i18n/get-dictionary";

// SSR: the list belongs to the signed-in user, so it renders on every request.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

const BADGES = {
  COMPLETED: "bg-green/15 text-green",
  FAILED: "bg-red/10 text-red",
  PENDING: "bg-blue/10 text-blue",
} as const;

export default async function StatementsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "es";
  const dictionary = getDictionary(locale);
  const t = dictionary.app.statements;
  const api = await privateClients(locale);
  const [{ statements }, { accounts }] = await Promise.all([
    api.statements.listStatements({ page: { pageSize: PAGE_SIZE } }),
    api.bankAccounts.listBankAccounts({}),
  ]);
  const accountById = new Map(accounts.map((account) => [account.id, account]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-muted">{t.subtitle}</p>
      </div>

      {statements.length === 0 ? (
        <section className="card flex flex-col items-center gap-4 p-14 text-center">
          <LogoMark size={80} className="animate-float" />
          <p className="text-muted">{t.empty}</p>
          <ButtonLink href={`/${locale}/app/upload`}>
            <Icons.upload className="size-4" />
            {dictionary.nav.upload}
          </ButtonLink>
        </section>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {statements.map((statement) => {
            const account = accountById.get(statement.bankAccountId);
            const state =
              statement.status === StatementStatus.COMPLETED
                ? "COMPLETED"
                : statement.status === StatementStatus.FAILED
                  ? "FAILED"
                  : "PENDING";
            const net = statement.closingBalanceCents - statement.openingBalanceCents;
            return (
              <li key={statement.id}>
                <TiltCard className="group flex h-full flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-2xl font-bold">{formatMonth(statement.periodStart, locale)}</p>
                      <p className="text-sm text-muted">
                        {account?.alias} · {account?.bank?.name}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${BADGES[state]}`}>
                      {t.status[state]}
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="text-sm text-muted">
                      {format(t.transactions, { count: statement.transactionCount })}
                    </p>
                    <p className={`font-display text-lg font-bold ${net < 0n ? "text-red" : "text-green"}`}>
                      {net < 0n ? "−" : "+"}
                      {formatMoney(net < 0n ? -net : net, locale)}
                    </p>
                  </div>
                  {state === "COMPLETED" && (
                    <Link
                      href={`/${locale}/app/dashboard?statement=${statement.id}`}
                      className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-blue"
                    >
                      {t.open}
                      <Icons.arrow className="size-4 transition group-hover:translate-x-1" />
                    </Link>
                  )}
                </TiltCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
