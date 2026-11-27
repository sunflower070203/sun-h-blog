import { defaultPublicDesignTokens, emptyRichDocument } from "@sunny/shared";

const media = "/media/2026-04-23/f0a418a8-75ce-4d01-8942-9522ed515a38.webp";
const paragraph = (text) => ({ type: "paragraph", content: [{ type: "text", text }] });
const document = (...content) => ({ type: "doc", content });
const post = {
  id: "113c1905-bed5-4013-8498-b49f1e104aa7",
  title: "Research note",
  slug: "research-note",
  excerpt: "Findable description",
  category: "科研学习",
  tags: ["项目"],
  coverUrl: media,
  coverAlt: "Existing cover",
  featured: false,
  status: "published",
  publishedAt: "2026-04-23T10:05:30.000Z",
  updatedAt: "2026-04-23T10:05:30.000Z",
  content: document(
    { type: "paragraph", content: [{ type: "text", text: "Complete static article", marks: [{ type: "bold" }] }] },
    { type: "gallery", attrs: { images: [{ src: media, alt: "Existing illustration" }] } },
    paragraph("<script>alert(1)</script>"),
  ),
};
export const fixture = {
  profile: {
    displayName: "Test Sunny",
    avatarUrl: null,
    bio: "Public introduction",
    links: [{ title: "GitHub", url: "https://github.com/sunflower070203", icon: "github" }],
    aboutContent: document(paragraph("Existing biography"), { type: "legacySection", content: [paragraph("Older content")] }),
    introContent: emptyRichDocument,
  },
  appearance: {
    publicBannerUrl: "/sailboat.png",
    publicBannerPositionX: 25,
    publicBannerPositionY: 75,
    publicColorMode: "dark",
    publicDesignTokens: defaultPublicDesignTokens,
    publicCustomCss: "@media (width < 600px) { .profile-bio { letter-spacing: 0.01em; } }",
  },
  posts: [
    post,
    { ...post, id: "439eabaf-484d-4f1d-ae57-df718ad0321a", slug: "中文-笔记", title: "中文笔记", category: "日常生活" },
    { ...post, id: "cede5848-5133-4c4d-93ee-dba7e9816b3e", slug: "private-draft", title: "Never publish this draft", status: "draft", publishedAt: null },
  ],
};
