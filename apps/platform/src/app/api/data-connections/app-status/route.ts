import { NextRequest } from "next/server";
import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildAppConnectionStatus,
  type SchoolDataConnectionSnapshot,
} from "@/lib/connectors/app-connection-status";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = auth.organizationId;
  const appKey = req.nextUrl.searchParams.get("appKey");

  if (!orgId) return apiError("Missing organization", 400);
  if (!appKey) return apiError("Missing appKey", 400);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("school_data_connections")
    .select(
      "id,provider,folder_id,folder_name,is_active,scan_status,scan_error,last_scan_at,total_files,total_folders,detected_folders,connected_at",
    )
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .order("last_scan_at", { ascending: false, nullsFirst: false })
    .order("connected_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) return apiError("Failed to fetch data connection status", 500);

  const status = buildAppConnectionStatus(
    appKey,
    (data as SchoolDataConnectionSnapshot | null) || null,
  );

  if (!status) return apiError("Unknown appKey", 404);

  return apiSuccess({ status });
});
