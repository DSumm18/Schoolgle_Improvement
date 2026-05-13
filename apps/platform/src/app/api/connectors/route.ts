import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

type StaffConnectorRow = {
  id: string;
  staff_id: string | null;
  connector_type_id: string;
  notes?: string | null;
  training_certificate_url?: string | null;
  [key: string]: unknown;
};

type ConnectorTypeRow = {
  id: string;
  slug: string;
  [key: string]: unknown;
};

type StaffRow = {
  id: string;
  [key: string]: unknown;
};

// GET /api/connectors - List all connectors for the organization with staff + type details
// Requires teacher role minimum — viewers should not see staff training details
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const staffId = searchParams.get("staffId");
  const typeSlug = searchParams.get("typeSlug");
  const status = searchParams.get("status") || "active";

  let query = supabase
    .from("staff_connectors")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("created_at", { ascending: false });

  if (staffId) {
    query = query.eq("staff_id", staffId);
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: connectors, error } = await query;

  if (error) {
    console.error("Error fetching connectors:", error);
    return apiError("Failed to fetch connectors", 500);
  }

  const connectorRows = (connectors || []) as StaffConnectorRow[];
  const connectorTypeIds = [
    ...new Set(connectorRows.map((connector) => connector.connector_type_id).filter(Boolean)),
  ];
  let typeMap: Record<string, ConnectorTypeRow> = {};

  if (connectorTypeIds.length > 0) {
    const { data: types, error: typeError } = await supabase
      .from("connector_types")
      .select("*")
      .in("id", connectorTypeIds);

    if (typeError) {
      console.error("Error fetching connector types:", typeError);
      return apiError("Failed to fetch connector types", 500);
    }

    typeMap = Object.fromEntries(
      ((types || []) as ConnectorTypeRow[]).map((type) => [type.id, type]),
    );
  }

  const filtered = connectorRows.filter((connector) => {
    const connectorType = typeMap[connector.connector_type_id];
    return !typeSlug || connectorType?.slug === typeSlug;
  });

  // Fetch staff details for all unique staff_ids
  const staffIds = [...new Set(filtered.map((connector) => connector.staff_id).filter(Boolean))];
  let staffMap: Record<string, StaffRow> = {};

  if (staffIds.length > 0) {
    const { data: staffData } = await supabase
      .from("staff_directory")
      .select("id, first_name, last_name, display_name, job_title, avatar_url")
      .in("id", staffIds);

    if (staffData) {
      staffMap = Object.fromEntries(
        (staffData as StaffRow[]).map((staff) => [staff.id, staff]),
      );
    }
  }

  // Strip sensitive fields from response — notes and certificate URLs
  // are only visible in the detail/edit views, not in list responses
  const enriched = filtered.map((connector) => ({
    ...connector,
    notes: undefined, // Do not expose free-text notes in list view
    training_certificate_url: undefined, // Do not expose certificate URLs in list view
    connector_type: typeMap[connector.connector_type_id] || null,
    staff: connector.staff_id ? staffMap[connector.staff_id] || null : null,
  }));

  return apiSuccess(enriched);
}, { requiredRole: "teacher" });
