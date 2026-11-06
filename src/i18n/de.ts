import type { Dictionary } from "./types";

/**
 * German — a translation of `en.ts`, not a separate voice.
 *
 * Written in the same first person and the same restrained register as the
 * English. Where a literal translation would sound stiff in German, the sense
 * is kept and the phrasing adapted — the copy should read as though it were
 * written in German, not converted into it.
 *
 * Product, company, and technology names stay untranslated. So does the motto.
 */
const de: Dictionary = {
  localeName: "Deutsch",

  meta: {
    title: "Youssef Ait Lhaj — Softwareentwickler",
    description:
      "Softwareentwickler bei Imbus AG in Bayern, tätig an der Testmanagement-Plattform TestBench. Informatikstudium an der Universität Bamberg, Berufsstart in Casablanca.",
  },

  nav: {
    about: "Über mich",
    experience: "Erfahrung",
    skills: "Fähigkeiten",
    education: "Ausbildung",
    contact: "Kontakt",
    language: "Sprache",
    theme: "Nachtmodus umschalten",
    skipToContent: "Zum Inhalt springen",
  },

  hero: {
    role: "Softwareentwickler bei Imbus AG",
    // Youssef's own words. Deliberately left in English in every locale.
    motto: "Enjoy the ride and live the success.",
    cta: "Kontakt aufnehmen",
  },

  sections: {
    about: "Über mich",
    experience: "Erfahrung",
    skills: "Fähigkeiten",
    education: "Ausbildung",
    contact: "Kontakt",
  },

  about: {
    paragraphs: [
      "Ich entwickle Software bei Imbus AG in Bayern, wo ich den größten Teil der vergangenen sieben Jahre an TestBench gearbeitet habe, der Testmanagement-Plattform des Hauses, zunächst neben meinem Informatikstudium, inzwischen in Vollzeit.",
      "Angefangen hat der Weg in Casablanca, mit einem Fachtechnikerdiplom, einem Bachelor-Abschluss und drei Praktika: ein Softwarehaus, ein Transportversicherer, ein Umweltbildungsverein. Eine Lagerverwaltung zu bauen, eine Versicherungsanwendung ins Web zu holen und das Programm eines Vereins online zu bringen, hat mir gezeigt, wie unterschiedlich dasselbe Handwerk aussieht, je nachdem, wem es dient.",
      "Dann bin ich nach Deutschland gezogen, habe an der Universität Bamberg einen zweiten Bachelor in Software Systems Science gemacht und die ganze Zeit über weiter entwickelt.",
      "Ich arbeite mit Java, C# und .NET, mit SQL darunter und dem Web darüber.",
      "Außerdem spreche ich vier Sprachen — was sich in einem Beruf, in dem es meistens darum geht zu verstehen, was jemand eigentlich gemeint hat, still und leise als nützlich erwiesen hat.",
    ],
    portraitAlt: "Porträt von Youssef Ait Lhaj",
  },

  experience: {
    titles: {
      "imbus-full-time": "Softwareentwickler",
      "imbus-part-time": "Softwareentwickler",
      aesvt: "Webentwickler",
      cat: "Softwareentwickler",
      ntsoft: "Softwareentwickler",
    },
    descriptions: {
      "imbus-full-time":
        "Seit dem Abschluss meines Studiums in Vollzeit an TestBench — neue Funktionen, Fehlerbehebung und die Erweiterung der zugrunde liegenden Datenbank.",
      "imbus-part-time":
        "Sechseinhalb Jahre in Teilzeit am selben Produkt, über mein gesamtes Studium hinweg. Ich bin dazugekommen, als ich zu studieren begann, und geblieben.",
      aesvt:
        "Die WordPress-Website des Vereins überarbeitet und erweitert und das gesamte Programm online gebracht — samt öffentlicher Abstimmung über die besten Umweltkunstwerke und -ideen.",
      cat: "Teil des Teams, das eine Desktop-Versicherungsanwendung ins Web überführt hat — mit C# und MS SQL Server.",
      ntsoft:
        "Eine Anwendung zur Lagerverwaltung in C# und MS SQL Server entwickelt. Meine erste berufliche Arbeit.",
    },
    employment: {
      "full-time": "Vollzeit",
      "part-time": "Teilzeit",
      internship: "Praktikum",
    },
    present: "Heute",
    year: "Jahr",
    years: "Jahre",
    month: "Mon.",
    months: "Mon.",
  },

  education: {
    degrees: {
      "bamberg-bsc": "B.Sc. Software Systems Science",
      "hassan2-bachelor": "Bachelor-Abschluss in Informatik",
      "ofppt-diploma": "Fachtechnikerdiplom im Bereich Informatik",
    },
  },

  skills: {
    groups: {
      "languages-frameworks": "Sprachen & Frameworks",
      databases: "Datenbanken",
      tools: "Werkzeuge & Zusammenarbeit",
      practice: "Praxis",
      spoken: "Sprachen",
    },
    items: {
      "skill.software-development": "Softwareentwicklung",
      "skill.web-development": "Webentwicklung",
      "skill.vibe-coding": "Vibe Coding",
      "skill.developer-tooling": "Werkzeuge bauen, die IT-Arbeit erleichtern",
      "skill.sprint-management": "Sprint-Management",
      "lang.english": "Englisch",
      "lang.french": "Französisch",
      "lang.german": "Deutsch",
      "lang.arabic": "Arabisch",
    },
    levels: {
      "level.native": "Muttersprache",
    },
  },

  contact: {
    lead: "Offen für ein Gespräch über Arbeit oder über alles, was sich zu bauen lohnt.",
    emailLabel: "E-Mail",
    linkedinLabel: "LinkedIn",
    emailFallback: "JavaScript aktivieren, um die Adresse zu sehen",
  },

  footer: {
    copyright: "© {year} Youssef Ait Lhaj",
  },
};

export default de;
