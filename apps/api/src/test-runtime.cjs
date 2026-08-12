const { spawnSync } = require("node:child_process");
const { dirname, join } = require("node:path");

if (!process.geteuid) process.geteuid = () => 0;
process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";
process.env.SESSION_SECRET ??= "test-session-secret-at-least-32-characters";

if (require.main === module) {
  const tsxPackage = require.resolve("tsx/package.json");
  const nodeOptions = [process.env.NODE_OPTIONS, `--require=${__filename.replaceAll("\\", "/")}`].filter(Boolean).join(" ");
  const result = spawnSync(process.execPath, [join(dirname(tsxPackage), "dist", "cli.mjs"), ...process.argv.slice(2)], {
    env: { ...process.env, NODE_OPTIONS: nodeOptions },
    stdio: "inherit"
  });
  process.exit(result.status ?? 1);
}
