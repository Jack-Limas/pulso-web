import type { Locale } from "./config";
import { en } from "./dictionaries/en";
import { type Dictionary, es } from "./dictionaries/es";

const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

/** Replaces {name} placeholders: format("{count} times", { count: 3 }). */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`));
}

export type { Dictionary, Locale };
