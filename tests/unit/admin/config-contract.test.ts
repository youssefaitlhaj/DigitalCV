import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { z } from "zod";
import { legalSchema } from "../../../src/content/schemas/legal";
import { pageSchema, sectionSchemas } from "../../../src/content/schemas/registry";
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

type Zod = any;

/** Looks through optional/default/nullable wrappers and preprocess pipes. */
function unwrap(schema: Zod): { inner: Zod; optional: boolean } {
  let s = schema;
  let optional = false;
  for (;;) {
    const t = s.def.type;
    if (["optional", "default", "nullable"].includes(t)) {
      optional = true;
      s = s.def.innerType;
    } else if (t === "pipe") {
      s = s.def.out; // z.preprocess(fn, schema): the real schema is the output side
    } else break;
  }
  return { inner: s, optional };
}

const isBilingual = (inner: Zod) => inner.def.type === "object" && Object.keys(inner.def.shape).sort().join() === "de,en";
const isImageRef = (inner: Zod) => inner.def.type === "object" && Object.keys(inner.def.shape).sort().join() === "alt,crop,src";
const isUnion = (inner: Zod) => inner.def.type === "union";
/** A plain union of strings and string literals (e.g. "YYYY" | "present") is one text input. */
const isStringUnion = (inner: Zod) =>
  isUnion(inner) && !inner.def.discriminator && inner.def.options.every((o: Zod) => ["string", "literal"].includes(unwrap(o).inner.def.type));

/** Zod 4 reports a discriminatedUnion as `union` with a `discriminator`. */
function mergedShape(inner: Zod, problems: string[], path: string): Record<string, Zod> {
  if (inner.def.type === "object") return inner.def.shape;
  if (isUnion(inner)) {
    if (!inner.def.discriminator) {
      problems.push(`${path}: plain unions cannot be expressed by a CMS widget`);
      return {};
    }
    const merged: Record<string, Zod> = {};
    for (const option of inner.def.options) for (const [k, v] of Object.entries(mergedShape(option, problems, path))) merged[k] ??= v;
    // A key that not every variant has can be left empty in the CMS, so it counts as optional.
    for (const k of Object.keys(merged)) {
      if (!inner.def.options.every((o: Zod) => k in o.def.shape)) merged[k] = { def: { type: "optional", innerType: merged[k] } };
    }
    return merged;
  }
  return {};
}

const STRINGY = ["string", "markdown", "text", "select", "image"];

function compareFields(path: string, shape: Record<string, Zod>, kids: Cms[], problems: string[], skip: string[] = []) {
  const keys = Object.keys(shape).filter((k) => !skip.includes(k));
  for (const key of keys) compare(`${path}.${key}`, shape[key], kids.find((x) => x.name === key), problems);
  // reverse direction: nothing in the CMS that the schema does not know
  for (const kid of kids) if (!skip.includes(kid.name) && !keys.includes(kid.name)) problems.push(`${path}.${kid.name}: in CMS but not in schema`);
}

