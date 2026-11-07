# youssefaitlhaj.dev

Personal brand site for Youssef Ait Lhaj. A static Astro build in English (`/`) and German (`/de/`),
with a CV that is also generated as two PDFs, and a browser-based editor at `/admin`.

Design spec: [`docs/superpowers/specs/2026-11-06-redesign-and-admin-design.md`](docs/superpowers/specs/2026-11-06-redesign-and-admin-design.md)

Accounts, deployment and the launch checklist: [`docs/SETUP.md`](docs/SETUP.md)

## Commands

| Command | Action |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Production build to `./dist/` (also generates the PDFs) |
| `npm run test:pdf` | Tests on the generated PDFs (run after a build) |
| `npx playwright test` | End-to-end tests, all viewport projects (slow) |
| `npx astro check` | Type-check `.astro` and `.ts` |

## Structure

- `src/content/data/*.yml`: all content (`site.yml`, `page.yml`, `legal.yml`). Every visible string is `{ en, de }`; both are required.
- `src/lib/`: content loading, validation (zod schemas), derived data, palettes, images, rich-text sanitising. Components do not load or compute.
- `src/components/`: section components (web and print variants), registered in one place.
- `src/pages/`: English and German routes, print routes used for the PDFs.
- `src/scripts/`: motion and small runtime scripts.
- `public/admin/`: the Sveltia CMS configuration and the custom image and crop widgets.
- `scripts/`: build helpers (image crops, PDF generation, admin vendoring).
- `tests/`: unit, PDF and Playwright end-to-end tests.
- `.github/workflows/`: CI, preview deploys, production deploy.

## Testing

`npx playwright test` runs three projects: `desktop`, `narrow` (320px wide) and `reduced-motion`. A few tests
are skipped on purpose depending on the project (`test.skip` conditions in `tests/e2e`): the 320px overflow
check runs only in `narrow`, the motion-on checks are skipped under `reduced-motion`, the reduced-motion
checks run only there, and one motion fixture check runs only in `desktop`. The last full run: 188 passed,
22 skipped, 0 failed.

## Editing content

Use the editor at `/admin` (log in with GitHub). Saving creates a pull request and a protected preview;
Publish merges it and the live site updates in about 5 minutes. See [`docs/SETUP.md`](docs/SETUP.md) for setup.

You can still edit the YAML files in `src/content/data/` by hand. The build validates them and fails with a
clear message on a missing German string or a malformed date, so run `npm test` and `npm run build` before
pushing.

## Deploying

Pull requests build a preview; merging to `main` deploys to Cloudflare Pages via GitHub Actions. A weekly
scheduled rebuild keeps date-driven values (such as the duration of an open-ended role) fresh.
