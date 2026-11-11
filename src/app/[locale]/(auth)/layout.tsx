import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function AuthLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "es";
  const { landing } = getDictionary(locale);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-blue via-violet to-red p-12 text-white lg:flex lg:flex-col">
        <div aria-hidden className="grid-lines absolute inset-0 opacity-40" />
        <svg aria-hidden viewBox="0 0 600 200" className="absolute inset-x-0 top-1/2 w-full -translate-y-1/2 opacity-70">
          <polyline
            points="0,100 180,100 215,40 260,170 300,70 330,100 600,100"
            fill="none"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="120 260"
            className="animate-pulse-line"
          />
        </svg>
        <Link href={`/${locale}`} className="relative">
          <Logo size={40} className="[&_span]:text-white" />
        </Link>
        <div className="relative mt-auto">
          <p className="font-display text-5xl leading-tight font-bold">
            {landing.title1} {landing.title2}
            <br />
            {landing.title3}
          </p>
          <p className="mt-4 max-w-md text-white/80">{landing.privacy}</p>
        </div>
      </aside>
      <main className="aurora relative flex flex-col px-6 py-6">
        <div className="flex items-center justify-between">
          <Link href={`/${locale}`} className="lg:invisible">
            <Logo size={32} />
          </Link>
          <div className="flex gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="m-auto w-full max-w-md animate-rise py-10">
          <div className="card p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
