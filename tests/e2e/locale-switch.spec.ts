import { test, expect, type Page } from "@playwright/test";

/** Id of the section crossing the line just under the sticky header. */
async function sectionAtHeader(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const line = (document.querySelector("header")?.getBoundingClientRect().height ?? 0) + 2;
    let current: string | null = null;
    for (const s of document.querySelectorAll<HTMLElement>("main section[id]")) {
      if (s.getBoundingClientRect().top <= line) current = s.id;
    }
    return current;
  });
}

async function scrollIntoSection(page: Page, id: string, offset = 150): Promise<void> {
  await page.evaluate(
    ([sectionId, extra]) => {
      const el = document.getElementById(sectionId as string)!;
      const header = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
      const y = window.scrollY + el.getBoundingClientRect().top - header + (extra as number);
      window.scrollTo({ top: y, behavior: "instant" });
    },
    [id, offset],
  );
  await page.waitForTimeout(300);
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("load");
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200)))),
  );
}

test("switching language keeps the section being read", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  await scrollIntoSection(page, "experience");
  expect(await sectionAtHeader(page)).toBe("experience");

  await page.locator('header a[hreflang="de"]').dispatchEvent("click"); // no auto-scroll before the click
  await page.waitForURL(/\/de\/#experience$/);
  await settle(page);
  expect(await sectionAtHeader(page)).toBe("experience");

  // And back again.
  await scrollIntoSection(page, "skills", 40);
  await page.locator('header a[hreflang="en"]').dispatchEvent("click"); // no auto-scroll before the click
  await page.waitForURL(/\/#skills$/);
  await settle(page);
  expect(await sectionAtHeader(page)).toBe("skills");
});

test("switching language at the top of the page stays at the top", async ({ page }) => {
  await page.goto("/");
  await settle(page);
  await page.locator('header a[hreflang="de"]').dispatchEvent("click"); // no auto-scroll before the click
  await page.waitForURL(/\/de\/$/);
  await settle(page);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5);
});
