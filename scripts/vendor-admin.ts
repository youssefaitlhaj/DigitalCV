import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

/** Copies the pinned Sveltia CMS bundle into public/admin/vendor so the admin is served same-origin. */
const root = process.cwd();
const from = path.join(root, "node_modules/@sveltia/cms/dist");
const to = path.join(root, "public/admin/vendor/sveltia");

rmSync(to, { recursive: true, force: true });
mkdirSync(to, { recursive: true });
cpSync(from, to, {
  recursive: true,
  filter: (src) => !src.endsWith(".map") && !src.endsWith(".mjs"),
});
console.log("admin: vendored @sveltia/cms into public/admin/vendor/sveltia");
