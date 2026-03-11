import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Calculate deadline date: received + 20 working days
 * Skips weekends (Saturday/Sunday). Does not account for bank holidays.
 */
function addWorkingDays(startDate: string, days: number): string {
  const date = new Date(startDate);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  return date.toISOString().split("T")[0];
}

/**
 * GET /api/compliance/foi
 * List FOI requests for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("compliance_foi_requests")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching FOI requests:", error);
    return apiError("Failed to fetch FOI requests", 500);
  }

  return apiSuccess({ requests: data || [] });
});

/**
 * POST /api/compliance/foi
 * Create a new FOI request (auto-calculates deadline as received + 20 working days)
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      requester_name,
      requester_email,
      requester_address,
      date_received,
      description,
      information_requested,
      assigned_to,
      status,
      exemptions_applied,
      response_summary,
      notes,
    } = body;

    if (!requester_name || !description) {
      return apiError(
        "Missing required fields: requester_name, description",
        400,
      );
    }

    const supabase = createServiceRoleClient();

    const received = date_received || new Date().toISOString().split("T")[0];
    const deadline_date = addWorkingDays(received, 20);

    const { data: foiRequest, error } = await supabase
      .from("compliance_foi_requests")
      .insert({
        organization_id: organizationId,
        requester_name,
        requester_email,
        requester_address,
        date_received: received,
        deadline_date,
        description,
        information_requested,
        assigned_to,
        status: status || "received",
        exemptions_applied: exemptions_applied || [],
        response_summary,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating FOI request:", error);
      return apiError("Failed to create FOI request", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "foi_request",
      entity_id: foiRequest.id,
      action: "created",
      actor_user_id: userId,
      metadata: { requester_name, deadline_date, description },
    });

    return apiSuccess({ request: foiRequest }, 201);
  },
  { requiredRole: "slt" },
);
