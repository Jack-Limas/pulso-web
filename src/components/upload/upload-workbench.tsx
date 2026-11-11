"use client";

import { Code, ConnectError } from "@connectrpc/connect";
import { type DragEvent, useEffect, useRef, useState } from "react";
import { onINP } from "web-vitals";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import type { BankAccount, SupportedBank } from "@/gen/pulso/v1/bank_account_service_pb";
import { StatementStatus, TransactionType } from "@/gen/pulso/v1/common_pb";
import type { GetDashboardResponse } from "@/gen/pulso/v1/insights_service_pb";
import { ProcessingMode } from "@/gen/pulso/v1/statement_service_pb";
import { api } from "@/lib/api/browser";
import { formatMoney } from "@/lib/format";
import { format } from "@/lib/i18n/get-dictionary";
import { startFrameMonitor, usedHeapBytes } from "@/lib/metrics/frame-monitor";
import { useRealtime } from "@/lib/realtime/realtime-provider";
import { SAMPLE_STATEMENTS } from "@/lib/samples";
import { MAX_FILE_BYTES } from "@/lib/statements/pipeline";
import { type ProcessingMode as Mode, processInBrowser } from "@/lib/statements/run";
import { StatementError } from "@/lib/statements/types";
import { AccountPicker } from "./account-picker";
import { Heartbeat } from "./heartbeat";

const STEPS = [
  "received",
  "reading",
  "hashing",
  "extracting",
  "parsing",
  "sending",
  "RECEIVED",
  "PROCESSING",
  "ANALYZING",
  "CATEGORIZING",
  "DETECTING_ANOMALIES",
  "FINDING_PATTERNS",
  "FORECASTING",
  "RECOMMENDING",
  "COMPLETED",
] as const;
type Step = (typeof STEPS)[number];

// The socket is the fast path; polling is the safety net when an event is lost or late.
const POLL_INTERVAL_MS = 3000;

interface Metrics {
  mode: Mode;
  readMs: number;
  processingMs: number;
  apiMs: number;
  transactions: number;
  longestFrameMs: number;
  memoryBytes?: number | undefined;
}

