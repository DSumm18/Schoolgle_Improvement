/**
 * Energy Anomalies API
 *
 * GET /api/estates/energy/anomalies - Get detected anomalies (demo data for now)
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";

const DEMO_ANOMALIES = [
  {
    id: "anom-1",
    anomaly_type: "weekend_usage",
    title: "High weekend electricity usage",
    description:
      "Saturday 1st March electricity consumption was 68% of weekday average. Expected max is 20%. Check heating timers and ICT equipment left on.",
    detected_date: "2026-03-01",
    estimated_waste_kwh: 285,
    estimated_waste_cost: 46.74,
    estimated_annual_cost: 2_430.0,
    meter_id: "elec-main-01",
    status: "detected",
  },
  {
    id: "anom-2",
    anomaly_type: "overnight_excess",
    title: "Overnight baseload spike",
    description:
      "Electricity baseload between 10pm-6am increased by 34% compared to previous month. Likely cause: heating override left on or faulty timer.",
    detected_date: "2026-03-05",
    estimated_waste_kwh: 420,
    estimated_waste_cost: 68.88,
    estimated_annual_cost: 3_580.0,
    meter_id: "elec-main-01",
    status: "investigating",
  },
  {
    id: "anom-3",
    anomaly_type: "holiday_heating",
    title: "Gas usage during half-term",
    description:
      "Gas consumption during February half-term (17-21 Feb) was 72% of normal term-time levels. Heating should be on frost protection only.",
    detected_date: "2026-02-21",
    estimated_waste_kwh: 890,
    estimated_waste_cost: 108.46,
    estimated_annual_cost: 1_410.0,
    meter_id: "gas-main-01",
    status: "confirmed",
  },
  {
    id: "anom-4",
    anomaly_type: "baseload_increase",
    title: "Water baseload increase",
    description:
      "Water consumption overnight has increased by 15 litres/hour over the last 2 weeks. Possible leak or running cistern.",
    detected_date: "2026-03-08",
    estimated_waste_kwh: 0,
    estimated_waste_cost: 24.5,
    estimated_annual_cost: 1_274.0,
    meter_id: "water-main-01",
    status: "detected",
  },
];

export const GET = protectedRoute(async () => {
  return apiSuccess({
    demo: true,
    anomalies: DEMO_ANOMALIES,
    total_annual_waste_cost: DEMO_ANOMALIES.reduce(
      (sum, a) => sum + (a.estimated_annual_cost ?? 0),
      0,
    ),
  });
});
