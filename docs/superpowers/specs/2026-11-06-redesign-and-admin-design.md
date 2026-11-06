# Site redesign, admin, PDF CV and hosting — design

Date: 2026-11-06
Supersedes the visual and motion parts of `2026-07-24-personal-brand-site-design.md`.
Reference prototypes (open in a browser): `2026-11-06-redesign-assets/motion-prototype.html` (the approved look and motion) and `2026-11-06-redesign-assets/palette-explorer.html` (colour tokens for every palette discussed).

Decisions are marked **(Youssef)** when he made them and **(design call)** when they were made on his behalf and he was told. Everything else in "Left to the builder" is the builder's to decide.

---

## 1. Intent

The site is Youssef Ait Lhaj's online CV. Everyone may read it, but the reader that matters is **a recruiter**. After visiting, they should think *"this is a very good software developer"*, and the site should reflect his personality: **doesn't give up, learns fast, social and well integrated in a team** (his words). **(Youssef)**

The current site (Astro, ivory + champagne gold, Fraunces serif, slow GSAP fades, Lenis smooth scroll) "looks like the other AI-generated websites". The redesign must not. **(Youssef)**

The site itself is evidence of effort: animations should make it clear he put work into it and show how he thinks, **without slowing a fast-scrolling recruiter down**. **(Youssef)**

He wants to keep the site up to date himself, from laptop or phone, without touching code: an admin page that controls **everything shown on the website**. **(Youssef)**

## 2. Goals

1. A redesigned public site: elegant, modern, easy to read, user friendly, with a developer flavour.
2. A new **Projects** section. **(Youssef)**
3. An admin at `/admin` where every visible piece of content is editable, in English and German, with images manageable (upload, replace, crop, delete). **(Youssef)**
4. **Preview → Publish**: saving produces an exact preview of the real site; only an explicit Publish makes it live. **(Youssef)**
5. A **downloadable PDF CV** that looks like the website, in English and German, generated automatically from the same content. **(Youssef)**
6. **Visitor statistics** (visitors, regions, time on site, …), reached via a button in the admin that opens the analytics dashboard. **(Youssef — he explicitly chose "open the dashboard" over building statistics into the admin.)**
7. Hosted for free, published automatically from GitHub. **(Youssef chose the GitHub-based approach over a database.)**

## 3. Non-goals

- A custom-built admin. The admin is a tool for Youssef, not a showcase; use a proven ready-made Git-based editor. **(Youssef)**
- Statistics rendered inside the admin. A link to the dashboard is enough. **(Youssef)**
- A database or always-on server. **(design call, agreed in conversation)**
- Admin-editable animation code or free-form layouts. Sections use a fixed set of layouts (§6). **(design call)**
- Automatic translation. Youssef writes both languages himself. **(Youssef)**
- A contact form. Email + LinkedIn links remain. **(design call, carried over)**
- Buying the domain. Youssef will buy `youssefaitlhaj.com` later; launch on the free host subdomain. **(Youssef)**

## 4. Anti-goals (failure even if it "works")

- Looking like a generic AI portfolio: warm ivory + champagne gold + display serif + slow line-unmask fades + scroll hijacking.
- Any animation that makes a reader **wait** for text. A fast scroller must be able to read everything immediately.
- A cookie banner. Nothing on the site may require one.
- Text that fails WCAG AA contrast (4.5:1 body, 3:1 large) in any offered palette, in light or dark mode.
- An admin edit that breaks or blanks the live site, or publishes a missing German (or English) string.
- A PDF that is an image (it must be real, selectable text so applicant tracking systems can parse it).

## 5. Public site

### 5.1 Look (approved in prototype)

Base is "Option A — clean and structured", with "Option B — developer" touches in moderation. **(Youssef: "the first one is elegant and that's who I am"; B "reflects the IT side"; merge them.)**

