-- Migration: Auth ID Normalisation - Step 3 (Hybrid RLS)
-- Date: 2025-12-30
-- Purpose: Update RLS helper functions to support both legacy text IDs and new canonical UUIDs.

-- 1. Update is_organization_member to check both ID columns
create or replace function is_organization_member(
  user_id_param text,
  org_id uuid
) returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from organization_members
    where (user_id = user_id_param or (auth_id is not null and auth_id::text = user_id_param))
      and organization_id = org_id
  );
$$;

-- 2. Update get_connection_user_id to be more robust
-- It should try to find any available user identifier in the context
create or replace function get_connection_user_id() returns text
language plpgsql
stable
as $$
declare
  user_id_val text;
begin
  -- Try to get from connection-local setting (set by MCP server)
  user_id_val := current_setting('app.user_id', true);
  
  -- If not set, try to get from JWT claims
  if user_id_val is null then
    begin
      -- Try 'sub' (Supabase standard)
      user_id_val := current_setting('request.jwt.claims', true)::json->>'sub';
      
      -- Fallback to 'user_id' (Legacy/Firebase)
      if user_id_val is null then
        user_id_val := current_setting('request.jwt.claims', true)::json->>'user_id';
      end if;
    exception
      when others then
        user_id_val := null;
    end;
  end if;
  
  return user_id_val;
end;
$$;

-- 3. Add a helper for native UUID checking (more efficient for new data)
create or replace function get_auth_id() returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$;
