import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { pageSchema, RESERVED_SECTION_IDS } from "../../../src/content/schemas/registry";
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

  it.each(["main", "experience-title", "x-title"])("rejects the reserved section id %s", (id) => {
    const page = minimalPage();
    page.sections[1].id = id;
    const r = pageSchema.safeParse(page);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.join(".") === "sections.1.id" && /reserved/.test(i.message))).toBe(true);
    }
  });

  it("allows ids that only contain the reserved words", () => {
    const page = minimalPage();
    page.sections[1].id = "main-projects";
    expect(pageSchema.safeParse(page).success).toBe(true);
    page.sections[1].id = "titles";
    expect(pageSchema.safeParse(page).success).toBe(true);
  });

  it("every literal id in src/ is a reserved section id", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? walk(p) : /\.(astro|ts|js)$/.test(n) ? [p] : [];
      });
    const literal = new Set<string>();
    for (const f of walk("src")) for (const m of readFileSync(f, "utf8").matchAll(/\bid="([^"]+)"/g)) literal.add(m[1]);
    expect(literal.size).toBeGreaterThan(0);
    expect([...literal].filter((id) => !(RESERVED_SECTION_IDS as readonly string[]).includes(id))).toEqual([]);
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
