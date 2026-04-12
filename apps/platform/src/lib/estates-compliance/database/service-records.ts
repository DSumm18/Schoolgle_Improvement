/**
 * Service Records Database Layer
 *
 * Tracks contractor visits that service one or more assets. Handles:
 *  - Creating a service record with a cost-allocated junction row per asset
 *  - Per-asset cost allocation strategies (equal_split, weighted_capacity,
 *    invoice_line_item, manual)
 *  - Per-asset schedule updates (last_service_date, next_service_due on
 *    the junction + the parent estates_assets row)
 *  - Fast per-asset service history queries
 *  - Bundling opportunity discovery across assets with clustered due dates
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type { Asset } from "@/types/estates-compliance";

export type AllocationMethod =
  | "manual"
  | "equal_split"
  | "weighted_capacity"
  | "invoice_line_item"
  | "ai_extracted";

export type ServiceResult = "pass" | "fail" | "advisory" | "not_assessed";
export type OverallResult = "pass" | "fail" | "advisory" | "mixed";

export interface ServiceRecordAssetInput {
  asset_id: string;
  result?: ServiceResult;
  findings?: string | null;
  remedial_actions?: string[];
  remedial_cost_estimate?: number | null;
  cost_allocated?: number;          // if manual or pre-computed
  allocation_method?: AllocationMethod;
  next_service_due?: string | null; // ISO date
  certificate_evidence_id?: string | null;
}

export interface CreateServiceRecordInput {
  organization_id: string;
  service_date: string;           // ISO date
  service_type: string;
  compliance_domain?: string | null;
  compliance_check_id?: string | null;
  contractor_id?: string | null;
  engineer_name?: string | null;
  invoice_reference?: string | null;
  invoice_evidence_id?: string | null;
  certificate_reference?: string | null;
  total_cost?: number | null;
  currency?: string;
  notes?: string | null;
  overall_result?: OverallResult;
  source?: "manual" | "ai_extracted" | "contractor_portal";
  created_by?: string | null;
  /** The assets serviced in this visit with their allocation + next-due */
  assets: ServiceRecordAssetInput[];
  /** How to split the total_cost across assets if individual cost_allocated not provided */
  allocation_strategy?: AllocationMethod;
}

