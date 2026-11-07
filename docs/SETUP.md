# Setup guide and launch checklist

Follow this once, in order. It assumes you are a developer who already has GitHub but has never used Cloudflare, Umami or Sveltia. Everything in the repo is already committed and tested; what remains are accounts and a few copy-and-paste values that only you can create.

Repository: `youssefaitlhaj/DigitalCV`. Never paste a token, secret or password into a file in the repo. Secrets go only into the GitHub or Cloudflare screens named below.

Terms used here:

- **Preview**: a protected copy of the site built from an edit you have not published yet.
- **Publish**: the button in `/admin` that merges your edit into `main`, which deploys the live site.
- **Placeholders** such as `<your-worker>` are for you to replace with your real value.

## 1. Cloudflare account

1. Go to https://dash.cloudflare.com/sign-up and sign up with your email. Verify the email.
2. Note your **Account ID**: in the dashboard, open **Workers & Pages**; the Account ID is shown in the right-hand sidebar (or in the URL after `dash.cloudflare.com/`). You need it in step 3.
3. Zero Trust (used in step 5 to protect previews) is free, but Cloudflare may ask for a payment card when you first open it, even on the free plan. You are not charged on the free plan.
4. If you do not want to enter a card, use a fallback instead of Cloudflare Access (step 5 explains how): keep preview links private (they are unguessable per-deployment URLs), or rely on GitHub login for the editor. Decide before step 5; the rest of the guide does not depend on it.

## 2. Cloudflare Pages project (Direct Upload)

The site is built by GitHub Actions and uploaded to Cloudflare. Do not connect the repo to Cloudflare's Git integration.

1. In the dashboard open **Workers & Pages**, then **Create application**, then the **Pages** tab, then **Upload assets** (Direct Upload).
2. Name the project exactly `youssefaitlhaj`. Click **Create project**.
3. On the upload screen, upload any small file (for example an empty `index.html`) and click **Deploy site**. This only creates the project; the real site arrives from GitHub Actions.
4. Open the project and note the URL, `https://youssefaitlhaj.pages.dev`. If Cloudflare gave a different subdomain, note that one instead. It must match `siteUrl` in `src/content/data/site.yml` (change it via `/admin` later if it differs).
5. Open **Settings**, then **Builds & deployments** (or **Branch control**). Make sure the production branch is `main`.

## 3. API token and GitHub secrets

1. In Cloudflare open **My Profile**, then **API Tokens**, then **Create Token**, then **Create Custom Token**.
2. Name it `github-pages-deploy`. Under **Permissions** choose **Account**, **Cloudflare Pages**, **Edit**. Under **Account Resources** pick your account. Create the token and **copy it now**; it is shown once.
3. In GitHub open the repo, **Settings**, **Secrets and variables**, **Actions**.
4. On the **Secrets** tab click **New repository secret** twice:
   - `CLOUDFLARE_API_TOKEN` = the token from step 2
   - `CLOUDFLARE_ACCOUNT_ID` = the Account ID from step 1.2
5. On the **Variables** tab click **New repository variable**: `CF_PAGES_PROJECT` = `youssefaitlhaj`.
6. Open **Settings**, **Actions**, **General**: confirm workflows are allowed to run, and that "Workflow permissions" is on the default read setting (the jobs request the extra permissions they need).
7. Open **Settings**, **General**, scroll to **Pull Requests**, and tick **Allow auto-merge**. Publish uses it.

## 4. Branch protection on `main`

1. GitHub repo, **Settings**, **Branches**, **Add branch ruleset** (or **Add classic branch protection rule**) for the branch `main`.
2. Tick **Require a pull request before merging**, and **Require status checks to pass before merging**.
3. Add the status check named `ci` (it appears in the search box once CI has run once on any PR; open a throwaway PR first if it is not listed). Require **only** `ci`. Do not require `preview`, `preview-failed` or `preview/deploy`, otherwise Publish can stall.
4. Save. From now on nothing reaches `main` unless CI passes.
5. Merge the `redesign` branch into `main` through a pull request when you are ready to go live (see the launch checklist). The first run of the deploy workflow is also the first real run of `wrangler pages deploy`; open **Actions** and watch it. If a step fails, the log names the missing secret or variable.

