CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "wallpaper_url" text,
  "overlay" real NOT NULL,
  "blur" real NOT NULL,
  "position" text NOT NULL CHECK ("position" IN ('center', 'top', 'bottom')),
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
