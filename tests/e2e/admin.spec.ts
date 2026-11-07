import { expect, test } from "@playwright/test";

test("admin app boots from same-origin files only", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const errors: string[] = [];
  const foreign: string[] = [];
  const failed: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().startsWith("data:") || r.url().startsWith("blob:")) return;
    if (new URL(r.url()).origin === origin) return;
    // Sveltia itself fetches a few third-party data files and fonts; those are tolerated, but code never is.
    const tolerated = /^https:\/\/(unpkg\.com\/@sveltia\/cms(@[\d.]+)?\/package\.json|cdn\.jsdelivr\.net\/fontsource\/|www\.githubstatus\.com\/api\/)/;
    if (r.resourceType() === "script" || !tolerated.test(r.url())) foreign.push(r.url());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });

  await page.goto("/admin/");
  // Sveltia renders its sign-in screen into <body>; the page ships empty, so any child proves it booted.
  await expect(page.locator("body > *:not(script)").first()).toBeAttached({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /GitHub/i }).first()).toBeVisible({ timeout: 15_000 });
  // A rejected config would surface as an error message instead of the login screen.
  await expect(page.getByText(/config.*(error|invalid)|error.*config/i)).toHaveCount(0);

  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
  expect(failed).toEqual([]);
});
