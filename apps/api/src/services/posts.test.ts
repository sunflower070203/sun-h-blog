import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { listPublicPosts, publishPost } from "./posts.ts";

const records = [
  { id: "1", title: "draft", slug: "draft", status: "draft" as const, publishedAt: null },
  { id: "2", title: "live", slug: "live", status: "published" as const, publishedAt: new Date() }
];

describe("post service policy", () => {
  it("never exposes drafts through public listings", () => {
    assert.deepEqual(listPublicPosts(records).map((post) => post.slug), ["live"]);
  });

  it("sets status and timestamp when publishing", () => {
    const published = publishPost(records[0]!, new Date("2026-01-01T00:00:00Z"));
    assert.equal(published.status, "published");
    assert.equal(published.publishedAt?.toISOString(), "2026-01-01T00:00:00.000Z");
  });
});
