import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProfileLinkIcon as IconName } from "@sunny/shared";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileLinkIcon } from "./ProfileLinkIcon";

const presets: IconName[] = ["github", "email", "website", "scholar", "orcid", "linkedin", "link"];

describe("ProfileLinkIcon", () => {
  it("renders every preset as SVG geometry without text abbreviations", () => {
    for (const icon of presets) {
      const html = renderToStaticMarkup(<ProfileLinkIcon icon={icon} />);
      assert.match(html, /data-icon="[^"]+"/);
      assert.match(html, /<(?:path|circle|rect|line|polyline)\b/);
      assert.doesNotMatch(html, /<text\b/);
    }
  });
});

