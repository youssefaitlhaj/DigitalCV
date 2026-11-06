import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { parse } from "yaml";
import { useFixtureSite } from "./helpers/fixture-site";

const site = parse(readFileSync("src/content/data/site.yml", "utf8"));
const NAME: string = site.name;

const REDUCED = "reduced-motion";

/** The name letters as the motion layer splits them (`.ch`, `.off` while unrevealed). */
interface NameState {
  revealed: string;
  total: number;
  prefix: boolean;
  cursorAfterLast: boolean;
  h1: { x: number; y: number; width: number; height: number };
}

/** Reads the hero name's typing state in the page; `null` before the letters exist. */
function readNameState(): NameState | null {
  const h1 = document.querySelector('[data-intro="name"]');
  const chars = [...(h1?.querySelectorAll(".ch") ?? [])];
  const cur = h1?.querySelector(".cur");
  if (!h1 || !cur || chars.length === 0) return null;
  const shown = chars.map((c) => getComputedStyle(c).visibility !== "hidden");
  const count = shown.filter(Boolean).length;
  // Revealed letters form a prefix: no hidden letter comes before a shown one.
  const prefix = shown.every((s, i) => s === i < count);
  let cursorAfterLast: boolean;
  if (count === 0) {
    cursorAfterLast = cur.compareDocumentPosition(chars[0]) === Node.DOCUMENT_POSITION_FOLLOWING;
  } else {
    const last = chars[count - 1].getBoundingClientRect();
    const c = cur.getBoundingClientRect();
    const nextShown = count < chars.length ? chars[count] : null;
    cursorAfterLast =
      c.left >= last.right - 0.5 &&
      c.left <= last.right + 12 &&
      c.top < last.bottom &&
      c.bottom > last.top &&
      // Nothing hidden sits between the last letter and the cursor.
      (nextShown === null || cur.compareDocumentPosition(nextShown) === Node.DOCUMENT_POSITION_FOLLOWING);
  }
  const r = h1.getBoundingClientRect();
  return {
    revealed: chars
      .filter((_, i) => shown[i])
      .map((c) => c.textContent)
      .join(""),
    total: chars.length,
    prefix,
    cursorAfterLast,
    h1: { x: r.x, y: r.y, width: r.width, height: r.height },
  };
}

/** Waits for a frame in which the name is part-typed, and returns that frame's state. */
async function midTyping(page: Page): Promise<NameState> {
  const handle = await page.waitForFunction(
    `(() => { const s = (${readNameState.toString()})(); return s && s.revealed.length > 0 && s.revealed.length < s.total ? s : null; })()`,
    undefined,
    { polling: "raf", timeout: 10_000 },
  );
  return (await handle.jsonValue()) as NameState;
}

async function typedState(page: Page): Promise<NameState> {
  const handle = await page.waitForFunction(
    `(() => { const s = (${readNameState.toString()})(); return s && s.revealed.length === s.total ? s : null; })()`,
    undefined,
    { polling: "raf", timeout: 10_000 },
  );
  return (await handle.jsonValue()) as NameState;
}

const nameLetters = NAME.replace(/\s+/g, "");

