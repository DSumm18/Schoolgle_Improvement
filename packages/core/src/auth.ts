/**
 * Core Authentication Module
 * 
 * Dual-Auth System:
 * 1. User JWTs: For frontend users (Supabase Auth)
 * 2. API Keys: For B2B partners (lookup from api_keys table)
 * 
 * GDPR Compliant: All auth operations use native Supabase Auth
 * with organization_id extracted from JWT claims.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

export interface AuthContext {
  userId: string;
  organizationId: string;
  userRole?: string;
  authType: 'user_jwt' | 'api_key';
  supabase: SupabaseClient;
}

export interface ApiKeyRecord {
  id: string;
  key_hash: string;
  organization_id: string;
  name: string;
  permissions: string[];
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

/**
 * Authenticate using Supabase User JWT
 * 
 * Extracts:
 * - auth.uid() → userId
 * - auth.jwt() ->> 'organization_id' → organizationId
 * 
 * @param supabaseUrl - Supabase project URL
 * @param jwtToken - Supabase Auth JWT token
 * @returns AuthContext with user and organization info
 */
export async function authenticateUserJWT(
  supabaseUrl: string,
  jwtToken: string
): Promise<AuthContext> {
  // Create Supabase client with user's JWT
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`
      }
    }
  });

  // Verify token and get user
  const { data: { user }, error: userError } = await supabase.auth.getUser(jwtToken);
  
  if (userError || !user) {
    throw new Error(`Authentication failed: ${userError?.message || 'Invalid token'}`);
  }

  // Extract organization_id from JWT claims
  // Supabase allows custom claims via auth.users.raw_app_meta_data
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    throw new Error(`Session retrieval failed: ${sessionError?.message || 'No session'}`);
  }

  // Get organization_id from JWT claims
  // This is set via Supabase Auth hooks or during user creation
  const organizationId = session.user.user_metadata?.organization_id 
    || session.user.app_metadata?.organization_id;

  if (!organizationId) {
    // Fallback: Lookup from organization_members table
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membershipError || !membership) {
      throw new Error('User is not a member of any organization');
    }

    return {
      userId: user.id,
      organizationId: membership.organization_id,
      userRole: membership.role,
      authType: 'user_jwt',
      supabase
    };
  }

  // Verify user is actually a member of this organization
  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single();

  if (membershipError || !membership) {
    throw new Error(`User ${user.id} is not a member of organization ${organizationId}`);
  }

  return {
    userId: user.id,
    organizationId,
    userRole: membership.role,
    authType: 'user_jwt',
    supabase
  };
}

/**
 * Authenticate using API Key
 * 
 * Looks up API key in api_keys table and returns organization context.
 * Used for B2B partner integrations.
 * 
 * @param supabaseUrl - Supabase project URL
 * @param apiKey - API key string (will be hashed and looked up)
 * @returns AuthContext with organization info
 */
export async function authenticateAPIKey(
  supabaseUrl: string,
  apiKey: string
): Promise<AuthContext> {
  // Create service role client for API key lookup
  const serviceClient = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Hash the API key (use same hashing as storage)
  // In production, use crypto.createHash('sha256').update(apiKey).digest('hex')
  const crypto = await import('crypto');
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Lookup API key
  const { data: apiKeyRecord, error: lookupError } = await serviceClient
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (lookupError || !apiKeyRecord) {
    throw new Error('Invalid or inactive API key');
  }

  // Check expiration
  if (apiKeyRecord.expires_at) {
    const expiresAt = new Date(apiKeyRecord.expires_at);
    if (expiresAt < new Date()) {
      throw new Error('API key has expired');
    }
  }

  // Update last_used_at
  await serviceClient
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyRecord.id);

  // Create organization-scoped Supabase client
  // For API keys, we use anon key but with organization context
  const supabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        'X-Organization-Id': apiKeyRecord.organization_id
      }
    }
  });

  return {
    userId: `api_key:${apiKeyRecord.id}`, // Synthetic user ID for API keys
    organizationId: apiKeyRecord.organization_id,
    userRole: 'api_key', // API keys have special role
    authType: 'api_key',
    supabase
  };
}

/**
 * Unified authentication handler
 * 
 * Determines auth type from request and routes to appropriate handler.
 * 
 * @param supabaseUrl - Supabase project URL
 * @param authHeader - Authorization header (Bearer token or API key)
 * @returns AuthContext
 */
export async function authenticate(
  supabaseUrl: string,
  authHeader: string | null
): Promise<AuthContext> {
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  // Check if it's a Bearer token (JWT) or API key
  if (authHeader.startsWith('Bearer ')) {
    const jwtToken = authHeader.substring(7);
    return authenticateUserJWT(supabaseUrl, jwtToken);
  } else {
    // Assume it's an API key
    return authenticateAPIKey(supabaseUrl, authHeader);
  }
}

/**
 * Extract organization_id from Supabase JWT
 * 
 * Note: This is a TypeScript helper. For RLS policies, use the SQL function
 * defined in migrations that uses current_setting('request.jwt.claims').
 */
export function getOrganizationIdFromJWT(session: any): string | null {
  // Extract from user metadata or app metadata
  return session?.user?.user_metadata?.organization_id 
    || session?.user?.app_metadata?.organization_id 
    || null;
}

