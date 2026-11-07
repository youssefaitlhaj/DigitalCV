import { z } from "zod";
import { localized, localizedRich, optionalField } from "../primitives";
import { sectionBase } from "./base";

export const journeySchema = z.object({
  ...sectionBase,
  type: z.literal("journey"),
  /** Large headline above the track, e.g. "From Casablanca to Bamberg." `title` stays the menu label. */
  heading: optionalField(localized()),
  stops: z
    .array(
      z.object({
        year: localized(),
        heading: localized(),
        text: localizedRich,
        caption: z.string().trim().min(1),
        head: z.boolean().optional(),
      }),
    )
    .min(1),
});
