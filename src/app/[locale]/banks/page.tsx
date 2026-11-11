import { LogoMark } from "@/components/brand/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { TiltCard } from "@/components/ui/tilt-card";
import { publicClients } from "@/lib/api/server";
import { isLocale } from "@/lib/i18n/config";
import { SAMPLE_STATEMENTS } from "@/lib/samples";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// ISR: served from the cache and rebuilt in the background at most once an hour, so a bank
// added by an admin appears without redeploying the site.
export const revalidate = 3600;

async function loadBanks() {
  try {
    const { banks } = await publicClients().bankAccounts.listSupportedBanks({});
    return banks;
  } catch {
    // The free API sleeps; an empty page now is better than a failed build.
    return [];
  }
}

export default async function BanksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "es";
  const dictionary = getDictionary(locale);
  const banks = await loadBanks();
  const generatedAt = new Date().toLocaleString(locale === "es" ? "es-CO" : "en-US", {
    timeZone: "America/Bogota",
  });

  return (
    <div className="aurora min-h-dvh">
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-display text-5xl font-bold tracking-tight">{dictionary.banks.title}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{dictionary.banks.subtitle}</p>
        {banks.length === 0 ? (
          <p className="card mt-10 p-6 text-muted">{dictionary.banks.empty}</p>
        ) : (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {banks.map((bank) => (
              <li key={bank.id}>
                <TiltCard className="group flex items-center gap-4 p-6">
                  <LogoMark size={44} />
                  <div>
                    <p className="font-display text-xl font-bold">{bank.name}</p>
                    <p className="font-mono text-xs text-muted">{bank.code}</p>
                    {SAMPLE_STATEMENTS[bank.code] && (
                      <a href={SAMPLE_STATEMENTS[bank.code]} download className="mt-2 inline-block text-sm font-semibold text-blue hover:underline">
                        {dictionary.banks.sample}
                      </a>
                    )}
                  </div>
                </TiltCard>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter made={dictionary.footer.made} note={`${dictionary.banks.updated} ${generatedAt}`} />
    </div>
  );
}
