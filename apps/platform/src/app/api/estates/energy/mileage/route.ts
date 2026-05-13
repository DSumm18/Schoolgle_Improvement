import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { UK_2025_EMISSION_FACTORS } from "@/lib/energy/carbon-accounting";

type MileageVehicleType = "car" | "motorcycle" | "bicycle" | "electric_car";

interface MileageClaimRow {
  id: string;
  staff_name: string;
  claim_date: string;
  from_location: string;
  to_location: string;
  miles: number;
  purpose: string | null;
  rate_pence: number | null;
  amount_pence: number | null;
  vehicle_type: MileageVehicleType | null;
  status: string | null;
}

function normaliseVehicleType(vehicleType: unknown): MileageVehicleType {
  if (
    vehicleType === "motorcycle" ||
    vehicleType === "bicycle" ||
    vehicleType === "electric_car"
  ) {
    return vehicleType;
  }
  return "car";
}

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const organizationId = auth.organizationId;

  const { data, error } = await supabase
    .from("mileage_claims")
    .select("*")
    .eq("organization_id", organizationId)
    .order("claim_date", { ascending: false })
    .limit(250);

  if (error) {
    return apiSuccess({
      claims: [],
      summary: {
        total_miles: 0,
        total_cost_gbp: 0,
        total_co2_kg: 0,
        claims_count: 0,
      },
      table_available: false,
      message: "Mileage claims table is not available in this environment.",
    });
  }

  const claims = ((data ?? []) as MileageClaimRow[]).map((claim) => {
    const vehicleType = normaliseVehicleType(claim.vehicle_type);
    const miles = Number(claim.miles) || 0;
    return {
      id: claim.id,
      date: claim.claim_date,
      staff_name: claim.staff_name,
      from: claim.from_location,
      to: claim.to_location,
      miles,
      purpose: claim.purpose || "",
      rate: (Number(claim.rate_pence) || 45) / 100,
      amount: (Number(claim.amount_pence) || miles * (Number(claim.rate_pence) || 45)) / 100,
      vehicle_type: vehicleType,
      status: claim.status || "pending",
      co2_kg:
        miles *
        (UK_2025_EMISSION_FACTORS.mileageKgCo2ePerMile[vehicleType] ??
          UK_2025_EMISSION_FACTORS.mileageKgCo2ePerMile.car),
    };
  });

  return apiSuccess({
    claims,
    table_available: true,
    summary: {
      total_miles: claims.reduce((sum, claim) => sum + claim.miles, 0),
      total_cost_gbp: claims.reduce((sum, claim) => sum + claim.amount, 0),
      total_co2_kg: claims.reduce((sum, claim) => sum + claim.co2_kg, 0),
      claims_count: claims.length,
    },
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const {
    staff_name,
    claim_date,
    from_location,
    to_location,
    miles,
    purpose,
    rate_pence = 45,
    vehicle_type = "car",
  } = body;

  if (!staff_name || !claim_date || !from_location || !to_location || !miles) {
    return apiError(
      "staff_name, claim_date, from_location, to_location and miles are required",
      400,
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("mileage_claims")
    .insert({
      organization_id: auth.organizationId,
      staff_name,
      claim_date,
      from_location,
      to_location,
      miles,
      purpose: purpose || null,
      rate_pence,
      vehicle_type: normaliseVehicleType(vehicle_type),
      status: "approved",
    })
    .select()
    .single();

  if (error) {
    return apiError(`Failed to save mileage claim: ${error.message}`, 500);
  }

  return apiSuccess({ claim: data });
});
