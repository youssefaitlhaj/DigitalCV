import { expect, test } from "@playwright/test";

test("no google fonts requests", async ({ page }) => {
  const hosts: string[] = [];
  page.on("request", (r) => hosts.push(new URL(r.url()).host));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(hosts.filter((h) => /googleapis|gstatic/.test(h))).toEqual([]);
});

test("theme toggle switches and persists", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const before = await html.getAttribute("data-theme");
  await page.locator("[data-theme-toggle]").click();
  const after = await html.getAttribute("data-theme");
  expect(after).not.toBe(before);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", after!);
});

test("de page has German menu", async ({ page }) => {
  await page.goto("/de/");
  await expect(page.locator("header").getByText("Erfahrung")).toBeAttached();
});

test("skip link targets main", async ({ page }) => {
  await page.goto("/");
  const skip = page.locator("a.skip-link");
  await expect(skip).toHaveAttribute("href", "#main");
  await expect(page.locator("main#main")).toBeAttached();
});
