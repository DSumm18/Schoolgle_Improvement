/**
 * Contractor History API
 *
 * GET /api/estates/contractors/[id]/history
 *
 * Returns a relationship history for a contractor: contracts, service records,
 * tickets, spend, renewal risks, and operational risk flags.
 */

import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { buildContractorHistory } from "@/lib/estates-compliance/contractor-history";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const contractorId = segments[segments.length - 2];
  const supabase = createServiceRoleClient();

  const { data: contractor, error: contractorError } = await supabase
    .from("estates_contractors")
    .select("id, organization_id, status")
    .eq("id", contractorId)
    .eq("organization_id", organizationId)
    .single();

  if (contractorError || !contractor) {
    return apiError("Contractor not found", 404);
  }

  const [{ data: contracts }, { data: serviceRecords }, { data: tickets }] =
    await Promise.all([
      supabase
        .from("estates_contracts")
        .select(
          "id, title, status, start_date, end_date, renewal_date, annual_cost, compliance_domains",
        )
        .eq("organization_id", organizationId)
        .eq("contractor_id", contractorId),
      supabase
        .from("estates_service_records")
        .select(
          "id, service_date, service_type, compliance_domain, total_cost, overall_result",
        )
        .eq("organization_id", organizationId)
        .eq("contractor_id", contractorId)
        .order("service_date", { ascending: false }),
      supabase
        .from("estates_helpdesk_tickets")
        .select(
          "id, ticket_number, title, priority, status, created_at, actual_cost, estimated_cost",
        )
        .eq("organization_id", organizationId)
        .or(`contractor_id.eq.${contractorId},assigned_contractor_id.eq.${contractorId}`)
        .order("created_at", { ascending: false }),
    ]);

  const recordIds = (serviceRecords || []).map((record) => record.id);
  const assetCounts = new Map<string, number>();

  if (recordIds.length > 0) {
    const { data: serviceAssets } = await supabase
      .from("estates_service_record_assets")
      .select("service_record_id")
      .in("service_record_id", recordIds);

    for (const row of serviceAssets || []) {
      assetCounts.set(
        row.service_record_id,
        (assetCounts.get(row.service_record_id) || 0) + 1,
      );
    }
  }

  const history = buildContractorHistory({
    contractorId,
    contractorStatus: contractor.status,
    contracts: contracts || [],
    serviceRecords: (serviceRecords || []).map((record) => ({
      ...record,
      asset_count: assetCounts.get(record.id) || 0,
    })),
    tickets: tickets || [],
  });

  return apiSuccess({ history });
});
