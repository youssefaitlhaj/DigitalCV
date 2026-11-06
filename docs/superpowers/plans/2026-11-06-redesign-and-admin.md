# Site Redesign, Admin, PDF and Hosting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Youssef's Astro CV site with the approved Whisky-on-Oat design and scroll-linked motion. All content becomes data that he edits in Sveltia CMS, with preview-then-publish, a build-time PDF CV, Umami statistics, and Cloudflare Pages hosting.

**Architecture:**
- **Content:** all content lives in YAML files under `src/content/data/`. Zod schemas validate it, and a repository module turns it into typed domain objects.
- **Pages and sections:** pages render an ordered list of sections. A registry maps each section type to its schema, its web component, and its print component, so new layouts are added without editing shared code (open/closed principle).
- **Build and deploy:** GitHub Actions builds the site, runs Playwright to print the PDFs, and deploys to Cloudflare Pages. Pull-request branches from Sveltia's editorial workflow get protected preview deployments, and merging to `main` is "Publish".

**Tech Stack:**
- Site: Astro 7, TypeScript, Tailwind 4 (Vite plugin), Zod
- Content: `yaml`
- Animation: GSAP + ScrollTrigger
- Fonts: Fontsource (IBM Plex Sans, JetBrains Mono)
- Rich text: `marked` + `sanitize-html`
- Images: `sharp` (crop)
- Tests: Vitest; Playwright (end-to-end and PDF); `unpdf` (PDF text checks)
- Admin and hosting: Sveltia CMS, GitHub Actions, Cloudflare Pages, Wrangler, Cloudflare Access, Umami Cloud

**Spec:** `docs/superpowers/specs/2026-11-06-redesign-and-admin-design.md`. Prototypes: `docs/superpowers/specs/2026-11-06-redesign-assets/motion-prototype.html` (look and motion — the visual reference for every UI task) and `palette-explorer.html` (palette values).

## Global Constraints

- Node ≥ 22.12 (`package.json` engines; CI uses Node 22).
- Every user-visible string is bilingual and stored as `{ en, de }`. Both languages are required, and an empty string in either fails validation. The only exceptions are proper nouns, which are stored as plain strings: company, technology, and institution names, URLs, and the person's name.
- English is served at `/` and German at `/de/` (`prefixDefaultLocale: false`).
- Colours come only from palette tokens (`--bg --soft --panel --line --muted --ink --accent --accent-ink`). No hex values in components. Default palette: accent `whisky`, background `oat`.
- Text contrast must be at least 4.5:1, and large text at least 3:1, for every offered palette and every text swatch, in both light and dark mode. The old gold `#C9A227` is never a light-mode text colour.
- Fonts are self-hosted through Fontsource: IBM Plex Sans (body), JetBrains Mono (code details). Never load anything from `fonts.googleapis.com`. Remove Fraunces, Inter, and Lenis.
- Motion:
  - Scroll-linked (scrubbed) wherever possible; time-based effects take ≤ 1 s.
  - Content is never hidden while waiting for an animation.
  - With `prefers-reduced-motion: reduce`, nothing animates and everything appears in its final state.
  - With JavaScript off, all content is visible.
- No cookies, and no cookie banner.
- No phone number or postal address anywhere on the site or in the PDF. The Impressum page exists but is hidden by default.
- The email address appears in built HTML only as two halves that are joined at runtime.
- Analytics (Umami) load only in production deploys, never in previews or dev.
- Apply SOLID as described in spec §10.3, with YAGNI. Components render; they do not load, parse, or compute.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Push to `origin` (`https://github.com/youssefaitlhaj/DigitalCV.git`) at the end of each task.

## Review Focus

1. **Long text at phone width (320 px):** long German compounds, long project names and long URLs must wrap without horizontal page scroll. → Task 9 e2e test `no horizontal overflow at 320px`.
2. **Phone photo uploads:** HEIC, 12 MP JPEG, and a PNG with transparency. Each must either be processed or fail the build with a message naming the file, never crash silently or ship a 6 MB image. → Task 6 tests `rejects unsupported format with file name` and `downscales oversized image`.
3. **Pasted formatting from Word or a website** in rich-text fields (inline styles, `<script>`, `<iframe>`, `onclick`, `javascript:` links) must be stripped to the allowlist. → Task 5 test `strips pasted html to allowlist`.
4. **Hidden or empty sections:**
   - A hidden section must not appear in the page, the menu, or the PDF.
   - A visible section with zero items must not render an empty heading.
   - Hiding every optional section must still give a valid page.
   → Task 2 test `visibleSections excludes hidden and empty`, Task 9 e2e test `hidden section absent from menu`, Task 12 test `print omits hidden and pdf-excluded sections`.
5. **Section ids typed by a human:** duplicate ids, spaces, or umlauts must not create colliding or broken menu anchors. → Task 2 tests `rejects duplicate section ids` and `slugifies ids for anchors`.

---

## File Structure

```
src/
  domain/types.ts                 # Localized<T>, RichText, ImageRef, Locale-agnostic domain types (inferred from schemas)
  content/
    data/site.yml                 # site settings, labels, palette, pdf, analytics
    data/page.yml                 # ordered sections (fixed + layout)
    data/legal.yml                # privacy + impressum (hidden)
    schemas/primitives.ts         # localized(), richText, month, imageRef, slugId
    schemas/sections/*.ts         # one file per section type (hero, statement, stats, journey, contact, timeline, cards, tags, text, quotes)
    schemas/registry.ts           # sectionSchemas registry → pageSchema (discriminated union)
    schemas/site.ts, legal.ts
    repository.ts                 # loadContent(): Content  (only module that knows files + YAML)
  lib/
    dates.ts                      # month math + formatting (refactored, label-driven)
    stats.ts                      # resolveStat()
    rich-text.ts                  # renderRichText(), toPlainText()
    palettes.ts                   # palettes, swatches, contrastRatio(), paletteCss()
    images.ts                     # resolveImage(), crop pipeline
    sections.ts                   # visibleSections(), menuEntries(), anchorFor()
    localize.ts                   # pick(localized, locale)
  components/
    layout/Base.astro, Header.astro, Footer.astro, LocaleSwitcher.astro, ThemeToggle.astro, RichText.astro, Img.astro
    sections/Hero.astro, Statement.astro, Stats.astro, Journey.astro, Contact.astro,
             Timeline.astro, Cards.astro, Tags.astro, Text.astro, Quotes.astro
    sections/index.ts             # webComponents + printComponents maps keyed by section type
    sections/SectionRenderer.astro
    print/*.astro                 # print variants
  pages/index.astro, de/index.astro, privacy.astro, de/privacy.astro, impressum.astro, de/impressum.astro,
        cv/print.astro, de/cv/print.astro
  scripts/
    theme.ts, email.ts            # kept (email.ts minus magnetic)
    motion/index.ts               # bootstraps effects by data attribute
    motion/effects/*.ts           # one file per effect
  styles/global.css, print.css
scripts/
  crop-images.ts                  # prebuild: applies crop rects → src/assets/.generated/
  generate-pdf.ts                 # postbuild: Playwright prints /cv/print → dist/cv/*.pdf
public/admin/index.html, config.yml, extensions.js
.github/workflows/ci.yml, deploy.yml, scheduled-rebuild.yml
docs/SETUP.md, docs/superpowers/notes/sveltia-spike.md, docs/superpowers/notes/german-drafts.md
tests/unit/**, tests/e2e/**
```

