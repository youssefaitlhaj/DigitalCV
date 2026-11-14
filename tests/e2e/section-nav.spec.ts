import { expect, test, type Locator, type Page } from "@playwright/test";

/** The floating sections bar at the bottom of the viewport. */
const bar = (page: Page) => page.getByRole("navigation", { name: "Sections" });
const pill = (page: Page) => page.locator("[data-secnav] .pill");

/** Waits until the motion layer has run (it marks itself ready). */
const motionReady = (page: Page) => expect(page.locator("html")).toHaveClass(/motion-ready/);

/** Scrolls so the viewport's middle line sits at `y`, then lets ScrollTrigger catch up. */
const middleAt = (page: Page, y: number) =>
  page.evaluate(async (y) => {
    window.scrollTo({ top: y - innerHeight / 2, behavior: "instant" });
    for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
  }, y);

async function scrollToBottom(page: Page) {
  await page.evaluate(async () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    for (let i = 0; i < 3; i++) await new Promise((r) => requestAnimationFrame(r));
  });
}

/** True when the two boxes share any area. */
async function overlaps(a: Locator, b: Locator): Promise<boolean> {
  const [x, y] = [await a.boundingBox(), await b.boundingBox()];
  if (!x || !y) throw new Error("element has no box");
  return x.x < y.x + y.width && y.x < x.x + x.width && x.y < y.y + y.height && y.y < x.y + x.height;
}

test("the header keeps only logo, language and theme; the section links are in the bar", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('header a[href*="#"]')).toHaveCount(0);
  await expect(page.locator("header [data-locale-link]")).toHaveCount(1);
  await expect(page.locator("header [data-theme-toggle]")).toHaveCount(1);
  // Located by attribute: under motion the bar is still tucked away (and out of the accessibility tree) at the top.
  const nav = page.locator("[data-secnav]");
  await expect(nav).toHaveAttribute("aria-label", "Sections");
  await expect(nav.locator("a", { hasText: "Experience" })).toHaveAttribute("href", "/#experience");
  await expect(nav.locator("a", { hasText: "Contact" })).toHaveAttribute("href", "/#contact");
});

test("the bar is not on the print route", async ({ page }) => {
  await page.goto("/cv/print");
  await expect(page.locator("[data-secnav]")).toHaveCount(0);
});

test("the bar is hidden when printing", async ({ page }) => {
  await page.goto("/");
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("[data-secnav]")).toBeHidden();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the bar is visible and its links work", async ({ page }) => {
    await page.goto("/");
    await expect(pill(page)).toBeVisible();
    await expect(pill(page)).toBeInViewport();
    await bar(page).getByRole("link", { name: "Experience" }).click();
    await expect(page).toHaveURL(/#experience$/);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("the bar is visible from the top of the page", async ({ page }) => {
    await page.goto("/");
    await expect(pill(page)).toBeVisible();
    await expect(pill(page)).toBeInViewport();
  });
});

test.describe("motion on", () => {
  test.beforeEach(async ({}, info) => {
    test.skip(info.project.name === "reduced-motion", "motion is off under reduced motion");
  });

  test("the bar is tucked away at the top and slides in past the hero", async ({ page }) => {
    await page.goto("/");
    await motionReady(page);
    await expect(bar(page)).toBeHidden();
    // Hidden with `visibility`, so its links are out of the tab order too.
    await expect(page.locator("[data-secnav] a").first()).toHaveCSS("visibility", "hidden");
    const heroBottom = await page.locator('[data-section="hero"]').evaluate((el) => el.getBoundingClientRect().bottom + scrollY);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), heroBottom);
    await expect(pill(page)).toBeVisible();
    await expect(pill(page)).toBeInViewport();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(bar(page)).toBeHidden();
  });

  test("the link of the section in view is current and the indicator sits behind it", async ({ page }) => {
    await page.goto("/");
    await motionReady(page);
    const current = page.locator('[data-secnav] a[aria-current="true"]');
    const experience = page.locator("#experience");
    const { top, height } = await experience.evaluate((el) => ({ top: el.getBoundingClientRect().top + scrollY, height: el.getBoundingClientRect().height }));
    for (const at of [50, height / 2, height - 50]) {
      await middleAt(page, top + at);
      await expect(current).toHaveCount(1);
      await expect(current).toHaveAttribute("href", "/#experience");
    }
    const link = await current.boundingBox();
    await expect
      .poll(async () => {
        const box = await page.locator("[data-secnav-indicator]").boundingBox();
        return box && link ? Math.abs(box.x - link.x) + Math.abs(box.width - link.width) : Infinity;
      })
      .toBeLessThan(2);
    // Back in the hero, nothing is current.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(current).toHaveCount(0);
  });
});

