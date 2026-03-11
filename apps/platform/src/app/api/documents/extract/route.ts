/**
 * Document Extraction API
 *
 * POST /api/documents/extract
 * Accepts document text (or raw file), auto-detects document type,
 * runs regex extraction + cross-checks, and creates an extracted_data
 * record in the data validation pipeline.
 *
 * Request body:
 *   { text: string, documentType?: string, fileName?: string }
 *
 * If regex extraction yields low confidence (<60%), builds an AI prompt
 * and calls OpenRouter for AI-assisted extraction.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  EXTRACTION_SCHEMAS,
  detectDocumentType,
  extractFields,
  runCrossChecks,
  buildExtractionPrompt,
  parseAIResponse,
  type DocumentType,
} from "@/lib/document-extractor";
import OpenAI from "openai";

const AI_CONFIDENCE_THRESHOLD = 60;

async function aiExtract(
  text: string,
  schema: (typeof EXTRACTION_SCHEMAS)[DocumentType],
) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const openai = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://schoolgle.co.uk",
      "X-Title": "Schoolgle",
    },
  });

  const prompt = buildExtractionPrompt(text, schema);

  try {
    const response = await openai.chat.completions.create({
      model: "google/gemini-2.0-flash-001",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    return {
      result: parseAIResponse(content, schema),
      model: "google/gemini-2.0-flash-001",
      usage: response.usage,
    };
  } catch (err) {
    console.error("[documents/extract] AI extraction failed:", err);
    return null;
  }
}

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;
  const supabase = createServiceRoleClient();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body", 400, "PARSE_ERROR");
  }

  const { text, documentType, fileName } = body;

  if (!text || typeof text !== "string" || text.trim().length < 20) {
    return apiError(
      "text is required and must be at least 20 characters",
      400,
      "VALIDATION_ERROR",
    );
  }

  // 1. Detect or validate document type
  const detectedType: DocumentType =
    documentType && documentType in EXTRACTION_SCHEMAS
      ? (documentType as DocumentType)
      : detectDocumentType(text);

  const schema = EXTRACTION_SCHEMAS[detectedType];

  // 2. Run regex extraction
  let extraction = extractFields(text, schema);
  let extractionModel = "regex";

  // 3. If low confidence, try AI extraction
  if (extraction.overallConfidence < AI_CONFIDENCE_THRESHOLD) {
    const aiResult = await aiExtract(text, schema);
    if (
      aiResult &&
      aiResult.result.overallConfidence > extraction.overallConfidence
    ) {
      extraction = aiResult.result;
      extractionModel = aiResult.model;
    }
  }

  // 4. Run cross-checks
  const crossChecks = runCrossChecks(extraction.fields, schema);

  // 5. Detect anomalies
  const anomalies: string[] = [];
  for (const cc of crossChecks) {
    if (!cc.pass) anomalies.push(cc.message);
  }
  // Flag missing required fields
  for (const fieldDef of schema.fields) {
    if (
      fieldDef.required &&
      (extraction.fields[fieldDef.name] === null ||
        extraction.fields[fieldDef.name] === undefined)
    ) {
      anomalies.push(`Missing required field: ${fieldDef.name}`);
    }
  }

  // 6. Build extracted_fields array for DB (matches existing UI expectations)
  const extractedFieldsArray = schema.fields.map((f) => ({
    name: f.name,
    value:
      extraction.fields[f.name] !== null &&
      extraction.fields[f.name] !== undefined
        ? String(extraction.fields[f.name])
        : "",
    confidence: extraction.confidence[f.name] ?? 0,
    type: f.type,
    required: f.required,
    description: f.description,
  }));

  const crossChecksArray = crossChecks.map((cc) => ({
    label: cc.name.replace(/_/g, " "),
    matched: cc.pass,
    detail: cc.message,
  }));

  // 7. Insert into extracted_data
  const { data: extracted, error: insertError } = await supabase
    .from("extracted_data")
    .insert({
      organization_id: organizationId,
      document_name: fileName || `Uploaded ${detectedType.replace(/_/g, " ")}`,
      document_type: detectedType,
      extraction_model: extractionModel,
      extracted_fields: extractedFieldsArray,
      cross_checks: crossChecksArray,
      overall_confidence: extraction.overallConfidence,
      anomalies_detected: anomalies,
      target_modules: schema.targetModules,
      status: "pending_review",
    })
    .select()
    .single();

  if (insertError) {
    console.error("[documents/extract] Insert error:", insertError);
    return apiError("Failed to save extraction result", 500);
  }

  // 8. Log auto_extracted action
  await supabase.from("data_validation_log").insert({
    extracted_data_id: extracted.id,
    organization_id: organizationId,
    action: "auto_extracted",
    user_id: userId,
    details: {
      extraction_model: extractionModel,
      overall_confidence: extraction.overallConfidence,
      document_type: detectedType,
      cross_checks_passed: crossChecks.filter((c) => c.pass).length,
      cross_checks_failed: crossChecks.filter((c) => !c.pass).length,
      anomaly_count: anomalies.length,
    },
  });

  // 9. Log cross-check results
  for (const cc of crossChecks) {
    await supabase.from("data_validation_log").insert({
      extracted_data_id: extracted.id,
      organization_id: organizationId,
      action: cc.pass ? "cross_check_passed" : "cross_check_failed",
      user_id: userId,
      details: { check_name: cc.name, message: cc.message },
    });
  }

  return apiSuccess(
    {
      id: extracted.id,
      document_type: detectedType,
      extraction_model: extractionModel,
      fields: extraction.fields,
      confidence: extraction.confidence,
      overall_confidence: extraction.overallConfidence,
      cross_checks: crossChecksArray,
      anomalies,
      target_modules: schema.targetModules,
      status: "pending_review",
    },
    201,
  );
});
