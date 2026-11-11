import { HeroVisual } from "@/components/landing/hero-visual";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { type IconName, Icons } from "@/components/ui/icons";
import { TiltCard } from "@/components/ui/tilt-card";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

// SSG: content never changes per user, so both locales are rendered once at build time.
export const dynamic = "force-static";

const FEATURE_STYLE: { icon: IconName; tone: string }[] = [
  { icon: "coffee", tone: "from-yellow/40 to-yellow/5 text-[#8a6a00] dark:text-yellow" },
  { icon: "alert", tone: "from-red/30 to-red/5 text-red" },
  { icon: "repeat", tone: "from-violet/30 to-violet/5 text-violet" },
  { icon: "trend", tone: "from-blue/30 to-blue/5 text-blue" },
  { icon: "sparkles", tone: "from-red/25 via-violet/20 to-blue/10 text-violet" },
  { icon: "bolt", tone: "from-green/30 to-green/5 text-green" },
];

const STEP_ICONS: IconName[] = ["upload", "cpu", "sparkles", "chart"];

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "es";
  const dictionary = getDictionary(locale);
  const { landing } = dictionary;
  const app = `/${locale}/register`;

  return (
    <div className="aurora min-h-dvh overflow-x-clip">
      <SiteHeader locale={locale} dictionary={dictionary} />

      <main>
        <section className="relative">
          <div aria-hidden className="grid-lines absolute inset-0 -z-10" />
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
            <div className="animate-rise">
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-semibold text-muted backdrop-blur">
                <span className="size-2 animate-pulse rounded-full bg-green" />
                {landing.badge}
              </p>
              <h1 className="mt-6 font-display text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl lg:text-7xl">
                {landing.title1} <span className="text-gradient">{landing.title2}</span>
                <br />
                {landing.title3}
              </h1>
              <p className="mt-6 max-w-xl text-lg text-muted">{landing.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={app} className="px-7 py-3.5 text-base">
                  {landing.cta}
                  <Icons.arrow className="size-4 transition group-hover:translate-x-1" />
                </ButtonLink>
                <ButtonLink href={`/${locale}#how`} variant="secondary" className="px-7 py-3.5 text-base">
                  {landing.secondary}
                </ButtonLink>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted">
                <Icons.shield className="size-4 text-green" />
                {landing.privacy}
              </p>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
                {landing.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="font-display text-3xl font-bold">{stat.value}</dt>
                    <dd className="mt-1 text-xs text-muted">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="flex justify-center">
              <HeroVisual
                notes={[
                  {
                    label: landing.features[0]!.title,
                    value: "$87.500",
                    tone: "yellow",
                    className: "top-[8%] left-0",
                  },
                  {
                    label: landing.features[1]!.title,
                    value: "NETFLIX ×2",
                    tone: "red",
                    className: "right-0 bottom-[14%] [animation-delay:-2s]",
                  },
                  {
                    label: landing.features[3]!.title,
                    value: "+$1.240.000",
                    tone: "blue",
                    className: "bottom-0 left-[10%] [animation-delay:-4s]",
                  },
                ]}
              />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20">
          <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight">
            {landing.featuresTitle}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {landing.features.map((feature, index) => {
              const { icon, tone } = FEATURE_STYLE[index]!;
              const Icon = Icons[icon];
              return (
                <TiltCard key={feature.title} className="group p-6">
                  <span
                    className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${tone}`}
                  >
                    <Icon className="size-6" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
                </TiltCard>
              );
            })}
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-y border-line bg-surface/50 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-4xl font-bold tracking-tight">{landing.howTitle}</h2>
            <ol className="relative mt-12 grid gap-8 md:grid-cols-4">
              <div
                aria-hidden
                className="absolute top-7 right-[12%] left-[12%] hidden h-0.5 bg-gradient-to-r from-blue via-violet to-red md:block"
              />
              {landing.steps.map((step, index) => {
                const Icon = Icons[STEP_ICONS[index]!];
                return (
                  <li key={step.title} className="relative text-center">
                    <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-blue to-violet text-white shadow-[0_12px_30px_-10px_var(--blue)]">
                      <Icon className="size-6" />
                      <span className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-yellow font-display text-xs font-bold text-[#3a2c00]">
                        {index + 1}
                      </span>
                    </span>
                    <h3 className="mt-5 font-display text-lg font-bold">{step.title}</h3>
                    <p className="mt-1 text-sm text-muted">{step.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue via-violet to-red p-10 text-white sm:p-14">
            <div aria-hidden className="grid-lines absolute inset-0 opacity-30" />
            <h2 className="relative max-w-xl font-display text-4xl font-bold tracking-tight">
              {landing.finalTitle}
            </h2>
            <ButtonLink
              href={app}
              variant="secondary"
              className="relative mt-8 border-white/30 bg-white px-7 py-3.5 text-base text-[#0b1030]"
            >
              {landing.finalCta}
              <Icons.arrow className="size-4" />
            </ButtonLink>
          </div>
        </section>
      </main>

      <SiteFooter made={dictionary.footer.made} note={dictionary.footer.rendering} />
    </div>
  );
}
