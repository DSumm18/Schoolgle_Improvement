import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/items/[id]/versions
 * List all versions for a compliance item
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("compliance_versions")
      .select("*")
      .eq("compliance_item_id", id)
      .order("version_number", { ascending: false });

    if (error) {
      console.error("Error fetching versions:", error);
      return NextResponse.json(
        { error: "Failed to fetch versions" },
        { status: 500 },
      );
    }

    return NextResponse.json({ versions: data || [] });
  } catch (error: any) {
    console.error("Versions API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/compliance/items/[id]/versions
 * Create a new version (auto-increments version_number)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      content_format,
      content_html,
      content_md,
      created_by_user_id,
      change_summary,
      source_template_id,
    } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current max version number
    const { data: latest } = await supabase
      .from("compliance_versions")
      .select("version_number")
      .eq("compliance_item_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (latest?.version_number || 0) + 1;

    const contentHash = content_html
      ? Buffer.from(content_html).toString("base64").slice(0, 40)
      : content_md
        ? Buffer.from(content_md).toString("base64").slice(0, 40)
        : undefined;

    const { data: version, error } = await supabase
      .from("compliance_versions")
      .insert({
        compliance_item_id: id,
        version_number: nextVersion,
        content_format: content_format || "html",
        content_html,
        content_md,
        created_by_user_id,
        change_summary,
        content_hash: contentHash,
        source_template_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating version:", error);
      return NextResponse.json(
        { error: "Failed to create version" },
        { status: 500 },
      );
    }

    // Update item's updated_at
    const { data: item } = await supabase
      .from("compliance_items")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("organization_id")
      .single();

    // Audit log
    if (item) {
      await supabase.from("compliance_audit_log").insert({
        organization_id: item.organization_id,
        entity_type: "compliance_version",
        entity_id: version.id,
        action: "created",
        actor_user_id: created_by_user_id,
        metadata: { compliance_item_id: id, version_number: nextVersion },
      });
    }

    return NextResponse.json({ version }, { status: 201 });
  } catch (error: any) {
    console.error("Version create error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
