import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Turns the finished Astro build (dist/) into Vercel's Build Output API v3 layout (.vercel/output/), which
 * `vercel deploy --prebuilt` uploads as is. Vercel never builds this site itself: GitHub Actions does.
 *
 * public/_headers (copied to dist/_headers) stays the single source of truth for response headers. Each of
 * its `/path` blocks becomes a route that adds those headers and continues, ahead of the filesystem phase.
 * Directory pages (dir/index.html) need no route: Vercel serves them for /dir and /dir/ by default.
 *
 * https://vercel.com/docs/build-output-api/configuration
 */

export type HeaderRule = { pattern: string; headers: Record<string, string> };
export type Route =
  | { src: string; headers?: Record<string, string>; continue?: boolean; dest?: string; status?: number }
  | { handle: "filesystem" };
export type VercelConfig = { version: 3; routes: Route[] };

/** Parses a Netlify/Cloudflare-style `_headers` file: an unindented path line, then indented `Name: value` lines. */
export function parseHeaders(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  let current: HeaderRule | undefined;
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim() || line.trim().startsWith("#")) return;
    if (!/^\s/.test(line)) {
      if (!line.startsWith("/")) throw new Error(`_headers line ${i + 1}: expected a path starting with "/", got "${line}"`);
      current = { pattern: line.trim(), headers: {} };
      rules.push(current);
      return;
    }
    const m = /^\s+([A-Za-z0-9-]+):\s*(.*)$/.exec(line);
    if (!current || !m) throw new Error(`_headers line ${i + 1}: expected "Name: value" under a path, got "${line.trim()}"`);
    if (m[2] === "") throw new Error(`_headers line ${i + 1}: header ${m[1]} has no value`);
    current.headers[m[1]] = current.headers[m[1]] ? `${current.headers[m[1]]}, ${m[2]}` : m[2];
  });
  for (const r of rules) if (!Object.keys(r.headers).length) throw new Error(`_headers: ${r.pattern} sets no headers`);
  return rules;
}

/**
 * Turns a `_headers` path pattern into the anchored PCRE regex Vercel matches against the pathname.
 * `*` matches anything (including "/"), `:name` matches one path segment. A trailing `/*` also matches the bare
 * prefix, so `/admin/*` covers `/admin`, `/admin/` and everything below it.
 */
export function patternToRegex(pattern: string): string {
  if (!pattern.startsWith("/")) throw new Error(`_headers: pattern must start with "/": ${pattern}`);
  const convert = (p: string) =>
    p
      .split(/(\*|:[A-Za-z_][A-Za-z0-9_]*)/)
      .map((part) => (part === "*" ? ".*" : part.startsWith(":") ? "[^/]+" : part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")))
      .join("");
  if (pattern.endsWith("/*")) return `^${convert(pattern.slice(0, -2))}(?:/.*)?$`;
  return `^${convert(pattern)}$`;
}

/** Builds config.json: header routes first (they continue), then the filesystem, then the 404 page if there is one. */
export function buildConfig(headersText: string | undefined, options: { has404: boolean }): VercelConfig {
  const rules = headersText === undefined ? [] : parseHeaders(headersText);
  const routes: Route[] = rules.map((r) => ({ src: patternToRegex(r.pattern), headers: r.headers, continue: true }));
  routes.push({ handle: "filesystem" });
  if (options.has404) routes.push({ src: "/.*", dest: "/404.html", status: 404 });
  return { version: 3, routes };
}

/** Files that configure the old host and must not be served as content. */
const HOST_FILES = ["_headers", "_redirects", "_routes.json"];

export function writeVercelOutput(distDir = "dist", outDir = ".vercel/output"): VercelConfig {
  if (!existsSync(path.join(distDir, "index.html"))) throw new Error(`${distDir}/index.html is missing. Run "npm run build" first.`);
  const headersFile = path.join(distDir, "_headers");
  const config = buildConfig(existsSync(headersFile) ? readFileSync(headersFile, "utf8") : undefined, {
    has404: existsSync(path.join(distDir, "404.html")),
  });
  const staticDir = path.join(outDir, "static");
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(staticDir, { recursive: true });
  const top = path.resolve(distDir);
  cpSync(distDir, staticDir, {
    recursive: true,
    filter: (src) => !(path.dirname(path.resolve(src)) === top && HOST_FILES.includes(path.basename(src))),
  });
  writeFileSync(path.join(outDir, "config.json"), `${JSON.stringify(config, null, 2)}\n`);
  return config;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [distDir = "dist", outDir = ".vercel/output"] = process.argv.slice(2);
  try {
    const config = writeVercelOutput(distDir, outDir);
    console.log(`[vercel] wrote ${outDir}/static and ${outDir}/config.json (${config.routes.length} routes)`);
  } catch (e) {
    console.error(`[vercel] ${(e as Error).message}`);
    process.exit(1);
  }
}
