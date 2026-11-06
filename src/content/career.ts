import { careerSchema, type Career } from "./schema";

/**
 * Locale-neutral career facts.
 *
 * Sourced from linkedin.com/in/youssefaitlhaj on 2026-07-24, corrected and
 * expanded by Youssef on 2026-07-25 (the three Moroccan roles were internships;
 * two earlier qualifications and the full skill set were missing from LinkedIn).
 *
 * Nothing here is translated. Every `id` is a stable key that both dictionaries
 * in `src/i18n/` write against — renaming one without updating them is a type
 * error, which is the point.
 */
const career: Career = careerSchema.parse({
  profile: {
    name: "Youssef Ait Lhaj",
    // Split so the built HTML never contains the address as one string.
    emailUser: "youssefaitlhaj01",
    emailDomain: "gmail.com",
    linkedin: "https://www.linkedin.com/in/youssefaitlhaj/",
    location: "Bamberg, Bavaria, Germany",
  },

  roles: [
    {
      id: "imbus-full-time",
      employer: "Imbus AG",
      employerUrl: "https://www.imbus.de/",
      employment: "full-time",
      location: "Bavaria, Germany",
      start: "2026-02",
      end: "present",
    },
    {
      id: "imbus-part-time",
      employer: "Imbus AG",
      employerUrl: "https://www.imbus.de/",
      employment: "part-time",
      location: "Bavaria, Germany",
      start: "2019-08",
      end: "2026-01",
    },
    {
      id: "aesvt",
      employer: "AESVT Maroc",
      employment: "internship",
      location: "Casablanca-Settat, Morocco",
      start: "2017-03",
      end: "2017-06",
    },
    {
      id: "cat",
      employer: "Compagnie d'Assurance Transport",
      employment: "internship",
      location: "Casablanca-Settat, Morocco",
      start: "2016-06",
      end: "2016-09",
    },
    {
      id: "ntsoft",
      employer: "NT SOFT",
      employment: "internship",
      location: "Casablanca-Settat, Morocco",
      start: "2015-03",
      end: "2015-05",
    },
  ],

  // Most recent first.
  education: [
    {
      id: "bamberg-bsc",
      institution: "Otto-Friedrich-Universität Bamberg",
      institutionUrl: "https://www.uni-bamberg.de/",
      location: "Bamberg, Germany",
      startYear: 2020,
      endYear: 2025,
    },
    {
      id: "hassan2-bachelor",
      institution: "Université Hassan II",
      institutionUrl: "https://www.univh2c.ma/",
      location: "Casablanca, Morocco",
      startYear: 2015,
      endYear: 2016,
    },
    {
      id: "ofppt-diploma",
      institution: "OFPPT",
      location: "Casablanca, Morocco",
      startYear: 2013,
      endYear: 2015,
    },
  ],

  skillGroups: [
    {
      id: "languages-frameworks",
      // Proper nouns carry no dictionary key and render as-is in both locales.
      items: [
        { id: "Java" },
        { id: "Spring Boot" },
        { id: "Swing" },
        { id: "C#" },
        { id: ".NET Framework" },
      ],
    },
    {
      id: "databases",
      items: [{ id: "SQL" }, { id: "Oracle Database" }, { id: "MS SQL Server" }],
    },
    {
      id: "tools",
      items: [
        { id: "Git" },
        { id: "Mercurial" },
        { id: "Jira" },
        { id: "skill.sprint-management" },
      ],
    },
    {
      id: "practice",
      items: [
        { id: "skill.software-development" },
        { id: "skill.web-development" },
        { id: "skill.vibe-coding" },
        { id: "skill.developer-tooling" },
      ],
    },
    {
      id: "spoken",
      items: [
        { id: "lang.arabic", level: "level.native" },
        { id: "lang.german", level: "C1" },
        { id: "lang.french", level: "C1" },
        { id: "lang.english", level: "C1" },
      ],
    },
  ],
});

export default career;

/** Convenience re-exports so components don't reach through the default. */
export const { profile, roles, education, skillGroups } = career;
