import { TransactionsExplorer } from "@/components/transactions/transactions-explorer";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// CSR: the server only sends the title; the table loads and updates in the browser.
export default async function TransactionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const t = getDictionary(isLocale(raw) ? raw : "es").app.transactions;
  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">{t.title}</h1>
      <TransactionsExplorer />
    </div>
  );
}
