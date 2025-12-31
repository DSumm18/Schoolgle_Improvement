-- Migration: Phase 1.2A - MVP-Critical RLS Hardening
-- Date: 2025-12-30

-- 1. DROP LEGACY POLICIES
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['organization_members', 'documents', 'evidence_matches', 'actions', 'notes', 'statutory_documents', 'lesson_observations'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_isolation_1.2a', t);
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'organization_members_select_1.2a', 'organization_members');
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'organization_members_write_1.2a', 'organization_members');
    END LOOP;
END $$;

-- 2. ENABLE RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE statutory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_observations ENABLE ROW LEVEL SECURITY;

-- 3. ANCHOR POLICIES: organization_members
-- SELECT: Users see themselves and colleagues in their organization
CREATE POLICY "organization_members_select_1.2a" ON organization_members
FOR SELECT
USING (
    auth_id = auth.uid() 
    OR user_id = (auth.jwt() ->> 'user_id')
    OR organization_id IN (
        SELECT om.organization_id 
        FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
);

-- WRITE (INSERT/UPDATE/DELETE): Admin-only or self-modification
CREATE POLICY "organization_members_write_1.2a" ON organization_members
FOR ALL
USING (
    auth_id = auth.uid() 
    OR user_id = (auth.jwt() ->> 'user_id')
    OR organization_id IN (
        SELECT om.organization_id 
        FROM organization_members om 
        WHERE (om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id'))
        AND om.role = 'admin'
    )
)
WITH CHECK (
    auth_id = auth.uid() 
    OR user_id = (auth.jwt() ->> 'user_id')
    OR organization_id IN (
        SELECT om.organization_id 
        FROM organization_members om 
        WHERE (om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id'))
        AND om.role = 'admin'
    )
);

-- 4. OPERATIONAL POLICIES (Scoped by organization_members)

-- documents
CREATE POLICY "documents_isolation_1.2a" ON documents
FOR ALL
USING (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
);

-- evidence_matches
CREATE POLICY "evidence_matches_isolation_1.2a" ON evidence_matches
FOR ALL
USING (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
);

-- actions
CREATE POLICY "actions_isolation_1.2a" ON actions
FOR ALL
USING (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
);

-- notes
CREATE POLICY "notes_isolation_1.2a" ON notes
FOR ALL
USING (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
);

-- statutory_documents
CREATE POLICY "statutory_documents_isolation_1.2a" ON statutory_documents
FOR ALL
USING (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
);

-- lesson_observations
CREATE POLICY "lesson_observations_isolation_1.2a" ON lesson_observations
FOR ALL
USING (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT om.organization_id FROM organization_members om 
        WHERE om.auth_id = auth.uid() OR om.user_id = (auth.jwt() ->> 'user_id')
    )
);
