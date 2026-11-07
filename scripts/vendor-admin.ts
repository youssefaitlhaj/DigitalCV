import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

/** Copies the pinned Sveltia CMS bundle into public/admin/vendor so the admin is served same-origin. */
const root = process.cwd();
const from = path.join(root, "node_modules/@sveltia/cms/dist");
const to = path.join(root, "public/admin/vendor/sveltia");

for (const required of ["sveltia-cms.js", "chunks"]) {
  if (!existsSync(path.join(from, required))) {
    console.error(`admin: ${path.join(from, required)} is missing. Run "npm install" to fetch @sveltia/cms.`);
    process.exit(1);
  }
}

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, {
  recursive: true,
  filter: (src) => !src.endsWith(".map") && !src.endsWith(".mjs"),
});
console.log("admin: vendored @sveltia/cms into public/admin/vendor/sveltia");

if (!existsSync(path.join(to, "sveltia-cms.js"))) {
  console.error("admin: vendoring did not produce sveltia-cms.js");
  process.exit(1);
}
