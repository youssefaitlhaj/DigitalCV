import { describe, expect, it } from "vitest";
import { forPdf, pdfEntries, sectionUrl } from "../../../src/lib/pdf";

describe("forPdf", () => {
  const full = { en: "Long", de: "Lang" };
  it("uses the short text per language and the full text elsewhere", () => {
    expect(forPdf(full, undefined)).toEqual(full);
    expect(forPdf(full, { en: "Short" })).toEqual({ en: "Short", de: "Lang" });
    expect(forPdf(full, { en: "Short", de: "Kurz" })).toEqual({ en: "Short", de: "Kurz" });
  });
});

describe("pdfEntries", () => {
  it("keeps the entries marked for the PDF, in order", () => {
    const items = [
      { n: 1, inPdf: true },
      { n: 2, inPdf: false },
      { n: 3, inPdf: true },
    ];
    expect(pdfEntries(items).map((i) => i.n)).toEqual([1, 3]);
  });
});

describe("sectionUrl", () => {
  it("links to the section on the website in the PDF's language", () => {
    expect(sectionUrl("https://example.dev", "en", "projects")).toBe("https://example.dev/#projects");
    expect(sectionUrl("https://example.dev", "de", "projects")).toBe("https://example.dev/de/#projects");
  });
});
