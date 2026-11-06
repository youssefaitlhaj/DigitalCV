# Personal Brand Site — Design Spec

Date: 2026-07-24
Owner: Youssef Ait Lhaj

## Context

A personal website presenting Youssef's career. Not a job-hunt landing page and not a PDF CV replacement — a **personal brand page**: the link that goes in bios, email signatures, and introductions. It must feel elegant and premium, be fully responsive, and use restrained, high-quality motion.

Content was sourced once from `linkedin.com/in/youssefaitlhaj` via the logged-in browser session and now lives in this repo as typed data. LinkedIn is not a runtime dependency.

## Decisions

| Area | Decision |
|---|---|
| Purpose | Personal brand page |
| Aesthetic | Warm ivory + champagne gold, "quiet luxury" |
| Motion | Refined & restrained — no pinned/scrubbed scroll, no WebGL |
| Structure | Single long scroll page, per locale |
| Stack | Astro 7 (static) + GSAP/ScrollTrigger + Lenis + Tailwind 4 |
| Languages | English (default), German |
| Hero line | "Enjoy the ride and live the success." — author's own words, verbatim |
| Portrait | LinkedIn profile photo |
| Contact | Email shown, assembled in JS to defeat naive scrapers |

## Source data (verified 2026-07-24)

**Identity** — Youssef Ait Lhaj · Software Developer at imbus · Bamberg, Bavaria, Germany · youssefaitlhaj01@gmail.com · linkedin.com/in/youssefaitlhaj

**Experience**

| Role | Employer | Location | Period |
|---|---|---|---|
| Software Developer (full-time) | imbus | Bavaria, Germany | Feb 2026 – present |
| Software Developer (part-time) | imbus | Bavaria, Germany | Aug 2019 – Jan 2026 |
| Web Developer | AESVT Maroc | Casablanca-Settat, Morocco | Mar – Jun 2017 |
| Software Developer | Compagnie d'Assurance Transport (CAT) | Casablanca-Settat, Morocco | Jun – Sep 2016 |
| Software Developer | NT SOFT | Casablanca-Settat, Morocco | Mar – May 2015 |

**Education** — B.Sc. Informatik: Software Systems Science, Otto-Friedrich-Universität Bamberg, 2020–2025

**Skills (10)**
- Craft: Software development, Web development, SQL, Java, C#, .NET Framework
- Languages: German, English, French, Arabic

**Known gap:** the LinkedIn profile carries no About summary and no per-role descriptions. All narrative copy on this site is newly written and must be approved by Youssef before it ships. Nothing about specific projects, technologies per role, or achievements may be invented — where a detail is not known, the copy stays at the level of role, employer, and duration.

## Design system

Tokens live in `src/styles/tokens.css` as CSS custom properties, exposed to Tailwind via `@theme`. No component hardcodes a colour.

```
--bg          #FBF9F5   ivory canvas
--surface     #F3EDE3   sand, raised cards
--surface-alt #EFE8DC   deeper sand, alternating bands
--accent      #C9A227   champagne gold
--accent-soft #E4D7A8   gold at low intensity, rules and glows
--ink         #1C1A17   charcoal, body text
--ink-muted   #6B6459   secondary text
--hairline    #E2DACD   1px dividers
```

Gold is a **seasoning, not a surface** — under 5% of painted pixels. It appears on the active nav indicator, section eyebrow numerals, the hairline under hovered links, timeline node fills, and the primary CTA border. Never a large fill, never a gradient background.

**Type**

Display: **Fraunces Variable**. Body: **Inter Variable**. Both self-hosted via Fontsource — no third-party font request.

Subsets must include **Latin Extended** to cover `ä ö ü ß`; a basic-Latin subset would break German. Fluid scale via `clamp()`; hero name clamps 3rem → 8rem.

**Spacing** — 8px base. Prose column 68ch, page shell 1200px. Section separation `clamp(6rem, 12vw, 11rem)`. Whitespace does most of the premium work.

## Motion

One file, `src/scripts/motion.ts`, owns every animation. Components never import GSAP; they declare intent with `data-reveal`, `data-reveal-text`, `data-magnetic` attributes and the motion layer binds behaviour on load. The entire motion vocabulary is therefore readable in one place.

