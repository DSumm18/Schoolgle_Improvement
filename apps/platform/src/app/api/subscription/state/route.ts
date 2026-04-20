// GET /api/subscription/state?organizationId=<uuid>
// Returns subscription state (enabled modules, status, days remaining) for a given org.
// Used by the dashboard layout to filter modules in the sidebar + show trial banner.

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { getSubscriptionState } from '@/lib/subscription/state';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = req.nextUrl.searchParams.get('organizationId') || auth.organizationId;
  if (!orgId) return apiError('organizationId required', 400);

  // Authorize: caller must be a member of this org OR be looking at their own org
  const supabase = createServiceRoleClient();
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (!membership) return apiError('Not a member of this organization', 403);

  const state = await getSubscriptionState(supabase, orgId);
  return apiSuccess(state);
});
