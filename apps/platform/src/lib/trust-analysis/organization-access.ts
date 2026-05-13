export type TrustAnalysisRelationship = "self" | "child";

export interface TrustAnalysisOrganizationRow {
  id: string;
  parent_organization_id: string | null;
}

export type TrustAnalysisAccessResult =
  | {
      allowed: true;
      organizationId: string;
      relationship: TrustAnalysisRelationship;
    }
  | {
      allowed: false;
      reason: "missing-auth-org" | "missing-requested-org" | "out-of-scope";
    };

export function resolveTrustAnalysisAccess({
  authOrganizationId,
  requestedOrganization,
}: {
  authOrganizationId: string | null | undefined;
  requestedOrganization: TrustAnalysisOrganizationRow | null | undefined;
}): TrustAnalysisAccessResult {
  if (!authOrganizationId) {
    return { allowed: false, reason: "missing-auth-org" };
  }

  if (!requestedOrganization) {
    return { allowed: false, reason: "missing-requested-org" };
  }

  if (requestedOrganization.id === authOrganizationId) {
    return {
      allowed: true,
      organizationId: requestedOrganization.id,
      relationship: "self",
    };
  }

  if (requestedOrganization.parent_organization_id === authOrganizationId) {
    return {
      allowed: true,
      organizationId: requestedOrganization.id,
      relationship: "child",
    };
  }

  return { allowed: false, reason: "out-of-scope" };
}

export async function resolveRequestedTrustAnalysisOrganization(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  authOrganizationId: string | null | undefined,
  requestedOrganizationId: string | null | undefined,
): Promise<TrustAnalysisAccessResult> {
  const organizationId = requestedOrganizationId || authOrganizationId;
  if (!organizationId) {
    return { allowed: false, reason: "missing-requested-org" };
  }

  const { data } = await supabase
    .from("organizations")
    .select("id, parent_organization_id")
    .eq("id", organizationId)
    .maybeSingle();

  return resolveTrustAnalysisAccess({
    authOrganizationId,
    requestedOrganization: data,
  });
}
