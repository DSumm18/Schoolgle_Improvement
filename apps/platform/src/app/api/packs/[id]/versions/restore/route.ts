import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("packs") + 1];
  const body = await request.json();
  const { versionNumber, userId, organizationId } = body;

  if (!versionNumber) return apiError("versionNumber is required", 400);

  const { data: version, error: vError } = await supabase
    .from("pack_versions")
    .select("*")
    .eq("pack_id", id)
    .eq("version_number", versionNumber)
    .single();

  if (vError || !version) return apiError("Version not found", 404);

  const { data: pack, error: pError } = await supabase
    .from("packs")
    .update({
      sections: version.sections,
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (pError) throw pError;

  const { data: lastV } = await supabase
    .from("pack_versions")
    .select("version_number")
    .eq("pack_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextV = (lastV?.version_number || 0) + 1;

  await supabase.from("pack_versions").insert({
    pack_id: id,
    version_number: nextV,
    sections: version.sections,
    trigger_type: "restore",
    changed_by: userId || auth.userId,
    change_summary: `Restored to version ${versionNumber}`,
  });

  await supabase.from("timeline_entries").insert({
    organization_id: organizationId || pack.organization_id,
    created_by: userId || auth.userId,
    title: `Version Restored: ${pack.title}`,
    description: `Document content rolled back to version ${versionNumber}.`,
    entry_type: "system",
    source_type: "pack",
    source_id: id,
  });

  return apiSuccess(pack);
});
