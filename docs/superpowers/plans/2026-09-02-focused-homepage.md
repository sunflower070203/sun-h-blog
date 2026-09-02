# Focused Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local-only Fuwari-style homepage demo with one compact profile card, at most four named links, one pinned article, three recent articles, and a compliant low-emphasis footer.

**Architecture:** Keep the existing React/Fastify/PostgreSQL contracts unchanged. Narrow the homepage selector in `home-data.ts`, render the reduced layout directly in `HomePage.tsx`, and add homepage-specific CSS without changing the shared article cards or other public routes. Reuse `profile.bio` for the short homepage introduction so the homepage no longer imports the TipTap-based `RichDocument` renderer.

**Tech Stack:** React 19, React Router, TypeScript, Node test runner, Vite, existing CSS design tokens.

---

## File map

- Modify `apps/web/src/home-data.ts`: select exactly one pinned post and at most three non-pinned recent posts.
- Modify `apps/web/src/home-data.test.ts`: prove the limits, publication filter, order, and pin/latest deduplication.
- Modify `apps/web/src/pages/HomePage.tsx`: remove duplicate homepage elements, render named profile links, compact recent rows, and the filing footer.
- Modify `apps/web/src/home-view.test.tsx`: verify the rendered homepage contract and filing links.
- Modify `apps/web/src/public-home.test.ts`: update source-level guardrails so removed sections do not return.
- Modify `apps/web/src/styles.css`: style the compact profile links, one featured card, recent list, responsive layout, and filing footer.
- Modify `apps/web/src/public-style.test.ts`: verify the new CSS hooks and mobile rules.
- Create `apps/web/public/beian-police.png`: local copy of the public-security filing icon used by the official filing snippet.

### Task 1: Narrow the homepage feed

**Files:**
- Modify: `apps/web/src/home-data.test.ts`
- Modify: `apps/web/src/home-data.ts`

- [ ] **Step 1: Write the failing selector test**

Replace the first test inside `describe("Fuwari home feed")` with a limit-and-deduplication test:

```ts
it("selects one pinned post and three non-pinned recent posts in API order", async () => {
  const { selectHomeFeed } = await import(moduleUrl.href);
  const items = [
    { ...post, id: "featured-1", featured: true },
    { ...post, id: "featured-2", featured: true },
    { ...post, id: "latest-1" },
    { ...post, id: "latest-2" },
    { ...post, id: "latest-3" },
    { ...post, id: "latest-4" },
    { ...post, id: "draft", status: "draft" as const },
  ];

  const result = selectHomeFeed(items);
  assert.deepEqual(result.featured.map((item) => item.id), ["featured-1"]);
  assert.deepEqual(result.latest.map((item) => item.id), ["latest-1", "latest-2", "latest-3"]);
});
```

- [ ] **Step 2: Run the selector test and verify RED**

Run:

```powershell
node --experimental-strip-types apps/web/src/home-data.test.ts
```

Expected: FAIL because `selectHomeFeed` currently returns two featured posts and four recent posts.

- [ ] **Step 3: Implement the minimal selector limits**

Change only `selectHomeFeed`:

```ts
export function selectHomeFeed(posts: PostSummary[]) {
  const published = posts.filter((post) => post.status === "published");
  return {
    featured: published.filter((post) => post.featured).slice(0, 1),
    latest: published.filter((post) => !post.featured).slice(0, 3),
  };
}
```

- [ ] **Step 4: Run the selector test and verify GREEN**

Run:

```powershell
node --experimental-strip-types apps/web/src/home-data.test.ts
```

Expected: all `home-data` tests PASS.

- [ ] **Step 5: Commit the selector behavior**

```powershell
git add apps/web/src/home-data.ts apps/web/src/home-data.test.ts
git commit -m "test: define focused homepage feed"
```

### Task 2: Replace the homepage content contract

**Files:**
- Modify: `apps/web/src/home-view.test.tsx`
- Modify: `apps/web/src/public-home.test.ts`
- Modify: `apps/web/src/pages/HomePage.tsx`