- **Layout:** white-space-generous grid; section label in a narrow left column, content right (collapses to one column on phones). Large name beside the portrait in the hero.
- **Developer touches:** `~/bamberg $ whoami` prompt above the name with a blinking block cursor; a `youssef.json` card (location, stack, spoken languages, traits); section labels styled as code comments (`// experience`); experience shown on a commit-graph rail with a `HEAD` badge on the current role and `first commit` on the first; monospace for dates and labels.
- **Typography:** IBM Plex Sans (reading) + JetBrains Mono (code details). Fraunces and Inter are removed. **Fonts are self-hosted** (e.g. Fontsource), never loaded from Google's servers — German courts have ruled Google-hosted fonts a GDPR violation. **(design call)**
- **Colour (Youssef chose Whisky on Oat):**

  | Token | Light | Dark |
  |---|---|---|
  | `--bg` | `#F4EEE4` | `#17130F` |
  | `--soft` | `#EBE3D6` | `#201B16` |
  | `--panel` | `#EFE8DC` | `#201B16` |
  | `--line` | `#DDD2C1` | `#342D25` |
  | `--muted` | `#5E5446` | `#A89B89` |
  | `--ink` | `#1C1813` | `#F0E8DC` |
  | `--accent` | `#9A5B13` | `#E0A14A` |
  | `--accent-ink` (text on accent fills) | `#FFFFFF` | `#17130F` |

  The other vetted palettes the admin may offer (§7.6) are in `palette-explorer.html`: accents Whisky, Bourbon, Single malt, Green; backgrounds Paper, Oat, Stone, White, each with light and dark values. Youssef's old champagne gold `#C9A227` fails contrast as text on light backgrounds and must not be offered as a light-mode text accent.
- **Dark mode:** a visitor toggle; default follows the OS preference; the choice is remembered (localStorage, wrapped in try/catch). No flash of the wrong theme on load. **(design call; the existing `theme.ts` already does this and can be adapted)**
- **Languages:** English at `/`, German at `/de/`, with a switcher (as today).

### 5.2 Page structure (default order; every section can be reordered/hidden from the admin)

1. **Header** — mono logo (`youssef.dev`-style, text editable), menu of visible sections with active-section highlight, EN/DE switcher, dark toggle. Thin accent scroll-progress bar along the top edge.
2. **Hero** — prompt line, name, role, subtitle, buttons (Download CV (PDF), Contact me), `youssef.json` card, portrait.
3. **Statement** — one large sentence revealed word by word with scroll.
4. **Stats** — up to four counters.
5. **Journey** — "From Casablanca to Bamberg": horizontal pinned track of stops (`git init` 2013 → `HEAD` 2026). Stacks vertically on phones. **(Youssef liked it, accepting that it is the one place a fast scroller must scroll through.)**
6. **About** — Text layout. (Present on the current site; kept, hideable.) **(design call)**
7. **Experience** — Timeline layout (commit rail).
8. **Projects** — Cards layout. **New (Youssef).**
9. **Skills** — Tags layout.
10. **Education** — Timeline layout (compact: no description needed).
11. **Contact** — large closing line, Email / LinkedIn / CV buttons.
12. **Footer** — copyright, location, links to Impressum and Datenschutzerklärung.

### 5.3 Motion (approved in prototype)

Principle: **scroll-linked (scrubbed) animation wherever possible**, so motion runs at the reader's speed; time-based animations are short (≤ ~1 s) and never hide content a reader is trying to reach. **(design call, agreed)**

| # | Effect | Behaviour |
|---|---|---|
| 1 | Hero intro | `whoami` types, name rises, buttons/card fade up, JSON lines appear then `✓ valid`, portrait reveals with a clip. ~1 s total. **Any scroll completes it instantly.** Subtle portrait parallax on scroll. |
| 2 | Statement | Words go from ~14% to 100% opacity, scrubbed to scroll. |
| 3 | Stats | Count up once on entering, < 1 s. |
| 4 | Journey | Pinned horizontal scroll with an accent rail filling, scrubbed. Vertical list with simple reveals on ≤ 760 px. |
| 5 | Timeline layouts | Rail draws with scroll; each node lights when reached. Text is always fully visible. |
| 6 | Tags layout | Chips snap in per group, fast. |
| 7 | Contact | Closing line scales up as it enters, scrubbed. |
| — | Section labels | `// label` types itself on entry (fast). |
| — | Nav | Active-section highlight; progress bar. |

