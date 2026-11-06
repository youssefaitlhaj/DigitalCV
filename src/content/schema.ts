import { z } from "zod";

/**
 * Schemas for the locale-neutral career facts.
 *
 * Only things that are the same in every language belong here: employer names,
 * dates, locations, and the stable ids that translation files key off. Anything
 * a translator would touch lives in `src/i18n/*`.
 */

/** `YYYY-MM`, or `present` for a role that has not ended. */
export const monthSchema = z
  .union([z.literal("present"), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)])
  .describe("YYYY-MM or 'present'");

export const roleSchema = z
  .object({
    /** Stable key used by every translation file. Never reuse or renumber. */
    id: z.string().min(1),
    employer: z.string().min(1),
    /** Employer site, when there is one worth linking. */
    employerUrl: z.url().optional(),
    /** Rendered as a small badge; the label itself is translated. */
    employment: z.enum(["full-time", "part-time", "internship"]),
    location: z.string().min(1),
    start: monthSchema,
    end: monthSchema,
  })
  .refine((r) => r.start !== "present", {
    message: "A role cannot start in the present",
    path: ["start"],
  })
  .refine((r) => r.end === "present" || r.end >= r.start, {
    message: "A role cannot end before it starts",
    path: ["end"],
  });

export const educationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1),
  institutionUrl: z.url().optional(),
  location: z.string().min(1),
  startYear: z.number().int().min(1950).max(2100),
  endYear: z.number().int().min(1950).max(2100),
});

export const skillItemSchema = z.object({
  /**
   * Either a dictionary key (`skill.web-development`) or a proper noun that
   * renders verbatim in every locale (`Java`, `Jira`, `.NET Framework`).
   */
  id: z.string().min(1),
  /**
   * Optional qualifier shown beside the label — currently spoken-language
   * proficiency. A dictionary key (`level.native`) when it needs translating,
   * or a literal when it does not (`C1`).
   */
  level: z.string().optional(),
});

export const skillGroupSchema = z.object({
  id: z.string().min(1),
  items: z.array(skillItemSchema).min(1),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  /** Split so the address is never a contiguous string in the built HTML. */
  emailUser: z.string().min(1),
  emailDomain: z.string().min(1),
  linkedin: z.url(),
  location: z.string().min(1),
});

export const careerSchema = z.object({
  profile: profileSchema,
  /** Most recent first. */
  roles: z.array(roleSchema).min(1),
  education: z.array(educationSchema).min(1),
  skillGroups: z.array(skillGroupSchema).min(1),
});

export type Role = z.infer<typeof roleSchema>;
export type SkillItem = z.infer<typeof skillItemSchema>;
export type Education = z.infer<typeof educationSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Career = z.infer<typeof careerSchema>;
