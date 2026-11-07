import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { extractText, getDocumentProxy } from "unpdf";
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

  it("pdf contains email in plain text and no phone", async () => {
    for (const l of ["en", "de"]) {
      const t = await text(l);
      expect(t.replace(/\s+/g, "")).toContain("youssefaitlhaj01@gmail.com");
      expect(t).not.toMatch(/(\+|00)\d[\d\s().-]{7,}\d/);
      expect(t).not.toMatch(/\b0\d{2,4}[\s/-]?\d{5,}\b/);
    }
  });
});
