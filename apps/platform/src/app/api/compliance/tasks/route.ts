import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/tasks
 * List compliance tasks for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const status = searchParams.get("status");
    const assignedTo = searchParams.get("assignedTo");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("compliance_tasks")
      .select("*, compliance_item:compliance_items(id, title, type, status)")
      .eq("organization_id", organizationId)
      .order("due_date", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }
    if (assignedTo) {
      query = query.eq("assigned_to_user_id", assignedTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 },
      );
    }

    return NextResponse.json({ tasks: data || [] });
  } catch (error: any) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/tasks
 * Create a new compliance task
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      compliance_item_id,
      title,
      description,
      assigned_to_user_id,
      assigned_to_role,
      due_date,
      evidence_required,
      created_by_user_id,
    } = body;

    if (!organizationId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, title" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: task, error } = await supabase
      .from("compliance_tasks")
      .insert({
        organization_id: organizationId,
        compliance_item_id,
        title,
        description,
        assigned_to_user_id,
        assigned_to_role,
        due_date,
        status: "pending",
        evidence_required: evidence_required || false,
        created_by_user_id,
      })
      .select("*, compliance_item:compliance_items(id, title, type, status)")
      .single();

    if (error) {
      console.error("Error creating task:", error);
      return NextResponse.json(
        { error: "Failed to create task" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: organizationId,
      entity_type: "compliance_task",
      entity_id: task.id,
      action: "created",
      actor_user_id: created_by_user_id,
      metadata: { title, due_date, assigned_to_user_id },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error("Task create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/compliance/tasks
 * Update task status
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, completed_at, actor_user_id } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id, status" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "completed") {
      updateData.completed_at = completed_at || new Date().toISOString();
    }

    const { data: task, error } = await supabase
      .from("compliance_tasks")
      .update(updateData)
      .eq("id", id)
      .select("*, compliance_item:compliance_items(id, title, type, status)")
      .single();

    if (error) {
      console.error("Error updating task:", error);
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 },
      );
    }

    // Audit log
    await supabase.from("compliance_audit_log").insert({
      organization_id: task.organization_id,
      entity_type: "compliance_task",
      entity_id: id,
      action: status === "completed" ? "completed" : "status_changed",
      actor_user_id,
      metadata: { status },
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("Task update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
