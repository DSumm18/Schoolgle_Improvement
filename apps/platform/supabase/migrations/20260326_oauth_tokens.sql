-- OAuth Token Storage for Google Drive and Microsoft OneDrive
--
-- Stores OAuth tokens for cloud storage integrations
-- Tokens are encrypted at rest using pgcrypto

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- OAuth tokens table
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User & Organization
    user_id TEXT NOT NULL,  -- Supabase auth user ID
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Provider
    provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),

    -- OAuth tokens (encrypted)
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Provider-specific data
    provider_user_id TEXT,  -- Google/Microsoft user ID
    provider_email TEXT,    -- User's email from provider

    -- Scope
    scopes TEXT[] DEFAULT '{}',  -- Granted scopes (e.g., ['drive.readonly'])

    -- Metadata
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_refreshed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,

    -- One token per user per provider per organization
    UNIQUE(user_id, organization_id, provider)
);

COMMENT ON TABLE public.oauth_tokens IS 'OAuth tokens for cloud storage providers (Google Drive, OneDrive)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user ON public.oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_org ON public.oauth_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_provider ON public.oauth_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_active ON public.oauth_tokens(user_id, organization_id, provider) WHERE is_active = true;

-- RLS
ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can see their own tokens
CREATE POLICY "oauth_tokens_user_policy" ON public.oauth_tokens
    FOR ALL
    TO authenticated
    USING (
        user_id = auth.uid()::text AND
        organization_id IN (
            SELECT organization_id::uuid
            FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

-- Service role bypass
CREATE POLICY "oauth_tokens_service_role" ON public.oauth_tokens
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Helper function to encrypt data
CREATE OR REPLACE FUNCTION encrypt_token(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(data, 'oauth-secret-key'),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to decrypt data
CREATE OR REPLACE FUNCTION decrypt_token(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(data, 'base64'),
        'oauth-secret-key'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active OAuth token
CREATE OR REPLACE FUNCTION get_active_oauth_token(
    p_user_id TEXT,
    p_organization_id UUID,
    p_provider TEXT
)
RETURNS TABLE (
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scopes TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        decrypt_token(t.access_token_encrypted) AS access_token,
        CASE
            WHEN t.refresh_token_encrypted IS NOT NULL
            THEN decrypt_token(t.refresh_token_encrypted)
            ELSE NULL
        END AS refresh_token,
        t.token_expires_at AS expires_at,
        t.scopes
    FROM public.oauth_tokens t
    WHERE t.user_id = p_user_id
        AND t.organization_id = p_organization_id
        AND t.provider = p_provider
        AND t.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if token needs refresh
CREATE OR REPLACE FUNCTION token_needs_refresh(p_expires_at TIMESTAMPTZ)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN p_expires_at IS NULL OR p_expires_at < NOW() + INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION token_needs_refresh IS 'Returns true if token expires within 5 minutes';

-- Trigger to automatically refresh tokens when accessed
CREATE OR REPLACE FUNCTION check_and_refresh_token()
RETURNS TRIGGER AS $$
DECLARE
    needs_refresh BOOLEAN;
BEGIN
    -- Check if token needs refresh
    SELECT token_needs_refresh(token_expires_at)
    INTO needs_refresh
    FROM public.oauth_tokens
    WHERE id = NEW.id;

    -- If token needs refresh, mark for refresh
    -- (Actual refresh happens in application code)
    IF needs_refresh THEN
        NEW.last_refreshed_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Storage buckets for connected drives
UPDATE storage.buckets
SET name = 'connected-drives'
WHERE id = 'connected-drives';

-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('connected-drives', 'connected-drives', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage
CREATE POLICY "connected_drives_user_policy" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'connected-drives' AND
        array_to_string(storage.foldername(name), '/') IN (
            SELECT organization_id::text
            FROM public.organization_members
            WHERE user_id = auth.uid()::text
        )
    );

CREATE POLICY "connected_drives_service_role" ON storage.objects
    FOR ALL
    TO service_role
    USING (bucket_id = 'connected-drives')
    WITH CHECK (bucket_id = 'connected-drives');
