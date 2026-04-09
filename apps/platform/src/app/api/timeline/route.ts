import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "50");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("timeline_entries")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;

  if (error) throw error;

  return apiSuccess({ entries: data });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    userId,
    title,
    description,
    entry_type,
    source_type,
    source_id,
    evidence_ids,
    category,
    subcategory,
    icon,
    color,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;
  const uid = userId || auth.userId;

  if (!title || !entry_type) {
    return apiError("Missing required fields", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("timeline_entries")
    .insert({
      organization_id: orgId,
      created_by: uid,
      title,
      description,
      entry_type,
      source_type,
      source_id,
      evidence_ids: evidence_ids || [],
      category,
      subcategory,
      icon,
      color,
    })
    .select()
    .single();

  if (error) throw error;

  return apiSuccess(data);
});