test.describe("motion on", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name === REDUCED, "motion is off under reduced motion");
  });

  test("intro completes on first scroll", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector('[data-intro="name"] .ch') !== null);
    await page.evaluate(() => window.scrollTo({ top: 10, behavior: "instant" }));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
    const state = await page.evaluate(readNameState);
    expect(state).not.toBeNull();
    expect(state!.revealed).toBe(nameLetters);
    expect(state!.cursorAfterLast).toBe(true);
    // The rest of the intro is in its final state too.
    const opacities = await page
      .locator('[data-intro="fade"], [data-intro="json"] .ln')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities.every((o) => o === "1")).toBe(true);
  });

  test("name types left to right", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    const mid = await midTyping(page);
    expect(mid.prefix).toBe(true);
    expect(nameLetters.startsWith(mid.revealed)).toBe(true);
    expect(mid.revealed.length).toBeGreaterThan(0);
    expect(mid.revealed.length).toBeLessThan(nameLetters.length);
    expect(mid.cursorAfterLast).toBe(true);
    const done = await typedState(page);
    expect(done.revealed).toBe(nameLetters);
    expect(done.cursorAfterLast).toBe(true);
  });

  test("name typing causes no layout shift", async ({ page }) => {
    // Runs at 1280px (desktop) and 320px (narrow).
    await page.goto("/", { waitUntil: "commit" });
    const mid = await midTyping(page);
    const done = await typedState(page);
    expect(mid.h1).toEqual(done.h1);
    // Words never break mid-word: each word's letters share one line.
    const split = await page.locator('[data-intro="name"] .wd').evaluateAll((words) =>
      words.every((w) => {
        const tops = [...w.querySelectorAll(".ch")].map((c) => Math.round(c.getBoundingClientRect().top));
        return new Set(tops).size === 1;
      }),
    );
    expect(split).toBe(true);
  });

  test("the cursor sits at the start before typing", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    const handle = await page.waitForFunction(
      `(() => { const s = (${readNameState.toString()})(); return s && s.revealed.length === 0 ? s : null; })()`,
      undefined,
      { polling: "raf", timeout: 10_000 },
    );
    expect(((await handle.jsonValue()) as NameState).cursorAfterLast).toBe(true);
  });

  test("name is read whole", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(NAME);
    await typedState(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(NAME);
  });

  test("statement words fade in with scroll", async ({ page }) => {
    await page.goto("/");
    const words = page.locator("[data-statement] .w");
    expect(await words.count()).toBeGreaterThan(5);
    expect(Number(await words.last().evaluate((w) => getComputedStyle(w).opacity))).toBeLessThan(0.5);
    // Instant scroll: the page's smooth scrolling would otherwise still be under way.
    await page
      .locator("[data-statement]")
      .evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: "instant" }));
    await expect.poll(async () => Number(await words.first().evaluate((w) => getComputedStyle(w).opacity))).toBe(1);
  });

  test("journey pins only on wide screens", async ({ page }, info) => {
    await page.goto("/");
    const wrap = page.locator("section[data-journey] .track-wrap");
    if (info.project.name === "narrow") {
      await expect(page.locator(".pin-spacer")).toHaveCount(0);
      await expect(wrap).toHaveAttribute("tabindex", "0");
    } else {
      await expect(page.locator(".pin-spacer")).toHaveCount(1);
      // The track no longer scrolls itself, so it is no longer a focusable scroll region.
      await expect(wrap).not.toHaveAttribute("tabindex", /.*/);
      await expect(wrap).not.toHaveAttribute("role", /.*/);
    }
  });

  test("nav highlights the section in view, also while the journey is pinned", async ({ page }) => {
    await page.goto("/");
    const active = () => page.locator(".site-header nav a.active").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    const box = await page.locator("section[data-journey]").evaluate((el) => {
      const b = el.closest(".pin-spacer") ?? el;
      return { top: b.getBoundingClientRect().top + scrollY, height: b.getBoundingClientRect().height };
    });
    // Scroll so the viewport's middle line sits at `y`, then let ScrollTrigger handle the scroll.
    const middleAt = (y: number) =>
      page.evaluate(async (y) => {
        window.scrollTo({ top: y - innerHeight / 2, behavior: "instant" });
        for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
      }, y);
    for (const at of [0.1, 0.5, 0.8]) {
      await middleAt(box.top + box.height * at);
      expect(await active()).toEqual(["/#journey"]);
    }
    await middleAt(await page.locator("#experience").evaluate((el) => el.getBoundingClientRect().top + scrollY + 50));
    expect(await active()).toEqual(["/#experience"]);
  });

  test("intro finishes within about a second", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator('section[data-section="hero"]');
    await expect(hero).toHaveAttribute("data-intro-duration", /^\d/);
    expect(Number(await hero.getAttribute("data-intro-duration"))).toBeLessThanOrEqual(1.15);
    // Name typing keeps its speed: about 40 ms per letter.
    expect(Number(await hero.getAttribute("data-intro-letter"))).toBeCloseTo(0.04, 3);
  });

  test("name is read whole before the motion script runs", async ({ page }) => {
    await page.route(/\/_astro\/.*\.js$/, (route) => route.abort());
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/\bmotion\b/);
    // Short timeout: the 3 s failsafe would otherwise reveal the name anyway.
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(NAME, { timeout: 1_000 });
    await expect(page.locator("html")).toHaveClass(/\bmotion\b/);
  });

  test("printing before scrolling shows everything in its final state", async ({ page }) => {
    await page.goto("/");
    await typedState(page);
    await page.emulateMedia({ media: "print" });
    const styles = (sel: string, prop: string) =>
      page.locator(sel).evaluateAll((els, prop) => els.map((e) => getComputedStyle(e).getPropertyValue(prop)), prop);
    for (const sel of ["[data-chips] > *", "[data-statement] .w", "[data-scale-in]", "[data-intro]", '[data-intro="json"] .ln']) {
      expect(new Set(await styles(sel, "opacity")), sel).toEqual(new Set(["1"]));
    }
    for (const sel of ["[data-journey-track]", "[data-journey-rail]", "[data-rail-fill]", "[data-chips] > *"]) {
      for (const t of await styles(sel, "transform")) expect(t, sel).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    }
    // Section labels print their title, not the empty typing copy.
    const label = page.locator("#experience h2.label .visually-hidden");
    expect(await label.evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThan(20);
  });

  test("content shows within 3 s if the motion script never loads", async ({ page }) => {
    await page.route(/\/_astro\/.*\.js$/, (route) => route.abort());
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\bmotion\b/, { timeout: 4_000 });
    await expect(page.locator('[data-intro="name"] [data-name]')).toBeVisible();
    for (const el of await page.locator('[data-intro="fade"], [data-intro="photo"]').all()) {
      expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    }
  });
});

