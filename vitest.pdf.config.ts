/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// PDF tests need a built `dist`, so they are kept out of the default `npm test` run.
export default getViteConfig({
  test: { include: ["tests/unit/pdf/**/*.test.ts"] },
});
