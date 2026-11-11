"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Icons } from "@/components/ui/icons";
import { useRealtime } from "@/lib/realtime/realtime-provider";

interface Toast {
  id: number;
  title: string;
  body?: string | undefined;
  tone: "info" | "success" | "danger";
}

const TONES = {
  info: "border-blue/40 [&_svg]:text-blue",
  success: "border-green/40 [&_svg]:text-green",
  danger: "border-red/40 [&_svg]:text-red",
};
const TOAST_MS = 6000;

/** Shows live events and refreshes server rendered data when an analysis finishes. */
export function LiveToasts() {
  const { dictionary } = useI18n();
  const t = dictionary.app.realtime;
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);

  function push(toast: Omit<Toast, "id">) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current.slice(-3), { ...toast, id }]);
    setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), TOAST_MS);
  }

  const connected = useRealtime((event) => {
    if (event.type === "announcement") {
      push({ title: `${t.announcement}: ${event.title}`, body: event.body, tone: "info" });
    }
    if (event.type === "statement.status" && event.status === "COMPLETED") {
      push({ title: t.completed, tone: "success" });
      router.refresh();
    }
    if (event.type === "statement.status" && event.status === "FAILED") {
      push({ title: t.failed, body: event.failureReason, tone: "danger" });
    }
  });

  return (
    <>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
          connected ? "bg-green/15 text-green" : "bg-yellow/20 text-[#8a6a00] dark:text-yellow"
        }`}
      >
        <span className={`size-1.5 rounded-full ${connected ? "animate-pulse bg-green" : "bg-yellow"}`} />
        {connected ? t.connected : t.offline}
      </span>
      <div aria-live="polite" className="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`card flex animate-rise gap-3 border-l-4 p-4 ${TONES[toast.tone]}`}>
            <Icons.bolt className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.body && <p className="mt-0.5 text-sm text-muted">{toast.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
