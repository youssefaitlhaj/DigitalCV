import { describe, expect, test } from "vitest";
import {
  imageRef,
  localized,
  localizedRich,
  month,
  richText,
  slugId,
  yearOrMonth,
} from "../../../src/content/schemas/primitives";

const alt = { en: "a", de: "a" };
const src = "/src/assets/uploads/a.jpg";

describe("localized", () => {
  test("accepts both languages", () => {
    expect(localized().safeParse({ en: "Hi", de: "Hallo" }).success).toBe(true);
  });
  test("rejects empty German", () => {
    expect(localized().safeParse({ en: "Hi", de: "" }).success).toBe(false);
  });
  test("rejects whitespace-only English", () => {
    expect(localized().safeParse({ en: "  ", de: "Hallo" }).success).toBe(false);
  });
  test("rejects missing key", () => {
    expect(localized().safeParse({ en: "Hi" }).success).toBe(false);
  });
  test("localizedRich requires non-empty markdown in both languages", () => {
    expect(localizedRich.safeParse({ en: "**a**", de: "**b**" }).success).toBe(true);
    expect(localizedRich.safeParse({ en: "**a**", de: "" }).success).toBe(false);
    expect(richText.safeParse("").success).toBe(false);
  });
});

describe("dates", () => {
  test("month accepts 2019-08 and present, rejects 2019-13", () => {
    expect(month.safeParse("2019-08").success).toBe(true);
    expect(month.safeParse("present").success).toBe(true);
    expect(month.safeParse("2019-13").success).toBe(false);
    expect(month.safeParse("2019-00").success).toBe(false);
  });
  test("yearOrMonth accepts YYYY and YYYY-MM only", () => {
    expect(yearOrMonth.safeParse("2019").success).toBe(true);
    expect(yearOrMonth.safeParse("2019-08").success).toBe(true);
    expect(yearOrMonth.safeParse("2019-13").success).toBe(false);
    expect(yearOrMonth.safeParse("present").success).toBe(false);
    expect(yearOrMonth.safeParse("19").success).toBe(false);
  });
});

describe("imageRef", () => {
  test("accepts an image without crop", () => {
    expect(imageRef.safeParse({ src, alt }).success).toBe(true);
  });
  test("accepts a crop inside bounds", () => {
    const crop = { x: 10, y: 10, width: 80, height: 90 };
    expect(imageRef.safeParse({ src, alt, crop }).success).toBe(true);
  });
  test("crop must stay within 0–100 and x+width ≤ 100", () => {
    expect(
      imageRef.safeParse({ src, alt, crop: { x: 60, y: 0, width: 50, height: 10 } }).success,
    ).toBe(false);
    expect(
      imageRef.safeParse({ src, alt, crop: { x: 0, y: 95, width: 10, height: 10 } }).success,
    ).toBe(false);
    expect(
      imageRef.safeParse({ src, alt, crop: { x: -1, y: 0, width: 10, height: 10 } }).success,
    ).toBe(false);
    expect(
      imageRef.safeParse({ src, alt, crop: { x: 0, y: 0, width: 0, height: 10 } }).success,
    ).toBe(false);
  });
  test("requires bilingual alt text", () => {
    expect(imageRef.safeParse({ src, alt: { en: "a", de: "" } }).success).toBe(false);
  });
  test("src must live under /src/assets/uploads/", () => {
    expect(imageRef.safeParse({ src: "/etc/passwd", alt }).success).toBe(false);
  });
});

describe("slugId", () => {
  test("accepts lowercase, digits, hyphens", () => {
    expect(slugId.safeParse("my-section-2").success).toBe(true);
  });
  test("rejects 'My Section' and 'über'", () => {
    expect(slugId.safeParse("My Section").success).toBe(false);
    expect(slugId.safeParse("über").success).toBe(false);
  });
});

describe("imageRef path safety", () => {
  const ok = (s: string) => imageRef.safeParse({ src: s, alt, }).success;
  test("rejects .. segments and backslashes", () => {
    expect(ok("/src/assets/uploads/../../x.jpg")).toBe(false);
    expect(ok("/src/assets/uploads/a/../b.jpg")).toBe(false);
    expect(ok("/src/assets/uploads/..\\x.jpg")).toBe(false);
  });
  test("rejects subfolders", () => {
    expect(ok("/src/assets/uploads/a/b.jpg")).toBe(false);
  });
  test("accepts normal names including dots", () => {
    expect(ok("/src/assets/uploads/my..photo.jpg")).toBe(true);
  });
});
