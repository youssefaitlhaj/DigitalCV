import type { Dictionary } from "./types";

/**
 * English — the source language.
 *
 * The LinkedIn profile carried no About text and no role descriptions, so all
 * narrative copy here was written for this site and approved by Youssef on
 * 2026-07-25. It stays at the level of role, employer, product, and duration:
 * no invented project names, no achievements. When adding detail, add facts —
 * not adjectives.
 *
 * `de.ts` is a translation of this file. Change English first, German second.
 */
const en: Dictionary = {
  localeName: "English",

  meta: {
    title: "Youssef Ait Lhaj — Software Developer",
    description:
      "Software developer at Imbus AG in Bavaria, working on the TestBench test management platform. Computer science degree from the University of Bamberg; career started in Casablanca.",
  },

  nav: {
    about: "About",
    experience: "Experience",
    skills: "Skills",
    education: "Education",
    contact: "Contact",
    language: "Language",
    theme: "Toggle night mode",
    skipToContent: "Skip to content",
  },

  hero: {
    role: "Software Developer at Imbus AG",
    // Youssef's own words. Never translated, never edited.
    motto: "Enjoy the ride and live the success.",
    cta: "Get in touch",
  },

  sections: {
    about: "About",
    experience: "Experience",
    skills: "Skills",
    education: "Education",
    contact: "Contact",
  },

  about: {
    paragraphs: [
      "I build software at Imbus AG in Bavaria, where I have spent the better part of seven years working on TestBench, their test management platform, first alongside my computer science degree, now full time.",
      "The path here started in Casablanca, with a technician diploma, a bachelor's degree, and three internships: a software house, a transport insurer, an environmental association. Building a store management tool, moving an insurance application to the web, and putting a non-profit's programme online taught me how differently the same craft looks depending on who it serves.",
      "Then I moved to Germany, took a second bachelor's at the University of Bamberg in Software Systems Science, and kept building the whole way through.",
      "I work in Java, C#, and .NET, with SQL underneath and the web on top.",
      "I also speak four languages, which has been quietly useful in a field where most of the work is understanding what someone actually meant.",
    ],
    portraitAlt: "Portrait of Youssef Ait Lhaj",
  },

  experience: {
    titles: {
      "imbus-full-time": "Software Developer",
      "imbus-part-time": "Software Developer",
      aesvt: "Web Developer",
      cat: "Software Developer",
      ntsoft: "Software Developer",
    },
    descriptions: {
      "imbus-full-time":
        "Full time on TestBench since finishing my degree — feature development, bug fixing, and extending the underlying database.",
      "imbus-part-time":
        "Six and a half years part time on the same product, spanning my entire degree. I joined while I started studying and never left.",
      aesvt:
        "Rebuilt and extended the association's WordPress site, and brought their programme online — including public voting for the best environmental artwork and ideas.",
      cat: "Part of the team that migrated a desktop insurance application to the web, in C# and MS SQL Server.",
      ntsoft: "Built a store management application in C# and MS SQL Server. My first professional work.",
    },
    employment: {
      "full-time": "Full-time",
      "part-time": "Part-time",
      internship: "Internship",
    },
    present: "Present",
    year: "yr",
    years: "yrs",
    month: "mo",
    months: "mos",
  },

  education: {
    degrees: {
      "bamberg-bsc": "B.Sc. Software Systems Science",
      "hassan2-bachelor": "Bachelor's Degree in Computer Science",
      "ofppt-diploma": "Technician Diploma in Computer Science",
    },
  },

  skills: {
    groups: {
      "languages-frameworks": "Languages & Frameworks",
      databases: "Databases",
      tools: "Tools & Collaboration",
      practice: "Practice",
      spoken: "Languages",
    },
    items: {
      "skill.software-development": "Software Development",
      "skill.web-development": "Web Development",
      "skill.vibe-coding": "Vibe Coding",
      "skill.developer-tooling": "Building tools that simplify IT work",
      "skill.sprint-management": "Sprint Management",
      "lang.english": "English",
      "lang.french": "French",
      "lang.german": "German",
      "lang.arabic": "Arabic",
    },
    levels: {
      "level.native": "Native",
    },
  },

  contact: {
    lead: "Open to a conversation about work, or about anything worth building.",
    emailLabel: "Email",
    linkedinLabel: "LinkedIn",
    emailFallback: "Enable JavaScript to see the address",
  },

  footer: {
    copyright: "© {year} Youssef Ait Lhaj",
  },
};

export default en;
