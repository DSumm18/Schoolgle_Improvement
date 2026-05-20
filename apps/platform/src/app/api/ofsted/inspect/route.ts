import { ROUTER_MODELS } from "@/lib/ai-openrouter";

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { extractTextFromDriveFile } from "@/lib/drive-document-text";
import {
  getGoogleReauthoriseMessage,
  getValidGoogleAccessToken,
} from "@/lib/google-oauth-tokens";
import {
  buildInspectionPrompt,
  RATING_DESCRIPTORS,
} from "@/lib/ofsted/inspection-criteria";
import {
  buildDocumentInspectionFindingDraft,
  buildDocumentInspectionFindingSourceKey,
  type DocumentInspectionDetail,
} from "@/lib/ofsted-readiness/findings";
import { OFSTED_FRAMEWORK_DATA } from "@/lib/ofsted/framework-data";
import type { OfstedSubCategoryId } from "@/lib/ofsted/types";
import { getIntelligenceEngine } from "@/lib/school-intelligence-engine";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function buildDriveApiUrl(
  path: string,
  params: Record<string, string>,
  accessToken?: string | null,
) {
  const search = new URLSearchParams(params);
  if (!accessToken && GOOGLE_API_KEY) search.set("key", GOOGLE_API_KEY);
  return `https://www.googleapis.com/drive/v3/${path}?${search}`;
}

function buildDriveRequestInit(
  accessToken?: string | null,
): RequestInit | undefined {
  return accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : undefined;
}

/**
 * Try to find the best matching evidence ID and subcategory for a document.
 * Looks at the filename and requirement name to match against framework evidence items.
 */
