import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const homePage = readFileSync(new URL("./pages/HomePage.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("./components/Shell.tsx", import.meta.url), "utf8");
const postCard = readFileSync(new URL("./components/PostCard.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");
const legacySite = new URL("./content/site.ts", import.meta.url);

function findCssBlock(source: string, selector: string, fromIndex = 0): string | undefined {
  const selectorIndex = source.indexOf(selector, fromIndex);
  if (selectorIndex < 0) return undefined;

  const openingBrace = source.indexOf("{", selectorIndex + selector.length);
  if (openingBrace < 0) return undefined;

  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(selectorIndex, index + 1);
  }
  return undefined;
}

function attribute(tag: string, name: string): string | undefined {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`))?.[1];
}

describe("public home content contract", () => {
  it("removes hard-coded legacy positioning copy", () => {
    for (const oldCopy of [
      "Southeast University",
      "Year 2",
      "东南大学",
      "东大本科生",
      "Research first",
      "不是展示答案",
    ]) {
      assert.ok(
        !homePage.includes(oldCopy),
        `HomePage must not hard-code the legacy AI placeholder: ${oldCopy}`,
      );
    }
  });

  it("uses exactly the approved public navigation links", () => {
    const nav = shell.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)?.[1];
    assert.ok(nav, "Shell must contain a nav element");

    const links = [...nav.matchAll(/<NavLink\b([^>]*)>([\s\S]*?)<\/NavLink>/g)].map((match) => ({
      href: attribute(match[1], "to"),
      text: match[2].replace(/<[^>]+>/g, "").trim(),
    }));
    assert.ok(links.length === 4, "nav must contain exactly four links");
    assert.ok(
      JSON.stringify(links) === JSON.stringify([
        { href: "/", text: "首页" },
        { href: "/research", text: "科研学习" },
        { href: "/life", text: "日常生活" },
        { href: "/about", text: "个人介绍" },
      ]),
      "nav anchors must match the approved labels and hrefs",
    );

    for (const oldLabel of ["研究", "文章", "关于", "写作后台"]) {
      assert.ok(!nav.includes(`>${oldLabel}<`), `nav must not show legacy label: ${oldLabel}`);
    }
  });

  it("defines the approved responsive home grid", () => {
    const desktopBlock = findCssBlock(css, ".home-layout");
    assert.ok(desktopBlock, "missing desktop .home-layout block");
    assert.ok(
      /grid-template-columns\s*:\s*[^;}]+(?:;|})/.test(desktopBlock),
      "desktop .home-layout needs grid columns",
    );

    let mediaBlock: string | undefined;
    let searchFrom = 0;
    while (true) {
      const candidate = findCssBlock(css, "@media", searchFrom);
      if (!candidate) break;
      if (/^@media[^\{]*max-width\s*:\s*760px/.test(candidate)) {
        mediaBlock = candidate;
        break;
      }
      searchFrom = css.indexOf(candidate, searchFrom) + candidate.length;
    }
    assert.ok(mediaBlock, "missing max-width: 760px media block");

    const mobileHomeBlock = findCssBlock(mediaBlock, ".home-layout");
    assert.ok(mobileHomeBlock, "760px media block needs .home-layout");
    assert.ok(
      /grid-template-columns\s*:\s*1fr\s*(?:;|})/.test(mobileHomeBlock),
      "mobile .home-layout must use one column",
    );
  });

  it("opens every external card link safely in a new tab", () => {
    const anchors = homePage.match(/<a\b[^>]*>/g) ?? [];
    const externalAnchors = anchors.filter((tag) =>
      /\bhref\s*=\s*(?:\{\s*link\.url\s*\}|["']https?:\/\/)/.test(tag),
    );
    assert.ok(externalAnchors.length > 0, "HomePage needs at least one external card link");

    for (const tag of externalAnchors) {
      assert.ok(attribute(tag, "target") === "_blank", "external link needs target=_blank");
      const relTokens = new Set((attribute(tag, "rel") ?? "").split(/\s+/).filter(Boolean));
      assert.ok(relTokens.has("noopener"), "external link rel needs noopener");
      assert.ok(relTokens.has("noreferrer"), "external link rel needs noreferrer");
    }
  });

  it("keeps only pinned posts on the homepage and the quiet admin footer", () => {
    assert.match(homePage, /selectPinnedPosts/);
    assert.doesNotMatch(homePage, /id=["'](?:research|life|about)["']/);
    assert.match(homePage, /<footer>[\s\S]*?<Link\s+to=["']\/admin["']>\s*管理\s*<\/Link>[\s\S]*?<\/footer>/);
  });

  it("renders optional profile fields conditionally without replacement biography copy", () => {
    assert.match(homePage, /profile\.avatarUrl\s*&&\s*<img\b/);
    assert.doesNotMatch(homePage, /profile\.bio/);
    assert.match(homePage, /<RichDocument\s+content=\{profile\.aboutContent\}/);
    assert.match(homePage, /<h2>个人介绍<\/h2>/);
    assert.match(homePage, /<h2>外部链接<\/h2>/);
    assert.ok(homePage.indexOf("个人介绍") < homePage.indexOf("外部链接"));
  });

  it("keeps PostCard limited to the approved article fields", () => {
    assert.ok(!postCard.includes("post.category"), "PostCard must not render category");
    assert.ok(!postCard.includes("read-link"), "PostCard must not render a decorative read link");
    assert.ok(!postCard.includes("阅读全文"), "PostCard must not render the removed call to action");
    assert.match(postCard, /post\.tags\.length\s*>\s*0\s*&&/);
  });

  it("removes the legacy static site content source", () => {
    assert.equal(existsSync(legacySite), false, "content/site.ts must be deleted");
    assert.ok(!homePage.includes("content/site"), "HomePage must not reference content/site");
  });
});
