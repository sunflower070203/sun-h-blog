ALTER TABLE "site_settings"
  ADD COLUMN IF NOT EXISTS "intro_content" jsonb
  DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb NOT NULL;

UPDATE "site_settings"
SET "links" = COALESCE((
  SELECT jsonb_agg(
    CASE WHEN link ? 'icon' THEN link ELSE link || '{"icon":"link"}'::jsonb END
    ORDER BY ordinal
  )
  FROM jsonb_array_elements("site_settings"."links") WITH ORDINALITY AS entries(link, ordinal)
), '[]'::jsonb)
WHERE EXISTS (
  SELECT 1 FROM jsonb_array_elements("site_settings"."links") AS entries(link)
  WHERE NOT (link ? 'icon')
);
