import { boolean, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { ProfileLink, PublicDesignTokens } from "@sunny/shared";

export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const posts = pgTable("posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  category: text("category").notNull(),
  tags: text("tags").array().notNull().default([]),
  coverUrl: text("cover_url"),
  coverAlt: text("cover_alt").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  status: text("status").notNull().default("进行中"),
  year: text("year").notNull(),
  link: text("link"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  objectKey: text("object_key").notNull().unique(),
  url: text("url").notNull(),
  contentType: text("content_type").notNull(),
  alt: text("alt").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull().default("Sunny"),
  avatarUrl: text("avatar_url"),
  bio: text("bio").notNull().default(""),
  links: jsonb("links").$type<ProfileLink[]>().notNull().default([]),
  aboutContent: jsonb("about_content").$type<Record<string, unknown>>().notNull().default({ type: "doc", content: [{ type: "paragraph" }] }),
  introContent: jsonb("intro_content").$type<Record<string, unknown>>().notNull().default({ type: "doc", content: [{ type: "paragraph" }] }),
  publicBannerUrl: text("public_banner_url").default("/sailboat.png"),
  publicBannerPositionX: real("public_banner_position_x").notNull().default(50),
  publicBannerPositionY: real("public_banner_position_y").notNull().default(50),
  publicColorMode: text("public_color_mode", { enum: ["system", "light", "dark"] }).notNull().default("system"),
  publicDesignTokens: jsonb("public_design_tokens").$type<PublicDesignTokens>().notNull().default({ version: 1, pageWidth: 1120, pagePadding: 24, columnGap: 32, sidebarWidth: 280, bannerHeight: 280, mobileBannerHeight: 180, navHeight: 64, cardRadius: 18, cardOpacity: 0.82, cardBlur: 14, cardShadow: 18, titleSize: 30, bodySize: 16, metaSize: 12, bodyLineHeight: 1.75, coverRatio: 1.78, mobileGap: 16 }),
  publicCustomCss: text("public_custom_css").notNull().default(""),
  wallpaperUrl: text("wallpaper_url"),
  overlay: real("overlay").notNull(),
  blur: real("blur").notNull(),
  position: text("position", { enum: ["center", "top", "bottom"] }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
