import { postInputSchema, publicAppearanceInputSchema, publicProfileInputSchema } from "@sunny/shared";

export function parseSnapshot({ profile, appearance, posts }) {
  if (!Array.isArray(posts)) throw new Error("Expected an array of public posts");
  const slugs = new Set();
  const published = posts.filter((post) => post.status === "published").map((post) => {
    const parsed = postInputSchema.parse(post);
    if (!isArticleId(post.id)) throw new Error("Invalid public article ID");
    if (slugs.has(parsed.slug)) throw new Error("Duplicate public slug: " + parsed.slug);
    slugs.add(parsed.slug);
    return { ...parsed, id: post.id, publishedAt: post.publishedAt, updatedAt: post.updatedAt };
  });
  return {
    profile: publicProfileInputSchema.parse(profile),
    appearance: publicAppearanceInputSchema.parse(appearance),
    posts: published,
  };
}

export function isArticleId(id) {
  return typeof id === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id);
}

export async function loadPublicSnapshot(origin) {
  const results = await Promise.all(["profile", "appearance", "posts"].map(async (route) => {
    const response = await fetch(new URL("/api/" + route, origin), { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error("Public API " + route + " returned " + response.status);
    return response.json();
  }));
  return parseSnapshot({ profile: results[0], appearance: results[1], posts: results[2] });
}
