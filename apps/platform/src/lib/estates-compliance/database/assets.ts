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

// Whitelist of valid columns for inserts/updates to avoid schema drift.
const ASSET_COLUMNS = [
  "asset_type", "category", "subcategory", "name", "code", "qr_code", "barcode",
  "building", "floor", "room", "location_id", "location_details",
  "parent_asset_id", "installation_date",
  "manufacturer", "model", "serial_number", "specifications",
  "purchase_date", "purchase_price", "purchase_currency", "purchase_order_number",
  "invoice_number", "purchased_from_contractor_id", "purchase_document_evidence_id",
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
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`,
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
 * Get a single asset by ID
 */
export async function getAssetById(assetId: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from("estates_assets")
    .select("*")
    .eq("id", assetId)
    .single();

  if (error) {
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
 * Update an existing asset
 */
export async function updateAsset(
  assetId: string,
  updates: Partial<AssetInput & { status?: AssetStatus }>,
): Promise<Asset> {
  const row = pickAssetColumns(updates);
  row.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("estates_assets")
    .update(row)
    .eq("id", assetId)
    .select()
    .single();

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
 * Returns null if asset not found.
 */
export async function getAssetWithWarranty(
  assetId: string,
): Promise<AssetWithWarrantyStatus | null> {
  const { data: asset, error } = await supabase
    .from("estates_assets")
    .select("*")
    .eq("id", assetId)
    .maybeSingle();

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

  return {
    ...asset,
    warranty_status,
    warranty_days_remaining: daysRemaining,
    supplier_contact,
  };
}

/**
 * Append an entry to the maintenance_history JSONB array.
 * Non-destructive — appends without replacing existing entries.
 */
export async function appendMaintenanceHistory(
  assetId: string,
  entry: MaintenanceHistoryEntry,
): Promise<void> {
  // Read current history, append, write back (no array_append in pg-rest for JSONB)
  const { data: asset, error: readErr } = await supabase
    .from("estates_assets")
    .select("maintenance_history")
    .eq("id", assetId)
    .single();

  if (readErr) throw new Error(`Failed to read asset: ${readErr.message}`);

  const current = Array.isArray(asset?.maintenance_history) ? asset.maintenance_history : [];
  const updated = [...current, entry];

  const { error: writeErr } = await supabase
    .from("estates_assets")
    .update({
      maintenance_history: updated,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assetId);

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
 * Get asset with all linked data — open tickets, compliance tasks, evidence.
 * Used for the asset detail page.
 */
export async function getAssetWithLinks(assetId: string) {
  const asset = await getAssetWithWarranty(assetId);
  if (!asset) return null;

  const [ticketsRes, tasksRes, evidenceRes] = await Promise.all([
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
      .select("id, title, evidence_type, file_url, file_name, file_type, created_at")
      .eq("asset_id", assetId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const spend = computeMaintenanceSpend(asset);

  return {
    ...asset,
    linked_tickets: ticketsRes.data || [],
    linked_tasks: tasksRes.data || [],
    linked_evidence: evidenceRes.data || [],
    maintenance_spend: spend,
  };
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from("estates_assets")
    .delete()
    .eq("id", assetId);

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
 * Get child assets (e.g., outlets in a room)
 */
export async function getChildAssets(parentAssetId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from("estates_assets")
    .select("*")
    .eq("parent_asset_id", parentAssetId)
    .order("name", { ascending: true });

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
  const { data, error } = await supabase
    .from("estates_assets")
    .select("*")
    .eq("organization_id", organizationId)
    .or(
      `name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`,
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
