import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveConnectorAppKeysFromEntitlements } from "@/lib/schoolgle-connector";
import { getSubscriptionState } from "@/lib/subscription/state";

export async function getEnabledConnectorAppKeys(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<string[]> {
  const subscriptionState = await getSubscriptionState(supabase, organizationId);
  return resolveConnectorAppKeysFromEntitlements(
    subscriptionState.enabledModules,
  );
}
