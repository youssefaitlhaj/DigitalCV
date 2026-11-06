import type { Dictionary } from "../i18n/types";
import type { Locale } from "../i18n/locales";
import type { Role } from "../content/schema";

/**
 * Date and duration formatting for the timeline.
 *
 * Everything is computed at build time. That is fine for fixed ranges, but it
 * means an open-ended role's duration ("6 mos") is only as fresh as the last
 * deploy — rebuild periodically, or it quietly drifts.
 */

/** Parses `YYYY-MM` into a UTC date at the first of that month. */
function parseMonth(value: string): Date {
  const [year, month] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

function resolve(value: string, now: Date): Date {
  return value === "present" ? now : parseMonth(value);
}

/** e.g. "Feb 2026" / "Feb. 2026" */
export function formatMonth(value: string, locale: Locale, t: Dictionary): string {
  if (value === "present") return t.experience.present;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseMonth(value));
}

/** e.g. "Aug 2019 — Jan 2026" */
export function formatRange(role: Role, locale: Locale, t: Dictionary): string {
  const start = formatMonth(role.start, locale, t);
  const end = formatMonth(role.end, locale, t);
  return `${start} — ${end}`;
}

/**
 * Whole months between start and end, counted inclusively so that a role
 * running Mar–May reads as 3 months, matching how LinkedIn presents it.
 */
export function monthsBetween(role: Role, now = new Date()): number {
  const start = parseMonth(role.start);
  const end = resolve(role.end, now);
  const months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth()) +
    1;
  return Math.max(months, 1);
}

/** e.g. "6 yrs 6 mos", "4 mos", "1 yr" — omits any zero part. */
export function formatDuration(role: Role, t: Dictionary, now = new Date()): string {
  const total = monthsBetween(role, now);
  const years = Math.floor(total / 12);
  const months = total % 12;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? t.experience.year : t.experience.years}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? t.experience.month : t.experience.months}`);
  return parts.join(" ");
}

/** `datetime` value for `<time>`, so the markup carries machine-readable dates. */
export function isoFor(value: string, now = new Date()): string {
  return value === "present"
    ? now.toISOString().slice(0, 7)
    : value;
}
