import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { parseMileageClaimsCsv } from "@/lib/energy/mileage-import";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const csvText = String(body.csvText || "");

  if (!csvText.trim()) {
    return apiError("csvText is required", 400);
  }

  const parsed = parseMileageClaimsCsv(csvText);
  if (parsed.validRows.length === 0) {
    return apiSuccess({
      imported: 0,
      errors: parsed.errors,
      message: "No valid mileage rows found.",
    });
  }

  const supabase = createServiceRoleClient();
  const rows = parsed.validRows.map((row) => ({
    organization_id: auth.organizationId,
    staff_name: row.staff_name,
    claim_date: row.claim_date,
    from_location: row.from_location,
    to_location: row.to_location,
    miles: row.miles,
    purpose: row.purpose,
    rate_pence: row.rate_pence,
    vehicle_type: row.vehicle_type,
    status: "approved",
  }));

  const { data, error } = await supabase
    .from("mileage_claims")
    .insert(rows)
    .select("id");

  if (error) {
    return apiError(`Failed to import mileage claims: ${error.message}`, 500);
  }

  return apiSuccess({
    imported: data?.length ?? rows.length,
    errors: parsed.errors,
    message: `Imported ${data?.length ?? rows.length} mileage claim${
      (data?.length ?? rows.length) === 1 ? "" : "s"
    }.`,
  });
});
