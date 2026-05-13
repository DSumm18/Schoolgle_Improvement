import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const [locations, assets, staff, pupils, classes] = await Promise.all([
    countRows(supabase, "estates_locations", auth.organizationId),
    countRows(supabase, "estates_assets", auth.organizationId),
    countRows(supabase, "staff_directory", auth.organizationId),
    countRows(supabase, "pupils", auth.organizationId),
    countRows(supabase, "ls_classes", auth.organizationId),
  ]);

  return apiSuccess({
    counts: {
      locations,
      assets,
      staff,
      pupils,
      classes,
    },
  });
}, { requiredRole: "slt", rateLimit: false });

async function countRows(
  supabase: ReturnType<typeof createServiceRoleClient>,
  table: string,
  organizationId: string,
) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) return 0;
  return count ?? 0;
}
