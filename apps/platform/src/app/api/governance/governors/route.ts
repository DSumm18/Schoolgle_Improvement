import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  Governor,
  GovernorForm,
  UpsertGovernorRequest,
  GetGovernorsRequest,
  GetGovernorsResponse,
  GovernorStatus,
  GovernorType,
} from "@/lib/governance";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/governance/governors
 * Get list of governors for an organization
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationId = auth.organizationId;
  const status = searchParams.get("status") as GovernorStatus | null;
  const governorType = searchParams.get("governorType") as GovernorType | null;

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("governors")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (governorType) {
    query = query.eq("governor_type", governorType);
  }

  const { data: governors, error } = await query;

  if (error) {
    console.error("Error fetching governors:", error);
    return apiError("Failed to fetch governors", 500);
  }

  const total = governors?.length || 0;
  const active =
    governors?.filter((g: Governor) => g.status === "active").length || 0;
  const vacancies =
    governors?.filter(
      (g: Governor) =>
        g.status === "active" &&
        g.end_date &&
        new Date(g.end_date) < new Date(),
    ).length || 0;

  const response: GetGovernorsResponse = {
    governors: governors || [],
    total,
    active,
    vacancies,
  };

  return apiSuccess(response);
});

/**
 * POST /api/governance/governors
 * Create a new governor
 */
export const POST = protectedRoute(
  async (auth, req: NextRequest) => {
    const body = await req.json();
    const {
      user_id: userId,
      full_name,
      email,
      phone,
      governor_type,
      role,
      committee_assignment,
      start_date,
      end_date,
      appointment_date,
      appointing_body,
      skills,
      declarations_of_interest,
    } = body as UpsertGovernorRequest;
    const photo_url = (body as any).photo_url;

    const organizationId = auth.organizationId;

    if (!full_name || !governor_type) {
      return apiError("Missing required fields: full_name, governor_type", 400);
    }

    const supabase = createServiceRoleClient();

    // Get or create board
    const { data: board } = await supabase
      .from("governance_boards")
      .select("id")
      .eq("organization_id", organizationId)
      .single();

    // Create governor
    const { data: governor, error } = await supabase
      .from("governors")
      .insert({
        id: uuidv4(),
        organization_id: organizationId,
        board_id: board?.id || null,
        user_id: userId || null,
        full_name,
        email: email || null,
        phone: phone || null,
        photo_url: photo_url || null,
        governor_type,
        role: role || null,
        committee_assignment: committee_assignment || [],
        start_date: start_date || null,
        end_date: end_date || null,
        appointment_date: appointment_date || null,
        appointing_body: appointing_body || null,
        status: "active",
        skills: skills || [],
        declarations_of_interest: declarations_of_interest || {},
        meetings_attended: 0,
        meetings_total: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating governor:", error);
      return apiError("Failed to create governor", 500);
    }

    return apiSuccess({ governor }, 201);
  },
  { requiredRole: "slt" },
);

/**
 * PATCH /api/governance/governors
 * Bulk update governors (for updating multiple records at once)
 */
export const PATCH = protectedRoute(
  async (auth, req: NextRequest) => {
    const body = await req.json();
    const { updates } = body as {
      updates: Array<{ id: string; changes: Partial<GovernorForm> }>;
    };

    const organizationId = auth.organizationId;

    if (!updates || !Array.isArray(updates)) {
      return apiError("Missing required fields: updates (array)", 400);
    }

    const supabase = createServiceRoleClient();

    const results = await Promise.all(
      updates.map(async ({ id, changes }) => {
        const { data, error } = await supabase
          .from("governors")
          .update({
            ...changes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("organization_id", organizationId)
          .select()
          .single();

        return { governor: data, error };
      }),
    );

    const successCount = results.filter((r) => !r.error).length;
    const errors = results.filter((r) => r.error).map((r) => r.error);

    return apiSuccess({
      updated: successCount,
      failed: results.length - successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  },
  { requiredRole: "slt" },
);
