import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/** A stand-in for Sveltia that only records what the extensions register. */
const FAKE_CMS = `
window.__reg = { fieldTypes: [], pages: [], other: [] };
window.CMS = {
  React: { useState: (v) => [v, () => {}], useEffect() {}, useRef: () => ({ current: null }) },
  registerFieldType(...a) { window.__reg.fieldTypes.push(a); },
  registerWidget(...a) { window.__reg.fieldTypes.push(a); },
  registerCustomPage(def) { window.__reg.pages.push(def); },
  registerEditorComponent(d) { window.__reg.other.push(['editor', d]); },
  init() {},
};
window.html = () => null;
`;

async function load(page: Page, links: unknown) {
  await page.route("**/admin/vendor/sveltia/sveltia-cms.js", (r) => r.fulfill({ contentType: "text/javascript", body: FAKE_CMS }));
  if (links !== undefined) await page.route("**/admin/links.json", (r) => r.fulfill({ contentType: "application/json", body: JSON.stringify(links) }));
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/admin/");
  await page.waitForFunction(() => (window as any).__reg.pages.length > 0);
  return { errors, reg: () => page.evaluate(() => (window as any).__reg) };
}

test("registers the imageref crop widget", async ({ page }) => {
  const { reg, errors } = await load(page, { dashboardUrl: null, pullsUrl: "https://github.com/youssefaitlhaj/DigitalCV/pulls" });
  const r = await reg();
  const def = r.fieldTypes.map((a: unknown[]) => a[0]);
  expect(def.some((d: unknown) => d === "imageref" || (d as { name?: string })?.name === "imageref")).toBe(true);
  expect(errors).toEqual([]);
});

test("statistics link present when dashboardUrl set", async ({ page }) => {
  const { reg } = await load(page, { dashboardUrl: "https://cloud.umami.is/share/abc/site", pullsUrl: "https://github.com/youssefaitlhaj/DigitalCV/pulls" });
  const pages = (await reg()).pages;
  expect(pages.find((p: any) => p.id === "statistics")).toMatchObject({ label: "Statistics", url: "https://cloud.umami.is/share/abc/site", newTab: true });
  expect(pages.find((p: any) => p.id === "preview-publish")).toMatchObject({ label: "Preview & Publish", url: "https://github.com/youssefaitlhaj/DigitalCV/pulls", newTab: true });
});

test("statistics link absent when dashboardUrl not set", async ({ page }) => {
  const { reg } = await load(page, { dashboardUrl: null, pullsUrl: "https://github.com/youssefaitlhaj/DigitalCV/pulls" });
  const ids = (await reg()).pages.map((p: any) => p.id);
  expect(ids).toEqual(["preview-publish"]);
});

test("still offers Preview & Publish if links.json cannot be read", async ({ page }) => {
  await page.route("**/admin/links.json", (r) => r.fulfill({ status: 500, body: "no" }));
  const { reg } = await load(page, undefined);
  expect((await reg()).pages.map((p: any) => p.id)).toEqual(["preview-publish"]);
});

test("serves the real links.json", async ({ request }) => {
  const body = await (await request.get("/admin/links.json")).json();
  expect(body.pullsUrl).toBe("https://github.com/youssefaitlhaj/DigitalCV/pulls");
});

test("cropperjs is served same-origin", async ({ request }) => {
  for (const f of ["cropper.min.js", "cropper.min.css"]) expect((await request.get(`/admin/vendor/cropperjs/${f}`)).status()).toBe(200);
});

test("real Sveltia imports immutable.js same-origin under the admin CSP", async ({ page }) => {
  const block = readFileSync("public/_headers", "utf8").split(/\n(?=\S)/).find((b) => b.startsWith("/admin/*"))!;
  const csp = block.split("\n").find((l) => l.trim().startsWith("Content-Security-Policy:"))!.trim().slice("Content-Security-Policy:".length).trim();
  await page.route("**/admin/**", async (route) => {
    if (route.request().resourceType() !== "document") return route.continue();
    const res = await route.fetch();
    await route.fulfill({ response: res, headers: { ...res.headers(), "content-security-policy": csp } });
  });
  const violations: string[] = [];
  const unpkg: string[] = [];
  page.on("console", (m) => /content security policy/i.test(m.text()) && violations.push(m.text()));
  page.on("request", (r) => /unpkg\.com\/immutable/.test(r.url()) && unpkg.push(r.url()));
  const loaded = page.waitForResponse((r) => r.url().endsWith("/admin/vendor/immutable/immutable.es.js"), { timeout: 15_000 });
  await page.goto("/admin/");
  expect((await loaded).status()).toBe(200);
  // The module itself must also import cleanly under the CSP.
  expect(await page.evaluate(async () => typeof (await import("/admin/vendor/immutable/immutable.es.js")).Map)).toBe("function");
  expect(unpkg).toEqual([]);
  expect(violations).toEqual([]);
});
