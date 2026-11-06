import type { z } from "zod";
import type { accentIdSchema, backgroundIdSchema } from "../content/schemas/site";

export type AccentId = z.infer<typeof accentIdSchema>;
export type BackgroundId = z.infer<typeof backgroundIdSchema>;
export type Mode = "light" | "dark";
export type SwatchId = "accent" | "muted" | "highlight" | "positive";
export interface Tokens { bg: string; soft: string; panel: string; line: string; muted: string; ink: string }

export const accents: Record<AccentId, { label: string; light: string; dark: string }> = {
  whisky: { label: "Whisky", light: "#9A5B13", dark: "#E0A14A" },
  bourbon: { label: "Bourbon", light: "#8A4A14", dark: "#E3955A" },
  singleMalt: { label: "Single malt", light: "#8A6A12", dark: "#E3B341" },
  green: { label: "Green", light: "#047857", dark: "#7EE787" },
};

export const backgrounds: Record<BackgroundId, { label: string; light: Tokens; dark: Tokens }> = {
  white: {
    label: "White",
    light: { bg: "#FFFFFF", soft: "#F5F5F4", panel: "#FAFAF9", line: "#E7E5E4", muted: "#5F5A55", ink: "#141210" },
    dark: { bg: "#0D1117", soft: "#151B23", panel: "#151B23", line: "#262D36", muted: "#8B97A5", ink: "#E6EDF3" },
  },
  paper: {
    label: "Paper",
    light: { bg: "#FAF8F5", soft: "#F2EEE8", panel: "#F6F3EE", line: "#E6E0D7", muted: "#625A51", ink: "#1A1612" },
    dark: { bg: "#141210", soft: "#1C1916", panel: "#1C1916", line: "#2E2924", muted: "#A3998C", ink: "#EFE9E1" },
  },
  oat: {
    label: "Oat",
    light: { bg: "#F4EEE4", soft: "#EBE3D6", panel: "#EFE8DC", line: "#DDD2C1", muted: "#5E5446", ink: "#1C1813" },
    dark: { bg: "#17130F", soft: "#201B16", panel: "#201B16", line: "#342D25", muted: "#A89B89", ink: "#F0E8DC" },
  },
  stone: {
    label: "Stone",
    light: { bg: "#F2F2EF", soft: "#E8E8E3", panel: "#ECECE8", line: "#D9D9D2", muted: "#575750", ink: "#161614" },
    dark: { bg: "#141414", soft: "#1C1C1B", panel: "#1C1C1B", line: "#2D2D2B", muted: "#9C9C95", ink: "#EDEDEA" },
  },
};

// ---- colour maths -------------------------------------------------------

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two hex colours. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function rgbToHsl([r, g, b]: [number, number, number]): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/**
 * Returns `color` unchanged if it reaches `min` contrast on every surface; otherwise moves it
 * in small lightness steps (darker on light surfaces, lighter on dark) until it does.
 */
export function ensureContrast(color: string, surfaces: string[], min = 4.5): string {
  const passes = (c: string) => surfaces.every((s) => contrastRatio(c, s) >= min);
  if (passes(color)) return color;
  const avg = surfaces.reduce((n, s) => n + luminance(s), 0) / surfaces.length;
  const dir = avg > 0.18 ? -1 : 1;
  const [h, s, l] = rgbToHsl(parseHex(color));
  for (let step = 1; step <= 1000; step++) {
    const nl = l + (dir * step) / 1000;
    if (nl < 0 || nl > 1) break;
    const c = toHex(hslToRgb([h, s, nl]));
    if (passes(c)) return c;
  }
  return dir < 0 ? "#000000" : "#FFFFFF";
}

// ---- derived tokens -----------------------------------------------------

const surfaces = (t: Tokens) => [t.bg, t.soft, t.panel];

/** Accent shifted minimally so normal-size text passes 4.5:1 on bg, soft and panel. */
export function accentText(accent: AccentId, bg: BackgroundId, mode: Mode): string {
  return ensureContrast(accents[accent][mode], surfaces(backgrounds[bg][mode]));
}

const HIGHLIGHT: Record<Mode, string> = { light: "#9B2C1D", dark: "#F08A78" };
const POSITIVE: Record<Mode, string> = { light: "#1B7A3A", dark: "#7EE787" };

export const swatches: Record<SwatchId, (accent: AccentId, bg: BackgroundId, mode: Mode) => string> = {
  accent: (a, b, m) => accentText(a, b, m),
  muted: (_a, b, m) => backgrounds[b][m].muted,
  highlight: (_a, b, m) => ensureContrast(HIGHLIGHT[m], surfaces(backgrounds[b][m])),
  positive: (_a, b, m) => ensureContrast(POSITIVE[m], surfaces(backgrounds[b][m])),
};

function block(accent: AccentId, bg: BackgroundId, mode: Mode, indent: string): string {
  const t = backgrounds[bg][mode];
  const vars: Record<string, string> = {
    bg: t.bg, soft: t.soft, panel: t.panel, line: t.line, muted: t.muted, ink: t.ink,
    accent: accents[accent][mode],
    "accent-ink": mode === "light" ? "#FFFFFF" : t.bg,
    "accent-text": accentText(accent, bg, mode),
    "swatch-accent": swatches.accent(accent, bg, mode),
    "swatch-muted": swatches.muted(accent, bg, mode),
    "swatch-highlight": swatches.highlight(accent, bg, mode),
    "swatch-positive": swatches.positive(accent, bg, mode),
  };
  return Object.entries(vars).map(([k, v]) => `${indent}--${k}: ${v};`).join("\n");
}

/** CSS text defining every palette token for light, dark and the system-preference fallback. */
export function paletteCss(accent: AccentId, bg: BackgroundId): string {
  return [
    `:root {\n${block(accent, bg, "light", "  ")}\n}`,
    `:root[data-theme="light"] {\n${block(accent, bg, "light", "  ")}\n}`,
    `:root[data-theme="dark"] {\n${block(accent, bg, "dark", "  ")}\n}`,
    `@media (prefers-color-scheme: dark) {\n  :root:not([data-theme="light"]) {\n${block(accent, bg, "dark", "    ")}\n  }\n}`,
  ].join("\n");
}
