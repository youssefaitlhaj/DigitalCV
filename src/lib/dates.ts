import type { Locale } from "../i18n/locales";
import type { Site } from "../content/schemas/site";
import { pick } from "./localize";

/**
 * Date and duration formatting. All wording comes from the site labels, so
 * nothing here depends on a hard-coded dictionary.
 *
 * Computed at build time: an open-ended range's duration is only as fresh as
 * the last deploy.
 */

type Labels = Site["labels"];

/** Parses `YYYY` or `YYYY-MM` to a UTC date. A bare year maps to January or December. */
function parse(value: string, edge: "start" | "end"): Date {
  const [year, month] = value.split("-").map(Number);
  const m = month ?? (edge === "start" ? 1 : 12);
  return new Date(Date.UTC(year, m - 1, 1));
}

function resolve(value: string, edge: "start" | "end", now: Date): Date {
  return value === "present" ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)) : parse(value, edge);
}

/** Whole months between start and end, inclusive, minimum 1 (Mar-May is 3). */
export function monthsBetween(start: string, end: string | "present", now: Date): number {
  const s = resolve(start, "start", now);
  const e = resolve(end, "end", now);
  const months =
    (e.getUTCFullYear() - s.getUTCFullYear()) * 12 + (e.getUTCMonth() - s.getUTCMonth()) + 1;
  return Math.max(months, 1);
}

/** e.g. "Aug 2019" / "Aug. 2019"; a bare year prints alone; "present" uses the label. */
export function formatMonth(value: string, locale: Locale, labels: Pick<Labels, "present">): string {
  if (value === "present") return pick(labels.present, locale);
  if (/^\d{4}$/.test(value)) return value;
  return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric", timeZone: "UTC" }).format(
    parse(value, "start"),
  );
}

/** e.g. "6 yrs 6 mos", "10 mos", "1 yr" — omits any zero part. */
export function formatDuration(
  months: number,
  locale: Locale,
  labels: Pick<Labels, "year" | "years" | "month" | "months">,
): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${pick(years === 1 ? labels.year : labels.years, locale)}`);
  if (rest > 0) parts.push(`${rest} ${pick(rest === 1 ? labels.month : labels.months, locale)}`);
  return parts.join(" ");
}

/** `datetime` value for `<time>`: `YYYY-MM`, with "present" meaning the current month. */
export function isoFor(value: string, now: Date = new Date()): string {
  return value === "present" ? now.toISOString().slice(0, 7) : value;
}
