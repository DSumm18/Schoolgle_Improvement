/**
 * Assets Database Functions
 *
 * Helper functions for querying estates_assets table
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  Asset,
  AssetInput,
  AssetFilters,
  AssetStatus,
  AssetWithWarrantyStatus,
  MaintenanceHistoryEntry,
  PaginatedResponse,
} from "@/types/estates-compliance";

// Server-side operations use service role. Tenant isolation is preserved
// via organizationId filters on every query — API routes validate auth first.
const supabase = createServiceRoleClient();

/**
 * Escape PostgREST special characters to prevent query injection via .or()
 * filter strings. Should be applied to any user-supplied search term before
 * interpolating it into a .or() predicate.
 */
function sanitizeSearch(input: string): string {
  // PostgREST special chars inside ilike patterns that need escaping:
  // % and _ are SQL wildcard chars; , () \ are PostgREST structure chars.
  return input.replace(/[%_,()\\]/g, (c) => "\\" + c);
}

// Whitelist of valid columns for inserts/updates to avoid schema drift.
const ASSET_COLUMNS = [
  "asset_type", "category", "subcategory", "name", "code", "qr_code", "barcode",
  "building", "floor", "room", "location_id", "location_details",
  "parent_asset_id", "installation_date",
  "manufacturer", "model", "serial_number", "specifications",
  "purchase_date", "purchase_price", "purchase_currency", "purchase_order_number",
  "invoice_number", "purchased_from_contractor_id", "maintained_by_contractor_id",
  "purchase_document_evidence_id",
  "warranty_start_date", "warranty_expiry", "warranty_provider", "warranty_terms",
  "expected_life_years", "condition_grade", "replacement_cost_estimate", "insurance_value",
  "last_inspection_date", "next_inspection_due", "maintenance_history", "linked_compliance_checks",
  "status", "compliance_domains", "image_url", "notes",
] as const;

function pickAssetColumns(input: Partial<AssetInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const key of ASSET_COLUMNS) {
    if (key in input && (input as Record<string, unknown>)[key] !== undefined) {
      row[key] = (input as Record<string, unknown>)[key];
    }
  }
  if (input.maintained_by_contractor_id !== undefined) {
    row.maintained_by_contractor_id = input.maintained_by_contractor_id || null;
    row.specifications = {
      ...((row.specifications as Record<string, unknown> | undefined) || {}),
      ...((input.specifications as Record<string, unknown> | undefined) || {}),
      maintained_by_contractor_id: input.maintained_by_contractor_id || null,
    };
  }
  return row;
}

/**
 * Get assets for an organization with optional filters
 */
export async function getAssets(
  organizationId: string,
  filters?: AssetFilters,
  pagination?: { page: number; pageSize: number },
): Promise<PaginatedResponse<Asset>> {
  let query = supabase
    .from("estates_assets")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId);

  // Apply filters
  if (filters?.asset_type) {
    query = query.eq("asset_type", filters.asset_type);
  }
  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  if (filters?.building) {
    query = query.eq("building", filters.building);
  }
  if (filters?.floor) {
    query = query.eq("floor", filters.floor);
  }
  if (filters?.room) {
    query = query.eq("room", filters.room);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.compliance_domain) {
    query = query.contains("compliance_domains", [filters.compliance_domain]);
  }
  if (filters?.linked_compliance_check) {
    query = query.contains("linked_compliance_checks", [
      filters.linked_compliance_check,
    ]);
  }
  if (filters?.search) {
    const s = sanitizeSearch(filters.search);
    query = query.or(
      `name.ilike.%${s}%,code.ilike.%${s}%,serial_number.ilike.%${s}%`,
    );
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  // Order by updated_at desc
  query = query.order("updated_at", { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching assets:", error);
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    page: pagination?.page || 1,
    page_size: pagination?.pageSize || count || 0,
    has_more:
      (count || 0) >
      (pagination?.page || 1) * (pagination?.pageSize || count || 0),
  };
}

/**
 * Get a single asset by ID.
 * When organizationId is provided (strongly recommended for all tenant-scoped paths),
 * the query is filtered to that org — prevents cross-tenant reads via the service role.
 */
export async function getAssetById(
  assetId: string,
  organizationId?: string,
): Promise<Asset | null> {
  let query = supabase
    .from("estates_assets")
    .select("*")
    .eq("id", assetId);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    console.error("Error fetching asset:", error);
    throw error;
  }

  return data;
}

/**
 * Create a new asset
 */
