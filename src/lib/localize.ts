import type { Locale } from "../i18n/locales";
import type { Localized } from "../content/schemas/primitives";

/** Select the value for a locale from a `{ en, de }` pair. */
export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}

/** A proper noun stays a plain string; anything else is a `{ en, de }` pair. */
export function pickText(value: string | Localized, locale: Locale): string {
  return typeof value === "string" ? value : pick(value, locale);
}
