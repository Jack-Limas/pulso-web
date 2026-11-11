"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { type IconName, Icons } from "@/components/ui/icons";

export function AppNav({ isAdmin }: { isAdmin: boolean }) {
  const { locale, dictionary } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const items: { href: string; label: string; icon: IconName }[] = [
    { href: "dashboard", label: dictionary.nav.dashboard, icon: "home" },
    { href: "upload", label: dictionary.nav.upload, icon: "upload" },
    { href: "transactions", label: dictionary.nav.transactions, icon: "list" },
    ...(isAdmin ? [{ href: "admin", label: dictionary.nav.admin, icon: "shield" as const }] : []),
  ];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace(`/${locale}/login`);
    router.refresh();
  }

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon }) => {
        const Icon = Icons[icon];
        const target = `/${locale}/app/${href}`;
        const active = pathname.startsWith(target);
        return (
          <Link
            key={href}
            href={target}
            aria-current={active ? "page" : undefined}
            className={`group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-gradient-to-r from-blue to-violet text-white shadow-[0_10px_24px_-12px_var(--blue)]"
                : "text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={logout}
        className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-red/10 hover:text-red lg:mt-4"
      >
        <Icons.logout className="size-5" />
        {dictionary.nav.logout}
      </button>
    </nav>
  );
}