- Library: GSAP + ScrollTrigger (already a dependency). **Lenis is removed** — no smooth-scroll hijacking. **(design call)**
- `prefers-reduced-motion: reduce` → no motion at all, everything in its final state. The site must be complete with JavaScript disabled too (content is server-rendered; animation only enhances).
- Each section has an "animations on/off" switch in the admin (§7.3).
- No other new effects without a reason. Cards layout gets the same restrained treatment as the others (builder's choice within this vocabulary).

### 5.4 Section layouts (content shapes)

Every user-visible string is bilingual (`en` + `de`). Proper nouns (company, tech names) may be single-valued.

- **Timeline** — items: title, organisation (+ optional URL), location, employment type (Full-time / Part-time / Internship / other), start (YYYY-MM or YYYY), end (date or "present"), optional description, optional badge (e.g. `HEAD`, `first commit`). Durations ("6 yrs 6 mos") computed. A "compact" option hides descriptions (used by Education).
- **Cards** — items: name, short description, role, technologies (list), dates, optional links (code, live), optional screenshot (with alt text), and a **"confidential / description only"** option that suppresses links and image (much of Youssef's best work is on TestBench and can't be shown). **(design call)**
- **Tags** — groups, each with a title and items; an item may carry a level (e.g. "Native", "C1").
- **Text** — one or more paragraphs.
- **Quotes** — items: quote, person's name, role/company, optional photo. Not used at launch; suggested for teammate recommendations because they prove "team player" better than self-description. **(design call; Youssef did not object)**

### 5.5 Contact

Email (obfuscated as today: assembled at runtime from two halves) and LinkedIn. Email/LinkedIn/CV-download clicks are tracked as analytics events (§9).

### 5.6 Legal pages

- **Datenschutzerklärung** (privacy policy): both languages, editable in the admin, linked from the footer. Must mention the analytics provider and hosting provider. **(design call)**
- **No Impressum with a postal address.** Youssef will not publish his private address and will not pay for a service address. **(Youssef)** The site launches without an Impressum. The content model still includes an Impressum page, **hidden by default**, so he can switch it on from the admin if he later gets an address he's willing to show. He was told this carries some legal risk if the site counts as "geschäftsmäßig" under German law. This is not legal advice.

## 6. Content model

All content lives in the Git repository as data files (format is the builder's call: YAML/JSON/Markdown frontmatter, whatever the chosen editor handles best), validated at build time with a schema (zod, as today). Validation must fail the build on: missing translation in either language, malformed dates, end-before-start, unknown section type, image without alt text.

- **Site settings:** name, logo text, page title + meta description (EN/DE, used for Google/LinkedIn previews), social links, email (two halves), location, site URL (one setting — switching to the bought domain later must be a one-line change), palette choice, PDF settings (§8).
- **Fixed sections** (designed pieces with their own content shape, can be reordered/hidden but not turned into another layout):
  - Hero: prompt text, role, subtitle, button labels, JSON card entries (key → list of strings), portrait.
  - Statement: sentence (rich text, §7.5; highlighting a phrase is done with the formatting tools).
  - Stats: up to 4 items, each a label + value, where value is either a number or **computed** — "years since <date>" or "count of items in <section>" — with optional manual override. **(design call: counters calculate themselves so they never go stale)**
  - Journey: title + stops (year label, heading, text, small mono caption, optional "head" marker).
  - Contact: heading line, lead text, button labels.
  - Footer and legal pages.
- **Layout sections** (§5.4): any number; each has id, type, title (EN/DE), "show in menu", "visible", "animations on", "include in PDF" (defaults to `visible`), and its items.
- **Section order:** a single ordered list covering fixed and layout sections. The menu follows it.

Initial content = today's content migrated from `src/content/career.ts` and `src/i18n/{en,de}.ts` (roles, education, skills, about paragraphs, motto/hero text, contact), plus the new statement/stats/journey copy from the prototype (German to be supplied by Youssef; the builder may draft German for his review but must flag it). Projects start empty or with placeholders Youssef fills in through the admin.

The hero motto "Enjoy the ride and live the success." is on the current site but not in the new design; keep it available as an editable field (e.g. in Hero or Contact) and default it to hidden — ask nothing, Youssef can turn it on. **(design call)**

## 7. Admin (`/admin`)

### 7.1 Tool

A ready-made, open-source, **Git-based** editor that commits content to the GitHub repository. **(Youssef chose ready-made over custom; specific product is the builder's call — see §11.)** It must meet all of:

1. Usable on a phone browser as well as a laptop.
2. GitHub login.
3. Structured editing of the content model in §6, including lists of different item types (sections) and reordering by drag.
4. English and German **side by side** (or at minimum both visible on one screen per item), with save blocked or warned when one language is empty.
5. Image upload, replace, delete, and **crop**. If the editor has no crop, add one (custom widget, or upload-time crop step). Cropping on a phone must work.
6. Can commit to a non-default branch (needed for §7.2), or otherwise support a draft/publish workflow.
7. A way to add a "Statistics" link/button (custom link, menu item, or a small page beside the editor).

**Decided: Sveltia CMS** **(Youssef)** (free, open source, Decap-compatible config). It has built-in i18n, mobile support, an editorial workflow, and deploy previews. GitHub login goes through its small auth Worker on Cloudflare. **Fallback: Keystatic.** Image cropping isn't confirmed in any free candidate, so plan for a custom crop step. Verify Sveltia against the checklist above with a short spike before committing; switch to the fallback if it fails a must-have. **(Youssef chose Sveltia from a comparison of free editors.)**

### 7.2 Preview → Publish **(Youssef: exact preview over instant preview)**

- Saving in the admin writes to a **draft branch**, never directly to the live branch.
- Every push to the draft branch triggers a full build (site + PDFs) deployed to a **preview URL** that is identical to production except for its address.
- The preview URL is **protected** so only Youssef can open it (Cloudflare Access or equivalent). **(design call)**
- The admin shows **Open preview** and **Publish**. Publish merges draft → live, which triggers the production deploy. Implementation is the builder's call (e.g. an auto-maintained draft→main pull request whose merge button is the Publish action, reachable from the admin and from GitHub's mobile app).
- A failed preview build must be visible to Youssef (e.g. status shown in the PR/admin, or an email from GitHub) and must block Publish.
  - The repo is public, so protect `main` with a required status check (the draft build). Also, the **production deploy itself** re-runs the build and refuses to deploy on failure, as a second safety net. **(design call)**
- History: every change is a Git commit; undo = revert.
- An optional instant approximate preview pane is acceptable as a bonus but does not replace the above.

### 7.3 What's editable — everything visible

All content in §6, including: section order, visibility, menu inclusion, per-section animation on/off, per-section "include in PDF", palette (from the vetted list only — no free colour picker, so no edit can make the site unreadable **(design call)**), meta title/description, legal pages, footer, PDF settings, portrait and all images.

### 7.4 Security

- `/admin` requires GitHub login with write access to the repo. Additionally putting `/admin` behind Cloudflare Access is encouraged if it doesn't break the editor's OAuth flow. **(builder's call)**
- No secrets in the client bundle or the repo. OAuth client secrets etc. live in the host's secret store.

### 7.5 Text formatting **(Youssef)**

Youssef wants to style text himself: **bold, italic, underline, links, custom colour**, and similar.

- **Which fields (design call):** longer text gets rich formatting:
  - about paragraphs, the statement, and the contact lead
  - descriptions in timeline items, project cards, and journey stops
  - quotes, and the legal pages

  Short structural fields stay plain so the layout stays consistent: names, titles, roles, dates, tags, labels, and button texts.
- **Tools:** bold, italic, underline, strikethrough, links (internal and external, with an option to open in a new tab), bulleted and numbered lists, inline code, and text colour.
- **Colour comes from a fixed swatch set, not a free picker (design call, consistent with §4 and §7.3).** Offer the accent plus a few extra named colours. Each one is defined per palette and per light/dark mode, and each must pass AA contrast on its background. Stored content references the swatch *name* (for example "accent" or "highlight"), not a hex value, so a palette change or dark mode keeps it readable. Underlined non-link text is allowed. Links stay visually distinct from it, for example through the accent colour and hover state.
- Sveltia's rich-text (Markdown) editor covers most of this natively. Underline and colour need custom editor components or a constrained inline-HTML or shortcode syntax. How to add them is the builder's choice, but the output must be sanitised: only the allowed tags, classes, and attributes; no scripts and no inline styles.
- Formatting must render identically on the site, in the preview, and in the PDF (links printed as readable text).
- Scroll animations that split text into words (the statement) must preserve the formatting.

### 7.6 Palette setting

Offer the combinations from `palette-explorer.html` that pass AA in both modes. Default: Whisky on Oat.

## 8. PDF CV

- Generated at **build time** by a headless browser (Playwright + Chromium, free/open source) printing a dedicated **print route** per language (e.g. `/cv/print` and `/de/cv/print`), saved as static files (e.g. `/cv/youssef-ait-lhaj-cv-en.pdf`, `…-de.pdf`). Download buttons link to the file for the current language. **(design call)**
- Looks like the website (Youssef: "make it look like the website"): same fonts, accent, structure (header with name, role, location, **email and LinkedIn only — no phone, no address (Youssef)**; then sections in order), A4, light theme only, no animations, links printed as readable text, no item split across pages.
- **Real text**, not an image (ATS parsing). Fonts embedded.
- Respects visibility and per-section "include in PDF". Admin switch: **include portrait in PDF** (German CVs usually include a photo; international ones often don't). **(design call)**
- Length target: as short as the content allows; no hard page limit.
- Preview builds generate PDFs too, so the PDF is checked before Publish.

## 9. Statistics

- **Umami** (open source, cookieless, no consent banner needed). Umami Cloud's free Hobby plan: 100K events/month, 6 months retention (official FAQ); the number of websites allowed on the free plan is reported inconsistently (1 vs 3) — check, one is enough. **(design call)**
- Track page views (incl. time on site, country/region, referrer, device — Umami defaults) and events: `cv-download` (with language), `email-click`, `linkedin-click`, project link clicks.
- Only production is tracked; previews and local dev are not.
- Admin has a **Statistics** button opening the Umami dashboard in a new tab. **(Youssef)**
- Datenschutzerklärung mentions Umami.

## 10. Hosting, build and deploy

- Code and content: **https://github.com/youssefaitlhaj/DigitalCV** (GitHub user `youssefaitlhaj`). **(Youssef)** The repo is **public**, so:
  - GitHub Actions minutes are unlimited, and branch protection with required status checks is available on the free plan. Use it so Publish (draft → main) can't merge a failing build.
  - Draft content is publicly readable on GitHub before it is published. Accepted, since it's CV content.
  - The email address sits in plain text in the repo's data files, so the on-site split-address obfuscation only protects against scrapers of the site, not of GitHub. Accepted, since it's the address he gives recruiters.
- Admin login and Cloudflare Access allow only GitHub user `youssefaitlhaj` / his account email.
- Host: **Cloudflare Pages** (free), production at `<project>.pages.dev` until the domain is bought; then the domain is attached and the site URL setting changed. **(design call; Youssef agreed to "domain later")**
- Builds run in **GitHub Actions** (because Playwright/Chromium is needed for the PDFs), then deploy to Cloudflare Pages (production for the live branch, preview deployments for the draft branch). The builder may use Cloudflare's own build instead if PDFs can be produced there reliably.
- **Scheduled rebuild** (e.g. weekly) so computed durations and counters stay current without an edit. **(design call)**
- Free-tier budget: GitHub Actions free minutes (unlimited for public repos, 2,000/month for private), Cloudflare Pages/Access free tiers, Umami Hobby. Total running cost: €0 until the domain (~€10–15/year).
- Add `.superpowers/` to `.gitignore` (brainstorming scratch files).

### 10.1 Launch order **(design call)**

Ship site, admin, preview/publish and PDF **together**; no public launch of the redesign before the pipeline works. The first deploy goes to the protected preview; Youssef reviews the content there (German drafts written by the builder are flagged, legal pages included) and the first Publish is his sign-off.

### 10.2 Accounts and setup **(design call; Youssef told)**

Claude can't create accounts or log in for Youssef. The plan includes a short, step-by-step setup guide that he follows once:
- connect the GitHub repo to Cloudflare Pages
- create the OAuth app or auth proxy the editor needs
- set up Cloudflare Access for the preview and `/admin`
- create an Umami account and add the site

All code and configuration are committed to the repo. Youssef already has GitHub. Cloudflare and Umami accounts are free to create. Cloudflare Zero Trust may ask for a payment card at signup even on the free plan. If Youssef declines, protect the preview another way, for example by putting the preview behind the editor's GitHub login or using an unguessable preview URL plus `noindex`. The builder decides.

## 11. Left to the builder

- Which Git-based editor (against §7.1's checklist, verified by spike), and how crop is achieved if not built in.
- Content file format and exact schema shape; how bilingual fields are represented.
- How Publish is implemented (§7.2), and how failed previews are surfaced.
- Component structure, Tailwind usage, how the existing Astro code is refactored vs rewritten.
- Exact Cards-layout visual design (consistent with the prototype's vocabulary).
- Print stylesheet details and PDF file naming.
- Cloudflare Access setup details.
- Testing approach (at minimum: schema validation tests, a build test, a check that every offered palette passes AA, and a reduced-motion pass).

## 12. Existing project notes

- Astro 7, Tailwind 4 (Vite plugin), GSAP already installed; `@fontsource-variable/fraunces`, `@fontsource-variable/inter`, `lenis` to be removed.
- i18n routing (`/` + `/de/`) and the `site` setting in `astro.config.mjs` stay; `site` becomes driven by the site-URL setting.
- Today's type-level guarantee that "a missing German string is a compile error" must survive as a build-time validation error (§6), so a draft with a gap fails its preview and can't be published.
