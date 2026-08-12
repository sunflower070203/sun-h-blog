ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS display_name text DEFAULT 'Sunny' NOT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS bio text DEFAULT '' NOT NULL;
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb NOT NULL;
