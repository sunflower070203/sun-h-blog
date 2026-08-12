# README Profile Home Implementation Plan

**Goal:** Show the complete editable README-style About document on the homepage, keep external links separate, remove mentor-specific presentation, and add a Home navigation item.

**Architecture:** Reuse the stored `aboutContent` TipTap document and the existing Markdown converter. The profile admin imports `.md` into the same rich editor; the public homepage renders the saved document without truncation.

- [ ] Add failing contracts for four navigation items, full homepage About rendering, and `.md` import.
- [ ] Add a pure Markdown-file reader helper and connect it to ProfilePage.
- [ ] Restructure HomeView into Personal introduction, External links, then pinned posts.
- [ ] Add Home NavLink and update transition order/styles.
- [ ] Run tests, typecheck, build, and local browser verification.
