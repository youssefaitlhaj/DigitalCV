import { expect, test } from "@playwright/test";

test("privacy page in both languages linked from footer", async ({ page }) => {
  await page.goto("/");
  await page.locator("footer").getByRole("link", { name: "Privacy" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.locator("main h1")).toHaveText("Privacy policy");
  await expect(page.locator('link[rel="alternate"][hreflang="de"]')).toHaveAttribute("href", /\/de\/privacy$/);

  await page.goto("/de/");
  await page.locator("footer").getByRole("link", { name: "Datenschutz" }).click();
  await expect(page).toHaveURL(/\/de\/privacy$/);
  await expect(page.locator("main h1")).toHaveText("Datenschutzerklärung");
});

test("impressum hidden by default: no footer link, /impressum not 200", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('footer a[href$="/impressum"]')).toHaveCount(0);
  for (const url of ["/impressum", "/de/impressum"]) {
    const res = await page.goto(url);
    expect(res?.status()).toBe(404);
  }
});

test("meta description and og:title come from site.yml per locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Youssef Ait Lhaj — Software Developer");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Youssef Ait Lhaj — Software Developer");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\w{10}/);
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2);

  await page.goto("/de/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Youssef Ait Lhaj — Softwareentwickler");
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "de_DE");
});

test("no analytics script outside production", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('script[data-website-id]')).toHaveCount(0);
});
