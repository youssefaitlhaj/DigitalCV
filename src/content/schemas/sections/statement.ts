import { z } from "zod";
import { localizedRich } from "../primitives";
import { sectionBase } from "./base";

export const statementSchema = z.object({
  ...sectionBase,
  type: z.literal("statement"),
  text: localizedRich,
});
