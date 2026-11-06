import { z } from "zod";
import { localized, slugId } from "../primitives";

/** Fields every section shares. Each section type spreads these in. */
export const sectionBase = {
  id: slugId,
  title: localized(),
  visible: z.boolean().default(true),
  inMenu: z.boolean().default(true),
  animate: z.boolean().default(true),
  inPdf: z.boolean().default(true),
};