## 5. Cloudflare Access for previews

Every pull request deploys a preview. Lock previews to your email.

1. In the Cloudflare dashboard open **Workers & Pages**, your project `youssefaitlhaj`, **Settings**.
2. Find **General**, **Access policy**, and click **Enable access policy** (it applies to preview deployments). Cloudflare creates an Access application for you; Zero Trust may ask you to choose a team name and a plan (choose Free) and possibly a card (see step 1).
3. Edit the policy that was created: **Action** Allow, **Include** rule **Emails**, and enter only your own email address. Save.
4. Test: open a preview URL in a private window. You should get a Cloudflare login that emails you a one-time code, and only your address works.

Do not put the production domain behind Access; only the previews.

Fallback if you decline Cloudflare Zero Trust: skip this step. Previews stay on unguessable per-deployment URLs (the site pages do not add a no-index tag for previews, so adding one would be a small code change if you want it). Treat the preview link as private: do not post it anywhere public.

## 6. Sveltia auth worker (GitHub login for `/admin`)

`/admin` edits content by committing to GitHub as you. It needs a small Cloudflare Worker to complete GitHub's login.

1. Open https://github.com/sveltia/sveltia-cms-auth and use the **Deploy to Cloudflare Workers** button in its README. Sign in, choose your account, and deploy. Name the worker something like `sveltia-auth`. Note its URL, for example `https://sveltia-auth.<your-subdomain>.workers.dev`. This is `<WORKER_URL>`.
2. In GitHub open your profile **Settings**, **Developer settings**, **OAuth Apps**, **New OAuth App**:
   - Application name: `youssefaitlhaj admin`
   - Homepage URL: your site URL from step 2
   - Authorization callback URL: `<WORKER_URL>/callback`
   - Click **Register application**, then **Generate a new client secret**. Copy the Client ID and the secret.
3. In Cloudflare open **Workers & Pages**, your worker, **Settings**, **Variables and Secrets**, and add:
   - `GITHUB_CLIENT_ID` = the Client ID (secret or plain text is fine)
   - `GITHUB_CLIENT_SECRET` = the client secret (type: **Secret**)
   - `ALLOWED_DOMAINS` = your site's hostname only, for example `youssefaitlhaj.pages.dev` (add your own domain later too, comma separated, once you buy it in step 8)
   - Save and deploy.
4. Put the worker address into the repo, in **two files**, through a pull request (do not commit to `main` directly). Replace the placeholder `https://sveltia-auth.invalid` with `<WORKER_URL>`:
   - `public/admin/config.yml`: `backend.base_url`
   - `public/_headers`: the `connect-src` entry in the `/admin/*` Content-Security-Policy (the same origin, no trailing path)

   A unit test checks that the two stay in sync, and another rejects obvious placeholder hosts, so `npm test` fails if one is missed. Open the PR, wait for `ci` and the preview, then merge it.
5. Test: open `<site>/admin/`, click **Login with GitHub**, authorise the OAuth app. You should land in the editor. If the popup says the origin is not allowed, re-check `ALLOWED_DOMAINS`.

What to know about the editor:

