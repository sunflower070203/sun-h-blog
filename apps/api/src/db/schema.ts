import { boolean, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";

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
  wallpaperUrl: text("wallpaper_url"),
  overlay: real("overlay").notNull(),
  blur: real("blur").notNull(),
  position: text("position", { enum: ["center", "top", "bottom"] }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
