# Setup guide and launch checklist

Follow this once, in order. Everything in the repo is already committed and tested; what remains are a few settings and copy-and-paste values that only you can create, in Vercel, GitHub and Umami.

Repository: `youssefaitlhaj/DigitalCV`. Vercel project: `digital-cv`. Never paste a token, secret or password into a file in the repo. Secrets go only into the GitHub or Vercel screens named below.

Working on the code on your own machine needs Node.js 24 or newer. Start the dev server with `npm run dev`. If you start Astro directly instead (`npx astro dev --background`), run `npm run predev` once first: it vendors the admin scripts and generates the image crops that `npm run dev` would otherwise prepare. Details are in the README.

## How hosting works

**GitHub builds, Vercel hosts.** GitHub Actions install, check, test and build the site (the build needs a headless Chromium for the CV PDFs). The finished site is then uploaded to Vercel with the Vercel CLI as a ready-made build (`vercel deploy --prebuilt`); Vercel never builds the repo itself. `vercel.json` switches off Vercel's own Git builds (`git.deploymentEnabled: false`), which is why the builds Vercel started for `main` until now (and which failed) stop once this change is merged.

- A pull request runs the `ci` check and uploads a **preview** deployment. Its link is posted on the pull request as the `preview/deploy` status, which `/admin` shows next to the entry.
- A merge into `main` (a **Publish**) runs the **Deploy** workflow, which rebuilds, re-tests and uploads to **production**.
- A weekly **Scheduled rebuild** reruns Deploy so date-driven values stay fresh.

Response headers (the strict Content-Security-Policy for `/admin`) live in `public/_headers`; `scripts/vercel-output.ts` turns them into Vercel routes at deploy time.

## The launch order in one view

1. Vercel: IDs, a deploy token, preview protection (step 1).
2. GitHub: one secret, two variables, auto-merge (step 2).
3. Site URL and Umami (step 3).
4. Open (or update) the pull request `vercel-hosting` into `main`, review the preview, merge. The merge is the first production deploy (steps 4 and 5).
5. Protect `main` (step 6).
6. Admin login with a GitHub access token, then test the editor on the live site (steps 7 and 8).
7. Later: your own domain (step 9).

Terms: **Preview** is a protected copy of the site built from a pull request. **Publish** merges a change into `main`, which deploys the live site.

## 1. Vercel

You already have the project `digital-cv`, connected to the repo.

