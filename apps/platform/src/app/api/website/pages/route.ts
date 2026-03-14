import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/website/pages — List all pages for the website
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();

  // Get the website ID for this org
  const { data: website } = await supabase
    .from("school_websites")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .maybeSingle();

  if (!website) return apiSuccess([]);

  const { data, error } = await supabase
    .from("website_pages")
    .select("*")
    .eq("website_id", website.id)
    .order("sort_order", { ascending: true });

  if (error) return apiError(error.message, 500);

  return apiSuccess(data || []);
});

// POST /api/website/pages — Create a new page
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

    const { data, error } = await supabase
      .from("website_pages")
      .insert({
        website_id: website.id,
        organization_id: auth.organizationId,
        title: body.title,
        slug: body.slug,
        page_type: body.pageType || "content",
        parent_id: body.parentId || null,
        sort_order: body.sortOrder || 0,
        content_blocks: body.contentBlocks || [],
        hero_image_url: body.heroImageUrl || null,
        hero_title: body.heroTitle || null,
        hero_subtitle: body.heroSubtitle || null,
        show_breadcrumbs: body.showBreadcrumbs ?? true,
        show_sidebar: body.showSidebar ?? false,
        sidebar_content: body.sidebarContent || [],
        seo_title: body.seoTitle || null,
        seo_description: body.seoDescription || null,
        status: body.status || "draft",
        template: body.template || "default",
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);

    return apiSuccess(data, 201);
  },
  { requiredRole: "slt" }
);

// PATCH /api/website/pages — Update a page (requires ?id=<page_id>)
export const PATCH = protectedRoute(
  async (auth, request) => {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("id");
    if (!pageId) return apiError("Page ID required", 400);

    const body = await request.json();
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      title: "title",
      slug: "slug",
      pageType: "page_type",
      parentId: "parent_id",
      sortOrder: "sort_order",
      contentBlocks: "content_blocks",
      heroImageUrl: "hero_image_url",
      heroTitle: "hero_title",
      heroSubtitle: "hero_subtitle",
      showBreadcrumbs: "show_breadcrumbs",
      showSidebar: "show_sidebar",
      sidebarContent: "sidebar_content",
      seoTitle: "seo_title",
      seoDescription: "seo_description",
      seoImageUrl: "seo_image_url",
      noIndex: "no_index",
      status: "status",
      template: "template",
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    if (body.status === "published" && !updateData.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("website_pages")
      .update(updateData)
      .eq("id", pageId)
      .eq("organization_id", auth.organizationId)
      .select()
      .single();

    if (error) return apiError(error.message, 500);

    return apiSuccess(data);
  },
  { requiredRole: "slt" }
);

// DELETE /api/website/pages — Delete a page (requires ?id=<page_id>)
export const DELETE = protectedRoute(
  async (auth, request) => {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("id");
    if (!pageId) return apiError("Page ID required", 400);

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("website_pages")
      .delete()
      .eq("id", pageId)
      .eq("organization_id", auth.organizationId);

    if (error) return apiError(error.message, 500);

    return apiSuccess({ deleted: true });
  },
  { requiredRole: "slt" }
);
