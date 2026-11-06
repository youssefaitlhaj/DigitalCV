import { z } from "zod";
import { localized, localizedRich } from "../primitives";
import { sectionBase } from "./base";

export const journeySchema = z.object({
  ...sectionBase,
  type: z.literal("journey"),
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
