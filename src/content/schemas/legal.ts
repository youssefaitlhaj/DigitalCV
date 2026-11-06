import { z } from "zod";
import { localized, localizedRich } from "./primitives";

const legalPage = (defaultVisible: boolean) =>
  z.object({
    visible: z.boolean().default(defaultVisible),
    title: localized(),
    body: localizedRich,
  });

export const legalSchema = z.object({
  privacy: legalPage(true),
  impressum: legalPage(false),
});

export type Legal = z.infer<typeof legalSchema>;
