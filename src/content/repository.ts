import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { z } from "zod";
import { legalSchema, type Legal } from "./schemas/legal";
import { pageSchema } from "./schemas/registry";
import { siteSchema, type Site } from "./schemas/site";

export type Page = z.infer<typeof pageSchema>;
export type { Site, Legal };

export interface Content {
  site: Site;
  page: Page;
  legal: Legal;
}

export class ContentError extends Error {
  constructor(lines: string[]) {
    super(lines.join("\n"));
    this.name = "ContentError";
  }
}

function read<T extends z.ZodType>(dir: string, file: string, schema: T): z.infer<T> {
  const path = join(dir, file);
  if (!existsSync(path)) throw new ContentError([`${file}: file not found at ${path}`]);
  let raw: unknown;
  try {
    raw = parse(readFileSync(path, "utf8"));
  } catch (e) {
    throw new ContentError([`${file}: invalid YAML — ${(e as Error).message}`]);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ContentError(result.error.issues.map((i) => `${file}: ${i.path.join(".")} — ${i.message}`));
  }
  return result.data;
}

export function loadContent(dir: string = process.env.CONTENT_DIR ?? "src/content/data"): Content {
  return {
    site: read(dir, "site.yml", siteSchema),
    page: read(dir, "page.yml", pageSchema),
    legal: read(dir, "legal.yml", legalSchema),
  };
}

let cached: Content | undefined;

/** The only accessor components use. Cached for the length of the build. */
export function getContent(): Content {
  return (cached ??= loadContent());
}
