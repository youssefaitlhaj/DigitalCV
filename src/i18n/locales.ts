/** The two locales the site ships in. */
export const LOCALES = ["en", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Both scripts run left to right, so this is constant today. It stays as a
 * function because layout is written with CSS logical properties throughout —
 * adding an RTL locale later is a data change here, not a restyle.
 */
export function dirFor(_locale: Locale): "ltr" | "rtl" {
  return "ltr";
}

/**
 * Path prefix for a locale. The default locale lives at the root, so it has
 * no prefix — `prefixDefaultLocale: false` in the Astro config must agree.
 */
export function pathFor(locale: Locale, path = "/"): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === "/" ? `/${locale}/` : `/${locale}${path}`;
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
