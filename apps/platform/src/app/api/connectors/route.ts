import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

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
    .select(`
      *,
      connector_types (
        id, name, slug, description, category, is_statutory,
        statutory_basis, min_count, requires_training,
        training_name, training_renewal_months,
        modules, responsibilities, icon, color, auto_tasks
      )
    `)
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

  // If typeSlug filter, post-filter on joined data
  let filtered = connectors || [];
  if (typeSlug) {
    filtered = filtered.filter(
      (c: any) => c.connector_types?.slug === typeSlug
    );
  }

  // Fetch staff details for all unique staff_ids
  const staffIds = [...new Set(filtered.map((c: any) => c.staff_id))];
  let staffMap: Record<string, any> = {};

  if (staffIds.length > 0) {
    const { data: staffData } = await supabase
      .from("staff_directory")
      .select("id, first_name, last_name, display_name, job_title, avatar_url")
      .in("id", staffIds);

    if (staffData) {
      staffMap = Object.fromEntries(staffData.map((s: any) => [s.id, s]));
    }
  }

  // Strip sensitive fields from response — notes and certificate URLs
  // are only visible in the detail/edit views, not in list responses
  const enriched = filtered.map((c: any) => ({
    ...c,
    notes: undefined, // Do not expose free-text notes in list view
    training_certificate_url: undefined, // Do not expose certificate URLs in list view
    connector_type: c.connector_types,
    connector_types: undefined,
    staff: staffMap[c.staff_id] || null,
  }));

  return apiSuccess(enriched);
}, { requiredRole: "teacher" });
