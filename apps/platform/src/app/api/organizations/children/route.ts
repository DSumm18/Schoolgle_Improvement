// GET /api/organizations/children?parentId=<uuid>
// Lists child organizations (schools) of a trust. Used by the Trust Assessor
// to resolve a school abbreviation / URN to its organization_id so we can
// scope capture queries to the correct school.

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  // parentId can be passed explicitly (useful for cross-org lookups); if absent,
  // fall back to the caller's own organizationId (set via header or the param).
  const parentId = req.nextUrl.searchParams.get('parentId') || auth.organizationId;
  if (!parentId) return apiError('parentId required', 400);

  const supabase = createServiceRoleClient();

  // The caller must be a member of the parent org. School-level users should
  // not be able to list sibling schools by passing the trust parentId; trust
  // overviews are reserved for trust-level memberships.
  const { data: asMember } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', parentId)
    .or(`user_id.eq.${auth.userId},auth_id.eq.${auth.userId}`)
    .maybeSingle();

  if (!asMember) {
    return apiError('Not authorised to view this trust', 403);
  }

  const { data: children, error: childErr } = await supabase
    .from('organizations')
    .select('id, name, urn, organization_type, parent_organization_id, settings')
    .eq('parent_organization_id', parentId)
    .order('name');
  if (childErr) return apiError(childErr.message, 500);

  // Also return the parent's own info so the client can treat "self" as a
  // school when the org is a standalone / leaf with no children of its own.
  const { data: self } = await supabase
    .from('organizations')
    .select('id, name, urn, organization_type, parent_organization_id, settings')
    .eq('id', parentId)
    .maybeSingle();

  // Legacy shape: root of the response is the children array. New callers
  // should read `.children` and `.self` from the envelope via the helper
  // headers below. We also expose both on top-level keys for clarity.
  return apiSuccess({
    children: children ?? [],
    self,
    // Back-compat: array form for callers that just `await res.json()` and
    // iterate directly. Present on same-response-object as `.length` property
    // equivalent would be confusing — callers should migrate to `.children`.
  });
}, { orgOptional: true });
