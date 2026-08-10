import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published"]);

export const postInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(180).regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u),
  excerpt: z.string().trim().max(500).default(""),
  content: z.record(z.unknown()),
  category: z.string().trim().min(1).max(40),
  tags: z.array(z.string().trim().min(1).max(30)).max(12),
  coverUrl: z.union([
    z.string().url(),
    z.string().regex(/^\/media\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.(?:jpe?g|png|webp|gif)$/i)
  ]).nullable().optional(),
  coverAlt: z.string().trim().max(160).default(""),
  featured: z.boolean().default(false),
  status: postStatusSchema.default("draft")
});

export type PostInput = z.infer<typeof postInputSchema>;
export type PostStatus = z.infer<typeof postStatusSchema>;

export type PostSummary = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  coverUrl: string | null;
  coverAlt: string;
  featured: boolean;
  status: PostStatus;
  publishedAt: string | null;
  updatedAt: string;
};

export type PostDetail = PostSummary & {
  content: Record<string, unknown>;
};

export function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}
