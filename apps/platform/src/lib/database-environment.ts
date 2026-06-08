const SAFE_REMOTE_DATABASE_ENVIRONMENTS = new Set(["test", "uat", "staging", "preview"]);

function databaseEnvironment() {
  return (
    process.env.SCHOOLGLE_DB_ENV ||
    process.env.NEXT_PUBLIC_SCHOOLGLE_DB_ENV ||
    ""
  ).trim().toLowerCase();
}

function isExplicitProductionDeployment() {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.SCHOOLGLE_DEPLOY_ENV === "production"
  );
}

function isLocalDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function assertSafeDatabaseEnvironment(context: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const environment = databaseEnvironment();

  if (isExplicitProductionDeployment()) return;
  if (process.env.SCHOOLGLE_ALLOW_PRODUCTION_DB_FROM_LOCAL === "true") return;
  if (!supabaseUrl) return;
  if (isLocalDatabaseUrl(supabaseUrl)) return;
  if (SAFE_REMOTE_DATABASE_ENVIRONMENTS.has(environment)) return;

  const reason = environment
    ? `SCHOOLGLE_DB_ENV is set to "${environment}", which is not allowed for remote local/test database access.`
    : "SCHOOLGLE_DB_ENV is not set to local, test, uat, staging, or preview.";

  throw new Error(
    [
      `Refusing ${context} against a remote Supabase database outside an explicit production deployment.`,
      reason,
      "Use the local Supabase stack or a UAT/staging Supabase project for development and smoke tests.",
      "If this is an intentional emergency production operation, set SCHOOLGLE_ALLOW_PRODUCTION_DB_FROM_LOCAL=true for that one command only.",
    ].join(" "),
  );
}
