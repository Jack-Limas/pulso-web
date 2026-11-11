"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES } from "@/lib/i18n/config";
import { useI18n } from "./i18n-provider";

export function LocaleSwitcher() {
  const { locale, dictionary } = useI18n();
  const pathname = usePathname();
  const rest = pathname.split("/").slice(2).join("/");

  return (
    <nav
      aria-label={dictionary.nav.language}
      className="flex rounded-full border border-line bg-surface p-1 text-xs font-semibold"
    >
      {LOCALES.map((option) => (
        <Link
          key={option}
          href={`/${option}${rest ? `/${rest}` : ""}`}
          aria-current={option === locale ? "true" : undefined}
          className={`rounded-full px-2.5 py-1 uppercase transition ${
            option === locale ? "bg-blue text-white" : "text-muted hover:text-text"
          }`}
        >
          {option}
        </Link>
      ))}
    </nav>
  );
}
