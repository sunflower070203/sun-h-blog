# Profile Home and Horizontal Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vertically integrated homepage with a GitHub-profile-style home, manually pinned published posts, separate research/life/about routes, and safe horizontal route transitions.

**Architecture:** Extend the existing public profile singleton with an `aboutContent` TipTap JSON document, reuse the current article renderer/editor extensions, and keep pinning on the existing `featured` post field. Public routes remain independent and directly addressable; navigation uses progressive View Transition enhancement with a no-animation fallback.

**Tech Stack:** React 19, React Router 7, TipTap 3, Fastify, Drizzle ORM, PostgreSQL 17, Zod, CSS View Transitions, Node test runner.

---

## Scope and file map

- `packages/shared/src/index.ts` and tests: extend `PublicProfile` with validated `aboutContent`.
- `apps/api/src/db/schema.ts`, `apps/api/drizzle/0003_about_content.sql`, migration journal: additive persistence.
- `apps/api/src/routes/profile-handlers.ts` and route tests: public/admin profile read/write includes only the approved public fields.
- `apps/api/src/services/settings.ts` and tests: neutral empty document default.
- `apps/web/src/components/RichDocument.tsx`: shared read-only TipTap renderer used by posts and About.
- `apps/web/src/admin/editor/editor-extensions.ts`: one extension configuration for article and About editors.
- `apps/web/src/admin/ProfilePage.tsx`: complete About rich-text editing and image/gallery insertion.
- `apps/web/src/pages/HomePage.tsx`: Profile overview, vertical links, and at most six pinned published posts.
- `apps/web/src/pages/CategoryPage.tsx`: shared exact-category page for research and life.
- `apps/web/src/pages/AboutPage.tsx`: complete stored About content.
- `apps/web/src/components/Shell.tsx`: three route links at top right with active state.
- `apps/web/src/components/PublicTransition.tsx`: progressive horizontal page transition.
- `apps/web/src/App.tsx`: `/research`, `/life`, `/about` routes.
- `apps/web/src/styles.css`: Profile home, category pages, pinned cards, route transition and reduced-motion rules.
- Tests: contract, pure selection, server-render, route/navigation and style regression coverage.

No task commits, pushes, deploys, or runs a migration against a real database.

### Task 1: Extend the public profile document contract

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `packages/shared/src/index.test.ts`

- [ ] **Step 1: Write failing contract tests**

Add tests proving an empty TipTap document is accepted, missing `aboutContent` receives a neutral default for backward-compatible clients, and primitive/array values are rejected:

```ts
const emptyDocument = { type: "doc", content: [{ type: "paragraph" }] };

it("accepts a safe structured about document", () => {
  const profile = publicProfileInputSchema.parse({
    displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyDocument
  });
  assert.deepEqual(profile.aboutContent, emptyDocument);
});

it("defaults missing about content to an empty document", () => {
  const profile = publicProfileInputSchema.parse({ displayName: "Sunny", avatarUrl: null, bio: "", links: [] });
  assert.deepEqual(profile.aboutContent, emptyDocument);
});

for (const invalid of [null, "<script>", [], 1]) {
  assert.equal(publicProfileInputSchema.safeParse({
    displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: invalid
  }).success, false);
}
```

- [ ] **Step 2: Run RED**

Run `node --experimental-strip-types packages/shared/src/index.test.ts`.

Expected: FAIL because `aboutContent` is absent or invalid values are not rejected.

- [ ] **Step 3: Implement minimal validation**

Add:

```ts
export const emptyRichDocument = { type: "doc", content: [{ type: "paragraph" }] } as const;
export const richDocumentSchema = z.record(z.unknown()).refine(
  (value) => value.type === "doc" && (value.content === undefined || Array.isArray(value.content)),
  "介绍内容格式无效"
);
```

Extend `publicProfileInputSchema` with:

```ts
aboutContent: richDocumentSchema.default(emptyRichDocument)
```

- [ ] **Step 4: Run GREEN and shared typecheck**

Run the shared test and `npm.cmd run typecheck -w @sunny/shared`. Expected: PASS.

### Task 2: Persist and expose About content safely

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Create: `apps/api/drizzle/0003_about_content.sql`
- Modify: `apps/api/drizzle/meta/_journal.json`
- Modify: `apps/api/src/services/settings.ts`
- Modify: `apps/api/src/services/settings.test.ts`
- Modify: `apps/api/src/routes/profile-handlers.ts`
- Modify: `apps/api/src/routes/settings.test.ts`

- [ ] **Step 1: Write failing service and handler tests**

Extend neutral-default tests to require `aboutContent: emptyRichDocument`. Extend public projection, insert and conflict-update tests to prove `aboutContent` is returned and persisted, while wallpaper fields remain excluded.

- [ ] **Step 2: Run RED**

Run settings service and route tests. Expected: FAIL because defaults, projection and writes omit `aboutContent`.

- [ ] **Step 3: Add the Drizzle column and migration**

Add to `siteSettings`:

