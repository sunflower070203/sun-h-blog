import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const shell = readFileSync(new URL("./components/Shell.tsx", import.meta.url), "utf8");
const postPage = readFileSync(new URL("./pages/PostPage.tsx", import.meta.url), "utf8");

describe("Fuwari public visual system", () => {
  it("uses a configurable banner, floating glass navigation and dark theme", () => {
    assert.match(shell, /className={`public-banner/);
    assert.match(css, /\.public-banner\s*\{[^}]*height:\s*var\(--public-banner-height\)/s);
    assert.match(css, /\.site-header\s*\{[^}]*backdrop-filter:\s*blur/s);
    assert.match(css, /data-color-mode=["']dark["']/);
  });

  it("uses token-driven Fuwari cards and two-column homepage", () => {
    assert.match(css, /\.fuwari-card\s*\{[^}]*border-radius:\s*var\(--public-card-radius\)/s);
    assert.match(css, /\.home-layout\s*\{[^}]*grid-template-columns:\s*var\(--public-sidebar-width\)\s+minmax\(0,\s*1fr\)/s);
    assert.match(css, /\.post-cover\s*\{[^}]*aspect-ratio:\s*var\(--public-cover-ratio\)/s);
  });

  it("keeps navigation visible and collapses to one column at 760px", () => {
    const mobile = css.match(/@media\s*\(max-width:\s*760px\)\s*\{([\s\S]*)\}\s*$/)?.[1] ?? "";
    assert.match(mobile, /\.home-layout\s*\{[^}]*grid-template-columns:\s*1fr/s);
    assert.match(mobile, /\.site-header nav\s*\{[^}]*overflow-x:\s*auto/s);
    assert.doesNotMatch(mobile, /\.site-header nav\s*\{[^}]*display:\s*none/s);
    assert.match(mobile, /backdrop-filter:\s*none/);
  });

  it("honors reduced motion and retains article/gallery styles", () => {
    assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.match(css, /\.prose\s+\.image-gallery/);
    for (const className of ["article-page", "article-header", "article-cover", "tags", "inner-page", "empty-state"]) {
      assert.match(postPage, new RegExp(`className=["'][^"']*\\b${className}\\b`));
      assert.match(css, new RegExp(`\\.${className}(?:[\\s:>{.,]|$)`));
    }
  });
});