export function UploadWorkbench({
  initialAccounts,
  banks,
}: {
  initialAccounts: BankAccount[];
  banks: SupportedBank[];
}) {
  const { locale, dictionary } = useI18n();
  const t = dictionary.app.upload;
  const [accounts, setAccounts] = useState(initialAccounts);
  const [accountId, setAccountId] = useState(initialAccounts[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>("worker");
  const [step, setStep] = useState<Step | null>(null);
  const [page, setPage] = useState<{ page: number; total: number }>();
  const [failed, setFailed] = useState<string>();
  const [metrics, setMetrics] = useState<Metrics>();
  const [inp, setInp] = useState<number>();
  const [dragging, setDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [summary, setSummary] = useState<GetDashboardResponse>();
  const statementId = useRef<string>(null);
  // Events can arrive before the upload response tells us the statement id, so none are dropped.
  const latestById = useRef(new Map<string, { step: Step; failed: boolean }>());
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => onINP((metric) => setInp(Math.round(metric.value)), { reportAllChanges: true }), []);

  function apply(update: { step: Step; failed: boolean }) {
    if (update.failed) {
      setFailed(t.stages.FAILED);
      return;
    }
    setStep((current) =>
      current && STEPS.indexOf(current) > STEPS.indexOf(update.step) ? current : update.step,
    );
  }

  const finished = step === "COMPLETED" || Boolean(failed);

  useEffect(() => {
    if (!activeId || finished) {
      return;
    }
    const timer = setInterval(() => {
      void api.statements
        .getStatement({ id: activeId })
        .then(({ statement }) => {
          const status = statement ? StatementStatus[statement.status] : undefined;
          if (status === "FAILED") {
            apply({ step: "COMPLETED", failed: true });
          } else if (status && STEPS.includes(status as Step)) {
            apply({ step: status as Step, failed: false });
          }
        })
        .catch(() => undefined);
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
    // apply only wraps state setters, so it never goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, finished]);

  useEffect(() => {
    if (activeId && step === "COMPLETED") {
      void api.insights.getDashboard({ statementId: activeId }).then(setSummary).catch(() => undefined);
    }
  }, [activeId, step]);

  useRealtime((event) => {
    if (event.type !== "statement.stage" && event.type !== "statement.status") {
      return;
    }
    const failedNow = event.type === "statement.status" && event.status === "FAILED";
    const step = (event.type === "statement.stage" ? event.stage : event.status) as Step;
    if (!failedNow && !STEPS.includes(step)) {
      return;
    }
    const previous = latestById.current.get(event.statementId);
    const update = {
      step: previous && STEPS.indexOf(previous.step) > STEPS.indexOf(step) ? previous.step : step,
      failed: failedNow || Boolean(previous?.failed),
    };
    latestById.current.set(event.statementId, update);
    if (event.statementId === statementId.current) {
      apply(update);
    }
  });

  function reset() {
    setStep(null);
    setFailed(undefined);
    setMetrics(undefined);
    setPage(undefined);
    setSummary(undefined);
    setActiveId(null);
    statementId.current = null;
  }

  async function handle(file: File) {
    reset();
    const account = accounts.find((item) => item.id === accountId);
    if (!account) {
      setFailed(t.chooseAccount);
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFailed(t.errors.TOO_LARGE);
      return;
    }
    setStep("received");
    const readStarted = performance.now();
    const buffer = await file.arrayBuffer();
    const readMs = Math.round(performance.now() - readStarted);

    const stopMonitor = startFrameMonitor();
    try {
      const result = await processInBrowser(mode, buffer, {
        onStage: setStep,
        onPage: (current, total) => setPage({ page: current, total }),
      });
      const longestFrameMs = stopMonitor();
      const { statement } = result;
      if (account.bank?.code !== statement.bankCode) {
        const bank = banks.find((item) => item.code === statement.bankCode)?.name ?? statement.bankCode;
        setFailed(format(t.wrongBank, { bank }));
        return;
      }

      setStep("sending");
      const memoryBytes = usedHeapBytes();
      const apiStarted = performance.now();
      const response = await api.statements.uploadStatement({
        bankAccountId: account.id,
        fileName: file.name,
        fileHash: result.fileHash,
        periodStart: statement.periodStart,
        periodEnd: statement.periodEnd,
        openingBalanceCents: statement.openingBalanceCents,
        closingBalanceCents: statement.closingBalanceCents,
        transactions: statement.transactions.map((transaction) => ({
          ...transaction,
          type: transaction.type === "INCOME" ? TransactionType.INCOME : TransactionType.EXPENSE,
        })),
        metrics: {
          mode: mode === "worker" ? ProcessingMode.WEB_WORKER : ProcessingMode.MAIN_THREAD,
          uploadMs: readMs,
          processingMs: result.processingMs,
          ...(memoryBytes ? { memoryBytes: BigInt(memoryBytes) } : {}),
        },
      });
      const id = response.statement?.id ?? null;
      statementId.current = id;
      setActiveId(id);
      apply(latestById.current.get(id ?? "") ?? { step: "RECEIVED", failed: false });
      setMetrics({
        mode,
        readMs,
        processingMs: result.processingMs,
        apiMs: Math.round(performance.now() - apiStarted),
        transactions: statement.transactions.length,
        longestFrameMs,
        memoryBytes,
      });
    } catch (error) {
      stopMonitor();
      if (error instanceof StatementError) {
        setFailed(t.errors[error.code]);
      } else if (error instanceof ConnectError && error.code === Code.AlreadyExists) {
        setFailed(t.errors.already_exists);
      } else {
        setFailed(t.errors.default);
      }
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      void handle(file);
    }
  }

  const busy = step !== null && step !== "COMPLETED" && !failed;
  const currentIndex = step ? STEPS.indexOf(step) : -1;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">{t.account}</h2>
          <AccountPicker
            accounts={accounts}
            banks={banks}
            selectedId={accountId}
            onSelect={setAccountId}
            onCreated={(account) => {
              setAccounts((current) => [...current, account]);
              setAccountId(account.id);
            }}
          />
        </section>

        <section className="card p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">{t.mode}</h2>
            <div role="radiogroup" className="flex rounded-full border border-line bg-surface-2/60 p-1 text-sm font-semibold">
              {(["worker", "main"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={mode === option}
                  disabled={busy}
                  onClick={() => setMode(option)}
                  className={`rounded-full px-4 py-1.5 transition ${
                    mode === option ? "bg-gradient-to-r from-blue to-violet text-white" : "text-muted"
                  }`}
                >
                  {option === "worker" ? t.worker : t.main}
                </button>
              ))}
            </div>
          </div>
          <p className="mb-5 text-sm text-muted">{t.modeHint}</p>

          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`group relative flex cursor-pointer flex-col items-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed p-12 text-center transition ${
              dragging ? "scale-[1.01] border-blue bg-blue/5" : "border-line hover:border-blue/60"
            }`}
          >
            <span className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-blue to-violet text-white shadow-[0_14px_30px_-12px_var(--blue)] transition group-hover:-translate-y-1">
              <Icons.upload className="size-7" />
            </span>
            <span className="font-display text-xl font-bold">{t.drop}</span>
            <span className="text-sm text-muted">{t.browse}</span>
            <span className="text-xs text-muted">{t.limit}</span>
            <input
              ref={input}
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handle(file);
                }
                event.target.value = "";
              }}
            />
          </label>
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            {t.samples}
            {banks.flatMap((bank) => {
              const href = SAMPLE_STATEMENTS[bank.code];
              return href
                ? [
                    <a
                      key={bank.code}
                      href={href}
                      download
                      className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 font-semibold text-blue hover:border-blue"
                    >
                      <Icons.upload className="size-3.5 rotate-180" />
                      {bank.name}
                    </a>,
                  ]
                : [];
            })}
          </p>
        </section>
      </div>

      <div className="space-y-6">
        <section className="card p-6">
          <div className="flex items-center gap-5">
            <Heartbeat />
            <div>
              <p data-testid="upload-status" className="font-display text-lg font-bold">
                {failed ? t.stages.FAILED : step ? t.stages[step] : t.drop}
              </p>
              {page && step === "extracting" && (
                <p className="text-sm text-muted">{format(t.page, page)}</p>
              )}
              {failed && <p className="mt-1 text-sm text-red">{failed}</p>}
            </div>
          </div>
          <ol className="mt-6 space-y-2">
            {STEPS.map((key, index) => {
              const done = index < currentIndex || step === "COMPLETED";
              const active = index === currentIndex && !failed && step !== "COMPLETED";
              return (
                <li key={key} className={`flex items-center gap-3 text-sm ${index > currentIndex && !done ? "text-muted/60" : ""}`}>
                  <span
                    className={`grid size-5 place-items-center rounded-full text-[10px] font-bold ${
                      done ? "bg-green text-white" : active ? "animate-pulse bg-blue text-white" : "bg-surface-2"
                    }`}
                  >
                    {done ? "✓" : ""}
                  </span>
                  {t.stages[key]}
                </li>
              );
            })}
          </ol>
          {step === "COMPLETED" && summary && (
            <div data-testid="upload-summary" className="mt-6 space-y-3 rounded-2xl bg-surface-2/60 p-4 text-sm">
              <p className="flex justify-between gap-2">
                <span className="text-muted">{dictionary.app.dashboard.expenses}</span>
                <span className="font-display font-bold">{formatMoney(summary.expenseCents, locale)}</span>
              </p>
              {summary.anomalies.slice(0, 3).map((anomaly) => (
                <p key={anomaly.transactionId} className="flex gap-2">
                  <Icons.alert className="mt-0.5 size-4 shrink-0 text-red" />
                  <span>
                    <span className="font-semibold">{anomaly.description}</span>{" "}
                    <span className="text-muted">{anomaly.reason}</span>
                  </span>
                </p>
              ))}
              {summary.recommendations.slice(0, 2).map((tip) => (
                <p key={tip.title} className="flex gap-2">
                  <Icons.sparkles className="mt-0.5 size-4 shrink-0 text-violet" />
                  <span>
                    <span className="font-semibold">{tip.title}.</span> <span className="text-muted">{tip.detail}</span>
                  </span>
                </p>
              ))}
            </div>
          )}
          {step === "COMPLETED" && (
            <div className="mt-6 flex flex-wrap gap-2">
              <ButtonLink href={`/${locale}/app/dashboard`}>{t.viewDashboard}</ButtonLink>
              <Button variant="secondary" onClick={() => input.current?.click()}>
                {t.another}
              </Button>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-display text-lg font-bold">{t.metrics}</h2>
          <dl data-testid="upload-metrics" className="grid grid-cols-2 gap-3 text-sm">
            {[
              [t.mode, metrics ? (metrics.mode === "worker" ? t.worker : t.main) : "—"],
              [t.metricTransactions, metrics?.transactions ?? "—"],
              [t.metricProcessing, metrics ? `${metrics.processingMs} ms` : "—"],
              [t.metricFrame, metrics ? `${metrics.longestFrameMs} ms` : "—"],
              [t.metricUpload, metrics ? `${metrics.apiMs} ms` : "—"],
              [t.metricInp, inp !== undefined ? `${inp} ms` : "—"],
              [t.metricMemory, metrics?.memoryBytes ? `${(metrics.memoryBytes / 1048576).toFixed(1)} MB` : "—"],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl bg-surface-2/60 p-3">
                <dt className="text-xs text-muted">{label}</dt>
                <dd
                  className={`mt-1 font-display text-lg font-bold ${
                    label === t.metricFrame && metrics && metrics.longestFrameMs > 200 ? "text-red" : ""
                  }`}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
