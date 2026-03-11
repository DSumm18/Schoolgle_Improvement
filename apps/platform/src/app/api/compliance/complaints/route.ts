import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Generate a complaint reference number: COMP-YYYY-NNN
 */
async function generateReferenceNumber(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `COMP-${year}-`;

  const { data } = await supabase
    .from("compliance_complaints")
    .select("reference_number")
    .eq("organization_id", organizationId)
    .like("reference_number", `${prefix}%`)
    .order("reference_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (data?.reference_number) {
    const lastNum = parseInt(data.reference_number.split("-")[2], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(3, "0")}`;
}

/**
 * GET /api/compliance/complaints
 * List complaints for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const stage = searchParams.get("stage");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("compliance_complaints")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (stage) {
    query = query.eq("current_stage", stage);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching complaints:", error);
    return apiError("Failed to fetch complaints", 500);
  }

  return apiSuccess({ complaints: data || [] });
});

/**
 * POST /api/compliance/complaints
 * Create a new complaint (auto-generates reference_number as COMP-YYYY-NNN)
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;
    const body = await request.json();
    const {
      complainant_name,
      complainant_relationship,
      date_received,
      nature_of_complaint,
      category,
      current_stage,
      notes,
    } = body;

    if (!complainant_name || !nature_of_complaint) {
      return apiError(
        "Missing required fields: complainant_name, nature_of_complaint",
        400,
      );
    }

    const supabase = createServiceRoleClient();

    const reference_number = await generateReferenceNumber(
      supabase,
      organizationId,
    );

    const received = date_received || new Date().toISOString().split("T")[0];

    const { data: complaint, error } = await supabase
      .from("compliance_complaints")
      .insert({
        organization_id: organizationId,
        reference_number,
        complainant_name,
        complainant_relationship,
        date_received: received,
        nature_of_complaint,
        category,
        current_stage: current_stage || "stage_1",
        status: "open",
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating complaint:", error);
      return apiError("Failed to create complaint", 500);
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "complaint",
      entity_id: complaint.id,
      action: "created",
      actor_user_id: userId,
      metadata: {
        reference_number,
        complainant_name,
        current_stage: current_stage || "stage_1",
      },
    });

    return apiSuccess({ complaint }, 201);
  },
  { requiredRole: "slt" },
);
