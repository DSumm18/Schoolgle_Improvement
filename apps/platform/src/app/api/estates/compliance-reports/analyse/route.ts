/**
 * Compliance Report Analyse
 *
 * POST /api/estates/compliance-reports/analyse
 *
 * Accepts a contractor report (PDF or image) as multipart form data.
 * Runs Gemini extraction, matches findings against the asset register,
 * and returns a PROPOSAL for the user to review before any writes.
 *
 * Nothing is written until the user approves via /apply.
 *
 * Multipart fields:
 *   file            — the PDF or image file (required)
 *   check_id        — optional: compliance check this report relates to
 *   compliance_domain — optional: narrow matching (e.g. "gas")
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { extractContractorReport } from "@/lib/estates-compliance/ai/contractor-report-extractor";
import { matchAssets } from "@/lib/estates-compliance/ai/asset-matcher";
import { createServiceRoleClient } from "@/lib/supabase-server";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB for reports

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const { organizationId } = auth;

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const checkId = formData.get("check_id") as string | null;
  const complianceDomain = formData.get("compliance_domain") as string | null;

  if (!file) {
    return apiError("file is required", 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError(
      `File type "${file.type}" not supported. Accepted: PDF, JPEG, PNG, WebP.`,
      400,
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return apiError(
      `File too large (${Math.round(file.size / 1024 / 1024)}MB). Max 20MB.`,
      400,
    );
  }

  // 1. Read the file into base64
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  // 2. Upload the original file to storage so we can link it as evidence later
  const supabase = createServiceRoleClient();
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${organizationId}/reports/${timestamp}-${safeName}`;
  const bucket = file.type.startsWith("image/")
    ? "estates-images"
    : "estates-documents";

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return apiError(`Failed to upload file: ${uploadError.message}`, 500);
  }

  const { data: signed } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  // 3. Extract structured data from the report
  let extracted;
  try {
    extracted = await extractContractorReport(base64, file.type);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return apiError(`AI extraction failed: ${message}`, 500);
  }

  // 4. Match extracted assets against the organisation's asset register
  const matches = await matchAssets(organizationId, extracted.assets, {
    compliance_domain: complianceDomain ?? extracted.compliance_domain ?? undefined,
  });

  // 5. Compute summary actions for each matched asset
  const proposed_actions = matches.map((m) => {
    if (!m.best_match) {
      return {
        type: "no_match" as const,
        extracted: m.extracted,
        message: "Could not match this asset to the register. User may need to create it.",
      };
    }

    const action: {
      type: "update_asset" | "create_ticket" | "update_and_create_ticket";
      asset_id: string;
      asset_code: string | null;
      asset_name: string;
      extracted: typeof m.extracted;
      maintenance_history_entry: {
        date: string;
        action: string;
        performed_by: string;
        cost: number | null;
        notes: string;
      };
      new_next_inspection_due: string | null;
      new_last_inspection_date: string | null;
      should_create_ticket: boolean;
      ticket_draft?: {
        title: string;
        description: string;
        priority: "critical" | "high" | "medium" | "low";
        asset_id: string;
      };
    } = {
      type: m.extracted.result === "fail" ? "update_and_create_ticket" : "update_asset",
      asset_id: m.best_match.asset.id,
      asset_code: m.best_match.asset.code,
      asset_name: m.best_match.asset.name,
      extracted: m.extracted,
      maintenance_history_entry: {
        date: extracted.service_date || new Date().toISOString().split("T")[0],
        action: extracted.service_type || "Service",
        performed_by: extracted.contractor_name || "Unknown contractor",
        cost: m.extracted.remedial_cost_estimate ?? null,
        notes: m.extracted.findings,
      },
      new_next_inspection_due: extracted.next_service_due ?? null,
      new_last_inspection_date: extracted.service_date ?? null,
      should_create_ticket: m.extracted.result === "fail",
    };

    if (action.should_create_ticket) {
      action.ticket_draft = {
        title: `Remedial: ${m.best_match.asset.name} — ${extracted.service_type || "service"}`,
        description: [
          `Failed ${extracted.service_type || "service"} carried out by ${extracted.contractor_name || "contractor"} on ${extracted.service_date || "today"}.`,
          "",
          "Findings:",
          m.extracted.findings,
          "",
          ...(m.extracted.remedial_actions && m.extracted.remedial_actions.length > 0
            ? ["Remedial actions:", ...m.extracted.remedial_actions.map((a) => `- ${a}`)]
            : []),
          m.extracted.remedial_cost_estimate
            ? `\nEstimated cost: £${m.extracted.remedial_cost_estimate}`
            : "",
        ].join("\n"),
        priority:
          m.extracted.urgency === "emergency"
            ? "critical"
            : m.extracted.urgency === "urgent"
              ? "high"
              : "medium",
        asset_id: m.best_match.asset.id,
      };
    }

    return action;
  });

  const summary_counts = {
    total_assets_in_report: extracted.assets.length,
    matched: matches.filter((m) => m.best_match).length,
    unmatched: matches.filter((m) => !m.best_match).length,
    auto_match: matches.filter((m) => m.auto_match).length,
    pass: extracted.assets.filter((a) => a.result === "pass").length,
    fail: extracted.assets.filter((a) => a.result === "fail").length,
    advisory: extracted.assets.filter((a) => a.result === "advisory").length,
    tickets_to_create: proposed_actions.filter(
      (a) => "should_create_ticket" in a && a.should_create_ticket,
    ).length,
  };

  return apiSuccess({
    type: "proposal",
    message:
      "I've analysed this report. Please review the matched assets and proposed actions before I apply them.",
    extracted_report: extracted,
    file_reference: {
      bucket,
      path: storagePath,
      signed_url: signed?.signedUrl,
      size_bytes: file.size,
      mime_type: file.type,
      original_name: file.name,
    },
    check_id: checkId,
    matches,
    proposed_actions,
    summary_counts,
    extracted_at: new Date().toISOString(),
  });
});
