/**
 * Build-time PDF CV generation (postbuild). Serves `dist` with `astro preview`,
 * prints /cv/print and /de/cv/print with Chromium and writes
 * dist/cv/<fileBaseName>-<locale>.pdf. Playwright stays out of the Astro bundle.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { loadContent } from "../src/content/repository";

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

async function waitFor(url: string, child: ChildProcess, ms = 30_000): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error(`astro preview exited early (code ${child.exitCode})`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`astro preview did not answer at ${url} within ${ms / 1000}s`);
}

export async function generatePdfs(distDir = "dist", locales: string[] = ["en", "de"]): Promise<string[]> {
  const root = process.cwd();
  const outDir = resolve(root, distDir);
  const { site } = loadContent();
  const port = await freePort();
  const bin = join(root, "node_modules", ".bin", "astro");
  const server = spawn(bin, ["preview", "--outDir", outDir, "--host", "127.0.0.1", "--port", String(port)], {
    cwd: root,
    stdio: "ignore",
  });
  const origin = `http://127.0.0.1:${port}`;
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  try {
    await waitFor(`${origin}/cv/print`, server);
    try {
      browser = await chromium.launch();
    } catch (e) {
      if (/Executable doesn't exist|playwright install/i.test((e as Error).message)) {
        throw new Error("Chromium is not installed. Run `npx playwright install chromium` and build again.");
      }
      throw e;
    }
    mkdirSync(join(outDir, "cv"), { recursive: true });
    const written: string[] = [];
    for (const locale of locales) {
      const page = await browser.newPage();
      try {
        await page.goto(`${origin}${locale === "en" ? "" : `/${locale}`}/cv/print`, { waitUntil: "load" });
        await page.waitForSelector("html[data-email-ready]", { state: "attached" });
        await page.evaluate(() => document.fonts.ready);
        const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true });
        const file = join(outDir, "cv", `${site.pdf.fileBaseName}-${locale}.pdf`);
        writeFileSync(file, pdf);
        written.push(file);
      } finally {
        await page.close();
      }
    }
    return written;
  } finally {
    await browser?.close();
    server.kill();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generatePdfs().then(
    (files) => console.log(`[pdf] wrote ${files.length} PDFs:\n${files.map((f) => `  ${f}`).join("\n")}`),
    (e) => {
      console.error(`[pdf] ${(e as Error).message}`);
      process.exit(1);
    },
  );
}
