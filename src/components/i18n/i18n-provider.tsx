"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { Dictionary, Locale } from "@/lib/i18n/get-dictionary";

interface I18nValue {
  locale: Locale;
  dictionary: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children, ...value }: I18nValue & { children: ReactNode }) {
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
}
