import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  ExtractedMeterReading,
  ExtractionResult,
} from "@/lib/energy/invoice-extractor";

interface SaveEnergyExtractionInput {
  organizationId: string;
  fileId?: string | null;
  fileName?: string | null;
  result: ExtractionResult;
}

export async function saveEnergyExtraction({
  organizationId,
  fileId,
  fileName,
  result,
}: SaveEnergyExtractionInput) {
  if (!result.success || !result.invoice) {
    return {
      success: false,
      errors: result.errors,
      warnings: result.warnings,
      model_used: result.model_used,
    };
  }

  const invoice = result.invoice;
  const supabase = createServiceRoleClient();
  const meterIds: Record<string, string> = {};

  for (const meter of invoice.meters) {
    if (!meter.meter_reference) continue;

    const { data: meterRow, error: meterErr } = await supabase
      .from("energy_meters")
      .upsert(
        {
          organization_id: organizationId,
          meter_type: invoice.energy_type,
          meter_reference: meter.meter_reference,
          serial_number: meter.serial_number || null,
          location: meter.meter_location || null,
          is_active: true,
        },
        { onConflict: "organization_id,meter_type,meter_reference" },
      )
      .select("id")
      .single();

    if (meterRow) {
      meterIds[meter.meter_reference] = meterRow.id;
    }

    if (meterErr) {
      console.error("[EnergyInvoice] Meter upsert error:", meterErr.message);
    }
  }

  const { data: invoiceRow, error: invoiceErr } = await supabase
    .from("energy_invoices")
    .upsert(
      {
        organization_id: organizationId,
        supplier_name: invoice.supplier_name,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        account_reference: invoice.account_reference,
        supply_period_start: invoice.supply_period_start,
        supply_period_end: invoice.supply_period_end,
        supply_days: invoice.supply_days,
        contract_reference: invoice.contract_reference,
        net_amount: invoice.net_amount,
        vat_amount: invoice.vat_amount,
        vat_rate: invoice.vat_rate,
        total_amount: invoice.total_amount,
        energy_type: invoice.energy_type,
        source_file_id: fileId || null,
        source_file_name: fileName || null,
        extraction_model: result.model_used,
        extraction_confidence: result.confidence,
        extraction_status: "extracted",
        raw_extraction: {
          response: result.raw_response,
          extracted_at: new Date().toISOString(),
        },
      },
      { onConflict: "organization_id,invoice_number,supplier_name" },
    )
    .select("id")
    .single();

  if (invoiceErr) {
    throw new Error(`Failed to save invoice: ${invoiceErr.message}`);
  }

  const readingRows = invoice.meters.map((meter: ExtractedMeterReading) => ({
    organization_id: organizationId,
    invoice_id: invoiceRow.id,
    meter_id: meterIds[meter.meter_reference] || null,
    meter_reference: meter.meter_reference,
    meter_location: meter.meter_location,
    reading_date: invoice.supply_period_end,
    previous_reading: meter.previous_reading,
    current_reading: meter.current_reading,
    units_consumed: meter.units_consumed,
    kwh_consumed: meter.kwh_consumed,
    energy_charge: meter.energy_charge,
    standing_charge: meter.standing_charge,
    ccl_charge: meter.ccl_charge,
    subtotal: meter.subtotal,
    unit_rate_pence: meter.unit_rate_pence,
    standing_rate_pence: meter.standing_rate_pence,
    ccl_rate_pence: meter.ccl_rate_pence,
    daily_average_kwh:
      meter.kwh_consumed && invoice.supply_days
        ? meter.kwh_consumed / invoice.supply_days
        : null,
    co2_tonnes: meter.kwh_consumed
      ? (meter.kwh_consumed * (invoice.energy_type === "gas" ? 0.183 : 0.207)) /
        1000
      : null,
    gas_calorific_value: meter.gas_calorific_value || null,
    gas_correction_factor: meter.gas_correction_factor || null,
    source: "invoice",
  }));

  await supabase
    .from("energy_invoice_readings")
    .delete()
    .eq("invoice_id", invoiceRow.id);

  if (readingRows.length > 0) {
    const { error: readingsErr } = await supabase
      .from("energy_invoice_readings")
      .insert(readingRows);

    if (readingsErr) {
      console.error(
        "[EnergyInvoice] Readings insert error:",
        readingsErr.message,
      );
    }
  }

  return {
    success: true,
    invoice_id: invoiceRow.id,
    confidence: result.confidence,
    model_used: result.model_used,
    extracted: {
      supplier: invoice.supplier_name,
      invoice_number: invoice.invoice_number,
      energy_type: invoice.energy_type,
      period: `${invoice.supply_period_start} to ${invoice.supply_period_end}`,
      total_amount: invoice.total_amount,
      total_kwh: invoice.total_kwh,
      co2_tonnes: invoice.co2_tonnes,
      meters_count: invoice.meters.length,
      meters: invoice.meters.map((meter) => ({
        location: meter.meter_location,
        reference: meter.meter_reference,
        kwh: meter.kwh_consumed,
        cost: meter.subtotal,
      })),
    },
    warnings: result.warnings,
    errors: result.errors,
  };
}
