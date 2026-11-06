import { mkdirSync, mkdtempSync, copyFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import {
  collectImageRefs,
  cropAll,
  generatedPathFor,
  ImageError,
} from "../../../src/lib/images";
import type { Content } from "../../../src/content/repository";
import type { ImageRef } from "../../../src/content/schemas/primitives";
import { minimalPage } from "../../fixtures/page.min";

const FIX = join(__dirname, "../../fixtures/images");
const alt = { en: "a", de: "a" };
const ref = (name: string, crop?: ImageRef["crop"]): ImageRef => ({
  src: `/src/assets/uploads/${name}`,
  alt,
  crop,
});

let root: string;
const out = (r: ImageRef) => join(root, generatedPathFor(r));
const meta = (r: ImageRef) => sharp(out(r)).metadata();

beforeAll(async () => {
  root = mkdtempSync(join(tmpdir(), "images-test-"));
  const up = join(root, "src/assets/uploads");
  mkdirSync(up, { recursive: true });
  mkdirSync(join(root, "src/assets/generated"), { recursive: true });
  const bg = { r: 90, g: 90, b: 90 };
  await sharp({ create: { width: 4000, height: 3000, channels: 3, background: bg } }).jpeg().toFile(join(up, "big.jpg"));
  await sharp({ create: { width: 6000, height: 4000, channels: 3, background: bg } }).jpeg().toFile(join(up, "huge.jpg"));
  await sharp({ create: { width: 300, height: 200, channels: 3, background: bg } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toFile(join(up, "phone.jpg"));
  copyFileSync(join(FIX, "small.jpg"), join(up, "small.jpg"));
  copyFileSync(join(FIX, "small.png"), join(up, "small.png"));
  copyFileSync(join(FIX, "fake.heic"), join(up, "fake.heic"));
  writeFileSync(join(up, "../.keep"), "");
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("cropAll", () => {
  test("crop 10/10/50/50 of 4000×3000 yields 2000×1500", async () => {
    const r = ref("big.jpg", { x: 10, y: 10, width: 50, height: 50 });
    await cropAll([r], root);
    const m = await meta(r);
    expect([m.width, m.height]).toEqual([2000, 1500]);
  });

  test("downscales oversized image", async () => {
    const r = ref("huge.jpg", { x: 0, y: 0, width: 100, height: 100 });
    await cropAll([r], root);
    const m = await meta(r);
    expect(Math.max(m.width!, m.height!)).toBe(2400);
  });

  test("rejects unsupported format with file name", async () => {
    await expect(cropAll([ref("fake.heic")], root)).rejects.toThrow(/fake\.heic.*JPG, PNG or WebP/);
    await expect(cropAll([ref("fake.heic")], root)).rejects.toBeInstanceOf(ImageError);
  });

  test("missing file error names the src", async () => {
    await expect(cropAll([ref("nope.jpg")], root)).rejects.toThrow(
      "/src/assets/uploads/nope.jpg: file not found",
    );
  });

  test("validates refs without crop and writes nothing for them", async () => {
    await expect(cropAll([ref("small.jpg")], root)).resolves.toBeUndefined();
    await expect(cropAll([ref("nope.png")], root)).rejects.toThrow(/file not found/);
  });

  test("PNG stays PNG with alpha", async () => {
    const r = ref("small.png", { x: 0, y: 0, width: 50, height: 50 });
    await cropAll([r], root);
    const m = await meta(r);
    expect(m.format).toBe("png");
    expect(m.hasAlpha).toBe(true);
  });

  test("33.3 + 66.7 crop never exceeds the image", async () => {
    const r = ref("small.jpg", { x: 33.3, y: 33.3, width: 66.7, height: 66.7 });
    await cropAll([r], root);
    const m = await meta(r);
    expect(m.width! + Math.round(0.333 * 64)).toBeLessThanOrEqual(64);
    expect(m.width).toBeGreaterThan(0);
  });

  test("EXIF orientation is applied before the crop", async () => {
    // phone.jpg is stored 300×200 with orientation 6, so it displays as 200×300.
    const r = ref("phone.jpg", { x: 0, y: 0, width: 100, height: 50 });
    await cropAll([r], root);
    const m = await meta(r);
    expect([m.width, m.height]).toEqual([200, 150]);
  });
});

describe("generatedPathFor", () => {
  test("without crop returns src", () => {
    expect(generatedPathFor(ref("a.jpg"))).toBe("/src/assets/uploads/a.jpg");
  });
  test("same crop → same path; different crop → different path", () => {
    const a = generatedPathFor(ref("a.jpg", { x: 1, y: 2, width: 30, height: 40 }));
    const b = generatedPathFor(ref("a.jpg", { x: 1, y: 2, width: 30, height: 40 }));
    const c = generatedPathFor(ref("a.jpg", { x: 1, y: 2, width: 30, height: 41 }));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^\/src\/assets\/generated\/a-[0-9a-f]+\.jpg$/);
  });
});

describe("collectImageRefs", () => {
  test("finds hero portrait and card images", () => {
    const page = minimalPage() as any;
    page.sections.push({
      type: "cards",
      id: "projects",
      items: [{ image: ref("card.jpg") }, {}],
    });
    const refs = collectImageRefs({ page } as unknown as Content);
    expect(refs.map((r) => r.src)).toEqual([
      "/src/assets/uploads/portrait.jpg",
      "/src/assets/uploads/card.jpg",
    ]);
  });
});

describe("extension case", () => {
  test("uncropped .JPG is accepted and matched by the resolver glob", async () => {
    const { readFileSync, copyFileSync } = await import("node:fs");
    copyFileSync(join(FIX, "small.jpg"), join(root, "src/assets/uploads/IMG_1.JPG"));
    const r = ref("IMG_1.JPG");
    await expect(cropAll([r], root)).resolves.toBeUndefined();
    const src = readFileSync(join(__dirname, "../../../src/lib/image-resolver.ts"), "utf8");
    const list = /\.\{([^}]+)\}"/.exec(src)![1].split(",");
    for (const e of ["jpg", "jpeg", "png", "webp", "avif"]) {
      expect(list).toContain(e);
      expect(list).toContain(e.toUpperCase());
    }
    expect(list).toContain(r.src.split(".").pop());
  });
  test("cropped output of an uppercase source has a lowercase extension", async () => {
    const r = ref("IMG_1.JPG", { x: 0, y: 0, width: 50, height: 50 });
    await cropAll([r], root);
    expect(generatedPathFor(r)).toMatch(/\.jpg$/);
  });
  test("generated path depends on src", () => {
    const c = { x: 1, y: 1, width: 5, height: 5 };
    expect(generatedPathFor(ref("a.jpg", c))).not.toBe(generatedPathFor(ref("a.JPG", c)));
  });
});

describe("mixed-case extension", () => {
  test("IMG.Jpg is rejected with a rename hint", async () => {
    await expect(cropAll([ref("IMG.Jpg")], root)).rejects.toThrow(
      "/src/assets/uploads/IMG.Jpg: mixed-case extension .Jpg — rename it with an all-lowercase extension such as .jpg",
    );
  });
});
