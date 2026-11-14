import { z } from "zod";
import { localizedRich, pdfAlternative, richText } from "../primitives";
import { sectionBase } from "./base";

export const textSchema = z.object({
  ...sectionBase,
  type: z.literal("text"),
  paragraphs: z.array(localizedRich),
  /** Replaces all paragraphs in the PDF, per language. */
  pdfText: pdfAlternative(richText),
});
