import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { buildBehaviourPolicyDraftPreview } from "@/lib/compliance/policies/packs/behaviour-policy-pack";
import { buildStarterPolicyDraftPreview } from "@/lib/compliance/policies/packs/starter-policy-pack";

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const body = await request.json();
  const {
    requirementId,
    mode = "missing_policy",
    existingFileName,
    weakAreas,
  } = body as {
    requirementId?: string;
    mode?: "missing_policy" | "improve_existing";
    existingFileName?: string;
    weakAreas?: string[];
  };

  if (!requirementId) {
    return apiError("Missing policy requirement", 400);
  }

  const supabase = createServiceRoleClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, settings")
    .eq("id", auth.organizationId)
    .maybeSingle();
  const settings = (org?.settings as Record<string, string> | null) || {};

  const preview =
    requirementId === "behaviour-policy"
      ? buildBehaviourPolicyDraftPreview({
          mode,
          schoolName: org?.name || "Your school",
          schoolLogoUrl: settings.logo_url,
          primaryColor: settings.primary_color,
          existingFileName,
          weakAreas: weakAreas || [],
        })
      : buildStarterPolicyDraftPreview({
          requirementId,
          mode,
          schoolName: org?.name || "Your school",
          schoolLogoUrl: settings.logo_url,
          primaryColor: settings.primary_color,
          existingFileName,
          weakAreas: weakAreas || [],
        });

  if (!preview) return apiError("Unknown policy requirement", 404);

  return apiSuccess(preview);
});
