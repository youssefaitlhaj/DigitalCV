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

export const LIBRARY_PREFIX = "/src/assets/uploads/";
const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"];
export const NOT_UPLOADED_MESSAGE = "This image isn't uploaded yet. Open the Assets/Media library, upload it there, then choose it here.";
export const UNSUPPORTED_FORMAT_MESSAGE =
  "This format isn't supported. Upload a JPG, PNG or WebP (on iPhone, Settings → Camera → Formats → Most Compatible).";
export const MIXED_CASE_EXTENSION_MESSAGE =
  "The file extension mixes upper and lower case (like .Jpg). Rename the file to end in .jpg, .png or .webp and upload it again.";

/**
 * Why an image src cannot be used, or null when it can. Only images already committed to the media library
 * are accepted (a fresh upload arrives as a blob: URL); a library file in a format the build cannot crop
 * (for example an iPhone .heic photo) gets its own message.
 */
export function imageSrcProblem(src) {
  if (typeof src !== "string" || !src.startsWith(LIBRARY_PREFIX)) return NOT_UPLOADED_MESSAGE;
  const rest = src.slice(LIBRARY_PREFIX.length);
  if (!rest || rest.includes("/") || rest.includes("\\") || rest === "..") return NOT_UPLOADED_MESSAGE;
  const ext = /\.([A-Za-z0-9]+)$/.exec(rest)?.[1];
  if (!ext || !ACCEPTED_EXTENSIONS.includes(ext.toLowerCase())) return UNSUPPORTED_FORMAT_MESSAGE;
  // mixed-case extensions are rejected by the build
  if (ext !== ext.toLowerCase() && ext !== ext.toUpperCase()) return MIXED_CASE_EXTENSION_MESSAGE;
  return null;
}

export const isLibraryPath = (src) => imageSrcProblem(src) === null;

/** Sveltia passes the field config as an Immutable Map; `required` defaults to true. */
export const isRequiredField = (field) => (typeof field?.get === "function" ? field.get("required") : field?.required) !== false;

/** True for a usable image value: a non-empty src string. */
const hasSrc = (v) => Boolean(v && typeof v.src === "string" && v.src !== "");

/**
 * Validation for the imageref widget. An empty value is fine unless the field is required;
 * a chosen image needs alt text in both languages.
 */
export function validateImageRef(value, required) {
  if (!hasSrc(value)) return required ? { error: { message: "Choose an image" } } : true;
  const problem = imageSrcProblem(value.src);
  if (problem) return { error: { message: problem } };
  if (!value.alt?.en?.trim() || !value.alt?.de?.trim()) return { error: { message: "Alt text is required in English and German" } };
  return true;
}

/**
 * Merges an edit into the stored value. Keys set to undefined are dropped. Without a src nothing is kept
 * (no stray alt or crop), signalled by null. A different src discards the old crop.
 */
export function mergeImageRef(current, patch) {
  const next = { ...(current ?? {}), ...patch };
  if (patch && "src" in patch && patch.src !== current?.src && !("crop" in patch)) delete next.crop;
  for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
  return hasSrc(next) ? next : null;
}

/** "Remove image" on an optional field: no src, alt or crop is kept, so the field is committed as empty (null). */
export function removeImageRef(current) {
  return mergeImageRef(current, { src: undefined, alt: undefined, crop: undefined });
}
