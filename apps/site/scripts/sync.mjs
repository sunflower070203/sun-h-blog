import { createHash } from "node:crypto";
import { access, chmod, mkdir, mkdtemp, readlink, rename, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { buildSite } from "./astro.mjs";
import { isArticleId, loadPublicSnapshot } from "../src/snapshot.mjs";

const origin = process.env.SUNNY_API_ORIGIN;
const root = resolve(process.env.SUNNY_SITE_ROOT || "/site-output");
const interval = Number(process.env.SUNNY_SITE_REFRESH_MS || 10_000);
const readiness = join(tmpdir(), "sunny-site-ready");
if (!origin || !Number.isInteger(interval) || interval < 1_000) {
  throw new Error("Set SUNNY_API_ORIGIN and a refresh interval of at least 1000 ms");
}

await mkdir(root, { recursive: true });
await rm(readiness, { force: true });

// Nginx serves the static article associated with the ID the API still publishes.
// A newly reused slug cannot expose HTML from a deleted article.
createServer(async (request, response) => {
  if (!/^\/api\/posts\/[^/?#]+$/.test(request.url ?? "")) {
    response.writeHead(404).end();
    return;
  }
  try {
    const article = await fetch(new URL(request.url, origin), { signal: AbortSignal.timeout(3_000) });
    if (article.status === 404) {
      response.writeHead(404).end();
      return;
    }
    if (!article.ok) throw new Error("Public article lookup failed");
    const { id, status } = await article.json();
    if (status !== "published" || !isArticleId(id)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(204, { "X-Sunny-Article-Id": id }).end();
  } catch {
    response.writeHead(503).end();
  }
}).listen(8081);

async function readPointer(name) {
  try {
    const target = await readlink(join(root, name));
    if (!/^release-[A-Za-z0-9]+[/\\]site$/.test(target)) throw new Error("Invalid site pointer");
    return target;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return null;
  }
}

async function replacePointer(name, target, stage) {
  const pending = join(stage, name);
  await symlink(target, pending, "dir");
  await rename(pending, join(root, name));
}

async function publish(snapshot, data) {
  const stage = await mkdtemp(join(root, "release-"));
  try {
    const snapshotPath = join(stage, "snapshot.json");
    const outDir = join(stage, "site");
    await writeFile(snapshotPath, data, { mode: 0o600 });
    await buildSite({ snapshotPath, outDir });
    await access(join(outDir, "index.html"));
    await access(join(outDir, "404.html"));
    const articles = join(outDir, "_published");
    await mkdir(articles);
    for (const post of snapshot.posts) {
      await rename(join(outDir, "posts", post.slug, "index.html"), join(articles, post.id + ".html"));
    }
    await chmod(stage, 0o755);
    const retired = await readPointer("previous");
    const current = await readPointer("current");
    if (current) await replacePointer("previous", current, stage);
    await replacePointer("current", basename(stage) + "/site", stage);
    if (retired && retired !== current) {
      await rm(join(root, dirname(retired)), { recursive: true, force: true }).catch((error) => {
        console.error("Could not clean up the retired static output:", error.message);
      });
    }
  } catch (error) {
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
}

let activeDigest;
while (true) {
  try {
    const snapshot = await loadPublicSnapshot(origin);
    const data = JSON.stringify(snapshot);
    const digest = createHash("sha256").update(data).digest("hex");
    if (digest !== activeDigest) {
      await publish(snapshot, data);
      await writeFile(readiness, digest);
      activeDigest = digest;
      console.log("Published static site with " + snapshot.posts.length + " public articles.");
    }
  } catch (error) {
    console.error("Static refresh failed; keeping the last complete site:", error.message);
  }
  await setTimeout(interval);
}
