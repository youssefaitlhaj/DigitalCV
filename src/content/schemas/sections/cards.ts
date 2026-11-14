import { z } from "zod";
import { imageRef, localized, localizedRich, optionalField, richText, yearOrMonth } from "../primitives";
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
  /** Shown in the PDF CV; the website always shows every project. */
  inPdf: z.boolean().default(true),
  /** A shorter text for the PDF, per language; a language left empty prints the full description. */
  pdfDescription: optionalField(z.object({ en: optionalField(richText), de: optionalField(richText) })),
});

export const cardsSchema = z.object({
  ...sectionBase,
  type: z.literal("cards"),
  items: z.array(item),
});
