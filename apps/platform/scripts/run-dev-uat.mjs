#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const appDirectory = resolve(scriptDirectory, "..");

process.env.SCHOOLGLE_DB_ENV ||= "uat";
process.env.NEXT_PUBLIC_SCHOOLGLE_DB_ENV ||= "uat";

const safetyCheck = spawnSync(
  process.execPath,
  [resolve(scriptDirectory, "ensure-non-production-db.mjs")],
  {
    cwd: appDirectory,
    env: process.env,
    stdio: "inherit",
  },
);

if (safetyCheck.status !== 0) {
  process.exit(safetyCheck.status ?? 1);
}

const nextCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const devHost = process.env.SCHOOLGLE_DEV_HOST || "127.0.0.1";
const devServer = spawn(nextCommand, ["next", "dev", "--webpack", "--hostname", devHost], {
  cwd: appDirectory,
  env: process.env,
  stdio: "inherit",
  shell: process.platform === "win32",
});

devServer.on("exit", (code) => {
  process.exit(code ?? 0);
});

devServer.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
