import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/website — Get website config for the organization
export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("school_websites")
    .select("*")
    .eq("organization_id", auth.organizationId)
    .maybeSingle();

  if (error) return apiError(error.message, 500);

  return apiSuccess(data);
});

// POST /api/website — Create website config (initial setup)
export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Check if one already exists
    const { data: existing } = await supabase
      .from("school_websites")
      .select("id")
      .eq("organization_id", auth.organizationId)
      .maybeSingle();

    if (existing) {
      return apiError("Website already exists for this organization", 409, "DUPLICATE");
    }

    const { data, error } = await supabase
      .from("school_websites")
      .insert({
        organization_id: auth.organizationId,
        school_name: body.schoolName || "My School",
        school_phase: body.schoolPhase || "primary",
        logo_url: body.logoUrl || null,
        motto: body.motto || null,
        preset_id: body.presetId || "friendly",
        palette: body.palette || {},
        font_pairing_id: body.fontPairingId || "nunito",
        hero_mask_id: body.heroMaskId || "wave_bottom",
        hero_image_url: body.heroImageUrl || null,
        subdomain: body.subdomain || null,
        contact_email: body.contactEmail || null,
        contact_phone: body.contactPhone || null,
        address: body.address || {},
        social_links: body.socialLinks || {},
        status: "setup",
      })
      .select()
      .single();

    if (error) return apiError(error.message, 500);

    return apiSuccess(data, 201);
  },
  { requiredRole: "slt" }
);

// PATCH /api/website — Update website config
export const PATCH = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const supabase = createServiceRoleClient();

    // Convert camelCase body to snake_case for Supabase
    const updateData: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      schoolName: "school_name",
      schoolPhase: "school_phase",
      logoUrl: "logo_url",
      faviconUrl: "favicon_url",
      heroImageUrl: "hero_image_url",
      heroVideoUrl: "hero_video_url",
      motto: "motto",
      presetId: "preset_id",
      palette: "palette",
      fontPairingId: "font_pairing_id",
      heroMaskId: "hero_mask_id",
      layoutOverrides: "layout_overrides",
      shapeOverrides: "shape_overrides",
      colourOverrides: "colour_overrides",
      typographyOverrides: "typography_overrides",
      motionOverrides: "motion_overrides",
      imageryOverrides: "imagery_overrides",
      homepageSections: "homepage_sections",
      status: "status",
      subdomain: "subdomain",
      customDomain: "custom_domain",
      seoTitle: "seo_title",
      seoDescription: "seo_description",
      seoImageUrl: "seo_image_url",
      googleAnalyticsId: "google_analytics_id",
      cookieConsentEnabled: "cookie_consent_enabled",
      socialLinks: "social_links",
      contactEmail: "contact_email",
      contactPhone: "contact_phone",
      address: "address",
    };

    for (const [camel, snake] of Object.entries(fieldMap)) {
      if (body[camel] !== undefined) {
        updateData[snake] = body[camel];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("No fields to update", 400);
    }

    const { data, error } = await supabase
      .from("school_websites")
      .update(updateData)
      .eq("organization_id", auth.organizationId)
      .select()
      .single();

    if (error) return apiError(error.message, 500);

    return apiSuccess(data);
  },
  { requiredRole: "slt" }
);
