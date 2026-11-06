import type { Page } from "../content/repository";
import type { SectionOf } from "../content/schemas/registry";
import { monthsBetween } from "./dates";
import { itemCount } from "./sections";

type StatItem = Pick<SectionOf<"stats">["items"][number], "value" | "override">;

/** The number a stat displays. An override wins; otherwise it is computed. */
export function resolveStat(stat: StatItem, page: Page, now: Date): number {
  if (stat.override !== undefined) return stat.override;
  const { value } = stat;
  switch (value.kind) {
    case "number":
      return value.n;
    case "yearsSince":
      return Math.floor(monthsBetween(value.date, "present", now) / 12);
    case "count": {
      const section = page.sections.find((s) => s.id === value.sectionId);
      return (section && itemCount(section)) ?? 0;
    }
  }
}
