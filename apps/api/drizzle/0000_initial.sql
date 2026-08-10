CREATE TABLE IF NOT EXISTS "admins" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "excerpt" text DEFAULT '' NOT NULL,
  "content" jsonb NOT NULL,
  "category" text NOT NULL,
  "tags" text[] DEFAULT '{}' NOT NULL,
  "cover_url" text,
  "cover_alt" text DEFAULT '' NOT NULL,
  "featured" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL CHECK ("status" IN ('draft', 'published')),
  "published_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "excerpt" text NOT NULL,
  "content" jsonb NOT NULL,
  "status" text DEFAULT '进行中' NOT NULL,
  "year" text NOT NULL,
  "link" text,
  "featured" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "object_key" text NOT NULL UNIQUE,
  "url" text NOT NULL,
  "content_type" text NOT NULL,
  "alt" text DEFAULT '' NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "posts_status_published_at_idx" ON "posts" ("status", "published_at" DESC);
