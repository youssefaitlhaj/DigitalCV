import { describe, expect, it } from "vitest";
import { pageSchema } from "../../../src/content/schemas/registry";
import { minimalPage } from "../../fixtures/page.min";

const l = (en: string, de = en) => ({ en, de });

describe("pageSchema", () => {
  it("accepts a minimal valid page", () => {
    const r = pageSchema.safeParse(minimalPage());
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sections[0]).toMatchObject({ visible: true, inMenu: true, animate: true, inPdf: true, showMotto: false });
    }
  });

  it("rejects duplicate section ids", () => {
    const page = minimalPage();
    const tl = page.sections[1];
    page.sections.push({ ...tl });
    const r = pageSchema.safeParse(page);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path.includes("sections"))).toBe(true);
  });

  it("slugifies ids for anchors", () => {
    const page = minimalPage();
    page.sections[1].id = "My Section";
    expect(pageSchema.safeParse(page).success).toBe(false);
  });

  it("rejects timeline item ending before start", () => {
    const page = minimalPage();
    page.sections[1].items[0].start = "2021-05";
    page.sections[1].items[0].end = "2021-04";
    const r = pageSchema.safeParse(page);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path.includes("end"))).toBe(true);
  });

  it("treats YYYY start as January and YYYY end as December", () => {
    const page = minimalPage();
    page.sections[1].items[0].start = "2021-06";
    page.sections[1].items[0].end = "2021";
    expect(pageSchema.safeParse(page).success).toBe(true);
  });

  it("rejects more than one hero", () => {
    const page = minimalPage();
    page.sections.push({ ...page.sections[0], id: "hero-2" });
    expect(pageSchema.safeParse(page).success).toBe(false);
  });

  it("rejects stats count pointing to unknown section", () => {
    const page = minimalPage();
    page.sections.push({
      type: "stats",
      id: "stats",
      title: l("Stats"),
      items: [{ label: l("Jobs"), value: { kind: "count", sectionId: "nope" } }],
    });
    expect(pageSchema.safeParse(page).success).toBe(false);
    page.sections[3].items[0].value.sectionId = "experience";
    expect(pageSchema.safeParse(page).success).toBe(true);
  });

  it("rejects more than four stats", () => {
    const page = minimalPage();
    const item = { label: l("A"), value: { kind: "number", n: 1 } };
    page.sections.push({ type: "stats", id: "stats", title: l("S"), items: Array(5).fill(item) });
    expect(pageSchema.safeParse(page).success).toBe(false);
  });
});
