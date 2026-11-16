"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { applyStoredTheme } from "./theme";

/**
 * Changing the language swaps the root layout, which rebuilds <html> and drops the theme.
 * Re-applying the saved choice before paint on every route keeps it without a flash.
 */
export function ThemeSync() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    applyStoredTheme();
  }, [pathname]);
  return null;
}
