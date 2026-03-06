import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/compliance/templates/updates?organizationId=...
 *
 * Check which of the organization's policies are based on outdated template versions.
 * Returns a list of items where the source template has been updated since the policy
 * was created, enabling a "template update available" notification cascade.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId parameter" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all published/approved policies for this org that were created from a template
    const { data: items, error: itemsError } = await supabase
      .from("compliance_items")
      .select(
        `
        id,
        title,
        status,
        compliance_versions!inner (
          id,
          version_number,
          source_template_id,
          created_at
        )
      `,
      )
      .eq("organization_id", organizationId)
      .eq("type", "policy")
      .in("status", ["published", "approved", "draft", "in_review"])
      .not("compliance_versions.source_template_id", "is", null);

    if (itemsError) {
      console.error("Error fetching items:", itemsError);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 },
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ updates: [] });
    }

    // Collect unique template IDs
    const templateIds = new Set<string>();
    for (const item of items) {
      const versions = item.compliance_versions as any[];
      for (const v of versions) {
        if (v.source_template_id) {
          templateIds.add(v.source_template_id);
        }
      }
    }

    // Get current template versions
    const { data: templates, error: tplError } = await supabase
      .from("compliance_templates")
      .select("id, name, version, last_updated_at, source_reference")
      .in("id", Array.from(templateIds));

    if (tplError) {
      console.error("Error fetching templates:", tplError);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 },
      );
    }

    const templateMap = new Map((templates || []).map((t) => [t.id, t]));

    // Compare: find items where the latest version was created BEFORE
    // the template was last updated
    const updates: Array<{
      item_id: string;
      item_title: string;
      item_status: string;
      template_id: string;
      template_name: string;
      template_version: number;
      template_source_reference: string | null;
      template_updated_at: string;
      item_version_created_at: string;
    }> = [];

    for (const item of items) {
      const versions = (item.compliance_versions as any[]).sort(
        (a: any, b: any) => b.version_number - a.version_number,
      );
      const latestVersion = versions[0];
      if (!latestVersion?.source_template_id) continue;

      const template = templateMap.get(latestVersion.source_template_id);
      if (!template) continue;

      // If template was updated after the policy version was created
      if (
        new Date(template.last_updated_at) > new Date(latestVersion.created_at)
      ) {
        updates.push({
          item_id: item.id,
          item_title: item.title,
          item_status: item.status,
          template_id: template.id,
          template_name: template.name,
          template_version: template.version,
          template_source_reference: template.source_reference,
          template_updated_at: template.last_updated_at,
          item_version_created_at: latestVersion.created_at,
        });
      }
    }

    return NextResponse.json({
      updates,
      total_policies_checked: items.length,
      updates_available: updates.length,
    });
  } catch (error: any) {
    console.error("Template updates check error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