- [ ] **Step 1: Write failing render tests for the reduced profile and links**

Extend the test profile to five uniquely titled links, then replace the old duplicate-link test with:

```ts
it("renders only bio and the first four named links", async () => {
  const html = await renderHome([], profile);
  assert.match(html, />A short biography\.<\/p>/);
  assert.doesNotMatch(html, /Homepage intro/);
  assert.equal((html.match(/class="profile-named-link"/g) ?? []).length, 4);
  assert.match(html, />GitHub</);
  assert.match(html, />ORCID</);
  assert.doesNotMatch(html, />Fifth link</);
  assert.doesNotMatch(html, /external-links-card|facet-card|category-list|tag-cloud/);
});
```

Use these five links in `profile.links`:

```ts
links: [
  { title: "GitHub", url: "https://github.com/example", description: "Code", icon: "github" },
  { title: "ORCID", url: "https://orcid.org/0000-0000", description: "Research", icon: "orcid" },
  { title: "Email", url: "https://example.com/contact", description: "Contact", icon: "email" },
  { title: "Website", url: "https://example.com", description: "Home", icon: "website" },
  { title: "Fifth link", url: "https://example.net", description: "Hidden", icon: "link" },
],
```

- [ ] **Step 2: Write failing render tests for optional pin, compact latest rows, and filing footer**

Add:

```ts
it("hides the pinned section when there is no pinned post", async () => {
  const html = await renderHome([{ ...post, id: "latest", slug: "latest", featured: false }], profile);
  assert.doesNotMatch(html, /置顶内容/);
  assert.match(html, /class="home-latest-item"/);
});

it("renders one pinned card, three compact recent rows, and filing links", async () => {
  const posts = [
    post,
    ...Array.from({ length: 4 }, (_, index) => ({
      ...post,
      id: `latest-${index}`,
      slug: `latest-${index}`,
      title: `Latest ${index}`,
      featured: false,
    })),
  ];
  const html = await renderHome(posts, profile);
  assert.equal((html.match(/class="home-latest-item"/g) ?? []).length, 3);
  assert.match(html, /置顶内容/);
  assert.match(html, /晋ICP备2026010770号/);
  assert.match(html, /苏公网安备32011502014222号/);
  assert.match(html, /href="https:\/\/beian\.miit\.gov\.cn\/"/);
  assert.match(html, /recordcode=32011502014222/);
});
```

- [ ] **Step 3: Update the source-level contract and verify RED**

Replace the second `public-home.test.ts` test with:

```ts
it("keeps the focused profile, optional pin, compact latest list and filing footer", () => {
  assert.match(home, /profile-card-public/);
  assert.match(home, /profile\.links\.slice\(0, 4\)/);
  assert.match(home, /feed\.featured\[0\]/);
  assert.match(home, /home-latest-item/);
  assert.match(home, /public-compliance/);
  assert.doesNotMatch(home, /RichDocument|collectPostFacets|external-links-card|facet-card/);
});
```

Run:

```powershell
node apps/api/src/test-runtime.cjs apps/web/src/home-view.test.tsx
node --experimental-strip-types apps/web/src/public-home.test.ts
```

Expected: both commands FAIL because the old homepage still renders the rich introduction, duplicate links, facets, multi-card featured section, and full recent cards.

- [ ] **Step 4: Implement the reduced homepage markup**

In `HomePage.tsx`:

1. Remove imports for `RichDocument` and `collectPostFacets`.
2. Add `const featured = feed.featured[0];` and `const visibleLinks = profile.links.slice(0, 4);`.
3. Keep the avatar/name/accent and render only `profile.bio`.
4. Replace both link presentations with one named-link list:

```tsx
{visibleLinks.length > 0 && (
  <nav className="profile-named-links" aria-label="外部链接">
    {visibleLinks.map((link, index) => (
      <a className="profile-named-link" href={link.url} target="_blank" rel="noopener noreferrer" key={`${link.title}-${link.url}-${index}`}>
        <ProfileLinkIcon icon={link.icon} />
        <span>{link.title}</span>
      </a>
    ))}
  </nav>
)}
```

