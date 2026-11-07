import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

describe("vendored admin bundle", () => {
  beforeAll(() => {
    execFileSync("npx", ["tsx", "scripts/vendor-admin.ts"], { stdio: "pipe" });
  });

  it("imports immutable.js from the same origin, not unpkg", () => {
    const src = readFileSync("public/admin/vendor/sveltia/sveltia-cms.js", "utf8");
    expect(src).not.toMatch(/`immutable`,`dist\/immutable\.es\.js`/);
    expect(src).toContain("import(`/admin/vendor/immutable/immutable.es.js`)");
    expect(existsSync("public/admin/vendor/immutable/immutable.es.js")).toBe(true);
  });

  it("serves cropperjs locally", () => {
    for (const f of ["cropper.min.js", "cropper.min.css"]) expect(existsSync(`public/admin/vendor/cropperjs/${f}`)).toBe(true);
  });
});
