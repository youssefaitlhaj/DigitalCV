import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { extractText, getDocumentProxy } from "unpdf";
import { parse } from "yaml";
import { generatePdfs } from "../../../scripts/generate-pdf";

// Needs a built site: run `npm run build && npm run test:pdf`.
const DIST = "dist";
const BASE = "youssef-ait-lhaj-cv";

async function text(locale: string): Promise<string> {
  const buf = readFileSync(join(DIST, "cv", `${BASE}-${locale}.pdf`));
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

describe("generatePdfs", () => {
  let paths: string[] = [];
  beforeAll(async () => {
    expect(existsSync(join(DIST, "cv", "print", "index.html")), "run `npm run build` first").toBe(true);
    paths = await generatePdfs(DIST);
  }, 120_000);

  it("creates en and de pdfs", () => {
    expect(paths).toHaveLength(2);
    for (const l of ["en", "de"]) expect(existsSync(join(DIST, "cv", `${BASE}-${l}.pdf`))).toBe(true);
  });

  it("pdf contains selectable text", async () => {
    const en = await text("en");
    expect(en).toContain("Youssef Ait Lhaj");
    expect(en).toContain("Imbus AG");
    expect((await text("de")).toLowerCase()).toContain("erfahrung");
  });

  it("each pdf shows the timeline locations in its own language", async () => {
    // Driven by page.yml so editing a location in the CMS does not break the deploy.
    type Loc = { en: string; de: string };
    const page = parse(readFileSync("src/content/data/page.yml", "utf8"));
    const locations: Loc[] = page.sections
      .filter((s: { type: string; visible?: boolean; inPdf?: boolean }) => s.type === "timeline" && s.visible !== false && s.inPdf !== false)
      .flatMap((s: { items: { location: Loc }[] }) => s.items.map((i) => i.location));
    expect(locations.length).toBeGreaterThan(0);
    const [en, de] = [await text("en"), await text("de")];
    for (const loc of locations) {
      expect(de).toContain(loc.de);
      expect(en).toContain(loc.en);
      if (loc.en !== loc.de) expect(de).not.toContain(loc.en);
    }
    expect(de).not.toContain("Germany");
  });

  it("accents and umlauts survive in the pdf text", async () => {
    expect(await text("en")).toContain("Université");
    const de = await text("de");
    for (const word of ["Université", "Universität", "Französisch"]) expect(de).toContain(word);
  });

  it("pdf contains email in plain text and no phone", async () => {
    for (const l of ["en", "de"]) {
      const t = await text(l);
      expect(t.replace(/\s+/g, "")).toContain("youssefaitlhaj01@gmail.com");
      expect(t).not.toMatch(/(\+|00)\d[\d\s().-]{7,}\d/);
      expect(t).not.toMatch(/\b0\d{2,4}[\s/-]?\d{5,}\b/);
    }
  });
});
