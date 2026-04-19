import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import {
  getDefaultSchoolDay,
  type SchoolDayConfig,
} from "@/lib/lesson-studio/timetable-config";

// GET /api/lesson-studio/timetable-config?organizationId=X
// Returns the school's persisted timetable config, or defaults if none exists.
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId =
    req.nextUrl.searchParams.get("organizationId") ?? auth.organizationId;

  if (!orgId) return apiError("organizationId required", 400);

  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from("school_settings")
      .select("timetable_config")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) {
      // Column may not exist yet — fall through to defaults.
      console.warn("[timetable-config] GET error, returning defaults:", error.message);
      return apiSuccess({ config: getDefaultSchoolDay(), source: "default" });
    }

    if (!data || !data.timetable_config) {
      return apiSuccess({ config: getDefaultSchoolDay(), source: "default" });
    }

    return apiSuccess({
      config: data.timetable_config as SchoolDayConfig,
      source: "persisted",
    });
  } catch (err) {
    console.warn("[timetable-config] Unexpected GET error, returning defaults:", err);
    return apiSuccess({ config: getDefaultSchoolDay(), source: "default" });
  }
});

// POST /api/lesson-studio/timetable-config
// Body: { organizationId?, config: SchoolDayConfig }
// Upserts the config into school_settings.timetable_config.
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const orgId: string = body.organizationId ?? auth.organizationId;
  const config: SchoolDayConfig = body.config;

  if (!orgId) return apiError("organizationId required", 400);
  if (!config) return apiError("config required", 400);

  // Basic shape validation — must have periods and schoolStart.
  if (!config.periods || !config.schoolStart || !config.schoolEnd) {
    return apiError(
      "config must include schoolStart, schoolEnd, and periods",
      400
    );
  }

  const supabase = createServiceRoleClient();

  try {
    const { error } = await supabase.from("school_settings").upsert(
      {
        organization_id: orgId,
        timetable_config: config,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organization_id" }
    );

    if (error) {
      // If the column doesn't exist yet, surface a clear message.
      if (
        error.message.includes("timetable_config") ||
        error.message.includes("column")
      ) {
        return apiError(
          "timetable_config column not yet available in school_settings. Run the migration to add it.",
          503
        );
      }
      return apiError(error.message, 500);
    }

    return apiSuccess({ saved: true, organizationId: orgId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return apiError(message, 500);
  }
});
