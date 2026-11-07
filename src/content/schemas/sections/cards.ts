import { z } from "zod";
import { imageRef, localized, localizedRich, optionalField, yearOrMonth } from "../primitives";
import { sectionBase } from "./base";

const item = z.object({
  name: localized(),
  description: localizedRich,
  role: localized(),
  tech: z.array(z.string().trim().min(1)),
  start: optionalField(yearOrMonth),
  end: optionalField(z.union([yearOrMonth, z.literal("present")])),
  links: optionalField(z.object({ code: optionalField(z.url()), live: optionalField(z.url()) })),
  image: optionalField(imageRef),
  confidential: z.boolean().default(false),
});

export const cardsSchema = z.object({
  ...sectionBase,
  type: z.literal("cards"),
  items: z.array(item),
});
