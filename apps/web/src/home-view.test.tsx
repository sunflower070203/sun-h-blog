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
    { title: "Same", url: "https://example.com", description: "First", icon: "github" },
    { title: "Same", url: "https://example.com", description: "Second", icon: "website" },
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
  it("renders Fuwari profile, category, tag, featured and latest sections", async () => {
    const html = await renderHome([], { displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyRichDocument, introContent: emptyRichDocument });
    assert.match(html, /class="public-layout"/);
    assert.match(html, /class="site-header"/);
    assert.match(html, /精选内容/);
    assert.match(html, /最新文章/);
    assert.match(html, /分类/);
    assert.match(html, /标签/);
  });

  it("renders safe external links and preserves duplicate link cards", async () => {
    const html = await renderHome([], profile);
    assert.match(html, /class="profile-accent"/);
    assert.match(html, /class="profile-social-links"/);
    assert.match(html, /class="fuwari-card external-links-card"/);
    assert.equal((html.match(/href="https:\/\/example\.com"/g) ?? []).length, 4);
    assert.equal((html.match(/target="_blank"/g) ?? []).length, 4);
    assert.equal((html.match(/rel="noopener noreferrer"/g) ?? []).length, 4);
    assert.ok(html.includes("First") && html.includes("Second"));
    assert.ok(html.indexOf("First") < html.indexOf("Second"));
    assert.equal((html.match(/class="profile-links"/g) ?? []).length, 1);
  });

  it("links the Fuwari avatar overlay to the about page", async () => {
    const html = await renderHome([], profile);
    assert.match(html, /class="profile-avatar-link"[^>]*href="\/about"/);
    assert.match(html, /class="profile-avatar-overlay"/);
  });

  it("actually renders PostCard and preserves duplicate tags", async () => {
    const html = await renderHome([post, { ...post, id: "latest", slug: "latest", featured: false }], profile);
    assert.match(html, /href="\/posts\/rendered-post"/);
    assert.ok(html.includes("Rendered post"));
    assert.ok(html.includes("Rendered excerpt"));
    assert.equal((html.match(/#repeat/g) ?? []).length, 5);
    assert.equal((html.match(/<h3>/g) ?? []).length, 2);
  });

  it("marks pinned posts tagged as projects without changing their article route", async () => {
    const html = await renderHome([{ ...post, tags: ["项目"] }], profile);
    assert.match(html, /class="project-badge">项目<\/span>/);
    assert.match(html, /href="\/posts\/rendered-post"/);
  });
});
