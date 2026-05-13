/**
 * Energy Invoice Data API
 *
 * GET /api/estates/energy/invoice-data returns live invoice line-items with
 * meter readings, reading types, and finance reconciliation status.
 */

import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface EnergyInvoiceRow {
  id: string;
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  supply_period_start: string | null;
  supply_period_end: string | null;
  energy_type: "electricity" | "gas" | "water" | string | null;
  net_amount: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  extraction_confidence: number | null;
  source_file_name: string | null;
}

interface InvoiceReadingRow {
  invoice_id: string;
  meter_reference: string | null;
  previous_reading: number | null;
  current_reading: number | null;
  kwh_consumed: number | null;
  unit_rate_pence: number | null;
  standing_charge: number | null;
  ccl_charge: number | null;
}

interface FinanceTransaction {
  transaction_ref: string;
  amount: number;
  transaction_date: string;
}

interface FinanceMatch {
  invoice_number: string;
  transaction_ref: string;
  transaction_amount: number;
  transaction_date: string;
  variance: number;
  status: "matched" | "variance";
}

const emptyInvoiceData = {
  invoices: [],
  readings: [],
  finance_matches: [],
  summary: {
    total_invoices: 0,
    total_kwh_electricity: 0,
    total_kwh_gas: 0,
    total_cost: 0,
    estimated_count: 0,
    actual_count: 0,
    matched_count: 0,
    variance_count: 0,
    unmatched_count: 0,
    total_variance: 0,
  },
};

function periodLabel(invoice: EnergyInvoiceRow) {
  if (invoice.supply_period_start && invoice.supply_period_end) {
    return `${invoice.supply_period_start} to ${invoice.supply_period_end}`;
  }
  return invoice.invoice_date ?? "Unknown period";
}

function normaliseConfidence(confidence: number | null) {
  if (!confidence) return 0;
  return confidence > 1 ? confidence / 100 : confidence;
}

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;

  const { data: invoices, error } = await supabase
    .from("energy_invoices")
    .select("*")
    .eq("organization_id", orgId)
    .order("invoice_date", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!invoices || invoices.length === 0) {
    return apiSuccess(emptyInvoiceData);
  }

  const typedInvoices = invoices as EnergyInvoiceRow[];
  const invoiceIds = typedInvoices.map((invoice) => invoice.id);
  const invoiceNumbers = typedInvoices
    .map((invoice) => invoice.invoice_number)
    .filter((invoiceNumber): invoiceNumber is string => Boolean(invoiceNumber));

  const [readingsRes, financeRes] = await Promise.all([
    supabase
      .from("energy_invoice_readings")
      .select("*")
      .in("invoice_id", invoiceIds),
    invoiceNumbers.length > 0
      ? supabase
          .from("finance_transactions")
          .select("*")
          .eq("organization_id", orgId)
          .in("transaction_ref", invoiceNumbers)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (readingsRes.error) {
    throw new Error(readingsRes.error.message);
  }

  const readings = (readingsRes.data ?? []) as InvoiceReadingRow[];
  const transactions = (financeRes.data ?? []) as FinanceTransaction[];
  const readingsByInvoice = new Map<string, InvoiceReadingRow[]>();

  for (const reading of readings) {
    const grouped = readingsByInvoice.get(reading.invoice_id) ?? [];
    grouped.push(reading);
    readingsByInvoice.set(reading.invoice_id, grouped);
  }

  const transactionByRef = new Map<string, FinanceTransaction>();
  for (const transaction of transactions) {
    transactionByRef.set(transaction.transaction_ref, transaction);
  }

  const tableInvoices = typedInvoices.map((invoice) => {
    const invoiceReadings = readingsByInvoice.get(invoice.id) ?? [];
    const firstReading = invoiceReadings[0];
    const kwhUsed = invoiceReadings.reduce(
      (sum, reading) => sum + (Number(reading.kwh_consumed) || 0),
      0,
    );
    const standingCharge = invoiceReadings.reduce(
      (sum, reading) => sum + (Number(reading.standing_charge) || 0),
      0,
    );
    const ccl = invoiceReadings.reduce(
      (sum, reading) => sum + (Number(reading.ccl_charge) || 0),
      0,
    );
    const unitRate =
      invoiceReadings.length > 0
        ? invoiceReadings.reduce(
            (sum, reading) => sum + (Number(reading.unit_rate_pence) || 0),
            0,
          ) / invoiceReadings.length
        : 0;

    return {
      id: invoice.id,
      invoice_date: invoice.invoice_date ?? new Date().toISOString().slice(0, 10),
      period: periodLabel(invoice),
      invoice_number: invoice.invoice_number ?? invoice.id,
      fuel_type: invoice.energy_type ?? "electricity",
      meter_ref:
        invoiceReadings.length > 1
          ? `${invoiceReadings.length} meters`
          : firstReading?.meter_reference || "Unknown meter",
      prev_reading: Number(firstReading?.previous_reading) || 0,
      curr_reading: Number(firstReading?.current_reading) || 0,
      reading_type: "actual",
      kwh_used: kwhUsed,
      unit_rate_pence: unitRate,
      standing_charge: standingCharge,
      ccl,
      other_charges: 0,
      other_charges_breakdown: [],
      net: Number(invoice.net_amount) || 0,
      vat: Number(invoice.vat_amount) || 0,
      total: Number(invoice.total_amount) || 0,
      raw_extracted: {
        source: "AI extraction",
        confidence: normaliseConfidence(invoice.extraction_confidence),
        file: invoice.source_file_name ?? "Drive invoice",
      },
    };
  });

  const financeMatches = tableInvoices.reduce<FinanceMatch[]>(
    (matches, invoice) => {
      const transaction = transactionByRef.get(invoice.invoice_number);
      if (!transaction) return matches;

      const variance =
        Math.round((transaction.amount - invoice.total) * 100) / 100;

      matches.push({
        invoice_number: invoice.invoice_number,
        transaction_ref: transaction.transaction_ref,
        transaction_amount: transaction.amount,
        transaction_date: transaction.transaction_date,
        variance,
        status: Math.abs(variance) <= 1 ? "matched" : "variance",
      });

      return matches;
    },
    [],
  );

  const matchedSet = new Set(
    financeMatches.map((match) => match.invoice_number),
  );

  const summary = {
    total_invoices: tableInvoices.length,
    total_kwh_electricity: tableInvoices
      .filter((invoice) => invoice.fuel_type === "electricity")
      .reduce((sum, invoice) => sum + invoice.kwh_used, 0),
    total_kwh_gas: tableInvoices
      .filter((invoice) => invoice.fuel_type === "gas")
      .reduce((sum, invoice) => sum + invoice.kwh_used, 0),
    total_cost: tableInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    estimated_count: 0,
    actual_count: tableInvoices.length,
    matched_count: financeMatches.filter((match) => match.status === "matched")
      .length,
    variance_count: financeMatches.filter(
      (match) => match.status === "variance",
    ).length,
    unmatched_count: tableInvoices.length - matchedSet.size,
    total_variance: financeMatches
      .filter((match) => match.status === "variance")
      .reduce((sum, match) => sum + Math.abs(match.variance), 0),
  };

  return apiSuccess({
    invoices: tableInvoices,
    readings,
    finance_matches: financeMatches,
    summary,
  });
});
