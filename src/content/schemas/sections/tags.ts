import { z } from "zod";
import { localized, optionalField } from "../primitives";
import { sectionBase } from "./base";

export const tagsSchema = z.object({
  ...sectionBase,
  type: z.literal("tags"),
  groups: z.array(
    z.object({
      title: localized(),
      items: z.array(z.object({ label: localized(), level: optionalField(localized()) })),
    }),
  ),
});
