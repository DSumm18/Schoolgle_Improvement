/**
 * Cover Management — Single Absence API
 *
 * GET  /api/cover/absences/[id] — Get absence with cover arrangements
 * PUT  /api/cover/absences/[id] — Update absence (return to work, sick note, etc.)
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── GET Single Absence ─────────────────────────────────────────────

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();

  if (!id) return apiError("Absence ID required", 400);

  // Try real data
  const { data: absence, error } = await supabase
    .from("staff_absences")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !absence) {
    // Demo fallback
    if (id.startsWith("abs-")) {
      const today = new Date().toISOString().split("T")[0];
      return apiSuccess({
        absence: {
          id,
          staff_id: "staff-001",
          staff_name: "Sarah Mitchell",
          staff_role: "Year 4 Teacher",
          absence_type: "sickness",
          start_date: today,
          end_date: today,
          half_day: false,
          total_days: 1,
          reason: "Flu symptoms",
          sick_note_received: false,
          return_to_work_completed: false,
          cover_required: true,
          status: "active",
        },
        arrangements: [
          {
            id: "cov-001",
            absence_id: id,
            period: "P1",
            class_name: "4M",
            cover_type: "internal",
            cover_staff_name: "Helen Barnes (PPA cover)",
            subject: "English",
            notes: "Literacy lesson — plans on desk",
            status: "confirmed",
          },
          {
            id: "cov-002",
            absence_id: id,
            period: "P2",
            class_name: "4M",
            cover_type: "supply",
            cover_staff_name: "Supply: J. Taylor (Reed Education)",
            subject: "Maths",
            notes: "Multiplication unit — worksheets printed",
            status: "confirmed",
          },
        ],
        demo: true,
      });
    }
    return apiError("Absence not found", 404);
  }

  // Fetch related cover arrangements
  const { data: arrangements } = await supabase
    .from("cover_arrangements")
    .select("*")
    .eq("absence_id", id)
    .eq("organization_id", organizationId)
    .order("period", { ascending: true });

  return apiSuccess({
    absence,
    arrangements: arrangements || [],
    demo: false,
  });
});

// ─── PUT Update Absence ─────────────────────────────────────────────

export const PUT = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();
  const id = request.nextUrl.pathname.split("/").pop();
  const body = await request.json();

  if (!id) return apiError("Absence ID required", 400);

  const updates: Record<string, any> = {};

  if (body.end_date !== undefined) updates.end_date = body.end_date;
  if (body.total_days !== undefined) updates.total_days = body.total_days;
  if (body.reason !== undefined) updates.reason = body.reason;
  if (body.sick_note_received !== undefined)
    updates.sick_note_received = body.sick_note_received;
  if (body.return_to_work_completed !== undefined)
    updates.return_to_work_completed = body.return_to_work_completed;
  if (body.return_to_work_date !== undefined)
    updates.return_to_work_date = body.return_to_work_date;
  if (body.return_to_work_notes !== undefined)
    updates.return_to_work_notes = body.return_to_work_notes;
  if (body.status !== undefined) updates.status = body.status;

  updates.updated_at = new Date().toISOString();
  updates.updated_by = userId;

  const { data, error } = await supabase
    .from("staff_absences")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    console.error("[Cover] Failed to update absence:", error);
    return apiError("Failed to update absence", 500);
  }

  return apiSuccess({ absence: data });
});
