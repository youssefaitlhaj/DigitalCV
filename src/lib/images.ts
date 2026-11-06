/** Node-only image helpers (build-time crop and upload validation). Never import from Vite code. */
import { existsSync, mkdirSync } from "node:fs";
import { extname, join } from "node:path";
import sharp from "sharp";
import type { Content } from "../content/repository";
import type { ImageRef } from "../content/schemas/primitives";
import { GENERATED_DIR, generatedPathFor, ImageError } from "./image-path";

export { generatedPathFor, ImageError, GENERATED_DIR };
const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const MAX_SIDE = 2400;

/** Every imageRef anywhere in the content (found structurally, so new sections need no change here). */
export function collectImageRefs(content: Content): ImageRef[] {
  const found: ImageRef[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      if (typeof o.src === "string" && o.src.startsWith("/src/assets/uploads/") && "alt" in o) {
        found.push(o as unknown as ImageRef);
        return;
      }
      Object.values(o).forEach(walk);
    }
  };
  walk(content.page);
  return found;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Validates every ref; writes the cropped, downscaled file for refs that have a crop. */
export async function cropAll(refs: ImageRef[], root: string): Promise<void> {
  for (const ref of refs) {
    const ext = extname(ref.src).toLowerCase();
    if (!SUPPORTED.has(ext)) {
      throw new ImageError(`${ref.src}: unsupported format ${ext || "(none)"} — upload JPG, PNG or WebP`);
    }
    const input = join(root, ref.src);
    if (!existsSync(input)) throw new ImageError(`${ref.src}: file not found`);
    if (!ref.crop) continue;

    try {
      // Apply EXIF orientation first so percentages refer to the image as people see it.
      const oriented = await sharp(input).rotate().toBuffer();
      const { width: W = 0, height: H = 0 } = await sharp(oriented).metadata();
      const left = clamp(Math.round((ref.crop.x / 100) * W), 0, W - 1);
      const top = clamp(Math.round((ref.crop.y / 100) * H), 0, H - 1);
      const width = clamp(Math.round((ref.crop.width / 100) * W), 1, W - left);
      const height = clamp(Math.round((ref.crop.height / 100) * H), 1, H - top);
      const target = join(root, generatedPathFor(ref));
      mkdirSync(join(root, GENERATED_DIR), { recursive: true });
      await sharp(oriented)
        .extract({ left, top, width, height })
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
        .toFile(target);
    } catch (e) {
      throw new ImageError(`${ref.src}: could not process image — ${(e as Error).message}`);
    }
  }
}
