import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * Onboarding queue management for tracking customer setup progress
 */
export const GET = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    let query = supabase
      .from("onboarding_queue")
      .select(
        `
        *,
        organization:organizations(id, name, urn, phase),
        subscription:subscriptions(plan, status)
      `
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (assignedTo && assignedTo !== "all") {
      query = query.eq("assigned_to", assignedTo);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate summary
    const summary = {
      total: data?.length || 0,
      pending: data?.filter((i) => i.status === "pending").length || 0,
      inProgress: data?.filter((i) => i.status === "in_progress").length || 0,
      awaitingInfo: data?.filter((i) => i.status === "awaiting_info").length || 0,
      ready: data?.filter((i) => i.status === "ready").length || 0,
      completed: data?.filter((i) => i.status === "completed").length || 0,
      blocked: data?.filter((i) => i.status === "blocked").length || 0,
    };

    return apiSuccess({ data, summary });
  },
  { requiredRole: "admin" }
);

export const POST = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const { organizationId, subscriptionId, priority, assignedTo } = body;

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    // Check if already in queue
    const { data: existing } = await supabase
      .from("onboarding_queue")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (existing) {
      return apiError("Organization already in onboarding queue", 400);
    }

    const { data, error } = await supabase
      .from("onboarding_queue")
      .insert({
        organization_id: organizationId,
        subscription_id: subscriptionId,
        status: "pending",
        stage: "initial",
        priority: priority || "normal",
        assigned_to: assignedTo,
      })
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({ data });
  },
  { requiredRole: "admin" }
);

export const PATCH = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const { queueId, status, stage, priority, assignedTo, checklistItem, notes } = body;

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    let updateData: any = { updated_at: new Date().toISOString() };

    if (status) updateData.status = status;
    if (stage) updateData.stage = stage;
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assigned_to = assignedTo;
    if (notes) updateData.notes = notes;

    // Handle stage transitions
    if (status === "in_progress" && !updateData.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    // Handle checklist updates
    if (checklistItem) {
      const { data: current } = await supabase
        .from("onboarding_queue")
        .select("checklist")
        .eq("id", queueId)
        .single();

      const updatedChecklist = {
        ...(current?.checklist || {}),
        [checklistItem]: true,
      };

      updateData.checklist = updatedChecklist;

      // Check if all items complete
      const allComplete = Object.values(updatedChecklist).every((v) => v === true);
      if (allComplete && !status) {
        updateData.status = "ready";
      }
    }

    const { data, error } = await supabase
      .from("onboarding_queue")
      .update(updateData)
      .eq("id", queueId)
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({ data });
  },
  { requiredRole: "admin" }
);

export const DELETE = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const queueId = searchParams.get("queueId");

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    const { error } = await supabase
      .from("onboarding_queue")
      .delete()
      .eq("id", queueId);

    if (error) throw error;

    return apiSuccess({ deleted: true });
  },
  { requiredRole: "admin" }
);
