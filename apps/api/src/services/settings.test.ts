import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { emptyRichDocument } from "@sunny/shared";
import { defaultPublicProfile, normalizePublicProfile, normalizeSiteSettings } from "./settings.ts";

describe("site settings", () => {
  it("clamps appearance values to readable bounds", () => {
    assert.deepEqual(normalizeSiteSettings({
      wallpaperUrl: null,
      overlay: 0.05,
      blur: 30,
      position: "top"
    }), {
      wallpaperUrl: null,
      overlay: 0.35,
      blur: 30,
      position: "top"
    });
  });
});

describe("public profile", () => {
  it("provides a neutral default profile", () => {
    assert.deepEqual(defaultPublicProfile, {
      displayName: "Sunny",
      avatarUrl: null,
      bio: "",
      links: [],
      aboutContent: emptyRichDocument
    });
  });

  it("rejects unsafe external links", () => {
    assert.throws(() => normalizePublicProfile({
      displayName: "Sunny",
      avatarUrl: null,
      bio: "",
      links: [{ title: "Bad", url: "data:text/html,bad", description: "" }]
    }));
  });
});
