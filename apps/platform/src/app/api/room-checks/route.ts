/**
 * GET /api/room-checks -- Room check dashboard data
 * POST /api/room-checks -- Log a new room check (from Ed or direct)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * GET: Fetch today's room check status for an organization
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organization_id");
  const date =
    searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  if (!organizationId) {
    return NextResponse.json(
      { error: "organization_id required" },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  // Get scheduled rooms
  const { data: schedule, error: schedError } = await supabase
    .from("room_check_schedule")
    .select("*")
    .eq("organization_id", organizationId);

  if (schedError) {
    return NextResponse.json({ error: schedError.message }, { status: 500 });
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
    return NextResponse.json({ error: checksError.message }, { status: 500 });
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

  return NextResponse.json({
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
}

/**
 * POST: Log a new room check (called by Ed or room check UI)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationId,
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

    if (!organizationId || !assetId || !checkedBy || !checkType) {
      return NextResponse.json(
        {
          error:
            "organizationId, assetId, checkedBy, and checkType are required",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceClient();

    // Set GDPR retention (30 days from now)
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + 30);

    const { data, error } = await supabase
      .from("room_checks")
      .insert({
        organization_id: organizationId,
        asset_id: assetId,
        checked_by: checkedBy,
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, check: data });
  } catch (error) {
    console.error("[Room Checks API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
