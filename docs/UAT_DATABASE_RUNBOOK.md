# Schoolgle UAT Database Runbook

Schoolgle now has live customer data, so local development and smoke tests must not point at the production Supabase database.

## Environment Model

- **Local**: Supabase CLI + Docker on the developer machine. No real pupil/customer data.
- **UAT/Staging**: Separate Supabase project or persistent Supabase branch. Production-like schema, scrubbed/demo data.
- **Preview**: Optional ephemeral Supabase branch per pull request.
- **Production**: Live customer data only. No ad hoc local testing.

## Local Test Stack

From the repo root:

```powershell
npx supabase start --workdir apps/platform
npx supabase status --workdir apps/platform
```

Copy the local API URL, anon key, and service role key from `supabase status` into local-only environment variables, and set:

```ini
SCHOOLGLE_DB_ENV=local
NEXT_PUBLIC_SCHOOLGLE_DB_ENV=local
```

Then start the app:

```powershell
npm run dev
```

If migrations need to be re-applied from scratch:

```powershell
npx supabase db reset --workdir apps/platform
```

### Current Local Reset Blocker

As of 2026-06-08, `npx supabase start --workdir apps/platform` does not complete from a clean database.

Observed failure:

```text
Applying migration 20260108_create_notifications.sql...
ERROR: relation "organizations" does not exist
```

This means the repository migration folder is missing, or no longer contains in the correct order, the foundational schema that creates core tables such as `organizations`. Until that baseline is repaired, a clean local Supabase reset cannot reproduce production.

## UAT/Staging Project

Create a separate Supabase project or persistent Supabase branch for UAT. Do not use production credentials.

### Current Supabase Branching Blocker

Attempted on 2026-06-08:

- Created Supabase branch `uat-schoolgle-testing` from production project `Schoolgle-Improvement`.
- Branch project ref returned: `melsbkwkxduevtuqxcqw`.
- Supabase reported status `MIGRATIONS_FAILED`.
- A rebase was attempted and failed the same way.
- The failed branch was deleted to avoid ongoing hourly cost.

This points to the same underlying issue as local reset: Supabase Branching is trying to build a clean environment from tracked migrations, but the tracked migration history is not a full production baseline.

Required recovery task:

1. Create a schema-only baseline from the current production database, with no customer/pupil data.
2. Reconcile that baseline with `apps/platform/supabase/migrations`.
3. Ensure `npx supabase db reset --workdir apps/platform` succeeds locally.
4. Retry Supabase Branching after local reset is clean.
5. Only then treat the branch/UAT database as a reliable test environment.

Recommended UAT env values:

```ini
SCHOOLGLE_DB_ENV=uat
NEXT_PUBLIC_SCHOOLGLE_DB_ENV=uat
NEXT_PUBLIC_SUPABASE_URL=<uat-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<uat-anon-or-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<uat-service-role-key>
```

Promotion path:

1. Create migration locally.
2. Apply/reset local Supabase.
3. Push/apply the migration to UAT.
4. Run realistic smoke tests in UAT.
5. Back up production.
6. Apply migration to production in a controlled window.
7. Run production smoke checks.

## Safety Guardrails

Local/dev commands now run `apps/platform/scripts/ensure-non-production-db.mjs`.

The app service-role Supabase client also refuses remote database access unless one of these is true:

- `SCHOOLGLE_DB_ENV` is `local`, `test`, `uat`, `staging`, or `preview`.
- The Supabase URL is local.
- The app is running in an explicit production deployment via `VERCEL_ENV=production` or `SCHOOLGLE_DEPLOY_ENV=production`.
- A one-off emergency override is set: `SCHOOLGLE_ALLOW_PRODUCTION_DB_FROM_LOCAL=true`.

Do not set the emergency override for ordinary development, imports, smoke tests, or QA.

`SCHOOLGLE_DB_ENV=local` is only valid with a local Supabase URL such as `http://127.0.0.1:54321`. Remote non-production databases should use `uat`, `staging`, `preview`, or `test`.
