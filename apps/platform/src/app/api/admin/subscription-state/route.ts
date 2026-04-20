// Super-admin endpoints for managing per-org subscription state.
// GET   → list all orgs with their current subscription state
// PATCH → update enabled_modules, trial_end, current_period_end, status for an org

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

async function isSuperAdmin(
  supabase: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  email: string | null,
): Promise<boolean> {
  const { data: byId } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (byId) return true;
  if (!email) return false;
  const { data: byEmail } = await supabase
    .from('super_admins')
    .select('user_id')
    .eq('email', email)
    .maybeSingle();
  return !!byEmail;
}

export const GET = protectedRoute(async (auth, _req: NextRequest) => {
  const supabase = createServiceRoleClient();
  if (!(await isSuperAdmin(supabase, auth.userId, auth.email))) {
    return apiError('Super admin only', 403);
  }

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, parent_organization_id')
    .order('name');

  const { data: subs } = await supabase
    .from('subscriptions')
    .select('organization_id, status, enabled_modules, trial_end, current_period_end, plan_id, product, updated_at')
    .order('updated_at', { ascending: false });

  const subMap = new Map<string, any>();
  subs?.forEach((s) => {
    if (!subMap.has(s.organization_id)) subMap.set(s.organization_id, s);
  });

  const rows = (orgs || []).map((o) => ({
    organizationId: o.id,
    name: o.name,
    parentOrganizationId: o.parent_organization_id,
    subscription: subMap.get(o.id) || null,
  }));

  return apiSuccess({ rows });
});

export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  if (!(await isSuperAdmin(supabase, auth.userId, auth.email))) {
    return apiError('Super admin only', 403);
  }

  const organizationId = req.nextUrl.searchParams.get('organizationId');
  if (!organizationId) return apiError('organizationId required', 400);

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, any> = {};

  if (Array.isArray(body.enabled_modules)) patch.enabled_modules = body.enabled_modules;
  if (typeof body.trial_end === 'string' || body.trial_end === null) patch.trial_end = body.trial_end;
  if (typeof body.current_period_end === 'string' || body.current_period_end === null) patch.current_period_end = body.current_period_end;
  if (['active', 'trialing', 'cancelled', 'past_due', 'paused'].includes(body.status)) patch.status = body.status;

  if (Object.keys(patch).length === 0) return apiError('Nothing to update', 400);

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('subscriptions')
      .update(patch)
      .eq('organization_id', organizationId);
    if (error) return apiError(error.message, 500);
  } else {
    const { error } = await supabase.from('subscriptions').insert({
      organization_id: organizationId,
      product: body.product || 'ofsted_ready',
      plan_id: body.plan_id || 'essential',
      status: patch.status || 'trialing',
      billing_cycle: 'annual',
      auto_renew: false,
      school_count: 1,
      ...patch,
    });
    if (error) return apiError(error.message, 500);
  }

  return apiSuccess({ ok: true });
});
