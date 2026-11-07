import { z } from "zod";
import { localized, localizedRich } from "./primitives";

const legalText = {
  title: localized(),
  body: localizedRich,
};

export const legalSchema = z.object({
  /** Always published: the site processes data (hosting logs, analytics), so the policy is mandatory. */
  privacy: z.object(legalText),
  impressum: z.object({
    visible: z.boolean().default(false),
    ...legalText,
  }),
});

export type Legal = z.infer<typeof legalSchema>;
