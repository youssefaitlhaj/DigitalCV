import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { z } from "zod";
import { legalSchema } from "../../../src/content/schemas/legal";
import { sectionSchemas } from "../../../src/content/schemas/registry";
import { siteSchema } from "../../../src/content/schemas/site";
import { accents, backgrounds } from "../../../src/lib/palettes";

type Cms = {
  name: string;
  widget?: string;
  required?: boolean;
  fields?: Cms[];
  field?: Cms;
  types?: Cms[];
  options?: (string | { value: string })[];
};

const config = parse(readFileSync("public/admin/config.yml", "utf8"));
const files: Cms[] = config.collections.flatMap((c: { files?: Cms[] }) => c.files ?? []);
const file = (name: string) => {
  const f = files.find((x) => x.name === name);
  if (!f) throw new Error(`No CMS file entry "${name}"`);
  return f;
};

/** Looks through optional/default wrappers. Returns the inner schema and whether the field may be omitted. */
function unwrap(schema: z.ZodType): { inner: z.ZodType; optional: boolean } {
  let s = schema as any;
  let optional = false;
  while (["optional", "default", "nullable"].includes(s.def.type)) {
    optional = true;
    s = s.def.innerType;
  }
  return { inner: s, optional };
}

const isBilingual = (inner: any) => inner.def.type === "object" && Object.keys(inner.def.shape).sort().join() === "de,en";
const childrenOf = (c: Cms): Cms[] => c.fields ?? c.field?.fields ?? [];

/** Collects every property shape reachable from a schema node (unions merge their variants). */
function shapes(inner: any): Record<string, z.ZodType>[] {
  if (inner.def.type === "object") return [inner.def.shape];
  if (["union", "discriminatedUnion"].includes(inner.def.type)) return inner.def.options.flatMap(shapes);
  return [];
}

function compare(path: string, schema: z.ZodType, cms: Cms | undefined, problems: string[]) {
  if (!cms) {
    problems.push(`${path}: missing in CMS`);
    return;
  }
  const { inner, optional } = unwrap(schema);
  if (optional !== (cms.required === false)) problems.push(`${path}: required flag mismatch (schema optional=${optional})`);
  const t = (inner as any).def.type;
  if (t === "array") {
    const target = cms.widget === "list" ? cms : undefined;
    if (!target) return problems.push(`${path}: array must be a list widget`);
    const el = unwrap((inner as any).def.element).inner as any;
    if (el.def.type === "object") {
      const kids = childrenOf(cms);
      if (!kids.length) problems.push(`${path}: list has no subfields`);
      compareShapes(path, el, kids, problems);
    }
    return;
  }
  if (isBilingual(inner)) {
    const kids = childrenOf(cms);
    for (const lang of ["en", "de"]) {
      const k = kids.find((x) => x.name === lang);
      if (!k) problems.push(`${path}.${lang}: missing`);
      else if (k.required === false) problems.push(`${path}.${lang}: must be required`);
    }
    if (cms.widget !== "object") problems.push(`${path}: bilingual field must be an object widget`);
    return;
  }
  if (t === "object" || t === "discriminatedUnion") compareShapes(path, inner, cms.fields ?? [], problems);
}

function compareShapes(path: string, inner: any, kids: Cms[], problems: string[]) {
  const merged: Record<string, z.ZodType> = {};
  for (const shape of shapes(inner)) for (const [k, v] of Object.entries(shape)) merged[k] ??= v;
  for (const [key, sub] of Object.entries(merged)) {
    if (key === "type" && path.startsWith("sections.")) continue; // typeKey, supplied by the list
    compare(`${path}.${key}`, sub, kids.find((x) => x.name === key), problems);
  }
}

describe("Sveltia config contract", () => {
  const sections: Cms[] = file("page").fields!.find((f) => f.name === "sections")!.types!;

  it("every section type in registry has a matching CMS type", () => {
    expect(sections.map((t) => t.name).sort()).toEqual(Object.keys(sectionSchemas).sort());
  });

  it("every schema field of each section type exists in its CMS type", () => {
    const problems: string[] = [];
    for (const [name, schema] of Object.entries(sectionSchemas)) {
      const t = sections.find((x) => x.name === name);
      if (!t) continue;
      compareShapes(`sections.${name}`, schema, t.fields ?? [], problems);
    }
    expect(problems).toEqual([]);
  });

  it("site and legal files cover their schemas", () => {
    const problems: string[] = [];
    compareShapes("site", siteSchema, file("site").fields!, problems);
    compareShapes("legal", legalSchema, file("legal").fields!, problems);
    expect(problems).toEqual([]);
  });

  it("bilingual schema fields are CMS objects with required en and de", () => {
    // Spot check beyond the walker: the journey heading is optional but its languages are not.
    const journey = sections.find((t) => t.name === "journey")!;
    const heading = journey.fields!.find((f) => f.name === "heading")!;
    expect(heading.widget).toBe("object");
    expect(heading.required).toBe(false);
    expect(heading.fields!.map((f) => [f.name, f.required])).toEqual([["en", true], ["de", true]]);
  });

  it("palette options equal palettes registry ids", () => {
    const palette = file("site").fields!.find((f) => f.name === "palette")!;
    const ids = (n: string) => palette.fields!.find((f) => f.name === n)!.options!.map((o) => (typeof o === "string" ? o : o.value)).sort();
    expect(ids("accent")).toEqual(Object.keys(accents).sort());
    expect(ids("background")).toEqual(Object.keys(backgrounds).sort());
  });

  it("media_folder is src/assets/uploads", () => {
    expect(config.media_folder).toBe("src/assets/uploads");
    expect(config.public_folder).toBe("/src/assets/uploads");
  });

  it("uses the preview publish mode, GitHub backend and preview context", () => {
    expect(config.publish_mode).toEqual({ type: "preview", allow_incomplete_drafts: false });
    expect(config.backend).toMatchObject({
      name: "github",
      repo: "youssefaitlhaj/DigitalCV",
      branch: "main",
      preview_context: "preview/deploy",
    });
    expect(config.backend.base_url).toMatch(/^https:\/\//);
  });

  it("rich text fields use the markdown widget with a swatch hint", () => {
    const statement = sections.find((t) => t.name === "statement")!;
    const text = statement.fields!.find((f) => f.name === "text")!.fields!.find((f) => f.name === "en") as any;
    expect(text.widget).toBe("markdown");
    expect(text.hint).toContain('<span class="c-accent">');
    expect(text.hint).toContain("<u>");
  });
});
