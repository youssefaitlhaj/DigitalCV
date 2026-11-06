import { z } from "zod";
import { localized, localizedRich } from "../primitives";
import { sectionBase } from "./base";

export const contactSchema = z.object({
  ...sectionBase,
  type: z.literal("contact"),
  heading: localized(),
  lead: localizedRich,
  emailLabel: localized(),
  linkedinLabel: localized(),
  cvLabel: localized(),
});
