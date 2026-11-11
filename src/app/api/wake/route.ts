import { after, NextResponse } from "next/server";

export const maxDuration = 60;

const COLD_START_TIMEOUT_MS = 55_000;

// Free hosting puts the backends to sleep when idle. Vercel never sleeps, so a visit here wakes
// them in the background and they are ready by the time the visitor signs in.
function wakeTargets(): string[] {
  const urls = [process.env.API_URL, process.env.NEXT_PUBLIC_WS_URL, ...(process.env.WAKE_URLS ?? "").split(",")];
  const healthUrls = urls
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url))
    .map((url) => {
      const { protocol, host } = new URL(url.replace(/^ws/, "http"));
      return `${protocol}//${host}/health`;
    });
  return [...new Set(healthUrls)];
}

export function GET() {
  const targets = wakeTargets();
  after(() =>
    Promise.allSettled(
      targets.map((url) => fetch(url, { cache: "no-store", signal: AbortSignal.timeout(COLD_START_TIMEOUT_MS) })),
    ),
  );
  return NextResponse.json({ waking: targets.length }, { status: 202, headers: { "Cache-Control": "no-store" } });
}