Removed at the end of Task 9: `src/content/career.ts`, `src/content/schema.ts`, `src/i18n/{en,de,types,index}.ts` (keep `locales.ts`), the old components, `src/scripts/{lenis,split-lines,motion}.ts`.

---

## Phase A: Content and domain

### Task 1: Test tooling and primitive schemas

**Files:**
- Modify: `package.json` (scripts: `test`, `test:e2e`, `check`; devDeps `vitest`, `@playwright/test`; deps `yaml`)
- Create: `vitest.config.ts` (uses `getViteConfig` from `astro/config`), `src/content/schemas/primitives.ts`, `src/lib/localize.ts`
- Test: `tests/unit/schemas/primitives.test.ts`, `tests/unit/lib/localize.test.ts`

**Interfaces:**
- Produces:
  - `localized<T extends z.ZodTypeAny>(inner?: T)`: returns `z.object({ en: inner, de: inner })`. The default `inner` is a trimmed non-empty string.
  - `localizedRich`, which is `localized(richText)`.
  - `richText`: a non-empty Markdown string.
  - `month`: either `YYYY-MM` or `"present"`.
  - `yearOrMonth`: `YYYY` or `YYYY-MM`.
  - `imageRef`: `{ src: string /* path under /src/assets/uploads/ */, alt: Localized<string>, crop?: { x: number; y: number; width: number; height: number } /* percent 0–100 */ }`.
  - `slugId`: a string matching `/^[a-z0-9-]+$/`.
  - Types: `Localized<T>`, `RichText`, `ImageRef`.
  - `pick<T>(value: Localized<T>, locale: Locale): T` in `localize.ts`.

- [ ] **Step 1: Write failing tests**

```ts
test("localized rejects empty German", () => {
  expect(localized().safeParse({ en: "Hi", de: "" }).success).toBe(false);
});
test("localized rejects missing key", () => {
  expect(localized().safeParse({ en: "Hi" }).success).toBe(false);
});
test("month accepts 2019-08 and present, rejects 2019-13", () => { /* three expects */ });
test("imageRef crop must stay within 0–100 and x+width ≤ 100", () => {
  expect(imageRef.safeParse({ src: "/src/assets/uploads/a.jpg", alt: { en: "a", de: "a" }, crop: { x: 60, y: 0, width: 50, height: 10 } }).success).toBe(false);
});
test("slugId rejects 'My Section' and 'über'", () => { /* two expects */ });
test("pick returns the locale's value", () => {
  expect(pick({ en: "Experience", de: "Erfahrung" }, "de")).toBe("Erfahrung");
});
```

- [ ] **Step 2: Run `npx vitest run tests/unit` and confirm the tests fail because the modules don't exist yet.**
- [ ] **Step 3: Implement `primitives.ts` and `localize.ts` with the signatures above. Add `"test": "vitest run"` to the `package.json` scripts.**
- [ ] **Step 4: Run `npm test` and confirm it passes.**
- [ ] **Step 5: Commit with the message `test: add vitest and bilingual primitive schemas`, then push.**

### Task 2: Section schemas, registry and section helpers

**Files:**
- Create:
  - `src/content/schemas/sections/{base,hero,statement,stats,journey,contact,timeline,cards,tags,text,quotes}.ts`
  - `src/content/schemas/registry.ts`
  - `src/lib/sections.ts`
- Test: `tests/unit/schemas/sections.test.ts`, `tests/unit/lib/sections.test.ts`

**Interfaces:**
- Produces:
  - **`base.ts`, the shared contract (Liskov substitution):**
    ```ts
    sectionBase = { id: slugId, title: localized(), visible: boolean (default true), inMenu: boolean (default true),
                    animate: boolean (default true), inPdf: boolean (default true) }
    ```
  - **Per-type schemas** spread `sectionBase` plus `type: z.literal("<name>")`. The fields come from spec §5.4 and §6:
    - `hero`: `prompt`, `role`, `subtitle`, `ctaPrimary`, `ctaSecondary`, `jsonCard: { key: string; values: Localized<string>[] }[]`, `portrait: imageRef`, `motto: localized()` with `showMotto` defaulting to false.
    - `statement`: `text: localizedRich`.
    - `stats`: `items` (at most 4). Each item is `{ label: localized(), value: { kind: "number", n } | { kind: "yearsSince", date: month } | { kind: "count", sectionId: slugId }, override?: number }`.
    - `journey`: `stops: { year: localized(), heading: localized(), text: localizedRich, caption: string, head?: boolean }[]` (at least 1).
    - `contact`: `heading: localized()`, `lead: localizedRich`, labels for the email, LinkedIn and CV buttons.
    - `timeline`: `compact: boolean`. `items: { title: localized(), org: string, orgUrl?: url, location: string, employment?: "full-time"|"part-time"|"internship", start: yearOrMonth, end: yearOrMonth|"present", description?: localizedRich, badge?: string }[]`. The end must not be before the start.
    - `cards`: `items: { name: localized(), description: localizedRich, role: localized(), tech: string[], start?: yearOrMonth, end?: yearOrMonth|"present", links?: { code?: url; live?: url }, image?: imageRef, confidential: boolean }[]`.
    - `tags`: `groups: { title: localized(), items: { label: string | Localized<string>, level?: string | Localized<string> }[] }[]`.
    - `text`: `paragraphs: localizedRich[]`.
    - `quotes`: `items: { quote: localizedRich, name: string, role: localized(), photo?: imageRef }[]`.
  - **`registry.ts`:**
    - `sectionSchemas: Record<SectionType, ZodObject>`.
    - `SectionType` is the union of the keys `"hero" | "statement" | "stats" | "journey" | "contact" | "timeline" | "cards" | "tags" | "text" | "quotes"`.
    - `pageSchema = z.object({ sections: z.array(z.discriminatedUnion("type", Object.values(sectionSchemas))) })`. Its `superRefine` rejects duplicate ids, more than one hero or contact, and a stats `count` that points at an unknown section.
    - Types: `Section`, `SectionOf<T extends SectionType>`.
  - **`sections.ts`:**
    - `visibleSections(sections: Section[]): Section[]` drops sections with `visible: false` and layout sections with no items.
    - `menuEntries(sections, locale): { id: string; label: string }[]`.
    - `pdfSections(sections): Section[]` keeps only sections that are both visible and `inPdf`.
    - `anchorFor(id: string): string` returns the `id` itself, since `slugId` already guarantees it is safe.