function compare(path: string, schema: Zod, cms: Cms | undefined, problems: string[]) {
  if (!cms) {
    problems.push(`${path}: missing in CMS`);
    return;
  }
  const { inner, optional } = unwrap(schema);
  if (optional !== (cms.required === false)) problems.push(`${path}: required flag mismatch (schema optional=${optional})`);
  const t = inner.def.type;
  if (t === "array") {
    if (cms.widget !== "list") return problems.push(`${path}: array must be a list widget`);
    const el = unwrap(inner.def.element).inner;
    if (cms.types) {
      if (!isUnion(el) || !el.def.discriminator) return problems.push(`${path}: list types need a discriminated union`);
      for (const option of el.def.options) {
        const name = option.def.shape.type.def.values[0];
        const t = cms.types.find((x) => x.name === name);
        if (!t) problems.push(`${path}: no CMS type "${name}"`);
        else compareFields(`${path}<${name}>`, option.def.shape, t.fields ?? [], problems, ["type"]);
      }
      const names = el.def.options.map((o: Zod) => o.def.shape.type.def.values[0]);
      for (const t of cms.types) if (!names.includes(t.name)) problems.push(`${path}: CMS type "${t.name}" not in schema`);
      return;
    }
    const elementCms: Cms = cms.field ?? { name: "item", widget: "object", required: true, fields: cms.fields };
    if (!cms.field && !cms.fields?.length) problems.push(`${path}: list has neither field nor fields`);
    compare(`${path}[]`, el, elementCms, problems);
    return;
  }
  if (isBilingual(inner)) {
    if (cms.widget !== "object") problems.push(`${path}: bilingual field must be an object widget`);
    const kids = cms.fields ?? [];
    if (kids.map((k) => k.name).sort().join() !== "de,en") problems.push(`${path}: must have exactly en and de`);
    for (const k of kids) if (k.required !== true) problems.push(`${path}.${k.name}: must be required`);
    return;
  }
  if (isImageRef(inner)) {
    // The whole image object (src + alt + crop) is edited by the custom imageref widget; see public/admin/crop-widget.js.
    if (cms.widget !== "imageref") problems.push(`${path}: image objects must use the imageref widget, got ${cms.widget}`);
    if (cms.fields) problems.push(`${path}: the imageref widget has no subfields`);
    return;
  }
  if (isStringUnion(inner)) {
    if (!STRINGY.includes(cms.widget ?? "")) problems.push(`${path}: expected a string-like widget, got ${cms.widget}`);
    return;
  }
  if (t === "object" || isUnion(inner)) {
    if (cms.widget !== "object") return problems.push(`${path}: expected object widget, got ${cms.widget}`);
    compareFields(path, mergedShape(inner, problems, path), cms.fields ?? [], problems);
    return;
  }
  if (t === "boolean") {
    if (cms.widget !== "boolean") problems.push(`${path}: expected boolean widget`);
  } else if (t === "number") {
    if (cms.widget !== "number") problems.push(`${path}: expected number widget`);
  } else if (t === "enum") {
    const values = Object.values(inner.def.entries).sort();
    const opts = (cms.options ?? []).map((o) => (typeof o === "string" ? o : o.value)).sort();
    if (cms.widget !== "select" || opts.join() !== values.join()) problems.push(`${path}: select options must equal ${values.join("|")}`);
  } else if (t === "string") {
    if (!STRINGY.includes(cms.widget ?? "")) problems.push(`${path}: expected a string-like widget, got ${cms.widget}`);
  } else if (t !== "literal") {
    problems.push(`${path}: unsupported schema type ${t}`);
  }
}

