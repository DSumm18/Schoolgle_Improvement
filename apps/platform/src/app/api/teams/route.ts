import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  TeamForm,
  TeamWorkload,
  GetTeamWorkloadResponse,
} from "@/lib/tasks";
import { v4 as uuidv4 } from "uuid";

/**
 * GET /api/teams
 * Get teams for an organization
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const department = searchParams.get("department");
  const type = searchParams.get("type");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("teams")
    .select(
      `
            *,
            leader:users!teams_leader_id_fkey (
                id,
                email,
                raw_user_meta_data->>'full_name' as full_name
            ),
            deputy:users!teams_deputy_leader_id_fkey (
                id,
                email,
                raw_user_meta_data->>'full_name' as full_name
            )
        `,
    )
    .eq("organization_id", organizationId)
    .order("name", { ascending: true });

  if (department) {
    query = query.eq("department", department);
  }
  if (type) {
    query = query.eq("type", type);
  }

  const { data: teams, error } = await query;

  if (error) {
    console.error("Error fetching teams:", error);
    return apiError("Failed to fetch teams", 500);
  }

  // Enrich with member details
  const teamsWithMembers = await Promise.all(
    (teams || []).map(async (team: any) => {
      const memberIds = team.members?.map((m: any) => m.userId) || [];

      let members: any[] = [];
      if (memberIds.length > 0) {
        const { data: users } = await supabase
          .from("users")
          .select(
            "id, email, raw_user_meta_data->>'full_name' as full_name, avatar_url",
          )
          .in("id", memberIds.slice(0, 100));

        members = (users || []).map((u: any) => {
          const memberInfo = team.members.find((m: any) => m.userId === u.id);
          return {
            ...u,
            role: memberInfo?.role || "member",
          };
        });
      }

      // Get task count for this team
      const { count: taskCount } = await supabase
        .from("actions")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("team_id", team.id)
        .not("status", "in", ["completed", "cancelled"]);

      return {
        ...team,
        leader_name: team.leader?.full_name || team.leader?.email || null,
        deputy_leader_name:
          team.deputy?.full_name || team.deputy?.email || null,
        members,
        member_count: members.length,
        active_tasks: taskCount || 0,
      };
    }),
  );

  return apiSuccess({ teams: teamsWithMembers });
});

/**
 * POST /api/teams
 * Create a new team
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const {
    organizationId,
    name,
    description,
    color,
    icon,
    department,
    type,
    leader_id,
    deputy_leader_id,
    members,
    can_create_tasks,
    can_assign_tasks,
    can_approve_tasks,
  } = body as TeamForm & { organizationId: string };

  const orgId = organizationId || auth.organizationId;

  if (!name) {
    return apiError("Missing required fields: name", 400);
  }

  const supabase = createServiceRoleClient();

  // Prepare members with joined_at timestamp
  const membersWithTimestamp = (members || []).map((m: any) => ({
    ...m,
    joined_at: new Date().toISOString(),
  }));

  const { data: team, error } = await supabase
    .from("teams")
    .insert({
      id: uuidv4(),
      organization_id: orgId,
      name,
      description: description || null,
      color: color || "#3b82f6",
      icon: icon || "users",
      department: department || null,
      type: type || "department",
      leader_id: leader_id || null,
      deputy_leader_id: deputy_leader_id || null,
      members: membersWithTimestamp,
      can_create_tasks: can_create_tasks !== false,
      can_assign_tasks: can_assign_tasks !== false,
      can_approve_tasks: can_approve_tasks || false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating team:", error);
    return apiError("Failed to create team", 500);
  }

  return apiSuccess({ team }, 201);
});

/**
 * PATCH /api/teams
 * Bulk update teams
 */
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { organizationId, updates } = body as {
    organizationId: string;
    updates: Array<{
      id: string;
      changes: Partial<TeamForm>;
    }>;
  };

  const orgId = organizationId || auth.organizationId;

  if (!updates || !Array.isArray(updates)) {
    return apiError("Missing required fields: updates (array)", 400);
  }

  const supabase = createServiceRoleClient();

  const results = await Promise.all(
    updates.map(async ({ id, changes }) => {
      const { data, error } = await supabase
        .from("teams")
        .update({
          ...changes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organization_id", orgId)
        .select()
        .maybeSingle();

      return { team: data, error };
    }),
  );

  const successCount = results.filter((r) => !r.error && r.team).length;
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return apiSuccess({
    updated: successCount,
    failed: results.length - successCount,
    errors: errors.length > 0 ? errors : undefined,
  });
});

/**
 * DELETE /api/teams
 * Delete teams
 */
export const DELETE = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;
  const ids = searchParams.get("ids")?.split(",");

  if (!ids || ids.length === 0) {
    return apiError("Missing required parameters: ids", 400);
  }

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("teams")
    .delete()
    .in("id", ids)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("Error deleting teams:", error);
    return apiError("Failed to delete teams", 500);
  }

  return apiSuccess({ success: true, deleted: ids.length });
});
