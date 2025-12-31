-- Migration: Auth ID Normalisation - Step 1
-- Date: 2025-12-30
-- Purpose: Add canonical auth_id (UUID) to users and dependent tables for Supabase Auth migration.

-- 1. Extend Users Table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

COMMENT ON COLUMN users.auth_id IS 'Canonical link to auth.users.id (Supabase Auth)';

-- Index for lookup performance during sync
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- 2. Add Shadow Columns to Primary Dependent Tables
-- This allows us to start writing UUIDs alongside legacy text IDs

ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE evidence_matches ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE actions ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE statutory_documents ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS auth_id UUID;
ALTER TABLE lesson_observations ADD COLUMN IF NOT EXISTS auth_id UUID;

-- 3. Add Performance Indexes
-- These support filtered queries by organization + current authenticated user
CREATE INDEX IF NOT EXISTS idx_org_members_auth_id ON organization_members(organization_id, auth_id);
CREATE INDEX IF NOT EXISTS idx_documents_auth_id ON documents(auth_id);
CREATE INDEX IF NOT EXISTS idx_evidence_matches_auth_id ON evidence_matches(auth_id);
CREATE INDEX IF NOT EXISTS idx_actions_auth_id ON actions(auth_id);
