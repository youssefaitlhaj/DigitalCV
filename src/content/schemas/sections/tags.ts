import { z } from "zod";
import { localized } from "../primitives";
import { sectionBase } from "./base";

const plainOrLocalized = z.union([z.string().trim().min(1), localized()]);

export const tagsSchema = z.object({
  ...sectionBase,
  type: z.literal("tags"),
  groups: z.array(
    z.object({
      title: localized(),
      items: z.array(z.object({ label: plainOrLocalized, level: plainOrLocalized.optional() })),
    }),
  ),
});
