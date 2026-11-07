# Sveltia CMS spike (Task 14): findings and decisions

Date: 2026-11-07. Branch: `redesign`. No product code was written.

## Method and limits (controller ruling R8)

The hands-on "Work with Local Repository" test was not possible, because a subagent cannot click the browser's native directory picker. Instead:

- The current docs (`https://sveltiacms.app/en/docs/*.md`, `https://sveltiacms.app/llms.txt`) were read.
- The published npm package was downloaded and grepped.
- Nothing was written to GitHub.

Every answer carries one evidence level:

- **Verified in source**: found in the published `@sveltia/cms@0.261.0` bundle (`dist/sveltia-cms.js`).
- **Documented**: stated in the official docs only.
- **Unverified**: neither of the above.

Nothing in this spike was exercised in a running UI. "Verified in source" means the code path exists, not that it was clicked through. Task 15 and the Task 17 smoke test must confirm the points marked below.

## Version

- Package: `@sveltia/cms`, **0.261.0**, MIT licence.
- Published 2026-11-06T02:38:22Z (`npm view @sveltia/cms time`).
- Previous releases: 0.260.0 on 2026-11-05, 0.259.0 on 2026-11-05. The project releases almost daily, so pin the exact version.

## Verdict against spec §7.1

**No §7.1 must-have fails on the evidence available; the Keystatic fallback is not triggered.** These points need confirmation in Task 15/17:

- phone crop with the custom widget (including `pickFile`/`addFile` on a phone);
- the raw inline HTML round trip in the markdown widget;
- image replace and delete;
- the auto-merge/required-check Publish behaviour.

Two known caveats:

- There is no drag on touch screens; the phone uses Move Up/Move Down buttons.
- There is no built-in crop, so the crop widget is custom work (decision A below).

## Answers

### 1. Editing structure

1a. **A `list` with `types` (variable types) can edit `page.yml` `sections`.** Verified in source and documented (`/en/docs/fields/list`).
- Each item gets a type selector plus that type's subfield editors.
- The output is an array of objects carrying a `typeKey` property (default `type`), which matches the `type` discriminator.
- Use `typeKey: type`, `summary` templates per type, and `collapsed: true`.

1b. **Reorder by drag.** Documented.
- Laptop: a drag handle in the item header; Up/Down/Home/End on the focused handle; Move to Top/Bottom/Move to… for lists of 3 or more items.
- **Phone: "The handle is not shown on a touch screen, because drag and drop requires a mouse."** Move Up and Move Down buttons are shown instead, plus Move to… in the item menu.
- Reordering on a phone therefore works, but by buttons and not by drag. The spec asks for drag; this is accepted as meeting the intent. Flag it to Youssef.