function findBestEvidenceMatch(
  fileName: string,
  requirementName?: string,
): { evidenceId: string; subcategoryId: OfstedSubCategoryId } | null {
  void requirementName;
  const fileText = fileName.toLowerCase();

  for (const category of OFSTED_FRAMEWORK_DATA) {
    for (const sub of category.subcategories) {
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      for (const ev of sub.evidenceRequired) {
        // Check if the filename or requirement matches this evidence item
        const evNameLower = ev.name.toLowerCase();
        const evDescLower = ev.description.toLowerCase();

        // Strong match: evidence name appears in the filename
        const evidenceNameWords = evNameLower
          .split(" ")
          .filter((word: string) => word.length > 3);

        if (
          fileText.includes(evNameLower) ||
          (evidenceNameWords.length > 0 &&
            evidenceNameWords.every((word: string) => fileText.includes(word)))
        ) {
          return {
            evidenceId: ev.id,
            // @ts-expect-error - Auto-masked during strict compilation enforcement
            subcategoryId: sub.id,
          };
        }

        // Moderate match: key words from description appear
        const descWords = evDescLower
          .split(" ")
          .filter((word: string) => word.length > 4);
        const matchCount = descWords.filter((word: string) =>
          fileText.includes(word),
        ).length;
        if (matchCount >= 2 && matchCount >= descWords.length * 0.5) {
          return {
            evidenceId: ev.id,
            // @ts-expect-error - Auto-masked during strict compilation enforcement
            subcategoryId: sub.id,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Build a default inspection prompt when no specific evidence rule matches.
 * Still uses the Ofsted 5-point rating scale for consistency.
 */
function buildDefaultPrompt(): {
  systemPrompt: string;
  inspectionCriteria: string;
} {
  const systemPrompt = `You are an expert UK school inspector with deep knowledge of the Ofsted Education Inspection Framework (EIF) 2025, all relevant UK education legislation, and statutory guidance.

Your task is to inspect a school document and provide a professional judgement using the Ofsted 5-point rating scale.

RATING SCALE (use exactly these values):
- "exceptional" (5): ${RATING_DESCRIPTORS.exceptional.description}
- "strong_standard" (4): ${RATING_DESCRIPTORS.strong_standard.description}
- "expected_standard" (3): ${RATING_DESCRIPTORS.expected_standard.description}
- "needs_attention" (2): ${RATING_DESCRIPTORS.needs_attention.description}
- "urgent_improvement" (1): ${RATING_DESCRIPTORS.urgent_improvement.description}

Use school-friendly wording. The headline should help leaders quickly see whether the evidence is compliant, needs attention, or is a serious risk. Reserve "urgent_improvement" for a clear statutory failure, safeguarding risk, or serious non-negotiable concern; if evidence is simply thin, incomplete, or too brief, use "needs_attention".

You MUST respond in JSON format with this exact structure:
{
  "rating": "exceptional" | "strong_standard" | "expected_standard" | "needs_attention" | "urgent_improvement",
  "confidence": "high" | "medium" | "low",
  "summary": "One clear sentence explaining the overall judgement",
  "date_check": {
    "review_date_found": true/false,
    "is_current": true/false,
    "date_found": "the date string or null",
    "note": "explanation"
  },
  "legislation_check": {
    "references_current": true/false,
    "legislation_found": ["list of legislation referenced in the document"],
    "missing_references": ["list of key legislation NOT referenced that should be"]
  },
  "checkpoint_results": [
    {
      "checkpoint": "What was checked",
      "met": true/false,
      "evidence": "Quote or specific explanation",
      "severity": "critical" | "important" | "minor"
    }
  ],
  "red_flags": ["Any red flags found"],
  "strengths": ["Specific strengths identified"],
  "actions_required": [
    {
      "action": "Specific action the school must take",
      "priority": "urgent" | "high" | "medium" | "low",
      "rationale": "Why this action is needed",
      "sef_impact": "How fixing this feeds into the SEF"
    }
  ],
  "sef_contribution": "How this document contributes to the school's Self-Evaluation"
}`;

  const inspectionCriteria = `GENERAL INSPECTION CRITERIA:
1. Is the document dated with a review date within the current academic year (Sept 2025 - Aug 2026)?
2. Does it reference current UK legislation and DfE statutory guidance?
3. Is it well-structured with clear procedures and responsibilities?
4. Does it describe roles, responsibilities and accountabilities?
5. Does it include monitoring and evaluation arrangements?
6. Are there any significant gaps, outdated references, or compliance concerns?
7. Would an Ofsted inspector be satisfied with this document as evidence?

Current academic year: 2025-2026
Current date: ${new Date().toISOString().split("T")[0]}
Keep the summary concise and non-alarmist unless there is a genuine urgent risk.`;

  return { systemPrompt, inspectionCriteria };
}

/**
 * Resolve a Drive file ID to its actual target (follows shortcuts).
 * Returns { fileId, mimeType, name, modifiedTime, size }.
 */
async function resolveFileId(
  fileId: string,
  accessToken?: string | null,
): Promise<{
  fileId: string;
  mimeType: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}> {
  const metaRes = await fetch(
    buildDriveApiUrl(
      `files/${fileId}`,
      {
        fields:
          "id,name,mimeType,size,modifiedTime,shortcutDetails/targetId,shortcutDetails/targetMimeType",
        supportsAllDrives: "true",
      },
      accessToken,
    ),
    buildDriveRequestInit(accessToken),
  );

  if (!metaRes.ok) {
    const body = await metaRes.text().catch(() => "");
    throw new Error(
      `Cannot access this file. Check the folder is still shared. ${body}`,
    );
  }

  const meta = await metaRes.json();

  // If it's a shortcut, resolve to the target
  if (
    meta.mimeType === "application/vnd.google-apps.shortcut" &&
    meta.shortcutDetails?.targetId
  ) {
    const targetId = meta.shortcutDetails.targetId;
    console.log(`[Inspect] Resolving shortcut ${fileId} → target ${targetId}`);

    // Get the target file's metadata
    const targetMetaRes = await fetch(
      buildDriveApiUrl(
        `files/${targetId}`,
        {
          fields: "id,name,mimeType,size,modifiedTime",
          supportsAllDrives: "true",
        },
        accessToken,
      ),
      buildDriveRequestInit(accessToken),
    );

    if (!targetMetaRes.ok) {
      throw new Error(
        "Cannot access the target of this shortcut. The original file may have been moved or deleted.",
      );
    }

    const targetMeta = await targetMetaRes.json();
    return {
      fileId: targetId,
      mimeType: targetMeta.mimeType,
      name: targetMeta.name || meta.name,
      modifiedTime: targetMeta.modifiedTime,
      size: targetMeta.size,
    };
  }

  return {
    fileId: meta.id,
    mimeType: meta.mimeType,
    name: meta.name,
    modifiedTime: meta.modifiedTime,
    size: meta.size,
  };
}

/**
 * Extract text content from a Google Drive file.
 * Handles Google Docs (export), PDFs (download + AI vision), DOCX, and other types.
 */
async function extractTextContent(
  fileId: string,
  mimeType: string,
  fileName: string,
): Promise<string> {
  // Google Docs — export as plain text
  if (mimeType === "application/vnd.google-apps.document") {
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY!,
          mimeType: "text/plain",
        }),
    );
    if (exportRes.ok) {
      return await exportRes.text();
    }
  }

  // Google Sheets — export as CSV (basic text extraction)
  if (mimeType === "application/vnd.google-apps.spreadsheet") {
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY!,
          mimeType: "text/csv",
        }),
    );
    if (exportRes.ok) {
      return await exportRes.text();
    }
  }

  // Google Slides — export as plain text
  if (mimeType === "application/vnd.google-apps.presentation") {
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY!,
          mimeType: "text/plain",
        }),
    );
    if (exportRes.ok) {
      return await exportRes.text();
    }
  }

  // PDF — download raw bytes, use Gemini Flash vision to extract text
  if (mimeType === "application/pdf") {
    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`,
    );

    if (downloadRes.ok) {
      const buffer = await downloadRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const sizeMB = buffer.byteLength / (1024 * 1024);

      console.log(
        `[Inspect] Downloaded PDF ${fileName}: ${sizeMB.toFixed(1)}MB, sending to Gemini Flash for text extraction`,
      );

      // Use Gemini Flash vision to extract text from the PDF
      const visionRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://schoolgle.co.uk",
            "X-Title": "Schoolgle Document Reader",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract ALL text content from this PDF document. Return the full text as-is, preserving structure (headings, bullet points, paragraphs). Do not summarize — return the complete text content.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:application/pdf;base64,${base64}`,
                    },
                  },
                ],
              },
            ],
            temperature: 0,
            max_tokens: 8000,
          }),
        },
      );

      if (visionRes.ok) {
        const visionData = await visionRes.json();
        const extractedText = visionData.choices?.[0]?.message?.content || "";
        if (extractedText.length > 50) {
          console.log(
            `[Inspect] Extracted ${extractedText.length} chars from PDF via Gemini Flash`,
          );
          return extractedText;
        }
      } else {
        const errText = await visionRes.text();
        console.error("[Inspect] Gemini Flash vision error:", errText);
      }
    }
  }

  // DOCX — download and try to extract
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const downloadRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`,
    );

    if (downloadRes.ok) {
      const buffer = await downloadRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Use Gemini Flash to extract text from DOCX
      const visionRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://schoolgle.co.uk",
            "X-Title": "Schoolgle Document Reader",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract ALL text content from this document. Return the full text as-is, preserving structure. Do not summarize.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64}`,
                    },
                  },
                ],
              },
            ],
            temperature: 0,
            max_tokens: 8000,
          }),
        },
      );

      if (visionRes.ok) {
        const visionData = await visionRes.json();
        const extractedText = visionData.choices?.[0]?.message?.content || "";
        if (extractedText.length > 50) {
          return extractedText;
        }
      }
    }
  }

  // Fallback — return empty string (caller will handle)
  return "";
}

