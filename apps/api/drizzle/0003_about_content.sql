ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "about_content" jsonb
  DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb NOT NULL;
