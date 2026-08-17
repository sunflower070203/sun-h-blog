import { emptyRichDocument, type PostSummary, type PublicProfile } from "@sunny/shared";

const date = "2026-08-17T08:00:00.000Z";

export const demoProfile: PublicProfile = {
  displayName: "Sunny",
  avatarUrl: null,
  bio: "记录学习、研究与日常。",
  links: [
    { title: "GitHub", url: "https://github.com/sunflower070203", description: "代码与项目", icon: "github" },
    { title: "联系我", url: "https://example.com/contact", description: "邮件与其他联系方式", icon: "email" },
    { title: "个人网站", url: "https://sun-h-blog.cn", description: "sun-h-blog.cn", icon: "website" },
  ],
  introContent: {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "这里放一段简短的自我介绍。内容可在后台随时修改。" }] }],
  },
  aboutContent: emptyRichDocument,
};

export const demoPosts: PostSummary[] = [
  { id: "demo-1", title: "从一次实验开始", slug: "demo-experiment", excerpt: "整理问题、过程和结果，也记录那些没有按预期发生的部分。", category: "科研学习", tags: ["实验", "笔记"], coverUrl: "/sailboat.png", coverAlt: "帆船与海面", featured: true, status: "published", publishedAt: date, updatedAt: date },
  { id: "demo-2", title: "课程项目备忘", slug: "demo-course-project", excerpt: "一个项目从想法到可运行版本的简短记录。", category: "科研学习", tags: ["项目", "开发"], coverUrl: null, coverAlt: "", featured: true, status: "published", publishedAt: date, updatedAt: date },
  { id: "demo-3", title: "最近读到的几篇文章", slug: "demo-reading", excerpt: "保留值得回看的观点，以及我仍然没有想清楚的问题。", category: "科研学习", tags: ["阅读", "论文"], coverUrl: null, coverAlt: "", featured: false, status: "published", publishedAt: date, updatedAt: date },
  { id: "demo-4", title: "周末随手拍", slug: "demo-weekend", excerpt: "一些和学习无关的片段。", category: "日常生活", tags: ["生活", "照片"], coverUrl: "/sailboat.png", coverAlt: "帆船与海面", featured: false, status: "published", publishedAt: date, updatedAt: date },
];

export const demoHomeData = { posts: demoPosts, profile: demoProfile };

