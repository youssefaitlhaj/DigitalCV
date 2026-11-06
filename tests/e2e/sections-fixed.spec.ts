import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";

const site = parse(readFileSync("src/content/data/site.yml", "utf8"));

/** Whole years since `YYYY-MM`, the same rule as `resolveStat` (inclusive months / 12). */
function yearsSince(start: string, now = new Date()): number {
  const [y, m] = start.split("-").map(Number);
  const months = (now.getUTCFullYear() - y) * 12 + (now.getUTCMonth() + 1 - m) + 1;
  return Math.floor(months / 12);
}

test.describe("fixed sections, JavaScript disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("hero shows name, role, cv link to /cv/youssef-ait-lhaj-cv-en.pdf", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator('section[data-section="hero"]');
    await expect(hero).toHaveAttribute("id", "hero");
    await expect(hero.locator("h1")).toHaveText(site.name);
    await expect(hero.locator("h1")).toBeVisible();
    await expect(hero.getByText("Software Developer at Imbus AG")).toBeVisible();
    await expect(hero.locator(".prompt")).toContainText("~/bamberg $ whoami");
    const cv = hero.locator('a[data-umami-event="cv-download"]');
    await expect(cv).toHaveAttribute("href", "/cv/youssef-ait-lhaj-cv-en.pdf");
    await expect(cv).toHaveAttribute("data-umami-event-lang", "en");
    await expect(hero.locator(".code .ok")).toHaveText("✓ valid");
    await expect(hero.locator(".code pre")).toContainText('"location": "Bamberg, Germany",');
    await expect(hero.locator(".code pre")).toContainText('"stack": ["Java", "C#", ".NET", "SQL"],');
    await expect(hero.locator(".photo img")).toBeVisible();
  });

  test("hero cv link is localised on /de/", async ({ page }) => {
    await page.goto("/de/");
    const cv = page.locator('section[data-section="hero"] a[data-umami-event="cv-download"]');
    await expect(cv).toHaveAttribute("href", "/cv/youssef-ait-lhaj-cv-de.pdf");
    await expect(cv).toHaveAttribute("data-umami-event-lang", "de");
  });

  test("stats show computed numbers 7 and 11 in final markup", async ({ page }) => {
    await page.goto("/");
    const numbers = page.locator('section[data-section="stats"] [data-count]');
    await expect(numbers).toHaveCount(4);
    // 7 and 11 as of 2026; computed so the test does not rot with the content.
    const expected = [yearsSince("2019-08"), yearsSince("2015-03"), 3, 4].map(String);
    await expect(numbers).toHaveText(expected);
    for (let i = 0; i < expected.length; i++) {
      await expect(numbers.nth(i)).toHaveAttribute("data-count", expected[i]);
    }
  });

  test("statement keeps its accent highlight", async ({ page }) => {
    await page.goto("/");
    const statement = page.locator('section[data-section="statement"] [data-statement]');
    await expect(statement).toContainText("Seven years on one product.");
    await expect(statement.locator(".c-accent")).toHaveText("stayed through my whole degree");
  });

  test("journey has 6 stops in order, last marked HEAD", async ({ page }) => {
    await page.goto("/");
    const journey = page.locator("section[data-journey]");
    await expect(journey).toHaveAttribute("id", "journey");
    await expect(journey.locator("h2")).toHaveText("From Casablanca to Bamberg.");
    await expect(journey.locator(".label")).toContainText("Journey");
    await expect(journey.locator("[data-journey-track]")).toHaveCount(1);
    await expect(journey.locator("[data-journey-rail]")).toHaveCount(1);
    const stops = journey.locator(".stop");
    await expect(stops.locator("h3")).toHaveText([
      "Casablanca",
      "First commit",
      "Bachelor's and two more internships",
      "Bamberg",
      "Second degree, still building",
      "Full time",
    ]);
    await expect(stops.last()).toHaveClass(/head-commit/);
    await expect(stops.last().locator(".yr")).toHaveText("2026 · HEAD");
    await expect(journey.locator(".head-commit")).toHaveCount(1);
  });

  test("journey reads as a vertical list at narrow widths", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await expect(page.locator("section[data-journey] .stop")).toHaveCount(6);
    const boxes = await page.locator("section[data-journey] .stop").evaluateAll((els) =>
      els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y })),
    );
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].x).toBe(boxes[0].x);
      expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test("email address not present as one string in HTML source", async ({ page, request }) => {
    const address = `${site.email.user}@${site.email.domain}`;
    for (const path of ["/", "/de/"]) {
      const html = await (await request.get(path)).text();
      expect(html).not.toContain(address);
    }
    await page.goto("/");
    const email = page.locator('section[data-section="contact"] a[data-umami-event="email-click"]');
    await expect(email).toHaveAttribute("data-email-user", site.email.user);
    await expect(email).toHaveAttribute("data-email-domain", site.email.domain);
    const linkedin = page.locator('section[data-section="contact"] a[data-umami-event="linkedin-click"]');
    await expect(linkedin).toHaveAttribute("href", site.linkedin);
    await expect(linkedin).toHaveAttribute("rel", /noopener/);
  });

  test("motto hidden by default", async ({ page, request }) => {
    const html = await (await request.get("/")).text();
    expect(html).not.toContain("Enjoy the ride");
    await page.goto("/");
    await expect(page.locator("main")).not.toContainText("Enjoy the ride");
  });

  test("journey heading is localised on /de/", async ({ page }) => {
    await page.goto("/de/");
    await expect(page.locator("section[data-journey] h2")).toHaveText("Von Casablanca nach Bamberg.");
  });

  test("scroll regions are keyboard-focusable and labelled", async ({ page }) => {
    await page.goto("/");
    const wrap = page.locator("section[data-journey] .track-wrap");
    await expect(wrap).toHaveAttribute("tabindex", "0");
    await expect(wrap).toHaveAttribute("aria-label", /.+/);
    // The rail is not a list item, so it sits outside the list.
    await expect(page.locator("section[data-journey] ol > li")).toHaveCount(6);
    await expect(page.locator("section[data-journey] ol > :not(li)")).toHaveCount(0);
    await expect(page.locator("section[data-journey] ol [data-journey-rail]")).toHaveCount(0);
  });

  test("json card wraps instead of clipping at 375px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/de/");
    const pre = page.locator('section[data-section="hero"] .code pre');
    const fits = await pre.evaluate((el) => el.scrollWidth <= el.clientWidth);
    expect(fits).toBe(true);
  });

  test("contact shows the closing line and lead", async ({ page }) => {
    await page.goto("/de/");
    const contact = page.locator('section[data-section="contact"]');
    await expect(contact.locator("[data-scale-in]")).toHaveText("Lass uns etwas bauen, das es wert ist.");
    await expect(contact).toContainText("Offen für ein Gespräch");
    const cv = contact.locator('a[data-umami-event="cv-download"]');
    await expect(cv).toHaveAttribute("href", "/cv/youssef-ait-lhaj-cv-de.pdf");
  });

  test("fixed sections render in page order with root attributes", async ({ page }) => {
    await page.goto("/");
    const roots = page.locator("main > section[data-section]");
    await expect(roots).toHaveCount(5);
    expect(await roots.evaluateAll((els) => els.map((e) => e.getAttribute("data-section")))).toEqual([
      "hero",
      "statement",
      "stats",
      "journey",
      "contact",
    ]);
    for (const el of await roots.all()) {
      await expect(el).toHaveAttribute("data-animate", "true");
    }
  });
});

test("email link is assembled at runtime", async ({ page }) => {
  await page.goto("/");
  const email = page.locator('a[data-umami-event="email-click"]');
  await expect(email).toHaveAttribute("href", `mailto:${site.email.user}@${site.email.domain}`);
  await expect(page.locator("[data-magnetic]")).toHaveCount(0);
});
