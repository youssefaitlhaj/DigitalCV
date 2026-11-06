import { z } from "zod";
import { localizedRich } from "../primitives";
import { sectionBase } from "./base";

export const textSchema = z.object({
  ...sectionBase,
  type: z.literal("text"),
  paragraphs: z.array(localizedRich),
});
