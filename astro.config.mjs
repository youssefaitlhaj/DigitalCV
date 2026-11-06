// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  // Drives canonical URLs and the hreflang alternates between / and /de/.
  // Must match the domain the site is actually served from, including whether
  // it has a www prefix — a mismatch tells search engines to index addresses
  // that do not exist.
  site: "https://youssefaitlhaj.com",

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
