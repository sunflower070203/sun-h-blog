import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const postPage = readFileSync(new URL("./pages/PostPage.tsx", import.meta.url), "utf8");

function block(source: string, selector: string, from = 0): string | undefined {
  const start = source.indexOf(selector, from);
  if (start < 0) return undefined;
  const open = source.indexOf("{", start + selector.length);
  if (open < 0) return undefined;
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}" && --depth === 0) return source.slice(start, index + 1);
  }
  return undefined;
}

function rule(selector: string, source = css): string {
  const found = block(source, selector);
  assert.ok(found, `missing ${selector}`);
  return found;
}

function media760(): string {
  let from = 0;
  while (true) {
    const found = block(css, "@media", from);
    assert.ok(found, "missing 760px media query");
    if (/^@media[^\{]*max-width\s*:\s*760px/.test(found)) return found;
    from = css.indexOf(found, from) + found.length;
  }
}

function ruleInMediaAt(width: number, selector: string): string {
  let from = 0;
  while (true) {
    const found = block(css, "@media", from);
    assert.ok(found, `missing ${width}px ${selector} rule`);
    if (new RegExp(`^@media[^\\{]*max-width\\s*:\\s*${width}px`).test(found)) {
      const nested = block(found, selector);
      if (nested) return nested;
    }
    from = css.indexOf(found, from) + found.length;
  }
}

describe("public visual system", () => {
  it("removes selectors that only belonged to the old landing page", () => {
    for (const selector of [".index-hero", ".index-intro", ".index-portrait", ".research-index", ".interest-card", ".about-section", ".hero-actions"]) {
      assert.equal(block(css, selector), undefined, `legacy selector remains: ${selector}`);
    }
  });

  it("uses the restrained desktop stage and journal grid", () => {
    assert.match(rule(".public-stage"), /width\s*:\s*min\(1120px,\s*calc\(100%\s*-\s*48px\)\)/);
    const home = rule(".home-layout");
    assert.match(home, /grid-template-columns\s*:\s*minmax\(190px,\s*260px\)\s+minmax\(0,\s*1fr\)/);
    assert.match(home, /gap\s*:\s*clamp\(/);
    assert.match(home, /padding\s*:/);
    assert.match(rule(".profile-sidebar"), /position\s*:\s*sticky[\s\S]*top\s*:\s*96px/);
    const section = rule(".home-section");
    assert.match(section, /scroll-margin-top\s*:/);
    assert.match(section, /border-(?:top|bottom)\s*:\s*1px/);
  });

  it("keeps the sticky header translucent and interactions quiet", () => {
    const header = rule(".site-header");
    assert.match(header, /position\s*:\s*sticky/);
    assert.match(header, /background\s*:\s*rgba\(/);
    assert.match(header, /backdrop-filter\s*:\s*blur\(/);
    const publicRules = [header, rule(".public-stage"), rule(".home-layout"), rule(".profile-sidebar"), rule(".profile-links a"), rule(".post-card")].join("\n");
    assert.doesNotMatch(publicRules, /(?:linear|radial)-gradient\(/);
    assert.doesNotMatch(rule(".profile-links a"), /box-shadow\s*:/);
    const hover = rule(".profile-links a:hover");
    assert.doesNotMatch(hover, /box-shadow\s*:\s*[^;]*(?:[2-9]\d|\d{3,})px/);
    assert.match(rule(":focus-visible"), /outline\s*:\s*2px\s+solid\s+var\(--ocean\)/);
    assert.doesNotMatch(rule(":focus-visible"), /#[0-9a-f]{3,8}\b/i);
  });

  it("collapses safely at 760px", () => {
    const mobile = media760();
    assert.match(rule(".public-stage", mobile), /width\s*:\s*calc\(100%\s*-\s*32px\)/);
    assert.match(rule(".home-layout", mobile), /grid-template-columns\s*:\s*1fr/);
    assert.match(rule(".profile-sidebar", mobile), /position\s*:\s*static/);
    const nav = rule(".site-header nav", mobile);
    assert.match(nav, /display\s*:\s*flex/);
    assert.match(nav, /overflow-x\s*:\s*auto/);
    assert.match(nav, /white-space\s*:\s*nowrap/);
    assert.match(rule(".profile-links a", mobile), /overflow-wrap\s*:\s*anywhere/);
  });

  it("does not hide public navigation at a wider mobile breakpoint", () => {
    let from = 0;
    while (true) {
      const found = block(css, "@media", from);
      if (!found) break;
      const width = Number(found.match(/^@media[^\{]*max-width\s*:\s*(\d+)px/)?.[1] ?? 0);
      if (width > 760) {
        const nav = block(found, ".site-header nav");
        if (nav) assert.doesNotMatch(nav, /display\s*:\s*none/, `${width}px must not hide public nav`);
      }
      from = css.indexOf(found, from) + found.length;
    }
  });

  it("keeps narrow header rules compatible with the sticky shell", () => {
    let from = 0;
    while (true) {
      const found = block(css, "@media", from);
      if (!found) break;
      const width = Number(found.match(/^@media[^\{]*max-width\s*:\s*(\d+)px/)?.[1] ?? 0);
      if (width > 0 && width <= 800) {
        const header = block(found, ".site-header");
        if (header) {
          assert.doesNotMatch(header, /(?:left|right)\s*:/, `${width}px must not offset sticky header`);
          assert.doesNotMatch(header, /top\s*:\s*(?!0(?:\D|$))/, `${width}px must keep top zero`);
          assert.doesNotMatch(header, /grid-template-columns\s*:/, `${width}px must not restore grid header`);
        }
      }
      from = css.indexOf(found, from) + found.length;
    }
  });

  it("does not retain confirmed unreferenced landing selectors", () => {
    const legacy = [
      ".hero", ".hero-bg", ".hero-overlay", ".hero-content", ".hero-intro", ".hero-meta",
      ".page-shell", ".section", ".section-heading", ".interest-grid", ".project-list",
      ".project-card", ".project-number", ".project-kind", ".project-main", ".project-status",
      ".notes-section", ".note-grid", ".note-card", ".note-top", ".life-section", ".life-copy",
      ".life-list", ".sun-mark", ".about-name", ".about-copy", ".footer-kicker", ".footer-links",
      ".footer-bottom", ".latest-section", ".nav-cta", ".button", ".glass", ".read-link",
    ];
    for (const selector of legacy) {
      assert.doesNotMatch(css, new RegExp(`(^|[\\s,])${selector.replace(".", "\\.")}([\\s:>{.,]|$)`, "m"), `dead selector remains: ${selector}`);
    }
    assert.doesNotMatch(css, /\.brand\s+span\b/, "dead .brand span selector remains");
    assert.doesNotMatch(css, /\.kicker\b/, "dead kicker selector remains");
  });

  it("keeps every PostPage public class backed by CSS", () => {
    for (const className of ["inner-page", "empty-state", "article-page", "article-header", "section-label", "tags", "article-cover"]) {
      assert.match(postPage, new RegExp(`className=["'][^"']*\\b${className}\\b`));
      assert.match(css, new RegExp(`\\.${className}(?:[\\s:>{.,]|$)`), `missing CSS for PostPage .${className}`);
    }
    assert.match(postPage, /<RichDocument\s+content=/);
    assert.match(css, /\.prose(?:[\s:>{.,]|$)/);
    assert.match(css, /\.prose\s+\.image-gallery\s*\{/);
  });

  it("removes gallery breakout before mid-width viewports can overflow", () => {
    const safeGallery = ruleInMediaAt(1100, ".prose .image-gallery");
    assert.ok(
      /margin\s*:\s*[^;}]*\s0(?:\s*;|\s*})/.test(safeGallery)
        || (/margin-left\s*:\s*0/.test(safeGallery) && /margin-right\s*:\s*0/.test(safeGallery)),
      "1100px gallery must reset horizontal margins",
    );
    const narrowGallery = ruleInMediaAt(800, ".prose .image-gallery");
    assert.match(narrowGallery, /grid-template-columns\s*:\s*1fr/);
    assert.doesNotMatch(narrowGallery, /margin(?:-left|-right)?\s*:/, "800px must not be the first margin reset");
  });
});
