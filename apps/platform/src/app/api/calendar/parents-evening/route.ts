/**
 * Parents' Evening Slots API
 *
 * GET  /api/calendar/parents-evening - Get slots for an event
 * POST /api/calendar/parents-evening - Generate slots for teachers
 * PUT  /api/calendar/parents-evening - Book or cancel a slot
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ── Demo Data ────────────────────────────────────────────────────────

const DEMO_TEACHERS = [
  "Mrs Johnson (Reception)",
  "Miss Patel (Year 1)",
  "Mr Thompson (Year 2)",
  "Mrs Williams (Year 3)",
];

function generateDemoSlots() {
  const slots: any[] = [];
  const statuses = ["available", "booked", "booked", "booked", "available"];
  const parents = [
    "Mr & Mrs Smith",
    "Ms Garcia",
    "Mr Brown",
    "Mrs Chen",
    "Mr & Mrs Ahmed",
  ];
  let slotIndex = 0;

  for (const teacher of DEMO_TEACHERS) {
    let time = 15 * 60 + 30; // 15:30 in minutes
    const endTime = 19 * 60; // 19:00
    const duration = 10; // 10 min slots

    while (time + duration <= endTime) {
      const startHour = Math.floor(time / 60);
      const startMin = time % 60;
      const endHourVal = Math.floor((time + duration) / 60);
      const endMinVal = (time + duration) % 60;

      const status = statuses[slotIndex % statuses.length];

      slots.push({
        id: `demo-slot-${slotIndex + 1}`,
        event_id: "demo-evt-5",
        teacher_name: teacher,
        start_time: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`,
        end_time: `${String(endHourVal).padStart(2, "0")}:${String(endMinVal).padStart(2, "0")}`,
        status,
        parent_name:
          status === "booked" ? parents[slotIndex % parents.length] : null,
        pupil_name:
          status === "booked"
            ? `Child of ${parents[slotIndex % parents.length]}`
            : null,
        notes: null,
        created_at: "2025-10-01T00:00:00Z",
      });

      time += duration;
      slotIndex++;
    }
  }

  return slots;
}

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const searchParams = request.nextUrl.searchParams;
  const eventId = searchParams.get("event_id");

  if (!eventId) {
    return apiError("event_id is required", 400);
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("parents_evening_slots")
    .select("*")
    .eq("event_id", eventId)
    .order("teacher_name", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[Parents Evening] DB error:", error.message);
  }

  if (!data || data.length === 0) {
    const demoSlots = generateDemoSlots();
    const teachers = [...new Set(demoSlots.map((s) => s.teacher_name))];
    const booked = demoSlots.filter((s) => s.status === "booked").length;

    return apiSuccess({
      slots: demoSlots,
      summary: {
        total_slots: demoSlots.length,
        booked,
        available: demoSlots.length - booked,
        percent_booked: Math.round((booked / demoSlots.length) * 100),
        teachers,
      },
      is_demo: true,
    });
  }

  const teachers = [...new Set(data.map((s: any) => s.teacher_name))];
  const booked = data.filter((s: any) => s.status === "booked").length;
  const completed = data.filter((s: any) => s.status === "completed").length;
  const noShow = data.filter((s: any) => s.status === "no_show").length;

  return apiSuccess({
    slots: data,
    summary: {
      total_slots: data.length,
      booked,
      completed,
      no_show: noShow,
      available: data.length - booked - completed - noShow,
      percent_booked: Math.round(
        ((booked + completed + noShow) / data.length) * 100,
      ),
      teachers,
    },
    is_demo: false,
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const body = await request.json();

  if (!body.event_id || !body.teachers || !body.slot_duration) {
    return apiError(
      "event_id, teachers array, and slot_duration are required",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  // Verify event exists and belongs to org
  const { data: event } = await supabase
    .from("school_events")
    .select("*")
    .eq("id", body.event_id)
    .eq("organization_id", organizationId)
    .single();

  if (!event) {
    return apiError("Event not found", 404);
  }

  // Parse start/end times
  const startTime = body.start_time || event.start_time || "15:30";
  const endTime = body.end_time || event.end_time || "19:00";
  const duration = parseInt(body.slot_duration);

  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slotsToInsert: any[] = [];

  for (const teacher of body.teachers) {
    let t = currentMinutes;
    while (t + duration <= endMinutes) {
      const sh = Math.floor(t / 60);
      const sm = t % 60;
      const eh = Math.floor((t + duration) / 60);
      const em = (t + duration) % 60;

      slotsToInsert.push({
        event_id: body.event_id,
        teacher_name: teacher,
        start_time: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
        end_time: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
        status: "available",
        parent_name: null,
        pupil_name: null,
        notes: null,
      });

      t += duration;
    }
  }

  if (slotsToInsert.length === 0) {
    return apiError(
      "No slots could be generated with the given parameters",
      400,
    );
  }

  // Delete existing slots for this event first
  await supabase
    .from("parents_evening_slots")
    .delete()
    .eq("event_id", body.event_id);

  const { data, error } = await supabase
    .from("parents_evening_slots")
    .insert(slotsToInsert)
    .select();

  if (error) {
    console.error("[Parents Evening] Insert error:", error.message);
    return apiError("Failed to generate slots", 500);
  }

  return apiSuccess(
    {
      slots: data,
      total_generated: data?.length || 0,
      teachers: body.teachers.length,
      slot_duration: duration,
    },
    201,
  );
});

export const PUT = protectedRoute(async (auth, request) => {
  const body = await request.json();

  if (!body.slot_id || !body.action) {
    return apiError(
      "slot_id and action (book/cancel/complete/no_show) are required",
      400,
    );
  }

  const supabase = createServiceRoleClient();

  let updateData: Record<string, any> = {};

  switch (body.action) {
    case "book":
      if (!body.parent_name) {
        return apiError("parent_name is required for booking", 400);
      }
      updateData = {
        status: "booked",
        parent_name: body.parent_name,
        pupil_name: body.pupil_name || null,
        notes: body.notes || null,
      };
      break;

    case "cancel":
      updateData = {
        status: "available",
        parent_name: null,
        pupil_name: null,
        notes: null,
      };
      break;

    case "complete":
      updateData = { status: "completed" };
      break;

    case "no_show":
      updateData = { status: "no_show" };
      break;

    default:
      return apiError(
        "Invalid action. Use: book, cancel, complete, no_show",
        400,
      );
  }

  const { data, error } = await supabase
    .from("parents_evening_slots")
    .update(updateData)
    .eq("id", body.slot_id)
    .select()
    .single();

  if (error) {
    console.error("[Parents Evening] Update error:", error.message);
    return apiError("Failed to update slot", 500);
  }

  return apiSuccess({ slot: data });
});
