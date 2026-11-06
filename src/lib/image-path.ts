/** Pure, sharp-free pieces shared by the Node script (images.ts) and the Vite resolver. */
import { createHash } from "node:crypto";
import { basename, extname } from "node:path";
import type { ImageRef } from "../content/schemas/primitives";

export class ImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageError";
  }
}

export const GENERATED_DIR = "/src/assets/generated";

/** Path (rooted at the project) of the file the site should render for this ref. */
export function generatedPathFor(ref: ImageRef): string {
  if (!ref.crop) return ref.src;
  const { x, y, width, height } = ref.crop;
  const hash = createHash("sha1").update(JSON.stringify([ref.src, x, y, width, height])).digest("hex").slice(0, 10);
  const ext = extname(ref.src);
  return `${GENERATED_DIR}/${basename(ref.src, ext)}-${hash}${ext.toLowerCase()}`;
}
