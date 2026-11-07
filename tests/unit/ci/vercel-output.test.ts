import { mkdirSync, mkdtempSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildConfig, parseHeaders, patternToRegex, writeVercelOutput, type Route } from "../../../scripts/vercel-output";

const headersText = readFileSync("public/_headers", "utf8");

/** Mimics Vercel's routing for headers: every matching `continue` route before the filesystem adds its headers. */
function headersFor(routes: Route[], pathname: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of routes) {
    if ("handle" in r) break;
    if (r.headers && new RegExp(r.src).test(pathname)) Object.assign(out, r.headers);
  }
  return out;
}

describe("vercel build output", () => {
  const config = buildConfig(headersText, { has404: false });
  const csp = parseHeaders(headersText).find((r) => r.pattern === "/admin/*")!.headers["Content-Security-Policy"];

  it("is version 3 with the filesystem handle after the header routes", () => {
    expect(config.version).toBe(3);
    const fs = config.routes.findIndex((r) => "handle" in r && r.handle === "filesystem");
    expect(fs).toBeGreaterThan(0);
    for (const r of config.routes.slice(0, fs)) expect(r).toMatchObject({ continue: true });
  });

  it("sends the admin headers from public/_headers on /admin, /admin/ and below", () => {
    expect(csp).toContain("script-src 'self'");
    for (const p of ["/admin", "/admin/", "/admin/index.html", "/admin/config.yml", "/admin/vendor/sveltia/sveltia-cms.js"]) {
      const h = headersFor(config.routes, p);
      expect(h["Content-Security-Policy"], p).toBe(csp);
      expect(h["X-Content-Type-Options"], p).toBe("nosniff");
      expect(h["Referrer-Policy"], p).toBe("same-origin");
    }
  });

  it("does not send them on the public site", () => {
    for (const p of ["/", "/de/", "/privacy/", "/cv/youssef-ait-lhaj-cv-en.pdf", "/administrator", "/x/admin/"]) {
      expect(headersFor(config.routes, p), p).toEqual({});
    }
  });

  it("serves 404.html for missing pages only when the build has one", () => {
    expect(config.routes.at(-1)).toEqual({ handle: "filesystem" });
    const with404 = buildConfig(headersText, { has404: true });
    expect(with404.routes.at(-1)).toEqual({ src: "/.*", dest: "/404.html", status: 404 });
    expect(with404.routes.at(-2)).toEqual({ handle: "filesystem" });
  });

  it("derives regexes from the glob generically", () => {
    expect(patternToRegex("/admin/*")).toBe("^/admin(?:/.*)?$");
    expect(patternToRegex("/*")).toBe("^(?:/.*)?$");
    expect(patternToRegex("/cv/*.pdf")).toBe("^/cv/.*\\.pdf$");
    expect(patternToRegex("/blog/:slug")).toBe("^/blog/[^/]+$");
    expect(patternToRegex("/robots.txt")).toBe("^/robots\\.txt$");
    expect(new RegExp(patternToRegex("/cv/*.pdf")).test("/cv/a-en.pdf")).toBe(true);
    expect(new RegExp(patternToRegex("/cv/*.pdf")).test("/cv/axpdf")).toBe(false);
  });

  it("rejects a malformed _headers file instead of dropping headers silently", () => {
    expect(() => parseHeaders("  X-Orphan: 1\n")).toThrow();
    expect(() => parseHeaders("admin/*\n  X-A: 1\n")).toThrow();
    expect(() => parseHeaders("/admin/*\n")).toThrow();
    expect(parseHeaders("# c\n/a\n  X-A: 1\n  X-A: 2\n")).toEqual([{ pattern: "/a", headers: { "X-A": "1, 2" } }]);
  });

  it("writes static/ (without _headers) and config.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "vercel-output-"));
    const dist = join(dir, "dist");
    mkdirSync(join(dist, "admin"), { recursive: true });
    writeFileSync(join(dist, "index.html"), "<h1>home</h1>");
    writeFileSync(join(dist, "admin", "index.html"), "<h1>admin</h1>");
    writeFileSync(join(dist, "_headers"), headersText);
    const out = join(dir, ".vercel", "output");
    writeVercelOutput(dist, out);
    expect(readFileSync(join(out, "static", "index.html"), "utf8")).toBe("<h1>home</h1>");
    expect(existsSync(join(out, "static", "admin", "index.html"))).toBe(true);
    expect(existsSync(join(out, "static", "_headers"))).toBe(false);
    expect(JSON.parse(readFileSync(join(out, "config.json"), "utf8"))).toEqual(buildConfig(headersText, { has404: false }));
  });
});
