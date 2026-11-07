# Setup guide and launch checklist

Follow this once, in order. It assumes you are a developer who already has GitHub but has never used Cloudflare, Umami or Sveltia. Everything in the repo is already committed and tested; what remains are accounts and a few copy-and-paste values that only you can create.

Repository: `youssefaitlhaj/DigitalCV`. Never paste a token, secret or password into a file in the repo. Secrets go only into the GitHub or Cloudflare screens named below.

Working on the code on your own machine needs Node.js 24 or newer. Start the dev server with `npm run dev`. If you start Astro directly instead (`npx astro dev --background`), run `npm run predev` once first: it vendors the admin scripts and generates the image crops that `npm run dev` would otherwise prepare. Details are in the README.

## The launch order in one view

The redesign goes live only after you have reviewed it on a protected preview. Merging is your sign-off.

1. Accounts and Cloudflare (steps 1 to 4).
2. Admin login (step 5): the auth worker and the GitHub OAuth app, then two file edits committed on the `redesign` branch.
3. Umami (step 6): two values added to `site.yml` by hand on the `redesign` branch. `/admin` is not live yet, so editing the file is the simplest way.
4. Open the pull request `redesign` into `main` (step 7). Wait for the `ci` check and the preview link, then turn on branch protection for `main`.
5. Review on the protected preview (step 8).
6. Merge the pull request. That merge is the first Publish. Watch the first deploy, then check the live site (step 9).
7. After launch, test the editor on the live site (step 10).
8. Later: your own domain (step 11).

Terms: **Preview** is a protected copy of the site built from a pull request. **Publish** merges a change into `main`, which deploys the live site.

## 1. Cloudflare account

1. Go to https://dash.cloudflare.com/sign-up, sign up with your email, and verify it.
2. Note your **Account ID**: in the dashboard open **Workers & Pages**; it is shown in the right-hand sidebar (and in the URL after `dash.cloudflare.com/`). You need it in step 3.
3. Zero Trust (used in step 4 to protect previews) is free, but Cloudflare may ask for a payment card the first time you open it, even on the free plan. You are not charged on the free plan.
4. If you do not want to enter a card, use a fallback in step 4: skip Access and treat preview links as private (they are unguessable per-deployment URLs). Decide before step 4; nothing else depends on it.

## 2. Cloudflare Pages project (Direct Upload)

The site is built by GitHub Actions and uploaded to Cloudflare. Do not connect the repo to Cloudflare's Git integration.

1. In the dashboard open **Workers & Pages**, **Create application**, the **Pages** tab, then **Upload assets** (Direct Upload).
2. Name the project exactly `youssefaitlhaj` and click **Create project**.
3. On the upload screen upload any small file (for example an empty `index.html`) and click **Deploy site**. This only creates the project; the real site arrives from GitHub Actions.
4. Note the project URL, `https://youssefaitlhaj.pages.dev`. If Cloudflare gave a different subdomain, use that one wherever this guide says `youssefaitlhaj.pages.dev`. It must also match `siteUrl` in `src/content/data/site.yml`; if it differs, change `siteUrl` in the step 6.4 edit.
5. Open **Settings**, **Builds & deployments** (or **Branch control**) and make sure the production branch is `main`.

## 3. API token, GitHub secrets, auto-merge

1. In Cloudflare open **My Profile**, **API Tokens**, **Create Token**, **Create Custom Token**.
2. Name it `github-pages-deploy`. Under **Permissions** choose **Account**, **Cloudflare Pages**, **Edit**. Under **Account Resources** pick your account. Create the token and copy it now; it is shown once.
3. In GitHub open the repo, **Settings**, **Secrets and variables**, **Actions**.
4. On the **Secrets** tab click **New repository secret** twice:
   - `CLOUDFLARE_API_TOKEN` = the token from step 2
   - `CLOUDFLARE_ACCOUNT_ID` = the Account ID from step 1.2
5. On the **Variables** tab click **New repository variable**: `CF_PAGES_PROJECT` = `youssefaitlhaj`.
6. Open **Settings**, **Actions**, **General**: confirm workflows are allowed to run, and that "Workflow permissions" is on the default read setting (the jobs request the extra permissions they need).
7. Open **Settings**, **General**, scroll to **Pull Requests**, and tick **Allow auto-merge**. Publish uses it.

## 4. Cloudflare Access for previews

Every pull request deploys a preview. Lock previews to your email.

1. In the Cloudflare dashboard open **Workers & Pages**, your project `youssefaitlhaj`, **Settings**.
2. Under **General**, **Access policy**, click **Enable access policy** (it applies to preview deployments). Cloudflare creates an Access application; Zero Trust may ask you to choose a team name and the Free plan (and possibly a card, see step 1).
3. Edit the created policy: **Action** Allow, **Include** rule **Emails**, and enter only your own email address. Save.
4. You will test it in step 7, when the first preview exists: a private browser window should show a Cloudflare login that emails you a one-time code, and only your address works.

