# Sunny Full-Stack Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-admin personal blog with a comfortable browser-based publishing workflow and portable Docker deployment.

**Architecture:** A Vite React SPA serves the public blog and protected admin UI. A Fastify API owns authentication, PostgreSQL persistence, rich-text validation, and S3-compatible uploads; Nginx exposes both under one origin.

**Tech Stack:** React, Vite, TypeScript, TipTap, Fastify, Drizzle ORM, PostgreSQL, S3-compatible storage, Vitest, Docker Compose, Nginx

---

### Task 1: Workspace and shared contracts

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `packages/shared/src/index.ts`
- Test: `packages/shared/src/index.test.ts`

- [ ] Write failing tests for post input validation and published-post projection.
- [ ] Run the shared test and confirm it fails because validation functions do not exist.
- [ ] Implement shared Zod schemas and public/admin types.
- [ ] Run the shared test and confirm it passes.

### Task 2: Database and authentication API

**Files:**
- Create: `apps/api/src/db/schema.ts`
- Create: `apps/api/src/auth.ts`
- Create: `apps/api/src/routes/auth.ts`
- Create: `apps/api/src/app.ts`
- Test: `apps/api/src/auth.test.ts`

- [ ] Write failing tests for password verification, signed session cookies, and login throttling.
- [ ] Run API tests and confirm expected failures.
- [ ] Implement the minimal authentication services and Fastify hooks.
- [ ] Run API tests and confirm they pass.

### Task 3: Post management and public API

**Files:**
- Create: `apps/api/src/routes/posts.ts`
- Create: `apps/api/src/services/posts.ts`
- Test: `apps/api/src/services/posts.test.ts`

- [ ] Write failing service tests for draft privacy, slug uniqueness, publishing, and deletion.
- [ ] Run tests and confirm expected failures.
- [ ] Implement post services and public/admin routes.
- [ ] Run tests and confirm they pass.

### Task 4: Media uploads

**Files:**
- Create: `apps/api/src/routes/media.ts`
- Create: `apps/api/src/services/media.ts`
- Test: `apps/api/src/services/media.test.ts`

- [ ] Write failing tests for MIME type and size validation.
- [ ] Run tests and confirm expected failures.
- [ ] Implement S3-compatible upload handling and metadata persistence.
- [ ] Run tests and confirm they pass.

### Task 5: Public blog

**Files:**
- Create: `apps/web/src/content/site.ts`
- Create: `apps/web/src/pages/HomePage.tsx`
- Create: `apps/web/src/pages/PostListPage.tsx`
- Create: `apps/web/src/pages/PostPage.tsx`
- Create: `apps/web/src/styles.css`

- [ ] Build the sailboat homepage, post list, project section, and post detail.
- [ ] Add responsive navigation, loading states, empty states, and accessible focus behavior.
- [ ] Run the web production build and confirm it succeeds.

### Task 6: Admin publishing experience

**Files:**
- Create: `apps/web/src/admin/LoginPage.tsx`
- Create: `apps/web/src/admin/DashboardPage.tsx`
- Create: `apps/web/src/admin/PostEditorPage.tsx`
- Create: `apps/web/src/admin/admin.css`

- [ ] Implement login, dashboard, post list, and rich-text editor.
- [ ] Add draft save, preview, publish, unpublish, delete, cover upload, tags, and unsaved-change warnings.
- [ ] Run component tests and the production build.

### Task 7: Portable deployment and documentation

**Files:**
- Create: `docker-compose.yml`
- Create: `apps/api/Dockerfile`
- Create: `apps/web/Dockerfile`
- Create: `deploy/nginx.conf`
- Create: `.env.example`
- Create: `README.md`

- [ ] Configure PostgreSQL, API, web, Nginx, persistent volumes, and health checks.
- [ ] Document local use, first-admin setup, Volcano Engine ECS/TOS deployment, HTTPS, backups, and GitHub upload.
- [ ] Validate Compose configuration and confirm no real secrets are committed.
- [ ] Build the complete project and create a ZIP archive.

