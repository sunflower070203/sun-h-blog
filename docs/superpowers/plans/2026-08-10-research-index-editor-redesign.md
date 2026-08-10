# Research Index and Editor Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Sunny's existing single-author blog into a research-first index with an efficient admin dashboard, server-persisted admin wallpaper, Markdown/rich-text editing, and multi-image galleries while preserving existing posts and deployment data.

**Architecture:** Keep the current React/Vite, Fastify, Drizzle/PostgreSQL, local-media, and Docker Compose structure. Add one server-side `site_settings` record, focused post-management endpoints, pure editor conversion/upload helpers, and small React components rather than expanding the existing page files indefinitely. TipTap JSON remains the only persisted article body; Markdown is an import/editing projection converted at explicit mode boundaries.

**Tech Stack:** React 19, React Router 7, TipTap 3, a dependency-free scoped Markdown converter, Fastify 5, Drizzle ORM, PostgreSQL 17, TypeScript 5.9, Node test runner, Vite, Docker Compose, Nginx.

---

## File map

- `packages/shared/src/index.ts`: API schemas and shared post/settings types.
- `apps/api/src/db/schema.ts`: `site_settings` persistence.
- `apps/api/src/routes/settings.ts`: authenticated wallpaper settings API.
- `apps/api/src/routes/posts.ts`: paginated admin listing, copy, and batch status routes.
- `apps/api/src/services/posts.ts`: pure copy/batch helpers.
- `apps/web/src/admin/editor/markdown.ts`: Markdown/TipTap conversion boundary.
- `apps/web/src/admin/editor/Gallery.ts`: custom TipTap gallery node.
- `apps/web/src/admin/editor/MultiImagePanel.tsx`: upload queue and insertion choices.
- `apps/web/src/admin/PostEditorPage.tsx`: compose the editor modules and save flow.
- `apps/web/src/admin/DashboardPage.tsx`: search, filters, pagination, selection, batch actions.
- `apps/web/src/admin/AppearancePage.tsx`: wallpaper controls.
- `apps/web/src/admin/AdminFrame.tsx`: shared admin wallpaper and navigation shell.
- `apps/web/src/pages/HomePage.tsx`, `PostListPage.tsx`, `PostPage.tsx`: public research-index experience.
- `apps/web/src/styles.css`, `apps/web/src/admin/admin.css`: public/admin styling.

### Task 1: Establish a safe baseline and repository boundary

**Files:**
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: Record the baseline verification result**

Run from `outputs/sunny-blog-fullstack`:

```powershell
npm test
npm run typecheck
npm run build
docker compose config --quiet
```

Expected: all commands exit `0`. If one fails, stop and diagnose before feature work.

- [ ] **Step 2: Harden ignore rules**

Ensure `.gitignore` contains exactly the relevant runtime exclusions:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
*.sql
*.tar.gz
media/
.superpowers/
work/
```

- [ ] **Step 3: Verify no secret-like files are trackable**

Run:

```powershell
git status --short --ignored
rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' 'SESSION_SECRET=|ADMIN_PASSWORD=|POSTGRES_PASSWORD=' .
```

Expected: matches appear only in `.env.example` as documented placeholders; `.env` and backup/media paths show as ignored.

- [ ] **Step 4: Commit**

```powershell
git add .gitignore README.md
git commit -m "chore: secure blog repository defaults"
```

### Task 2: Define shared settings and management contracts

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`

- [ ] **Step 1: Write failing schema tests**

Add tests that assert the minimum readable overlay and bounded pagination:

```ts
import { strict as assert } from "node:assert";
import { adminPostQuerySchema, siteSettingsInputSchema } from "./index.ts";

assert.equal(siteSettingsInputSchema.parse({ wallpaperUrl: null, overlay: 0.1, blur: 8, position: "center" }).overlay, 0.35);
assert.deepEqual(adminPostQuerySchema.parse({ page: "2", pageSize: "20", status: "draft" }), {
  page: 2, pageSize: 20, status: "draft"
});
```

- [ ] **Step 2: Run the shared test and observe the missing exports**

