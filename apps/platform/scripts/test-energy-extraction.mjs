#!/usr/bin/env node
/**
 * Test the energy invoice extraction pipeline directly.
 * Downloads a PDF from Google Drive, sends to AI, stores in Supabase.
 *
 * Run: node apps/platform/scripts/test-energy-extraction.mjs
 */

import { config } from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openrouter = new OpenAI({
  apiKey: OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://schoolgle.co.uk",
    "X-Title": "Schoolgle",
  },
});

const ORG_ID = "c64ed86b-9eab-49ee-9829-0706ff371083";

// All 8 invoices from Drive
const INVOICES = [
  {
    fileId: "1yNqSQtLWwBmh6CnGoEyrUHVSLNvWXoHi",
    name: "gas_utilities_ltd_q1_202504-202506.pdf",
  },
  {
    fileId: "1MzqMWGw9ZVc5BRTr_5LlF1e-VhcLRBTp",
    name: "gas_utilities_ltd_q2_202507-202509.pdf",
  },
  {
    fileId: "1UKl0Yq7n17pqk0IFlbb2m4WZvU8PC7xO",
    name: "gas_utilities_ltd_q3_202510-202512.pdf",
  },
  {
    fileId: "1upm8wTYK5B3mDjhaTJm3Out8FetNwvdF",
    name: "gas_utilities_ltd_q4_202601-202603.pdf",
  },
  {
    fileId: "168dgpoFoj-Om5Z5kpCRhFGTSoEpmfHmX",
    name: "spark_energy_q1_202504-202506.pdf",
  },
  {
    fileId: "18Laat3jN2rwbDt43tkue4kE8mkuDYswm",
    name: "spark_energy_q2_202507-202509.pdf",
  },
  {
    fileId: "1l2eKkBl--_zimgryxs9ZTtXJTvITtsjf",
    name: "spark_energy_q3_202510-202512.pdf",
  },
  {
    fileId: "1xSIVksndKFaT2kX3dPcCbdVXuzxu0HtL",
    name: "spark_energy_q4_202601-202603.pdf",
  },
];

const EXTRACTION_PROMPT = `You are an expert UK energy invoice data extractor. Extract ALL structured data from this energy invoice PDF into the exact JSON format below. Be precise with numbers - extract exactly what's on the invoice.

Return a single JSON object with this exact structure (no markdown, no code fences, just raw JSON):

{
  "supplier_name": "string - exact supplier company name",
  "invoice_number": "string",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "account_reference": "string",
  "supply_period_start": "YYYY-MM-DD",
  "supply_period_end": "YYYY-MM-DD",
  "supply_days": number,
  "contract_reference": "string - full contract/tariff name",
  "energy_type": "electricity" or "gas" or "water",
  "net_amount": number (excl VAT, in pounds),
  "vat_amount": number (in pounds),
  "vat_rate": number (percentage, e.g. 5),
  "total_amount": number (incl VAT, in pounds),
  "total_kwh": number (total kWh for all meters combined),
  "daily_average_kwh": number,
  "co2_tonnes": number,
  "meters": [
    {
      "meter_location": "string - e.g. Main School Plant Room (Boiler 1)",
      "meter_reference": "string - MPAN or MPRN number",
      "serial_number": "string - meter serial",
      "previous_reading": number,
      "current_reading": number,
      "units_consumed": number (m3 for gas, kWh for electricity),
      "kwh_consumed": number (always in kWh, after gas conversion if applicable),
      "energy_charge": number (in pounds),
      "standing_charge": number (in pounds),
      "ccl_charge": number (Climate Change Levy in pounds),
      "subtotal": number (meter subtotal in pounds),
      "unit_rate_pence": number (p/kWh),
      "standing_rate_pence": number (p/day),
      "ccl_rate_pence": number (p/kWh),
      "gas_calorific_value": number or null (only for gas),
      "gas_correction_factor": number or null (only for gas)
    }
  ]
}

Rules:
- All monetary amounts in GBP pounds (not pence)
- Dates in ISO format YYYY-MM-DD
- For gas invoices: extract both m3 units AND converted kWh
- Extract ALL meters listed on the invoice (could be 1, 2, or more)
- If a field is not visible on the invoice, use null
- Do NOT guess or calculate values - extract exactly what's printed`;

