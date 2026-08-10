import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminPostQuerySchema, postInputSchema, siteSettingsInputSchema, slugify } from "./index.ts";

describe("post input", () => {
  it("rejects a post without a title", () => {
    const result = postInputSchema.safeParse({
      title: "",
      slug: "entry",
      excerpt: "summary",
      content: { type: "doc", content: [] },
      category: "研究",
      tags: [],
      status: "draft"
    });
    assert.equal(result.success, false);
  });

  it("keeps Chinese text and normalizes spaces in slugs", () => {
    assert.equal(slugify(" 我的 第一篇 Post "), "我的-第一篇-post");
  });

  it("accepts locally uploaded media URLs", () => {
    const result = postInputSchema.safeParse({
      title: "测试文章",
      slug: "test-post",
      excerpt: "",
      content: { type: "doc", content: [] },
      category: "科研学习",
      tags: ["随笔"],
      coverUrl: "/media/2026-07-29/b33e6f59-76e7-4bed-b06e-9265fe8fd9c4.png",
      coverAlt: "测试封面",
      featured: false,
      status: "draft"
    });

    assert.equal(result.success, true);
  });
});

describe("admin contracts", () => {
  it("keeps wallpaper controls inside readable bounds", () => {
    const settings = siteSettingsInputSchema.parse({ wallpaperUrl: null, overlay: 0.1, blur: 8, position: "center" });
    assert.equal(settings.overlay, 0.35);
  });

  it("coerces pagination query parameters", () => {
    assert.deepEqual(adminPostQuerySchema.parse({ page: "2", pageSize: "20", status: "draft" }), {
      page: 2,
      pageSize: 20,
      status: "draft"
    });
  });
});
