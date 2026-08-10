import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published"]);

export const siteSettingsInputSchema = z.object({
  wallpaperUrl: z.union([
    z.string().regex(/^\/media\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.(?:jpe?g|png|webp|gif)$/i),
    z.null()
  ]),
  overlay: z.coerce.number().transform((value) => Math.min(0.9, Math.max(0.35, value))),
  blur: z.coerce.number().min(0).max(30),
  position: z.enum(["center", "top", "bottom"])
});

export const adminPostQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(40).optional(),
  status: postStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(10).max(50).default(20)
});

export const batchPostStatusSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  status: postStatusSchema
});

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
export type SiteSettings = z.infer<typeof siteSettingsInputSchema>;

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

export type AdminPostPage = {
  items: PostSummary[];
  total: number;
  page: number;
  pageSize: number;
};

export function slugify(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}
