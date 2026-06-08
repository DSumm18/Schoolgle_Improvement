import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(appDir, "..", "..");

for (const envFile of [
  path.join(repoRoot, ".env.local"),
  path.join(appDir, ".env.local"),
]) {
  if (fs.existsSync(envFile)) dotenv.config({ path: envFile, override: false });
}

const safeRemoteEnvironments = new Set(["test", "uat", "staging", "preview"]);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const databaseEnvironment = (
  process.env.SCHOOLGLE_DB_ENV ||
  process.env.NEXT_PUBLIC_SCHOOLGLE_DB_ENV ||
  ""
).trim().toLowerCase();

function isLocalDatabaseUrl(url) {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

if (!supabaseUrl) {
  console.error("[db safety] NEXT_PUBLIC_SUPABASE_URL is not configured.");
  process.exit(1);
}

if (isLocalDatabaseUrl(supabaseUrl)) {
  console.log("[db safety] Local Supabase URL detected. Safe for local development.");
  process.exit(0);
}

if (safeRemoteEnvironments.has(databaseEnvironment)) {
  console.log(`[db safety] ${databaseEnvironment.toUpperCase()} Supabase environment declared. Safe for local development.`);
  process.exit(0);
}

if (process.env.SCHOOLGLE_ALLOW_PRODUCTION_DB_FROM_LOCAL === "true") {
  console.warn("[db safety] Production override is set. Use only for explicit emergency maintenance.");
  process.exit(0);
}

console.error("[db safety] Refusing to start local/dev tooling against a remote Supabase database.");
console.error("[db safety] Use a local Supabase URL, or set SCHOOLGLE_DB_ENV=test, uat, staging, or preview for a non-production remote database.");
console.error("[db safety] Do not use the production Supabase project for local development or smoke tests.");
process.exit(1);
