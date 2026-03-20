/**
 * GET /api/canvas/report-packs — List report pack templates
 * POST /api/canvas/report-packs — Create/save a report pack
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { REPORT_PACK_TEMPLATES } from "@/lib/canvas/report-builder";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();

  // System templates (built-in)
  const systemPacks = REPORT_PACK_TEMPLATES.map((t) => ({
    ...t,
    isSystem: true,
    organizationId: null,
  }));

  // School's saved report packs
  const { data: savedPacks } = await supabase
    .from("canvas_report_packs")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("updated_at", { ascending: false });

  return apiSuccess({
    templates: systemPacks,
    savedPacks: savedPacks || [],
  });
});

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();

  if (!body.title) {
    return apiError("Report pack title is required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("canvas_report_packs")
    .insert({
      organization_id: auth.organizationId,
      created_by: auth.userId,
      title: body.title,
      description: body.description,
      tone: body.tone || "governor_brief",
      custom_tone_instructions: body.customToneInstructions,
      output_formats: body.outputFormats || ["pdf"],
      schedule: body.schedule,
    })
    .select("id")
    .single();

  if (error) {
    return apiError(`Failed to create report pack: ${error.message}`, 500);
  }

  // Link canvas reports to this pack if provided
  if (body.canvasReportIds && Array.isArray(body.canvasReportIds)) {
    for (let i = 0; i < body.canvasReportIds.length; i++) {
      await supabase
        .from("canvas_reports")
        .update({
          report_pack_id: data.id,
          report_pack_order: i,
        })
        .eq("id", body.canvasReportIds[i])
        .eq("organization_id", auth.organizationId);
    }
  }

  return apiSuccess({ id: data.id, success: true });
});
