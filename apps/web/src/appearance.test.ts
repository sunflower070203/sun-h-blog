import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultPublicDesignTokens } from "@sunny/shared";
import { appearanceCssVariables, resolveColorMode, validateLayoutTokens } from "./appearance.ts";

describe("public appearance model", () => {
  it("maps every token to a scoped CSS custom property", () => {
    const variables = appearanceCssVariables(defaultPublicDesignTokens);
    assert.equal(variables["--public-page-width"], "1120px");
    assert.equal(variables["--public-card-opacity"], "0.82");
    assert.equal(variables["--public-cover-ratio"], "1.78");
    assert.equal(Object.keys(variables).length, Object.keys(defaultPublicDesignTokens).length - 1);
  });

  it("rejects a sidebar and gap combination that leaves too little article space", () => {
    assert.equal(validateLayoutTokens({ ...defaultPublicDesignTokens, pageWidth: 960, sidebarWidth: 360, columnGap: 96 }), "右侧内容栏至少需要 480px");
    assert.equal(validateLayoutTokens(defaultPublicDesignTokens), null);
  });

  it("prefers a visitor choice and otherwise resolves system mode", () => {
    assert.equal(resolveColorMode("dark", "light", false), "light");
    assert.equal(resolveColorMode("system", null, true), "dark");
    assert.equal(resolveColorMode("light", null, true), "light");
  });
});