- [ ] **Step 1: Write failing tests.** Use a fixture built from a minimal valid page (`tests/fixtures/page.min.ts`).
  - `accepts a minimal valid page`
  - `rejects duplicate section ids`: two `timeline` sections with `id: "experience"` must fail, and the issue path must include `sections`.
  - `slugifies ids for anchors`: the id `"My Section"` must fail, so `slugId` guards anchor safety.
  - `rejects timeline item ending before start`
  - `rejects stats count pointing to unknown section`
  - `visibleSections excludes hidden and empty`
  - `pdfSections excludes inPdf false`
  - `menuEntries uses German titles for de`
- [ ] **Step 2: Run `npm test` and confirm the new tests fail.**
- [ ] **Step 3: Implement the schemas, the registry and the helpers with the interfaces above.**
- [ ] **Step 4: Run `npm test` and confirm it passes.**
- [ ] **Step 5: Commit with the message `feat: section schemas and registry`, then push.**

### Task 3: Site and legal schemas, repository, content migration

**Files:**
- Create:
  - `src/content/schemas/site.ts`, `src/content/schemas/legal.ts`
  - `src/content/repository.ts`
  - `src/content/data/{site,page,legal}.yml`
  - `src/assets/uploads/portrait.jpg`, moved from `src/assets/portrait.jpg`
  - `docs/superpowers/notes/german-drafts.md`
- Test: `tests/unit/content/repository.test.ts`, `tests/unit/content/real-content.test.ts`

**Interfaces:**
- Consumes: `pageSchema` (Task 2) and the primitives (Task 1).
- Produces:
  - `siteSchema` contains:
    - `name: string`, `logoText: string`
    - `meta: { title: localized(), description: localized() }`
    - `email: { user: string; domain: string }`, `linkedin: url`, `location: localized()`
    - `siteUrl: url`
    - `palette: { accent: AccentId; background: BackgroundId }`, using the ids from Task 5. Keep a local `z.enum` here and have Task 5's test assert that it matches the palettes registry.
    - `pdf: { includePortrait: boolean; fileBaseName: slugId }`
    - `analytics: { umamiWebsiteId?: string; dashboardUrl?: url }`
    - `labels`: bilingual UI strings, including `present`, `year`, `years`, `month`, `months`, `employment` (one per type), `downloadCv`, `skipToContent`, `themeToggle`, `language`, `privacy`, `impressum`, `codeLink`, `liveLink`, `confidential`.
  - `legalSchema`: `{ privacy: { visible: boolean, title: localized(), body: localizedRich }, impressum: same shape, with visible defaulting to false }`.
  - `interface Content { site: Site; page: Page; legal: Legal }`.
  - `loadContent(dir = process.env.CONTENT_DIR ?? "src/content/data"): Content`. The `CONTENT_DIR` override lets e2e tests build with fixture content. reads the three YAML files and validates them. On failure it throws a `ContentError` whose message reads `<file>: <path.joined> — <zod message>` for every issue.
  - `getContent(): Content` caches the result for the length of the build. This is the only accessor components use (dependency inversion).

- [ ] **Step 1: Write failing tests.**
  - `ContentError names file and path`: a fixture directory with `page.yml` whose first timeline item has `de: ""` must throw an error whose message contains `page.yml` and `sections.`.
  - `real content validates`: `loadContent()` on the actual `src/content/data` must not throw.
  - `real content has every role`: the experience timeline must have 5 items, the first with org `Imbus AG`, start `2026-02` and end `present`.
- [ ] **Step 2: Run `npm test` and confirm the tests fail.**
- [ ] **Step 3: Implement `site.ts`, `legal.ts` and `repository.ts`.**
- [ ] **Step 4: Write the YAML content.**
  - **Migrate the existing content.** Every role, education entry, skill group, the about paragraphs, the contact lead, `meta`, and the labels come from `src/content/career.ts` (facts) and `src/i18n/en.ts` / `de.ts` (text). Copy the text word for word.
  - **Section order** follows spec §5.2: hero, statement, stats, journey, about (`text`), experience (`timeline`), projects (`cards`, `visible: false`, no items), skills (`tags`), education (`timeline`, `compact: true`), contact.
  - **New English copy** for the statement, stats, journey stops, prompt, `jsonCard` entries and the contact heading is taken verbatim from `motion-prototype.html`.
  - **Stats:**
    - "years building TestBench" is `yearsSince 2019-08`.
    - "years since my first professional code" is `yearsSince 2015-03`.
    - "qualifications in computer science" is `count` of `education`.
    - "languages spoken" is `number 4`.
  - **Defaults:** palette `whisky` on `oat`; `siteUrl: https://youssefaitlhaj.pages.dev`; `pdf.includePortrait: true`; `pdf.fileBaseName: youssef-ait-lhaj-cv`.
  - **Privacy policy:** write a draft (EN and DE) naming Cloudflare (hosting) and Umami (cookieless analytics), with `visible: true`.
  - **Impressum:** a placeholder with `visible: false`.
  - **German translations you write yourself:** list each one, with its YAML path, in `german-drafts.md` for Youssef to review.
- [ ] **Step 5: Run `npm test` and confirm it passes.**
- [ ] **Step 6: Commit with the message `feat: content repository and migrated YAML content`, then push.**

### Task 4: Dates, durations and computed stats

**Files:**
- Modify: `src/lib/dates.ts`. Rewrite it so it no longer depends on `Dictionary` or `Role`.
- Create: `src/lib/stats.ts`
- Test: `tests/unit/lib/dates.test.ts`, `tests/unit/lib/stats.test.ts`

