"use client";

import { useEffect } from "react";

const SESSION_KEY = "pulso-woken";

/** Asks the server to wake the sleeping backends once per browser tab session. */
export function WakeServers() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) {
        return;
      }
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Without storage the ping simply runs on every page load, which is harmless.
    }
    void fetch("/api/wake", { cache: "no-store" }).catch(() => undefined);
  }, []);
  return null;
}
