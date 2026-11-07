import { z } from "zod";
import { localized, month, optionalField, slugId } from "../primitives";
import { sectionBase } from "./base";

const statValue = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("number"), n: z.number() }),
  z.object({ kind: z.literal("yearsSince"), date: month }),
  z.object({ kind: z.literal("count"), sectionId: slugId }),
]);

export const statsSchema = z.object({
  ...sectionBase,
  type: z.literal("stats"),
  items: z
    .array(z.object({ label: localized(), value: statValue, override: optionalField(z.number()) }))
    .min(1)
    .max(4),
});
