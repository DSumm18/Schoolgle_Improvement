import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const id = request.nextUrl.pathname.split("/").pop()!;

  const { data, error } = await supabase
    .from("packs")
    .select("*, pack_templates(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  if (!data) return apiError("Pack not found", 404);

  return apiSuccess(data);
});

export const PATCH = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const id = request.nextUrl.pathname.split("/").pop()!;
  const body = await request.json();
  const { title, status, sections, userId, organizationId } = body;

  const { data: currentPack, error: fetchError } = await supabase
    .from("packs")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !currentPack) return apiError("Pack not found", 404);

  const { data, error } = await supabase
    .from("packs")
    .update({
      title: title || currentPack.title,
      status: status || currentPack.status,
      sections: sections || currentPack.sections,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Logic for versioning - if status changed or if sections changed significantly
  if (status && status !== currentPack.status) {
    const { data: lastVersion } = await supabase
      .from("pack_versions")
      .select("version_number")
      .eq("pack_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextVersion = (lastVersion?.version_number || 0) + 1;

    await supabase.from("pack_versions").insert({
      pack_id: id,
      version_number: nextVersion,
      sections: sections || currentPack.sections,
      trigger_type:
        status === "submitted"
          ? "submit"
          : status === "approved"
            ? "approval"
            : "manual",
      created_by: userId || auth.userId,
    });

    await supabase.from("timeline_entries").insert({
      organization_id: organizationId || currentPack.organization_id,
      created_by: userId || auth.userId,
      title: `Pack ${status}: ${title || currentPack.title}`,
      description: `Status changed from ${currentPack.status} to ${status}`,
      entry_type: status === "approved" ? "pack_approved" : "system",
      source_type: "pack",
      source_id: id,
    });
  }

  return apiSuccess(data);
});
