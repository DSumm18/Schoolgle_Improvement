import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const AI_PREFERENCE_FIELDS = [
  "ai_tone",
  "ai_school_context",
  "ai_priorities",
  "ai_preferred_terminology",
  "ai_temperature_offset",
  "ai_response_style",
] as const;

type AiPreferenceKey = (typeof AI_PREFERENCE_FIELDS)[number];

export interface AiPreferences {
  ai_tone?: string;
  ai_school_context?: string;
  ai_priorities?: string;
  ai_preferred_terminology?: Record<string, string>;
  ai_temperature_offset?: number;
  ai_response_style?: string;
}

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("settings")
    .eq("id", auth.organizationId)
    .single();

  if (error) {
    return apiError("Failed to fetch AI preferences", 500);
  }

  const settings = data?.settings ?? {};

  const preferences: AiPreferences = {};
  for (const field of AI_PREFERENCE_FIELDS) {
    if (field in settings) {
      (preferences as Record<AiPreferenceKey, unknown>)[field] = settings[field];
    }
  }

  return apiSuccess({ preferences });
});

export const PUT = protectedRoute(
  async (auth, req: NextRequest) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();

    // Only allow recognised AI preference fields
    const incoming: AiPreferences = {};
    for (const field of AI_PREFERENCE_FIELDS) {
      if (field in body) {
        (incoming as Record<AiPreferenceKey, unknown>)[field] = body[field];
      }
    }

    // Fetch existing settings to merge
    const { data: org, error: fetchError } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", auth.organizationId)
      .single();

    if (fetchError) {
      return apiError("Failed to fetch organization settings", 500);
    }

    const existingSettings = org?.settings ?? {};
    const updatedSettings = { ...existingSettings, ...incoming };

    const { error: updateError } = await supabase
      .from("organizations")
      .update({ settings: updatedSettings })
      .eq("id", auth.organizationId);

    if (updateError) {
      return apiError("Failed to save AI preferences", 500);
    }

    return apiSuccess({ preferences: incoming });
  },
  { requiredRole: "headteacher" },
);
