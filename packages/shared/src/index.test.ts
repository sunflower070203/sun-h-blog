import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adminPostQuerySchema, emptyRichDocument, postInputSchema, publicProfileInputSchema, siteSettingsInputSchema, slugify } from "./index.ts";

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

describe("public profile contract", () => {
  it("trims profile text and accepts local avatars with https links", () => {
    const profile = publicProfileInputSchema.parse({
      displayName: "  Sunny  ",
      avatarUrl: "/media/2026-08-11/550e8400-e29b-41d4-a716-446655440000.png",
      bio: "  Research notes and life updates.  ",
      links: [{
        title: "  GitHub  ",
        url: "  https://github.com/sunny  ",
        description: "  Code and projects  "
      }]
    });

    assert.deepEqual(profile, {
      displayName: "Sunny",
      avatarUrl: "/media/2026-08-11/550e8400-e29b-41d4-a716-446655440000.png",
      bio: "Research notes and life updates.",
      links: [{
        title: "GitHub",
        url: "https://github.com/sunny",
        description: "Code and projects",
        icon: "link"
      }],
      aboutContent: emptyRichDocument,
      introContent: emptyRichDocument
    });
  });

  it("accepts the compact homepage intro and preset link icons", () => {
    const introContent = { type: "doc", content: [{ type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: "Research" }] }] }] }] };
    const profile = publicProfileInputSchema.parse({ displayName: "Sunny", avatarUrl: null, bio: "", links: [{ title: "GitHub", url: "https://github.com/sunny", icon: "github" }], introContent });
    assert.equal(profile.links[0]?.icon, "github");
    assert.deepEqual(profile.introContent, introContent);
  });

  it("rejects unsupported intro nodes and content longer than 600 characters", () => {
    const heading = publicProfileInputSchema.safeParse({ displayName: "Sunny", avatarUrl: null, bio: "", links: [], introContent: { type: "doc", content: [{ type: "heading", attrs: { level: 2 } }] } });
    const longText = publicProfileInputSchema.safeParse({ displayName: "Sunny", avatarUrl: null, bio: "", links: [], introContent: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "x".repeat(601) }] }] } });
    assert.equal(heading.success, false);
    assert.equal(longText.success, false);
  });

  it("rejects unknown profile link icons", () => {
    const result = publicProfileInputSchema.safeParse({ displayName: "Sunny", avatarUrl: null, bio: "", links: [{ title: "Site", url: "https://example.com", icon: "custom" }] });
    assert.equal(result.success, false);
  });

  it("accepts a TipTap document for the editable about page", () => {
    const aboutContent = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "About Sunny" }] }]
    };

    const profile = publicProfileInputSchema.parse({
      displayName: "Sunny",
      avatarUrl: null,
      bio: "",
      links: [],
      aboutContent
    });

    assert.deepEqual(profile.aboutContent, aboutContent);
  });

  it("rejects non-document about content", () => {
    const result = publicProfileInputSchema.safeParse({
      displayName: "Sunny",
      avatarUrl: null,
      bio: "",
      links: [],
      aboutContent: { type: "paragraph", content: [] }
    });

    assert.equal(result.success, false);
  });

  it("rejects javascript links", () => {
    const result = publicProfileInputSchema.safeParse({
      displayName: "Sunny",
      avatarUrl: null,
      bio: "",
      links: [{ title: "Unsafe", url: "javascript:alert(1)" }]
    });

    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(result.error.issues[0]?.message, "链接必须使用 http 或 https");
    }
  });
});
