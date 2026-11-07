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

describe("admin headers", () => {
  const headers = readFileSync("public/_headers", "utf8");
  const csp = headers.split("\n").find((l) => l.includes("Content-Security-Policy"))!;
  it("blocks foreign scripts and framing for /admin/*", () => {
    expect(headers).toMatch(/^\/admin\/\*/m);
    expect(csp).toMatch(/script-src 'self';/);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/script-src[^;]*(unsafe|https:)/);
  });
  it("lets the admin reach GitHub's API and no OAuth helper", () => {
    const connect = /connect-src ([^;]*)/.exec(csp)![1].split(/\s+/);
    expect(connect).toContain("https://api.github.com");
    expect(csp).not.toMatch(/sveltia-auth|workers\.dev|\.invalid/);
    expect(readFileSync("public/admin/config.yml", "utf8")).not.toMatch(/base_url/);
  });
});
