import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, req) => {
  const supabase = createServiceRoleClient();
  const orgId =
    req.nextUrl.searchParams.get("organizationId") || auth.organizationId;

  const { data, error } = await supabase
    .from("school_announcements")
    .select("*")
    .eq("organization_id", orgId)
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

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
    content,
    priority,
    authorName,
    authorId,
    pinned,
  } = body;

  const orgId = organizationId || auth.organizationId;

  if (!title || !content) {
    return apiError("Missing required fields", 400);
  }

  const { data, error } = await supabase
    .from("school_announcements")
    .insert({
      organization_id: orgId,
      title,
      content,
      priority: priority || "normal",
      author_name: authorName,
      author_id: authorId || auth.userId,
      pinned: pinned || false,
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
    .from("school_announcements")
    .delete()
    .eq("id", id);

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true });
});
