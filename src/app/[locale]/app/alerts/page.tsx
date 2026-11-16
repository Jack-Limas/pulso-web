import { AlertsCenter } from "@/components/alerts/alerts-center";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// CSR inside the private shell: alerts refresh live when an analysis finishes.
export default async function AlertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const t = getDictionary(isLocale(raw) ? raw : "es").app.alerts;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-muted">{t.subtitle}</p>
      </div>
      <AlertsCenter />
    </div>
  );
}
