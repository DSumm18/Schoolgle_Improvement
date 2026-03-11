import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  GovernorVisit,
  GovernorVisitForm,
  VisitType,
  VisitStatus,
} from "@/lib/governance";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/governance/visits
 * Get governor visits for an organization
 */
export const GET = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const governorId = searchParams.get("governorId");
  const visitType = searchParams.get("visitType") as VisitType | null;
  const status = searchParams.get("status") as VisitStatus | null;
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!organizationId) {
    return apiError("Missing organizationId parameter", 400);
  }

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("governor_visits")
    .select("*")
    .eq("organization_id", organizationId)
    .order("scheduled_date", { ascending: true });

  if (governorId) {
    query = query.eq("governor_id", governorId);
  }
  if (visitType) {
    query = query.eq("visit_type", visitType);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (fromDate) {
    query = query.gte("scheduled_date", fromDate);
  }
  if (toDate) {
    query = query.lte("scheduled_date", toDate);
  }

  query = query.limit(limit);

  const { data: visits, error } = await query;

  if (error) {
    console.error("Error fetching visits:", error);
    return apiError("Failed to fetch visits", 500);
  }

  // Get governor details
  const governorIds = visits?.map((v: GovernorVisit) => v.governor_id) || [];
  let governorsMap: Record<string, { name: string; email: string | null }> = {};
  if (governorIds.length > 0) {
    const { data: governors } = await supabase
      .from("governors")
      .select("id, full_name, email")
      .in("id", governorIds);

    governorsMap = (governors || []).reduce((acc: any, g: any) => {
      acc[g.id] = { name: g.full_name, email: g.email };
      return acc;
    }, {});
  }

  // Enrich visits with governor names
  const enrichedVisits =
    visits?.map((visit: any) => ({
      ...visit,
      governor_name: governorsMap[visit.governor_id]?.name || "Unknown",
      governor_email: governorsMap[visit.governor_id]?.email || null,
    })) || [];

  const scheduled = enrichedVisits.filter(
    (v: any) => v.status === "scheduled",
  ).length;
  const completed = enrichedVisits.filter(
    (v: any) => v.status === "completed",
  ).length;

  return apiSuccess({
    visits: enrichedVisits,
    total: enrichedVisits.length,
    scheduled,
    completed,
  });
});

/**
 * POST /api/governance/visits
 * Create a new governor visit
 */
export const POST = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const {
    organizationId,
    governorId,
    visit_type,
    title,
    description,
    scheduled_date,
    start_time,
    end_time,
    location,
    subject,
    year_groups,
    key_focus,
  } = body as {
    organizationId: string;
    governorId: string;
    visit_type: VisitType;
    title: string;
    description?: string;
    scheduled_date: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    subject?: string;
    year_groups?: string[];
    key_focus?: string[];
  };

  const orgId = organizationId || auth.organizationId;

  if (!orgId || !governorId || !visit_type || !title || !scheduled_date) {
    return apiError(
      "Missing required fields: organizationId, governorId, visit_type, title, scheduled_date",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const { data: visit, error } = await supabase
    .from("governor_visits")
    .insert({
      id: uuidv4(),
      organization_id: orgId,
      governor_id: governorId,
      visit_type,
      title,
      description: description || null,
      scheduled_date,
      start_time: start_time || null,
      end_time: end_time || null,
      location: location || null,
      subject: subject || null,
      year_groups: year_groups || [],
      key_focus: key_focus || [],
      findings: null,
      recommendations: [],
      rating: null,
      report_document_id: null,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating visit:", error);
    return apiError("Failed to create visit", 500);
  }

  return apiSuccess({ visit }, 201);
});

/**
 * PATCH /api/governance/visits
 * Bulk update visits
 */
export const PATCH = protectedRoute(async (auth, req) => {
  const body = await req.json();
  const { organizationId, updates } = body as {
    organizationId: string;
    updates: Array<{
      id: string;
      changes: Partial<GovernorVisitForm> & {
        status?: VisitStatus;
        rating?: string;
        findings?: string;
        recommendations?: string[];
      };
    }>;
  };

  const orgId = organizationId || auth.organizationId;

  if (!orgId || !updates || !Array.isArray(updates)) {
    return apiError(
      "Missing required fields: organizationId, updates (array)",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  const results = await Promise.all(
    updates.map(async ({ id, changes }) => {
      const { data, error } = await supabase
        .from("governor_visits")
        .update({
          ...changes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", orgId)
        .select()
        .single();

      return { visit: data, error };
    }),
  );

  const successCount = results.filter((r) => !r.error).length;
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return apiSuccess({
    updated: successCount,
    failed: results.length - successCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * DELETE /api/governance/visits
 * Delete visit records
 */
export const DELETE = protectedRoute(async (auth, req) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const ids = searchParams.get("ids")?.split(",");

  if (!organizationId || !ids || ids.length === 0) {
    return apiError("Missing required parameters: organizationId, ids", 400);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("governor_visits")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting visits:", error);
    return apiError("Failed to delete visits", 500);
  }

  return apiSuccess({ success: true, deleted: ids.length });
});