1c. **Nested `object` with `en`/`de` subfields.** Documented.
- Both languages show inside one object group on one screen, one under the other, so they are adjacent.
- CMS `i18n` is not used, as planned.
- Mark `required: true` on both subfields.
- Under the editorial workflow, drafts can be saved incomplete (`allow_incomplete_drafts` defaults to `true`), but required fields must be filled before Publish. Recommended: `publish_mode: { type: preview, allow_incomplete_drafts: false }` (the key is documented on the workflow pages and present in the 0.261.0 and 0.252.0 bundles), so a missing EN/DE string cannot even be saved as a draft (spec §7.1 #4). To be confirmed in Task 15.
- Task 3's schema validation in CI remains the second safety net.

### 2. Editorial / preview workflow

2a. **One branch and one PR per entry.** Documented.
- Branch name is `cms/<collection>/<slug>`.
- Saving creates the branch and opens the PR; the next save adds a commit.
- For a file collection, the slug is the file key (`site`, `page`, `legal`), so there are at most 3 concurrent branches.
- The label is `sveltia-cms/draft`, and PRs are kept as GitHub draft PRs until published.
- The `publish_mode` values `editorial_workflow` and `preview` are both in the config schema (verified in source).
- **`publish_mode: preview` is a one-stage editorial workflow with a "Draft" badge and an immediate Publish button.** It needs no review stages, so it fits this single-editor site better than `editorial_workflow`.
- Both use the same PR mechanics.

2b. **"View Preview" link from the PR head.** Verified in source and documented.
- The UI strings `deploy_preview.view`, `building`, `failed` and `checking` exist.
- On GitHub the CMS reads three things for the PR head commit: Deployments, commit statuses (`/commits/<sha>/status`) and check runs (`checkRuns`).
- A URL is taken only from a finished build. Failed or still-building states show as badges on the Drafts board.
- A preview behind access control (Cloudflare Access) is fine: the liveness check is skipped for cross-origin previews.

2c. **Status context name.**
- It is set with `backend.preview_context` (verified in source). Matching is exact first, then partial and case-insensitive. If nothing matches, no link is shown.
- Without it, any status or check whose name contains a known provider, "deploy", "preview" or "pages" is recognised.
- Our design builds in GitHub Actions and deploys to Cloudflare Pages with wrangler, so no Cloudflare Git integration will report anything. **The Task 17 workflow must therefore post the preview itself.**
  - Post a commit status on the PR head SHA with context **`preview/deploy`**, `state` success, and `target_url` set to the Cloudflare preview URL.
  - Give the job `permissions: statuses: write`.
  - Post `pending` first and `failure` on a failed build, so the badges work.
  - Config: `backend.preview_context: preview/deploy`.
- Caveat: the build must run on the PR head commit. With a `pull_request` trigger, `github.sha` is the merge commit, so use `github.event.pull_request.head.sha`.
- The CMS creates the PR with the user's token, so the Actions workflow runs normally.

2d. **Does Publish merge through the GitHub API, and is it blocked by required checks?** Verified in source (the `enablePullRequestAutoMerge` and `auto_merge` code exist) and documented.
- Publish marks the draft PR ready, relabels it `sveltia-cms/pending_publish`, then merges via the API, pinned to the checked commit.
- With required status checks configured on `main`, GitHub refuses the immediate merge. The CMS then turns on **auto-merge** (polling every 10 s for up to 1 h), and the PR merges when the checks go green.
- **Required repository settings:** "Allow auto-merge" must be enabled, and `main` must have a branch-protection rule with the required check (the build job).
- The CMS only waits when the checks are the sole blocker.
- A failed check means the merge never happens and the publish fails visibly.
- Before merging, the CMS re-verifies that the PR contains only that entry's files. If the PR holds anything else, it refuses and says to merge on GitHub.
- The workflow must not push extra commits to `cms/*` branches.
- OAuth scope: the default `repo` scope is enough.
- This satisfies spec §7.2: failed preview build -> visible and blocks Publish.

### 3. Images

3a. **Built-in crop: no.** Documented (`/en/docs/ui/asset-library`): "Image editing capabilities, such as cropping and resizing, may be added in future releases."
- The image field supports upload, replace (single field and Asset Library) and delete.
- Deleting an asset updates the entries that reference it in the same commit.
- Optional upload-time conversion to WebP (`media_libraries.default.config.transformations`).

3b. **Custom widgets: yes.** Verified in source.
- `registerFieldType` (7 occurrences) and its alias `registerWidget` (documented as identical) exist.
- Helper props `pickFile` and `addFile` let a control choose or upload an asset.
- The field takes React components (`CMS.React`, HTM) and can have a preview component.

### 4. Rich text

4a. **Toolbar buttons.** Verified in source and documented. The valid `buttons` are:
- `bold`, `italic`, `strikethrough`, `code`, `link`
- headings 1-6, `bulleted-list`, `numbered-list`, `quote`
- `align` (HTML format only, off by default)

There is **no underline button and no colour control.** The underline format exists inside the editor engine (Lexical `formatUnderline`, a possible Ctrl+U shortcut), but:
- the string `<u>` does not occur anywhere in the 0.261.0 bundle, so underline is not serialised to Markdown as `<u>`;
- Markdown has no underline syntax.

Markdown output of underline is therefore **unverified, and treated as unsupported**.

4b. **Inline extensions that wrap selected text.** Documented.
- Pattern-based inline editor components (`registerEditorComponent({ type: 'inline', pattern, toInline, fromInline, toPreview, onInsert })`) are supported.
- `onInsert` receives `selectedText` and returns data that replaces the selection.
- A custom component could therefore emit `<span class="c-accent">…</span>` or `<u>…</u>` as its Markdown (`toInline`), if the pattern matches that text.
- It is only usable in a single line of a paragraph.
- Not exercised here, so **unverified in practice**.

4c. **Raw inline HTML round trip.** **Unverified.**
- The docs state only that with the Markdown format the editor writes "Markdown syntax used by Lexical".
- The raw Markdown mode keeps the text verbatim, so typing the HTML in raw mode is the safest way in.
- Whether Rich Text mode keeps an unknown inline `<span class>` or `<u>` untouched when other text in the paragraph is edited could not be shown without the UI.
- Task 15 must check this early with the real config. Task 5's renderer already sanitises and allows exactly `<u>` and `<span class="c-…">`.

### 5. Custom links

**Yes.** Verified in source (`registerCustomPage`, 3 occurrences) and documented (`/en/docs/api/custom-pages`).
- `CMS.registerCustomPage({ id, label, icon, url, newTab: true })` adds a link-only page: a toolbar button on desktop, and in the Menu page's "Pages" section on mobile (the bottom nav has no room).
- `url` must be http(s).
- Use `newTab: true`, because the Umami dashboard will probably refuse to be embedded in an iframe.
- Registering is done in a small script after loading `sveltia-cms.js`.
- The same mechanism provides an "Open pull requests" link: `https://github.com/youssefaitlhaj/DigitalCV/pulls`.
- That link is a convenience. The entry editor already has the View Preview button and the Drafts board.

## Decisions

| Item | Decision | Notes |
|---|---|---|
| **Crop** | **(A) Custom field type using `cropperjs`** | Registered with `CMS.registerFieldType('imageref', …)`. It wraps the whole `imageRef` (src via `pickFile`/`addFile`, alt as `en`/`de` inputs, `crop` {x,y,width,height} in percent). Cropper.js supports touch (pinch and drag), so crop works on a phone. Load order: cropper CSS and JS, then the widget script, all before `CMS.init`. |
| **Rich text** | **(B) Native marks plus documented inline HTML snippets** | `<u>…</u>` and `<span class="c-accent">…</span>` (also `c-muted`, `c-highlight`, `c-positive`) are listed in the field `hint`; the editor's raw mode is the way to type them. The bold, italic, strikethrough, code, link, list and quote buttons are native. Fallback if the round trip proves lossy (see 4c): pattern-based inline components (4b). |
| **Preview** | **(A) Per-PR preview deploys through `publish_mode: preview`** | `publish_mode: preview` is the single-stage variant of option A (the editorial workflow with per-PR preview deploys). Exact config: `publish_mode: { type: preview, allow_incomplete_drafts: false }`. Also:  `preview_context: preview/deploy`. The Task 17 workflow posts the commit status (see 2c) and the repo needs auto-merge allowed plus a required check on `main` (see 2d). The `backend.branch: draft` fallback (B) is not needed. |
| **Statistics link** | **Custom page link, `registerCustomPage({ id: 'statistics', label: 'Statistics', icon: 'monitoring', url: <Umami share URL>, newTab: true })`** | Appears in the desktop toolbar and the mobile Menu page. The URL comes from the Umami share link. |

## Pinned assets for Task 15

Use the exact URLs below with `integrity` and `crossorigin="anonymous"`:

```html
<script src="https://unpkg.com/@sveltia/cms@0.261.0/dist/sveltia-cms.js"
        integrity="sha384-sty7BGmg7YGd6Wi3G73SvUYWcNE6vztGSEklT7ZI8T/3JSshWKHKH7HuUk99s/HJ"
        crossorigin="anonymous"></script>
```

The unpkg file is byte-identical to `dist/sveltia-cms.js` in the npm tarball (checked with `cmp`), 2,680,413 bytes.

cropperjs 1.7.0 (classic API; the registry latest is 2.3.1, a web-component rewrite that is not used):

```html
<link rel="stylesheet" href="https://unpkg.com/cropperjs@1.7.0/dist/cropper.min.css"
      integrity="sha384-HbayhLlUlAvalqv7mU9jxEeK9BNSbM0t5RHBj3b3TJenPxibMWIlg9YDGrsaHLpg" crossorigin="anonymous">
<script src="https://unpkg.com/cropperjs@1.7.0/dist/cropper.min.js"
        integrity="sha384-0R5HTHwwnCZgM2kzH1PMWrPHmnpGaobQwNz5X7gQDvpG6VcymwxLjPny37bCTzxp"
        crossorigin="anonymous"></script>
```

Caveat: `sveltia-cms.js` lazy-loads chunks (`chunks/git.js`, `qrcode.js`, `react-dom.js`, `assets/…`) with a dynamic `import()` relative to its own URL. SRI covers only the main file. A version-pinned unpkg URL is immutable, so the chunks are safe in practice. If strict SRI is wanted, self-host the whole `dist/` folder from the npm tarball in `public/admin/` instead.

## Controller rulings

1. **Self-host, no unpkg and no SRI.** Install exact versions as npm dependencies (`@sveltia/cms`, `cropperjs@1.7.0`) and serve their dist files from `/admin/` on the same origin. SRI on the entry file does not cover Sveltia's lazy-loaded chunks. Files to serve, keeping this relative layout because chunks load relative to the entry script:
   - `node_modules/@sveltia/cms/dist/sveltia-cms.js`
   - `node_modules/@sveltia/cms/dist/chunks/*.js` (`git.js`, `qrcode.js`, `react-dom.js`) and `chunks/assets/*` (for example `rolldown-runtime-*.js`)
   - skip the `.map` files and the `.mjs` build (about 30 MB with maps)
   - `node_modules/cropperjs/dist/cropper.min.js` and `cropper.min.css`
2. **Pin a release at least about two weeks old.** The latest `@sveltia/cms` published on or before 2026-10-24 is **0.252.0** (2026-10-24T17:28Z, 14 days old on 2026-11-07). Its bundle contains `registerFieldType` (7), `registerWidget` (3), `registerCustomPage` (3), `registerEditorComponent` (3), `preview_context` (4), `allow_incomplete_drafts` (2), `enablePullRequestAutoMerge` (1), `newTab` (7), and the publish-mode list `["preview","editorial_workflow"]`. **Task 15 pins 0.252.0.** The SRI hashes recorded above for 0.261.0 are superseded; 0.252.0 `sveltia-cms.js` is `sha384-1lhFs8+tXG4MV80L+/4enmKGio3aT9qrPGfM8/OTuo7Td7z+PW/8eOZBUXgXwRRc` (informational only, since self-hosting needs none).

## Open risks

1. Nothing was exercised in a browser (R8); the UI-level claims rest on source and docs.
1a. The custom `imageref` crop widget is untested on a phone (touch crop, and `pickFile`/`addFile` on a phone).
2. HTML round trip in the rich text editor (4c) and the inline-component fallback (4b) are unverified.
3. The preview link depends on the Task 17 workflow posting the `preview/deploy` status; without it there is no link, but publishing still works.
4. Phone reorder is by buttons, not drag.
5. Releases are near-daily; update the pinned version, the SRI hash and this note together, deliberately.

## Sources

- https://sveltiacms.app/llms.txt
- https://sveltiacms.app/en/docs/fields/list.md
- https://sveltiacms.app/en/docs/fields/richtext.md
- https://sveltiacms.app/en/docs/fields/image.md
- https://sveltiacms.app/en/docs/ui/asset-library.md
- https://sveltiacms.app/en/docs/workflows/preview.md
- https://sveltiacms.app/en/docs/workflows/editorial.md
- https://sveltiacms.app/en/docs/deployments/previews.md
- https://sveltiacms.app/en/docs/api/custom-pages.md
- https://sveltiacms.app/en/docs/api/field-types.md
- https://sveltiacms.app/en/docs/api/editor-components.md
- https://registry.npmjs.org/@sveltia/cms/-/cms-0.261.0.tgz (grepped locally)
