import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRichDocument, type PostSummary, type PublicProfile } from "@sunny/shared";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { Shell } from "./components/Shell";

const moduleUrl = new URL("./pages/HomePage.tsx", import.meta.url);

const profile: PublicProfile = {
  displayName: "Sunny",
  avatarUrl: "/media/2026-08-11/11111111-1111-1111-1111-111111111111.png",
  bio: "A short biography.",
  links: [
    { title: "GitHub", url: "https://github.com/example", description: "Code", icon: "github" },
    { title: "ORCID", url: "https://orcid.org/0000-0000", description: "Research", icon: "orcid" },
    { title: "Email", url: "https://example.com/contact", description: "Contact", icon: "email" },
    { title: "Website", url: "https://example.com", description: "Home", icon: "website" },
    { title: "Fifth link", url: "https://example.net", description: "Hidden", icon: "link" },
  ],
  aboutContent: emptyRichDocument,
  introContent: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Homepage intro" }] }] },
};

const post: PostSummary = {
  id: "post-1",
  title: "Rendered post",
  slug: "rendered-post",
  excerpt: "Rendered excerpt",
  category: "科研学习",
  tags: ["repeat", "repeat"],
  coverUrl: null,
  coverAlt: "",
  featured: true,
  status: "published",
  publishedAt: "2026-08-11T00:00:00.000Z",
  updatedAt: "2026-08-11T00:00:00.000Z",
};

async function renderHome(posts: PostSummary[], value: PublicProfile) {
  const module = await import(moduleUrl.href);
  assert.equal(typeof module.HomeView, "function", "HomeView must be exported");
  return renderToStaticMarkup(
    <MemoryRouter><Shell><module.HomeView posts={posts} profile={value} /></Shell></MemoryRouter>,
  );
}

describe("HomeView server rendering", () => {
  it("renders the focused Fuwari profile and latest section", async () => {
    const html = await renderHome([], { displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyRichDocument, introContent: emptyRichDocument });
    assert.match(html, /class="public-layout"/);
    assert.match(html, /class="site-header"/);
    assert.match(html, /最新文章/);
    assert.doesNotMatch(html, /置顶内容/);
  });

  it("renders only bio and the first four named links", async () => {
    const html = await renderHome([], profile);
    assert.match(html, />A short biography\.<\/p>/);
    assert.doesNotMatch(html, /Homepage intro/);
    assert.equal((html.match(/class="profile-named-link"/g) ?? []).length, 4);
    assert.equal((html.match(/class="profile-named-link" href="[^"]+" target="_blank" rel="noopener noreferrer"/g) ?? []).length, 4);
    assert.match(html, />GitHub</);
    assert.match(html, />ORCID</);
    assert.doesNotMatch(html, />Fifth link</);
    assert.doesNotMatch(html, /external-links-card|facet-card|category-list|tag-cloud/);
    assert.match(html, /class="profile-accent"/);
  });

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
    assert.match(html, /href="https:\/\/beian\.mps\.gov\.cn\/#\/query\/webSearch\?code=32011502014222"/);
    assert.match(html, /src="\/beian-police\.png"/);
  });

  it("links the Fuwari avatar overlay to the about page", async () => {
    const html = await renderHome([], profile);
    assert.match(html, /class="profile-avatar-link"[^>]*href="\/about"/);
    assert.match(html, /class="profile-avatar-overlay"/);
  });

  it("does not expose an admin entry on the public homepage", async () => {
    const html = await renderHome([], profile);
    assert.doesNotMatch(html, /href="\/admin(?:\/login)?"/);
    assert.doesNotMatch(html, />管理<\/a>/);
  });

  it("renders the pinned PostCard and preserves its duplicate tags", async () => {
    const html = await renderHome([post, { ...post, id: "latest", slug: "latest", featured: false }], profile);
    assert.match(html, /href="\/posts\/rendered-post"/);
    assert.ok(html.includes("Rendered post"));
    assert.ok(html.includes("Rendered excerpt"));
    assert.equal((html.match(/#repeat/g) ?? []).length, 2);
    assert.equal((html.match(/<h3>/g) ?? []).length, 2);
  });

  it("marks pinned posts tagged as projects without changing their article route", async () => {
    const html = await renderHome([{ ...post, tags: ["项目"] }], profile);
    assert.match(html, /class="project-badge">项目<\/span>/);
    assert.match(html, /href="\/posts\/rendered-post"/);
  });
});
