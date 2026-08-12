# Independent Home Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a separately editable compact homepage intro, preset link icons, and a left-profile/right-pinned homepage where tagged pinned posts can represent projects.

**Architecture:** Extend the shared profile contract and the existing single-row `site_settings` record rather than creating another profile endpoint. Keep articles and projects in the existing post model; `项目` is only a display tag. Render the compact intro through a restricted TipTap extension set and keep the existing full `/about` editor unchanged.

**Tech Stack:** TypeScript, Zod, Fastify, Drizzle/PostgreSQL, React, TipTap, CSS, Node test runner.

---

### Task 1: Shared profile contract

**Files:**
- Modify: `packages/shared/src/index.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] Add failing tests for `ProfileLink.icon` defaulting to `link`, rejecting unknown icons, accepting the compact document whitelist, and rejecting forbidden nodes/marks or more than 600 plain-text characters.
- [ ] Run `node --experimental-strip-types packages/shared/src/index.test.ts` and confirm failures are caused by missing icon and intro behavior.
- [ ] Add `profileLinkIconSchema`, `introContentSchema`, `introContent` to `publicProfileInputSchema`, and exported matching types. Reuse the existing rich-document node model; recursively validate only paragraph, text, bulletList, listItem plus bold/link marks and count text content.
- [ ] Re-run the shared tests and `npm.cmd run typecheck -w @sunny/shared`.

### Task 2: Database and API persistence

**Files:**
- Modify: `apps/api/src/db/schema.ts`
- Create: `apps/api/drizzle/0004_home_intro.sql`
- Modify: `apps/api/drizzle/meta/_journal.json`
- Modify: `apps/api/src/services/settings.test.ts`
- Modify: `apps/api/src/services/settings.ts`
- Modify: `apps/api/src/routes/settings.test.ts`
- Modify: `apps/api/src/routes/settings.ts`

- [ ] Add failing service and route tests proving public/admin reads return `introContent`, writes persist it independently of `aboutContent`, and old links acquire the `link` icon default.
- [ ] Run the targeted API tests and verify they fail on the absent field.
- [ ] Add the `intro_content` JSONB column with an empty-document default and an idempotent JSONB backfill that adds `icon: "link"` only where missing. Do not alter `about_content` or appearance fields.
- [ ] Thread `introContent` through the existing profile projection and upsert fields; parse stored links through the shared contract before returning them.
- [ ] Run API tests, API typecheck, destructive-SQL scan, and `git diff --check`.

### Task 3: Restricted admin intro editor and link icon selector

**Files:**
- Modify: `apps/web/src/admin/profile-form.test.ts`
- Modify: `apps/web/src/admin/profile-form.ts`
- Modify: `apps/web/src/admin/ProfilePage.tsx`
- Modify: `apps/web/src/admin/admin.css`
- Modify: `apps/web/src/components/rich-editor.ts`

- [ ] Add failing tests for serializing `introContent`, preserving a separate `aboutContent`, icon defaults/options, the 600-character save guard, and README import remaining scoped to the full about editor.
- [ ] Run the profile-form tests and confirm the new assertions fail.
- [ ] Add a restricted TipTap extension factory for paragraph, bold, link, and bullet list only. Add a clearly labelled “首页简介” editor without README/image controls, keep the existing “个人介绍” editor and README import, and add a preset icon `<select>` per external link.
- [ ] Keep one save action and upload/save mutual exclusion; ensure the payload contains both documents and strips UI-only link ids.
- [ ] Run the admin tests and targeted TypeScript check.

### Task 4: Public homepage layout and async rich-content synchronization

**Files:**
- Modify: `apps/web/src/components/RichDocument.tsx`
- Modify: `apps/web/src/rich-document.test.tsx`
- Modify: `apps/web/src/pages/HomePage.tsx`
- Create: `apps/web/src/components/ProfileLinkIcon.tsx`
- Modify: `apps/web/src/components/PostCard.tsx`
- Modify: `apps/web/src/home-view.test.tsx`
- Modify: `apps/web/src/public-home.test.ts`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/public-style.test.ts`

- [ ] Add a failing regression test showing `RichDocument` updates when an asynchronously loaded content prop replaces the empty document.
- [ ] Add failing render/contract tests for left-column order (avatar/name, intro, links), right-column pinned content only, safe icon links, a project badge for exact `项目` tags, and mobile single-column order.
- [ ] Run the targeted tests and confirm failures describe the missing behavior.
- [ ] Synchronize editor content when the prop changes without emitting edits; render inline SVG preset icons; move intro and links into the sidebar; keep pinned posts on the right; show a project badge without introducing a project route or data type.
- [ ] Refine the existing two-column CSS with compact GitHub-profile-like link rows and preserve the current 760px collapse and no-horizontal-overflow behavior.
- [ ] Run the targeted public tests and targeted web typecheck.

### Task 5: Full verification and controlled delivery

**Files:**
- Verify only: deployment and Git configuration files remain unchanged until delivery.

- [ ] Run `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, and `git diff --check` fresh.
- [ ] Inspect the final diff against this specification and confirm there is no registration/comment/custom-icon/project subsystem or modification to OpenClaw/competition-site files.
- [ ] Commit the feature intentionally on `codex/liang-minimal-demo`.
- [ ] Before production deployment, create a fresh PostgreSQL and source backup, then rebuild only the Sunny Blog Compose project and verify migration, `/admin/profile` save/reload, public homepage rendering, project badge, and container health.
- [ ] Push the verified branch to the existing GitHub repository only after authentication succeeds; report deployment and push as separate outcomes.
