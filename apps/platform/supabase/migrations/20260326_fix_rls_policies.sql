-- Fix RLS Policies for school_data_connections
--
-- Issue: Service role client should bypass RLS but may be blocked
-- Solution: Add explicit policy to allow service role operations

BEGIN;

-- Drop existing policy
DROP POLICY IF EXISTS school_data_connections_org_access ON public.school_data_connections;

-- Create new policy that allows:
-- 1. Service role to bypass RLS (via service role key)
-- 2. Users in organization_members to see their org's connections
CREATE POLICY school_data_connections_org_access ON public.school_data_connections
    FOR ALL
    TO anon, authenticated
    USING (
        organization_id IN (
            SELECT om.organization_id::uuid
            FROM organization_members om
            WHERE om.user_id = auth.uid()::text
        )
    );

-- Add separate policy for service role (bypasses RLS)
CREATE POLICY school_data_connections_service_role ON public.school_data_connections
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;

-- Verify policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'school_data_connections';
