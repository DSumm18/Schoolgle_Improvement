/**
 * Individual Routine API Route
 *
 * Handles update and deletion of specific routines.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const PATCH = protectedRoute(async (auth, request) => {
  // Extract id from URL path
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  const body = await request.json();
  const {
    name,
    description,
    type,
    recurrence,
    recurrence_days,
    start_time,
    deadline_time,
    items,
    is_active,
  } = body;

  const supabase = createServiceRoleClient();

  // Update routine
  const { data: routine, error: routineError } = await supabase
    .from("estates_routines")
    .update({
      name,
      description,
      type,
      recurrence,
      recurrence_days,
      start_time,
      deadline_time,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (routineError) {
    console.error("Error updating routine:", routineError);
    return apiError("Failed to update routine", 500);
  }

  // If items are provided, replace them (simple sync strategy)
  if (items && Array.isArray(items)) {
    // Delete old items
    await supabase.from("estates_routine_items").delete().eq("routine_id", id);

    // Insert new items
    if (items.length > 0) {
      const routineItems = items.map((item: any, index: number) => ({
        routine_id: id,
        name: item.name,
        description: item.description,
        category: item.category || "facilities",
        icon: item.icon,
        item_order: item.item_order ?? index,
        requires_photo: item.requires_photo || false,
        requires_notes: item.requires_notes || false,
      }));

      const { error: itemsError } = await supabase
        .from("estates_routine_items")
        .insert(routineItems);

      if (itemsError) {
        console.error("Error updating routine items:", itemsError);
      }
    }
  }

  // Return the updated routine with items
  const { data: completeRoutine } = await supabase
    .from("estates_routines")
    .select("*, items:estates_routine_items(*)")
    .eq("id", id)
    .single();

  return apiSuccess({ routine: completeRoutine || routine });
});

export const DELETE = protectedRoute(async (auth, request) => {
  // Extract id from URL path
  const url = new URL(request.url);
  const pathParts = url.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from("estates_routines")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting routine:", error);
    return apiError("Failed to delete routine", 500);
  }

  return apiSuccess({ success: true });
});
