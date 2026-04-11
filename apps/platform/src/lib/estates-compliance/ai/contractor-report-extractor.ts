/**
 * Contractor Report Extractor
 *
 * Uses Gemini 2.5 Flash to extract structured data from contractor service
 * reports, inspection certificates, and maintenance documentation.
 *
 * The flow:
 *  1. Contractor completes annual boiler service, sends a PDF
 *  2. School uploads PDF against a compliance check
 *  3. This module extracts: contractor name, service date, assets serviced
 *     (with findings per asset), next service due, costs, certificate refs
 *  4. Caller matches extracted assets against the asset register
 *  5. Caller updates each asset's maintenance_history, last_inspection_date,
 *     next_inspection_due; creates tickets for failed assets
 *
 * Human-in-the-loop: never writes directly — returns a proposal for the user
 * to review and approve.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExtractedAssetFinding {
  /** Best-effort asset identifier from the report (may be name, code, or serial) */
  identifier: string;
  /** Make/manufacturer if mentioned */
  manufacturer?: string | null;
  /** Model if mentioned */
  model?: string | null;
  /** Serial number if on the report */
  serial_number?: string | null;
  /** Physical location mentioned (room, plant room, etc.) */
  location?: string | null;
  /** Did this specific asset pass the service/inspection? */
  result: "pass" | "fail" | "advisory" | "not_assessed";
  /** Summary of findings for this asset */
  findings: string;
  /** Any remedial actions the contractor recommends */
  remedial_actions?: string[];
  /** Estimated cost for remedial work if quoted */
  remedial_cost_estimate?: number | null;
  /** How urgent is the remedial work */
  urgency?: "emergency" | "urgent" | "routine" | null;
  /**
   * Per-asset invoice line item cost if the invoice breaks it down.
   * When present, this is the authoritative allocation for this asset
   * (allocation_method = invoice_line_item).
   */
  line_item_cost?: number | null;
  /** Confidence this extraction is correct (0-1) */
  confidence: number;
}

export interface ExtractedContractorReport {
  /** Contractor company name from the letterhead/footer */
  contractor_name?: string | null;
  /** Engineer name who carried out the work */
  engineer_name?: string | null;
  /** Date the service was carried out */
  service_date?: string | null;
  /** Service type — e.g. "Annual boiler service", "PAT test", "Fire alarm inspection" */
  service_type?: string | null;
  /** Compliance domain (legionella, fire, electrical, gas, etc.) */
  compliance_domain?: string | null;
  /** Certificate or invoice reference number */
  certificate_reference?: string | null;
  /** Total cost of the service */
  total_cost?: number | null;
  /** Currency (default GBP) */
  currency?: string;
  /** Next service due date */
  next_service_due?: string | null;
  /** Individual asset findings from the report */
  assets: ExtractedAssetFinding[];
  /** Overall summary of the report */
  overall_summary: string;
  /** Raw extracted notes for user review */
  raw_notes?: string;
  /** Confidence in the overall extraction (0-1) */
  confidence: number;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert at reading UK school compliance reports and contractor service documentation.

Your job is to extract structured data from a contractor's service report so it can be matched to the school's asset register and compliance tracking system.

Extract ONLY what is explicitly stated in the report. Do not invent data. If a field is not present, return null.

Focus on:
1. Who carried out the work (contractor company + engineer name if given)
2. When the work was done (service_date)
3. What type of service (e.g. "Annual Gas Safety Inspection", "Legionella Risk Assessment Review", "Fire Alarm Test", "PAT Testing")
4. Which compliance domain it relates to (gas, fire, electrical, legionella, asbestos, water, mechanical, lifts, playground, accessibility, security)
5. Each asset that was serviced — these are individual pieces of equipment. A single report may cover multiple assets (e.g. 3 boilers, 24 portable appliances, 15 fire extinguishers). For EACH asset extract:
   - An identifier (name, code, serial, or location)
   - Make/model if shown
   - Serial number if shown
   - Location (plant room, classroom, etc.)
   - PASS/FAIL/ADVISORY result
   - Findings text (the contractor's notes for that asset)
   - Remedial actions needed
   - Estimated remedial cost if quoted
   - Urgency of remedial work
   - **line_item_cost**: if the invoice breaks down the cost per asset (e.g. "Boiler 1 service £285, Boiler 2 service £285"), extract that number for EACH asset. If the invoice gives only a total without per-asset lines, leave line_item_cost null — the system will split the total equally.
6. Certificate or invoice reference number
7. Total cost
8. Next service due date

Return ONLY valid JSON matching this schema (no prose, no markdown fences):
{
  "contractor_name": string | null,
  "engineer_name": string | null,
  "service_date": "YYYY-MM-DD" | null,
  "service_type": string | null,
  "compliance_domain": string | null,
  "certificate_reference": string | null,
  "total_cost": number | null,
  "currency": "GBP",
  "next_service_due": "YYYY-MM-DD" | null,
  "assets": [
    {
      "identifier": string,
      "manufacturer": string | null,
      "model": string | null,
      "serial_number": string | null,
      "location": string | null,
      "result": "pass" | "fail" | "advisory" | "not_assessed",
      "findings": string,
      "remedial_actions": string[],
      "remedial_cost_estimate": number | null,
      "urgency": "emergency" | "urgent" | "routine" | null,
      "line_item_cost": number | null,
      "confidence": number
    }
  ],
  "overall_summary": string,
  "raw_notes": string,
  "confidence": number
}

If the report only covers a single asset, still return it as a single-item array. If no assets can be identified, return an empty array.`;

// ---------------------------------------------------------------------------
// Core extraction function
// ---------------------------------------------------------------------------

/**
 * Extract structured data from a contractor report.
 *
 * @param fileBase64 - Base64-encoded file data (with or without data URL prefix)
 * @param mimeType - MIME type of the file (e.g. "application/pdf", "image/jpeg")
 * @returns Structured extraction result
 */
export async function extractContractorReport(
  fileBase64: string,
  mimeType: string,
): Promise<ExtractedContractorReport> {
  const apiKey = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "placeholder_david_will_replace") {
    throw new Error(
      "GOOGLE_AI_API_KEY is not configured. Set it in .env.local.",
    );
  }

  // Strip data URL prefix if present
  const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");

  if (!base64Data || base64Data.length < 50) {
    throw new Error("Invalid file data provided.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
  ]);

  const response = result.response;
  const text = response.text();

  let parsed: ExtractedContractorReport;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    // Gemini occasionally wraps JSON in markdown — strip and retry
    const cleaned = text.replace(/```(?:json)?\s*/g, "").replace(/```\s*$/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  // Normalise defaults
  parsed.currency = parsed.currency || "GBP";
  parsed.assets = Array.isArray(parsed.assets) ? parsed.assets : [];
  for (const asset of parsed.assets) {
    asset.result = asset.result || "not_assessed";
    asset.remedial_actions = asset.remedial_actions || [];
    asset.confidence = typeof asset.confidence === "number" ? asset.confidence : 0.5;
  }
  parsed.confidence =
    typeof parsed.confidence === "number" ? parsed.confidence : 0.5;

  return parsed;
}
