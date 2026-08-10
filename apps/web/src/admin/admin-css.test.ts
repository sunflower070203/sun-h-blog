import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync(new URL("./admin.css", import.meta.url), "utf8");

describe("admin editor responsive feedback", () => {
  it("keeps the save status visible on narrow screens", () => {
    assert.match(css, /\.editor-top>span\{display:block(?:;|\})/);
  });
});
