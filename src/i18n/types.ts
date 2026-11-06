import type { Locale } from "./locales";

/**
 * The contract every locale file must satisfy.
 *
 * Keys mirror the ids in `src/content/career.ts`. Because each dictionary is
 * typed as `Dictionary`, a forgotten translation is a compile error rather than
 * a blank space on a live page — which is the only reliable way to keep the
 * German copy in step with the English.
 */
export interface Dictionary {
  /** Written name of this language, shown in the locale switcher. */
  localeName: string;

  meta: {
    title: string;
    description: string;
  };

  nav: {
    about: string;
    experience: string;
    skills: string;
    education: string;
    contact: string;
    /** Accessible label for the language switcher. */
    language: string;
    /** Accessible label for the light/dark toggle. */
    theme: string;
    skipToContent: string;
  };

  hero: {
    /** Role + employer, sits above the motto. */
    role: string;
    /** Intentionally NOT translated — the author's own words. */
    motto: string;
    cta: string;
  };

  sections: {
    about: string;
    experience: string;
    skills: string;
    education: string;
    contact: string;
  };

  about: {
    /** Each string is one paragraph. */
    paragraphs: readonly string[];
    portraitAlt: string;
  };

  experience: {
    /** Keyed by role id in `career.ts`. */
    titles: Record<string, string>;
    descriptions: Record<string, string>;
    /** Employment-type badge; keys match `employment` in career.ts. */
    employment: Record<"full-time" | "part-time" | "internship", string>;
    present: string;
    /** e.g. "6 yrs 6 mos" — assembled from these units. */
    year: string;
    years: string;
    month: string;
    months: string;
  };

  education: {
    /** Keyed by education id. */
    degrees: Record<string, string>;
  };

  skills: {
    /** Keyed by skill group id. */
    groups: Record<string, string>;
    /** Keyed by the translatable skill ids; proper nouns are absent by design. */
    items: Record<string, string>;
    /** Keyed by `level.*` values; bare literals like "C1" bypass this. */
    levels: Record<string, string>;
  };

  contact: {
    lead: string;
    emailLabel: string;
    linkedinLabel: string;
    /** Shown in place of the address before JS assembles it. */
    emailFallback: string;
  };

  footer: {
    /** `{year}` is substituted at build time. */
    copyright: string;
  };
}

export type Dictionaries = Record<Locale, Dictionary>;