**Interfaces:**
- Produces:
  - `monthsBetween(start: string, end: string | "present", now: Date): number`. The count is inclusive, has a minimum of 1, and treats `YYYY` as January for the start and December for the end.
  - `formatMonth(value, locale, labels): string` uses `Intl` with `month: "short"`. A `YYYY` value prints as the year alone.
  - `formatRange(start, end, locale, labels): string` joins the two ends with ` – `.
  - `formatDuration(months: number, locale, labels): string`.
  - `resolveStat(stat, page: Page, now: Date): number`. The override wins. `yearsSince` is `floor(monthsBetween(date, "present", now) / 12)`. `count` is the number of items in the referenced section.

- [ ] **Step 1: Write failing tests.** Use the fixed date `now = new Date(Date.UTC(2026, 10, 6))`.
  - `Mar–May 2015 is 3 months`
  - `2019-08 → 2026-01 is "6 yrs 6 mos"`
  - `2026-02 → present is "10 mos"`
  - `formatMonth 2019-08 de` contains `Aug` and `2019`
  - `yearsSince 2019-08 is 7`
  - `yearsSince 2015-03 is 11`
  - `count of education is 3`
  - `override wins`
  - `yearsSince future date is 0`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Commit with the message `feat: label-driven dates and computed stats`, then push.**

### Task 5: Palettes, contrast and rich text

**Files:**
- Create: `src/lib/palettes.ts`, `src/lib/rich-text.ts`
- Test: `tests/unit/lib/palettes.test.ts`, `tests/unit/lib/rich-text.test.ts`

**Interfaces:**
- Produces:
  - **`palettes.ts`:**
    - `accents: Record<AccentId, { label: string; light: string; dark: string }>`, where `AccentId` is `"whisky"|"bourbon"|"singleMalt"|"green"`.
    - `backgrounds: Record<BackgroundId, { label: string; light: Tokens; dark: Tokens }>`, where `BackgroundId` is `"oat"|"paper"|"stone"|"white"`. All values come from `palette-explorer.html`. `Tokens` is `{ bg, soft, panel, line, muted, ink }`.
    - `swatches: Record<SwatchId, (accent: AccentId, bg: BackgroundId, mode: "light"|"dark") => string>`, where `SwatchId` is `"accent"|"muted"|"highlight"|"positive"`. `accent` and `muted` reuse the tokens. Pick `highlight` (a red-brown) and `positive` (a green) per mode so they pass AA.
    - `contrastRatio(a: string, b: string): number` follows the WCAG 2.x relative-luminance formula.
    - `paletteCss(accent, bg): string` returns a CSS text block that defines `:root[data-theme="light"]`, `:root[data-theme="dark"]`, and the `prefers-color-scheme` fallback, each with all tokens, `--accent-ink`, and `--swatch-<id>`.
  - **`rich-text.ts`:**
    - `renderRichText(md: string, opts: { inline?: boolean }): string` is Markdown rendered by `marked`, then cleaned by `sanitize-html`.
    - The allowlist is: `p, br, strong, em, u, s, code, a[href|target|rel], ul, ol, li, span[class]`.
    - The only allowed classes are `c-<swatch>`, matching `/^c-(accent|muted|highlight|positive)$/`.
    - `a` tags keep only `http`, `https`, `mailto` and relative hrefs. `target="_blank"` adds `rel="noopener noreferrer"`.
    - `toPlainText(md: string): string`.

- [ ] **Step 1: Write failing tests.**
  - `every accent×background passes AA in both modes`: loop over every combination and assert `contrastRatio(accent, bg) >= 4.5`, `contrastRatio(muted, bg) >= 4.5`, `contrastRatio(ink, bg) >= 4.5` and `contrastRatio(accentInk, accent) >= 4.5`.
  - `every swatch passes AA on bg and soft in both modes`
  - `old gold #C9A227 on #F4EEE4 fails 4.5` (a sanity check of the contrast function)
  - `site.yml palette enum matches registry ids`
  - `renders bold, italic, underline, link`: `**a** *b* <u>c</u> [d](https://x.dev)` must produce `<strong>`, `<em>`, `<u>` and `<a href="https://x.dev">`.
  - `keeps colour span`: `<span class="c-accent">x</span>` must be preserved.
  - `strips pasted html to allowlist`:
    ```ts
    const out = renderRichText('<p style="color:red" onclick="x()">Hi</p><script>alert(1)</script><iframe src="x"></iframe><a href="javascript:alert(1)">l</a><span class="c-evil">z</span>', {});
    expect(out).not.toMatch(/style=|onclick|<script|<iframe|javascript:|c-evil/);
    expect(out).toContain("Hi");
    ```
  - `inline mode has no <p> wrapper`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Commit with the message `feat: AA-checked palettes and sanitised rich text`, then push.**

### Task 6: Images, upload handling and crop

**Files:**
- Create: `src/lib/images.ts`, `scripts/crop-images.ts`
- Modify: `package.json`, adding `"prebuild": "tsx scripts/crop-images.ts"` and the devDeps `tsx` and `sharp`; `.gitignore`, adding `src/assets/.generated/`
- Test: `tests/unit/lib/images.test.ts`, with fixtures in `tests/fixtures/images/` (a small jpg, a 4000×3000 jpg generated in a test setup step with sharp, a png, and a fake `.heic`)

**Interfaces:**
- Produces:
  - `generatedPathFor(ref: ImageRef): string`. Without `crop` it returns `ref.src`. With `crop` it returns `/src/assets/.generated/<basename>-<hash of crop>.<ext>`.
  - `cropAll(refs: ImageRef[], root: string): Promise<void>` uses sharp to extract the percentage rectangle, downscales so the longest side is at most 2400 px, and writes the result to the generated path.
    - Supported inputs: jpg, jpeg, png, webp, avif.
    - Anything else throws `ImageError("<src>: unsupported format <ext> — upload JPG, PNG or WebP")`.
    - A missing file throws `ImageError("<src>: file not found")`.
  - `collectImageRefs(content: Content): ImageRef[]` walks every section and finds every `imageRef` in it.
  - `resolveImage(ref: ImageRef): ImageMetadata` looks up `generatedPathFor(ref)` in an eager `import.meta.glob("/src/assets/{uploads,.generated}/*.{jpg,jpeg,png,webp,avif}")`. If nothing is found it throws `ImageError`.
  - `scripts/crop-images.ts`: `loadContent()`, then `collectImageRefs`, then `cropAll`. It always runs, even when there are no crops, so that format errors surface before `astro build` starts.

