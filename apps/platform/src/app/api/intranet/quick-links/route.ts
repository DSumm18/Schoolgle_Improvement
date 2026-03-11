import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const orgId =
    req.nextUrl.searchParams.get("organizationId") || auth.organizationId;

  const { data, error } = await supabase
    .from("school_quick_links")
    .select("*")
    .eq("organization_id", orgId)
    .order("sort_order", { ascending: true });

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
});

export const POST = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();
  const {
    organizationId,
    title,
    url,
    icon,
    category,
    sortOrder,
    linkType,
    fileUrl,
  } = body;

  const orgId = organizationId || auth.organizationId;

  if (!title) {
    return apiError("Missing required fields", 400);
  }

  const { data, error } = await supabase
    .from("school_quick_links")
    .insert({
      organization_id: orgId,
      title,
      url,
      icon: icon || "link",
      category: category || "general",
      sort_order: sortOrder || 0,
      link_type: linkType || "url",
      file_url: fileUrl,
    })
    .select()
    .single();

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess(data);
});

export const DELETE = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return apiError("Missing id", 400);
  }

  const { error } = await supabase
    .from("school_quick_links")
    .delete()
    .eq("id", id);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true });
});
