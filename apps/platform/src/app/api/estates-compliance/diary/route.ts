/**
 * Daily Diary API Route
 *
 * Handles:
 * - GET: Fetch diary entries for an organization
 * - POST: Create new diary entry
 * - PATCH: Update diary entry
 * - DELETE: Delete diary entry
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const userId = searchParams.get("user_id");
  const searchText = searchParams.get("search");
  const tagsParam = searchParams.get("tags");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("estates_daily_diary")
    .select("*")
    .eq("organization_id", organizationId);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (searchText) {
    query = query.ilike("entry", `%${searchText}%`);
  }

  if (tagsParam) {
    const tags = tagsParam.split(",").map((t) => t.trim());
    query = query.contains("tags", tags);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo);
  }

  const { data: entries, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching diary entries:", error);
    return apiError("Failed to fetch diary entries", 500);
  }

  // Get total count
  const { count } = await supabase
    .from("estates_daily_diary")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  return apiSuccess({
    entries: entries || [],
    count: count || 0,
    limit,
    offset,
    has_more: (count || 0) > offset + limit,
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    user_id,
    entry,
    photos = [],
    tags = [],
    location,
    weather,
    mood,
    visibility = "private",
    attachments = [],
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;
  const uid = user_id || auth.userId;

  if (!entry) {
    return apiError("entry is required", 400);
  }

  if (entry.trim().length === 0) {
    return apiError("Entry cannot be empty", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: newEntry, error } = await supabase
    .from("estates_daily_diary")
    .insert({
      organization_id: orgId,
      user_id: uid,
      entry: entry.trim(),
      photos,
      tags,
      location,
      weather,
      mood,
      visibility,
      attachments,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating diary entry:", error);
    return apiError("Failed to create diary entry", 500);
  }

  return apiSuccess(
    {
      entry: newEntry,
      message: "Diary entry created successfully",
    },
    201,
  );
});

export const PATCH = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return apiError("Entry ID is required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data: updatedEntry, error } = await supabase
    .from("estates_daily_diary")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating diary entry:", error);
    return apiError("Failed to update diary entry", 500);
  }

  return apiSuccess({
    entry: updatedEntry,
    message: "Diary entry updated successfully",
  });
});

export const DELETE = protectedRoute(async (auth, request) => {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return apiError("Entry ID is required", 400);
  }

  const supabase = createServiceRoleClient();

  // First check if entry exists and is within 24 hours
  const { data: entry } = await supabase
    .from("estates_daily_diary")
    .select("created_at")
    .eq("id", id)
    .single();

  if (!entry) {
    return apiError("Entry not found", 404);
  }

  const entryAge = Date.now() - new Date(entry.created_at).getTime();
  const hours24 = 24 * 60 * 60 * 1000;

  if (entryAge > hours24) {
    return apiError("Entries older than 24 hours cannot be deleted", 403);
  }

  const { error } = await supabase
    .from("estates_daily_diary")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting diary entry:", error);
    return apiError("Failed to delete diary entry", 500);
  }

  return apiSuccess({
    message: "Diary entry deleted successfully",
  });
});
