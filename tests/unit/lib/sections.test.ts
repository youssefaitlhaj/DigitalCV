import { describe, expect, it } from "vitest";
import { pageSchema, type Section } from "../../../src/content/schemas/registry";
import { anchorFor, menuEntries, pdfSections, visibleSections } from "../../../src/lib/sections";
import { minimalPage } from "../../fixtures/page.min";

const l = (en: string, de = en) => ({ en, de });

function parsed(mutate?: (p: ReturnType<typeof minimalPage>) => void): Section[] {
  const page = minimalPage();
  mutate?.(page);
  return pageSchema.parse(page).sections;
}

describe("visibleSections", () => {
  it("excludes hidden and empty", () => {
    const sections = parsed((p) => {
      p.sections.push({ type: "cards", id: "projects", title: l("Projects"), items: [] });
      p.sections.push({ type: "tags", id: "skills", title: l("Skills"), groups: [{ title: l("G"), items: [] }] });
      p.sections.push({ type: "text", id: "about", title: l("About"), paragraphs: [l("Hi")], visible: false });
      p.sections.push({ type: "text", id: "more", title: l("More"), paragraphs: [l("Hi")] });
    });
    expect(visibleSections(sections).map((s) => s.id)).toEqual(["hero", "experience", "contact", "more"]);
  });
});

describe("pdfSections", () => {
  it("excludes inPdf false", () => {
    const sections = parsed((p) => {
      p.sections[1].inPdf = false;
    });
    expect(pdfSections(sections).map((s) => s.id)).toEqual(["hero", "contact"]);
  });
});

describe("menuEntries", () => {
  it("uses German titles for de", () => {
    const sections = parsed();
    expect(menuEntries(sections, "de")).toEqual([
      { id: "experience", label: "Erfahrung" },
      { id: "contact", label: "Kontakt" },
    ]);
  });

  it("skips sections not in the menu", () => {
    const sections = parsed((p) => {
      p.sections[2].inMenu = false;
    });
    expect(menuEntries(sections, "en").map((e) => e.id)).toEqual(["experience"]);
  });
});

describe("anchorFor", () => {
  it("returns the id", () => {
    expect(anchorFor("experience")).toBe("experience");
  });
});
