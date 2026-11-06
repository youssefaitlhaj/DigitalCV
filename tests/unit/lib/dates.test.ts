import { describe, expect, it } from "vitest";
import { loadContent } from "../../../src/content/repository";
import { formatDuration, formatMonth, formatRange, monthsBetween } from "../../../src/lib/dates";

const now = new Date(Date.UTC(2026, 10, 6));
const { labels } = loadContent().site;

describe("monthsBetween", () => {
  it("counts Mar-May 2015 as 3 months", () => {
    expect(monthsBetween("2015-03", "2015-05", now)).toBe(3);
  });
  it("has a minimum of 1", () => {
    expect(monthsBetween("2030-01", "present", now)).toBe(1);
  });
  it("treats YYYY as Jan for start and Dec for end", () => {
    expect(monthsBetween("2015", "2015", now)).toBe(12);
  });
});

describe("formatDuration", () => {
  it("formats years and months", () => {
    expect(formatDuration(monthsBetween("2019-08", "2026-01", now), "en", labels)).toBe("6 yrs 6 mos");
  });
  it("formats months only", () => {
    expect(formatDuration(monthsBetween("2026-02", "present", now), "en", labels)).toBe("10 mos");
  });
  it("uses singular and omits zero parts", () => {
    expect(formatDuration(12, "en", labels)).toBe("1 yr");
    expect(formatDuration(1, "en", labels)).toBe("1 mo");
    expect(formatDuration(24, "en", labels)).toBe("2 yrs");
  });
});

describe("formatMonth / formatRange", () => {
  it("formats a German month", () => {
    const s = formatMonth("2019-08", "de", labels);
    expect(s).toContain("Aug");
    expect(s).toContain("2019");
  });
  it("prints a bare year alone", () => {
    expect(formatMonth("2015", "en", labels)).toBe("2015");
  });
  it("prints present from labels", () => {
    expect(formatMonth("present", "de", labels)).toBe(labels.present.de);
  });
  it("joins with an en dash", () => {
    expect(formatRange("2019-08", "present", "en", labels)).toBe(`Aug 2019 – ${labels.present.en}`);
  });
});
