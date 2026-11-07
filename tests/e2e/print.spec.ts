import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { parse } from "yaml";
import { useFixtureSite } from "./helpers/fixture-site";

const site = parse(readFileSync("src/content/data/site.yml", "utf8"));
const address = `${site.email.user}@${site.email.domain}`;
const PRINT_PATHS = ["/cv/print", "/de/cv/print"];

async function bodyText(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText);
}

test.describe("print route", () => {
  test("renders the pdf sections in page order, light theme, noindex", async ({ page }) => {
    for (const path of PRINT_PATHS) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      const types = await page.locator("main [data-section]").evaluateAll((els) => els.map((e) => e.getAttribute("data-section")));
      expect(types[0]).toBe("hero");
      expect(types).toEqual(expect.arrayContaining(["timeline", "tags", "text"]));
    }
  });

  test("stays light when the visitor prefers or stored dark", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/cv/print");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim());
    expect(bg.toUpperCase()).toBe("#F4EEE4");
  });

  test("no motion, theme toggle or analytics", async ({ page }) => {
    expect((await page.goto("/cv/print"))?.status()).toBe(200);
    await expect(page.locator("html")).not.toHaveClass(/motion/);
    await expect(page.locator("[data-theme-toggle]")).toHaveCount(0);
    await expect(page.locator('script[src*="umami"]')).toHaveCount(0);
    await expect(page.locator("[data-intro], [data-typer], [data-statement], [data-journey]")).toHaveCount(0);
  });

  test("header shows name, role, location, email and LinkedIn as text", async ({ page }) => {
    await page.goto("/de/cv/print");
    await expect(page.locator("html")).toHaveAttribute("data-email-ready", "true");
    const header = page.locator('[data-section="hero"]');
    await expect(header.locator("h1")).toHaveText(site.name);
    await expect(header).toContainText("Softwareentwickler bei Imbus AG");
    await expect(header).toContainText("Bamberg, Bayern, Deutschland");
    await expect(header).toContainText(address);
    await expect(header).toContainText("linkedin.com/in/youssefaitlhaj");
  });

  test("email halves only in built HTML, assembled at runtime", async ({ page, request }) => {
    for (const path of PRINT_PATHS) {
      const html = await (await request.get(path)).text();
      expect(html).not.toContain(address);
      expect(html).toContain(`data-email-user="${site.email.user}"`);
      await page.goto(path);
      await expect(page.locator('[data-section="hero"]')).toContainText(address);
    }
  });

  test("print has no phone or address", async ({ page }) => {
    for (const path of PRINT_PATHS) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-email-ready", "true");
      const text = await bodyText(page);
      expect(text).not.toMatch(/\+?\d[\d\s/-]{7,}/);
      expect(text).not.toMatch(/Straße|Str\./);
    }
  });

  test("links print their URL, except org names and URL texts", async ({ page }) => {
    await page.goto("/cv/print");
    await page.emulateMedia({ media: "print" });
    const after = (sel: string) => page.locator(sel).first().evaluate((a) => getComputedStyle(a, "::after").content);
    // Organisation names stay clickable links but print no URL after them.
    await expect(page.locator('[data-section="timeline"] a[href="https://www.imbus.de/"]').first()).toBeVisible();
    expect(await after('[data-section="timeline"] a[href="https://www.imbus.de/"]')).toBe("none");
    expect(await after('[data-section="timeline"] a[href="https://www.uni-bamberg.de/"]')).toBe("none");
    expect(await after('[data-section="hero"] a[href^="https://www.linkedin.com"]')).toBe("none");
    // Any other external link (project links, links in rich text) prints its URL.
    await page.evaluate(() => {
      const a = Object.assign(document.createElement("a"), { href: "https://example.com/x", textContent: "x", id: "probe" });
      document.querySelector("main")!.append(a);
    });
    // Chromium reports either the resolved string or the `attr(href)` expression.
    expect(await after("#probe")).toMatch(/attr\(href\)|https:\/\/example\.com\/x/);
  });

  test("the sheet is white for printing", async ({ page }) => {
    await page.goto("/cv/print");
    await page.emulateMedia({ media: "print" });
    for (const el of ["html", "body"]) {
      expect(await page.locator(el).evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(255, 255, 255)");
    }
  });

  test("items never split and headings stay with the next item", async ({ page }) => {
    await page.goto("/cv/print");
    await page.emulateMedia({ media: "print" });
    const items = page.locator(".p-item");
    expect(await items.count()).toBeGreaterThan(10);
    for (const v of await items.evaluateAll((els) => els.map((e) => getComputedStyle(e).breakInside))) expect(v).toBe("avoid");
    const heads = page.locator(".p-head");
    expect(await heads.count()).toBeGreaterThan(3);
    for (const v of await heads.evaluateAll((els) => els.map((e) => getComputedStyle(e).breakAfter))) expect(v).toBe("avoid");
  });
});

test.describe("print route with pdf-excluded skills, hidden about, no portrait", () => {
  const fixture = useFixtureSite("print-excluded", ({ site: s, page }) => {
    page.sections.find((x) => x.id === "skills")!.inPdf = false;
    page.sections.find((x) => x.id === "about")!.visible = false;
    s.pdf.includePortrait = false;
  });

  test("print omits hidden and pdf-excluded sections", async ({ page }) => {
    for (const path of PRINT_PATHS) {
      await page.goto(fixture.url(path));
      await expect(page.locator('main [data-section="timeline"]').first()).toBeVisible();
      await expect(page.locator('main [data-section="tags"]')).toHaveCount(0);
      await expect(page.locator('main [data-section="text"]')).toHaveCount(0);
    }
    // Excluded from the PDF only: the website still shows skills.
    await page.goto(fixture.url("/"));
    await expect(page.locator('section[data-section="tags"]')).toHaveCount(1);
  });

  test("portrait toggle respected", async ({ page }) => {
    await page.goto("/cv/print");
    await expect(page.locator('[data-section="hero"] img')).toHaveCount(1);
    await page.goto(fixture.url("/cv/print"));
    await expect(page.locator('[data-section="hero"]')).toBeVisible();
    await expect(page.locator('[data-section="hero"] img')).toHaveCount(0);
  });
});
