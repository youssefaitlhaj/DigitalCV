import { z } from "zod";
import { imageRef, localized, localizedRich, yearOrMonth } from "../primitives";
import { sectionBase } from "./base";

const item = z.object({
  name: localized(),
  description: localizedRich,
  role: localized(),
  tech: z.array(z.string().trim().min(1)),
  start: yearOrMonth.optional(),
  end: z.union([yearOrMonth, z.literal("present")]).optional(),
  links: z.object({ code: z.url().optional(), live: z.url().optional() }).optional(),
  image: imageRef.optional(),
  confidential: z.boolean().default(false),
});

export const cardsSchema = z.object({
  ...sectionBase,
  type: z.literal("cards"),
  items: z.array(item),
});