Run: `node --experimental-strip-types packages/shared/src/index.test.ts`

Expected: FAIL because `adminPostQuerySchema` and `siteSettingsInputSchema` do not exist.

- [ ] **Step 3: Add the contracts**

Add these exports to `packages/shared/src/index.ts`:

```ts
export const siteSettingsInputSchema = z.object({
  wallpaperUrl: z.string().regex(/^\/media\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.(?:jpe?g|png|webp|gif)$/i).nullable(),
  overlay: z.coerce.number().transform((value) => Math.min(0.9, Math.max(0.35, value))),
  blur: z.coerce.number().min(0).max(30),
  position: z.enum(["center", "top", "bottom"])
});

export const adminPostQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(40).optional(),
  status: postStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(50).default(20)
});

export const batchPostStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  status: postStatusSchema
});

export type SiteSettings = z.infer<typeof siteSettingsInputSchema>;
export type AdminPostPage = { items: PostSummary[]; total: number; page: number; pageSize: number };
```

- [ ] **Step 4: Run shared tests and build**

Run: `node --experimental-strip-types packages/shared/src/index.test.ts; npm run build -w @sunny/shared`

Expected: PASS and TypeScript build exits `0`.

- [ ] **Step 5: Commit**

```powershell
git add packages/shared/src
git commit -m "feat: define admin management contracts"
```

### Task 3: Persist and serve admin appearance settings

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/routes/settings.ts`
- Create: `apps/api/src/services/settings.ts`
- Create: `apps/api/src/services/settings.test.ts`
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/drizzle/0001_site_settings.sql`

- [ ] **Step 1: Write the failing pure-service test**

```ts
import { strict as assert } from "node:assert";
import { normalizeSiteSettings } from "./settings.ts";

assert.deepEqual(normalizeSiteSettings({ wallpaperUrl: null, overlay: 0.05, blur: 99, position: "top" }), {
  wallpaperUrl: null, overlay: 0.35, blur: 30, position: "top"
});
```

- [ ] **Step 2: Run the test and observe the missing module**

Run: `node --experimental-strip-types apps/api/src/services/settings.test.ts`

Expected: FAIL because `settings.ts` is missing.

- [ ] **Step 3: Implement normalization and schema**

Create `settings.ts`:

```ts
import { siteSettingsInputSchema, type SiteSettings } from "@sunny/shared";

export const defaultSiteSettings: SiteSettings = { wallpaperUrl: null, overlay: 0.62, blur: 8, position: "center" };
export function normalizeSiteSettings(input: unknown): SiteSettings {
  return siteSettingsInputSchema.parse(input);
}
```

Add a `siteSettings` table with primary key text `id`, nullable `wallpaperUrl`, numeric overlay/blur fields, position, and `updatedAt`. Generate the migration with `npm run db:generate` and inspect that it only creates this table.

- [ ] **Step 4: Add authenticated GET/PUT routes**

Implement `/admin/settings` so GET returns defaults when no row exists and PUT validates then upserts the single row with id `primary`. Register `settingsRoutes` in `app.ts` next to the existing post/media routes.

- [ ] **Step 5: Add the test to the root test command and verify**

Modify the root `test` script to include `apps/api/src/services/settings.test.ts`, then run `npm test; npm run typecheck`.

Expected: PASS and exit `0`.

- [ ] **Step 6: Commit**

```powershell
git add packages/shared apps/api package.json
git commit -m "feat: persist admin appearance settings"
```

### Task 4: Add efficient post-management services and endpoints

**Files:**
- Modify: `apps/api/src/services/posts.ts`
- Modify: `apps/api/src/services/posts.test.ts`
- Modify: `apps/api/src/routes/posts.ts`
- Modify: `apps/web/src/api.ts`

- [ ] **Step 1: Write failing copy and batch tests**

```ts
const source = { id: "a", title: "实验记录", slug: "experiment", status: "published" as const, publishedAt: new Date() };
const copy = copyPostValues(source);
assert.equal(copy.title, "实验记录（副本）");
assert.equal(copy.slug, "experiment-copy");
assert.equal(copy.status, "draft");
assert.equal(copy.publishedAt, null);
assert.deepEqual(batchStatusValues("draft"), { status: "draft", publishedAt: null });
```