```ts
aboutContent: jsonb("about_content").$type<Record<string, unknown>>().notNull().default(emptyRichDocument),
```

Create `0003_about_content.sql`:

```sql
ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "about_content" jsonb
  DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb NOT NULL;
```

Append journal entry `idx: 3`, version `7`, tag `0003_about_content`, with a timestamp greater than migration 0002.

- [ ] **Step 4: Extend defaults, projection and upsert**

Use `emptyRichDocument` in `defaultPublicProfile`. Include `aboutContent` in `toPublicProfile`, insert values and conflict-update values. Public profile responses must still exclude `wallpaperUrl`, `overlay`, `blur`, and `position`.

- [ ] **Step 5: Run GREEN and API checks**

Run service tests, route tests, API typecheck, destructive SQL scan and `git diff --check`. Expected: PASS and no `DROP`, `TRUNCATE`, or `DELETE` in migration 0003.

### Task 3: Share the rich document renderer and editor configuration

**Files:**
- Create: `apps/web/src/admin/editor/editor-extensions.ts`
- Create: `apps/web/src/components/RichDocument.tsx`
- Modify: `apps/web/src/pages/PostPage.tsx`
- Modify: `apps/web/src/admin/PostEditorPage.tsx`
- Create: `apps/web/src/rich-document.test.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write a failing renderer contract test**

Server-render `RichDocument` with a paragraph, link and image document. Assert it creates the shared prose wrapper and does not use `dangerouslySetInnerHTML`. Add a source contract requiring PostPage and the future About page to import `RichDocument` rather than duplicate extensions.

- [ ] **Step 2: Run RED**

Expected: FAIL because shared renderer/configuration does not exist.

- [ ] **Step 3: Extract one extension factory**

Create:

```ts
export function createEditorExtensions(options: { openLinksOnClick: boolean }) {
  return [StarterKit, Image, Gallery, Link.configure({ openOnClick: options.openLinksOnClick })];
}
```

Do not add a new dependency or change Gallery behavior.

- [ ] **Step 4: Implement RichDocument and migrate PostPage**

`RichDocument` accepts a `Record<string, unknown>`, initializes a read-only TipTap editor with `openLinksOnClick: true`, and renders through `EditorContent`. Replace PostPage's private `ArticleBody` with the shared component.

- [ ] **Step 5: Reuse editor extensions in PostEditorPage**

Replace its inline extension array with `createEditorExtensions({ openLinksOnClick: false })`. Do not otherwise change article editing, autosave, Markdown or publishing behavior.

- [ ] **Step 6: Run GREEN**

Run renderer test, editor tests, web typecheck and full test suite. Expected: PASS.

### Task 4: Add complete About editing to the profile admin

**Files:**
- Modify: `apps/web/src/admin/ProfilePage.tsx`
- Modify: `apps/web/src/admin/profile-form.ts`
- Modify: `apps/web/src/admin/profile-form.test.ts`
- Modify: `apps/web/src/admin/admin.css`

- [ ] **Step 1: Write failing form tests**

Extend editable-profile serialization tests to prove `aboutContent` is retained exactly while UI-only link ids are stripped. Add a page contract for a labelled `完整个人介绍` editor and existing multi-image upload control.

- [ ] **Step 2: Run RED**

Expected: FAIL because the profile page does not edit or submit `aboutContent`.

- [ ] **Step 3: Add the About editor**

Initialize a TipTap editor from loaded profile `aboutContent` using shared extensions. When the API load finishes, call `editor.commands.setContent(profile.aboutContent)`. Mark the form dirty on editor updates.

Render a restrained toolbar for bold, italic, H2, bullet list, blockquote and code block, followed by `EditorContent` and the existing `MultiImagePanel`.

- [ ] **Step 4: Save without races**

Build the payload only after profile has loaded and while neither upload nor save is active:

```ts
const payload: PublicProfile = {
  ...profile,
  links: serializeProfileLinks(profile.links),
  aboutContent: aboutEditor?.getJSON() ?? emptyRichDocument
};
```

Keep the existing stable link ids, twelve-link limit, upload/save mutual exclusion, file retry, accessible status region and error handling.

- [ ] **Step 5: Style within the profile page scope**

Add `.profile-about-editor`, `.profile-about-toolbar` and `.profile-about-editor .tiptap` rules only. Reuse existing admin editor tokens and mobile behavior.

- [ ] **Step 6: Run GREEN**

Run profile tests, web typecheck and full test suite. Expected: PASS.

### Task 5: Replace the homepage with Profile and pinned posts

**Files:**
- Modify: `apps/web/src/home-data.ts`
- Modify: `apps/web/src/home-data.test.ts`
- Modify: `apps/web/src/pages/HomePage.tsx`
- Modify: `apps/web/src/home-view.test.tsx`

- [ ] **Step 1: Write failing pinned-post tests**

Add `selectPinnedPosts(posts)` tests proving:

- only `status === "published" && featured === true` is selected;
- drafts marked featured are excluded;
- result order follows the public API order;
- at most six posts are returned.

- [ ] **Step 2: Run RED**

Expected: FAIL because the selection function and pinned-only homepage do not exist.

- [ ] **Step 3: Implement pinned selection**

```ts
export function selectPinnedPosts(posts: PostSummary[]) {
  return posts.filter((post) => post.status === "published" && post.featured).slice(0, 6);
}
```

- [ ] **Step 4: Rebuild HomeView**

Keep the left Profile block and vertical links. Replace research/life/about sections with one `置顶文章` section containing pinned `PostCard` entries. Keep the quiet `/admin` link and neutral empty state. Do not render complete About content on `/`.

- [ ] **Step 5: Run GREEN**

Server-render tests must prove the homepage has no full category/about sections, renders pinned posts only, preserves duplicate links, and shows no generated biography. Run full tests.

### Task 6: Add category and About routes

**Files:**
- Create: `apps/web/src/pages/CategoryPage.tsx`
- Create: `apps/web/src/pages/AboutPage.tsx`
- Create: `apps/web/src/section-pages.test.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Write failing route/page tests**

