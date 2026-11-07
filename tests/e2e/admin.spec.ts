import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** The policy Vercel sends for /admin/* (public/_headers, via scripts/vercel-output.ts). */
function adminCsp(): string {
  const block = readFileSync("public/_headers", "utf8").split(/\n(?=\S)/).find((b) => b.startsWith("/admin/*"));
  const line = block?.split("\n").find((l) => l.trim().startsWith("Content-Security-Policy:"));
  if (!line) throw new Error("public/_headers has no CSP for /admin/*");
  return line.trim().slice("Content-Security-Policy:".length).trim();
}

test("admin app boots from same-origin files only", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const errors: string[] = [];
  const foreign: string[] = [];
  const failed: string[] = [];
  const violations: string[] = [];
  // Playwright's preview server ignores _headers, so apply the same policy to /admin/ documents here.
  const csp = adminCsp();
  await page.route("**/admin/**", async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const res = await route.fetch();
    await route.fulfill({ response: res, headers: { ...res.headers(), "content-security-policy": csp } });
  });
  page.on("console", (m) => {
    if (/content security policy/i.test(m.text())) violations.push(m.text());
  });
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
  // Token sign-in is the only method (no OAuth client): its button shows and "Sign In with GitHub" does not.
  await expect(page.getByRole("button", { name: /Sign In Using Access Token/i })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /Sign In with GitHub/i })).toHaveCount(0);
  // A rejected config would surface as an error message instead of the login screen.
  await expect(page.getByText(/config.*(error|invalid)|error.*config/i)).toHaveCount(0);

  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
  expect(foreign).toEqual([]);
  expect(failed).toEqual([]);
});
