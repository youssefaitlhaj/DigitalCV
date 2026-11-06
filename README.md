# youssefaitlhaj.dev

Personal brand site for Youssef Ait Lhaj. Static Astro build, English and German,
warm ivory and champagne-gold design with a restrained GSAP motion layer.

Design spec: [`docs/superpowers/specs/2026-07-24-personal-brand-site-design.md`](docs/superpowers/specs/2026-07-24-personal-brand-site-design.md)

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` |
| `npm run preview` | Serve the production build |
| `npx astro check` | Type-check `.astro` and `.ts` |

## Editing content

Content is split by whether it is translatable. Keep that split — it is what
stops the two languages drifting apart.

**`src/content/career.ts`** — locale-neutral facts: employers, ISO dates,
locations, and the stable `id` of every role. Editing a date here changes it in
both languages at once. Validated by zod at build time, so a malformed date or a
role ending before it starts fails the build with a clear message rather than
rendering wrong.

**`src/i18n/en.ts` and `src/i18n/de.ts`** — every translatable string, keyed by
those ids. Both are typed as `Dictionary` (`src/i18n/types.ts`), so **forgetting
a German string is a compile error, not a blank space on the live page**.

Write English first, then German. To add a role:

1. Add an entry to `roles` in `career.ts` with a new `id`
2. Add that `id` to `experience.titles` and `experience.descriptions` in **both**
   `en.ts` and `de.ts`
3. `npx astro check` — it will tell you if you missed one

Company, product, and technology names are never translated. Neither is the hero
motto, which is deliberately English in both locales.

## The portrait

The About section is built to work with or without a photo. Drop a file at
`src/assets/portrait.jpg` (or `.png` / `.webp`) and it becomes a two-column
layout with the image optimised through Astro's pipeline. With no file it falls
back to a wider typographic treatment — that fallback is a real design, not a
placeholder, so shipping without a photo is a legitimate choice.

Use a portrait at 800px wide or better. A soft, upscaled image will look worse
than no image at all.

## Motion

Every animation lives in `src/scripts/motion.ts`. Components never import GSAP —
they mark intent with `data-reveal`, `data-reveal-text`, and `data-magnetic`
attributes, and the motion layer binds behaviour on load. Adding a new animated
section means adding an attribute, not writing new animation code.

Six behaviours exist, deliberately: smooth scroll (Lenis), line-by-line text
unmask, staggered reveals, magnetic hover, nav scroll-spy, and the timeline rail.
Resist adding a seventh without a reason.

`prefers-reduced-motion: reduce` is a first-class path: Lenis is never
instantiated, no ScrollTriggers are created, and no listeners are bound. Verify
any motion change against it via DevTools → Rendering → Emulate CSS media
feature. The site must be complete and navigable with all motion off.

## Before deploying

- Set the real domain in `astro.config.mjs` (`site`). It drives canonical URLs
  and `hreflang` alternates — wrong here means wrong in search results.
- Open-ended role durations ("6 mos") are computed at build time. Rebuild
  periodically or they drift.