Server-render CategoryPage with mixed posts and prove exact-category filtering. Render AboutPage with stored content and an empty document. Add route source assertions for `/research`, `/life`, and `/about`.

- [ ] **Step 2: Run RED**

Expected: FAIL because pages and routes do not exist.

- [ ] **Step 3: Implement CategoryPage**

Accept `category` and `title` props, load public posts with an unmount guard, select exact matches and render the existing directory-style PostCard list.

- [ ] **Step 4: Implement AboutPage**

Load the public profile independently. Render `RichDocument` only when `aboutContent` contains meaningful non-empty nodes; otherwise render a neutral empty state. Do not substitute the short `bio`.

- [ ] **Step 5: Register routes**

Add:

```tsx
<Route path="/research" element={<Public><CategoryPage category="科研学习" title="科研学习" /></Public>} />
<Route path="/life" element={<Public><CategoryPage category="日常生活" title="日常生活" /></Public>} />
<Route path="/about" element={<Public><AboutPage /></Public>} />
```

Keep `/posts` and article routes for backward compatibility.

- [ ] **Step 6: Run GREEN**

Run page tests, route contracts, web typecheck and full tests. Expected: PASS.

### Task 7: Add route navigation and progressive horizontal transitions

**Files:**
- Modify: `apps/web/src/components/Shell.tsx`
- Create: `apps/web/src/components/PublicTransition.tsx`
- Create: `apps/web/src/public-navigation.test.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/public-style.test.ts`

- [ ] **Step 1: Write failing navigation and motion tests**

Require three `NavLink` destinations `/research`, `/life`, `/about`, active-state semantics, route content wrapped by `PublicTransition`, View Transition enhancement, and a `prefers-reduced-motion: reduce` rule that disables transition animation.

- [ ] **Step 2: Run RED**

Expected: FAIL because navigation still uses hash links and no transition wrapper exists.

- [ ] **Step 3: Implement top-right route navigation**

Use `NavLink` and keep only the three approved labels. The brand remains a normal link to `/`. Give the active item `aria-current="page"` through NavLink behavior.

- [ ] **Step 4: Implement progressive transitions**

`PublicTransition` uses current location and the fixed route order `/`, `/research`, `/life`, `/about` to set forward/back direction. When `document.startViewTransition` exists, route-link navigation uses it; without support, navigation occurs immediately. Do not create an oversized horizontal scroller or intercept touch gestures.

- [ ] **Step 5: Add restrained CSS**

Style pinned cards, Profile link rows, category/About page spacing, active nav state and horizontal root view transitions. Animation duration must remain 220–300ms. Under reduced motion, set animation and transition duration to zero and disable transforms.

- [ ] **Step 6: Run GREEN**

Run navigation, style, SSR and full tests plus typecheck/build. Expected: PASS.

### Task 8: Final local verification

**Files:**
- No production changes unless a failing check exposes a defect.

- [ ] **Step 1: Run automated gates**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
git diff --check
```

Expected: all exit 0.

- [ ] **Step 2: Audit migration and scope**

Verify migration 0003 contains no destructive SQL, existing migration order remains valid, and no deployment/GitHub/Docker files changed.

- [ ] **Step 3: Browser-test the local built frontend with memory API data**

Verify:

- `/` shows Profile, vertical links and only pinned posts;
- `/research`, `/life`, `/about` are directly addressable and refreshable;
- navigation active state is correct;
- supported browsers slide horizontally; reduced-motion mode has no animation;
- browser back/forward works;
- 390, 760, 801, 900, 1024 and 1280 widths have no horizontal overflow;
- About rich content renders paragraphs, links, image/gallery nodes;
- admin Profile saves complete About content and reload restores it using the memory mock.

- [ ] **Step 4: Report evidence boundaries**

Explicitly state that memory-mock verification does not prove a real PostgreSQL migration, real API persistence, production media storage, GitHub state or deployment state. Do not connect to those systems in this local-Demo phase.
