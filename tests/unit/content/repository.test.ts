import { describe, expect, it } from "vitest";
import { ContentError, loadContent } from "../../../src/content/repository";

describe("loadContent", () => {
  it("ContentError names file and path", () => {
    expect(() => loadContent("tests/fixtures/content/bad-timeline")).toThrow(ContentError);
    try {
      loadContent("tests/fixtures/content/bad-timeline");
    } catch (e) {
      const message = (e as Error).message;
      expect(message).toContain("page.yml");
      expect(message).toContain("sections.");
    }
  });

  it("names a missing file", () => {
    expect(() => loadContent("tests/fixtures/content/does-not-exist")).toThrow(/site\.yml/);
  });
});
