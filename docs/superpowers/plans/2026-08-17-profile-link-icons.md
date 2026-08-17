# Profile Link Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace profile-link text abbreviations with theme-aware SVG symbols and preserve a responsive, accessible Fuwari-style link row.

**Architecture:** Keep the existing `ProfileLinkIcon` component as the single preset-to-SVG boundary. Verify its rendered output and the home profile link contract before changing the component and scoped public CSS.

**Tech Stack:** React, TypeScript, inline SVG, Node test runner, CSS.

---

### Task 1: SVG icon renderer

**Files:**
- Modify: `apps/web/src/components/ProfileLinkIcon.tsx`
- Create: `apps/web/src/components/ProfileLinkIcon.test.tsx`
- Modify: `package.json`

- [ ] Write a rendering test that requires every preset to output SVG paths rather than `<text>` abbreviations.
- [ ] Run the focused test and confirm it fails because the current component renders `<text>`.
- [ ] Add minimal inline SVG geometry for all seven presets without adding dependencies.
- [ ] Run the focused test and confirm all presets pass.

### Task 2: Responsive profile link presentation

**Files:**
- Modify: `apps/web/src/home-view.test.tsx`
- Modify: `apps/web/src/styles.css`

- [ ] Add a contract assertion for accessible titles, safe external-link attributes, and the compact row plus detailed card.
- [ ] Run the focused test and confirm any missing contract fails.
- [ ] Refine only the profile-link CSS so icons wrap, receive visible hover/focus treatment, and detailed links stay restrained.
- [ ] Run the focused tests, full test suite, web typecheck, web build, and `git diff --check`.
- [ ] Inspect the local Demo at desktop and mobile widths without committing or deploying.

