import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeSiteSettings } from "./settings.ts";

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
