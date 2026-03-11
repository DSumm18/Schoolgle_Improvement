import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("packs") + 1];
  const body = await request.json();
  const { userId, organizationId } = body;

  // 1. Get current pack state
  const { data: pack, error: fetchError } = await supabase
    .from("packs")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !pack) return apiError("Pack not found", 404);
  if (pack.status === "submitted" || pack.status === "approved") {
    return apiError("Pack is already submitted or approved", 400);
  }

  // 2. Update pack status
  const { error: updateError } = await supabase
    .from("packs")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) throw updateError;

  // 3. Create version
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
    sections: pack.sections,
    trigger_type: "submit",
    changed_by: userId || auth.userId,
    change_summary: "Submitted for approval",
  });

  // 4. Create approval record
  await supabase.from("pack_approvals").insert({
    pack_id: id,
    version_number: nextVersion,
    action: "submitted",
    submitted_by: userId || auth.userId,
    submitted_at: new Date().toISOString(),
  });

  // 5. Add timeline entry
  await supabase.from("timeline_entries").insert({
    organization_id: organizationId || pack.organization_id,
    created_by: userId || auth.userId,
    title: `Pack Submitted: ${pack.title}`,
    description: `Sent to governors for formal review`,
    entry_type: "system",
    source_type: "pack",
    source_id: id,
  });

  // 6. Notification placeholder
  console.log(
    `Notification: Pack ${id} submitted for approval by ${userId || auth.userId}`,
  );

  return apiSuccess({ status: "submitted", version: nextVersion });
});
