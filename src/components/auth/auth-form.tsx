"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icons } from "@/components/ui/icons";

type Mode = "login" | "register";
const MIN_PASSWORD = 10;

export function AuthForm({ mode }: { mode: Mode }) {
  const { locale, dictionary } = useI18n();
  const t = dictionary.auth;
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const initialError = params.get("error") as keyof typeof t.errors | null;
  const [error, setError] = useState<string | undefined>(
    initialError ? (t.errors[initialError] ?? t.errors.unavailable) : undefined,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (mode === "register" && String(data.password).length < MIN_PASSWORD) {
      setError(t.errors.invalid_argument);
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      if (!response.ok) {
        const { code } = (await response.json()) as { code: keyof typeof t.errors };
        setError(t.errors[code] ?? t.errors.unavailable);
        return;
      }
      // Only same-site paths, so a crafted ?next= cannot send the user elsewhere.
      const target = next?.startsWith(`/${locale}/app`) ? next : `/${locale}/app/dashboard`;
      router.replace(target);
      router.refresh();
    } catch {
      setError(t.errors.unavailable);
    } finally {
      setPending(false);
    }
  }

  const isLogin = mode === "login";
  return (
    // method and action keep credentials out of the URL even before JavaScript has loaded.
    <form method="post" action={`/api/auth/${mode}`} onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <h1 className="font-display text-4xl font-bold tracking-tight">
          {isLogin ? t.loginTitle : t.registerTitle}
        </h1>
        <p className="mt-2 text-muted">{isLogin ? t.loginSubtitle : t.registerSubtitle}</p>
      </div>
      {!isLogin && <Field label={t.fullName} name="fullName" autoComplete="name" required minLength={2} />}
      <Field label={t.email} name="email" type="email" autoComplete="email" required />
      <Field
        label={t.password}
        name="password"
        type="password"
        autoComplete={isLogin ? "current-password" : "new-password"}
        required
        minLength={isLogin ? 1 : MIN_PASSWORD}
        hint={isLogin ? undefined : t.passwordHint}
      />
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-red/10 px-4 py-3 text-sm text-red">
          <Icons.alert className="size-4 shrink-0" />
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full py-3.5 text-base">
        {pending ? "…" : isLogin ? t.submitLogin : t.submitRegister}
        {!pending && <Icons.arrow className="size-4" />}
      </Button>
      <p className="text-center text-sm text-muted">
        {isLogin ? t.noAccount : t.hasAccount}{" "}
        <Link
          href={`/${locale}/${isLogin ? "register" : "login"}`}
          className="font-semibold text-blue hover:underline"
        >
          {isLogin ? t.registerLink : t.loginLink}
        </Link>
      </p>
    </form>
  );
}
