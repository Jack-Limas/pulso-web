import Link from "next/link";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app/app-nav";
import { LiveToasts } from "@/components/app/live-toasts";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Role } from "@/gen/pulso/v1/auth_service_pb";
import { privateClients } from "@/lib/api/server";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { RealtimeProvider } from "@/lib/realtime/realtime-provider";

// SSR: everything under /app depends on who is signed in, so it renders on each request.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : "es";
  const dictionary = getDictionary(locale);
  const { auth } = await privateClients(locale);
  const { user } = await auth.getCurrentUser({});
  const firstName = user?.fullName.split(" ")[0] ?? "";

  return (
    <RealtimeProvider url={process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws"}>
      <div className="aurora min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-line bg-surface/70 p-4 backdrop-blur-xl lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0 lg:p-6">
          <div className="mb-4 flex items-center justify-between lg:mb-10">
            <Link href={`/${locale}`}>
              <Logo size={32} />
            </Link>
          </div>
          <AppNav isAdmin={user?.role === Role.ADMIN} />
        </aside>
        <div className="min-w-0">
          <header className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-8">
            <p className="text-sm text-muted">
              {dictionary.app.greeting}, <span className="font-semibold text-text">{firstName}</span>
            </p>
            <div className="ml-auto flex items-center gap-2">
              <LiveToasts />
              <LocaleSwitcher />
              <ThemeToggle />
            </div>
          </header>
          <main className="px-4 pb-16 sm:px-8">{children}</main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
