import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { CreateTaskRequest, Module } from "@/types/universal-task";

export const POST = protectedRoute(async (auth, request) => {
  const body: CreateTaskRequest = await request.json();

  // Basic validation
  const requiredFields = ["title", "module", "task_type"];
  for (const field of requiredFields) {
    if (!body[field as keyof CreateTaskRequest]) {
      return apiError(`Missing required field: ${field}`, 400);
    }
  }

  // Validate module
  const validModules: Module[] = [
    "estates",
    "teaching",
    "finance",
    "hr",
    "compliance",
  ];
  if (!validModules.includes(body.module)) {
    return apiError("Invalid module", 400);
  }

  const supabase = createServiceRoleClient();

  // Build task data
  const taskData = {
    request_title: body.title,
    description: body.description,
    module: body.module,
    task_type: body.task_type,
    priority: body.priority || "normal",
    visibility: body.visibility || "team",
    due_date: body.due_date,
    estimated_duration_minutes: body.estimated_duration_minutes,
    context_data: body.context_data || {},

    school_id: body.school_id || auth.organizationId,
    requested_by_user_id: auth.userId,

    location_details: body.context_data?.location,
    category: body.task_type,
    status: "open",

    risk_likelihood: body.context_data?.risk_likelihood,
    risk_impact: body.context_data?.risk_impact,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("maintenance_requests")
    .insert([taskData])
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating task:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(
    {
      message: "Task created successfully",
      data,
    },
    201,
  );
});

export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const module = searchParams.get("module");

  let query = supabase
    .from("maintenance_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (module) {
    query = query.eq("module", module);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error fetching tasks:", error);
    return apiError(error.message, 500);
  }

  return apiSuccess(data || []);
});