- [ ] **Step 2: Run and observe missing helpers**

Run: `node --experimental-strip-types apps/api/src/services/posts.test.ts`

Expected: FAIL for missing exports.

- [ ] **Step 3: Implement pure helpers**

```ts
export function copyPostValues(post: MinimalPost & { title: string }) {
  return { ...post, id: undefined, title: `${post.title}（副本）`, slug: `${post.slug}-copy`, status: "draft" as const, publishedAt: null };
}

export function batchStatusValues(status: "draft" | "published", now = new Date()) {
  return { status, publishedAt: status === "published" ? now : null, updatedAt: now };
}
```

- [ ] **Step 4: Implement routes**

Change `GET /admin/posts` to parse `adminPostQuerySchema`, apply status/category/text filters, and return `{items,total,page,pageSize}`. Add `POST /admin/posts/:id/copy` with collision-safe `-copy`, `-copy-2` slugs. Add `POST /admin/posts/batch-status` using `batchPostStatusSchema`; return updated rows so partial/missing ids are visible.

- [ ] **Step 5: Update the web API client**

Expose `listAdminPosts(query)`, `copyPost(id)`, and `batchPostStatus(ids,status)` with the shared response types.

- [ ] **Step 6: Verify**

Run: `npm test; npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add apps/api/src apps/web/src/api.ts
git commit -m "feat: add efficient post management APIs"
```

### Task 5: Build the dependency-free Markdown conversion boundary

**Files:**
- Create: `apps/web/src/admin/editor/markdown.ts`
- Create: `apps/web/src/admin/editor/markdown.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Write failing round-trip tests**

Test headings, lists, code blocks, blockquotes, links, and images. Require `markdownToDocument(markdown)` to return TipTap JSON and `documentToMarkdown(doc)` to preserve the same semantic constructs. Add one gallery fixture and require the serializer to return `{markdown, warnings:["图集需要在富文本模式编辑"]}` rather than silently losing it.

- [ ] **Step 2: Run and observe the missing module**

Run: `node --experimental-strip-types apps/web/src/admin/editor/markdown.test.ts`

Expected: FAIL because `markdown.ts` is missing.

- [ ] **Step 3: Implement the boundary**

Implement a small line-oriented parser and JSON serializer for headings, paragraphs, bold, italic, links, images, blockquotes, ordered/unordered lists, and fenced code blocks. Export only:

```ts
export type MarkdownExport = { markdown: string; warnings: string[] };
export function markdownToDocument(markdown: string): Record<string, unknown>;
export function documentToMarkdown(document: Record<string, unknown>): MarkdownExport;
```

Reject parser exceptions without mutating editor state; detect gallery nodes before serialization and return an explicit warning.

- [ ] **Step 4: Add the test to `npm test` and verify**

Run: `npm test; npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add package.json apps/web docs/superpowers/plans/2026-08-10-research-index-editor-redesign.md
git commit -m "feat: add markdown editing conversion"
```

### Task 6: Add gallery documents and multi-image upload logic

**Files:**
- Modify: `apps/web/package.json`
- Modify: `package-lock.json`
- Create: `apps/web/src/admin/editor/Gallery.ts`
- Create: `apps/web/src/admin/editor/uploads.ts`
- Create: `apps/web/src/admin/editor/uploads.test.ts`
- Create: `apps/web/src/admin/editor/MultiImagePanel.tsx`
- Modify: `package.json`

- [ ] **Step 1: Add the direct TipTap core dependency**

Run: `npm install @tiptap/core@3.6.6 -w @sunny/web`

- [ ] **Step 2: Write failing upload queue tests**

```ts
const result = await uploadFiles([a, b], async (file) => {
  if (file.name === "b.png") throw new Error("上传失败");
  return { url: "/media/2026-08-10/a.png" };
});
assert.equal(result[0].status, "success");
assert.equal(result[1].status, "error");
assert.equal(result[1].error, "上传失败");
```

- [ ] **Step 3: Implement an independent-result queue**

`uploadFiles` must preserve input order and use `Promise.allSettled`; it must never reject the whole batch because one file failed.

- [ ] **Step 4: Implement the gallery node**

Create an atom block node named `gallery` with `images: Array<{src:string;alt:string}>`, render as `<figure class="image-gallery" data-gallery>`, and parse the same markup. Add commands for insertion and attribute replacement.

- [ ] **Step 5: Implement `MultiImagePanel`**

Accept multi-select and drag/drop images; expose progress/result rows, retry, reorder, alt editing, “逐张插入” and “生成图集”. Insert single Image nodes at the current selection or one Gallery node with successful items only.

- [ ] **Step 6: Verify**

Run: `npm test; npm run typecheck; npm run build -w @sunny/web`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add package.json package-lock.json apps/web/src/admin/editor
git commit -m "feat: support multi-image article galleries"
```

