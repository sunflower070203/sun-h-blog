import { z } from "zod";

export const postStatusSchema = z.enum(["draft", "published"]);

export const localMediaUrlSchema = z.string().regex(/^\/media\/\d{4}-\d{2}-\d{2}\/[0-9a-f-]+\.(?:jpe?g|png|webp|gif)$/i);

export const httpUrlSchema = z.string().trim().max(500).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}, "链接必须使用 http 或 https");

export const profileLinkIconSchema = z.enum(["github", "email", "website", "scholar", "orcid", "linkedin", "link"]);

export const profileLinkSchema = z.object({
  title: z.string().trim().min(1).max(80),
  url: httpUrlSchema,
  description: z.string().trim().max(160).default(""),
  icon: profileLinkIconSchema.default("link")
});

export const emptyRichDocument: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

export const richDocumentSchema = z.record(z.unknown()).refine((value) => (
  value.type === "doc" && (value.content === undefined || Array.isArray(value.content))
), "个人介绍必须是有效的富文本文档");

const introNodeTypes = new Set(["doc", "paragraph", "text", "bulletList", "listItem"]);
const introMarkTypes = new Set(["bold", "link"]);

function validateIntroNode(value: unknown): { valid: boolean; textLength: number } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { valid: false, textLength: 0 };
  const node = value as Record<string, unknown>;
  if (typeof node.type !== "string" || !introNodeTypes.has(node.type)) return { valid: false, textLength: 0 };
  if (node.type === "text" && typeof node.text !== "string") return { valid: false, textLength: 0 };
  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks) || node.marks.some((mark) => !mark || typeof mark !== "object" || !introMarkTypes.has((mark as Record<string, unknown>).type as string))) return { valid: false, textLength: 0 };
  }
  if (node.content !== undefined && !Array.isArray(node.content)) return { valid: false, textLength: 0 };
  let textLength = node.type === "text" ? (node.text as string).length : 0;
  for (const child of (node.content as unknown[] | undefined) ?? []) {
    const result = validateIntroNode(child);
    if (!result.valid) return result;
    textLength += result.textLength;
  }
  return { valid: node.type !== "doc" || Array.isArray(node.content), textLength };
}

export const introContentSchema = z.record(z.unknown()).superRefine((value, context) => {
  const result = validateIntroNode(value);
  if (!result.valid) context.addIssue({ code: "custom", message: "首页简介包含不支持的格式" });
  if (result.textLength > 600) context.addIssue({ code: "custom", message: "首页简介不能超过 600 个字符" });
});

export const publicProfileInputSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  avatarUrl: z.union([localMediaUrlSchema, z.null()]),
  bio: z.string().trim().max(600),
  links: z.array(profileLinkSchema).max(12),
  aboutContent: richDocumentSchema.default(emptyRichDocument),
  introContent: introContentSchema.default(emptyRichDocument)
});

export const siteSettingsInputSchema = z.object({
  wallpaperUrl: z.union([
    localMediaUrlSchema,
    z.null()
  ]),
  overlay: z.coerce.number().transform((value) => Math.min(0.9, Math.max(0.35, value))),
  blur: z.coerce.number().min(0).max(30),
  position: z.enum(["center", "top", "bottom"])
});

const boundedNumber = (minimum: number, maximum: number) => z.coerce.number()
  .finite()
  .transform((value) => Math.min(maximum, Math.max(minimum, value)));

export const defaultPublicDesignTokens = {
  version: 1 as const,
  pageWidth: 1120,
  pagePadding: 24,
  columnGap: 32,
  sidebarWidth: 280,
  bannerHeight: 280,
  mobileBannerHeight: 180,
  navHeight: 64,
  cardRadius: 18,
  cardOpacity: 0.82,
  cardBlur: 14,
  cardShadow: 18,
  titleSize: 30,
  bodySize: 16,
  metaSize: 12,
  bodyLineHeight: 1.75,
  coverRatio: 1.78,
  mobileGap: 16
};

export const publicDesignTokensSchema = z.object({
  version: z.literal(1).default(1),
  pageWidth: boundedNumber(960, 1440),
  pagePadding: boundedNumber(12, 64),
  columnGap: boundedNumber(20, 96),
  sidebarWidth: boundedNumber(220, 360),
  bannerHeight: boundedNumber(180, 480),
  mobileBannerHeight: boundedNumber(120, 280),
  navHeight: boundedNumber(52, 88),
  cardRadius: boundedNumber(0, 32),
  cardOpacity: boundedNumber(0.55, 1),
  cardBlur: boundedNumber(0, 30),
  cardShadow: boundedNumber(0, 40),
  titleSize: boundedNumber(22, 48),
  bodySize: boundedNumber(14, 22),
  metaSize: boundedNumber(10, 16),
  bodyLineHeight: boundedNumber(1.4, 2.2),
  coverRatio: boundedNumber(1, 2.4),
  mobileGap: boundedNumber(10, 32)
});

const safePublicCssSchema = z.string().max(12000).superRefine((value, context) => {
  if (/@import\b/i.test(value)) context.addIssue({ code: "custom", message: "高级 CSS 不允许使用 @import" });
  if (/url\(\s*["']?\s*(?:https?:)?\/\//i.test(value)) context.addIssue({ code: "custom", message: "高级 CSS 不允许加载外部资源" });
});

export const publicAppearanceInputSchema = z.object({
  publicBannerUrl: z.union([localMediaUrlSchema, z.literal("/sailboat.png"), z.null()]),
  publicBannerPositionX: boundedNumber(0, 100),
  publicBannerPositionY: boundedNumber(0, 100),
  publicColorMode: z.enum(["system", "light", "dark"]),
  publicDesignTokens: publicDesignTokensSchema,
  publicCustomCss: safePublicCssSchema
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
    localMediaUrlSchema
  ]).nullable().optional(),
  coverAlt: z.string().trim().max(160).default(""),
  featured: z.boolean().default(false),
  status: postStatusSchema.default("draft")
});

export type PostInput = z.infer<typeof postInputSchema>;
export type PostStatus = z.infer<typeof postStatusSchema>;
export type SiteSettings = z.infer<typeof siteSettingsInputSchema>;
export type PublicDesignTokens = z.infer<typeof publicDesignTokensSchema>;
export type PublicAppearance = z.infer<typeof publicAppearanceInputSchema>;
export type ProfileLink = z.infer<typeof profileLinkSchema>;
export type ProfileLinkIcon = z.infer<typeof profileLinkIconSchema>;
export type PublicProfile = z.infer<typeof publicProfileInputSchema>;

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
