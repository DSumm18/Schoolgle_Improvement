import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("settings, name")
    .eq("id", auth.organizationId)
    .single();

  if (error) {
    return apiError("Failed to fetch branding settings", 500);
  }

  return apiSuccess({
    settings: data.settings || {},
    school_name: data.name,
  });
});

export const PUT = protectedRoute(
  async (auth, req: NextRequest) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();

    // Fetch existing settings first
    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", auth.organizationId)
      .single();

    if (fetchError) {
      return apiError("Failed to fetch organization", 500);
    }

    // Merge new settings into existing
    const existingSettings = org.settings || {};
    const updatedSettings = { ...existingSettings, ...body };

    const { error: updateError } = await supabase
      .from("organizations")
      .update({ settings: updatedSettings })
      .eq("id", auth.organizationId);

    if (updateError) {
      return apiError("Failed to update branding settings", 500);
    }

    return apiSuccess({ settings: updatedSettings });
  },
  { requiredRole: "headteacher" },
);
