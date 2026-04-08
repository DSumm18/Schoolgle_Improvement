// Mission Control — Admin Gate Authentication
// Only whitelisted emails in mc_admin_users can access Mission Control

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { MCAdminUser, MCAdminRole } from './types';

interface MCAuthContext {
  userId: string;
  email: string;
  mcRole: MCAdminRole;
  displayName: string | null;
}

/**
 * Resolve authenticated user from request (cookie or bearer token).
 * Mirrors the pattern from auth-middleware.ts but for MC admin context.
 */
async function resolveUserEmail(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  const { createServerSupabaseClient } = await import('@/lib/supabase-server');

  // 1. Try cookie-based session
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user?.email) return { userId: user.id, email: user.email };
  } catch {
    // Fall through to bearer token
  }

  // 2. Try Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
    if (!error && user?.email) return { userId: user.id, email: user.email };
  }

  return null;
}

/**
 * Check if an email is in the mc_admin_users whitelist.
 */
async function checkAdminWhitelist(email: string): Promise<MCAdminUser | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('mc_admin_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !data) return null;
  return data as MCAdminUser;
}

/**
 * Protect an API route — only MC admins can access.
 * Returns MCAuthContext on success, or a NextResponse error.
 */
export async function requireAdmin(
  request: NextRequest,
  options: { minRole?: MCAdminRole } = {},
): Promise<MCAuthContext | NextResponse> {
  const resolved = await resolveUserEmail(request);

  if (!resolved) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'MC_UNAUTHORIZED' },
      { status: 401 },
    );
  }

  const admin = await checkAdminWhitelist(resolved.email);

  if (!admin) {
    return NextResponse.json(
      { error: 'Access denied — not a Mission Control admin', code: 'MC_FORBIDDEN' },
      { status: 403 },
    );
  }

  // Role hierarchy check
  const roleHierarchy: MCAdminRole[] = ['viewer', 'admin', 'super_admin'];
  const minRole = options.minRole || 'viewer';
  if (roleHierarchy.indexOf(admin.role) < roleHierarchy.indexOf(minRole)) {
    return NextResponse.json(
      { error: 'Insufficient Mission Control permissions', code: 'MC_INSUFFICIENT_ROLE' },
      { status: 403 },
    );
  }

  return {
    userId: resolved.userId,
    email: resolved.email,
    mcRole: admin.role,
    displayName: admin.display_name,
  };
}

/**
 * Helper to check if requireAdmin returned an error response.
 */
export function isMCAuthError(result: MCAuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Server-side admin check for page-level protection (Server Components).
 * Returns the admin user or null.
 */
export async function getServerMCAdmin(): Promise<MCAdminUser | null> {
  try {
    const { createServerSupabaseClient } = await import('@/lib/supabase-server');
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return null;
    return checkAdminWhitelist(user.email);
  } catch {
    return null;
  }
}
