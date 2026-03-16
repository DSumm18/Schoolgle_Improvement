import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/notices/templates — list notice templates
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const category = req.nextUrl.searchParams.get("category");

  let query = supabase
    .from("notice_templates")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .order("usage_count", { ascending: false });

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);

  return apiSuccess({ templates: data || [] });
});

// POST /api/notices/templates — create custom template
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("notice_templates")
    .insert({
      organization_id: auth.organizationId,
      template_name: body.template_name,
      category: body.category || "custom",
      notice_type: body.notice_type || "announcement",
      title_template: body.title_template,
      body_template: body.body_template,
      default_audience: body.default_audience || "all",
      default_priority: body.default_priority || "normal",
      default_display_style: body.default_display_style || "card",
      default_show_on_display: body.default_show_on_display ?? true,
      default_show_on_dashboard: body.default_show_on_dashboard ?? true,
      icon: body.icon,
      color: body.color,
      is_system: false,
    })
    .select()
    .single();

  if (error) return apiError(error.message, 500);
  return apiSuccess(data);
});
