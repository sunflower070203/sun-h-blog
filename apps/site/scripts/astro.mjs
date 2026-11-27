import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chmod, cp, mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const manifestPath = require.resolve("astro/package.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const cli = join(dirname(manifestPath), manifest.bin.astro);

export async function buildSite({ outDir, snapshotPath }) {
  // Astro renames its intermediate files, which must stay on the same filesystem.
  const workspace = new URL("../", import.meta.url);
  const localOutput = await mkdtemp(fileURLToPath(new URL(".astro-release-", workspace)));
  try {
    const child = spawn(process.execPath, [cli, "build", "--outDir", localOutput], {
      cwd: workspace,
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
    await cp(localOutput, outDir, { recursive: true });
    await chmod(outDir, 0o755);
  } finally {
    await rm(localOutput, { recursive: true, force: true });
  }
}
