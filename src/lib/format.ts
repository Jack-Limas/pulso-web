import type { Locale } from "./i18n/config";

const formatters = new Map<string, Intl.NumberFormat>();

/** Money travels as integer cents (bigint) and only becomes a decimal for display. */
export function formatMoney(cents: bigint | number, locale: Locale): string {
  const key = `money-${locale}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale === "es" ? "es-CO" : "en-US", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(Number(cents) / 100);
}

export function formatDate(isoDate: string, locale: Locale): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatMonth(isoDate: string, locale: Locale): string {
  const label = new Date(`${isoDate}T00:00:00`).toLocaleDateString(locale === "es" ? "es-CO" : "en-US", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
