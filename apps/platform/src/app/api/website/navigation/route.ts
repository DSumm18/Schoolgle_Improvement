import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/website/navigation — Get all navigation items
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data: website } = await supabase
    .from("school_websites")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .maybeSingle();

  if (!website) return apiSuccess([]);

  const { data, error } = await supabase
    .from("website_navigation")
    .select("*")
    .eq("website_id", website.id)
    .order("sort_order");

  if (error) return apiError(error.message, 500);
  return apiSuccess(data || []);
});

// POST /api/website/navigation — Bulk update navigation (replace all for a menu_location)
export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const supabase = createServiceRoleClient();

    const { data: website } = await supabase
      .from("school_websites")
      .select("id")
      .eq("organization_id", auth.organizationId)
      .single();

    if (!website) return apiError("No website found", 404);

    const menuLocation = body.menuLocation || "main";
    const items: Array<{
      label: string;
      url?: string;
      pageId?: string;
      parentId?: string;
      sortOrder: number;
      openInNewTab?: boolean;
      icon?: string;
    }> = body.items || [];

    // Delete existing items for this menu location
    await supabase
      .from("website_navigation")
      .delete()
      .eq("website_id", website.id)
      .eq("menu_location", menuLocation);

    if (items.length === 0) return apiSuccess([]);

    // Insert new items
    const rows = items.map((item, i) => ({
      website_id: website.id,
      organization_id: auth.organizationId,
      menu_location: menuLocation,
      label: item.label,
      url: item.url || null,
      page_id: item.pageId || null,
      parent_id: item.parentId || null,
      sort_order: item.sortOrder ?? i,
      open_in_new_tab: item.openInNewTab || false,
      icon: item.icon || null,
    }));

    const { data, error } = await supabase
      .from("website_navigation")
      .insert(rows)
      .select();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  },
  { requiredRole: "slt" }
);
