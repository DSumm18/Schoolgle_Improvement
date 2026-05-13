import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

type ConnectorTypeRow = {
  id: string;
  slug: string;
  [key: string]: unknown;
};

type StaffConnectorRow = {
  id: string;
  connector_type_id: string;
  staff_id: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

type StaffRow = {
  id: string;
  [key: string]: unknown;
};

type ResolvedConnector = {
  connector_type: ConnectorTypeRow;
  assignments: Array<StaffConnectorRow & { notes: undefined; staff: StaffRow | null }>;
  is_configured: boolean;
};

function parseSlugs(value: string | null) {
  return (value || "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
}

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const slugs = parseSlugs(searchParams.get("slugs"));
  const includeEmpty = searchParams.get("includeEmpty") !== "false";

  let typeQuery = supabase
    .from("connector_types")
    .select("*")
    .or(`organization_id.is.null,organization_id.eq.${auth.organizationId}`)
    .order("sort_order", { ascending: true });

  if (slugs.length > 0) {
    typeQuery = typeQuery.in("slug", slugs);
  }

  const { data: connectorTypes, error: typeError } = await typeQuery;
  if (typeError) {
    console.error("Error resolving connector types:", typeError);
    return apiError("Failed to resolve connector types", 500);
  }

  const connectorTypeRows = (connectorTypes || []) as ConnectorTypeRow[];
  const typeIds = connectorTypeRows.map((type) => type.id);
  const { data: assignments, error: assignmentError } = typeIds.length
    ? await supabase
        .from("staff_connectors")
        .select("*")
        .eq("organization_id", auth.organizationId)
        .eq("status", "active")
        .in("connector_type_id", typeIds)
    : { data: [], error: null };

  if (assignmentError) {
    console.error("Error resolving connector assignments:", assignmentError);
    return apiError("Failed to resolve connector assignments", 500);
  }

  const assignmentRows = (assignments || []) as StaffConnectorRow[];
  const staffIds = [
    ...new Set(assignmentRows.map((assignment) => assignment.staff_id).filter(Boolean)),
  ];
  let staffMap: Record<string, StaffRow> = {};

  if (staffIds.length > 0) {
    const { data: staff, error: staffError } = await supabase
      .from("staff_directory")
      .select("id, first_name, last_name, display_name, email, job_title, role_category, is_active")
      .eq("organization_id", auth.organizationId)
      .in("id", staffIds);

    if (staffError) {
      console.error("Error resolving connector staff:", staffError);
      return apiError("Failed to resolve connector staff", 500);
    }

    staffMap = Object.fromEntries(((staff || []) as StaffRow[]).map((person) => [person.id, person]));
  }

  const assignmentsByType = new Map<string, ResolvedConnector["assignments"]>();
  for (const assignment of assignmentRows) {
    const list = assignmentsByType.get(assignment.connector_type_id) || [];
    list.push({
      ...assignment,
      notes: undefined,
      staff: assignment.staff_id ? staffMap[assignment.staff_id] || null : null,
    });
    assignmentsByType.set(assignment.connector_type_id, list);
  }

  const connectors = connectorTypeRows
    .map((type) => ({
      connector_type: type,
      assignments: assignmentsByType.get(type.id) || [],
      is_configured: (assignmentsByType.get(type.id) || []).length > 0,
    }))
    .filter((connector) => includeEmpty || connector.is_configured);

  return apiSuccess({ connectors });
});
