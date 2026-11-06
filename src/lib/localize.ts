import type { Locale } from "../i18n/locales";
import type { Localized } from "../content/schemas/primitives";

/** Select the value for a locale from a `{ en, de }` pair. */
export function pick<T>(value: Localized<T>, locale: Locale): T {
  return value[locale];
}
