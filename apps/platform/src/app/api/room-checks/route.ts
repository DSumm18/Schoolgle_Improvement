/**
 * GET /api/room-checks -- Room check dashboard data
 * POST /api/room-checks -- Log a new room check (from Ed or direct)
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET: Fetch today's room check status for an organization
 */
export const GET = protectedRoute(async (auth, request) => {
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;
  const date =
    searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const supabase = createServiceRoleClient();

  // Get scheduled rooms
  const { data: schedule, error: schedError } = await supabase
    .from("room_check_schedule")
    .select("*")
    .eq("organization_id", organizationId);

  if (schedError) {
    return apiError(schedError.message, 500);
  }

  // Get today's checks
  const dayStart = `${date}T00:00:00Z`;
  const dayEnd = `${date}T23:59:59Z`;

  const { data: checks, error: checksError } = await supabase
    .from("room_checks")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("checked_at", dayStart)
    .lte("checked_at", dayEnd)
    .order("checked_at", { ascending: true });

  if (checksError) {
    return apiError(checksError.message, 500);
  }

  // Build status per room
  const rooms = (schedule ?? []).map((sched) => {
    const amCheck = (checks ?? []).find(
      (c) => c.asset_id === sched.asset_id && c.check_type === "am_open",
    );
    const pmCheck = (checks ?? []).find(
      (c) => c.asset_id === sched.asset_id && c.check_type === "pm_close",
    );

    const now = new Date();
    const [amH, amM] = (sched.am_deadline ?? "08:00").split(":").map(Number);
    const [pmH, pmM] = (sched.pm_deadline ?? "18:00").split(":").map(Number);

    const amPastDeadline =
      now.getHours() > amH ||
      (now.getHours() === amH && now.getMinutes() > amM);
    const pmPastDeadline =
      now.getHours() > pmH ||
      (now.getHours() === pmH && now.getMinutes() > pmM);

    return {
      assetId: sched.asset_id,
      schedule: sched,
      am: {
        required: sched.am_check_required,
        status: amCheck
          ? amCheck.issues_found > 0
            ? "issues"
            : "done"
          : sched.am_check_required && amPastDeadline
            ? "missed"
            : "pending",
        check: amCheck ?? null,
      },
      pm: {
        required: sched.pm_check_required,
        status: pmCheck
          ? pmCheck.issues_found > 0
            ? "issues"
            : "done"
          : sched.pm_check_required && pmPastDeadline
            ? "missed"
            : "pending",
        check: pmCheck ?? null,
      },
    };
  });

  // Summary stats
  const total = rooms.length;
  const amDone = rooms.filter(
    (r) => r.am.status === "done" || r.am.status === "issues",
  ).length;
  const pmDone = rooms.filter(
    (r) => r.pm.status === "done" || r.pm.status === "issues",
  ).length;
  const amMissed = rooms.filter((r) => r.am.status === "missed").length;
  const pmMissed = rooms.filter((r) => r.pm.status === "missed").length;
  const issueCount = rooms.reduce(
    (sum, r) =>
      sum + (r.am.check?.issues_found ?? 0) + (r.pm.check?.issues_found ?? 0),
    0,
  );

  return apiSuccess({
    date,
    rooms,
    summary: {
      total,
      am: {
        done: amDone,
        missed: amMissed,
        pending: total - amDone - amMissed,
      },
      pm: {
        done: pmDone,
        missed: pmMissed,
        pending: total - pmDone - pmMissed,
      },
      issueCount,
    },
  });
});

/**
 * POST: Log a new room check (called by Ed or room check UI)
 */
export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    assetId,
    checkedBy,
    checkType,
    mediaType,
    mediaUrls,
    mediaHash,
    deviceGps,
    deviceId,
    captureTimestamp,
    visionScanId,
    aiSummary,
    itemsDetected,
    issuesFound,
    complianceScore,
    dispatchedTo,
    workNotes,
    contractorName,
    isSnagging,
  } = body;

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!assetId || !checkType) {
    return apiError("assetId and checkType are required", 400);
  }

  const supabase = createServiceRoleClient();

  // Set GDPR retention (30 days from now)
  const retentionDate = new Date();
  retentionDate.setDate(retentionDate.getDate() + 30);

  const { data, error } = await supabase
    .from("room_checks")
    .insert({
      organization_id: orgId,
      asset_id: assetId,
      checked_by: checkedBy || auth.userId,
      check_type: checkType,
      checked_at: new Date().toISOString(),
      media_type: mediaType ?? "image",
      media_urls: mediaUrls ?? [],
      media_retention_until: retentionDate.toISOString().split("T")[0],
      media_hash: mediaHash,
      device_gps: deviceGps ? `(${deviceGps.lat},${deviceGps.lng})` : null,
      device_id: deviceId,
      capture_timestamp: captureTimestamp,
      server_received_at: new Date().toISOString(),
      vision_scan_id: visionScanId,
      ai_summary: aiSummary,
      items_detected: itemsDetected ?? 0,
      issues_found: issuesFound ?? 0,
      compliance_score: complianceScore,
      dispatched_to: dispatchedTo ?? [],
      work_notes: workNotes,
      contractor_name: contractorName,
      is_snagging: isSnagging ?? false,
      evidence_locked: false,
      status: (issuesFound ?? 0) > 0 ? "issues_flagged" : "complete",
    })
    .select()
    .single();

  if (error) {
    return apiError(error.message, 500);
  }

  return apiSuccess({ success: true, check: data });
});