5. Delete the external-link, category, and tag cards.
6. Render the pinned section only when `featured` exists:

```tsx
{featured && (
  <section className="home-section featured-section">
    <header className="section-heading"><div><p className="section-label">Pinned</p><h2>置顶内容</h2></div></header>
    <PostCard post={featured} featured />
  </section>
)}
```

7. Replace `PostCard` usage in the recent section with compact rows:

```tsx
<div className="home-latest-list">
  {feed.latest.map((item) => (
    <article className="home-latest-item" key={item.id}>
      <time dateTime={item.publishedAt ?? undefined}>{item.publishedAt?.slice(0, 10)}</time>
      <div>
        <span>{item.category}</span>
        <h3><Link to={`/posts/${item.slug}`}>{item.title}</Link></h3>
        {item.excerpt && <p>{item.excerpt}</p>}
      </div>
    </article>
  ))}
</div>
```

8. Return a fragment containing the existing `main` plus the homepage-only footer:

```tsx
<footer className="public-compliance">
  <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">晋ICP备2026010770号</a>
  <span aria-hidden="true">·</span>
  <a href="https://www.beian.gov.cn/portal/registerSystemInfo?recordcode=32011502014222" target="_blank" rel="noopener noreferrer">
    <img src="/beian-police.png" alt="" />
    苏公网安备32011502014222号
  </a>
</footer>
```

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
node apps/api/src/test-runtime.cjs apps/web/src/home-view.test.tsx
node --experimental-strip-types apps/web/src/public-home.test.ts
```

Expected: all homepage render and source-contract tests PASS.

- [ ] **Step 6: Commit the homepage structure**

```powershell
git add apps/web/src/pages/HomePage.tsx apps/web/src/home-view.test.tsx apps/web/src/public-home.test.ts
git commit -m "feat: simplify public homepage content"
```

### Task 3: Add the compact visual treatment and filing icon

**Files:**
- Create: `apps/web/public/beian-police.png`
- Modify: `apps/web/src/public-style.test.ts`
- Modify: `apps/web/src/styles.css`

- [ ] **Step 1: Download the filing icon used by the public-security filing snippet**

Run:

```powershell
Invoke-WebRequest -Uri "https://www.beian.gov.cn/img/new/gongan.png" -OutFile "apps/web/public/beian-police.png"
```

Expected: `apps/web/public/beian-police.png` exists and is a PNG image. If the official host no longer serves this path, stop and obtain the icon from the HTML snippet in the user's National Internet Security Management Service Platform account; do not substitute an unrelated shield icon.

- [ ] **Step 2: Write failing CSS contract tests**

Add to `public-style.test.ts`:

```ts
it("styles named profile links, compact recent rows and the filing footer", () => {
  assert.match(css, /\.profile-named-links\s*\{/);
  assert.match(css, /\.profile-named-link\s*\{/);
  assert.match(css, /\.home-latest-item\s*\{/);
  assert.match(css, /\.public-compliance\s*\{/);
  assert.match(css, /\.public-compliance img\s*\{/);
});
```

Extend the 760px test with:

```ts
assert.match(mobile, /\.profile-named-links\s*\{/);
assert.match(mobile, /\.public-compliance\s*\{/);
```

- [ ] **Step 3: Run the CSS test and verify RED**

Run:

```powershell
node --experimental-strip-types apps/web/src/public-style.test.ts
```

Expected: FAIL because the new selectors do not exist.

- [ ] **Step 4: Add minimal homepage CSS**

Remove the now-unused `.profile-social-links`, `.external-links-card`, `.profile-links`, `.facet-card`, `.category-list`, `.tag-cloud`, `.featured-grid`, and `.home-content footer` blocks. Add:

```css
.profile-named-links { display:grid; gap:5px; margin-top:18px; padding-top:14px; border-top:1px solid var(--line); text-align:left; }
.profile-named-link { display:grid; grid-template-columns:20px minmax(0,1fr); align-items:center; gap:9px; min-height:38px; padding:7px 9px; border-radius:9px; color:var(--muted); font-size:13px; transition:color 140ms ease,background 140ms ease,transform 140ms ease; }
.profile-named-link:hover { color:var(--ocean); background:rgba(91,145,146,.1); transform:translateX(2px); }
.profile-named-link .profile-link-icon { width:17px; height:17px; margin:0; }
.featured-section .post-card.is-featured { display:grid; grid-template-columns:minmax(220px,42%) minmax(0,1fr); }
.home-latest-list { border-top:1px solid var(--line); }
.home-latest-item { display:grid; grid-template-columns:88px minmax(0,1fr); gap:18px; padding:20px 4px; border-bottom:1px solid var(--line); }
.home-latest-item time,.home-latest-item span { color:var(--muted); font-size:var(--public-meta-size); }
.home-latest-item h3 { margin:3px 0 4px; font:700 clamp(20px,2.4vw,27px)/1.3 Georgia,"Songti SC",serif; }
.home-latest-item h3 a:hover { color:var(--ocean); }
.home-latest-item p { display:-webkit-box; overflow:hidden; margin:0; color:var(--muted); font-size:13px; line-height:1.6; -webkit-box-orient:vertical; -webkit-line-clamp:1; }
.public-compliance { display:flex; flex-wrap:wrap; justify-content:center; align-items:center; gap:8px; padding:0 16px 28px; color:var(--muted); font-size:11px; }
.public-compliance a { display:inline-flex; align-items:center; gap:5px; }
.public-compliance a:hover { color:var(--ocean); }
.public-compliance img { width:14px; height:14px; object-fit:contain; }
```

Inside the existing 760px media query add:

```css
.profile-named-links { grid-template-columns:repeat(2,minmax(0,1fr)); }
.featured-section .post-card.is-featured { grid-template-columns:1fr; }
.home-latest-item { grid-template-columns:72px minmax(0,1fr); gap:12px; padding:17px 2px; }
.public-compliance { padding-bottom:22px; }
```

- [ ] **Step 5: Run CSS and homepage tests and verify GREEN**

Run:

```powershell
node --experimental-strip-types apps/web/src/public-style.test.ts
node apps/api/src/test-runtime.cjs apps/web/src/home-view.test.tsx
```

Expected: both test files PASS.

- [ ] **Step 6: Commit the visual treatment**

```powershell
git add apps/web/public/beian-police.png apps/web/src/styles.css apps/web/src/public-style.test.ts
git commit -m "style: refine focused homepage layout"
```

### Task 4: Verify the local Demo

**Files:**
- Verify only; no planned source changes.

- [ ] **Step 1: Run the complete automated suite**

Run:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
git diff --check
```

Expected: every command exits with code 0, no test failures, no type errors, and no whitespace errors.

- [ ] **Step 2: Compare production chunks**

Record the Vite output for `HomePage` and `editor-extensions`. Confirm the homepage source no longer imports `RichDocument`; the editor chunk may remain for article/about routes, but it must not be a static dependency of `HomePage`.

Run:

```powershell
rg -n "RichDocument|editor-extensions" apps/web/src/pages/HomePage.tsx apps/web/dist/assets
```

Expected: no `RichDocument` reference in `HomePage.tsx`.

- [ ] **Step 3: Start the local Demo**

Run:

```powershell
npm.cmd run dev
```

Expected: Vite prints a local URL and the API starts without an uncaught error. Keep the process running for browser verification.

- [ ] **Step 4: Check the Demo at 1280, 760, and 390 pixels**

Verify:

- no horizontal overflow;
- left card shows one bio and no facets;
- named links show no more than four entries;
- one pinned card appears only when pin data exists;
- recent list contains at most three non-pinned posts;
- footer is readable but visually subordinate;
- navigation remains reachable;
- light and dark modes retain readable contrast;
- browser console contains no errors.

- [ ] **Step 5: Leave the Demo local for user review**

Do not push, merge, or deploy. Report the local preview URL and list any acceptance item that could not be verified.
