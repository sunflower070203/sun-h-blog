import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const manifestPath = require.resolve("astro/package.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const cli = join(dirname(manifestPath), manifest.bin.astro);

export async function buildSite({ outDir, snapshotPath }) {
  const child = spawn(process.execPath, [cli, "build", "--outDir", outDir], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, SUNNY_SITE_SNAPSHOT: snapshotPath, ASTRO_TELEMETRY_DISABLED: "1" },
    stdio: "inherit",
  });
  await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error("Astro build failed: " + (signal ?? code)));
    });
  });
}
