/**
 * GET /api/room-checks/schedule -- Get room check schedule
 * PUT /api/room-checks/schedule -- Update room check schedule
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organization_id");

  if (!organizationId) {
    return NextResponse.json(
      { error: "organization_id required" },
      { status: 400 },
    );
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("room_check_schedule")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schedule: data ?? [] });
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, assetId, ...updates } = body;

    if (!organizationId || !assetId) {
      return NextResponse.json(
        { error: "organizationId and assetId required" },
        { status: 400 },
      );
    }

    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from("room_check_schedule")
      .upsert(
        {
          organization_id: organizationId,
          asset_id: assetId,
          am_check_required: updates.amCheckRequired ?? true,
          pm_check_required: updates.pmCheckRequired ?? true,
          am_deadline: updates.amDeadline ?? "08:00",
          pm_deadline: updates.pmDeadline ?? "18:00",
          default_checker_id: updates.defaultCheckerId ?? null,
          check_mode: updates.checkMode ?? "term",
          holiday_check_frequency: updates.holidayCheckFrequency ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id,asset_id" },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, schedule: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