```
--ease-out-expo   cubic-bezier(0.16, 1, 0.3, 1)     enters
--ease-in-out     cubic-bezier(0.65, 0, 0.35, 1)    transforms
--dur-fast        240ms    hovers
--dur-base        640ms    reveals
--dur-slow        1100ms   hero sequence
stagger            60ms
```

Six behaviours, and nothing beyond them:

1. **Smooth scroll** — Lenis, `lerp: 0.09`, driven by GSAP's ticker so ScrollTrigger stays accurate.
2. **Text unmask** — headings split into rendered lines; each rises from behind an `overflow:hidden` clip, 60ms stagger. Splitting operates on laid-out lines, so it is direction-agnostic and works under RTL.
3. **Staggered reveal** — cards and list items fade and rise 24px on entering the viewport, `once: true`.
4. **Magnetic hover** — CTAs and social links translate up to 8px toward the cursor, spring back on leave. `pointer: fine` only.
5. **Nav scroll-spy** — floating pill nav, gold indicator animated between items with FLIP.
6. **Section numerals** — `01 / 02 / 03` count into place as each section enters.

**Reduced motion is a first-class path, not a fallback.** Under `prefers-reduced-motion: reduce`: Lenis is never instantiated, every reveal becomes an instant opacity set, magnetic hover is not bound. The site must be complete and navigable with all motion off, and this is verified explicitly.

## Internationalisation

Two locales: `en` (default, at `/`) and `de` (at `/de/`) — Astro i18n routing with `prefixDefaultLocale: false`.

**Content is split by whether it is translatable.**

- `src/content/career.ts` — locale-neutral facts: employer names, ISO dates, locations, stable ids. One source of truth for chronology; changing a date changes it in both languages.
- `src/i18n/{en,de}.ts` — every translatable string, keyed by the ids in `career.ts`. Both satisfy the same `Dictionary` type, so a missing key is a **compile error**, not a blank on the page.

Company names, the hero line, and technology names are not translated.

Layout is written with **CSS logical properties** (`margin-inline-start`, `padding-inline`, `inset-inline-start`) rather than `left`/`right`. Both locales are LTR so this changes nothing visually today; it costs nothing and means adding an RTL language later is a data change, not a restyle.

**SEO** — `hreflang` alternates for both locales plus `x-default`; `lang` set correctly per locale.

## Architecture

```
src/
  content/
    career.ts         locale-neutral facts: roles, education, skill ids, dates
    schema.ts         zod schemas; parsed at build time
  i18n/
    types.ts          Dictionary type — the contract every locale must satisfy
    locales.ts        locale registry, path + dir helpers
    en.ts de.ts
    index.ts          dictionary lookup
  components/
    Nav.astro  Hero.astro  About.astro
    Experience.astro  TimelineEntry.astro
    Skills.astro  Education.astro  Contact.astro  Footer.astro
    ui/SectionHeading.astro    eyebrow numeral + display heading
    ui/MagneticLink.astro
    ui/LocaleSwitcher.astro
  scripts/
    motion.ts         the whole animation layer
    lenis.ts          smooth scroll + GSAP ticker sync
    email.ts          obfuscated address assembly
  styles/
    tokens.css  global.css
  layouts/
    Base.astro        html lang/dir, fonts, meta, hreflang
  pages/
    index.astro       en
    de/index.astro    de
```

**Boundaries.** Content knows nothing about presentation. Components know nothing about GSAP — they emit semantic HTML plus `data-*` hints. `motion.ts` knows nothing about specific sections — it binds behaviour to attributes. Each of the three can change without touching the others.

**Validation.** `schema.ts` parses `career.ts` at build time, so a malformed date or missing employer fails the build with a clear message rather than rendering blank. The `Dictionary` type does the same job for translations.

## Page structure

| # | Section | Motion |
|---|---|---|
| — | Nav (floating pill, scroll-spy, locale switcher) | Appears after hero; FLIP indicator |
| 01 | Hero — name, "Enjoy the ride and live the success.", CTA | Staged line unmask, ~1.1s |
| 02 | About — narrative + portrait | Text unmask, portrait clip-reveal |
| 03 | Experience — vertical timeline | Gold rule draws down; nodes pop; entries stagger |
| 04 | Skills — craft and languages, grouped | Chips stagger, 40ms |
| 05 | Education | Reveal |
| 06 | Contact — obfuscated email, LinkedIn | Magnetic links |
| — | Footer | — |

