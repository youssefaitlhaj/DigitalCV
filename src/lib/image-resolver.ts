/** Vite-only: resolves an ImageRef to the asset Astro's <Image> can optimise. Never import from Node scripts. */
import type { ImageMetadata } from "astro";
import type { ImageRef } from "../content/schemas/primitives";
import { generatedPathFor, ImageError } from "./image-path";

const assets = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/{uploads,generated}/*.{jpg,jpeg,png,webp,avif}",
  { eager: true },
);

export function resolveImage(ref: ImageRef): ImageMetadata {
  const path = generatedPathFor(ref);
  const mod = assets[path];
  if (!mod) throw new ImageError(`${ref.src}: image not found in src/assets (looked for ${path})`);
  return mod.default;
}
