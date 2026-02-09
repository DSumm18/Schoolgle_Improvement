/**
 * API Route: Statutory Completions
 *
 * GET /api/estates/statutory-completions?organization_id=xxx
 * POST /api/estates/statutory-completions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getStatutoryCompletions,
  getDomainsCompletionSummary,
  completeStatutoryCheck,
  initializeAllStatutoryCompletions,
} from '@/lib/estates-compliance/database/statutory-completions';
import {
  DOMAIN_METADATA,
  getChecksForDomain,
  type ComplianceDomain,
} from '@/lib/estates-compliance/statutory-checks';

/**
 * GET: Fetch statutory completions for an organization
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const domain = searchParams.get('domain') as ComplianceDomain | null;
    const summary = searchParams.get('summary') === 'true';

    console.log('[StatutoryCompletions API] GET request:', { organizationId, domain, summary });

    if (!organizationId) {
      console.log('[StatutoryCompletions API] ERROR: No organization_id provided');
      return NextResponse.json(
        { error: 'organization_id parameter is required' },
        { status: 400 }
      );
    }

    // Get user and appropriate client
    console.log('[StatutoryCompletions API] About to call getUserFromRequest...');
    const { user, client: supabase, error: authError } = await getUserFromRequest(request);

    console.log('[StatutoryCompletions API] Auth check result:', { userId: user?.id, authError });

    if (authError || !user || !supabase) {
      console.log('[StatutoryCompletions API] Unauthorized - no user or supabase client');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user is member of the organization
    console.log('[StatutoryCompletions API] Verifying membership:', { userId: user.id, orgId: organizationId });
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (memberError || !member) {
      console.warn('[StatutoryCompletions API] ⛔ FORBIDDEN: User not a member of organization:', { error: memberError?.message, user: user.id, requestedOrg: organizationId });
      return NextResponse.json({
        error: 'Forbidden - membership not verified',
        requested_org_id: organizationId,
        user_uuid: user.id
      }, { status: 403 });
    }

    console.log('[StatutoryCompletions API] ✅ Membership verified:', { role: member.role });

    if (summary) {
      console.log('[StatutoryCompletions API] Fetching summary for all domains...');
      // Get completion summary for all domains
      const domains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
      const domainSummaries = await getDomainsCompletionSummary(organizationId, domains);

      console.log('[StatutoryCompletions API] Returning', domainSummaries.length, 'domain summaries');

      return NextResponse.json({
        organization_id: organizationId,
        domains: domainSummaries,
      });
    }

    // Get completions with optional domain filter
    const completions = await getStatutoryCompletions(
      organizationId,
      domain ? { domain } : undefined
    );

    return NextResponse.json({
      organization_id: organizationId,
      domain: domain || 'all',
      completions,
    });

  } catch (error) {
    console.error('[Statutory Completions GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch statutory completions' },
      { status: 500 }
    );
  }
}

/**
 * Helper to get user from request (supports both cookies and Bearer token)
 * Also returns a Supabase client that can access organization_members
 */
async function getUserFromRequest(request: NextRequest) {
  // Try Authorization header first (for localStorage-based sessions)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    // Use service role client to verify the token
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const serviceClient = createServiceClient(serviceUrl, serviceKey);

    const { data: tokenUser, error: tokenError } = await serviceClient.auth.getUser(token);
    if (!tokenError && tokenUser.user) {
      console.log('[StatutoryCompletions API] Auth via Bearer token:', tokenUser.user.id);
      return { user: tokenUser.user, client: serviceClient, error: null };
    }
  }

  // Fall back to cookies (SSR)
  const supabase = await createClient();
  const cookieResult = await supabase.auth.getUser();
  if (cookieResult.data.user && !cookieResult.error) {
    return { user: cookieResult.data.user, client: supabase, error: null };
  }

  return { user: null, client: null, error: 'No valid authentication found' };
}

/**
 * POST: Create or update statutory completions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, action, ...data } = body;

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Get user and appropriate client
    const { user, client: supabase, error: authError } = await getUserFromRequest(request);

    if (authError || !user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user is member of the organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    switch (action) {
      case 'complete': {
        // Complete a statutory check
        const { check_id, check_data } = data;

        if (!check_id) {
          return NextResponse.json(
            { error: 'check_id is required for complete action' },
            { status: 400 }
          );
        }

        const completion = await completeStatutoryCheck(
          organization_id,
          check_id,
          {
            ...check_data,
            completed_by: user.id,
          }
        );

        return NextResponse.json({
          success: true,
          completion,
        });
      }

      case 'initialize': {
        // Initialize all statutory completions for an organization
        const domains = Object.keys(DOMAIN_METADATA) as ComplianceDomain[];
        const domainCheckIds: Record<string, string[]> = {};

        for (const domain of domains) {
          const checks = getChecksForDomain(domain);
          domainCheckIds[domain] = checks.map(c => c.id);
        }

        await initializeAllStatutoryCompletions(organization_id, domains, domainCheckIds);

        return NextResponse.json({
          success: true,
          message: 'Statutory completions initialized',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: complete, initialize' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Statutory Completions POST Error]', error);
    return NextResponse.json(
      { error: 'Failed to process statutory completions request' },
      { status: 500 }
    );
  }
}