The Experience timeline is the centrepiece and carries the career story: Casablanca → Bamberg, seven years at imbus.

## Build phases

1. **Content** — locale-neutral facts committed; English copy drafted and **approved by Youssef**; then translated to German. Translation happens once, after English is final.
2. **Design system** — tokens, fonts (Latin Extended subset), `SectionHeading`, `Base.astro`. Verified before any section is built.
3. **Static sections** — all sections, real content, fully responsive, **zero animation**. Hard checkpoint: the site must look finished standing still. If it needs motion to look good, the design is wrong.
4. **i18n** — both locales routed, locale switcher, hreflang. German text runs ~30% longer than English, so every section must be checked for wrapping and overflow in German, not just English.
5. **Motion** — Lenis, then each behaviour in the order listed, verified one at a time. Hero sequence last.
6. **Polish & ship** — reduced-motion pass, responsive pass, Lighthouse, OG image, `Person` JSON-LD, deploy.

## Verification

- `npm run build` succeeds; zod rejects malformed career data; a missing translation key fails type-check
- Manual pass at 375 / 768 / 1280 / 1920 px — no horizontal scroll, no clipped text — **in German as well as English**, since German compounds are the worst case for the narrow breakpoints
- DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → all content visible, no motion, fully navigable
- Keyboard-only pass: every link reachable, focus ring visible against ivory at sufficient contrast
- Contrast: `--ink-muted` on `--surface` clears 4.5:1
- Lighthouse on the production build — targets 100 a11y, 95+ performance, LCP < 1.5s

## Revision — 2026-07-25

Youssef supplied a portrait and corrected the content. Changes:

- **Portrait in the hero, not About.** Cropped from a supplied photo (a second person was in frame). Sits beside the name on desktop via grid areas; stacks name → motto → photo → CTA on phones. About is now purely typographic — repeating the face there would halve its impact.
- **Scroll hint removed.** It was decorative and read as an instruction; `hero.scrollHint` is gone from the `Dictionary`, so neither locale can reintroduce it silently.
- **The three Moroccan roles were internships**, with real detail: a WordPress rebuild plus public voting for AESVT; a desktop-to-web insurance migration in C#/MS SQL at CAT; a store management application in C#/MS SQL at NT SOFT. `roleSchema` gained an `employment` enum (`full-time` / `part-time` / `internship`) rendered as a badge — without it the timeline read as five equivalent jobs.
- **Skills recategorised** into five groups: Languages & Frameworks, Databases, Tools & Collaboration, Practice, and spoken Languages. `skillItemSchema` replaced bare strings so items can carry an optional `level`.
- **Spoken languages carry proficiency** — Arabic native, German/French/English C1. `level.native` is translated; bare "C1" is not.
- **Two earlier qualifications added** — Université Hassan II (2015–2016) and OFPPT (2013–2015). The About narrative was rewritten around them; the Bamberg degree is now correctly described as a second bachelor's.

## Status

Verified on the production build: `astro check` clean (0 errors), Lighthouse desktop `/` **100 / 100 / 100 / 100** (LCP 0.4s, CLS 0), mobile `/de/` **99 / 100** (LCP 2.0s, CLS 0). No horizontal overflow at 375 / 1440 in either language. Reduced-motion path confirmed — no `js-motion` class, zero hidden elements, no Lenis, email still hydrates.

Mobile LCP rose from 1.7s to 2.0s when the portrait became the LCP element. It is served as a `fetchpriority="high"` eager WebP at 21–49kB.

## Open items

- **Portrait resolution** — the source crop is 463×740, so it is displayed at 22rem (352px) rather than larger. It is slightly soft on a 2× display. A higher-resolution original would allow a bolder treatment.
- **Internship durations** — LinkedIn's dates give 4 / 4 / 3 months; Youssef says all three were 3 months. The LinkedIn dates are still in `career.ts`. Worth reconciling.
- **`skill.developer-tooling`** — rendered "Building tools that simplify IT work", my phrasing of "creating useful skills that make IT life easier". Needs his sign-off.
- **MS SQL Server** in the Databases group is inferred from the internship descriptions, not from his stated skill list.
- **Domain** — `astro.config.mjs` has a placeholder `site`. Must be set before deploy; it drives canonical URLs and hreflang.
- Not under version control — no `git init` has been run.
