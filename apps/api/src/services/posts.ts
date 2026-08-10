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
