# Home Intro and Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the homepage profile section to “简介”, keep README content shared, present links as a compact vertical list, and remove the duplicate About-page heading.

**Architecture:** Keep `PublicProfile.aboutContent` as the single content source for both public pages. Make only presentational changes in the existing page components and shared public stylesheet, with static and server-rendered regression coverage.

**Tech Stack:** React, React Router, TypeScript, Node test runner, CSS, Vite

---

### Task 1: Lock the public content contract

**Files:**
- Modify: `apps/web/src/public-home.test.ts`
- Modify: `apps/web/src/home-view.test.tsx`

- [ ] **Step 1: Write failing assertions**

Update the homepage contract to require `<h2>简介</h2>`, while continuing to require the navigation label “个人介绍”. Add an About-page source assertion that rejects `<header className="page-title">`. Extend the rendered home test to verify external links retain input order in a single `.profile-links` container.

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --experimental-strip-types apps/web/src/public-home.test.ts
node apps/api/src/test-runtime.cjs apps/web/src/home-view.test.tsx
```

Expected: at least the homepage title and About heading assertions fail against the current components.

### Task 2: Apply the minimal page and layout changes

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`
- Modify: `apps/web/src/pages/AboutPage.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Change the homepage label**

Replace only the profile section heading:

```tsx
<h2>简介</h2>
```

Keep `<RichDocument content={profile.aboutContent} />` unchanged so README imports continue to feed both pages.

- [ ] **Step 2: Remove the duplicate About heading**

Render the `/about` content directly inside the existing main element:

```tsx
<main className="section-page about-page">
  {!profile ? <p className="empty-state">正在加载…</p> : hasAboutContent(profile.aboutContent) ? <RichDocument content={profile.aboutContent} /> : <p className="empty-state">个人介绍尚未填写。</p>}
</main>
```

- [ ] **Step 3: Keep links compact and vertical**

Ensure `.external-links-section .profile-links` uses one column and each anchor remains a full-width row with wrapping description text. Do not add cards, shadows, URL text, or a second breakpoint.

- [ ] **Step 4: Verify GREEN**

Run the two focused commands from Task 1. Expected: all focused tests pass.

### Task 3: Verify, commit, and deploy

**Files:**
- Verify all changed files

- [ ] **Step 1: Run repository gates**

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
git diff --check
```

Expected: every command exits 0.

- [ ] **Step 2: Commit the implementation**

```powershell
git add apps/web/src/public-home.test.ts apps/web/src/home-view.test.tsx apps/web/src/pages/HomePage.tsx apps/web/src/pages/AboutPage.tsx apps/web/src/styles.css
git commit -m "refine home intro and links"
```

- [ ] **Step 3: Deploy without changing persistent data**

Create a Git archive of the verified commit, upload it through Tencent OrcaTerm, extract it over `/opt/sunny-blog/sunny-blog-fullstack`, and run:

```sh
docker compose -p sunny-blog-fullstack up -d --build
```

Do not replace `.env`, PostgreSQL volumes, media volumes, OpenClaw, or the competition site.

- [ ] **Step 4: Verify production**

Confirm `/`, `/about`, and `/api/profile` return HTTP 200; confirm containers are healthy; inspect the live homepage title, ordered links, unchanged navigation label, and the About page without its former header.