### Task 7: Refactor the editor into the approved dual-mode workflow

**Files:**
- Modify: `apps/web/src/admin/PostEditorPage.tsx`
- Create: `apps/web/src/admin/editor/EditorToolbar.tsx`
- Create: `apps/web/src/admin/editor/PostMetadataPanel.tsx`
- Modify: `apps/web/src/admin/admin.css`

- [ ] **Step 1: Extract toolbar and metadata without behavior changes**

Move existing controls into focused components. Keep current prop names aligned with `PostInput`; run typecheck before adding new behavior.

- [ ] **Step 2: Add explicit mode state and recovery snapshot**

Use `mode: "rich" | "markdown"`, `markdownDraft`, and a local-storage recovery snapshot. Rich-to-Markdown must call `documentToMarkdown`; when warnings exist, show them and require the user to stay in rich mode or accept the lossy projection. Markdown-to-rich must parse into a temporary value before calling `editor.commands.setContent`.

- [ ] **Step 3: Add `.md` import**

Read the selected UTF-8 file with `file.text()`, parse it, and only replace the body after successful parsing. Do not interpret front matter and do not overwrite metadata fields.

- [ ] **Step 4: Integrate multi-image panel and Gallery extension**

Register Gallery alongside StarterKit/Image/Link. Keep the existing single cover upload in the metadata panel; body images use `MultiImagePanel`.

- [ ] **Step 5: Preserve save guarantees**

Before save, convert Markdown mode to TipTap JSON. On any conversion/API error, keep local drafts and show the exact error. Clear the local draft only after the API returns success.

- [ ] **Step 6: Verify editor behavior**

Run: `npm test; npm run typecheck; npm run build -w @sunny/web`

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add apps/web/src/admin
git commit -m "feat: redesign dual-mode writing workflow"
```

### Task 8: Build the efficient dashboard and admin wallpaper UI

**Files:**
- Create: `apps/web/src/admin/AdminFrame.tsx`
- Create: `apps/web/src/admin/AppearancePage.tsx`
- Modify: `apps/web/src/admin/DashboardPage.tsx`
- Modify: `apps/web/src/api.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/admin/admin.css`

- [ ] **Step 1: Add settings client methods and shared frame**

Add `getSettings()` and `updateSettings(input)`. `AdminFrame` loads settings once, sets CSS variables for URL/overlay/blur/position, and renders sidebar navigation for articles, appearance, and public-site view.

- [ ] **Step 2: Add wallpaper controls**

`AppearancePage` uses the existing authenticated media upload, previews changes locally, clamps overlay to `0.35..0.9`, blur to `0..30`, supports three positions, and saves only on explicit confirmation. Restore default sends `{wallpaperUrl:null,overlay:0.62,blur:8,position:"center"}`.

- [ ] **Step 3: Add dashboard filters and pagination**

Drive `q`, `category`, `status`, and `page` through component state and API query parameters. Reset page to `1` when a filter changes. Show total results and disable invalid page navigation.

- [ ] **Step 4: Add selection and safe batch actions**

Rows use checkboxes rather than wrapping the whole row in a Link. Offer batch publish/withdraw only. Copy is a per-row action. Delete remains inside the editor with confirmation.

- [ ] **Step 5: Register `/admin/appearance` and verify**

Run: `npm test; npm run typecheck; npm run build -w @sunny/web`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add apps/web/src
git commit -m "feat: improve admin management and appearance"
```