void extractTextContent;

async function getActiveGoogleDriveAccessToken(
  supabase: ReturnType<typeof createServiceRoleClient>,
  organizationId: string,
): Promise<string | null> {
  const { data: connection, error } = await supabase
    .from("school_data_connections")
    .select(
      "id,access_token_encrypted,refresh_token_encrypted,token_expiry,is_active,provider",
    )
    .eq("organization_id", organizationId)
    .eq("provider", "google")
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!connection) return null;

  try {
    return await getValidGoogleAccessToken({ supabase, connection });
  } catch (error) {
    console.error("[Inspect] Google Drive token error:", error);
    throw new Error(getGoogleReauthoriseMessage());
  }
}

/**
 * POST /api/ofsted/inspect
 * Download a document from Google Drive and run AI inspection against framework requirements.
 * Stores only the verdict — never stores document content (GDPR).
 */
export const POST = protectedRoute(async (auth, req) => {
  const { driveFileId, evidenceId, requirementName } = await req.json();

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !driveFileId) {
    return apiError("Missing organizationId or driveFileId", 400);
  }

  if (!OPENROUTER_API_KEY) {
    return apiError("AI service not configured", 500);
  }

  const supabase = createServiceRoleClient();
  const accessToken = await getActiveGoogleDriveAccessToken(supabase, orgId);

  if (!accessToken && !GOOGLE_API_KEY) {
    return apiError("Google Drive connection needs re-authorising", 401);
  }

  // 1. Resolve the file (follows shortcuts to their target)
  const resolved = await resolveFileId(driveFileId, accessToken);
  console.log(
    `[Inspect] Resolved file: ${resolved.name} (${resolved.mimeType}), ID: ${resolved.fileId}`,
  );

  // 2. Extract text content from the document
  const extraction = await extractTextFromDriveFile({
    fileId: resolved.fileId,
    mimeType: resolved.mimeType,
    fileName: resolved.name,
    accessToken,
    apiKey: GOOGLE_API_KEY,
  });

  let textContent = extraction.text;
  const extractedTextLength = textContent.length;
  let usedMetadataOnly = false;

  // If extraction failed, provide metadata-only context
  if (!textContent || textContent.length < 50) {
    usedMetadataOnly = true;
    textContent = `Document: ${resolved.name}
File type: ${resolved.mimeType}
Last modified: ${resolved.modifiedTime || "unknown"}
File size: ${resolved.size ? Math.round(parseInt(resolved.size) / 1024) + " KB" : "unknown"}

Note: Full text content could not be extracted from this connected Drive file. Assessment is based on filename, date, and file type only. Check the file type, Drive permissions, or whether the document is image-only.`;
  }

  // Truncate to avoid token limits (keep first ~12000 chars for thorough inspection)
  const truncatedContent =
    textContent.length > 12000
      ? textContent.substring(0, 12000) +
        "\n\n[... document truncated for analysis ...]"
      : textContent;

  // 3. Find the best matching evidence rule from the knowledge base
  const match = findBestEvidenceMatch(resolved.name, requirementName);
  let promptData: { systemPrompt: string; inspectionCriteria: string };

  if (match) {
    const built = buildInspectionPrompt(match.evidenceId, match.subcategoryId);
    promptData = built || buildDefaultPrompt();
    console.log(
      `[Inspect] Using knowledge base: evidence=${match.evidenceId}, subcategory=${match.subcategoryId}`,
    );
  } else {
    promptData = buildDefaultPrompt();
    console.log(
      `[Inspect] No specific knowledge base match for "${resolved.name}", using default criteria`,
    );
  }

  // 4. Build school context from Intelligence Engine (DfE data, demographics, contextual factors)
  let schoolContext = "";
  try {
    // Look up the organization to find URN
    const { data: orgData } = await supabase
      .from("organizations")
      .select("urn")
      .eq("id", orgId)
      .single();

    if (orgData?.urn) {
      const engine = getIntelligenceEngine();
      schoolContext = await engine.buildInspectionContext(orgId, orgData.urn);
      console.log(
        `[Inspect] School context loaded (${schoolContext.length} chars)`,
      );
    }
  } catch (err) {
    console.warn("[Inspect] Could not load school context:", err);
  }

  const schoolContextBlock = schoolContext
    ? `\n\n--- SCHOOL CONTEXT (DfE Data & Cross-Module Intelligence) ---\n${schoolContext}\n--- END SCHOOL CONTEXT ---\n\nUse this context to inform your assessment. For example:\n- If SEN% is high, assess whether the document adequately addresses SEND provision\n- If FSM% is high, consider value-added context when assessing outcomes\n- If there are active contextual factors (staff absence, curriculum change), note their relevance\n- If cross-module alerts exist (SCR gaps, overdue training), flag if this document should address them`
    : "";

  // 5. Send to AI for deep inspection using the knowledge base
  const aiResponse = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://schoolgle.co.uk",
        "X-Title": "Schoolgle Ofsted Inspector",
      },
      body: JSON.stringify({
        model: ROUTER_MODELS.DEFAULT,
        messages: [
          {
            role: "system",
            content: promptData.systemPrompt,
          },
          {
            role: "user",
            content: `${promptData.inspectionCriteria}

Document name: ${resolved.name}
Last modified: ${resolved.modifiedTime || "unknown"}
Current date: ${new Date().toISOString().split("T")[0]}
Current academic year: 2025-2026
${schoolContextBlock}

--- DOCUMENT CONTENT ---
${truncatedContent}
--- END ---

Inspect this document thoroughly against every checkpoint. Provide your professional judgement in JSON format.`,
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    },
  );

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    console.error("[Inspect] AI error:", errText);
    return apiError("AI inspection service unavailable", 502);
  }

  const aiData = await aiResponse.json();
  const aiContent = aiData.choices?.[0]?.message?.content || "";

  // Parse AI JSON response
  let inspection;
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    inspection = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    console.error("[Inspect] Failed to parse AI response:", aiContent);
    inspection = {
      rating: "needs_attention",
      confidence: "low",
      summary: "AI inspection could not be completed — manual review required",
      checkpoint_results: [],
      red_flags: [],
      strengths: [],
      actions_required: [
        {
          action: "Manual review of this document is required",
          priority: "high",
          rationale: "AI inspection failed to produce a valid assessment",
          sef_impact: "Cannot contribute to SEF until reviewed",
        },
      ],
      sef_contribution: "Pending manual review",
    };
  }

  if (!inspection) {
    inspection = {
      rating: "needs_attention",
      confidence: "low",
      summary: "AI inspection could not be completed — manual review required",
      checkpoint_results: [],
      red_flags: [],
      strengths: [],
      actions_required: [
        {
          action: "Manual review of this document is required",
          priority: "high",
          rationale: "AI inspection did not return a readable judgement",
          sef_impact: "Cannot contribute to SEF until reviewed",
        },
      ],
      sef_contribution: "Pending manual review",
    };
  }

  // Normalise: map old "verdict" format to new "rating" format for backwards compatibility
  if (inspection && !inspection.rating && inspection.verdict) {
    const verdictToRating: Record<string, string> = {
      meets_requirements: "strong_standard",
      partially_meets: "expected_standard",
      does_not_meet: "needs_attention",
      cannot_assess: "needs_attention",
    };
    inspection.rating =
      verdictToRating[inspection.verdict] || "needs_attention";
  }

  // Also normalise actions format
  if (inspection && !inspection.actions_required && inspection.actions) {
    inspection.actions_required = inspection.actions.map((a: string) => ({
      action: a,
      priority: "medium",
      rationale: "Identified during document inspection",
      sef_impact: "Should be addressed in the SEF",
    }));
  }

  // 5. Store the inspection result (verdict only, never document content — GDPR)
  const inspectionDetail = {
    ...inspection,
    extraction: {
      method: extraction.extractionMethod,
      limited: extraction.limited,
      extracted_text_length: extractedTextLength,
      used_metadata_only: usedMetadataOnly,
    },
  };

  if (evidenceId) {
    const { data: updatedCheck, error: updateError } = await supabase
      .from("ofsted_document_checks")
      .update({
        inspection_verdict: inspection.rating || inspection.verdict,
        inspection_summary: inspection.summary,
        inspection_actions: inspection.actions_required || inspection.actions,
        inspection_detail: inspectionDetail,
        inspected_at: new Date().toISOString(),
      })
      .eq("id", evidenceId)
      .eq("organization_id", orgId)
      .select(
        "id,evaluation_area,expected_document,found_filename,found_path,found_modified_at",
      )
      .maybeSingle();

    if (updateError) {
      console.error("[Inspect] Failed to store document check:", updateError);
    }

    if (updatedCheck) {
      await syncDocumentInspectionFinding({
        supabase,
        orgId,
        userId: auth.userId,
        check: updatedCheck,
        inspection: inspectionDetail,
      });
    }
  }

  return apiSuccess({
    fileName: resolved.name,
    modifiedTime: resolved.modifiedTime,
    inspection: inspectionDetail,
    extraction: inspectionDetail.extraction,
    evidenceMatch: match || null,
  });
});

