import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { buildSite } from "../scripts/astro.mjs";
import { fixture } from "./fixture.mjs";

let work;
let build;
const html = (file) => readFile(join(build, file), "utf8");

before(async () => {
  work = await mkdtemp(join(tmpdir(), "sunny-astro-test-"));
  build = join(work, "site");
  const snapshotPath = join(work, "snapshot.json");
  await writeFile(snapshotPath, JSON.stringify(fixture));
  await buildSite({ snapshotPath, outDir: build });
});
after(async () => { if (work) await rm(work, { recursive: true, force: true }); });

test("the homepage, archive and rich posts ship complete HTML", async () => {
  const [home, archive, about, post, missing] = await Promise.all([
    html("index.html"), html("posts/index.html"), html("about/index.html"),
    html("posts/research-note/index.html"), html("404.html")
  ]);
  assert.match(home, /Test Sunny/);
  assert.doesNotMatch(home, /Research note|置顶内容|最新文章|Existing biography|contribution-grid-snake|Platane\/snk/);
  assert.match(home, /东南大学/);
  assert.match(home, /Wireless Communication &amp; Machine Learning/);
  assert.match(home, /mailto:sunnyhao0203@gmail\.com/);
  assert.match(home, /profile-wordcloud/);
  assert.doesNotMatch(home, /profile-most-used-languages|readme-typing-svg/);
  assert.match(home, /class="moon-motto"[^>]*>[\s\S]*我相信美好的事情每天都在发生[\s\S]*I Believe Good Things Happen Everyday\.[\s\S]*<aside class="moon-profile"/);
  assert.match(home, /class="moon-wallpaper" data-default-wallpaper="\/_astro\/moon\.[^"]+\.webp"/);
  assert.match(home, /<h2 id="home-introduction">个人介绍<\/h2>/);
  assert.match(home, /class="profile-avatar profile-avatar-placeholder"/);
  assert.doesNotMatch(home, /class="profile-bio"/);
  assert.match(about, /<title>关于 · Test Sunny<\/title>/);
  assert.match(archive, /class="post-card fuwari-card/);
  assert.match(post, /class="article-page article-reading"/);
  for (const page of [home, archive, about, post]) {
    assert.match(page, /晋ICP备2026010770号/);
    assert.match(page, /苏公网安备32011502014222号/);
    assert.match(page, /<a href="\/about"[^>]*>关于<\/a>/);
  }
  assert.match(archive, /搜索文章/);
  assert.match(archive, /Research note/);
  assert.match(about, /Existing biography/);
  assert.match(about, /Older content/);
  assert.doesNotMatch(about, /id="home-introduction"|Wireless Communication &amp; Machine Learning/);
  assert.match(home, /@media \(width < 600px\)/);
  assert.match(post, /<strong>Complete static article<\/strong>/);
  assert.match(post, /class="image-gallery"/);
  assert.match(post, /\/media\/2026-04-23\//);
  assert.doesNotMatch(post, /<script>alert\(1\)<\/script>/);
  assert.match(missing, /页面不存在/);
  for (const page of [home, archive, about, post]) {
    assert.doesNotMatch(page, /<astro-island|正在加载|\/api\/posts|admin\/assets|Never publish this draft/);
  }
});

test("the output preserves Unicode article URLs and excludes draft pages", async () => {
  const paths = await readdir(join(build, "posts"));
  assert.ok(paths.some((slug) => decodeURIComponent(slug) === "中文-笔记"));
  assert.ok(!paths.includes("private-draft"));
  assert.match(await html("life/index.html"), /中文笔记/);
});
