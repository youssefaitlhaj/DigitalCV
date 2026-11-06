import { describe, expect, it } from "vitest";
import { sectionSchemas } from "../../../src/content/schemas/registry";
import { printComponents, webComponents } from "../../../src/components/sections";

describe("section component registry", () => {
  it("every section type has a web component", () => {
    expect(Object.keys(webComponents).sort()).toEqual(Object.keys(sectionSchemas).sort());
    for (const component of Object.values(webComponents)) expect(typeof component).toBe("function");
  });

  it("print components only use known section types", () => {
    const known = Object.keys(sectionSchemas);
    for (const key of Object.keys(printComponents)) expect(known).toContain(key);
  });
});
