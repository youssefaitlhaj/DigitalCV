import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

const cropperFrom = path.join(root, "node_modules/cropperjs/dist");
const cropperTo = path.join(root, "public/admin/vendor/cropperjs");
rmSync(cropperTo, { recursive: true, force: true });
mkdirSync(cropperTo, { recursive: true });
for (const file of ["cropper.min.js", "cropper.min.css"]) {
  if (!existsSync(path.join(cropperFrom, file))) {
    console.error(`admin: ${path.join(cropperFrom, file)} is missing. Run "npm install" to fetch cropperjs.`);
    process.exit(1);
  }
  cpSync(path.join(cropperFrom, file), path.join(cropperTo, file));
}
console.log("admin: vendored cropperjs into public/admin/vendor/cropperjs");

// Sveltia lazy-imports immutable.js from unpkg as soon as a custom field type exists. The CSP forbids foreign
// scripts, so serve the pinned package same-origin and repoint that one import in the COPY of the bundle.
const immutableFrom = path.join(root, "node_modules/immutable/dist/immutable.es.js");
const immutableTo = path.join(root, "public/admin/vendor/immutable");
if (!existsSync(immutableFrom)) {
  console.error(`admin: ${immutableFrom} is missing. Run "npm install" to fetch immutable.`);
  process.exit(1);
}
rmSync(immutableTo, { recursive: true, force: true });
mkdirSync(immutableTo, { recursive: true });
cpSync(immutableFrom, path.join(immutableTo, "immutable.es.js"));

// The loader call is `<minified helper>(`immutable`,`dist/immutable.es.js`)`; only the helper name varies between builds.
const loader = /\b[\w$]+\(`immutable`,`dist\/immutable\.es\.js`\)/g;
const entry = path.join(to, "sveltia-cms.js");
const source = readFileSync(entry, "utf8");
const hits = source.match(loader) ?? [];
if (hits.length !== 1) {
  console.error(
    `admin: expected exactly one immutable.js loader call in the Sveltia bundle, found ${hits.length}. ` +
      "Sveltia changed; update scripts/vendor-admin.ts (otherwise the admin would fall back to unpkg, which the CSP blocks).",
  );
  process.exit(1);
}
writeFileSync(entry, source.replace(loader, "import(`/admin/vendor/immutable/immutable.es.js`)"));
console.log("admin: repointed Sveltia's immutable.js import to /admin/vendor/immutable/");
