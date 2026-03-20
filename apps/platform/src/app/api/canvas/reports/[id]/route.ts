/**
 * GET /api/canvas/reports/[id] — Get a single canvas report
 * PATCH /api/canvas/reports/[id] — Update a canvas report
 * DELETE /api/canvas/reports/[id] — Delete a canvas report
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

function extractId(request: NextRequest): string {
  const parts = request.nextUrl.pathname.split("/");
  return parts[parts.length - 1];
}

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const id = extractId(request);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("canvas_reports")
    .select("*")
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .single();

  if (error) return apiError("Canvas report not found", 404);
  return apiSuccess({ data });
});

export const PATCH = protectedRoute(async (auth, request: NextRequest) => {
  const id = extractId(request);
  const body = await request.json();
  const supabase = createServiceRoleClient();

  const updateData: Record<string, unknown> = {};
  const allowedFields = [
    "title",
    "description",
    "viz_spec",
    "viz_html_cache",
    "query_spec",
    "is_widget",
    "widget_position",
    "shared_with_roles",
    "shared_with_users",
    "mode",
    "report_pack_id",
    "report_pack_order",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("canvas_reports")
    .update(updateData)
    .eq("id", id)
    .eq("organization_id", auth.organizationId)
    .select("id")
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess({ id: data.id, success: true });
});

export const DELETE = protectedRoute(async (auth, request: NextRequest) => {
  const id = extractId(request);
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("canvas_reports")
    .delete()
    .eq("id", id)
    .eq("created_by", auth.userId);

  if (error) return apiError(error.message, 500);
  return apiSuccess({ success: true });
});
