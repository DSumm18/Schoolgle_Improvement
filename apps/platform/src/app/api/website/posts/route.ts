import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/website/posts — List news posts
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data: website } = await supabase
    .from("school_websites")
    .select("id")
    .eq("organization_id", auth.organizationId)
    .maybeSingle();

  if (!website) return apiSuccess([]);

  const { data, error } = await supabase
    .from("website_posts")
    .select("*")
    .eq("website_id", website.id)
    .order("created_at", { ascending: false });

  if (error) return apiError(error.message, 500);
  return apiSuccess(data || []);
});

// POST /api/website/posts — Create a news post
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
      .from("website_posts")
      .insert({
        website_id: website.id,
        organization_id: auth.organizationId,
        title: body.title,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        excerpt: body.excerpt || null,
        content_blocks: body.contentBlocks || [],
        featured_image_url: body.featuredImageUrl || null,
        category: body.category || "news",
        tags: body.tags || [],
        author_name: body.authorName || null,
        status: body.status || "draft",
        published_at: body.status === "published" ? new Date().toISOString() : null,
        pinned: body.pinned || false,
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data, 201);
  },
  { requiredRole: "slt" }
);

// PATCH /api/website/posts — Update a post (?id=<post_id>)
export const PATCH = protectedRoute(
  async (auth, request) => {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");
    if (!postId) return apiError("Post ID required", 400);

    const body = await request.json();
    const supabase = createServiceRoleClient();

    const updateData: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      title: "title",
      slug: "slug",
      excerpt: "excerpt",
      contentBlocks: "content_blocks",
      featuredImageUrl: "featured_image_url",
      category: "category",
      tags: "tags",
      authorName: "author_name",
      status: "status",
      pinned: "pinned",
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    if (body.status === "published") {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("website_posts")
      .update(updateData)
      .eq("id", postId)
      .eq("organization_id", auth.organizationId)
      .select()
      .single();

    if (error) return apiError(error.message, 500);
    return apiSuccess(data);
  },
  { requiredRole: "slt" }
);

// DELETE /api/website/posts — Delete a post (?id=<post_id>)
export const DELETE = protectedRoute(
  async (auth, request) => {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");
    if (!postId) return apiError("Post ID required", 400);

    const supabase = createServiceRoleClient();

    const { error } = await supabase
      .from("website_posts")
      .delete()
      .eq("id", postId)
      .eq("organization_id", auth.organizationId);

    if (error) return apiError(error.message, 500);
    return apiSuccess({ deleted: true });
  },
  { requiredRole: "slt" }
);
