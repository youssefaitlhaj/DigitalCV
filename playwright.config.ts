import { defineConfig, devices } from "@playwright/test";

const PORT = 4329;

// One id per run, inherited by every worker: fixture sites (tests/e2e/helpers/fixture-site.ts)
// are built once per run and shared between workers through it.
process.env.FIXTURE_RUN_ID ??= `${Date.now()}-${process.pid}`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "narrow", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 640 } } },
    { name: "reduced-motion", use: { ...devices["Desktop Chrome"], reducedMotion: "reduce" } },
  ],
});
