# Supabase Audit MCP Runbook

Date: 2026-04-27

## Purpose

Use `packages/supabase-mcp-server` for read-only Supabase security assurance. The server is metadata-only and is designed to support GDPR, tenant isolation, and school data protection evidence gathering without returning application records.

## What Changed

- Removed hardcoded Supabase URL and service-role key from the MCP source.
- Removed row-reading/demo tools that could return users, completions, or sample records.
- Replaced them with fixed audit tools for RLS, policies, privileges, storage buckets, sensitive column names, and function security.
- Updated the MCP SDK dependency to a version with no current `npm audit` findings.
- Added a regression test that fails if hardcoded Supabase credentials or row-reading tools are reintroduced.

## Safe Runtime Setup

Use a dedicated read-only Postgres role for audits. Do not use the Supabase service-role key.

Required environment variable:

```powershell
$env:SUPABASE_DB_URL = "postgresql://readonly_audit_user:..."
```

Optional SSL settings:

```powershell
$env:PGSSLMODE = "require"
$env:PGSSL_REJECT_UNAUTHORIZED = "true"
```

Build and test locally:

```powershell
cd packages/supabase-mcp-server
npm test
npm run build
npm audit
```

## MCP Tools

- `get_security_overview`: summary of tables, RLS gaps, storage buckets, sensitive columns, privileges, and security-definer functions.
- `list_rls_status`: public/storage tables with RLS enabled status and estimated row counts only.
- `list_policies`: RLS policies for public/storage schemas.
- `list_table_privileges`: grants to `anon`, `authenticated`, `service_role`, and `public`.
- `list_sensitive_columns`: likely sensitive columns by name pattern only.
- `list_storage_buckets`: bucket public/private status and file restrictions.
- `list_function_security`: security-definer status and execute grantees without function bodies.

## Evidence Pack

For each audit run, archive:

- Date/time and environment audited.
- MCP output from `get_security_overview`.
- Full outputs from each list tool.
- Dependency audit output for `packages/supabase-mcp-server`.
- Any remediation decisions, owner, target date, and DPO/legal review status.

## Current Security Note

The previous MCP source contained a hardcoded Supabase service-role credential. Treat that key as exposed and rotate it before relying on any customer assurance statement. Removing it from source does not remove it from git history or from any systems where it has already been copied.

## Deployment Guardrail

This package is local audit tooling. Updating it does not require changing user login behavior or deploying the platform app. Do not connect this change to a live deployment until the production demo window is clear and the rotated credentials have been confirmed.
