/**
 * School Branding API
 *
 * GET   /api/branding - Get school branding
 * PATCH /api/branding - Update school branding
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("school_branding")
    .select("*")
    .eq("organization_id", organizationId)
    .single();

  if (error && error.code !== "PGRST116") {
    return apiError("Failed to fetch branding", 500);
  }

  // Return defaults if no branding set
  if (!data) {
    // Get org name as fallback
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .single();

    return apiSuccess({
      branding: {
        school_name: org?.name || "School",
        primary_color: "#1e40af",
        secondary_color: "#059669",
        display_theme: "light",
        show_motto_on_display: true,
      },
      isDefault: true,
    });
  }

  return apiSuccess({ branding: data, isDefault: false });
});

export const PATCH = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;
  const supabase = createServiceRoleClient();
  const body = await request.json();

  // Only allow known fields
  const allowedFields = [
    "logo_url", "logo_dark_url", "crest_url", "favicon_url",
    "primary_color", "secondary_color", "alert_color",
    "school_name", "school_motto", "school_type",
    "trust_name", "trust_logo_url",
    "display_theme", "show_trust_branding", "show_motto_on_display",
  ];

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }

  // Upsert - create if doesn't exist
  const { data, error } = await supabase
    .from("school_branding")
    .upsert({
      organization_id: organizationId,
      ...updates,
    }, { onConflict: "organization_id" })
    .select()
    .single();

  if (error) {
    console.error("[Branding] PATCH error:", error);
    return apiError("Failed to update branding", 500);
  }

  return apiSuccess({ branding: data });
});
