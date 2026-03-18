import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type {
  TaskTemplate,
  TaskTemplateForm,
  ActionChecklistItem,
} from "@/lib/tasks";
import { v4 as uuidv4 } from "uuid";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/task-templates
 * Get task templates (org-specific and public)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const category = searchParams.get("category");
    const isPublic = searchParams.get("isPublic") === "true";
    const isStatutory = searchParams.get("isStatutory") === "true";
    const search = searchParams.get("search");

    if (!organizationId && !isPublic) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("task_templates")
      .select(
        `
                *,
                creator:users!task_templates_created_by_fkey (
                    id,
                    email,
                    raw_user_meta_data->>'full_name' as full_name
                )
            `,
      )
      .order("category", { ascending: true })
      .order("created_at", { ascending: false });

    if (organizationId) {
      query = query.or(
        `organization_id.eq.${organizationId},is_public.eq.true`,
      );
    } else {
      query = query.eq("is_public", true);
    }

    if (category) {
      query = query.eq("category", category);
    }
    if (isStatutory) {
      query = query.eq("is_statutory", true);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Error fetching task templates:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      templates: templates || [],
      total: templates?.length || 0,
    });
  } catch (error: any) {
    console.error("Task Templates API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/task-templates
 * Create a new task template
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      organizationId,
      name,
      description,
      category,
      subcategory,
      default_priority,
      default_due_days,
      estimated_hours,
      checklist_template,
      default_assignee_type,
      default_assignee_id,
      requires_approval,
      approval_workflow,
      is_public,
      is_statutory,
      userId,
    } = body as TaskTemplateForm & { organizationId: string; userId?: string };

    if (!organizationId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, name" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare checklist with IDs
    const checklistWithIds = (checklist_template || []).map((item) => ({
      ...item,
      id: uuidv4(),
    }));

    const { data: template, error } = await supabase
      .from("task_templates")
      .insert({
        id: uuidv4(),
        organization_id: organizationId || null, // null for public templates
        name,
        description: description || null,
        category: category || null,
        subcategory: subcategory || null,
        default_priority: default_priority || "medium",
        default_due_days: default_due_days || 14,
        estimated_hours: estimated_hours || null,
        checklist_template: checklistWithIds,
        default_assignee_type: default_assignee_type || null,
        default_assignee_id: default_assignee_id || null,
        requires_approval: requires_approval || false,
        approval_workflow: approval_workflow || null,
        is_public: is_public || false,
        is_statutory: is_statutory || false,
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task template:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 },
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("Task Template creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/task-templates
 * Update task templates
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { organizationId, updates } = body as {
      organizationId: string;
      updates: Array<{
        id: string;
        changes: Partial<TaskTemplateForm>;
      }>;
    };

    if (!organizationId || !updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Missing required fields: organizationId, updates (array)" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = await Promise.all(
      updates.map(async ({ id, changes }) => {
        const updateData: any = { ...changes };

        // Handle checklist updates
        if (changes.checklist_template) {
          updateData.checklist_template = changes.checklist_template.map(
            (item) => ({
              ...item,
              id: item.id || uuidv4(),
            }),
          );
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
          .from("task_templates")
          .update(updateData)
          .eq("id", id)
          // Only owner can modify
          .eq("organization_id", organizationId)
          .select()
          .maybeSingle();

        return { template: data, error };
      }),
    );

    const successCount = results.filter((r) => !r.error && r.template).length;
    const errors = results.filter((r) => r.error).map((r) => r.error);

    return NextResponse.json({
      updated: successCount,
      failed: results.length - successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Task Template update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/task-templates
 * Delete task templates
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");
    const ids = searchParams.get("ids")?.split(",");

    if (!organizationId || !ids || ids.length === 0) {
      return NextResponse.json(
        { error: "Missing required parameters: organizationId, ids" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("task_templates")
      .delete()
      .in("id", ids)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error deleting task templates:", error);
      return NextResponse.json(
        { error: "Failed to delete templates" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, deleted: ids.length });
  } catch (error: any) {
    console.error("Task Template deletion error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/task-templates/[id]/apply
 * Create a task from a template
 */
export async function applyTemplate(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      templateId,
      organizationId,
      userId,
      custom_due_date,
      assignee_id,
      team_id,
    } = body as {
      templateId: string;
      organizationId: string;
      userId: string;
      custom_due_date?: string;
      assignee_id?: string;
      team_id?: string;
    };

    if (!templateId || !organizationId || !userId) {
      return NextResponse.json(
        {
          error: "Missing required fields: templateId, organizationId, userId",
        },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get template
    const { data: template, error: templateError } = await supabase
      .from("task_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Check if template is accessible
    if (template.organization_id !== organizationId && !template.is_public) {
      return NextResponse.json(
        { error: "Template not accessible" },
        { status: 403 },
      );
    }

    // Calculate due date
    const dueDate = custom_due_date
      ? custom_due_date
      : new Date(
          Date.now() + (template.default_due_days || 14) * 24 * 60 * 60 * 1000,
        )
          .toISOString()
          .split("T")[0];

    // Create task from template
    const taskId = uuidv4();
    const checklistWithIds = (template.checklist_template || []).map(
      (item: any) => ({
        ...item,
        id: uuidv4(),
        completed: false,
        completed_by: null,
        completed_at: null,
      }),
    );

    const { data: task, error: taskError } = await supabase
      .from("actions")
      .insert({
        id: taskId,
        organization_id: organizationId,
        user_id: userId,
        title: template.name,
        description: template.description || "",
        category_id: template.category || null,
        subcategory_id: template.subcategory || null,
        priority: template.default_priority,
        due_date: dueDate,
        task_type: "general",
        team_id: team_id || null,
        assignee_id: assignee_id || null,
        estimated_hours: template.estimated_hours,
        checklist: checklistWithIds,
        template_id: templateId,
        approval_status: template.requires_approval
          ? "pending_approval"
          : "approved",
        progress: 0,
        status: "not_started",
        linked_evidence: [],
        notes: [],
        dependencies: [],
      })
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task from template:", taskError);
      return NextResponse.json(
        { error: "Failed to create task from template" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      task_id: taskId,
      task,
      message: `Task "${template.name}" created successfully`,
    });
  } catch (error: any) {
    console.error("Apply template error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
