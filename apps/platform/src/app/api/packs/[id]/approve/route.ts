import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("packs") + 1];
  const body = await request.json();
  const { userId, organizationId, comments } = body;

  const { data: pack, error: fetchError } = await supabase
    .from("packs")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !pack) return apiError("Pack not found", 404);

  // Update status to approved
  const { error: updateError } = await supabase
    .from("packs")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) throw updateError;

  // Create approval record
  await supabase.from("pack_approvals").insert({
    pack_id: id,
    version_number: pack.current_version,
    action: "approved",
    decided_by: userId || auth.userId,
    decided_at: new Date().toISOString(),
    comments,
  });

  // Create timeline entry
  await supabase.from("timeline_entries").insert({
    organization_id: organizationId || pack.organization_id,
    created_by: userId || auth.userId,
    title: `Pack Approved: ${pack.title}`,
    description: `Governor review complete. Document is now board-ready.`,
    entry_type: "pack_approved",
    source_type: "pack",
    source_id: id,
  });

  return apiSuccess({ status: "approved" });
});
