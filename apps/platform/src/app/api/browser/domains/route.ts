/**
 * Browser Domains API
 *
 * Provides endpoints for managing approved browser domains:
 * - GET /api/browser/domains - List approved domains for organization
 * - POST /api/browser/domains - Add a new approved domain
 * - PATCH /api/browser/domains - Update domain settings
 * - DELETE /api/browser/domains - Remove an approved domain
 *
 * All endpoints require authentication and organization membership.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// ============================================================================
// TYPES
// ============================================================================

interface CreateDomainRequest {
  domain: string;
  description?: string;
  category: 'government' | 'internal' | 'vendor' | 'other';
  requiresAuth?: boolean;
  authMethod?: 'sso' | 'headers' | 'credentials' | 'none';
  authConfig?: Record<string, any>;
  allowedPaths?: string[];
  deniedPaths?: string[];
  maxSessionDuration?: number;
}

interface UpdateDomainRequest {
  domainId: string;
  description?: string;
  requiresAuth?: boolean;
  authMethod?: 'sso' | 'headers' | 'credentials' | 'none';
  authConfig?: Record<string, any>;
  allowedPaths?: string[];
  deniedPaths?: string[];
  maxSessionDuration?: number;
  isActive?: boolean;
}

interface DeleteDomainRequest {
  domainId: string;
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Get authenticated user and organization from request
 */
async function getAuthContext(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Unauthorized');
  }

  // Get user's organization ID and role
  const { data: memberData, error: memberError } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (memberError || !memberData) {
    throw new Error('User not associated with an organization');
  }

  return {
    user,
    organizationId: memberData.organization_id,
    userRole: memberData.role,
  };
}

/**
 * Check if user is admin or owner
 */
function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'owner';
}

// ============================================================================
// GET - List approved domains
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { organizationId } = await getAuthContext(request);

    const supabase = await createServerSupabaseClient();

    const { data: domains, error } = await supabase
      .from('browser_approved_domains')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch domains', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      domains,
    });
  } catch (error) {
    console.error('[Browser Domains API] GET error:', error);
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }
}

// ============================================================================
// POST - Add a new approved domain
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { user, organizationId, userRole } = await getAuthContext(request);

    // Only admins can add domains
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only admins can add approved domains' },
        { status: 403 }
      );
    }

    const body: CreateDomainRequest = await request.json();
    const {
      domain,
      description,
      category,
      requiresAuth = false,
      authMethod = 'none',
      authConfig = {},
      allowedPaths = ['/**'],
      deniedPaths = [],
      maxSessionDuration = 1800,
    } = body;

    if (!domain || !category) {
      return NextResponse.json(
        { error: 'Invalid Input', message: 'Domain and category are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Check if domain already exists
    const { data: existing } = await supabase
      .from('browser_approved_domains')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('domain', domain)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Domain already exists for this organization' },
        { status: 409 }
      );
    }

    // Insert new domain
    const { data: newDomain, error } = await supabase
      .from('browser_approved_domains')
      .insert({
        organization_id: organizationId,
        domain: domain.toLowerCase(),
        description,
        category,
        requires_auth: requiresAuth,
        auth_method: authMethod,
        auth_config: authConfig,
        allowed_paths: allowedPaths,
        denied_paths: deniedPaths,
        max_session_duration: maxSessionDuration,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create domain', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      domain: newDomain,
    });
  } catch (error) {
    console.error('[Browser Domains API] POST error:', error);
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }
}

// ============================================================================
// PATCH - Update domain settings
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { organizationId, userRole } = await getAuthContext(request);

    // Only admins can update domains
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only admins can update approved domains' },
        { status: 403 }
      );
    }

    const body: UpdateDomainRequest = await request.json();
    const { domainId, ...updates } = body;

    if (!domainId) {
      return NextResponse.json(
        { error: 'Invalid Input', message: 'Domain ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify domain belongs to organization
    const { data: existing } = await supabase
      .from('browser_approved_domains')
      .select('id')
      .eq('id', domainId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Domain not found or access denied' },
        { status: 404 }
      );
    }

    // Update domain
    const { data: updatedDomain, error } = await supabase
      .from('browser_approved_domains')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', domainId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update domain', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      domain: updatedDomain,
    });
  } catch (error) {
    console.error('[Browser Domains API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }
}

// ============================================================================
// DELETE - Remove an approved domain
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { organizationId, userRole } = await getAuthContext(request);

    // Only admins can delete domains
    if (!isAdmin(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only admins can remove approved domains' },
        { status: 403 }
      );
    }

    const body: DeleteDomainRequest = await request.json();
    const { domainId } = body;

    if (!domainId) {
      return NextResponse.json(
        { error: 'Invalid Input', message: 'Domain ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify domain belongs to organization
    const { data: existing } = await supabase
      .from('browser_approved_domains')
      .select('id')
      .eq('id', domainId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Domain not found or access denied' },
        { status: 404 }
      );
    }

    // Delete domain
    const { error } = await supabase
      .from('browser_approved_domains')
      .delete()
      .eq('id', domainId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete domain', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Domain removed successfully',
    });
  } catch (error) {
    console.error('[Browser Domains API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Unauthorized', message: 'You must be logged in' },
      { status: 401 }
    );
  }
}