async function syncDocumentInspectionFinding({
  supabase,
  orgId,
  userId,
  check,
  inspection,
}: {
  supabase: ReturnType<typeof createServiceRoleClient>;
  orgId: string;
  userId: string;
  check: {
    id: string;
    evaluation_area: string;
    expected_document: string;
    found_filename: string | null;
    found_path: string | null;
    found_modified_at: string | null;
  };
  inspection: DocumentInspectionDetail;
}) {
  if (!check.found_path || !check.found_filename) return;

  const sourceKey = buildDocumentInspectionFindingSourceKey(check.id);
  const draft = buildDocumentInspectionFindingDraft({
    checkId: check.id,
    driveFileId: check.found_path,
    fileName: check.found_filename,
    evaluationArea: check.evaluation_area,
    expectedDocument: check.expected_document,
    foundModifiedAt: check.found_modified_at,
    inspection,
  });

  try {
    if (!draft) {
      await supabase
        .from("ofsted_findings")
        .update({
          status: "verified",
          verification_status: "passed",
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", orgId)
        .eq("source_key", sourceKey)
        .is("assigned_task_id", null);
      return;
    }

    const now = new Date().toISOString();
    const row = {
      organization_id: orgId,
      source_key: draft.source_key,
      source_type: draft.source_type,
      source_scan_id: draft.source_scan_id,
      source_record_id: check.id,
      source_url: draft.evidence_url,
      framework_type: draft.framework_type,
      category_id: draft.category_id,
      subcategory_id: draft.subcategory_id,
      rule_key: draft.rule_key,
      rule_version: draft.rule_version,
      rule_source: draft.rule_source,
      title: draft.title,
      summary: draft.summary,
      finding_type: draft.finding_type,
      severity: draft.severity,
      action_level: draft.action_level,
      status: draft.status,
      score: draft.score,
      confidence: draft.confidence,
      evidence_url: draft.evidence_url,
      evidence_quotes: draft.evidence_quotes,
      gaps: draft.gaps,
      recommendations: draft.recommendations,
      red_flags: draft.red_flags,
      checklist: draft.checklist,
      recommended_task_title: draft.recommended_task_title,
      recommended_task_description: draft.recommended_task_description,
      verification_status: "not_requested",
      metadata: draft.metadata,
      updated_at: now,
    };

    const { data: finding, error } = await supabase
      .from("ofsted_findings")
      .upsert(row, { onConflict: "organization_id,source_key" })
      .select("id,status,source_type,source_key")
      .maybeSingle();

    if (error) {
      console.warn("[Inspect] Could not sync Ofsted finding:", error.message);
      return;
    }

    if (finding?.id) {
      await supabase.from("ofsted_finding_events").insert({
        organization_id: orgId,
        finding_id: finding.id,
        event_type: "document_inspection_upserted",
        actor_user_id: userId,
        new_status: finding.status,
        metadata: {
          source_type: finding.source_type,
          source_key: finding.source_key,
          document_check_id: check.id,
        },
      });
    }
  } catch (error) {
    console.warn("[Inspect] Ofsted finding sync skipped:", error);
  }
}