/** Walks real content values and checks each against the CMS widget that will load it. */
function checkValue(path: string, value: unknown, cms: Cms, problems: string[], extraKeys: string[] = []) {
  const plain = (v: unknown) => typeof v === "object" && v !== null && !Array.isArray(v);
  switch (cms.widget) {
    case "object": {
      if (!plain(value)) return problems.push(`${path}: expected an object, got ${JSON.stringify(value)}`);
      for (const [k, v] of Object.entries(value as object)) {
        const kid = cms.fields?.find((f) => f.name === k);
        if (kid) checkValue(`${path}.${k}`, v, kid, problems);
        else if (!extraKeys.includes(k)) problems.push(`${path}.${k}: no CMS field`);
      }
      return;
    }
    case "list": {
      if (!Array.isArray(value)) return problems.push(`${path}: expected a list`);
      value.forEach((item, i) => {
        if (cms.types) {
          const t = cms.types.find((x) => x.name === (item as { type?: string })?.type);
          if (!t) problems.push(`${path}[${i}]: unknown type`);
          else checkValue(`${path}[${i}]`, item, t, problems, ["type"]);
        } else if (cms.field) checkValue(`${path}[${i}]`, item, cms.field, problems);
        else checkValue(`${path}[${i}]`, item, { name: "item", widget: "object", fields: cms.fields }, problems);
      });
      return;
    }
    case "imageref": {
      const ok = (v: unknown) => typeof v === "string" && v !== "";
      const o = value as { src?: unknown; alt?: { en?: unknown; de?: unknown }; crop?: Record<string, unknown> };
      if (!plain(value) || !ok(o.src) || !ok(o.alt?.en) || !ok(o.alt?.de)) return problems.push(`${path}: expected { src, alt: { en, de } }`);
      for (const k of Object.keys(value as object)) if (!["src", "alt", "crop"].includes(k)) problems.push(`${path}.${k}: not part of an image`);
      if (o.crop !== undefined && !["x", "y", "width", "height"].every((k) => typeof o.crop![k] === "number")) problems.push(`${path}.crop: expected numbers`);
      return;
    }
    case "boolean":
      if (typeof value !== "boolean") problems.push(`${path}: expected boolean`);
      return;
    case "number":
      if (typeof value !== "number") problems.push(`${path}: expected number`);
      return;
    case "select": {
      const opts = (cms.options ?? []).map((o) => (typeof o === "string" ? o : o.value));
      if (!opts.includes(value as string)) problems.push(`${path}: ${JSON.stringify(value)} is not an option`);
      return;
    }
    default:
      if (typeof value !== "string") problems.push(`${path}: expected a string, got ${JSON.stringify(value)}`);
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
      compareFields(`sections.${name}`, (schema as Zod).def.shape, t.fields ?? [], problems, ["type"]);
    }
    expect(problems).toEqual([]);
  });

  it("site and legal files cover their schemas", () => {
    const problems: string[] = [];
    compareFields("site", siteSchema.def.shape, file("site").fields!, problems);
    compareFields("legal", legalSchema.def.shape, file("legal").fields!, problems);
    compareFields("page", { sections: pageSchema.def.shape.sections }, file("page").fields!, problems);
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

  it("every rich text (markdown) field documents underline and the four colour spans in its hint", () => {
    const markdown: { path: string; hint?: string }[] = [];
    const walk = (f: Cms, path: string) => {
      if (f.widget === "markdown") markdown.push({ path, hint: (f as Cms & { hint?: string }).hint });
      for (const k of [...(f.fields ?? []), ...(f.types ?? []), ...(f.field ? [f.field] : [])]) walk(k, `${path}.${k.name}`);
    };
    for (const f of files) walk(f, f.name);
    expect(markdown.length).toBeGreaterThan(0);
    const labels = { "c-accent": "Accent", "c-muted": "Muted", "c-highlight": "Highlight", "c-positive": "Green" };
    for (const { path, hint } of markdown) {
      expect(hint, path).toContain("<u>");
      for (const [cls, label] of Object.entries(labels)) {
        expect(hint, `${path} ${cls}`).toContain(`<span class="${cls}">`);
        expect(hint, `${path} ${label}`).toContain(label);
      }
    }
  });

  it("every image object uses the imageref widget", () => {
    const found: Cms[] = [];
    const walk = (f: Cms) => {
      if (f.widget === "imageref") found.push(f);
      for (const k of [...(f.fields ?? []), ...(f.types ?? []), ...(f.field ? [f.field] : [])]) walk(k);
    };
    for (const f of files) walk(f);
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((f) => !f.fields)).toBe(true);
  });

  it("real content values fit the CMS widget types", () => {
    const problems: string[] = [];
    for (const name of ["site", "page", "legal"]) {
      const value = parse(readFileSync(`src/content/data/${name}.yml`, "utf8"));
      checkValue(name, value, { name, widget: "object", fields: file(name).fields }, problems);
    }
    expect(problems).toEqual([]);
  });

  it("the value walker rejects the old plain-string tag modelling", () => {
    const tags = sections.find((t) => t.name === "tags")!;
    const problems: string[] = [];
    checkValue("tags", { type: "tags", groups: [{ title: { en: "a", de: "b" }, items: [{ label: "Java" }] }] }, tags, problems, ["type"]);
    expect(problems.join()).toContain("expected an object");
  });

  it("base_url is a safe placeholder or a concrete workers.dev host", () => {
    const url: string = config.backend.base_url;
    const concrete = /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.workers\.dev$/;
    const ok = url === "https://sveltia-auth.invalid" || (concrete.test(url) && !/replace|example|placeholder/i.test(url));
    expect(ok, url).toBe(true);
  });

  it("omits empty optional fields", () => {
    expect(config.output?.omit_empty_optional_fields).toBe(true);
  });

  it("tags label and level are bilingual objects, level optional", () => {
    const items = sections.find((t) => t.name === "tags")!.fields!.find((f) => f.name === "groups")!.fields!.find((f) => f.name === "items")!;
    const [label, level] = ["label", "level"].map((n) => items.fields!.find((f) => f.name === n)!);
    expect([label.widget, label.required]).toEqual(["object", true]);
    expect([level.widget, level.required]).toEqual(["object", false]);
  });
});
