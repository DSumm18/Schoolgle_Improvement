# Accessing dfe_data Schema in Supabase

## Issue
Supabase client can't directly access custom schemas like `dfe_data`. We need to either:
1. Create views in `public` schema (recommended)
2. Use SQL queries via RPC
3. Use REST API with schema prefix

## Solution 1: Create Views (Recommended)

Run this SQL in Supabase SQL Editor:

```sql
-- Create views in public schema pointing to dfe_data tables
CREATE OR REPLACE VIEW public.schools AS 
SELECT * FROM dfe_data.schools;

CREATE OR REPLACE VIEW public.area_demographics AS 
SELECT * FROM dfe_data.area_demographics;

CREATE OR REPLACE VIEW public.local_authority_finance AS 
SELECT * FROM dfe_data.local_authority_finance;

CREATE OR REPLACE VIEW public.school_area_links AS 
SELECT * FROM dfe_data.school_area_links;

-- Grant access to service role
GRANT SELECT ON public.schools TO service_role;
GRANT SELECT ON public.area_demographics TO service_role;
GRANT SELECT ON public.local_authority_finance TO service_role;
GRANT SELECT ON public.school_area_links TO service_role;
```

After creating views, the Supabase client can access them normally.

## Solution 2: Use SQL Queries (Alternative)

If views aren't created, use SQL queries:

```typescript
// Use Supabase SQL Editor or create RPC function
const { data } = await dfeClient.rpc('exec_sql', {
  query: 'SELECT * FROM dfe_data.schools WHERE urn = 100000'
});
```

## Solution 3: REST API with Schema (Direct)

Use REST API directly:

```typescript
const response = await fetch(
  `${process.env.DFE_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
  {
    method: 'POST',
    headers: {
      'apikey': process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!,
      'Authorization': `Bearer ${process.env.DFE_SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: 'SELECT * FROM dfe_data.schools WHERE urn = 100000'
    })
  }
);
```

## Recommended: Create Views

**Easiest approach:** Create the views in Supabase SQL Editor, then use the client normally.

