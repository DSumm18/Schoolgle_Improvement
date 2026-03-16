import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

const EXT_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
};

export const POST = protectedRoute(
  async (auth, req: NextRequest) => {
    const supabase = createServiceRoleClient();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("No file provided", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError(
        "Invalid file type. Only PNG, JPG, and SVG are allowed.",
        400,
      );
    }

    if (file.size > MAX_SIZE) {
      return apiError("File too large. Maximum size is 2MB.", 400);
    }

    const ext = EXT_MAP[file.type] || "png";
    const storagePath = `logos/${auth.organizationId}/logo.${ext}`;

    // Upload to Supabase storage (upsert to overwrite existing)
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("compliance")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Logo upload error:", uploadError);
      return apiError("Failed to upload logo", 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("compliance")
      .getPublicUrl(storagePath);

    const logoUrl = urlData.publicUrl;

    // Update organization settings with logo URL
    const { data: org } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", auth.organizationId)
      .single();

    const existingSettings = org?.settings || {};
    const updatedSettings = { ...existingSettings, logo_url: logoUrl };

    await supabase
      .from("organizations")
      .update({ settings: updatedSettings })
      .eq("id", auth.organizationId);

    return apiSuccess({ logo_url: logoUrl });
  },
  { requiredRole: "headteacher" },
);
