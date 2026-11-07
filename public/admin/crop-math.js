// Pure crop arithmetic for the imageref widget. Kept free of DOM and CMS code so vitest can import it.
// A stored crop is { x, y, width, height } in percent of the image, 2 decimals, matching imageRef.crop.

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
/** Hundredths of a percent as an integer, so sums can be checked without float drift. */
const hundredths = (px, total) => Math.round((px / total) * 10000);

/**
 * Converts a pixel box on an image of natural size (W, H) into the stored percent crop.
 * Clamps into the image and guarantees x + width <= 100 and y + height <= 100 as plain floats.
 * Returns null for a missing or empty box, meaning "no crop".
 */
export function pixelsToPercentCrop(box, W, H) {
  if (!box || !(W > 0) || !(H > 0)) return null;
  const { x, y, width, height } = box;
  if (![x, y, width, height].every(Number.isFinite)) return null;
  const axis = (start, size, total) => {
    const s = clamp(hundredths(start, total), 0, 10000);
    let len = clamp(hundredths(size, total), 0, 10000 - s);
    // 33.33 + 66.67 can exceed 100 as floats; shrink by one hundredth until the float sum fits.
    while (len > 0 && s / 100 + len / 100 > 100) len -= 1;
    return len > 0 ? { start: s / 100, len: len / 100 } : null;
  };
  const a = axis(x, width, W);
  const b = axis(y, height, H);
  if (!a || !b) return null;
  return { x: a.start, y: b.start, width: a.len, height: b.len };
}

/** Inverse of the above, for placing a stored crop on the image in the cropper. */
export function percentToPixels(crop, W, H) {
  return {
    x: Math.round((crop.x / 100) * W),
    y: Math.round((crop.y / 100) * H),
    width: Math.round((crop.width / 100) * W),
    height: Math.round((crop.height / 100) * H),
  };
}
