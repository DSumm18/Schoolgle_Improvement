/**
 * GET /api/canvas/reports — List saved canvas reports
 * POST /api/canvas/reports — Save a new canvas report
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const url = request.nextUrl;
  const widgetOnly = url.searchParams.get("widget") === "true";
  const businessArea = url.searchParams.get("businessArea");
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("canvas_reports")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (widgetOnly) {
    query = query
      .eq("is_widget", true)
      .order("widget_position", { ascending: true });
  }
  if (businessArea) {
    query = query.eq("business_area", businessArea);
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  return apiSuccess({ data: data || [] });
});

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();

  if (!body.title || !body.businessArea) {
    return apiError("Title and business area are required", 400);
  }

  const supabase = createServiceRoleClient();

  // Load school branding for snapshot
  const { data: branding } = await supabase
    .from("school_branding")
    .select("primary_color, logo_url")
    .eq("organization_id", auth.organizationId)
    .single();

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", auth.organizationId)
    .single();

  const { data, error } = await supabase
    .from("canvas_reports")
    .insert({
      organization_id: auth.organizationId,
      created_by: auth.userId,
      title: body.title,
      business_area: body.businessArea,
      description: body.description,
      viz_spec: body.vizSpec,
      viz_html_cache: body.vizHtmlCache,
      query_spec: body.querySpec,
      data_source_ids: body.dataSourceIds,
      template_id: body.templateId,
      mode: body.mode || "snapshot",
      is_widget: body.isWidget || false,
      widget_position: body.widgetPosition,
      shared_with_roles: body.sharedWithRoles,
      shared_with_users: body.sharedWithUsers,
      report_pack_id: body.reportPackId,
      report_pack_order: body.reportPackOrder,
      school_branding_snapshot: {
        primaryColor: branding?.primary_color || "#0F6E56",
        logoUrl: branding?.logo_url,
        schoolName: org?.name || "School",
      },
    })
    .select("id")
    .single();

  if (error) return apiError(error.message, 500);

  return apiSuccess({ id: data.id, success: true });
});
