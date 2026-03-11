import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("organizationId") || auth.organizationId;

  const { data, error } = await supabase
    .from("packs")
    .select("*, pack_templates(name)")
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return apiSuccess({ packs: data });
});

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const body = await request.json();
  const { organizationId, templateId, title, userId, sections } = body;

  const orgId = organizationId || auth.organizationId;

  if (!templateId || !title) {
    return apiError("Missing required fields", 400);
  }

  const { data, error } = await supabase
    .from("packs")
    .insert({
      organization_id: orgId,
      template_id: templateId,
      title,
      status: "draft",
      sections: sections || [],
      created_by: userId || auth.userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Create an audit log/timeline entry
  await supabase.from("timeline_entries").insert({
    organization_id: orgId,
    created_by: userId || auth.userId,
    title: `Pack created: ${title}`,
    description: `New governor pack started from template`,
    entry_type: "pack_created",
    source_type: "pack",
    source_id: data.id,
  });

  return apiSuccess(data);
});
