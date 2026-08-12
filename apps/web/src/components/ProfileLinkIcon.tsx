import React from "react";
import type { ProfileLinkIcon as IconName } from "@sunny/shared";

const labels: Record<IconName, string> = { github: "GH", email: "@", website: "W", scholar: "S", orcid: "iD", linkedin: "in", link: "↗" };

export function ProfileLinkIcon({ icon }: { icon: IconName }) {
  return <svg className="profile-link-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" />
    <text x="12" y="15" textAnchor="middle" fontSize={icon === "linkedin" ? 7 : 8} fontWeight="600" fill="currentColor">{labels[icon]}</text>
  </svg>;
}
