ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "public_banner_url" text DEFAULT '/sailboat.png';
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "public_banner_position_x" real DEFAULT 50 NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "public_banner_position_y" real DEFAULT 50 NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "public_color_mode" text DEFAULT 'system' NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "public_design_tokens" jsonb DEFAULT '{"version":1,"pageWidth":1120,"pagePadding":24,"columnGap":32,"sidebarWidth":280,"bannerHeight":280,"mobileBannerHeight":180,"navHeight":64,"cardRadius":18,"cardOpacity":0.82,"cardBlur":14,"cardShadow":18,"titleSize":30,"bodySize":16,"metaSize":12,"bodyLineHeight":1.75,"coverRatio":1.78,"mobileGap":16}'::jsonb NOT NULL;
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "public_custom_css" text DEFAULT '' NOT NULL;
