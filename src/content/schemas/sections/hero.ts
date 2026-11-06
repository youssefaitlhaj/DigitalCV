import { z } from "zod";
import { imageRef, localized } from "../primitives";
import { sectionBase } from "./base";

export const heroSchema = z.object({
  ...sectionBase,
  type: z.literal("hero"),
  /** Shell command text shown in the terminal prompt, e.g. `whoami`. */
  prompt: z.string().trim().min(1),
  role: localized(),
  subtitle: localized(),
  ctaPrimary: localized(),
  ctaSecondary: localized(),
  jsonCard: z.array(z.object({ key: z.string().trim().min(1), values: z.array(localized()) })),
  portrait: imageRef,
  motto: localized(),
  showMotto: z.boolean().default(false),
});
