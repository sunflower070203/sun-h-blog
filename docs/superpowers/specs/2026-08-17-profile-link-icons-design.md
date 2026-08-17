# Profile Link Icons Design

The public profile card shows the administrator-configured external links directly below the short introduction. Each link uses an inline SVG for its selected preset: GitHub, email, website, Google Scholar, ORCID, LinkedIn, or a generic link. Inline SVG keeps the feature dependency-free, theme-aware, and accessible.

The compact icon row is the fast navigation surface. The existing detailed external-links card remains below it for titles and descriptions. Links open in a new tab with `noopener noreferrer`, expose their configured title as the accessible name, wrap on narrow screens, and fall back to the generic link symbol for the generic preset.

The admin form remains the source of truth and continues to select one preset per link. No database or API change is required.

