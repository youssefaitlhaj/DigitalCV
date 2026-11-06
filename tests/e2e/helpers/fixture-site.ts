/**
 * Fixture sites: build the real site from modified content and serve it.
 *
 *   const site = useFixtureSite("hidden-skills", ({ page }) => {
 *     page.sections.find((s) => s.id === "skills")!.visible = false;
 *   });
 *   test("…", async ({ page }) => { await page.goto(site.url("/de/")); });
 *
 * `useFixtureSite(name, mutate?)` registers `beforeAll`/`afterAll` hooks in the
 * current file or `describe` block and returns `{ url(path = "/") }`.
 *
 * - The content is a copy of `src/content/data`; `mutate` edits the parsed
 *   YAML (`site`, `page`, `legal`) in place before it is written back.
 * - The site is built once per fixture name per test run with
 *   `CONTENT_DIR=<copy>` into its own `--outDir`, under the OS temp directory
 *   (`<tmp>/cv-fixtures/<run id>/<name>/`), never inside the repository.
 *   Builds are serialised across workers with a lock directory, and a marker
 *   file lets later workers reuse the finished build. The run id comes from
 *   `FIXTURE_RUN_ID`, which `playwright.config.ts` sets once per run, so a new
 *   run always rebuilds against the current source.
 * - Each worker serves the build with `astro preview --outDir … --port …` on a
 *   free port and stops it in `afterAll`.
 * - The same `name` must always mean the same `mutate`.
 */
import { spawn, execFileSync, type ChildProcess } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "@playwright/test";
import { parse, stringify } from "yaml";

export interface FixtureFiles {
  site: Record<string, any>;
  page: { sections: Record<string, any>[] };
  legal: Record<string, any>;
}

export interface FixtureSite {
  /** Absolute URL of `path` on this worker's preview server. */
  url(path?: string): string;
}

const ROOT = process.cwd();
const BIN = join(ROOT, "node_modules", ".bin");
const RUN_ID = process.env.FIXTURE_RUN_ID ?? "local";
const BASE = join(tmpdir(), "cv-fixtures");
const RUN_DIR = join(BASE, RUN_ID);
const LOCK = join(RUN_DIR, ".build-lock");
const STALE_LOCK_MS = 5 * 60_000;
const OLD_RUN_MS = 60 * 60_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withBuildLock<T>(fn: () => T): Promise<T> {
  mkdirSync(RUN_DIR, { recursive: true });
  for (;;) {
    try {
      mkdirSync(LOCK);
      break;
    } catch {
      try {
        if (Date.now() - statSync(LOCK).mtimeMs > STALE_LOCK_MS) rmSync(LOCK, { recursive: true, force: true });
      } catch {
        // The holder released it between the two calls.
      }
      await sleep(200);
    }
  }
  try {
    return fn();
  } finally {
    rmSync(LOCK, { recursive: true, force: true });
  }
}

/** Removes fixture builds left behind by earlier runs. */
function pruneOldRuns(): void {
  if (!existsSync(BASE)) return;
  for (const entry of readdirSync(BASE)) {
    const dir = join(BASE, entry);
    if (dir !== RUN_DIR && Date.now() - statSync(dir).mtimeMs > OLD_RUN_MS) rmSync(dir, { recursive: true, force: true });
  }
}

function build(name: string, mutate?: (files: FixtureFiles) => void): string {
  const dir = join(RUN_DIR, name);
  const outDir = join(dir, "dist");
  const marker = join(dir, ".built");
  if (existsSync(marker)) return outDir;

  pruneOldRuns();
  const contentDir = join(dir, "content");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(resolve(ROOT, "src/content/data"), contentDir, { recursive: true });

  const files = Object.fromEntries(
    (["site", "page", "legal"] as const).map((f) => [f, parse(readFileSync(join(contentDir, `${f}.yml`), "utf8"))]),
  ) as unknown as FixtureFiles;
  mutate?.(files);
  for (const [f, data] of Object.entries(files)) writeFileSync(join(contentDir, `${f}.yml`), stringify(data));

  const env = { ...process.env, CONTENT_DIR: contentDir };
  try {
    execFileSync(join(BIN, "tsx"), ["scripts/crop-images.ts"], { cwd: ROOT, env, stdio: "pipe" });
    execFileSync(join(BIN, "astro"), ["build", "--outDir", outDir], { cwd: ROOT, env, stdio: "pipe" });
  } catch (e) {
    const err = e as { stdout?: Buffer; stderr?: Buffer };
    throw new Error(`fixture "${name}" failed to build:\n${err.stdout ?? ""}\n${err.stderr ?? ""}`);
  }
  writeFileSync(marker, new Date().toISOString());
  return outDir;
}

function freePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.once("error", rej);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address() as { port: number };
      srv.close(() => res(port));
    });
  });
}

async function waitForServer(url: string, child: ChildProcess, timeoutMs = 30_000): Promise<void> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    if (child.exitCode !== null) throw new Error(`preview for ${url} exited with ${child.exitCode}`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Not listening yet.
    }
    await sleep(100);
  }
  throw new Error(`preview for ${url} did not start`);
}

export function useFixtureSite(name: string, mutate?: (files: FixtureFiles) => void): FixtureSite {
  let origin = "";
  let server: ChildProcess | undefined;

  test.beforeAll(async () => {
    test.setTimeout(240_000);
    const outDir = await withBuildLock(() => build(name, mutate));
    const port = await freePort();
    origin = `http://localhost:${port}`;
    server = spawn(join(BIN, "astro"), ["preview", "--outDir", outDir, "--port", String(port)], {
      cwd: ROOT,
      stdio: "ignore",
    });
    await waitForServer(origin, server);
  });

  test.afterAll(() => {
    server?.kill();
    server = undefined;
  });

  return {
    url(path = "/") {
      if (!origin) throw new Error(`fixture "${name}" is not running; call url() inside a test`);
      return new URL(path, origin).href;
    },
  };
}
