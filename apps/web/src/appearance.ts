import { defaultPublicDesignTokens, type PublicAppearance, type PublicDesignTokens } from "@sunny/shared";
import type { CSSProperties } from "react";

export type AppearanceCssVariables = Record<`--public-${string}`, string>;

export const defaultPublicAppearance: PublicAppearance = {
  publicBannerUrl: "/sailboat.png",
  publicBannerPositionX: 50,
  publicBannerPositionY: 50,
  publicColorMode: "system",
  publicDesignTokens: defaultPublicDesignTokens,
  publicCustomCss: ""
};

export function appearanceCssVariables(tokens: PublicDesignTokens): AppearanceCssVariables {
  return {
    "--public-page-width": `${tokens.pageWidth}px`,
    "--public-page-padding": `${tokens.pagePadding}px`,
    "--public-column-gap": `${tokens.columnGap}px`,
    "--public-sidebar-width": `${tokens.sidebarWidth}px`,
    "--public-banner-height": `${tokens.bannerHeight}px`,
    "--public-mobile-banner-height": `${tokens.mobileBannerHeight}px`,
    "--public-nav-height": `${tokens.navHeight}px`,
    "--public-card-radius": `${tokens.cardRadius}px`,
    "--public-card-opacity": `${tokens.cardOpacity}`,
    "--public-card-blur": `${tokens.cardBlur}px`,
    "--public-card-shadow": `${tokens.cardShadow}px`,
    "--public-title-size": `${tokens.titleSize}px`,
    "--public-body-size": `${tokens.bodySize}px`,
    "--public-meta-size": `${tokens.metaSize}px`,
    "--public-body-line-height": `${tokens.bodyLineHeight}`,
    "--public-cover-ratio": `${tokens.coverRatio}`,
    "--public-mobile-gap": `${tokens.mobileGap}px`
  };
}

export function validateLayoutTokens(tokens: PublicDesignTokens) {
  const contentWidth = tokens.pageWidth - (tokens.pagePadding * 2) - tokens.sidebarWidth - tokens.columnGap;
  return contentWidth < 480 ? "右侧内容栏至少需要 480px" : null;
}

export function resolveColorMode(
  configured: PublicAppearance["publicColorMode"],
  visitorChoice: "light" | "dark" | null,
  systemDark: boolean
) {
  if (visitorChoice) return visitorChoice;
  if (configured === "system") return systemDark ? "dark" : "light";
  return configured;
}

export function appearanceStyle(appearance: PublicAppearance) {
  return {
    ...appearanceCssVariables(appearance.publicDesignTokens),
    "--public-banner-x": `${appearance.publicBannerPositionX}%`,
    "--public-banner-y": `${appearance.publicBannerPositionY}%`
  } as CSSProperties;
}