export interface ServiceRecord {
  id: string;
  organization_id: string;
  service_date: string;
  service_type: string;
  compliance_domain: string | null;
  compliance_check_id: string | null;
  contractor_id: string | null;
  engineer_name: string | null;
  invoice_reference: string | null;
  invoice_evidence_id: string | null;
  certificate_reference: string | null;
  total_cost: number | null;
  currency: string;
  notes: string | null;
  overall_result: OverallResult | null;
  status: string;
  source: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRecordAsset {
  id: string;
  service_record_id: string;
  asset_id: string;
  result: ServiceResult | null;
  findings: string | null;
  remedial_actions: string[] | null;
  remedial_cost_estimate: number | null;
  cost_allocated: number;
  allocation_method: AllocationMethod;
  last_service_date: string;
  next_service_due: string | null;
  certificate_evidence_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Cost allocation helpers
// ---------------------------------------------------------------------------

/**
 * Split a total cost across assets by an allocation strategy.
 * Returns a map of asset_id → allocated cost.
 */
export function allocateCosts(
  totalCost: number,
  assets: Array<{ id: string; specifications?: Record<string, unknown> | null; asset_type?: string | null }>,
  strategy: AllocationMethod,
): Record<string, number> {
  const result: Record<string, number> = {};

  if (assets.length === 0 || totalCost <= 0) {
    for (const a of assets) result[a.id] = 0;
    return result;
  }

  if (strategy === "equal_split" || strategy === "manual" || strategy === "ai_extracted") {
    const share = totalCost / assets.length;
    // Round shares to 2dp. Fix rounding drift on the last asset.
    let allocated = 0;
    for (let i = 0; i < assets.length - 1; i++) {
      const s = Math.round(share * 100) / 100;
      result[assets[i].id] = s;
      allocated += s;
    }
    // Last one absorbs the rounding remainder so sum(parts) == totalCost
    result[assets[assets.length - 1].id] =
      Math.round((totalCost - allocated) * 100) / 100;
    return result;
  }

  if (strategy === "weighted_capacity") {
    // Read capacity_kw / capacity / rating from specifications JSONB
    const weights = assets.map((a) => {
      const specs = (a.specifications || {}) as Record<string, unknown>;
      const cap =
        (specs.capacity_kw as number) ||
        (specs.capacity as number) ||
        (specs.rating_kw as number) ||
        (specs.kw as number) ||
        0;
      return typeof cap === "number" && cap > 0 ? cap : 1;
    });
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    let allocated = 0;
    for (let i = 0; i < assets.length - 1; i++) {
      const s = Math.round((totalCost * (weights[i] / totalWeight)) * 100) / 100;
      result[assets[i].id] = s;
      allocated += s;
    }
    result[assets[assets.length - 1].id] =
      Math.round((totalCost - allocated) * 100) / 100;
    return result;
  }

  // invoice_line_item — caller should pass individual cost_allocated values
  // already; this function is a no-op fallback
  for (const a of assets) result[a.id] = 0;
  return result;
}

/**
 * Calculate next_service_due date based on a last service date and frequency.
 */
export function calculateNextServiceDue(
  lastServiceDate: string,
  frequency:
    | "daily"
    | "weekly"
    | "monthly"
    | "quarterly"
    | "termly"
    | "6_monthly"
    | "annually"
    | "2_yearly"
    | "3_yearly"
    | "5_yearly"
    | "ad_hoc"
    | string,
): string {
  const d = new Date(lastServiceDate);
  switch (frequency) {
    case "daily":
      d.setDate(d.getDate() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
    case "termly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "6_monthly":
      d.setMonth(d.getMonth() + 6);
      break;
    case "annually":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "2_yearly":
      d.setFullYear(d.getFullYear() + 2);
      break;
    case "3_yearly":
      d.setFullYear(d.getFullYear() + 3);
      break;
    case "5_yearly":
      d.setFullYear(d.getFullYear() + 5);
      break;
    default:
      d.setFullYear(d.getFullYear() + 1); // sensible default
  }
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

/**
 * Create a service record + junction rows in a single coordinated write.
 * If total_cost is set and individual cost_allocated values are not,
 * allocate automatically via the strategy.
 * Also updates each asset's last_inspection_date / next_inspection_due
 * on estates_assets so the main dashboard roll-ups stay current.
 */
export async function createServiceRecord(
  input: CreateServiceRecordInput,
): Promise<{ record: ServiceRecord; assets: ServiceRecordAsset[] }> {
  const supabase = createServiceRoleClient();

  // Fetch asset specifications for weighted allocation
  const assetIds = input.assets.map((a) => a.asset_id);
  const { data: assetRows, error: assetErr } = await supabase
    .from("estates_assets")
    .select("id, asset_type, specifications, organization_id")
    .in("id", assetIds);

  if (assetErr) {
    throw new Error(`Failed to fetch assets for service record: ${assetErr.message}`);
  }
  if (!assetRows || assetRows.length !== input.assets.length) {
    throw new Error("Not all referenced assets were found");
  }
  // Verify all assets belong to the same org as the service record
  for (const a of assetRows) {
    if (a.organization_id !== input.organization_id) {
      throw new Error("Asset does not belong to this organization");
    }
  }

  // Determine the cost allocation strategy
  const strategy = input.allocation_strategy || "equal_split";
  const allAssetsHavePreAllocated = input.assets.every(
    (a) => typeof a.cost_allocated === "number" && !isNaN(a.cost_allocated),
  );

  const allocation: Record<string, number> = {};
  if (allAssetsHavePreAllocated) {
    for (const a of input.assets) allocation[a.asset_id] = a.cost_allocated!;
  } else if (typeof input.total_cost === "number" && input.total_cost > 0) {
    const assetsForAllocation = assetRows.map((a) => ({
      id: a.id,
      specifications: a.specifications,
      asset_type: a.asset_type,
    }));
    Object.assign(allocation, allocateCosts(input.total_cost, assetsForAllocation, strategy));
  }

  // Insert the service record
  const { data: record, error: recErr } = await supabase
    .from("estates_service_records")
    .insert({
      organization_id: input.organization_id,
      service_date: input.service_date,
      service_type: input.service_type,
      compliance_domain: input.compliance_domain,
      compliance_check_id: input.compliance_check_id,
      contractor_id: input.contractor_id,
      engineer_name: input.engineer_name,
      invoice_reference: input.invoice_reference,
      invoice_evidence_id: input.invoice_evidence_id,
      certificate_reference: input.certificate_reference,
      total_cost: input.total_cost,
      currency: input.currency || "GBP",
      notes: input.notes,
      overall_result: input.overall_result,
      source: input.source || "manual",
      created_by: input.created_by,
    })
    .select()
    .single();

  if (recErr) {
    throw new Error(`Failed to create service record: ${recErr.message}`);
  }

  // Insert junction rows
  const junctionRows = input.assets.map((a) => ({
    service_record_id: record.id,
    asset_id: a.asset_id,
    result: a.result || "not_assessed",
    findings: a.findings,
    remedial_actions: a.remedial_actions || [],
    remedial_cost_estimate: a.remedial_cost_estimate,
    cost_allocated: typeof a.cost_allocated === "number" ? a.cost_allocated : (allocation[a.asset_id] || 0),
    allocation_method: a.allocation_method || strategy,
    last_service_date: input.service_date,
    next_service_due: a.next_service_due,
    certificate_evidence_id: a.certificate_evidence_id,
  }));

  const { data: junctionData, error: junErr } = await supabase
    .from("estates_service_record_assets")
    .insert(junctionRows)
    .select();

  if (junErr) {
    // Best-effort cleanup — delete the orphaned record
    await supabase.from("estates_service_records").delete().eq("id", record.id);
    throw new Error(`Failed to create service record junctions: ${junErr.message}`);
  }

  // Update each asset's last_inspection_date / next_inspection_due for the
  // main dashboard roll-up. This keeps /api/estates/assets/[id] simple queries
  // working without needing a join to service_records for every lookup.
  for (const a of input.assets) {
    await supabase
      .from("estates_assets")
      .update({
        last_inspection_date: input.service_date,
        next_inspection_due: a.next_service_due,
        updated_at: new Date().toISOString(),
      })
      .eq("id", a.asset_id);
  }

  return { record, assets: (junctionData || []) as ServiceRecordAsset[] };
}

/**
 * Get the service history for a specific asset, most recent first.
 * Joins service_records to the junction for full details.
 */
export async function getServiceHistoryForAsset(
  assetId: string,
  organizationId: string,
  limit: number = 50,
): Promise<
  Array<
    ServiceRecordAsset & {
      service_record: ServiceRecord;
      contractor_name?: string;
    }
  >
> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("estates_service_record_assets")
    .select(
      `
      *,
      service_record:service_record_id (
        id, organization_id, service_date, service_type,
        compliance_domain, compliance_check_id,
        contractor_id, engineer_name,
        invoice_reference, invoice_evidence_id,
        certificate_reference, total_cost, currency,
        notes, overall_result, status, source, created_at
      )
      `,
    )
    .eq("asset_id", assetId)
    .order("last_service_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch service history: ${error.message}`);
  }

  // Filter to this organization (join-side filter)
  const filtered = (data || []).filter(
    (row: { service_record: { organization_id: string } | null }) =>
      row.service_record?.organization_id === organizationId,
  );

  // Enrich with contractor company name
  const contractorIds = [
    ...new Set(
      filtered
        .map((r: { service_record: { contractor_id?: string | null } }) => r.service_record?.contractor_id)
        .filter(Boolean),
    ),
  ];
  const contractorMap: Record<string, string> = {};
  if (contractorIds.length > 0) {
    const { data: contractors } = await supabase
      .from("estates_contractors")
      .select("id, company_name")
      .in("id", contractorIds as string[]);
    for (const c of contractors || []) contractorMap[c.id] = c.company_name;
  }

  return filtered.map((r) => ({
    ...(r as ServiceRecordAsset),
    service_record: (r as unknown as { service_record: ServiceRecord }).service_record,
    contractor_name:
      contractorMap[
        (r as unknown as { service_record: { contractor_id: string } }).service_record.contractor_id
      ],
  }));
}

/**
 * Total spend on a specific asset across all service records.
 */
export async function getTotalSpendForAsset(assetId: string): Promise<number> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("estates_service_record_assets")
    .select("cost_allocated")
    .eq("asset_id", assetId);
  if (error) return 0;
  return (data || []).reduce((sum, r) => sum + (Number(r.cost_allocated) || 0), 0);
}

/**
 * Find bundling opportunities across the organization.
 * Returns clusters of assets whose next_service_due dates are close
 * enough that booking a single contractor visit would save callout fees.
 *
 * @param organizationId  Tenant scope
 * @param windowDays      How many days into the future/past to group (default 90)
 * @param callOutFee      Typical callout fee to estimate savings (default 100)
 */
export async function findBundlingOpportunities(
  organizationId: string,
  windowDays: number = 90,
  callOutFee: number = 100,
): Promise<
  Array<{
    compliance_domain: string;
    asset_count: number;
    earliest_due: string;
    latest_due: string;
    assets: Array<{
      asset_id: string;
      asset_name: string;
      asset_code: string | null;
      next_service_due: string;
      days_from_today: number;
    }>;
    estimated_saving: number;
  }>
> {
  const supabase = createServiceRoleClient();

  // Scope to the organization by joining through service_records first.
  // This prevents globally scanning all junction rows and leaking cross-tenant data.
  const { data: records } = await supabase
    .from("estates_service_records")
    .select("id, compliance_domain")
    .eq("organization_id", organizationId)
    .not("compliance_domain", "is", null);

  if (!records || records.length === 0) return [];

  const orgRecordIds = records.map((r) => r.id);
  const recordMap = new Map(records.map((r) => [r.id, r]));

  // Now fetch junction rows only for this org's service records
  const { data: junctionRows } = await supabase
    .from("estates_service_record_assets")
    .select("asset_id, next_service_due, service_record_id")
    .in("service_record_id", orgRecordIds)
    .not("next_service_due", "is", null)
    .order("last_service_date", { ascending: false });

  if (!junctionRows || junctionRows.length === 0) return [];

  // Deduplicate to most recent per asset
  const latestPerAsset = new Map<string, { next_service_due: string; service_record_id: string }>();
  for (const r of junctionRows) {
    if (!latestPerAsset.has(r.asset_id)) {
      latestPerAsset.set(r.asset_id, {
        next_service_due: r.next_service_due as string,
        service_record_id: r.service_record_id as string,
      });
    }
  }

  const assetIds = [...latestPerAsset.keys()];

  if (assetIds.length === 0) return [];

  const { data: assets } = await supabase
    .from("estates_assets")
    .select("id, name, code")
    .in("id", assetIds)
    .eq("organization_id", organizationId);

  const assetMap = new Map((assets || []).map((a) => [a.id, a]));

  // Group by compliance_domain
  const byDomain: Record<
    string,
    Array<{
      asset_id: string;
      asset_name: string;
      asset_code: string | null;
      next_service_due: string;
      days_from_today: number;
    }>
  > = {};

  const today = new Date();
  for (const [assetId, entry] of latestPerAsset) {
    const rec = recordMap.get(entry.service_record_id);
    // All records in recordMap already belong to this org (filtered at query time)
    if (!rec || !rec.compliance_domain) continue;
    const asset = assetMap.get(assetId);
    if (!asset) continue;
    const due = new Date(entry.next_service_due);
    const days = Math.floor((due.getTime() - today.getTime()) / 86400000);
    const domain = rec.compliance_domain;
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push({
      asset_id: assetId,
      asset_name: asset.name,
      asset_code: asset.code,
      next_service_due: entry.next_service_due,
      days_from_today: days,
    });
  }

  // For each domain, find clusters within windowDays
  const opportunities: Array<{
    compliance_domain: string;
    asset_count: number;
    earliest_due: string;
    latest_due: string;
    assets: Array<{
      asset_id: string;
      asset_name: string;
      asset_code: string | null;
      next_service_due: string;
      days_from_today: number;
    }>;
    estimated_saving: number;
  }> = [];

  for (const [domain, assetList] of Object.entries(byDomain)) {
    if (assetList.length < 2) continue;
    // Sort by due date
    assetList.sort((a, b) => a.days_from_today - b.days_from_today);
    // Find clusters where successive assets are within windowDays
    let cluster: typeof assetList = [assetList[0]];
    for (let i = 1; i < assetList.length; i++) {
      const gap = assetList[i].days_from_today - cluster[cluster.length - 1].days_from_today;
      if (gap <= windowDays) {
        cluster.push(assetList[i]);
      } else {
        if (cluster.length >= 2) {
          opportunities.push({
            compliance_domain: domain,
            asset_count: cluster.length,
            earliest_due: cluster[0].next_service_due,
            latest_due: cluster[cluster.length - 1].next_service_due,
            assets: [...cluster],
            estimated_saving: (cluster.length - 1) * callOutFee,
          });
        }
        cluster = [assetList[i]];
      }
    }
    if (cluster.length >= 2) {
      opportunities.push({
        compliance_domain: domain,
        asset_count: cluster.length,
        earliest_due: cluster[0].next_service_due,
        latest_due: cluster[cluster.length - 1].next_service_due,
        assets: [...cluster],
        estimated_saving: (cluster.length - 1) * callOutFee,
      });
    }
  }

  // Highest-saving first
  return opportunities.sort((a, b) => b.estimated_saving - a.estimated_saving);
}
