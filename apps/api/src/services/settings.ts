import {
  emptyRichDocument,
  defaultPublicDesignTokens,
  publicAppearanceInputSchema,
  publicProfileInputSchema,
  siteSettingsInputSchema,
  type PublicAppearance,
  type PublicProfile,
  type SiteSettings
} from "@sunny/shared";

export const defaultPublicProfile: PublicProfile = {
  displayName: "Sunny",
  avatarUrl: null,
  bio: "",
  links: [],
  aboutContent: emptyRichDocument,
  introContent: emptyRichDocument
};

export const defaultSiteSettings: SiteSettings = {
  wallpaperUrl: null,
  overlay: 0.62,
  blur: 8,
  position: "center"
};

export const defaultPublicAppearance: PublicAppearance = {
  publicBannerUrl: "/sailboat.png",
  publicBannerPositionX: 50,
  publicBannerPositionY: 50,
  publicColorMode: "system",
  publicDesignTokens: defaultPublicDesignTokens,
  publicCustomCss: ""
};

export function normalizeSiteSettings(input: unknown): SiteSettings {
  return siteSettingsInputSchema.parse(input);
}

export function normalizePublicProfile(input: unknown): PublicProfile {
  return publicProfileInputSchema.parse(input);
}

export function normalizePublicAppearance(input: unknown): PublicAppearance {
  return publicAppearanceInputSchema.parse(input);
}
