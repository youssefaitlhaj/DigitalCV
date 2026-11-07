import { z } from "zod";
import { localized, localizedRich, optionalField, yearOrMonth } from "../primitives";
import { sectionBase } from "./base";

/** Month index; a bare year is January when starting and December when ending. */
function monthIndex(value: string, edge: "start" | "end"): number {
  const [y, m] = value.split("-");
  return Number(y) * 12 + (m ? Number(m) - 1 : edge === "start" ? 0 : 11);
}

const item = z
  .object({
    title: localized(),
    org: z.string().trim().min(1),
    orgUrl: optionalField(z.url()),
    location: z.string().trim().min(1),
    employment: optionalField(z.enum(["full-time", "part-time", "internship"])),
    start: yearOrMonth,
    end: z.union([yearOrMonth, z.literal("present")]),
    description: optionalField(localizedRich),
    badge: optionalField(z.string().trim().min(1)),
  })
  .refine((i) => i.end === "present" || monthIndex(i.end, "end") >= monthIndex(i.start, "start"), {
    message: "End must not be before start",
    path: ["end"],
  });

export const timelineSchema = z.object({
  ...sectionBase,
  type: z.literal("timeline"),
  compact: z.boolean().default(false),
  items: z.array(item),
});
