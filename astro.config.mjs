// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

// Single source of truth for the public URL: the content file.
const { siteUrl } = parse(readFileSync("src/content/data/site.yml", "utf8"));

// https://astro.build/config
export default defineConfig({
  // Drives canonical URLs and the hreflang alternates between / and /de/.
  // Must match the domain the site is actually served from, including whether
  // it has a www prefix — a mismatch tells search engines to index addresses
  // that do not exist.
  site: siteUrl,

  i18n: {
    locales: ["en", "de"],
    defaultLocale: "en",
    routing: {
      // English at `/`, German at `/de/`. `pathFor` in src/i18n/locales.ts
      // encodes the same rule — the two must agree.
      prefixDefaultLocale: false,
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
