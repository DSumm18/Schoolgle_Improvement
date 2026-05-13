/**
 * Energy Invoice Extraction Engine
 *
 * Takes a PDF energy invoice (as base64) and uses AI vision to extract
 * structured data: invoice header, per-meter readings, cost breakdowns.
 *
 * Pipeline: PDF (base64) → AI Vision → Structured JSON → Validation → Supabase
 *
 * Uses Gemini 2.0 Flash via OpenRouter for vision extraction.
 * Falls back to Mistral OCR for scanned/low-quality PDFs.
 */

import { openrouter } from "@/lib/ai-openrouter";

// ─── Types ──────────────────────────────────────────────────────────

export interface ExtractedMeterReading {
  meter_location: string;
  meter_reference: string; // MPAN or MPRN
  serial_number: string;
  previous_reading: number;
  current_reading: number;
  units_consumed: number; // m³ for gas, kWh for electricity
  kwh_consumed: number; // Always kWh
  energy_charge: number;
  standing_charge: number;
  ccl_charge: number;
  subtotal: number;
  unit_rate_pence: number;
  standing_rate_pence: number;
  ccl_rate_pence: number;
  // Gas-specific
  gas_calorific_value?: number;
  gas_correction_factor?: number;
}

export interface ExtractedInvoice {
  supplier_name: string;
  invoice_number: string;
  invoice_date: string; // ISO date
  due_date: string;
  account_reference: string;
  supply_period_start: string;
  supply_period_end: string;
  supply_days: number;
  contract_reference: string;
  energy_type: "electricity" | "gas" | "water";
  net_amount: number;
  vat_amount: number;
  vat_rate: number;
  total_amount: number;
  total_kwh: number;
  daily_average_kwh: number;
  co2_tonnes: number;
  meters: ExtractedMeterReading[];
}

export interface ExtractionResult {
  success: boolean;
  invoice?: ExtractedInvoice;
  confidence: number; // 0-100
  model_used: string;
  errors: string[];
  warnings: string[];
  raw_response?: string;
}

// ─── Extraction Prompt ──────────────────────────────────────────────

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

// ─── Main Extraction Function ───────────────────────────────────────