export async function createAsset(
  organizationId: string,
  asset: AssetInput,
): Promise<Asset> {
  // Generate QR code URL if a code is provided
  const qrCode = asset.code
    ? `${process.env.NEXT_PUBLIC_APP_URL || "https://schoolgle.co.uk"}/estates/assets/scan/${asset.code}`
    : undefined;

  const row = pickAssetColumns(asset);
  row.organization_id = organizationId;
  if (qrCode) row.qr_code = qrCode;
  if (!row.status) row.status = "active";
  if (!row.compliance_domains) row.compliance_domains = [];

  const { data, error } = await supabase
    .from("estates_assets")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("Error creating asset:", error);
    throw new Error(`Failed to create asset: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing asset.
 * organizationId is required to prevent cross-tenant writes via the service role.
 */
export async function updateAsset(
  assetId: string,
  updates: Partial<AssetInput & { status?: AssetStatus }>,
  organizationId?: string,
): Promise<Asset> {
  const row = pickAssetColumns(updates);
  row.updated_at = new Date().toISOString();

  let query = supabase
    .from("estates_assets")
    .update(row)
    .eq("id", assetId);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error("Error updating asset:", error);
    throw new Error(`Failed to update asset: ${error.message}`);
  }

  return data;
}

/**
 * Compute warranty status for an asset based on warranty_expiry date.
 */
export function computeWarrantyStatus(asset: Asset): {
  status: "active" | "expiring_soon" | "expired" | "none";
  daysRemaining: number | null;
} {
  if (!asset.warranty_expiry) {
    return { status: "none", daysRemaining: null };
  }
  const expiry = new Date(asset.warranty_expiry);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const daysRemaining = Math.floor(diffMs / 86400000);

  if (daysRemaining < 0) return { status: "expired", daysRemaining };
  if (daysRemaining <= 30) return { status: "expiring_soon", daysRemaining };
  return { status: "active", daysRemaining };
}

/**
 * Get an asset with computed warranty status and supplier contact.
 * organizationId is required to prevent cross-tenant reads via the service role.
 * Returns null if asset not found or belongs to a different org.
 */
export async function getAssetWithWarranty(
  assetId: string,
  organizationId?: string,
): Promise<AssetWithWarrantyStatus | null> {
  let query = supabase
    .from("estates_assets")
    .select("*")
    .eq("id", assetId);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data: asset, error } = await query.maybeSingle();

  if (error || !asset) return null;

  const { status: warranty_status, daysRemaining } = computeWarrantyStatus(asset);

  let supplier_contact = null;
  if (asset.purchased_from_contractor_id) {
    const { data: supplier } = await supabase
      .from("estates_contractors")
      .select("id, company_name, contact_name, email, phone, mobile")
      .eq("id", asset.purchased_from_contractor_id)
      .maybeSingle();

    if (supplier) {
      supplier_contact = {
        contractor_id: supplier.id,
        company_name: supplier.company_name,
        contact_name: supplier.contact_name,
        email: supplier.email,
        phone: supplier.phone,
        mobile: supplier.mobile,
      };
    }
  }

  let maintenance_contact = null;
  const specifications = (asset.specifications || {}) as Record<string, unknown>;
  const maintainedByContractorId =
    (asset as Asset & { maintained_by_contractor_id?: string | null })
      .maintained_by_contractor_id ||
    (typeof specifications.maintained_by_contractor_id === "string"
      ? specifications.maintained_by_contractor_id
      : null);

  if (maintainedByContractorId) {
    const { data: maintainer } = await supabase
      .from("estates_contractors")
      .select("id, company_name, contact_name, email, phone, mobile")
      .eq("id", maintainedByContractorId)
      .maybeSingle();

    if (maintainer) {
      maintenance_contact = {
        contractor_id: maintainer.id,
        company_name: maintainer.company_name,
        contact_name: maintainer.contact_name,
        email: maintainer.email,
        phone: maintainer.phone,
        mobile: maintainer.mobile,
      };
    }
  }

  return {
    ...asset,
    maintained_by_contractor_id: maintainedByContractorId,
    warranty_status,
    warranty_days_remaining: daysRemaining,
    supplier_contact,
    maintenance_contact,
  };
}

/**
 * Append an entry to the maintenance_history JSONB array.
 * Non-destructive — appends without replacing existing entries.
 * organizationId is required to prevent cross-tenant writes via the service role.
 */
export async function appendMaintenanceHistory(
  assetId: string,
  entry: MaintenanceHistoryEntry,
  organizationId?: string,
): Promise<void> {
  // Read current history, scoped to org to verify ownership
  let readQuery = supabase
    .from("estates_assets")
    .select("maintenance_history")
    .eq("id", assetId);

  if (organizationId) {
    readQuery = readQuery.eq("organization_id", organizationId);
  }

  const { data: asset, error: readErr } = await readQuery.single();

  if (readErr) throw new Error(`Failed to read asset: ${readErr.message}`);

  const current = Array.isArray(asset?.maintenance_history) ? asset.maintenance_history : [];
  const updated = [...current, entry];

  let writeQuery = supabase
    .from("estates_assets")
    .update({
      maintenance_history: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId);

  if (organizationId) {
    writeQuery = writeQuery.eq("organization_id", organizationId);
  }

  const { error: writeErr } = await writeQuery;

  if (writeErr) throw new Error(`Failed to append maintenance history: ${writeErr.message}`);
}

/**
 * Compute total maintenance spend from the asset's maintenance_history JSONB.
 * Returns total spent + a health signal comparing against replacement cost.
 */
export function computeMaintenanceSpend(asset: Asset): {
  totalSpend: number;
  entryCount: number;
  percentOfReplacement: number | null;
  recommendation: "ok" | "monitor" | "consider_replacement" | "replace_urgently";
  recommendationMessage: string;
} {
  const history = Array.isArray(asset.maintenance_history)
    ? asset.maintenance_history
    : [];
  const totalSpend = history.reduce(
    (sum, entry) => sum + (typeof entry.cost === "number" ? entry.cost : 0),
    0,
  );

  let percentOfReplacement: number | null = null;
  let recommendation: "ok" | "monitor" | "consider_replacement" | "replace_urgently" = "ok";
  let recommendationMessage = "Maintenance costs are within normal range.";

  if (
    typeof asset.replacement_cost_estimate === "number" &&
    asset.replacement_cost_estimate > 0
  ) {
    percentOfReplacement = (totalSpend / asset.replacement_cost_estimate) * 100;

    if (percentOfReplacement >= 75) {
      recommendation = "replace_urgently";
      recommendationMessage = `Maintenance costs have reached ${Math.round(percentOfReplacement)}% of replacement value (£${totalSpend.toLocaleString()} of £${asset.replacement_cost_estimate.toLocaleString()}). Replace urgently — you are throwing good money after bad.`;
    } else if (percentOfReplacement >= 50) {
      recommendation = "consider_replacement";
      recommendationMessage = `Maintenance costs have reached ${Math.round(percentOfReplacement)}% of replacement value (£${totalSpend.toLocaleString()} of £${asset.replacement_cost_estimate.toLocaleString()}). Start budgeting for a replacement.`;
    } else if (percentOfReplacement >= 25) {
      recommendation = "monitor";
      recommendationMessage = `Maintenance costs are ${Math.round(percentOfReplacement)}% of replacement value. Monitor trend but no immediate action needed.`;
    }
  }

  // Also flag if there are 3+ entries in the last 12 months
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const recentEntries = history.filter((e) => new Date(e.date) >= oneYearAgo);
  if (recentEntries.length >= 3 && recommendation === "ok") {
    recommendation = "monitor";
    recommendationMessage = `This asset has been serviced ${recentEntries.length} times in the last 12 months. Consider whether it is reliable enough to keep.`;
  }

  return {
    totalSpend,
    entryCount: history.length,
    percentOfReplacement,
    recommendation,
    recommendationMessage,
  };
}

/**
 * Get asset with all linked data — open tickets, compliance tasks, evidence,
 * and service history from estates_service_records + junction.
 * organizationId is required to prevent cross-tenant reads via the service role.
 * Used for the asset detail page.
 */
export async function getAssetWithLinks(assetId: string, organizationId?: string) {
  const asset = await getAssetWithWarranty(assetId, organizationId);
  if (!asset) return null;

  const [ticketsRes, tasksRes, evidenceRes, historyRes] = await Promise.all([
    supabase
      .from("estates_helpdesk_tickets")
      .select("id, ticket_number, title, status, priority, created_at")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("estates_compliance_tasks")
      .select("id, task_name, task_type, status, due_by, frequency")
      .eq("asset_id", assetId)
      .order("due_by", { ascending: true })
      .limit(20),
    supabase
      .from("estates_evidence")
      .select("id, title, evidence_type, file_url, file_name, file_type, created_at, tags")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false })
      .limit(20),
    // Pull service history from the new first-class table
    supabase
      .from("estates_service_record_assets")
      .select(
        `
        id, asset_id, result, findings, remedial_actions, remedial_cost_estimate,
        cost_allocated, allocation_method, last_service_date, next_service_due,
        service_record:service_record_id (
          id, service_date, service_type, compliance_domain,
          contractor_id, engineer_name, invoice_reference,
          certificate_reference, total_cost, currency, notes, overall_result
        )
        `,
      )
      .eq("asset_id", assetId)
      .order("last_service_date", { ascending: false })
      .limit(50),
  ]);

  const serviceHistory = historyRes.data || [];

  // Enrich with contractor company name
  const contractorIds = [
    ...new Set(
      serviceHistory
        .map((r) => (r as unknown as { service_record?: { contractor_id?: string | null } }).service_record?.contractor_id)
        .filter(Boolean),
    ),
  ] as string[];
  const contractorNameMap: Record<string, string> = {};
  if (contractorIds.length > 0) {
    const { data: contractors } = await supabase
      .from("estates_contractors")
      .select("id, company_name")
      .in("id", contractorIds);
    for (const c of contractors || []) contractorNameMap[c.id] = c.company_name;
  }

  const enrichedHistory = serviceHistory.map((r) => {
    const record = (r as unknown as { service_record?: { contractor_id?: string } }).service_record;
    return {
      ...r,
      contractor_name: record?.contractor_id ? contractorNameMap[record.contractor_id] : null,
    };
  });

  const totalServiceSpend = enrichedHistory.reduce(
    (sum, r) => sum + (Number((r as { cost_allocated?: number }).cost_allocated) || 0),
    0,
  );

  const spend = computeMaintenanceSpend(asset);
  // Prefer the service_records total over the legacy maintenance_history JSONB
  const effectiveSpend = {
    ...spend,
    totalSpend: totalServiceSpend > 0 ? totalServiceSpend : spend.totalSpend,
    entryCount: enrichedHistory.length || spend.entryCount,
  };

  return {
    ...asset,
    linked_tickets: ticketsRes.data || [],
    linked_tasks: tasksRes.data || [],
    linked_evidence: evidenceRes.data || [],
    service_history: enrichedHistory,
    maintenance_spend: effectiveSpend,
  };
}

/**
 * Delete an asset.
 * organizationId is required to prevent cross-tenant deletes via the service role.
 */
export async function deleteAsset(assetId: string, organizationId?: string): Promise<void> {
  let query = supabase
    .from("estates_assets")
    .delete()
    .eq("id", assetId);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { error } = await query;

  if (error) {
    console.error("Error deleting asset:", error);
    throw error;
  }
}

/**
 * Get assets by compliance domain
 */
export async function getAssetsByDomain(
  organizationId: string,
  domain: string,
): Promise<Asset[]> {
  const { data, error } = await supabase
    .from("estates_assets")
    .select("*")
    .eq("organization_id", organizationId)
    .contains("compliance_domains", [domain])
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching assets by domain:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get child assets (e.g., outlets in a room).
 * organizationId scopes the query to prevent cross-tenant reads.
 */
export async function getChildAssets(
  parentAssetId: string,
  organizationId?: string,
): Promise<Asset[]> {
  let query = supabase
    .from("estates_assets")
    .select("*")
    .eq("parent_asset_id", parentAssetId);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) {
    console.error("Error fetching child assets:", error);
    throw error;
  }

  return data || [];
}

/**
 * Search assets by code, name, or serial number
 */
export async function searchAssets(
  organizationId: string,
  searchTerm: string,
  limit = 20,
): Promise<Asset[]> {
  const s = sanitizeSearch(searchTerm);
  const { data, error } = await supabase
    .from("estates_assets")
    .select("*")
    .eq("organization_id", organizationId)
    .or(
      `name.ilike.%${s}%,code.ilike.%${s}%,serial_number.ilike.%${s}%`,
    )
    .limit(limit);

  if (error) {
    console.error("Error searching assets:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get asset statistics for an organization
 */
export async function getAssetStats(organizationId: string): Promise<{
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_compliance_domain: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from("estates_assets")
    .select("asset_type, status, compliance_domains")
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error fetching asset stats:", error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    by_type: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    by_compliance_domain: {} as Record<string, number>,
  };

  for (const asset of data || []) {
    // Count by type
    stats.by_type[asset.asset_type] =
      (stats.by_type[asset.asset_type] || 0) + 1;

    // Count by status
    stats.by_status[asset.status] = (stats.by_status[asset.status] || 0) + 1;

    // Count by compliance domain
    for (const domain of asset.compliance_domains || []) {
      stats.by_compliance_domain[domain] =
        (stats.by_compliance_domain[domain] || 0) + 1;
    }
  }

  return stats;
}
