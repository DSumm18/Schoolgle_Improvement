import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  assessSecrReadiness,
  buildEnergyActionPlan,
  calculateCarbonSummary,
  type VehicleType,
} from "@/lib/energy/carbon-accounting";

interface EnergyInvoiceRow {
  id: string;
  energy_type: string | null;
  invoice_date: string | null;
}

interface EnergyReadingRow {
  invoice_id: string;
  kwh_consumed: number | null;
}

interface MileageClaimRow {
  miles: number | null;
  vehicle_type: string | null;
}

function startDateForMonths(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

async function readMileageByVehicle(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
  startDate: string,
) {
  const mileageByVehicle: Partial<Record<VehicleType, number>> = {};

  const { data, error } = await supabase
    .from("mileage_claims")
    .select("miles, vehicle_type")
    .eq("organization_id", organizationId)
    .gte("claim_date", startDate);

  if (error) {
    return { mileageByVehicle, unavailable: true };
  }

  for (const claim of (data ?? []) as MileageClaimRow[]) {
    const vehicleType = (claim.vehicle_type || "car") as VehicleType;
    mileageByVehicle[vehicleType] =
      (mileageByVehicle[vehicleType] || 0) + (Number(claim.miles) || 0);
  }

  return { mileageByVehicle, unavailable: false };
}

export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const organizationId = auth.organizationId;
  const url = new URL(request.url);
  const months = Number(url.searchParams.get("months") || 12);
  const startDate = startDateForMonths(months);
  const priorStartDate = startDateForMonths(months * 2);

  const { data: invoices } = await supabase
    .from("energy_invoices")
    .select("id, energy_type, invoice_date")
    .eq("organization_id", organizationId)
    .gte("invoice_date", startDate);

  const typedInvoices = (invoices ?? []) as EnergyInvoiceRow[];
  const invoiceIds = typedInvoices.map((invoice) => invoice.id);
  const invoiceTypeById = new Map(
    typedInvoices.map((invoice) => [invoice.id, invoice.energy_type || "electricity"]),
  );

  const { data: readings } =
    invoiceIds.length > 0
      ? await supabase
          .from("energy_invoice_readings")
          .select("invoice_id, kwh_consumed")
          .eq("organization_id", organizationId)
          .in("invoice_id", invoiceIds)
      : { data: [] };

  let electricityKwh = 0;
  let gasKwh = 0;

  for (const reading of (readings ?? []) as EnergyReadingRow[]) {
    const kwh = Number(reading.kwh_consumed) || 0;
    const energyType = invoiceTypeById.get(reading.invoice_id);
    if (energyType === "gas") gasKwh += kwh;
    if (energyType === "electricity") electricityKwh += kwh;
  }

  const { mileageByVehicle, unavailable: mileageUnavailable } =
    await readMileageByVehicle(supabase, organizationId, startDate);

  const { data: anomalies } = await supabase
    .from("energy_anomalies")
    .select("status, estimated_waste_cost")
    .eq("organization_id", organizationId)
    .in("status", ["detected", "investigating", "confirmed"]);

  const activeAnomalies = anomalies?.length ?? 0;
  const estimatedWasteCost = (anomalies ?? []).reduce(
    (sum, anomaly) => sum + (Number(anomaly.estimated_waste_cost) || 0),
    0,
  );

  const { count: priorYearInvoiceCount } = await supabase
    .from("energy_invoices")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("invoice_date", priorStartDate)
    .lt("invoice_date", startDate);

  const summary = calculateCarbonSummary({
    electricityKwh,
    gasKwh,
    mileageByVehicle,
    floorAreaSqm: null,
    pupilCount: null,
  });
  const hasMileageData = Object.values(mileageByVehicle).some(
    (miles) => Number(miles) > 0,
  );
  const hasInvoiceData = typedInvoices.length > 0;
  const actions = buildEnergyActionPlan({
    summary,
    activeAnomalies,
    estimatedWasteCost,
    hasMileageData,
    hasInvoiceData,
  });
  const readiness = assessSecrReadiness({
    hasElectricity: electricityKwh > 0,
    hasGas: gasKwh > 0,
    hasMileage: hasMileageData,
    hasIntensityMetric: summary.intensityTonnesPerPupil !== null,
    hasMethodology: true,
    hasPriorYearComparison: (priorYearInvoiceCount ?? 0) > 0,
    hasEnergyEfficiencyActions: actions.length > 0,
    isTrustLevel: true,
  });

  return apiSuccess({
    period_months: months,
    scope: "school",
    summary,
    readiness,
    actions,
    data_quality: {
      invoice_count: typedInvoices.length,
      active_anomalies: activeAnomalies,
      estimated_waste_cost: estimatedWasteCost,
      mileage_table_available: !mileageUnavailable,
      mileage_has_rows: hasMileageData,
      prior_year_invoice_count: priorYearInvoiceCount ?? 0,
    },
    trust_rollup_ready: false,
  });
});
