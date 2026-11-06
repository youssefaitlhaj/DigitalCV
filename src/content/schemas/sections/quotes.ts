import { z } from "zod";
import { imageRef, localized, localizedRich } from "../primitives";
import { sectionBase } from "./base";

export const quotesSchema = z.object({
  ...sectionBase,
  type: z.literal("quotes"),
  items: z.array(
    z.object({
      quote: localizedRich,
      name: z.string().trim().min(1),
      role: localized(),
      photo: imageRef.optional(),
    }),
  ),
});
