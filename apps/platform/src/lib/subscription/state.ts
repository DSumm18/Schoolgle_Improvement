// Subscription state helpers — single source of truth for what an org can access.
// Read from subscriptions table: enabled_modules + status + trial_end.

import { SupabaseClient } from '@supabase/supabase-js';

export interface SubscriptionState {
  organizationId: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'paused' | 'none' | 'expired';
  enabledModules: string[];
  trialEnd: string | null;
  periodEnd: string | null;
  /** effective cutoff date — trial_end for trialing, current_period_end otherwise */
  effectiveEnd: string | null;
  daysRemaining: number | null;
  isActive: boolean;
  isTrialing: boolean;
  isExpired: boolean;
}

const EMPTY_STATE = (organizationId: string): SubscriptionState => ({
  organizationId,
  status: 'none',
  enabledModules: [],
  trialEnd: null,
  periodEnd: null,
  effectiveEnd: null,
  daysRemaining: null,
  isActive: false,
  isTrialing: false,
  isExpired: false,
});

export async function getSubscriptionState(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<SubscriptionState> {
  if (!organizationId) return EMPTY_STATE('');

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, enabled_modules, trial_end, current_period_end')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return EMPTY_STATE(organizationId);

  const status = (data.status || 'none') as SubscriptionState['status'];
  const enabledModules: string[] = Array.isArray(data.enabled_modules) ? data.enabled_modules : [];
  const trialEnd: string | null = data.trial_end || null;
  const periodEnd: string | null = data.current_period_end || null;
  const effectiveEnd = status === 'trialing' ? trialEnd : periodEnd;

  let daysRemaining: number | null = null;
  if (effectiveEnd) {
    const diff = new Date(effectiveEnd).getTime() - Date.now();
    daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const isTrialing = status === 'trialing';
  const isExpired =
    (status === 'cancelled') ||
    (effectiveEnd !== null && new Date(effectiveEnd).getTime() < Date.now());

  // Active = status is trialing/active AND not past the cutoff
  const isActive = (status === 'trialing' || status === 'active') && !isExpired;
  return {
    organizationId,
    status: isExpired && status !== 'cancelled' ? 'expired' : status,
    enabledModules,
    trialEnd,
    periodEnd,
    effectiveEnd,
    daysRemaining,
    isActive,
    isTrialing,
    isExpired,
  };
}
