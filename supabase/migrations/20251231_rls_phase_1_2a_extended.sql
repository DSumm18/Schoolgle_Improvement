-- Migration: Phase 1.2A (Extended) - Additive RLS Hardening (Final)
-- Date: 2025-12-31
-- Purpose: Add auth_id column and correct identity resolution to use organization_members directly.
-- Constraints: No joins to users table for auth, delta-only, internal inference.

BEGIN;

-- ============================================================================
-- 1. SCHEMA UPDATE: Add auth_id to organization_members
-- ============================================================================

ALTER TABLE public.organization_members
ADD COLUMN IF NOT EXISTS auth_id uuid;

CREATE INDEX IF NOT EXISTS org_members_auth_id_idx ON public.organization_members (auth_id);

-- ============================================================================
-- 2. HELPER FUNCTION HARDENING: get_user_accessible_orgs
-- ============================================================================

-- Primary identity anchor is organization_members.
CREATE OR REPLACE FUNCTION public.get_user_accessible_orgs() 
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  current_auth_id uuid;
  current_user_id text;
  user_org_ids uuid[];
  org_type text;
  child_org_ids uuid[];
BEGIN
  -- 1. Infer identity internally
  current_auth_id := auth.uid();
  current_user_id := (auth.jwt()->>'user_id');

  -- 2. Get root memberships (Identity Anchor: organization_members)
  -- Checks: auth.uid() (UUID), user_id claim (text), and auth.uid()::text (fallback)
  SELECT array_agg(organization_id)
  INTO user_org_ids
  FROM public.organization_members
  WHERE auth_id = current_auth_id 
     OR user_id = current_user_id 
     OR user_id = current_auth_id::text;
  
  -- If no memberships, return empty
  IF user_org_ids IS NULL OR array_length(user_org_ids, 1) IS NULL THEN
    RETURN ARRAY[]::uuid[];
  END IF;
  
  -- 3. Recursive Hierarchy Walk (MAT / LA Logic)
  FOREACH org_type IN ARRAY (
    SELECT array_agg(DISTINCT o.organization_type)
    FROM public.organizations o
    WHERE o.id = ANY(user_org_ids)
  )
  LOOP
    -- If user belongs to a Trust: Add all child_organization_ids
    IF org_type = 'trust' THEN
      SELECT array_agg(id)
      INTO child_org_ids
      FROM public.organizations
      WHERE parent_organization_id = ANY(user_org_ids) 
      AND organization_type = 'school';
      
      IF child_org_ids IS NOT NULL THEN
        user_org_ids := user_org_ids || child_org_ids;
      END IF;
    END IF;
    
    -- If user belongs to an LA: Add schools with data sharing
    IF org_type = 'local_authority' THEN
      SELECT array_agg(id)
      INTO child_org_ids
      FROM public.organizations
      WHERE parent_organization_id = ANY(user_org_ids)
      AND data_sharing_agreement = true;
      
      IF child_org_ids IS NOT NULL THEN
        user_org_ids := user_org_ids || child_org_ids;
      END IF;
    END IF;
  END LOOP;
  
  -- Return unique set
  RETURN ARRAY(SELECT DISTINCT unnest(user_org_ids));
END;
$$;

-- ============================================================================
-- 3. ADDITIVE POLICY UPDATES (Identity Correction: No joins to users)
-- ============================================================================

-- Subscriptions: Super admin full access (No Join to public.users)
DROP POLICY IF EXISTS "Super admins full access subscriptions" ON subscriptions;
CREATE POLICY "Super admins full access subscriptions" ON subscriptions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()::text 
       OR sa.user_id = (auth.jwt()->>'user_id')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()::text 
       OR sa.user_id = (auth.jwt()->>'user_id')
  )
);

-- Invoices: Super admin full access (No Join to public.users)
DROP POLICY IF EXISTS "Super admins full access invoices" ON invoices;
CREATE POLICY "Super admins full access invoices" ON invoices
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()::text 
       OR sa.user_id = (auth.jwt()->>'user_id')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE sa.user_id = auth.uid()::text 
       OR sa.user_id = (auth.jwt()->>'user_id')
  )
);

-- Super Admins self-view (No Join to public.users)
DROP POLICY IF EXISTS "Super admins can view super_admins table" ON super_admins;
CREATE POLICY "Super admins can view super_admins table" ON super_admins
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.super_admins sa
    WHERE (sa.user_id = auth.uid()::text OR sa.user_id = (auth.jwt()->>'user_id'))
    AND sa.access_level IN ('admin', 'owner')
  )
);

-- API Keys: Admin management (Anchor: organization_members)
DROP POLICY IF EXISTS "Admins can manage API keys for their organizations" ON api_keys;
CREATE POLICY "Admins can manage API keys for their organizations" ON api_keys
FOR ALL USING (
  organization_id = ANY(public.get_user_organization_ids())
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = api_keys.organization_id
    AND (om.auth_id = auth.uid() OR om.user_id = (auth.jwt()->>'user_id') OR om.user_id = auth.uid()::text)
    AND om.role = 'admin'
  )
)
WITH CHECK (
  organization_id = ANY(public.get_user_organization_ids())
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = api_keys.organization_id
    AND (om.auth_id = auth.uid() OR om.user_id = (auth.jwt()->>'user_id') OR om.user_id = auth.uid()::text)
    AND om.role = 'admin'
  )
);

COMMIT;
