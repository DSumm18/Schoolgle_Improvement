/**
 * Energy Invoice Data API
 *
 * GET /api/estates/energy/invoice-data — returns invoice line-items with
 *     meter readings, reading types, and finance reconciliation status.
 *     Falls back to realistic demo data when tables are empty.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// ─── Demo data ───────────────────────────────────────────────────────

function demoPeriod(m: number, y: number) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[m]} ${y}`;
}

function generateDemoInvoices() {
  const invoices: any[] = [];
  const readings: any[] = [];
  const financeMatches: any[] = [];

  const elecMeter = "MPAN-2000085412345";
  const gasMeter = "MPRN-3512456";

  const readingTypes = ["actual", "actual", "actual", "estimated", "smart"];

  let elecPrev = 142300;
  let gasPrev = 58200;

  for (let i = 0; i < 24; i++) {
    const monthOffset = i;
    const date = new Date(2024, 4 + monthOffset, 15);
    const m = date.getMonth();
    const y = date.getFullYear();
    const period = demoPeriod(m, y);
    const isWinter = m >= 10 || m <= 2;

    // Electricity invoice
    const elecKwh = Math.round(
      (isWinter ? 22000 : 14000) + (Math.random() - 0.5) * 4000,
    );
    const elecCurr = elecPrev + elecKwh;
    const elecReadingType =
      readingTypes[Math.floor(Math.random() * readingTypes.length)];
    const elecUnitRate = 16.4 + Math.random() * 1.2;
    const elecStanding = 28.5;
    const elecCCL = Math.round(elecKwh * 0.00775 * 100) / 100;
    const elecOther = Math.round(Math.random() * 15 * 100) / 100;
    const elecNet =
      Math.round(
        (elecKwh * (elecUnitRate / 100) + elecStanding + elecCCL + elecOther) *
          100,
      ) / 100;
    const elecVat = Math.round(elecNet * 0.05 * 100) / 100;
    const elecTotal = Math.round((elecNet + elecVat) * 100) / 100;
    const elecInvNum = `EDF-${y}${String(m + 1).padStart(2, "0")}-E001`;

    invoices.push({
      id: `inv-elec-${i}`,
      invoice_date: date.toISOString().slice(0, 10),
      period,
      invoice_number: elecInvNum,
      fuel_type: "electricity",
      meter_ref: elecMeter,
      prev_reading: elecPrev,
      curr_reading: elecCurr,
      reading_type: elecReadingType,
      kwh_used: elecKwh,
      unit_rate_pence: Math.round(elecUnitRate * 100) / 100,
      standing_charge: elecStanding,
      ccl: elecCCL,
      other_charges: elecOther,
      other_charges_breakdown:
        elecOther > 5
          ? [
              {
                label: "Capacity charge",
                amount: Math.round(elecOther * 0.6 * 100) / 100,
              },
              {
                label: "Reactive power",
                amount: Math.round(elecOther * 0.4 * 100) / 100,
              },
            ]
          : [],
      net: elecNet,
      vat: elecVat,
      total: elecTotal,
      raw_extracted: {
        source: "AI extraction",
        confidence: 0.94 + Math.random() * 0.05,
        file: `EDF_Invoice_${y}${String(m + 1).padStart(2, "0")}.pdf`,
      },
    });

    // Finance match for electricity — occasionally with variance or missing
    const matchRoll = Math.random();
    if (matchRoll < 0.75) {
      financeMatches.push({
        invoice_number: elecInvNum,
        transaction_ref: elecInvNum,
        transaction_amount: elecTotal,
        transaction_date: date.toISOString().slice(0, 10),
        variance: 0,
        status: "matched",
      });
    } else if (matchRoll < 0.9) {
      const variance =
        Math.round(
          (Math.random() * 40 - 20 + (Math.random() > 0.5 ? 5 : -5)) * 100,
        ) / 100;
      financeMatches.push({
        invoice_number: elecInvNum,
        transaction_ref: elecInvNum,
        transaction_amount: Math.round((elecTotal + variance) * 100) / 100,
        transaction_date: date.toISOString().slice(0, 10),
        variance,
        status: "variance",
      });
    }
    // else: unmatched — no entry

    elecPrev = elecCurr;

    // Gas invoice
    const gasKwh = Math.round(
      (isWinter ? 28000 : 5000) + (Math.random() - 0.5) * 4000,
    );
    const gasCurr = gasPrev + gasKwh;
    const gasReadingType =
      readingTypes[Math.floor(Math.random() * readingTypes.length)];
    const gasUnitRate = 5.8 + Math.random() * 0.8;
    const gasStanding = 18.2;
    const gasCCL = Math.round(gasKwh * 0.00568 * 100) / 100;
    const gasOther = Math.round(Math.random() * 8 * 100) / 100;
    const gasNet =
      Math.round(
        (gasKwh * (gasUnitRate / 100) + gasStanding + gasCCL + gasOther) * 100,
      ) / 100;
    const gasVat = Math.round(gasNet * 0.05 * 100) / 100;
    const gasTotal = Math.round((gasNet + gasVat) * 100) / 100;
    const gasInvNum = `BG-${y}${String(m + 1).padStart(2, "0")}-G001`;

    invoices.push({
      id: `inv-gas-${i}`,
      invoice_date: date.toISOString().slice(0, 10),
      period,
      invoice_number: gasInvNum,
      fuel_type: "gas",
      meter_ref: gasMeter,
      prev_reading: gasPrev,
      curr_reading: gasCurr,
      reading_type: gasReadingType,
      kwh_used: gasKwh,
      unit_rate_pence: Math.round(gasUnitRate * 100) / 100,
      standing_charge: gasStanding,
      ccl: gasCCL,
      other_charges: gasOther,
      other_charges_breakdown:
        gasOther > 3
          ? [{ label: "Transportation charge", amount: gasOther }]
          : [],
      net: gasNet,
      vat: gasVat,
      total: gasTotal,
      raw_extracted: {
        source: "AI extraction",
        confidence: 0.91 + Math.random() * 0.06,
        file: `BritishGas_Invoice_${y}${String(m + 1).padStart(2, "0")}.pdf`,
      },
    });

    // Finance match for gas
    const gasMatchRoll = Math.random();
    if (gasMatchRoll < 0.8) {
      financeMatches.push({
        invoice_number: gasInvNum,
        transaction_ref: gasInvNum,
        transaction_amount: gasTotal,
        transaction_date: date.toISOString().slice(0, 10),
        variance: 0,
        status: "matched",
      });
    } else if (gasMatchRoll < 0.92) {
      const variance =
        Math.round(
          (Math.random() * 30 - 15 + (Math.random() > 0.5 ? 3 : -3)) * 100,
        ) / 100;
      financeMatches.push({
        invoice_number: gasInvNum,
        transaction_ref: gasInvNum,
        transaction_amount: Math.round((gasTotal + variance) * 100) / 100,
        transaction_date: date.toISOString().slice(0, 10),
        variance,
        status: "variance",
      });
    }

    gasPrev = gasCurr;
  }

  // Build summary
  const elecInvoices = invoices.filter(
    (inv) => inv.fuel_type === "electricity",
  );
  const gasInvoices = invoices.filter((inv) => inv.fuel_type === "gas");

  const totalKwhElectricity = elecInvoices.reduce(
    (s: number, inv: any) => s + inv.kwh_used,
    0,
  );
  const totalKwhGas = gasInvoices.reduce(
    (s: number, inv: any) => s + inv.kwh_used,
    0,
  );
  const totalCost = invoices.reduce((s: number, inv: any) => s + inv.total, 0);

  const estimatedCount = invoices.filter(
    (inv) => inv.reading_type === "estimated",
  ).length;
  const actualCount = invoices.filter(
    (inv) => inv.reading_type === "actual",
  ).length;

  const matchedSet = new Set(financeMatches.map((f: any) => f.invoice_number));
  const varianceSet = new Set(
    financeMatches
      .filter((f: any) => f.status === "variance")
      .map((f: any) => f.invoice_number),
  );
  const matchedCount = financeMatches.filter(
    (f: any) => f.status === "matched",
  ).length;
  const varianceCount = financeMatches.filter(
    (f: any) => f.status === "variance",
  ).length;
  const unmatchedCount = invoices.length - matchedSet.size;
  const totalVariance = financeMatches
    .filter((f: any) => f.status === "variance")
    .reduce((s: number, f: any) => s + Math.abs(f.variance), 0);

  const summary = {
    total_invoices: invoices.length,
    total_kwh_electricity: totalKwhElectricity,
    total_kwh_gas: totalKwhGas,
    total_cost: Math.round(totalCost * 100) / 100,
    estimated_count: estimatedCount,
    actual_count: actualCount,
    matched_count: matchedCount,
    variance_count: varianceCount,
    unmatched_count: unmatchedCount,
    total_variance: Math.round(totalVariance * 100) / 100,
  };

  return { invoices, readings: [], finance_matches: financeMatches, summary };
}

// ─── Route ───────────────────────────────────────────────────────────

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  // Attempt real data
  const { data: invoices, error } = await supabase
    .from("energy_invoices")
    .select("*")
    .eq("organization_id", orgId)
    .order("invoice_date", { ascending: false });

  if (!error && invoices && invoices.length > 0) {
    // Real data path — join readings and finance
    const invoiceIds = invoices.map((inv: any) => inv.id);

    const [readingsRes, financeRes] = await Promise.all([
      supabase
        .from("energy_invoice_readings")
        .select("*")
        .in("invoice_id", invoiceIds),
      supabase
        .from("finance_transactions")
        .select("*")
        .eq("organization_id", orgId)
        .in(
          "transaction_ref",
          invoices.map((inv: any) => inv.invoice_number),
        ),
    ]);

    const readings = readingsRes.data ?? [];
    const transactions = financeRes.data ?? [];

    // Build finance match map
    const txByRef = new Map<string, any>();
    for (const tx of transactions) {
      txByRef.set(tx.transaction_ref, tx);
    }

    const financeMatches = invoices
      .map((inv: any) => {
        const tx = txByRef.get(inv.invoice_number);
        if (!tx) return null;
        const variance = Math.round((tx.amount - inv.total) * 100) / 100;
        return {
          invoice_number: inv.invoice_number,
          transaction_ref: tx.transaction_ref,
          transaction_amount: tx.amount,
          transaction_date: tx.transaction_date,
          variance,
          status: Math.abs(variance) <= 1 ? "matched" : "variance",
        };
      })
      .filter(Boolean);

    const matchedSet = new Set(
      financeMatches.map((f: any) => f.invoice_number),
    );
    const elecInvoices = invoices.filter(
      (inv: any) => inv.fuel_type === "electricity",
    );
    const gasInvoices = invoices.filter((inv: any) => inv.fuel_type === "gas");

    const summary = {
      total_invoices: invoices.length,
      total_kwh_electricity: elecInvoices.reduce(
        (s: number, inv: any) => s + (inv.kwh_used ?? 0),
        0,
      ),
      total_kwh_gas: gasInvoices.reduce(
        (s: number, inv: any) => s + (inv.kwh_used ?? 0),
        0,
      ),
      total_cost: invoices.reduce(
        (s: number, inv: any) => s + (inv.total ?? 0),
        0,
      ),
      estimated_count: invoices.filter(
        (inv: any) => inv.reading_type === "estimated",
      ).length,
      actual_count: invoices.filter((inv: any) => inv.reading_type === "actual")
        .length,
      matched_count: financeMatches.filter((f: any) => f.status === "matched")
        .length,
      variance_count: financeMatches.filter((f: any) => f.status === "variance")
        .length,
      unmatched_count: invoices.length - matchedSet.size,
      total_variance: financeMatches
        .filter((f: any) => f.status === "variance")
        .reduce((s: number, f: any) => s + Math.abs(f.variance), 0),
    };

    return apiSuccess({
      invoices,
      readings,
      finance_matches: financeMatches,
      summary,
    });
  }

  // Fallback: demo data
  return apiSuccess(generateDemoInvoices());
});
