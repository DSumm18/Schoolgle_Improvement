import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/templates/[id]
 * Get a single template by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: template, error } = await supabase
      .from("compliance_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("Template fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/compliance/templates/[id]
 * Update a centrally-maintained template (admin only).
 * Bumps version number and last_updated_at, triggering the cascade
 * notification to all schools using this template.
 *
 * Body: { content_html, description, json_schema, source_reference, dfe_reference, bump_version }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current template
    const { data: existing, error: fetchError } = await supabase
      .from("compliance_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    const updates: Record<string, any> = {
      last_updated_at: new Date().toISOString(),
    };

    if (body.content_html !== undefined)
      updates.content_html = body.content_html;
    if (body.description !== undefined) updates.description = body.description;
    if (body.json_schema !== undefined) updates.json_schema = body.json_schema;
    if (body.source_reference !== undefined)
      updates.source_reference = body.source_reference;
    if (body.dfe_reference !== undefined)
      updates.dfe_reference = body.dfe_reference;
    if (body.name !== undefined) updates.name = body.name;
    if (body.is_statutory !== undefined)
      updates.is_statutory = body.is_statutory;

    // Bump version if explicitly requested or if content changed
    if (body.bump_version || body.content_html !== undefined) {
      updates.version = existing.version + 1;
    }

    const { data: updated, error: updateError } = await supabase
      .from("compliance_templates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Template update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 },
      );
    }

    // Log the update
    await supabase.from("compliance_audit_log").insert({
      organization_id: "00000000-0000-0000-0000-000000000000", // system-level
      entity_type: "template",
      entity_id: id,
      action: "template_updated",
      actor_user_id: body.actor_user_id || null,
      metadata: {
        template_name: updated.name,
        old_version: existing.version,
        new_version: updated.version,
        source_reference: updated.source_reference,
      },
    });

    return NextResponse.json({
      template: updated,
      version_bumped: updates.version !== undefined,
      previous_version: existing.version,
    });
  } catch (error: any) {
    console.error("Template update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
