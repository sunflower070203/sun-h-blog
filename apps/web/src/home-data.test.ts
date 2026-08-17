import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRichDocument, type PostSummary, type PublicProfile } from "@sunny/shared";

const moduleUrl = new URL("./home-data.ts", import.meta.url);

const post: PostSummary = {
  id: "post-1",
  title: "A post",
  slug: "a-post",
  excerpt: "Excerpt",
  category: "科研学习",
  tags: [],
  coverUrl: null,
  coverAlt: "",
  featured: false,
  status: "published",
  publishedAt: "2026-08-11T00:00:00.000Z",
  updatedAt: "2026-08-11T00:00:00.000Z",
};

const profile: PublicProfile = {
  displayName: "Sunny",
  avatarUrl: null,
  bio: "Profile bio",
  links: [],
  aboutContent: emptyRichDocument,
  introContent: emptyRichDocument,
};

describe("loadHomeData", () => {
  it("preserves the profile when loading posts fails", async () => {
    const { loadHomeData } = await import(moduleUrl.href);
    const result = await loadHomeData({
      listPosts: async () => { throw new Error("posts unavailable"); },
      getProfile: async () => profile,
    });

    assert.deepEqual(result.posts, []);
    assert.deepEqual(result.profile, profile);
  });

  it("preserves posts when loading the profile fails", async () => {
    const { loadHomeData } = await import(moduleUrl.href);
    const result = await loadHomeData({
      listPosts: async () => [post],
      getProfile: async () => { throw new Error("profile unavailable"); },
    });

    assert.deepEqual(result.posts, [post]);
    assert.deepEqual(result.profile, {
      displayName: "Sunny",
      avatarUrl: null,
      bio: "",
      links: [],
      aboutContent: emptyRichDocument,
      introContent: emptyRichDocument,
    });
  });
});

describe("local demo fallback", () => {
  it("uses demo content only for an entirely empty development response", async () => {
    const { resolveHomeData } = await import(moduleUrl.href);
    const empty = { posts: [], profile: { displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyRichDocument, introContent: emptyRichDocument } };
    const demo = { posts: [post], profile };

    assert.deepEqual(resolveHomeData(empty, demo, true), demo);
    assert.deepEqual(resolveHomeData(empty, demo, false), empty);
  });

  it("never replaces real posts or profile data", async () => {
    const { resolveHomeData } = await import(moduleUrl.href);
    const demo = { posts: [{ ...post, id: "demo" }], profile: { ...profile, bio: "Demo" } };
    const realPosts = { posts: [post], profile: { displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyRichDocument, introContent: emptyRichDocument } };
    const realProfile = { posts: [], profile };

    assert.deepEqual(resolveHomeData(realPosts, demo, true), realPosts);
    assert.deepEqual(resolveHomeData(realProfile, demo, true), realProfile);
  });
});

describe("selectHomePosts", () => {
  it("accepts only exact public categories", async () => {
    const homeData = await import(moduleUrl.href);
    assert.equal(typeof homeData.selectHomePosts, "function", "selectHomePosts must be exported");

    const posts = [
      { ...post, id: "research", category: "科研学习" },
      { ...post, id: "research-near", category: "科研学习 " },
      { ...post, id: "life", category: "日常生活" },
      { ...post, id: "life-near", category: "日常" },
    ];

    const result = homeData.selectHomePosts(posts);
    assert.deepEqual(result.researchPosts.map((item) => item.id), ["research"]);
    assert.deepEqual(result.lifePosts.map((item) => item.id), ["life"]);
  });

  it("keeps input order and limits each category to five posts", async () => {
    const homeData = await import(moduleUrl.href);
    assert.equal(typeof homeData.selectHomePosts, "function", "selectHomePosts must be exported");

    const posts = Array.from({ length: 7 }, (_, index) => ({
      ...post,
      id: `research-${index}`,
      category: "科研学习",
    })).concat(Array.from({ length: 7 }, (_, index) => ({
      ...post,
      id: `life-${index}`,
      category: "日常生活",
    })));

    const result = homeData.selectHomePosts(posts);
    assert.deepEqual(result.researchPosts.map((item) => item.id), [
      "research-0", "research-1", "research-2", "research-3", "research-4",
    ]);
    assert.deepEqual(result.lifePosts.map((item) => item.id), [
      "life-0", "life-1", "life-2", "life-3", "life-4",
    ]);
  });
});

describe("selectPinnedPosts", () => {
  it("keeps at most six published featured posts in API order", async () => {
    const { selectPinnedPosts } = await import(moduleUrl.href);
    const items = Array.from({ length: 8 }, (_, index) => ({ ...post, id: `pin-${index}`, featured: true }));
    items.splice(2, 0, { ...post, id: "draft-pin", featured: true, status: "draft" });
    items.splice(3, 0, { ...post, id: "not-pin", featured: false });
    assert.deepEqual(selectPinnedPosts(items).map((item) => item.id), ["pin-0", "pin-1", "pin-2", "pin-3", "pin-4", "pin-5"]);
  });
});

describe("Fuwari home feed", () => {
  it("keeps featured posts in a separate selection and removes them from the latest feed", async () => {
    const { selectHomeFeed } = await import(moduleUrl.href);
    const featured = { ...post, id: "featured", featured: true };
    const latest = { ...post, id: "latest", featured: false };
    const result = selectHomeFeed([featured, latest]);
    assert.deepEqual(result.featured.map((item) => item.id), ["featured"]);
    assert.deepEqual(result.latest.map((item) => item.id), ["latest"]);
  });

  it("counts categories and tags from published posts only", async () => {
    const { collectPostFacets } = await import(moduleUrl.href);
    const facets = collectPostFacets([
      { ...post, id: "one", category: "科研学习", tags: ["AI", "论文"] },
      { ...post, id: "two", category: "科研学习", tags: ["AI"] },
      { ...post, id: "draft", status: "draft", category: "日常生活", tags: ["私密"] }
    ]);
    assert.deepEqual(facets.categories, [{ name: "科研学习", count: 2 }]);
    assert.deepEqual(facets.tags, [{ name: "AI", count: 2 }, { name: "论文", count: 1 }]);
  });
});

describe("applyHomeData", () => {
  it("does not submit data after cleanup", async () => {
    const homeData = await import(moduleUrl.href);
    assert.equal(typeof homeData.applyHomeData, "function", "applyHomeData must be exported");

    let resolve!: (value: { posts: PostSummary[]; profile: PublicProfile }) => void;
    const pending = new Promise<{ posts: PostSummary[]; profile: PublicProfile }>((done) => { resolve = done; });
    const received: Array<{ posts: PostSummary[]; profile: PublicProfile }> = [];
    const cleanup = homeData.applyHomeData(pending, (data) => received.push(data));

    cleanup();
    resolve({ posts: [post], profile });
    await pending;
    await Promise.resolve();

    assert.deepEqual(received, []);
  });
});
