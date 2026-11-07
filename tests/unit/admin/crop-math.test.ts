import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { imageRef } from "../../../src/content/schemas/primitives";
import { cropAll, generatedPathFor } from "../../../src/lib/images";
import { percentToPixels, pixelsToPercentCrop } from "../../../public/admin/crop-math.js";

describe("pixelsToPercentCrop", () => {
  it("converts pixels to percent rounded to 2 decimals", () => {
    expect(pixelsToPercentCrop({ x: 100, y: 50, width: 333, height: 200 }, 1000, 400)).toEqual({
      x: 10,
      y: 12.5,
      width: 33.3,
      height: 50,
    });
    expect(pixelsToPercentCrop({ x: 1, y: 1, width: 1, height: 1 }, 3, 3)).toEqual({ x: 33.33, y: 33.33, width: 33.33, height: 33.33 });
  });

  it("clamps negative origins and overflow so x+width and y+height stay within 100", () => {
    const c = pixelsToPercentCrop({ x: -20, y: 950, width: 1200, height: 200 }, 1000, 1000)!;
    expect(c.x).toBe(0);
    expect(c.x + c.width).toBeLessThanOrEqual(100);
    expect(c.y + c.height).toBeLessThanOrEqual(100);
    expect(c.height).toBeGreaterThan(0);
  });

  it("never produces float sums above 100, checked against the real schema", () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
    for (let i = 0; i < 5000; i++) {
      const W = 100 + Math.floor(rnd() * 5000);
      const H = 100 + Math.floor(rnd() * 5000);
      const c = pixelsToPercentCrop({ x: rnd() * W * 1.1 - 50, y: rnd() * H * 1.1 - 50, width: rnd() * W * 1.2, height: rnd() * H * 1.2 }, W, H);
      if (c === null) continue;
      expect(imageRef.safeParse({ src: "/src/assets/uploads/a.jpg", alt: { en: "a", de: "a" }, crop: c }).success, JSON.stringify(c)).toBe(true);
      for (const v of Object.values(c)) expect(Math.round(v * 100) / 100).toBe(v);
    }
  });

  it("returns null for an empty or degenerate box (so the crop is cleared)", () => {
    expect(pixelsToPercentCrop({ x: 0, y: 0, width: 0, height: 10 }, 100, 100)).toBeNull();
    expect(pixelsToPercentCrop({ x: 0, y: 0, width: 10, height: 10 }, 0, 0)).toBeNull();
    expect(pixelsToPercentCrop({ x: Number.NaN, y: 0, width: 10, height: 10 }, 100, 100)).toBeNull();
  });
});

describe("percentToPixels", () => {
  it("inverts the conversion", () => {
    expect(percentToPixels({ x: 10, y: 12.5, width: 33.3, height: 50 }, 1000, 400)).toEqual({ x: 100, y: 50, width: 333, height: 200 });
  });
});

describe("a helper-produced crop round trips through imageRef and cropAll", () => {
  let root: string;
  beforeAll(async () => {
    root = mkdtempSync(join(tmpdir(), "crop-widget-"));
    mkdirSync(join(root, "src/assets/uploads"), { recursive: true });
    await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#456" } }).jpeg().toFile(join(root, "src/assets/uploads/big.jpg"));
  });
  afterAll(() => rmSync(root, { recursive: true, force: true }));

  it("produces the cropped file with the expected size", async () => {
    // big.jpg is 4000x3000: a 2000x1500 box at (800, 600)
    const crop = pixelsToPercentCrop({ x: 800, y: 600, width: 2000, height: 1500 }, 4000, 3000)!;
    const ref = imageRef.parse({ src: "/src/assets/uploads/big.jpg", alt: { en: "a", de: "a" }, crop });
    await cropAll([ref], root);
    const m = await sharp(join(root, generatedPathFor(ref))).metadata();
    expect([m.width, m.height]).toEqual([2000, 1500]);
  });
});

import { isLibraryPath, mergeImageRef, validateImageRef } from "../../../public/admin/crop-math.js";

describe("imageref value logic", () => {
  const ok = { src: "/src/assets/uploads/a.jpg", alt: { en: "a", de: "b" } };
  it("optional empty value is valid, required empty is an error", () => {
    expect(validateImageRef(undefined, false)).toBe(true);
    expect(validateImageRef({}, false)).toBe(true);
    expect(validateImageRef(null, true)).toMatchObject({ error: { message: expect.any(String) } });
  });
  it("a chosen image needs both alt languages", () => {
    expect(validateImageRef(ok, true)).toBe(true);
    expect(validateImageRef({ ...ok, alt: { en: "a", de: "" } }, false)).toMatchObject({ error: expect.anything() });
    expect(validateImageRef({ src: ok.src }, true)).toMatchObject({ error: expect.anything() });
  });
  it("a new src clears the crop; editing alt keeps it", () => {
    const withCrop = { ...ok, crop: { x: 1, y: 1, width: 5, height: 5 } };
    expect(mergeImageRef(withCrop, { src: "/src/assets/uploads/b.jpg" })).toEqual({ src: "/src/assets/uploads/b.jpg", alt: ok.alt });
    expect(mergeImageRef(withCrop, { alt: { en: "x", de: "y" } })?.crop).toEqual(withCrop.crop);
    expect(mergeImageRef(withCrop, { crop: undefined })).toEqual(ok);
  });
  it("without a src nothing is kept (no stray alt or crop)", () => {
    expect(mergeImageRef(undefined, { alt: { en: "a", de: "" } })).toBeNull();
    expect(mergeImageRef({}, { crop: { x: 0, y: 0, width: 1, height: 1 } })).toBeNull();
  });
});

describe("library-only images", () => {
  const alt = { en: "a", de: "b" };
  it("rejects a blob: src and external urls, accepts a library path", () => {
    expect(validateImageRef({ src: "blob:http://localhost/abc", alt }, true)).toMatchObject({ error: { message: expect.stringContaining("isn't uploaded yet") } });
    expect(validateImageRef({ src: "https://example.com/a.jpg", alt }, false)).toMatchObject({ error: expect.anything() });
    expect(validateImageRef({ src: "/src/assets/uploads/a.jpg", alt }, true)).toBe(true);
    expect(isLibraryPath("/src/assets/uploads/")).toBe(false);
    expect(isLibraryPath("blob:x")).toBe(false);
  });
});
