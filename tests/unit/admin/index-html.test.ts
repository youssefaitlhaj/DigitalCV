import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("public/admin/index.html", "utf8");

describe("admin index.html", () => {
  it("loads no script from another origin", () => {
    const srcs = [...html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/gi)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) expect(src, src).toMatch(/^\/(?!\/)/);
    expect(srcs[0]).toBe("/admin/vendor/sveltia/sveltia-cms.js");
  });

  it("is not indexed and links the config", () => {
    expect(html).toContain('<meta name="robots" content="noindex"');
    expect(html).toContain('href="/admin/config.yml"');
  });
});