export async function extractEnergyInvoice(
  pdfBase64: string,
  fileName: string,
): Promise<ExtractionResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const textInvoice = await extractEngieGasInvoiceFromPdf(pdfBase64).catch(
    (err: any) => {
      warnings.push(`Text extraction skipped: ${err.message}`);
      return undefined;
    },
  );

  if (textInvoice) {
    const confidence = validateExtraction(textInvoice, warnings);

    return {
      success: true,
      invoice: textInvoice,
      confidence: Math.max(confidence, 95),
      model_used: "pdf-text:engie-gas-v1",
      errors,
      warnings,
      raw_response: JSON.stringify(textInvoice),
    };
  }

  // Try Gemini Flash first (good at structured extraction from PDFs)
  const primaryModel = "google/gemini-2.0-flash-001";
  const fallbackModel = "mistralai/mistral-ocr-latest";

  let modelUsed = primaryModel;
  let rawResponse = "";
  let invoice: ExtractedInvoice | undefined;

  try {
    const response = await openrouter.chat.completions.create({
      model: primaryModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    });

    rawResponse = response.choices[0]?.message?.content || "";
    invoice = parseExtractionResponse(rawResponse, errors);
  } catch (err: any) {
    warnings.push(`Primary model failed: ${err.message}. Trying fallback...`);

    // Fallback to Mistral OCR
    try {
      modelUsed = fallbackModel;
      const response = await openrouter.chat.completions.create({
        model: fallbackModel,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`,
                },
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 4000,
      });

      rawResponse = response.choices[0]?.message?.content || "";
      invoice = parseExtractionResponse(rawResponse, errors);
    } catch (fallbackErr: any) {
      errors.push(`Fallback model also failed: ${fallbackErr.message}`);
    }
  }

  if (!invoice) {
    return {
      success: false,
      confidence: 0,
      model_used: modelUsed,
      errors: errors.length ? errors : ["Failed to extract invoice data"],
      warnings,
      raw_response: rawResponse,
    };
  }

  // Validate extracted data
  const confidence = validateExtraction(invoice, warnings);

  return {
    success: true,
    invoice,
    confidence,
    model_used: modelUsed,
    errors,
    warnings,
    raw_response: rawResponse,
  };
}

// â”€â”€â”€ Deterministic Text Extraction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async function extractPdfText(pdfBase64: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(Buffer.from(pdfBase64, "base64"));
  const loadingTask = pdfjs.getDocument({ data } as any);
  const doc = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item: any) => item.str).join(" "));
  }

  return pages.join("\n");
}

async function extractEngieGasInvoiceFromPdf(
  pdfBase64: string,
): Promise<ExtractedInvoice | undefined> {
  const text = normaliseInvoiceText(await extractPdfText(pdfBase64));

  if (!/Your Gas Invoice Summary/i.test(text) || !/ENGIE Gas Limited/i.test(text)) {
    return undefined;
  }

  const invoiceNumber = matchText(text, /Invoice Number\s+([0-9-]+)/i);
  const invoiceDate = toIsoDate(matchText(text, /Date of Invoice\s+(\d{2}\/\d{2}\/\d{4})/i));
  const dueDate = toIsoDate(matchText(text, /Due Date\s+(\d{2}\/\d{2}\/\d{4})/i));
  const accountReference = matchText(text, /Your Account Number\s+(\d+)/i);
  const period = text.match(
    /Invoice Period\s+(\d{2}\/\d{2}\/\d{4})\s+to\s+(\d{2}\/\d{2}\/\d{4})/i,
  );
  const supplyPeriodStart = toIsoDate(period?.[1] ?? null);
  const supplyPeriodEnd = toIsoDate(period?.[2] ?? null);
  const supplyDays =
    supplyPeriodStart && supplyPeriodEnd
      ? daysInclusive(supplyPeriodStart, supplyPeriodEnd)
      : 0;

  const netAmount = moneyAfter(text, /Total Excluding VAT/i);
  const totalAmount = moneyAfter(text, /Total Amount Payable/i);
  const vatAmount = totalAmount !== null && netAmount !== null
    ? roundMoney(totalAmount - netAmount)
    : moneyAfter(text, /Total VAT/i);
  const totalKwh = numberAfter(text, /Total Gas Consumed/i);
  const meter = extractEngieGasMeter(text);

  if (
    !invoiceNumber ||
    !invoiceDate ||
    !accountReference ||
    !supplyPeriodStart ||
    !supplyPeriodEnd ||
    !meter
  ) {
    return undefined;
  }

  const meters = [meter];
  const co2Tonnes = totalKwh ? roundDecimal((totalKwh * 0.183) / 1000, 4) : 0;

  return {
    supplier_name: "ENGIE Gas Limited",
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    due_date: dueDate || invoiceDate,
    account_reference: accountReference,
    supply_period_start: supplyPeriodStart,
    supply_period_end: supplyPeriodEnd,
    supply_days: supplyDays,
    contract_reference: "ENGIE Gas",
    energy_type: "gas",
    net_amount: netAmount ?? 0,
    vat_amount: vatAmount ?? 0,
    vat_rate:
      vatAmount !== null && netAmount ? roundDecimal((vatAmount / netAmount) * 100, 2) : 0,
    total_amount: totalAmount ?? 0,
    total_kwh: totalKwh ?? meter.kwh_consumed,
    daily_average_kwh:
      totalKwh && supplyDays ? roundDecimal(totalKwh / supplyDays, 2) : 0,
    co2_tonnes: co2Tonnes,
    meters,
  };
}

function extractEngieGasMeter(text: string): ExtractedMeterReading | undefined {
  const supply = matchText(
    text,
    /Supply to:\s+(.+?)\s+Consumption Information/i,
  );
  const block = matchText(
    text,
    /Consumption Information\s+MPRN\s+Serial No\.\s+Previous Read Previous Read Date Current Read Current Read Date Metered Units Unit Measure Correction Factor Calorific Value Energy Consumed\s+(.+?)\s+Reading Key:/i,
  );

  if (!block) return undefined;

  const meterMatch = block.match(
    /(\d{6,10})\s+([A-Z0-9]+)\s+([\d,]+(?:\.\d+)?)\s+[A-Z]+\s+\d{2}\/\d{2}\/\d{4}\s+([\d,]+(?:\.\d+)?)\s+[A-Z]+\s+\d{2}\/\d{2}\/\d{4}\s+([\d,]+(?:\.\d+)?)\s+.+?\s+([\d.]+)\s+([\d.]+)\s+([\d,]+(?:\.\d+)?)\s*kWh/i,
  );

  if (!meterMatch) return undefined;

  const energyCharge = moneyAfter(text, /Total Consumption Charges/i) ?? 0;
  const otherCharges = moneyAfter(text, /Total Other Charges and Adjustments/i) ?? 0;
  const cclCharge = moneyAfter(text, /Total Climate Change Levy/i) ?? 0;
  const subtotal = moneyAfter(text, /Total Charges Excluding VAT/i) ?? 0;
  const unitRate = parseNumber(
    text.match(/Flexible Product Charge\s+.+?\s+([\d.]+)\s+p\/kWh/i)?.[1],
  );
  const cclRate = parseNumber(
    text.match(/Climate Change Levy\s+0\.00%\s+.+?\s+([\d.]+)\s+p\/kWh/i)?.[1],
  );

  return {
    meter_location: supply || "",
    meter_reference: meterMatch[1],
    serial_number: meterMatch[2],
    previous_reading: parseNumber(meterMatch[3]) ?? 0,
    current_reading: parseNumber(meterMatch[4]) ?? 0,
    units_consumed: parseNumber(meterMatch[5]) ?? 0,
    kwh_consumed: parseNumber(meterMatch[8]) ?? 0,
    energy_charge: energyCharge,
    standing_charge: otherCharges,
    ccl_charge: cclCharge,
    subtotal,
    unit_rate_pence: unitRate ?? 0,
    standing_rate_pence: 0,
    ccl_rate_pence: cclRate ?? 0,
    gas_calorific_value: parseNumber(meterMatch[7]) ?? undefined,
    gas_correction_factor: parseNumber(meterMatch[6]) ?? undefined,
  };
}

function normaliseInvoiceText(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/Â£/g, "£")
    .replace(/\s+/g, " ");
}

function matchText(text: string, regex: RegExp) {
  return text.match(regex)?.[1]?.trim() ?? null;
}

function moneyAfter(text: string, label: RegExp) {
  const source = label.source;
  return parseNumber(text.match(new RegExp(`${source}\\s+£?\\s*([\\d,]+\\.\\d{2})`, "i"))?.[1]);
}

function numberAfter(text: string, label: RegExp) {
  const source = label.source;
  return parseNumber(text.match(new RegExp(`${source}\\s+([\\d,]+(?:\\.\\d+)?)`, "i"))?.[1]);
}

function parseNumber(value?: string | null) {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDate(value?: string | null) {
  if (!value) return "";
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

function daysInclusive(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

function roundMoney(value: number) {
  return roundDecimal(value, 2);
}

function roundDecimal(value: number, places: number) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

// ─── Parse AI Response ──────────────────────────────────────────────

function parseExtractionResponse(
  raw: string,
  errors: string[],
): ExtractedInvoice | undefined {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed = JSON.parse(cleaned);
    return parsed as ExtractedInvoice;
  } catch {
    errors.push("Failed to parse JSON from AI response");
    // Try to extract JSON from within the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as ExtractedInvoice;
      } catch {
        errors.push("Failed to extract JSON even with fallback regex");
      }
    }
    return undefined;
  }
}

// ─── Validation & Confidence Scoring ────────────────────────────────

function validateExtraction(
  invoice: ExtractedInvoice,
  warnings: string[],
): number {
  let score = 100;

  // Required fields check
  const required = [
    "supplier_name",
    "invoice_number",
    "total_amount",
    "energy_type",
  ] as const;
  for (const field of required) {
    if (!invoice[field]) {
      warnings.push(`Missing required field: ${field}`);
      score -= 15;
    }
  }

  // Must have at least one meter
  if (!invoice.meters || invoice.meters.length === 0) {
    warnings.push("No meter readings extracted");
    score -= 25;
  }

  // Cross-check: meter subtotals should sum to net amount
  if (invoice.meters?.length && invoice.net_amount) {
    const meterSum = invoice.meters.reduce((s, m) => s + (m.subtotal || 0), 0);
    const diff = Math.abs(meterSum - invoice.net_amount);
    if (diff > 1) {
      // Allow £1 rounding tolerance
      warnings.push(
        `Meter subtotals (${meterSum.toFixed(2)}) don't match net amount (${invoice.net_amount.toFixed(2)})`,
      );
      score -= 10;
    }
  }

  // Cross-check: net + VAT should equal total
  if (invoice.net_amount && invoice.vat_amount && invoice.total_amount) {
    const expected = invoice.net_amount + invoice.vat_amount;
    const diff = Math.abs(expected - invoice.total_amount);
    if (diff > 0.02) {
      warnings.push(
        `Net (${invoice.net_amount}) + VAT (${invoice.vat_amount}) = ${expected.toFixed(2)}, but total is ${invoice.total_amount}`,
      );
      score -= 10;
    }
  }

  // Cross-check: meter kWh should sum to total_kwh
  if (invoice.meters?.length && invoice.total_kwh) {
    const meterKwh = invoice.meters.reduce(
      (s, m) => s + (m.kwh_consumed || 0),
      0,
    );
    const diff = Math.abs(meterKwh - invoice.total_kwh);
    if (diff > 10) {
      warnings.push(
        `Meter kWh sum (${meterKwh}) doesn't match total (${invoice.total_kwh})`,
      );
      score -= 5;
    }
  }

  // Check dates are valid ISO
  for (const dateField of [
    "invoice_date",
    "due_date",
    "supply_period_start",
    "supply_period_end",
  ] as const) {
    const val = invoice[dateField];
    if (val && isNaN(new Date(val).getTime())) {
      warnings.push(`Invalid date for ${dateField}: ${val}`);
      score -= 5;
    }
  }

  return Math.max(0, Math.min(100, score));
}
