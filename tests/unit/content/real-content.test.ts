import { describe, expect, it } from "vitest";
import { loadContent } from "../../../src/content/repository";

describe("real content", () => {
  it("validates", () => {
    expect(() => loadContent()).not.toThrow();
  });

  it("has every role", () => {
    const { page } = loadContent();
    const experience = page.sections.find((s) => s.id === "experience");
    if (experience?.type !== "timeline") throw new Error("experience is not a timeline");
    expect(experience.items).toHaveLength(5);
    expect(experience.items[0]).toMatchObject({ org: "Imbus AG", start: "2026-02", end: "present" });
  });
});