async function extractOne(fileId, fileName) {
  // Download from Drive
  const driveRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`,
  );
  if (!driveRes.ok)
    throw new Error(`Drive download failed: ${driveRes.status}`);
  const buffer = Buffer.from(await driveRes.arrayBuffer());
  const pdfBase64 = buffer.toString("base64");

  console.log(
    `  Downloaded ${fileName} (${(buffer.length / 1024).toFixed(1)} KB)`,
  );

  // AI extraction
  const response = await openrouter.chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: EXTRACTION_PROMPT },
          {
            type: "image_url",
            image_url: { url: `data:application/pdf;base64,${pdfBase64}` },
          },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 4000,
  });

  const raw = response.choices[0]?.message?.content || "";
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  let invoice;
  try {
    invoice = JSON.parse(cleaned);
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) invoice = JSON.parse(jsonMatch[0]);
    else throw new Error("Failed to parse AI response as JSON");
  }

  return { invoice, raw, model: "google/gemini-2.0-flash-001" };
}

function validate(invoice) {
  let score = 100;
  const warnings = [];

  if (!invoice.meters?.length) {
    warnings.push("No meters");
    score -= 25;
  }

  if (invoice.meters?.length && invoice.net_amount) {
    const meterSum = invoice.meters.reduce((s, m) => s + (m.subtotal || 0), 0);
    const diff = Math.abs(meterSum - invoice.net_amount);
    if (diff > 1) {
      warnings.push(
        `Meter sum ${meterSum.toFixed(2)} != net ${invoice.net_amount}`,
      );
      score -= 10;
    }
  }

  if (invoice.net_amount && invoice.vat_amount && invoice.total_amount) {
    const expected = invoice.net_amount + invoice.vat_amount;
    if (Math.abs(expected - invoice.total_amount) > 0.02) {
      warnings.push(
        `Net+VAT ${expected.toFixed(2)} != total ${invoice.total_amount}`,
      );
      score -= 10;
    }
  }

  return { score: Math.max(0, score), warnings };
}

async function storeInvoice(invoice, fileId, fileName, model, confidence) {
  // Upsert meters
  const meterIds = {};
  for (const meter of invoice.meters) {
    if (!meter.meter_reference) continue;
    const { data } = await supabase
      .from("energy_meters")
      .upsert(
        {
          organization_id: ORG_ID,
          meter_type: invoice.energy_type,
          meter_reference: meter.meter_reference,
          serial_number: meter.serial_number,
          location: meter.meter_location,
          is_active: true,
        },
        { onConflict: "organization_id,meter_reference" },
      )
      .select("id")
      .single();
    if (data) meterIds[meter.meter_reference] = data.id;
  }

  // Upsert invoice
  const { data: invRow, error: invErr } = await supabase
    .from("energy_invoices")
    .upsert(
      {
        organization_id: ORG_ID,
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
        source_file_id: fileId,
        source_file_name: fileName,
        extraction_model: model,
        extraction_confidence: confidence,
        extraction_status: "extracted",
        raw_extraction: { extracted_at: new Date().toISOString() },
      },
      { onConflict: "organization_id,invoice_number,supplier_name" },
    )
    .select("id")
    .single();

  if (invErr) throw new Error(`Invoice insert failed: ${invErr.message}`);

  // Delete old readings for this invoice, insert new
  await supabase
    .from("energy_invoice_readings")
    .delete()
    .eq("invoice_id", invRow.id);

  const readings = invoice.meters.map((m) => ({
    organization_id: ORG_ID,
    invoice_id: invRow.id,
    meter_id: meterIds[m.meter_reference] || null,
    meter_reference: m.meter_reference,
    meter_location: m.meter_location,
    reading_date: invoice.supply_period_end,
    previous_reading: m.previous_reading,
    current_reading: m.current_reading,
    units_consumed: m.units_consumed,
    kwh_consumed: m.kwh_consumed,
    energy_charge: m.energy_charge,
    standing_charge: m.standing_charge,
    ccl_charge: m.ccl_charge,
    subtotal: m.subtotal,
    unit_rate_pence: m.unit_rate_pence,
    standing_rate_pence: m.standing_rate_pence,
    ccl_rate_pence: m.ccl_rate_pence,
    daily_average_kwh:
      m.kwh_consumed && invoice.supply_days
        ? m.kwh_consumed / invoice.supply_days
        : null,
    co2_tonnes: m.kwh_consumed
      ? (m.kwh_consumed * (invoice.energy_type === "gas" ? 0.183 : 0.207)) /
        1000
      : null,
    gas_calorific_value: m.gas_calorific_value || null,
    gas_correction_factor: m.gas_correction_factor || null,
    source: "invoice",
  }));

  await supabase.from("energy_invoice_readings").insert(readings);
  return invRow.id;
}

async function main() {
  console.log("==========================================================");
  console.log("  ENERGY INVOICE EXTRACTION PIPELINE TEST");
  console.log("  PDF (Drive) -> AI Vision -> Supabase");
  console.log("==========================================================\n");

  const results = [];

  for (const inv of INVOICES) {
    console.log(`\n--- ${inv.name} ---`);
    try {
      const { invoice, raw, model } = await extractOne(inv.fileId, inv.name);
      const { score, warnings } = validate(invoice);

      console.log(`  Supplier:    ${invoice.supplier_name}`);
      console.log(`  Invoice:     ${invoice.invoice_number}`);
      console.log(`  Type:        ${invoice.energy_type}`);
      console.log(
        `  Period:      ${invoice.supply_period_start} to ${invoice.supply_period_end}`,
      );
      console.log(`  Total:       GBP ${invoice.total_amount}`);
      console.log(`  kWh:         ${invoice.total_kwh}`);
      console.log(`  CO2:         ${invoice.co2_tonnes} tonnes`);
      console.log(`  Meters:      ${invoice.meters?.length || 0}`);
      for (const m of invoice.meters || []) {
        console.log(
          `    - ${m.meter_location}: ${m.kwh_consumed} kWh, GBP ${m.subtotal}`,
        );
      }
      console.log(`  Confidence:  ${score}%`);
      if (warnings.length) console.log(`  Warnings:    ${warnings.join("; ")}`);

      // Store in Supabase
      const invoiceId = await storeInvoice(
        invoice,
        inv.fileId,
        inv.name,
        model,
        score,
      );
      console.log(`  Stored:      ${invoiceId}`);

      results.push({
        name: inv.name,
        success: true,
        score,
        total: invoice.total_amount,
        kwh: invoice.total_kwh,
      });
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      results.push({ name: inv.name, success: false, error: err.message });
    }
  }

  // Summary
  console.log("\n==========================================================");
  console.log("  SUMMARY");
  console.log("==========================================================");
  const ok = results.filter((r) => r.success);
  const fail = results.filter((r) => !r.success);
  console.log(`  Extracted:   ${ok.length}/${results.length}`);
  console.log(`  Failed:      ${fail.length}`);
  if (ok.length) {
    const totalCost = ok.reduce((s, r) => s + r.total, 0);
    const totalKwh = ok.reduce((s, r) => s + r.kwh, 0);
    console.log(`  Total cost:  GBP ${totalCost.toFixed(2)}`);
    console.log(`  Total kWh:   ${totalKwh.toLocaleString()}`);
    console.log(
      `  Avg confidence: ${(ok.reduce((s, r) => s + r.score, 0) / ok.length).toFixed(0)}%`,
    );
  }

  // Verify DB
  const { count: invCount } = await supabase
    .from("energy_invoices")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  const { count: meterCount } = await supabase
    .from("energy_meters")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);
  const { count: readingCount } = await supabase
    .from("energy_invoice_readings")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", ORG_ID);

  console.log(`\n  DB State:`);
  console.log(`    Invoices:  ${invCount}`);
  console.log(`    Meters:    ${meterCount}`);
  console.log(`    Readings:  ${readingCount}`);
  console.log("\nDone.");
}

main().catch(console.error);
