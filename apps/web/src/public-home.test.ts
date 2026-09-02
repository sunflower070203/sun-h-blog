import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const home = readFileSync(new URL("./pages/HomePage.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("./components/Shell.tsx", import.meta.url), "utf8");
const card = readFileSync(new URL("./components/PostCard.tsx", import.meta.url), "utf8");

describe("Fuwari public content contract", () => {
  it("keeps the four approved navigation destinations and a separate theme control", () => {
    for (const [path, label] of [["/", "首页"], ["/research", "科研学习"], ["/life", "日常生活"], ["/about", "个人介绍"]]) {
      assert.match(shell, new RegExp(`to=["']${path.replace("/", "\\/")}["'][^>]*>${label}<`));
    }
    assert.match(shell, /className="theme-toggle"/);
  });

  it("keeps the focused profile, optional pin, compact latest list and filing footer", () => {
    assert.match(home, /profile-card-public/);
    assert.match(home, /profile\.links\.slice\(0, 4\)/);
    assert.match(home, /feed\.featured\[0\]/);
    assert.match(home, /home-latest-item/);
    assert.match(home, /public-compliance/);
    assert.doesNotMatch(home, /RichDocument|collectPostFacets|external-links-card|facet-card/);
  });

  it("keeps external links safe and article cards complete", () => {
    assert.match(home, /target="_blank" rel="noopener noreferrer"/);
    for (const field of ["coverUrl", "category", "publishedAt", "excerpt", "tags"]) assert.match(card, new RegExp(`post\\.${field}`));
    assert.match(card, /post-cover/);
  });
});
