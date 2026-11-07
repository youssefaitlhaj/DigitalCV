/** A minimal valid page as plain data. Tests clone and mutate it. */
const l = (en: string, de = en) => ({ en, de });

export function minimalPage() {
  return {
    sections: [
      {
        type: "hero",
        id: "hero",
        title: l("Hero", "Start"),
        prompt: "whoami",
        role: l("Engineer", "Ingenieur"),
        subtitle: l("Builds things", "Baut Dinge"),
        ctaPrimary: l("Contact", "Kontakt"),
        ctaSecondary: l("CV", "Lebenslauf"),
        jsonCard: [{ key: "name", values: [l("Ada")] }],
        portrait: {
          src: "/src/assets/uploads/portrait.jpg",
          alt: l("Portrait", "Portrait"),
        },
        motto: l("Ship it", "Liefern"),
      },
      {
        type: "timeline",
        id: "experience",
        title: l("Experience", "Erfahrung"),
        compact: false,
        items: [
          {
            title: l("Engineer", "Ingenieur"),
            org: "Acme",
            location: l("Berlin"),
            start: "2020-01",
            end: "present",
          },
        ],
      },
      {
        type: "contact",
        id: "contact",
        title: l("Contact", "Kontakt"),
        heading: l("Say hi", "Hallo"),
        lead: l("Write me", "Schreib mir"),
        emailLabel: l("Email", "E-Mail"),
        linkedinLabel: l("LinkedIn"),
        cvLabel: l("CV", "Lebenslauf"),
      },
    ],
  } as { sections: Record<string, any>[] };
}
