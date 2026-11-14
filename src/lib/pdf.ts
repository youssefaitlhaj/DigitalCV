import { pathFor, type Locale } from "../i18n/locales";
import { anchorFor } from "./sections";
import type { Localized } from "../content/schemas/primitives";

/** A text as the PDF prints it: the short PDF version where that language has one, otherwise the full text. */
export function forPdf<T>(full: Localized<T>, short: Partial<Localized<T>> | undefined): Localized<T> {
  return { en: short?.en ?? full.en, de: short?.de ?? full.de };
}

/** The entries of a list that are marked "Show in PDF". */
export function pdfEntries<T extends { inPdf: boolean }>(items: readonly T[]): T[] {
  return items.filter((item) => item.inPdf);
}

/** A section on the website, in the PDF's language: where readers find the entries the PDF leaves out. */
export function sectionUrl(siteUrl: string, locale: Locale, sectionId: string): string {
  return new URL(`${pathFor(locale)}#${anchorFor(sectionId)}`, siteUrl).href;
}
