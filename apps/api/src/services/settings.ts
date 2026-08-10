import { siteSettingsInputSchema, type SiteSettings } from "@sunny/shared";

export const defaultSiteSettings: SiteSettings = {
  wallpaperUrl: null,
  overlay: 0.62,
  blur: 8,
  position: "center"
};

export function normalizeSiteSettings(input: unknown): SiteSettings {
  return siteSettingsInputSchema.parse(input);
}
