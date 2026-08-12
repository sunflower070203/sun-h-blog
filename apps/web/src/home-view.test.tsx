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
    { title: "Same", url: "https://example.com", description: "First" },
    { title: "Same", url: "https://example.com", description: "Second" },
  ],
  aboutContent: emptyRichDocument,
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
  it("renders a profile home with a neutral pinned-post empty state", async () => {
    const html = await renderHome([], { displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyRichDocument });
    assert.match(html, /class="public-layout"/);
    assert.match(html, /class="site-header"/);
    assert.match(html, /<h2>置顶文章<\/h2>/);
    assert.match(html, /还没有置顶文章。/);
    assert.match(html, /<h2>简介<\/h2>/);
    assert.match(html, /<h2>外部链接<\/h2>/);
    assert.doesNotMatch(html, /<h2>(?:科研学习|日常生活)<\/h2>/);
  });

  it("renders safe external links and preserves duplicate link cards", async () => {
    const html = await renderHome([], profile);
    assert.equal((html.match(/href="https:\/\/example\.com"/g) ?? []).length, 2);
    assert.equal((html.match(/target="_blank"/g) ?? []).length, 2);
    assert.equal((html.match(/rel="noopener noreferrer"/g) ?? []).length, 2);
    assert.ok(html.includes("First") && html.includes("Second"));
    assert.ok(html.indexOf("First") < html.indexOf("Second"));
    assert.equal((html.match(/class="profile-links"/g) ?? []).length, 1);
  });

  it("actually renders PostCard and preserves duplicate tags", async () => {
    const html = await renderHome([post], profile);
    assert.match(html, /href="\/posts\/rendered-post"/);
    assert.ok(html.includes("Rendered post"));
    assert.ok(html.includes("Rendered excerpt"));
    assert.equal((html.match(/#repeat/g) ?? []).length, 2);
  });
});
