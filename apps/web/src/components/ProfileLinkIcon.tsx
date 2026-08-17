import React from "react";
import type { ProfileLinkIcon as IconName } from "@sunny/shared";

export function ProfileLinkIcon({ icon }: { icon: IconName }) {
  return <svg className="profile-link-icon" data-icon={icon} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {icon === "github" && <path fill="currentColor" stroke="none" d="M12 2.5a9.7 9.7 0 0 0-3.07 18.9c.48.09.66-.2.66-.46v-1.88c-2.7.59-3.27-1.14-3.27-1.14-.44-1.12-1.08-1.42-1.08-1.42-.88-.6.07-.59.07-.59.97.07 1.49 1 1.49 1 .87 1.48 2.27 1.05 2.82.8.09-.62.34-1.05.61-1.29-2.15-.24-4.41-1.07-4.41-4.79 0-1.06.38-1.92 1-2.6-.1-.25-.43-1.23.1-2.56 0 0 .81-.26 2.67.99A9.2 9.2 0 0 1 12 7.13c.82 0 1.64.11 2.42.33 1.85-1.25 2.67-.99 2.67-.99.53 1.33.2 2.31.1 2.56.62.68 1 1.54 1 2.6 0 3.73-2.27 4.54-4.43 4.78.35.3.66.89.66 1.79v2.74c0 .26.17.55.67.46A9.7 9.7 0 0 0 12 2.5Z" />}
    {icon === "email" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>}
    {icon === "website" && <><circle cx="12" cy="12" r="9" /><path d="M3.5 9h17M3.5 15h17M12 3c2.3 2.5 3.4 5.5 3.4 9S14.3 18.5 12 21c-2.3-2.5-3.4-5.5-3.4-9S9.7 5.5 12 3Z" /></>}
    {icon === "scholar" && <><path d="m2.5 9 9.5-5 9.5 5-9.5 5-9.5-5Z" /><path d="M6 11.1v5.1c3.4 2.4 8.6 2.4 12 0v-5.1M21.5 9v6" /></>}
    {icon === "orcid" && <><circle cx="12" cy="12" r="9" /><circle cx="8.2" cy="8" r="1" fill="currentColor" stroke="none" /><path d="M8.2 11v5M11.3 8v8h2.4a4 4 0 0 0 0-8h-2.4Z" /></>}
    {icon === "linkedin" && <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="7.3" cy="8" r="1" fill="currentColor" stroke="none" /><path d="M7.3 11v6M11 17v-6M11 13.6c.8-1.7 5.5-2 5.5 1.8V17" /></>}
    {icon === "link" && <><path d="m9.5 14.5 5-5" /><path d="M6.7 16.8 5.3 18.2a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M17.3 7.2l1.4-1.4a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0" /> </>}
  </svg>;
}
