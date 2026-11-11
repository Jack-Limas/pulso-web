import { UploadWorkbench } from "@/components/upload/upload-workbench";
import { privateClients } from "@/lib/api/server";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// The shell and the user's accounts come from the server; reading the PDF is pure CSR,
// because Web Workers, File and requestAnimationFrame only exist in the browser.
export const dynamic = "force-dynamic";

export default async function UploadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "es";
  const t = getDictionary(locale).app.upload;
  const api = await privateClients(locale);
  const [{ accounts }, { banks }] = await Promise.all([
    api.bankAccounts.listBankAccounts({}),
    api.bankAccounts.listSupportedBanks({}),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-muted">{t.subtitle}</p>
      </div>
      <UploadWorkbench initialAccounts={accounts} banks={banks} />
    </div>
  );
}