### Task 9: Implement the public research-index layout and article styling

**Files:**
- Modify: `apps/web/src/components/Shell.tsx`
- Modify: `apps/web/src/components/PostCard.tsx`
- Modify: `apps/web/src/content/site.ts`
- Modify: `apps/web/src/pages/HomePage.tsx`
- Modify: `apps/web/src/pages/PostListPage.tsx`
- Modify: `apps/web/src/pages/PostPage.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Rebuild the shell and homepage hierarchy**

Use a restrained research-index structure: stable navigation, numbered research areas, project index, latest writing, and a smaller life block. Reuse existing site content and sailboat asset; do not copy reference text or pixel assets.

- [ ] **Step 2: Improve list filtering**

Expose search, category, and tag filtering. Keep the current public API contract unless tag filtering requires one additive query parameter.

- [ ] **Step 3: Add article typography and gallery rendering**

Render `.image-gallery` as two or three columns according to item count and one column below `800px`. Keep body width near `760px`, distinguish code, quote, caption, heading anchors, and external links, and preserve old TipTap HTML.

- [ ] **Step 4: Add accessibility and motion guards**

Maintain visible focus states, sufficient color contrast, semantic headings, meaningful image alt text, and `prefers-reduced-motion` behavior.

- [ ] **Step 5: Verify responsive production output**

Run: `npm test; npm run typecheck; npm run build`

Expected: PASS with no TypeScript or Vite errors.

- [ ] **Step 6: Commit**

```powershell
git add apps/web/src
git commit -m "feat: introduce research-first public layout"
```

### Task 10: End-to-end verification, documentation, GitHub publish, and server update

**Files:**
- Modify: `README.md`
- Modify: `.env.example` only if a new non-secret setting is required
- Create: `docs/deployment.md`

- [ ] **Step 1: Document the workflows**

Document admin appearance, Markdown import limitations, multi-image/gallery usage, database migration, backup, deployment, and rollback. State that `.env`, PostgreSQL data, `media_data`, and backups never belong in Git.

- [ ] **Step 2: Run the complete local verification suite**

```powershell
npm test
npm run typecheck
npm run build
docker compose config --quiet
```

Expected: every command exits `0`.

- [ ] **Step 3: Inspect the final diff and repository contents**

```powershell
git status --short
git diff --check
git ls-files | rg '(\.env$|\.sql$|media/|backup|\.tar\.gz$)'
```

Expected: `git diff --check` is clean; the final command returns no sensitive/runtime artifacts.

- [ ] **Step 4: Push to the approved GitHub repository**

Confirm remote `origin` is exactly `https://github.com/sunflower070203/sun-h-blog`, commit remaining documentation, push `main`, and verify the remote repository shows the expected source tree. Do not force-push or overwrite unrelated remote history.

- [ ] **Step 5: Back up production before deployment**

On the Tencent server, create a timestamped PostgreSQL dump and record the currently deployed image/container state. Verify the dump file is non-empty before proceeding.

- [ ] **Step 6: Deploy without replacing persistent data**

Pull the verified commit, run `docker compose up -d --build`, allow the API startup migration to complete, and do not remove named volumes.

- [ ] **Step 7: Smoke-test production**

Verify public home, list, old article, admin login, filtered dashboard, appearance save/restore, Markdown draft, multi-image partial retry, gallery publish, and container health. Keep `COOKIE_SECURE=false` until HTTPS is actually active.

- [ ] **Step 8: Record rollback instructions**

Document the previous commit/image and the database restore command. If migration or smoke tests fail, restore the previous application version; restore the database only if the migration changed data incompatibly.

- [ ] **Step 9: Commit documentation**

```powershell
git add README.md .env.example docs
git commit -m "docs: document blog publishing and deployment"
git push origin main
```
