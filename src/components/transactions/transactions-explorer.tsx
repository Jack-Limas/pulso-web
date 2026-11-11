"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { type Category, CategorySource, type Transaction, TransactionStatus, TransactionType } from "@/gen/pulso/v1/common_pb";
import { api } from "@/lib/api/browser";
import { formatDate, formatMoney } from "@/lib/format";
import { useRealtime } from "@/lib/realtime/realtime-provider";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;
const SOURCE_KEYS = {
  [CategorySource.RULE]: "RULE",
  [CategorySource.AI]: "AI",
  [CategorySource.USER]: "USER",
} as const;

type TypeFilter = "all" | "income" | "expense";

/** Fully client rendered: filters, paging and edits respond without a page reload. */
export function TransactionsExplorer() {
  const { locale, dictionary } = useI18n();
  const t = dictionary.app.transactions;
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [tokens, setTokens] = useState<string[]>([""]);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [next, setNext] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [notice, setNotice] = useState<string>();
  const [version, setVersion] = useState(0);
  const pageToken = tokens.at(-1) ?? "";

  useEffect(() => {
    void api.statements.listCategories({}).then((response) => setCategories(response.categories));
  }, []);

  // Waits until typing pauses, so each keystroke does not hit the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setTokens([""]);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    void api.statements
      .listTransactions({
        page: { pageSize: PAGE_SIZE, pageToken },
        ...(query ? { search: query } : {}),
        ...(type === "all" ? {} : { type: type === "income" ? TransactionType.INCOME : TransactionType.EXPENSE }),
      })
      .then((response) => {
        if (!cancelled) {
          setRows(response.transactions);
          setTotal(response.page?.totalCount ?? 0);
          setNext(response.page?.nextPageToken ?? "");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, type, pageToken, version]);

  useRealtime((event) => {
    if (event.type === "statement.status" && event.status === "COMPLETED") {
      setVersion((value) => value + 1);
    }
  });

  async function changeCategory(transaction: Transaction, categoryId: string) {
    const { transaction: updated } = await api.statements.updateTransactionCategory({
      transactionId: transaction.id,
      categoryId,
    });
    if (updated) {
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)));
      setNotice(t.saved);
      setTimeout(() => setNotice(undefined), 4000);
    }
  }

  const label = (code: string) => dictionary.categories[code as keyof typeof dictionary.categories] ?? code;
  const from = (tokens.length - 1) * PAGE_SIZE;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">{t.search}</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.search}
            className="w-full rounded-full border border-line bg-surface-2/60 px-4 py-2.5 text-sm outline-none focus:border-blue"
          />
        </label>
        <div className="flex rounded-full border border-line p-1 text-sm font-semibold">
          {(["all", "income", "expense"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setType(option);
                setTokens([""]);
              }}
              className={`rounded-full px-3 py-1.5 transition ${type === option ? "bg-blue text-white" : "text-muted"}`}
            >
              {option === "all" ? t.allTypes : option === "income" ? t.income : t.expense}
            </button>
          ))}
        </div>
      </div>
      {notice && <p className="bg-green/10 px-4 py-2 text-sm text-green">{notice}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="text-left text-xs text-muted uppercase">
            <tr>
              <th className="px-4 py-3">{t.date}</th>
              <th className="px-4 py-3">{t.description}</th>
              <th className="px-4 py-3">{t.category}</th>
              <th className="px-4 py-3 text-right">{t.amount}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => {
              const income = row.type === TransactionType.INCOME;
              return (
                <tr key={row.id} className="transition hover:bg-surface-2/50">
                  <td className="px-4 py-3 whitespace-nowrap text-muted">{formatDate(row.occurredOn, locale)}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{row.description}</p>
                    {row.status === TransactionStatus.FLAGGED && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-red/10 px-2 py-0.5 text-xs font-semibold text-red">
                        <Icons.alert className="size-3" />
                        {t.flagged}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {income ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          value={row.category?.id ?? ""}
                          onChange={(event) => void changeCategory(row, event.target.value)}
                          className="rounded-lg border border-line bg-surface px-2 py-1"
                          style={{ borderLeft: `4px solid ${row.category?.colorHex ?? "var(--line)"}` }}
                        >
                          {!row.category && <option value="">—</option>}
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {label(category.code)}
                            </option>
                          ))}
                        </select>
                        {row.categorySource !== undefined && (
                          <span className="text-xs text-muted">{t.source[SOURCE_KEYS[row.categorySource as keyof typeof SOURCE_KEYS] ?? "RULE"]}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-display font-bold ${income ? "text-green" : ""}`}>
                    {income ? "+" : "−"}
                    {formatMoney(row.amountCents, locale)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-10 text-center text-muted">{t.empty}</p>}
      </div>
      <div className="flex items-center justify-between border-t border-line p-4 text-sm text-muted">
        <span>
          {total === 0 ? 0 : from + 1}–{Math.min(from + PAGE_SIZE, total)} {t.of} {total}
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={tokens.length === 1} onClick={() => setTokens((list) => list.slice(0, -1))}>
            {t.previous}
          </Button>
          <Button variant="secondary" disabled={!next} onClick={() => setTokens((list) => [...list, next])}>
            {t.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
