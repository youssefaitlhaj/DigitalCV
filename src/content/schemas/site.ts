import { z } from "zod";
import { localized, optionalField, slugId } from "./primitives";

const employmentLabels = z.object({
  "full-time": localized(),
  "part-time": localized(),
  internship: localized(),
});

export const accentIdSchema = z.enum(["whisky", "bourbon", "singleMalt", "green"]);
export const backgroundIdSchema = z.enum(["oat", "paper", "stone", "white"]);

export const siteSchema = z.object({
  name: z.string().trim().min(1),
  logoText: z.string().trim().min(1),
  meta: z.object({ title: localized(), description: localized() }),
  email: z.object({ user: z.string().trim().min(1), domain: z.string().trim().min(1) }),
  linkedin: z.url(),
  location: localized(),
  siteUrl: z.url(),
  palette: z.object({
    accent: accentIdSchema,
    background: backgroundIdSchema,
  }),
  pdf: z.object({ includePortrait: z.boolean(), fileBaseName: slugId }),
  analytics: z.object({ umamiWebsiteId: optionalField(z.string().trim().min(1)), dashboardUrl: optionalField(z.url()) }),
  labels: z.object({
    present: localized(),
    year: localized(),
    years: localized(),
    month: localized(),
    months: localized(),
    employment: employmentLabels,
    downloadCv: localized(),
    skipToContent: localized(),
    themeToggle: localized(),
    language: localized(),
    privacy: localized(),
    impressum: localized(),
    codeLink: localized(),
    liveLink: localized(),
    confidential: localized(),
  }),
});

export type Site = z.infer<typeof siteSchema>;
