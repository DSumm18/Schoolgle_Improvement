/**
 * Save Selected Schools API
 *
 * POST /api/onboarding/select-schools
 *
 * Saves the user's school selection during onboarding.
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createClient();
  const body = await req.json();
  const { trustCode, selectedSchoolUrns } = body;

  if (!trustCode || !selectedSchoolUrns) {
    return NextResponse.json(
      { error: "trustCode and selectedSchoolUrns are required" },
      { status: 400 }
    );
  }

  try {
    // Save to onboarding_leads (or update existing)
    const { data: existingLead } = await supabase
      .from("onboarding_leads")
      .select("*")
      .eq("user_id", auth.userId)
      .maybeSingle();

    const leadData = {
      user_id: auth.userId,
      trust_code: trustCode,
      selected_schools: selectedSchoolUrns,
      current_step: 3,
      updated_at: new Date().toISOString()
    };

    if (existingLead) {
      await supabase
        .from("onboarding_leads")
        .update(leadData)
        .eq("id", existingLead.id);
    } else {
      await supabase
        .from("onboarding_leads")
        .insert({ ...leadData, created_at: new Date().toISOString() });
    }

    return NextResponse.json({
      success: true,
      schoolCount: selectedSchoolUrns.length
    });

  } catch (error) {
    console.error("Failed to save school selection:", error);
    return NextResponse.json(
      { error: "Failed to save school selection" },
      { status: 500 }
    );
  }
});