- **Publish** works through a pull request: saving an entry opens a PR and a preview; Publish merges it and the live site updates in about 5 minutes.
- The preview link appears from the `preview/deploy` status on the PR (look under the PR's checks in GitHub). It sits behind Cloudflare Access.
- On a phone, section order uses the **Move up / Move down** buttons; drag works only with a mouse.
- A new image: first upload it in the **Media library**, then choose it in the image field. Crop it with the crop button; crop works on a phone.
- In rich text, colour and underline are written as snippets: `<span class="c-accent">word</span>` and `<u>word</u>`. Colour names are the palette swatches (for example `c-accent`).
- English and German are both required for every text field. An incomplete entry cannot be saved.

## 7. Umami Cloud (privacy-friendly analytics)

1. Go to https://cloud.umami.is and sign up (free plan). The free plan keeps 6 months of data.
2. **Websites**, **Add website**: name `youssefaitlhaj`, domain `youssefaitlhaj.pages.dev` (use the final domain after step 8, or edit it then). Save.
3. Open the website's **Settings**. Copy the **Website ID**.
4. Still in Settings, enable **Share URL**, and copy the share link. This is the public statistics dashboard link.
5. In `/admin`, open **Site settings**, **Analytics**, and paste the Website ID and the share URL. Save, preview, Publish. Analytics load only on the live site, never in previews or dev. The site sets no cookies and shows no cookie banner.
6. The site sends a `cv-download` event whenever someone clicks a CV download button.

## 8. Later: your own domain

1. Buy `youssefaitlhaj.com` from a registrar (Cloudflare Registrar is the simplest, or any registrar).
2. In Cloudflare open **Workers & Pages**, your Pages project, **Custom domains**, **Set up a custom domain**, enter `youssefaitlhaj.com`, and follow the DNS prompts. If the domain is registered elsewhere, add it to Cloudflare as a site first and switch the nameservers.
3. In `/admin` change **Site URL** (`siteUrl`) to `https://youssefaitlhaj.com`, preview, Publish.
4. Add the new hostname to the worker's `ALLOWED_DOMAINS` (step 6.3) and the GitHub OAuth app's homepage URL.
5. In Umami, update the website's domain.

## Launch checklist

Do these on the preview first (the `redesign` branch pull request), then go live.

Accounts and pipeline
- [ ] Steps 1 to 6 are finished; CI shows a green `ci` check on the `redesign` pull request.
- [ ] The first live run of the deploy workflow succeeds. Watch **Actions**, Deploy, particularly the `wrangler pages deploy` step.
- [ ] `https://sveltia-auth.invalid` no longer appears in `public/admin/config.yml` or `public/_headers`.

End-to-end flow
- [ ] Edit something in `/admin` (for example a German job title) and save. A PR and a `preview/deploy` status appear.
- [ ] The preview link opens behind Cloudflare Access (login by email code), and shows your edit.
- [ ] Click Publish. The live site shows the edit within about 5 minutes.
- [ ] Failed previews show a visible error status on the PR instead of silently missing.

Editor checks (do once, they are the things only a real browser can confirm)
- [ ] Reordering sections works on a laptop (drag) and a phone (Move up / Move down).
- [ ] Crop the portrait on a phone, publish, and confirm the cropped image is live. An EXIF-rotated phone photo crops the right way up.
- [ ] Upload a new photo in the Media library, choose it in an image field, and confirm the build accepts it. Note whether choosing a fresh upload directly in the field commits.
- [ ] In a rich-text field, `<u>x</u>` and `<span class="c-accent">y</span>` survive saving unchanged, and the coloured word renders in the accent colour.
- [ ] Saving an entry changes only the fields you touched (no stray empty fields or `false` values in the diff), and the build still passes. With the editor in "Work with Local Repository" mode, `git diff` after one edit shows only that field.
- [ ] The browser console shows no Content-Security-Policy errors in `/admin`.
- [ ] The tag with a bilingual level (the language entry formerly "Native/Muttersprache") edits correctly in both languages.

Site checks
- [ ] Both CV PDFs (English and German) download and open.
- [ ] The Umami dashboard shows your visit and the `cv-download` event.
- [ ] The Impressum page is hidden (it is off by default). The site contains no phone number and no postal address.

Content review (your sign-off)
- [ ] Open every entry in `docs/superpowers/notes/german-drafts.md` in the preview and review the German text. Fix anything in `/admin`. All of it must be reviewed before the first Publish.
- [ ] Review the privacy policy text in the legal pages, in English and German.
- [ ] Publish. That first Publish is your approval for the redesigned site.

Housekeeping
- [ ] The site rebuilds itself every Monday (a scheduled workflow) so dates such as "years at TestBench" stay current. Check once that the scheduled run is green.