Do not put the production domain behind Access; only previews.

Fallback without Zero Trust: skip this step. Previews stay on unguessable per-deployment URLs. The site pages do not add a no-index tag for previews (adding one would be a small code change), so do not post a preview link anywhere public.

## 5. Admin login: Sveltia auth worker

`/admin` edits content by committing to GitHub as you. It needs a small Cloudflare Worker to complete GitHub's login.

1. Open https://github.com/sveltia/sveltia-cms-auth and use the **Deploy to Cloudflare Workers** button in its README. Sign in, choose your account, and deploy it with the default name `sveltia-cms-auth`. Note its URL, for example `https://sveltia-cms-auth.<your-subdomain>.workers.dev`. This is `<WORKER_URL>` below.
2. In GitHub open your profile **Settings**, **Developer settings**, **OAuth Apps**, **New OAuth App**:
   - Application name: `youssefaitlhaj admin`
   - Homepage URL: `https://youssefaitlhaj.pages.dev`
   - Authorization callback URL: `<WORKER_URL>/callback`
   - Click **Register application**, then **Generate a new client secret**. Copy the Client ID and the secret.
3. In Cloudflare open **Workers & Pages**, the worker `sveltia-cms-auth`, **Settings**, **Variables and Secrets**, and add:
   - `GITHUB_CLIENT_ID` = the Client ID
   - `GITHUB_CLIENT_SECRET` = the client secret (choose the secret/encrypted type if offered)
   - `ALLOWED_DOMAINS` = the production host only, for example `youssefaitlhaj.pages.dev`
   - Save and deploy.
4. On the `redesign` branch, replace the placeholder `https://sveltia-auth.invalid` with `<WORKER_URL>` in **both** files, then commit and push to `redesign`:
   - `public/admin/config.yml`: `backend.base_url`
   - `public/_headers`: the `connect-src` entry in the `/admin/*` Content-Security-Policy (the origin only, no path)

   The unit tests check the two files agree and reject placeholder hosts, so run `npm test` before pushing.
5. Check: search the repo for `sveltia-auth.invalid` (for example `grep -rn sveltia-auth.invalid public src tests`). It must no longer appear in `public/admin/config.yml` or `public/_headers`, and `npm test` must pass.

`/admin` itself cannot be used until the site is live (step 9); you test it in step 10.

## 6. Umami Cloud (analytics), edited by hand on `redesign`

1. Go to https://cloud.umami.is and sign up (free plan). The free plan keeps 6 months of data.
2. **Websites**, **Add website**: name `youssefaitlhaj`, domain `youssefaitlhaj.pages.dev`. Save.
3. Open the website's **Settings** and copy the **Website ID**. Enable **Share URL** and copy the share link (the public statistics dashboard).
4. On the `redesign` branch edit `src/content/data/site.yml` by hand (simplest, because `/admin` is not live yet; you could also do it later in `/admin`):
   ```yaml
   analytics:
     umamiWebsiteId: <WEBSITE_ID>
     dashboardUrl: <SHARE_URL>
   ```
   If your Pages URL differs from `https://youssefaitlhaj.pages.dev`, also change `siteUrl` in the same edit. Commit and push to `redesign`. Analytics load only on the production deploy, never in previews or dev. The site sets no cookies and shows no cookie banner. Download buttons send a `cv-download` event.

## 7. Open the pull request and protect `main`

1. On GitHub open a pull request from `redesign` into `main`.
2. Wait for the `ci` check to finish (usually 10-20 minutes; the browser tests are the slow part) and for the `preview/deploy` status; its link opens the preview. Failed previews show a failed `preview/deploy` status on the PR.
3. Open the preview link in a private window and confirm the Cloudflare Access login (step 4).
4. Now that the `ci` check exists, protect `main` with a **classic** branch protection rule (not a ruleset): **Settings**, **Branches**, **Add classic branch protection rule**. Branch name pattern: `main`.
   - Tick **Require a pull request before merging**. Untick its sub-option **Require approvals**: you are the only reviewer and cannot approve your own pull request.
   - Tick **Require status checks to pass before merging**, search for and add the check named `ci`. Require only `ci`; do not require `preview`, `preview-failed` or `preview/deploy`, or Publish can stall.
   - Leave **Do not allow bypassing the above settings** **unticked**. This matters: uploading or deleting a file in the `/admin` Media library commits straight to `main` (it does not open a pull request). As the repository owner you may bypass the rule, so those commits go through; with bypassing forbidden they would fail.
   - Save.

   The cost of allowing the bypass: a Media-library commit skips the `ci` check, so the browser (Playwright) tests do not run for it. The production deploy that follows still runs `astro check`, the unit tests, the build and the PDF tests, and a failure there stops the deploy, so a broken image cannot reach the live site. Everything else (every content edit) still goes through a pull request and the full `ci` check.

