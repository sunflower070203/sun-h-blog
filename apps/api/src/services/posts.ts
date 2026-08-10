export type MinimalPost = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  publishedAt: Date | null;
};

export function listPublicPosts<T extends MinimalPost>(records: T[]) {
  return records.filter((post) => post.status === "published" && post.publishedAt);
}

export function publishPost<T extends MinimalPost>(post: T, now = new Date()): T {
  return { ...post, status: "published", publishedAt: now };
}

export function copyPostValues<T extends MinimalPost>(post: T) {
  return {
    ...post,
    id: undefined,
    title: `${post.title}（副本）`,
    slug: `${post.slug}-copy`,
    status: "draft" as const,
    publishedAt: null
  };
}

export function batchStatusValues(status: "draft" | "published", now = new Date()) {
  return {
    status,
    publishedAt: status === "published" ? now : null,
    updatedAt: now
  };
}