test.describe("reduced motion", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== REDUCED, "runs in the reduced-motion project");
  });

  test("reduced motion: all text fully opaque, counters at final value, no pinned spacer", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).not.toHaveClass(/\bmotion\b/);
    const statement = page.locator("[data-statement]");
    expect(await statement.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    for (const w of await page.locator("[data-statement] .w").all()) {
      expect(await w.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
    }
    for (const n of await page.locator("[data-count]").all()) {
      await expect(n).toHaveText((await n.getAttribute("data-count"))!);
    }
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    // Decorative rails are drawn, not waiting for scroll.
    for (const rail of await page.locator("[data-journey-rail], [data-rail-fill]").all()) {
      expect(await rail.evaluate((e) => getComputedStyle(e).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    }
    await expect(page.locator('[data-intro="name"] .ch')).toHaveCount(0);
    for (const el of await page.locator("[data-intro]").all()) {
      expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
      expect(await el.evaluate((e) => getComputedStyle(e).visibility)).toBe("visible");
    }
  });
});

test.describe("no JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("no JS: content visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/\bmotion\b/);
    for (const el of await page.locator("[data-intro]").all()) {
      await expect(el).toBeVisible();
      expect(await el.evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
      expect(await el.evaluate((e) => getComputedStyle(e).visibility)).toBe("visible");
    }
    await expect(page.locator("h1")).toHaveText(NAME);
    for (const rail of await page.locator("[data-journey-rail], [data-rail-fill]").all()) {
      expect(await rail.evaluate((e) => getComputedStyle(e).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    }
  });
});

test.describe("motion fixture", () => {
  const fixture = useFixtureSite("motion", ({ page }) => {
    const byId = (id: string) => page.sections.find((s) => s.id === id)!;
    byId("statement").text = {
      en: "Seven years on **one product**, and <u>still</u> <span class=\"c-accent\">building it</span>.",
      de: "Sieben Jahre an **einem Produkt**, und <u>immer noch</u> <span class=\"c-accent\">dabei</span>.",
    };
    byId("experience").animate = false;
    byId("stats").items[3].value = { kind: "number", n: 2.5 };
  });

  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== "desktop", "motion is on and the fixture is built once");
  });

  test("statement keeps formatting while split", async ({ page }) => {
    await page.goto(fixture.url("/"));
    const statement = page.locator("[data-statement]");
    await expect(statement.locator(".w").first()).toBeAttached();
    await expect(statement.locator("strong")).toHaveText("one product");
    await expect(statement.locator("strong .w")).toHaveCount(2);
    await expect(statement.locator("u")).toHaveText("still");
    await expect(statement.locator("span.c-accent")).toHaveText("building it");
    await expect(statement.locator("span.c-accent .w")).toHaveCount(2);
    await expect(statement).toHaveText("Seven years on one product, and still building it.");
  });

  test("counters end on the exact server-rendered value", async ({ page }) => {
    await page.goto(fixture.url("/"));
    const counter = page.locator("[data-count]").nth(3);
    await expect(counter).toHaveAttribute("data-count", "2.5");
    await counter.evaluate((el) => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 200, behavior: "instant" }));
    await page.waitForTimeout(1_500);
    await expect(counter).toHaveText("2.5");
  });

  test("animate:false section has no ScrollTrigger", async ({ page }) => {
    await page.goto(fixture.url("/"));
    await expect(page.locator("[data-statement] .w").first()).toBeAttached();
    const fill = page.locator("#experience [data-rail-fill]");
    expect(await fill.evaluate((e) => getComputedStyle(e).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    // Every commit node is lit in its final state.
    const borders = await page
      .locator("#experience [data-commit]")
      .evaluateAll((els) => els.map((e) => getComputedStyle(e, "::before").transform));
    expect(new Set(borders).size).toBe(1);
    expect(borders[0]).not.toBe("none");
    // The label is not retyped either.
    await expect(page.locator("#experience h2.label")).toHaveText("// Experience");
    await expect(page.locator("#experience h2.label [aria-hidden='true']")).toHaveCount(1);
  });
});
