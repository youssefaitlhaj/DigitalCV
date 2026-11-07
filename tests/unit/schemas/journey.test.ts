import { describe, expect, it } from "vitest";
import { journeySchema } from "../../../src/content/schemas/sections/journey";

const l = (en: string, de = en) => ({ en, de });
const base = {
  type: "journey",
  id: "journey",
  title: l("Journey", "Werdegang"),
  stops: [{ year: l("2013"), heading: l("Casablanca"), text: l("Diploma."), caption: l("git init") }],
};

describe("journeySchema heading", () => {
  it("is optional", () => {
    const r = journeySchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.heading).toBeUndefined();
  });

  it("accepts a bilingual heading", () => {
    const heading = l("From Casablanca to Bamberg.", "Von Casablanca nach Bamberg.");
    const r = journeySchema.safeParse({ ...base, heading });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.heading).toEqual(heading);
  });

  it("rejects a heading missing a language", () => {
    expect(journeySchema.safeParse({ ...base, heading: { en: "From Casablanca to Bamberg.", de: "" } }).success).toBe(false);
  });
});
