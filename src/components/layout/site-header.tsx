import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import type { Dictionary, Locale } from "@/lib/i18n/get-dictionary";

export function SiteHeader({ locale, dictionary }: { locale: Locale; dictionary: Dictionary }) {
  const { nav } = dictionary;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href={`/${locale}`} className="shrink-0">
          <Logo size={32} />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <Link href={`/${locale}#features`} className="hover:text-text">
            {nav.features}
          </Link>
          <Link href={`/${locale}#how`} className="hover:text-text">
            {nav.howItWorks}
          </Link>
          <Link href={`/${locale}/banks`} className="hover:text-text">
            {nav.banks}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LocaleSwitcher />
          <ThemeToggle />
          <Link
            href={`/${locale}/login`}
            className="hidden px-3 text-sm font-semibold text-muted hover:text-text sm:block"
          >
            {nav.login}
          </Link>
          <ButtonLink href={`/${locale}/register`} className="hidden sm:inline-flex">
            {nav.start}
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