- [ ] **Step 1: Write failing tests.**
  - `crop 10/10/50/50 of 4000×3000 yields 2000×1500`
  - `downscales oversized image`: a 6000×4000 source with a full-frame crop must produce a longest side of 2400.
  - `rejects unsupported format with file name`: a `.heic` must throw, with a message containing the file name and `JPG, PNG or WebP`.
  - `missing file error names the src`
  - `collectImageRefs finds hero portrait and card images`
  - `same crop → same generated path; different crop → different path`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Commit with the message `feat: build-time image crop and upload validation`, then push.**

## Phase B: Public site

### Task 7: Base layout, tokens, fonts, header and footer

**Files:**
- Modify: `src/styles/global.css` (rewrite it with the token names from Global Constraints, the font families, and the Tailwind `@theme` mapping to the tokens), `package.json` (remove `@fontsource-variable/fraunces`, `@fontsource-variable/inter` and `lenis`; add `@fontsource/ibm-plex-sans` with weights 400, 500, 600 and 700, and `@fontsource/jetbrains-mono` with 400, 500, 700 and 800), `src/scripts/theme.ts` (kept as is), `astro.config.mjs` (set `site` from `site.yml`'s `siteUrl` by reading the YAML at config time)
- Create:
  - `src/components/layout/Base.astro`, which inlines `paletteCss()` in `<style is:inline>` and keeps the existing pre-paint theme script, minus the `js-motion` failsafe logic. Task 10 replaces that logic.
  - `Header.astro`, which contains the logo text, `menuEntries`, the locale switcher, the theme toggle, and the progress bar element `[data-progress]`.
  - `Footer.astro`, which contains the copyright, the location, and the privacy link, plus the impressum link only when it is visible.
  - `LocaleSwitcher.astro`, `ThemeToggle.astro`, `RichText.astro` (`<Fragment set:html={renderRichText(...)} />`), and `Img.astro` (wraps `<Image>` with `resolveImage`).
- Test: `tests/e2e/layout.spec.ts`, plus `playwright.config.ts` (`webServer: npm run build && npm run preview`, projects for Chromium desktop, Chromium 320×640, and Chromium with `reducedMotion: "reduce"`)

**Interfaces:**
- Consumes: `getContent()`, `menuEntries`, `paletteCss`, `pick`, `renderRichText`, and `resolveImage`.
- Produces: `<Base locale title description>` with slots `default` and `head`; `<RichText value={Localized<RichText>} locale inline?>`; and `<Img image={ImageRef} locale widths sizes class?>`.

- [ ] **Step 1: Write failing e2e tests.**
  - `no google fonts requests`: collect every request on `/` and assert that none has a host matching `/googleapis|gstatic/`.
  - `theme toggle switches and persists`: click the toggle, check the `data-theme` attribute, reload, and check that it stuck.
  - `de page has German menu`: `/de/` shows `Erfahrung`.
  - `skip link targets main`
- [ ] **Step 2: Run `npx playwright test tests/e2e/layout.spec.ts` and confirm it fails.**
- [ ] **Step 3: Implement the files above.** Temporarily, `src/pages/index.astro` and `de/index.astro` render only `Base`, `Header`, and `Footer`.
- [ ] **Step 4: Run the tests and confirm they pass. Run `npx astro check` and confirm it reports 0 errors.**
- [ ] **Step 5: Commit with the message `feat: new base layout, tokens, self-hosted fonts`, then push.**

### Task 8: Fixed sections (Hero, Statement, Stats, Journey, Contact)

**Files:**
- Create: `src/components/sections/{Hero,Statement,Stats,Journey,Contact}.astro`
- Modify: `src/scripts/email.ts` (remove `data-magnetic`)
- Test: `tests/e2e/sections-fixed.spec.ts`

**Interfaces:**
- Consumes: `SectionOf<"hero">` and the other per-type section types, `resolveStat`, `RichText`, `Img`, and `formatRange`.
- Produces: each component takes the props `{ section: SectionOf<T>; locale: Locale; content: Content }`.
  - Every section's root element is `<section id={anchorFor(section.id)} data-section={section.type} data-animate={String(section.animate)}>`.
  - The markup and classes follow `motion-prototype.html`.
  - Motion hooks use data attributes only: `data-intro`, `data-statement`, `data-count={value}`, `data-journey`, `data-journey-track`, `data-journey-rail`, `data-typer`, and `data-scale-in`.
  - The Hero CV button points to `/cv/<fileBaseName>-<locale>.pdf` and has `data-umami-event="cv-download"` and `data-umami-event-lang={locale}`.
  - The Contact email link uses `data-email-user` and `data-email-domain` with `data-umami-event="email-click"`, and the LinkedIn link has `data-umami-event="linkedin-click"`.

- [ ] **Step 1: Write failing e2e tests.** Run them with JavaScript disabled for the content-visibility checks.
  - `hero shows name, role, cv link to /cv/youssef-ait-lhaj-cv-en.pdf`
  - `stats show computed numbers 7 and 11 in final markup`: the server-rendered text equals the final value, and JavaScript counts up from 0 only as an enhancement.
  - `journey has 6 stops in order, last marked HEAD`
  - `email address not present as one string in HTML source`
  - `motto hidden by default`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Commit with the message `feat: hero, statement, stats, journey, contact sections`, then push.**

### Task 9: Layout sections, section renderer, cleanup

**Files:**
- Create: `src/components/sections/{Timeline,Cards,Tags,Text,Quotes}.astro`, `src/components/sections/index.ts`, `src/components/sections/SectionRenderer.astro`
- Modify: `src/pages/index.astro` and `src/pages/de/index.astro`, which become `Base`, `Header`, `visibleSections(page.sections).map(SectionRenderer)`, and `Footer`, plus the Person JSON-LD carried over from the old `Page.astro`, using values from content
- Delete: the old components, `src/content/career.ts`, `src/content/schema.ts`, `src/i18n/{en,de,types,index}.ts`, `src/scripts/{lenis,split-lines}.ts`
- Test: `tests/unit/sections/registry-complete.test.ts`, `tests/e2e/sections-layout.spec.ts`

**Interfaces:**
- Consumes: `sectionSchemas` (Task 2) and the fixed components (Task 8).
- Produces:
  - `webComponents: Record<SectionType, AstroComponent>` and `printComponents: Record<SectionType, AstroComponent>`. Task 12 fills in `printComponents`; until then it is a typed `Partial`.
  - `<SectionRenderer section locale content mode="web"|"print">`.
- **Layouts:**
  - **Timeline** renders the commit rail (`data-rail`, `data-commit` on each item) with the badge, the employment tag (from `site.labels`) and the duration. `compact` hides descriptions.
  - **Cards** are styled to match the prototype's visual language: a panel with a border, the mono dates, tech as chips, and links with `data-umami-event="project-link"`. A `confidential` card hides its links and image and shows `labels.confidential`.

- [ ] **Step 1: Write failing tests.**
  - `every section type has a web component`: the keys of `webComponents` equal the keys of `sectionSchemas`.
  - E2E: `experience shows 5 commits with HEAD on first`
  - E2E: `hidden section absent from menu`: build with a fixture content directory (`CONTENT_DIR` environment variable read by `repository.ts`) in which `skills` is hidden, and assert that there is no `#skills` element and no menu link to it.
  - E2E: `no horizontal overflow at 320px`, using a fixture that contains `Softwareentwicklungsprozessoptimierung` and a 120-character URL. In the 320 px project, assert `document.documentElement.scrollWidth <= 320` on `/` and `/de/`.
  - E2E: `confidential card shows no links or image`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass. Run `npx astro check` and confirm it reports 0 errors.**
- [ ] **Step 5: Commit with the message `feat: layout sections and data-driven page; remove old site`, then push.**

### Task 10: Motion layer

**Files:**
- Create: `src/scripts/motion/index.ts` and `src/scripts/motion/effects/{intro,progress,parallax,statement,counters,journey,rail,typer,chips,scaleIn,navSpy}.ts`
- Modify: `src/components/layout/Base.astro`. Add a script import of `motion/index.ts`, and have the inline pre-paint script add the `motion` class to `<html>` only when reduced motion is off.
- Delete: `src/scripts/motion.ts`
- Test: `tests/e2e/motion.spec.ts`

**Interfaces:**
- Produces: each effect file exports `const effect: { selector: string; init(el: Element, ctx: { gsap; ScrollTrigger }): void }`. `index.ts` holds a list of effects (open/closed principle: adding an effect means adding one file and one list entry). It skips every element inside `[data-animate="false"]` and does nothing at all under reduced motion.
- **Behaviour:** each effect matches its row in the spec §5.3 table, and timing values come from `motion-prototype.html`.
  - The intro timeline is forced to completion on the first `scroll` event.
  - The intro types the name letter by letter, left to right (about 40 ms per letter, matching the prototype). Letters are wrapped per word in `white-space: nowrap` spans so a word never breaks mid-line; unrevealed letters use `visibility: hidden` so nothing shifts; the block cursor moves after the last revealed letter and doesn't blink while typing. The `<h1>` keeps the full name for assistive tech (visually hidden text, letter spans `aria-hidden`).
  - The journey effect pins and scrubs horizontally only at `min-width: 761px`.
  - The statement effect splits words across text nodes while keeping the parent `<strong>`, `<u>` and `<span class>` elements.
- **CSS rule:** elements are hidden for the intro only under `.motion [data-intro] …`, and never through CSS that applies without the `motion` class.

- [ ] **Step 1: Write failing e2e tests.**
  - `reduced motion: all text fully opaque, counters at final value, no pinned spacer`: in the `reducedMotion` project, assert that every `[data-statement] .w` element (or the paragraph itself) has a computed opacity of 1, and that there is no `.pin-spacer` element.
  - `intro completes on first scroll`: load the page, scroll 10 px immediately, then on the next frame assert that no name letter is hidden and the cursor follows the last letter.
  - `name types left to right`: about 150 ms into typing, the revealed letters are a non-empty prefix of the name shorter than the full name, and the cursor sits right after the last revealed letter.
  - `name typing causes no layout shift`: the `<h1>` bounding box is the same mid-typing and after typing, at 1280 px and 320 px.
  - `name is read whole`: the `<h1>` accessible name equals the full name from `site.yml`.
  - `statement keeps formatting while split`: a fixture statement with `**bold**` must still contain a `strong` element after initialisation.
  - `animate:false section has no ScrollTrigger`: in a fixture, disable animation on experience and assert that the rail fill already has its final transform.
  - `no JS: content visible`: with JavaScript disabled, `[data-intro]` elements are visible.
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Check by hand in a desktop browser and at a 375 px width.** Compare against the prototype: the intro takes about 1 s and the name types letter by letter, the statement scrubs with scrolling, and the journey pins. Note the result in the commit body.
- [ ] **Step 6: Commit with the message `feat: scroll-linked motion layer`, then push.**

### Task 11: Legal pages, SEO and analytics

**Files:**
- Create: `src/pages/privacy.astro`, `src/pages/de/privacy.astro`, `src/pages/impressum.astro`, `src/pages/de/impressum.astro`. The impressum pages render 404-equivalent output when `legal.impressum.visible` is false: use `getStaticPaths`-free conditional `Astro.redirect("/")`, or exclude them from the build. The builder picks one.
- Create: `src/components/layout/Analytics.astro`
- Modify: `Base.astro` (render `<Analytics>`, `og:` meta and `hreflang` from content, and `theme-color` from the palette)
- Test: `tests/e2e/legal-seo.spec.ts`, `tests/unit/lib/analytics.test.ts`

**Interfaces:**
- Produces:
  - `shouldLoadAnalytics(env: { PUBLIC_DEPLOY_ENV?: string }, site: Site): boolean` returns true only when `PUBLIC_DEPLOY_ENV === "production"` and `umamiWebsiteId` is set.
  - `Analytics.astro` renders `<script defer src="https://cloud.umami.is/script.js" data-website-id=…>` only when `shouldLoadAnalytics` is true.

- [ ] **Step 1: Write failing tests.**
  - `analytics off in preview/dev, on in production with id` (unit)
  - E2E: `privacy page in both languages linked from footer`
  - E2E: `impressum hidden by default: no footer link, /impressum not 200`
  - E2E: `meta description and og:title come from site.yml per locale`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Commit with the message `feat: legal pages, SEO meta, production-only Umami`, then push.**

## Phase C: PDF

### Task 12: Print route and print components

**Files:**
- Create: `src/pages/cv/print.astro`, `src/pages/de/cv/print.astro`, `src/components/print/*.astro` (one per section type; hero becomes a header with the name, role, location, email in full plain text, and LinkedIn URL, plus the portrait when `pdf.includePortrait` is on), `src/styles/print.css`
- Modify: `src/components/sections/index.ts`, where `printComponents` becomes a complete `Record`
- Test: `tests/unit/sections/registry-complete.test.ts` (extend it), `tests/e2e/print.spec.ts`

**Interfaces:**
- **Print pages:**
  - Both pages render `pdfSections(page.sections)` with `mode="print"`, in light theme only.
  - The print stylesheet sets `@page { size: A4; margin: 14mm 14mm 16mm; }`.
  - Every item gets `break-inside: avoid`.
  - Links print with their URL after the text, via `a[href^="http"]::after { content: " (" attr(href) ")" }`, except where the text already is the URL.
  - No motion scripts and no analytics load.
  - The pages carry `<meta name="robots" content="noindex">`.

- [ ] **Step 1: Write failing tests.**
  - `every section type has a print component`
  - E2E: `print omits hidden and pdf-excluded sections`, using a fixture with `inPdf: false` on skills
  - E2E: `print has no phone or address`: page text matching neither `/\+?\d[\d\s/-]{7,}/` nor `/Straße|Str\./`
  - E2E: `portrait toggle respected`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Commit with the message `feat: print route for the PDF CV`, then push.**

### Task 13: PDF generation

**Files:**
- Create: `scripts/generate-pdf.ts`
- Modify: `package.json`, adding `"postbuild": "tsx scripts/generate-pdf.ts"` and the devDep `unpdf`
- Test: `tests/unit/pdf/generate.test.ts`, which runs after a build in CI (`npm run build && npm run test:pdf`)

**Interfaces:**
- Produces: `generatePdfs(distDir = "dist", locales = ["en","de"]): Promise<string[]>`.
  - It serves `dist` with `astro preview` on a free port.
  - It opens `/cv/print` and `/de/cv/print` in Chromium and calls `page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true })`.
  - It writes `dist/cv/<fileBaseName>-<locale>.pdf` and returns the paths.
  - If Chromium isn't installed, it fails with a clear message.

- [ ] **Step 1: Write failing tests.**
  - `creates en and de pdfs`
  - `pdf contains selectable text`: `extractText` from `unpdf` must contain `Youssef Ait Lhaj` and `Imbus AG`. The German PDF must contain `Erfahrung`, or whatever the German experience title is.
  - `pdf contains email in plain text and no phone`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run `npm run build && npm run test:pdf` and confirm it passes. Open the PDF and check by eye that no item is split across pages.**
- [ ] **Step 5: Commit with the message `feat: build-time PDF CV generation`, then push.**

## Phase D: Admin

### Task 14: Sveltia spike (decisions only; no product code)

**Files:**
- Create: `docs/superpowers/notes/sveltia-spike.md`

Check each question below against the current Sveltia CMS docs and release notes, and with a local test using `public/admin` on a scratch branch in "Work with Local Repository" mode in Chromium. Record the version tested and the answer. Delete the scratch branch afterwards.

1. **Editing structure:**
   - Can a `list` field with `types` (variable types) edit `page.yml`'s `sections`?
   - Can it reorder by drag, including on a phone-width screen?
   - Does nested `object` with `en`/`de` subfields render the two languages adjacently? (Bilingual fields are plain objects, so CMS `i18n` is not used.)
2. **Editorial workflow:**
   - Does `publish_mode: editorial_workflow` create one branch and PR per entry?
   - Does it show a "deploy preview" link taken from a commit status or check on the PR head?
   - What status context name does it read?
   - Does "Publish" merge through the GitHub API? It must therefore be blocked by required status checks.
3. **Images:**
   - Does Sveltia have built-in crop?
   - If not, does it support custom widgets (`CMS.registerWidget`) in the current version?
4. **Rich text:**
   - Which toolbar buttons does the `markdown` widget support? Is underline among them?
   - Can inline extensions (custom editor components or buttons) wrap selected text in `<span class="c-…">` and `<u>`?
   - Does raw inline HTML survive a round trip through the editor?
5. **Custom links:** Can a custom page or menu link point to the Umami dashboard URL and to the open PR or preview list?

**Decisions to record.** Each must be one of the listed options.

- **Crop:**
  - (A) A custom widget using `cropperjs` that writes `crop` to the `imageRef`.
  - (B) If custom widgets are unavailable: four number fields (x, y, width, height in %) shown next to a live preview, through the image field's preview pane.
- **Rich text:**
  - (A) The native underline button plus a colour inline extension.
  - (B) Native marks plus documented inline HTML snippets (`<u>…</u>`, `<span class="c-accent">…</span>`). They are listed in the field `hint`, and Task 5's renderer already allows them.
- **Preview:**
  - (A) The editorial workflow with per-PR preview deploys.
  - (B) Fallback: `backend.branch: draft`, plus an auto-maintained `draft` to `main` PR, created by a workflow in Task 17.
- **Statistics link placement.**

- [ ] **Step 1: Write the spike notes with every answer and decision.**
- [ ] **Step 2: Commit with the message `docs: Sveltia spike findings and decisions`, then push.**

### Task 15: Sveltia configuration

**Files:**
- Create: `public/admin/index.html` (loads `https://unpkg.com/@sveltia/cms@<exact version from the spike>/dist/sveltia-cms.js` with `integrity="sha384-…"` and `crossorigin="anonymous"`, then `/admin/extensions.js`; the admin is privileged, so every external script there is pinned and checked by SRI) and `public/admin/config.yml`
- Test: `tests/unit/admin/config-contract.test.ts`

**Interfaces:**
- **`config.yml`:**
  - `backend: { name: github, repo: youssefaitlhaj/DigitalCV, branch: main, base_url: <auth worker URL from SETUP, placeholder https://sveltia-cms-auth.REPLACE.workers.dev> }`.
  - `publish_mode` per the spike decision.
  - `media_folder: src/assets/uploads` and `public_folder: /src/assets/uploads`.
  - A `files` collection with three entries: `site` (`src/content/data/site.yml`), `page` (`page.yml`, with `sections` as a `list` with `types`, one per section type), and `legal`.
  - Bilingual fields are `object` widgets with `en` and `de` subfields, both `required: true`. Rich text uses `widget: markdown`. Ids use `pattern` matching `slugId`. Images are an `object` with `src` (image widget), `alt` (bilingual) and `crop` (per the spike).
  - The `palette` selects list exactly the registry ids.

- [ ] **Step 1: Write failing tests (the contract test).** Parse `config.yml` with `yaml`.
  - `every section type in registry has a matching CMS type`
  - `every required schema field of each section type exists in its CMS type`: walk the Zod object shape, unwrap optional/default, and compare names recursively.
  - `bilingual schema fields are CMS objects with required en and de`
  - `palette options equal palettes registry ids`
  - `media_folder is src/assets/uploads`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement `config.yml` and `index.html`. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Do a local check: run `npm run dev`, open `/admin`, use "Work with Local Repository", edit a job title in German, and save.** Then confirm that `git diff` shows only that field changed and that `npm test` still passes, and revert the edit.
- [ ] **Step 6: Commit with the message `feat: Sveltia CMS configuration with schema contract test`, then push.**

### Task 16: Admin extensions (crop, rich text, links)

**Files:**
- Create: `public/admin/extensions.js` (plain ES module, no build step) and `src/pages/admin/links.json.ts` (a static endpoint that emits `{ dashboardUrl, pullsUrl }` from `site.yml`, so the admin JavaScript reads settings without parsing YAML). If the crop widget decision is (A), also create `public/admin/crop-widget.js` and add `cropperjs` from `https://unpkg.com/cropperjs@<exact version>/` with an SRI hash.
- Modify: `public/admin/config.yml` (hints, widget names)
- Test: `tests/e2e/admin-extensions.spec.ts`. Load `/admin/` with the Sveltia script stubbed by a minimal fake `CMS` global that records `register*` calls. This test only verifies that the extensions register.

**Interfaces:**
- Implement the spike's decisions:
  - **Crop:** stores `{ x, y, width, height }` in percent, which is the exact shape of `imageRef.crop`.
  - **Rich text:** produces only the markup Task 5 allows: `<u>` and `<span class="c-accent|c-muted|c-highlight|c-positive">`. The swatch labels shown to Youssef are "Accent", "Muted", "Highlight" and "Green".
  - **Statistics:** a link to `dashboardUrl`, read from `/admin/links.json` and opening in a new tab. If the URL isn't set, the link is hidden.
  - **Preview and Publish:** a link to the repo's open pull requests (`https://github.com/youssefaitlhaj/DigitalCV/pulls`). Under the editorial workflow, Sveltia's own preview and publish controls are primary.

- [ ] **Step 1: Write failing tests.**
  - `registers colour + underline extensions`
  - `registers crop widget` (only for crop decision A)
  - `statistics link present when dashboardUrl set, absent when not`
  - `admin index.html external scripts all carry integrity`
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Do a local round trip: crop the portrait, then colour a word in the statement.** Then confirm that `npm run build` succeeds, that the cropped portrait appears in `dist`, and that the coloured span renders with the `--swatch-accent` colour.
- [ ] **Step 6: Commit with the message `feat: admin crop, text colour/underline and statistics link`, then push.**

## Phase E: Delivery

### Task 17: CI, preview and publish, deploy, scheduled rebuild

**Files:**
- Create:
  - **`.github/workflows/ci.yml`:**
    - Triggers: `pull_request` and `push` to `main`.
    - Steps: Node 22, `npm ci`, `npx playwright install --with-deps chromium`, `npx astro check`, `npm test`, `npm run build`, `npm run test:pdf`, `npx playwright test`.
    - On pull requests it then runs `wrangler pages deploy dist --project-name=$CF_PAGES_PROJECT --branch=$HEAD_REF` and posts a commit status with the context name from the spike and `target_url` set to the preview URL.
  - **`.github/workflows/deploy.yml`:**
    - Trigger: `push` to `main`.
    - Steps: the same build with `PUBLIC_DEPLOY_ENV=production`, then `wrangler pages deploy dist --branch=main`.
    - The build re-runs the tests; if any fail, nothing deploys.
  - **`.github/workflows/scheduled-rebuild.yml`:** weekly `cron: "0 5 * * 1"`, calling `deploy.yml` via `workflow_call`.
  - **Only for preview decision (B):** `.github/workflows/draft-pr.yml`, which opens or updates a `draft` → `main` PR on every push to `draft`.
- Secrets used: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Variable used: `CF_PAGES_PROJECT`.
- Test: `tests/unit/ci/workflows.test.ts` parses the workflows with `yaml`.

- [ ] **Step 1: Write failing tests.**
  - `deploy sets PUBLIC_DEPLOY_ENV=production and ci does not`
  - `ci runs unit, pdf and e2e tests before any deploy step`
  - `scheduled rebuild is weekly`
  - `no secret values inline`: assert no workflow string matches `/[A-Za-z0-9_-]{30,}/`, except inside `${{ }}`.
- [ ] **Step 2: Run the tests and confirm they fail. Step 3: Implement. Step 4: Run the tests and confirm they pass.**
- [ ] **Step 5: Commit with the message `ci: build, test, preview and production deploy`, then push.** Watch the `ci` run on GitHub and confirm it's green, except for the Cloudflare deploy step, which needs Task 18's secrets.

### Task 18: Setup guide and launch checklist

**Files:**
- Create: `docs/SETUP.md`
- Modify: `README.md` (new structure, commands, and how to edit content: point to `/admin`; editing YAML by hand is still possible)

**The guide covers these steps, in order.** Each step is numbered and says what to click and what to copy where, written for Youssef, who is a developer but has never used these services.

1. **Cloudflare account.** Mention the possible card prompt and the fallback from spec §10.2.
2. **Cloudflare Pages project.** Create it with Direct Upload (named `youssefaitlhaj`), and note the `.pages.dev` URL.
3. **API token** with the Pages Edit permission. Put it and the account id into the GitHub repository secrets, and set the `CF_PAGES_PROJECT` variable.
4. **GitHub branch protection on `main`.** Require the `ci` status check.
5. **Cloudflare Access for previews.** Use the Pages project setting "Enable access policy" for preview deployments, and allow only Youssef's email.
6. **Sveltia auth worker.** Deploy `sveltia-cms-auth` (one-click from its README), create a GitHub OAuth app whose callback is the worker URL, set the worker secrets `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `ALLOWED_DOMAINS`, and put the worker URL into `public/admin/config.yml`'s `base_url`. Do this last edit through a PR.
7. **Umami Cloud.** Create an account, add the website, put the website id and the dashboard share URL into `site.yml` (via `/admin`), and mention the 6-month retention.
8. **Later: the domain.** Buy `youssefaitlhaj.com`, attach it to the Pages project, and change `siteUrl` in `/admin`.

**Launch checklist (in the same file):**
- Check the whole flow: edit in `/admin`, then the preview link opens behind Cloudflare Access, then Publish, then the live site updates within 3 minutes.
- Both PDFs download.
- The Umami dashboard shows the visit and the `cv-download` event.
- Review every entry in `german-drafts.md` in the preview before the first Publish.
- Review the privacy policy text.

- [ ] **Step 1: Write `docs/SETUP.md` and update `README.md`.**
- [ ] **Step 2: Run `npm test`, `npm run build` and `npx playwright test`, and confirm they all pass.** These are the final full-suite checks.
- [ ] **Step 3: Commit with the message `docs: setup guide and launch checklist`, then push.**
