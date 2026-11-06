import de from "./de";
import en from "./en";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import type { Dictionaries, Dictionary } from "./types";

/**
 * The dictionary registry.
 *
 * Typing this as `Dictionaries` is what makes the whole scheme work: adding a
 * key to `Dictionary` breaks every locale that has not caught up, at compile
 * time, before anything reaches a page.
 */
const dictionaries: Dictionaries = { en, de };

export function useTranslations(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/** Substitutes `{name}` placeholders, e.g. the footer's `{year}`. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export { DEFAULT_LOCALE, LOCALES, dirFor, isLocale, pathFor, type Locale } from "./locales";
export type { Dictionary } from "./types";
