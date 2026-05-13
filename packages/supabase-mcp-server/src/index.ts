/**
 * Schoolgle Supabase audit MCP server.
 *
 * This server is intentionally metadata-only. It does not use a Supabase
 * service-role API key and does not expose tools that return application rows.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Pool } from "pg";

const CONNECTION_STRING =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!CONNECTION_STRING) {
  throw new Error(
    "Missing read-only database connection. Set SUPABASE_DB_URL, DATABASE_URL, or POSTGRES_URL.",
  );
}

const pool = new Pool({
  connectionString: CONNECTION_STRING,
  ssl:
    process.env.PGSSLMODE === "disable"
      ? false
      : { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED === "true" },
});

const server = new Server(
  {
    name: "schoolgle-supabase-audit-mcp-server",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

async function runAuditQuery<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = await pool.connect();
  try {
    await client.query("begin read only");
    await client.query("set local statement_timeout = '10s'");
    const result = await client.query<T>(sql, params);
    await client.query("commit");
    return result.rows;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

function asJson(data: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function getRlsStatus() {
  return runAuditQuery(`
    select
      n.nspname as schema_name,
      c.relname as table_name,
      c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as rls_forced,
      coalesce(s.n_live_tup, 0) as estimated_rows,
      obj_description(c.oid, 'pg_class') as table_comment
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_stat_user_tables s on s.relid = c.oid
    where c.relkind in ('r', 'p')
      and n.nspname in ('public', 'storage')
    order by n.nspname, c.relname
    limit 500
  `);
}

async function getPolicies() {
  return runAuditQuery(`
    select
      schemaname as schema_name,
      tablename as table_name,
      policyname as policy_name,
      permissive,
      roles,
      cmd,
      qual as using_expression,
      with_check as with_check_expression
    from pg_policies
    where schemaname in ('public', 'storage')
    order by schemaname, tablename, policyname
    limit 1000
  `);
}

async function getTablePrivileges() {
  return runAuditQuery(`
    select
      table_schema,
      table_name,
      grantee,
      privilege_type
    from information_schema.table_privileges
    where table_schema in ('public', 'storage')
      and grantee in ('anon', 'authenticated', 'service_role', 'public')
    order by table_schema, table_name, grantee, privilege_type
    limit 1000
  `);
}

async function getSensitiveColumns() {
  return runAuditQuery(`
    select
      table_schema,
      table_name,
      column_name,
      data_type,
      is_nullable
    from information_schema.columns
    where table_schema in ('public', 'storage')
      and column_name ~* '(email|name|pupil|child|children|parent|phone|address|postcode|dob|birth|medical|health|safeguard|send|dbs|token|secret|key|password|refresh|access|credential|transcript|recording|voice|photo|image)'
    order by table_schema, table_name, ordinal_position
    limit 1000
  `);
}

async function getStorageBuckets() {
  return runAuditQuery(`
    select
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types,
      created_at,
      updated_at
    from storage.buckets
    order by public desc, name
    limit 200
  `);
}

async function getFunctionSecurity() {
  return runAuditQuery(`
    select
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as arguments,
      p.prosecdef as security_definer,
      p.provolatile as volatility,
      coalesce(array_agg(distinct acl.grantee::text) filter (where acl.grantee is not null), '{}') as execute_grantees
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    left join aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl on true
    where n.nspname in ('public', 'storage')
    group by n.nspname, p.proname, p.oid
    order by n.nspname, p.proname
    limit 1000
  `);
}

async function getOverview() {
  const [rls, policies, privileges, sensitiveColumns, buckets, functions] =
    await Promise.all([
      getRlsStatus(),
      getPolicies(),
      getTablePrivileges(),
      getSensitiveColumns(),
      getStorageBuckets(),
      getFunctionSecurity(),
    ]);

  const tablesWithoutRls = rls.filter((row) => row.rls_enabled === false);
  const publicBuckets = buckets.filter((row) => row.public === true);
  const securityDefinerFunctions = functions.filter(
    (row) => row.security_definer === true,
  );

  return {
    checkedAt: new Date().toISOString(),
    summary: {
      tablesChecked: rls.length,
      tablesWithoutRls: tablesWithoutRls.length,
      policiesChecked: policies.length,
      relevantPrivileges: privileges.length,
      sensitiveColumnsFound: sensitiveColumns.length,
      storageBucketsChecked: buckets.length,
      publicStorageBuckets: publicBuckets.length,
      securityDefinerFunctions: securityDefinerFunctions.length,
    },
    findingsToReview: {
      tablesWithoutRls,
      publicBuckets,
      securityDefinerFunctions,
    },
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_security_overview",
      description:
        "Return a metadata-only summary of RLS, policies, privileges, sensitive columns, storage buckets, and security-definer functions.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_rls_status",
      description:
        "List public/storage tables and whether Row Level Security is enabled. Returns estimated row counts only.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_policies",
      description: "List RLS policies for public and storage schemas.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_table_privileges",
      description:
        "List table privileges granted to anon, authenticated, service_role, or public roles.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_sensitive_columns",
      description:
        "List likely sensitive columns by name pattern without returning row data.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_storage_buckets",
      description:
        "List Supabase storage bucket configuration, including public/private status.",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "list_function_security",
      description:
        "List public/storage functions, security-definer status, and execute grantees without function bodies.",
      inputSchema: { type: "object", properties: {} },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "get_security_overview":
        return asJson(await getOverview());
      case "list_rls_status":
        return asJson(await getRlsStatus());
      case "list_policies":
        return asJson(await getPolicies());
      case "list_table_privileges":
        return asJson(await getTablePrivileges());
      case "list_sensitive_columns":
        return asJson(await getSensitiveColumns());
      case "list_storage_buckets":
        return asJson(await getStorageBuckets());
      case "list_function_security":
        return asJson(await getFunctionSecurity());
      default:
        throw new Error(`Unknown audit tool: ${request.params.name}`);
    }
  } catch (error) {
    return {
      ...asJson({
        error: error instanceof Error ? error.message : "Unknown error",
        tool: request.params.name,
      }),
      isError: true,
    };
  }
});

async function main() {
  console.error("Schoolgle Supabase audit MCP server starting...");
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Schoolgle Supabase audit MCP server running.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => undefined);
  });
