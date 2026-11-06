import { describe, expect, it } from "vitest";
import {
  accents, backgrounds, swatches, contrastRatio, ensureContrast, accentText, paletteCss,
  type AccentId, type BackgroundId,
} from "../../../src/lib/palettes";
import { accentIdSchema, backgroundIdSchema } from "../../../src/content/schemas/site";

const accentIds = Object.keys(accents) as AccentId[];
const bgIds = Object.keys(backgrounds) as BackgroundId[];
const modes = ["light", "dark"] as const;

describe("palettes", () => {
  it("every accent×background passes AA in both modes", () => {
    for (const a of accentIds) for (const b of bgIds) for (const m of modes) {
      const t = backgrounds[b][m];
      const raw = accents[a][m];
      const accentInk = m === "light" ? "#FFFFFF" : t.bg;
      const at = accentText(a, b, m);
      for (const s of [t.bg, t.soft, t.panel]) expect(contrastRatio(at, s), `${a}/${b}/${m} accentText on ${s}`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.muted, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(t.ink, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(accentInk, raw), `${a}/${b}/${m} button`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("leaves accent unchanged where not needed and shifts only slightly otherwise", () => {
    expect(accentText("whisky", "oat", "dark")).toBe(accents.whisky.dark);
    const t = accentText("whisky", "oat", "light").slice(1).match(/../g)!.map((h) => parseInt(h, 16));
    const r = [0x9a, 0x5b, 0x13];
    t.forEach((c, i) => expect(Math.abs(c - r[i])).toBeLessThanOrEqual(24));
    expect(accentText("whisky", "oat", "light")).not.toBe("#9A5B13");
  });
  it("every swatch passes AA on bg, soft and panel in both modes", () => {
    for (const a of accentIds) for (const b of bgIds) for (const m of modes) for (const [id, fn] of Object.entries(swatches)) {
      const t = backgrounds[b][m];
      for (const s of [t.bg, t.soft, t.panel]) expect(contrastRatio(fn(a, b, m), s), `${id} ${a}/${b}/${m} on ${s}`).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("old gold #C9A227 on #F4EEE4 fails 4.5", () => {
    expect(contrastRatio("#C9A227", "#F4EEE4")).toBeLessThan(4.5);
  });
  it("ensureContrast is identity when passing and deterministic", () => {
    expect(ensureContrast("#000000", ["#FFFFFF"])).toBe("#000000");
    expect(ensureContrast("#9A5B13", ["#EBE3D6"])).toBe(ensureContrast("#9A5B13", ["#EBE3D6"]));
  });
  it("site.yml palette enum matches registry ids", () => {
    expect([...accentIdSchema.options].sort()).toEqual([...accentIds].sort());
    expect([...backgroundIdSchema.options].sort()).toEqual([...bgIds].sort());
  });
  it("paletteCss emits all tokens in light, dark and media blocks", () => {
    const css = paletteCss("whisky", "oat");
    expect(css).toContain(':root[data-theme="light"]');
    expect(css).toContain(':root[data-theme="dark"]');
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    for (const v of ["bg","soft","panel","line","muted","ink","accent","accent-ink","accent-text","swatch-accent","swatch-muted","swatch-highlight","swatch-positive"])
      expect(css).toContain(`--${v}:`);
  });
});