## 8. Review on the protected preview

Do all of this before merging. Fix anything by editing files on `redesign` and pushing; the preview rebuilds.

- Every entry in `docs/superpowers/notes/german-drafts.md`: find it on the preview and review the German text.
- The privacy policy text, English and German.
- Both CV PDFs (English and German) download and open.
- Accents and umlauts (é, ä, ö, ü, ß) render correctly in both PDFs (for example "Université Hassan II" in both, and "Otto-Friedrich-Universität", "Französisch", "größten" and "Außerdem" in the German CV); no empty boxes or missing letters.
- The site at phone width.
- Overall: nothing shows a phone number or postal address, and the Impressum page is hidden (it is off by default).

## 9. Merge = first Publish, and watch the first deploy

1. Merge the pull request. Merging is your sign-off for the redesign.
2. Open **Actions**, **Deploy**, and watch it, especially the `wrangler pages deploy` step; this is its first real run. A missing secret or variable is named in the log. The weekly scheduled rebuild reuses this same workflow.
3. Check the live site `https://youssefaitlhaj.pages.dev`: both languages, both PDFs, no console errors.
4. Open the Umami dashboard: your visit and a `cv-download` event (click a download button) appear.

## 10. After launch: test the editor on the live site

Open `https://youssefaitlhaj.pages.dev/admin/` and log in with GitHub. Saving an entry opens a pull request and a preview; Publish merges it and the live site updates in about 5 minutes. Tick each item:

- [ ] Login works. If the popup reports a disallowed origin, re-check `ALLOWED_DOMAINS`.
- [ ] Round trip: edit a German job title, save, open the preview link (behind Cloudflare Access), then Publish. The live site shows it within about 5 minutes. The pull request diff changes only that field.
- [ ] Crop the portrait on a phone, Publish, and confirm the cropped image is live. An EXIF-rotated phone photo crops the right way up.
- [ ] Upload a new photo in the Media library first, then choose it in an image field; the build accepts it. Note whether choosing a fresh upload directly in the field commits.
- [ ] Uploading a photo in the Media library works with branch protection on: the upload is committed to `main` without an error (this relies on **Do not allow bypassing the above settings** staying unticked, step 7), and the Deploy run that follows is green.
- [ ] An iPhone HEIC photo chosen in an image field shows "This format isn't supported. Upload a JPG, PNG or WebP ..." instead of saving.
- [ ] Remove an optional image: in a project card's **Image** or a quote's **Photo**, click **Remove image**, save and Publish. The image disappears from the site and the YAML no longer has that field. (Required images such as the portrait have no Remove button; use **Replace image**.)
- [ ] In a rich-text field, `<u>x</u>` and `<span class="c-accent">y</span>` survive saving unchanged, and the coloured word renders in the accent colour. (Colour and underline are written as these snippets.)
- [ ] Reordering sections works on a laptop (drag) and on a phone (Move up / Move down buttons; drag needs a mouse).
- [ ] Saving an entry does not add stray empty fields or `false` values, and the build still passes.
- [ ] The browser console shows no Content-Security-Policy errors in `/admin`.
- [ ] The tag with a bilingual level (formerly "Native/Muttersprache") edits correctly in both languages.
- [ ] Saving with an empty English or German text field is blocked.
- [ ] A deliberately broken preview shows as a failed `preview/deploy` status instead of silently missing.
- [ ] The weekly scheduled rebuild runs green once (it keeps date-driven values such as "years at TestBench" current).

### Maintenance: keep the weekly rebuild alive

GitHub switches off scheduled workflows in a public repository after 60 days without any repository activity (no commits, no Publish). It emails you a warning a few days before. To turn it back on (or to keep it on when you get the warning): open **Actions**, choose **Scheduled rebuild** in the left list, and click **Enable workflow** in the banner. You can also start a rebuild at any time with **Run workflow** on the same page. Any Publish from `/admin` also counts as activity and resets the 60 days.

## 11. Later: your own domain

1. Buy `youssefaitlhaj.com` (Cloudflare Registrar is simplest, or any registrar).
2. In Cloudflare open **Workers & Pages**, your Pages project, **Custom domains**, **Set up a custom domain**, enter the domain and follow the DNS prompts. For a domain registered elsewhere, add it to Cloudflare as a site first and switch the nameservers.
3. In `/admin` change **Site URL** (`siteUrl`) to `https://youssefaitlhaj.com`, preview, Publish.
4. Add the new host to the worker's `ALLOWED_DOMAINS` (comma separated) and update the GitHub OAuth app's homepage URL.
5. Update the website's domain in Umami.