test.describe("phone width", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("the links scroll inside the bar, not the page", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo({ top: innerHeight * 2, behavior: "instant" }));
    await expect(pill(page)).toBeVisible();
    const list = page.locator("[data-secnav-list]");
    const { scrollWidth, clientWidth } = await list.evaluate((el) => ({ scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }));
    expect(scrollWidth).toBeGreaterThan(clientWidth);
    expect(await list.evaluate((el) => getComputedStyle(el).overflowX)).toBe("auto");
    expect(await list.evaluate((el) => ((el.scrollLeft = 1e4), el.scrollLeft))).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    // The pill stays inside the viewport and its links are comfortable tap targets.
    const box = await pill(page).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    for (const link of await bar(page).getByRole("link").all()) expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe("scrolling the bar with a mouse", () => {
  test.use({ viewport: { width: 390, height: 700 } });

  const list = (page: Page) => page.locator("[data-secnav-list]");
  const scrollLeft = (page: Page) => list(page).evaluate((el) => el.scrollLeft);

  /** Past the hero, so the bar is shown; the bar strip back at its start. */
  async function showBar(page: Page) {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo({ top: innerHeight * 2, behavior: "instant" }));
    await expect(pill(page)).toBeVisible();
    await list(page).evaluate((el) => (el.scrollLeft = 0));
    await page.waitForTimeout(100);
  }

  async function centreOf(locator: Locator) {
    const box = (await locator.boundingBox())!;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  test("the wheel over the bar scrolls it sideways, not the page", async ({ page }) => {
    await showBar(page);
    const pageY = await page.evaluate(() => scrollY);
    const { x, y } = await centreOf(pill(page));
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 120);
    await expect.poll(() => scrollLeft(page)).toBeGreaterThan(0);
    expect(await page.evaluate(() => scrollY)).toBe(pageY);
    // And back.
    await page.mouse.wheel(0, -1000);
    await expect.poll(() => scrollLeft(page)).toBe(0);
    expect(await page.evaluate(() => scrollY)).toBe(pageY);
  });

  test("past the end of the bar the wheel scrolls the page again", async ({ page }) => {
    await showBar(page);
    await list(page).evaluate((el) => (el.scrollLeft = el.scrollWidth));
    const pageY = await page.evaluate(() => scrollY);
    const { x, y } = await centreOf(pill(page));
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(pageY);
  });

  test("dragging the bar scrolls it and does not follow the link under the mouse", async ({ page }) => {
    await showBar(page);
    const url = page.url();
    const { x, y } = await centreOf(bar(page).getByRole("link", { name: "Experience" }));
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 60, y, { steps: 6 });
    await page.mouse.move(x - 160, y, { steps: 6 });
    await page.mouse.up();
    expect(await scrollLeft(page)).toBeGreaterThan(100);
    await page.waitForTimeout(300);
    expect(page.url()).toBe(url);
  });

  test("a plain click on a link still goes to its section", async ({ page }) => {
    await showBar(page);
    await bar(page).getByRole("link", { name: "Skills" }).click();
    await expect(page).toHaveURL(/#skills$/);
  });
});

test.describe("desktop width, where every link fits", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the wheel over the bar scrolls the page as usual", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo({ top: innerHeight * 2, behavior: "instant" }));
    await expect(pill(page)).toBeVisible();
    const pageY = await page.evaluate(() => scrollY);
    const box = (await pill(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(pageY);
  });
});

test("at the bottom the bar covers neither the footer nor the contact buttons", async ({ page }) => {
  for (const path of ["/", "/de/"]) {
    await page.goto(path);
    await scrollToBottom(page);
    await expect(pill(page)).toBeVisible();
    await expect(pill(page)).toBeInViewport();
    const footerLine = page.locator(".site-footer .row");
    await expect(footerLine).toBeInViewport();
    expect(await overlaps(pill(page), footerLine)).toBe(false);
    for (const btn of await page.locator("#contact .btn").all()) {
      if (await btn.evaluate((el) => el.getBoundingClientRect().bottom > 0)) expect(await overlaps(pill(page), btn)).toBe(false);
    }
  }
});

test("on the privacy page the bar links back to the home page sections", async ({ page }) => {
  await page.goto("/de/privacy");
  await expect(pill(page)).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Abschnitte" }).getByRole("link", { name: "Erfahrung" })).toHaveAttribute(
    "href",
    "/de/#experience",
  );
});