1. **Project ID.** Open the project, **Settings**, **General**. Copy **Project ID** (starts with `prj_`).
2. **Team/Org ID.** For a team: team **Settings**, **General**, copy **Team ID** (starts with `team_`). For a personal Hobby account: **Account Settings**, **General**, copy **Vercel ID**. This is the `VERCEL_ORG_ID` below.
3. **Access token.** **Account Settings**, **Tokens** (https://vercel.com/account/settings/tokens), **Create Token**. Name it `github-actions-deploy`, scope it to the team or account that owns `digital-cv`, pick an expiration (and put a reminder in your calendar a week before it). Copy it now; it is shown once.
4. **Build settings.** Nothing to set: Vercel does not build, so the Framework Preset, build command and Node.js version are not used. Leave **Root Directory** empty (the CLI looks for the upload in `.vercel/output` at the repo root).
5. **Git builds.** Nothing to do: `vercel.json` turns them off once this branch is merged. If the failing builds of `main` bother you before then, **Settings**, **Git**, **Disconnect** is also fine; deploys come from GitHub Actions either way.
6. **Protect previews.** **Settings**, **Deployment Protection**: turn on **Vercel Authentication** with **Standard Protection** (free on Hobby). This protects every preview and every per-deployment URL, so only you (logged in to Vercel) can open them; the production domain stays public. Open preview links in a browser where you are logged in to Vercel, including on your phone.

## 2. GitHub: secret, variables, auto-merge

1. In GitHub open the repo, **Settings**, **Secrets and variables**, **Actions**.
2. **Secrets** tab, **New repository secret**: `VERCEL_TOKEN` = the token from step 1.3.
3. **Variables** tab, **New repository variable**, twice:
   - `VERCEL_ORG_ID` = the Team ID or Vercel ID from step 1.2
   - `VERCEL_PROJECT_ID` = the Project ID from step 1.1
4. **Settings**, **Actions**, **General**: confirm workflows are allowed to run, and that "Workflow permissions" is on the default read setting (the jobs request the extra permissions they need).
5. **Settings**, **General**, **Pull Requests**: tick **Allow auto-merge**. Publish uses it.

Only the single "Deploy" step of each workflow sees the token; install, build and test steps never do. A missing secret or variable is named in that step's log.

## 3. Site URL and Umami

`siteUrl` in `src/content/data/site.yml` still says `https://youssefaitlhaj.pages.dev`, a leftover from the earlier Cloudflare plan. It drives the canonical and language links search engines see, and Umami only counts visits on that host (`data-domains`). Set it to your Vercel **production domain**:

1. In Vercel open the project, **Settings**, **Domains**, and note the production domain, for example `https://digital-cv.vercel.app`. Use this domain, not a long per-deployment URL such as `digital-cv-a1b2c3-….vercel.app` (those are protected and change with every deploy).
2. Umami (https://cloud.umami.is): the website id is already in `site.yml` (`analytics.umamiWebsiteId: ece2ccaf-…`). In the website's **Settings**, set its domain to the production host from step 3.1, enable **Share URL** and copy the share link.
3. Edit `src/content/data/site.yml` by hand on the `vercel-hosting` branch (or later in `/admin`, **Site settings**) and push:
   ```yaml
   siteUrl: https://<your-production-domain>
   analytics:
     umamiWebsiteId: ece2ccaf-3e90-45b5-b402-f2718a07c654
     dashboardUrl: <SHARE_URL>
   ```

Analytics load only on the production deploy, never in previews or dev. The site sets no cookies and shows no cookie banner. Download buttons send a `cv-download` event.

## 4. Pull request and preview review

1. Open a pull request from `vercel-hosting` into `main` (or push again if it is already open, so CI runs with the new secrets).
2. Wait for the `ci` check (usually 10-20 minutes; the browser tests are the slow part) and for the `preview/deploy` status; its link opens the preview. A failed preview shows as a failed `preview/deploy` status.
3. Open the preview link in a private window: Vercel asks you to log in. Then open it where you are logged in and review:
   - Every entry in `docs/superpowers/notes/german-drafts.md`: find it on the preview and review the German text.
   - The privacy policy, English and German. It now names Vercel (Vercel Inc., USA) as the host; it is a plain-language draft, not legal advice.
   - Both CV PDFs (English and German) download and open; accents and umlauts (é, ä, ö, ü, ß) render, for example "Université Hassan II", "Otto-Friedrich-Universität", "Französisch", "größten", "Außerdem".
   - The site at phone width.
   - Nothing shows a phone number or postal address, and the Impressum page is hidden.

## 5. Merge = first production deploy

1. Merge the pull request. This runs **Actions**, **Deploy**: the `build` job, then the `deploy` job, whose "Deploy to Vercel (production)" step is the first real upload.
2. To redeploy at any time: **Actions**, **Deploy**, **Run workflow** on branch `main`. (The weekly **Scheduled rebuild** runs the same workflow.)
3. Check the live site on the production domain: both languages, both PDFs, no console errors, and `/admin/` loads.
4. Open the Umami dashboard: your visit and a `cv-download` event (click a download button) appear.

## 6. Protect `main`

Protect `main` with a **classic** branch protection rule (not a ruleset): **Settings**, **Branches**, **Add classic branch protection rule**. Branch name pattern: `main`.

- Tick **Require a pull request before merging**. Untick its sub-option **Require approvals**: you are the only reviewer and cannot approve your own pull request.
- Tick **Require status checks to pass before merging**, search for and add the check named `ci`. Require only `ci`; do not require `preview`, `preview-failed` or `preview/deploy`, or Publish can stall.
- Leave **Do not allow bypassing the above settings** **unticked**. This matters: uploading or deleting a file in the `/admin` Media library commits straight to `main` (it does not open a pull request). As the repository owner you may bypass the rule, so those commits go through; with bypassing forbidden they would fail.
- Save.

The cost of allowing the bypass: a Media-library commit skips the `ci` check, so the browser (Playwright) tests do not run for it. The production deploy that follows still runs `astro check`, the unit tests, the build and the PDF tests, and a failure there stops the deploy, so a broken image cannot reach the live site. Everything else (every content edit) still goes through a pull request and the full `ci` check.

## 7. Admin login with a GitHub access token

`/admin` edits content by committing to GitHub as you. There is no OAuth app or login server: you sign in with a fine-grained personal access token, once per device and browser.

1. GitHub, your profile **Settings**, **Developer settings**, **Personal access tokens**, **Fine-grained tokens**, **Generate new token** (https://github.com/settings/personal-access-tokens/new).
   - Token name: `cv-admin` (add the device name if you make one per device).
   - Expiration: up to one year. Put a reminder in your calendar.
   - Resource owner: `youssefaitlhaj`. Repository access: **Only select repositories**, `youssefaitlhaj/DigitalCV`.
   - Repository permissions:
     - **Contents**: Read and write (read entries, commit edits and uploads, merge on Publish)
     - **Pull requests**: Read and write (every save is a pull request; Publish merges or auto-merges it)
     - **Commit statuses**: Read-only (shows the `preview/deploy` link and state next to an entry)
     - **Metadata**: Read-only (added automatically)
   - Nothing else. Generate the token and copy it.
2. Open `https://<your-production-domain>/admin/`, click **Sign In Using Access Token**, paste the token, **Sign In**. It is the only sign-in option (`auth_methods: [token]` in `public/admin/config.yml`).
3. Repeat step 2 on each device (laptop, phone). The token stays in that browser's storage until you sign out; sign out on any device that is not yours.
4. When the token expires (or if a device is lost): revoke it on the same GitHub page, generate a new one with the same settings, and sign in again on each device.

## 8. After launch: test the editor on the live site

Saving an entry opens a pull request and a preview; Publish merges it and the live site updates in about 5 minutes. Tick each item:

- [ ] Sign-in with the access token works on the laptop and on the phone.
- [ ] Round trip: edit a German job title, save, open the preview link (behind Vercel Authentication), then Publish. The live site shows it within about 5 minutes. The pull request diff changes only that field.
- [ ] Crop the portrait on a phone, Publish, and confirm the cropped image is live. An EXIF-rotated phone photo crops the right way up.
- [ ] Upload a new photo in the Media library first, then choose it in an image field; the build accepts it. Note whether choosing a fresh upload directly in the field commits.
- [ ] Uploading a photo in the Media library works with branch protection on: the upload is committed to `main` without an error (this relies on **Do not allow bypassing the above settings** staying unticked, step 6), and the Deploy run that follows is green.
- [ ] An iPhone HEIC photo chosen in an image field shows "This format isn't supported. Upload a JPG, PNG or WebP ..." instead of saving.
- [ ] Remove an optional image: in a project card's **Image** or a quote's **Photo**, click **Remove image**, save and Publish. The image disappears from the site and the YAML no longer has that field. (Required images such as the portrait have no Remove button; use **Replace image**.)
- [ ] In a rich-text field, `<u>x</u>` and `<span class="c-accent">y</span>` survive saving unchanged, and the coloured word renders in the accent colour. (Colour and underline are written as these snippets.)
- [ ] Reordering sections works on a laptop (drag) and on a phone (Move up / Move down buttons; drag needs a mouse).
- [ ] Saving an entry does not add stray empty fields or `false` values, and the build still passes.
- [ ] The browser console shows no Content-Security-Policy errors in `/admin` on the production domain, and the response for `/admin/` carries the `Content-Security-Policy` header (browser dev tools, **Network**).
- [ ] The tag with a bilingual level (formerly "Native/Muttersprache") edits correctly in both languages.
- [ ] Saving with an empty English or German text field is blocked.
- [ ] A deliberately broken preview shows as a failed `preview/deploy` status instead of silently missing.
- [ ] The weekly scheduled rebuild runs green once (it keeps date-driven values such as "years at TestBench" current).

### Maintenance: keep the weekly rebuild alive

GitHub switches off scheduled workflows in a public repository after 60 days without any repository activity (no commits, no Publish). It emails you a warning a few days before. To turn it back on (or to keep it on when you get the warning): open **Actions**, choose **Scheduled rebuild** in the left list, and click **Enable workflow** in the banner. You can also start a rebuild at any time with **Run workflow** on the same page. Any Publish from `/admin` also counts as activity and resets the 60 days.

### Maintenance: tokens

Two tokens expire: the Vercel token in the `VERCEL_TOKEN` secret (deploys fail with an authentication error in the "Deploy to Vercel" step; create a new one as in step 1.3 and replace the secret) and your GitHub access token for `/admin` (step 7.4).

## 9. Later: your own domain

1. Buy the domain (for example `youssefaitlhaj.com`) at any registrar.
2. In Vercel open the project, **Settings**, **Domains**, **Add**, enter the domain and follow the DNS instructions shown.
3. In `/admin` change **Site URL** (`siteUrl`) to `https://<the-domain>`, preview, Publish.
4. Update the website's domain in Umami.
