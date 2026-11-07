import { z } from "zod";

/** Trimmed, non-empty string: the default payload of a localized field. */
const text = z.string().trim().min(1);

/** A required value in every shipped language. Empty strings fail. */
export function localized<T extends z.ZodTypeAny = typeof text>(inner?: T) {
  const schema = (inner ?? text) as T;
  return z.object({ en: schema, de: schema });
}

/** Markdown source. Rendering happens elsewhere. */
export const richText = z.string().trim().min(1);

export const localizedRich = localized(richText);

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const YEAR = /^\d{4}$/;

/** `YYYY-MM` or the literal `"present"`. */
export const month = z
  .string()
  .refine((v) => v === "present" || MONTH.test(v), {
    message: 'Expected "YYYY-MM" or "present"',
  });

/** `YYYY` or `YYYY-MM`. */
export const yearOrMonth = z
  .string()
  .refine((v) => YEAR.test(v) || MONTH.test(v), {
    message: 'Expected "YYYY" or "YYYY-MM"',
  });

/** `""`, `null`, and objects whose values are all blank (e.g. `{ en: "", de: "" }`, an empty crop) count as absent. */
function isBlank(v: unknown): boolean {
  if (v === "" || v === null || v === undefined) return true;
  if (typeof v === "object" && !Array.isArray(v)) return Object.values(v as object).every(isBlank);
  return false;
}

/** An optional field where an editor leaving it empty means "not set" rather than an invalid empty value. */
export function optionalField<T extends z.ZodType>(inner: T) {
  return z.preprocess((v) => (isBlank(v) ? undefined : v), inner.optional());
}

const percent = z.number().min(0).max(100);

/** Crop rectangle in percent of the source image. */
const crop = z
  .object({
    x: percent,
    y: percent,
    width: percent.gt(0),
    height: percent.gt(0),
  })
  .refine((c) => c.x + c.width <= 100, {
    message: "x + width must be ≤ 100",
    path: ["width"],
  })
  .refine((c) => c.y + c.height <= 100, {
    message: "y + height must be ≤ 100",
    path: ["height"],
  });

export const imageRef = z.object({
  src: z
    .string()
    .startsWith("/src/assets/uploads/")
    .refine((v) => !v.includes("\\") && !v.split("/").includes(".."), {
      message: "Path must not contain '..' segments or backslashes",
    })
    .refine((v) => !v.slice("/src/assets/uploads/".length).includes("/"), {
      message: "Image must sit directly in src/assets/uploads (no subfolders)",
    }),
  alt: localized(),
  crop: optionalField(crop),
});

export const slugId = z.string().regex(/^[a-z0-9-]+$/);

export type Localized<T = string> = { en: T; de: T };
export type RichText = z.infer<typeof richText>;
export type ImageRef = z.infer<typeof imageRef>;
