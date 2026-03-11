import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  const segments = request.nextUrl.pathname.split("/");
  const id = segments[segments.indexOf("packs") + 1];
  const body = await request.json();
  const { format, userId, organizationId } = body;

  if (!format) return apiError("format is required (pdf or docx)", 400);

  const { data: pack, error: fetchError } = await supabase
    .from("packs")
    .select("*, pack_templates(*)")
    .eq("id", id)
    .single();

  if (fetchError || !pack) return apiError("Pack not found", 404);

  const { data: exportRecord, error: exportError } = await supabase
    .from("pack_exports")
    .insert({
      pack_id: id,
      version_number: pack.current_version,
      format: format,
      file_url: "browser_print",
      exported_by: userId || auth.userId,
    })
    .select()
    .single();

  if (exportError) throw exportError;

  // Timeline entry
  await supabase.from("timeline_entries").insert({
    organization_id: organizationId || pack.organization_id,
    created_by: userId || auth.userId,
    title: `Pack Exported (${format.toUpperCase()}): ${pack.title}`,
    description: `Formal governance document generated for external use.`,
    entry_type: "pack_exported",
    source_type: "pack",
    source_id: id,
    tags: [
      "Governance",
      "Board Papers",
      pack.pack_templates?.pack_type || "General",
    ],
  });

  return apiSuccess({
    exportId: exportRecord.id,
    message: "Export metadata recorded successfully",
    nextAction: "trigger_browser_print",
  });
});
