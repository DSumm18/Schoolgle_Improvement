/**
 * Save Module Selection API
 *
 * POST /api/onboarding/select-modules
 *
 * Saves the user's module selections per school.
 */

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute } from "@/lib/api-utils";
import { createClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createClient();
  const body = await req.json();
  const { schoolModules } = body; // [{ urn, modules: [] }]

  if (!schoolModules) {
    return NextResponse.json(
      { error: "schoolModules is required" },
      { status: 400 }
    );
  }

  try {
    await supabase
      .from("onboarding_leads")
      .update({
        selected_modules: schoolModules,
        current_step: 4,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", auth.userId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Failed to save module selection:", error);
    return NextResponse.json(
      { error: "Failed to save module selection" },
      { status: 500 }
    );
  }
});
