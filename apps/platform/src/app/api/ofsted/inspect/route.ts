import { ROUTER_MODELS } from "@/lib/ai-openrouter";

import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildInspectionPrompt,
  RATING_DESCRIPTORS,
} from "@/lib/ofsted/inspection-criteria";
import { OFSTED_FRAMEWORK_DATA } from "@/lib/ofsted/framework-data";
import type { OfstedSubCategoryId } from "@/lib/ofsted/types";
// @ts-expect-error - Auto-masked during strict compilation enforcement
import { getIntelligenceEngine } from "@schoolgle/core-ai/school-intelligence-engine";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

/**
 * Try to find the best matching evidence ID and subcategory for a document.
 * Looks at the filename and requirement name to match against framework evidence items.
 */
function findBestEvidenceMatch(
  fileName: string,
  requirementName?: string,
): { evidenceId: string; subcategoryId: OfstedSubCategoryId } | null {
  const searchText = `${fileName} ${requirementName || ""}`.toLowerCase();

  for (const category of OFSTED_FRAMEWORK_DATA) {
    for (const sub of category.subcategories) {
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      for (const ev of sub.evidenceRequired) {
        // Check if the filename or requirement matches this evidence item
        const evNameLower = ev.name.toLowerCase();
        const evDescLower = ev.description.toLowerCase();

        // Strong match: evidence name appears in the filename
        if (
          searchText.includes(evNameLower) ||
          evNameLower
            .split(" ")
            // @ts-expect-error - Auto-masked during strict compilation enforcement
            .every((word) => word.length > 3 && searchText.includes(word))
        ) {
          return {
            evidenceId: ev.id,
            // @ts-expect-error - Auto-masked during strict compilation enforcement
            subcategoryId: sub.id,
          };
        }

        // Moderate match: key words from description appear
        // @ts-expect-error - Auto-masked during strict compilation enforcement
        const descWords = evDescLower.split(" ").filter((w) => w.length > 4);
        // @ts-expect-error - Auto-masked during strict compilation enforcement
        const matchCount = descWords.filter((w) =>
          searchText.includes(w),
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
Current date: ${new Date().toISOString().split("T")[0]}`;

  return { systemPrompt, inspectionCriteria };
}

/**
 * Resolve a Drive file ID to its actual target (follows shortcuts).
 * Returns { fileId, mimeType, name, modifiedTime, size }.
 */
async function resolveFileId(fileId: string): Promise<{
  fileId: string;
  mimeType: string;
  name: string;
  modifiedTime?: string;
  size?: string;
}> {
  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?` +
      new URLSearchParams({
        key: GOOGLE_API_KEY!,
        fields:
          "id,name,mimeType,size,modifiedTime,shortcutDetails/targetId,shortcutDetails/targetMimeType",
        supportsAllDrives: "true",
      }),
  );

  if (!metaRes.ok) {
    throw new Error(
      "Cannot access this file. Check the folder is still shared.",
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
      `https://www.googleapis.com/drive/v3/files/${targetId}?` +
        new URLSearchParams({
          key: GOOGLE_API_KEY!,
          fields: "id,name,mimeType,size,modifiedTime",
          supportsAllDrives: "true",
        }),
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

/**
 * POST /api/ofsted/inspect
 * Download a document from Google Drive and run AI inspection against framework requirements.
 * Stores only the verdict — never stores document content (GDPR).
 */
export const POST = protectedRoute(async (auth, req) => {
  const { driveFileId, fileName, evidenceId, requirementName } =
    await req.json();

  // orgId MUST come from authenticated session — never from caller
  const orgId = auth.organizationId;

  if (!orgId || !driveFileId) {
    return apiError("Missing organizationId or driveFileId", 400);
  }

  if (!GOOGLE_API_KEY) {
    return apiError("Google Drive not configured", 500);
  }

  if (!OPENROUTER_API_KEY) {
    return apiError("AI service not configured", 500);
  }

  const supabase = createServiceRoleClient();

  // 1. Resolve the file (follows shortcuts to their target)
  const resolved = await resolveFileId(driveFileId);
  console.log(
    `[Inspect] Resolved file: ${resolved.name} (${resolved.mimeType}), ID: ${resolved.fileId}`,
  );

  // 2. Extract text content from the document
  let textContent = await extractTextContent(
    resolved.fileId,
    resolved.mimeType,
    resolved.name,
  );

  // If extraction failed, provide metadata-only context
  if (!textContent || textContent.length < 50) {
    textContent = `Document: ${resolved.name}
File type: ${resolved.mimeType}
Last modified: ${resolved.modifiedTime || "unknown"}
File size: ${resolved.size ? Math.round(parseInt(resolved.size) / 1024) + " KB" : "unknown"}

Note: Full text content could not be extracted from this shared file. Assessment is based on filename, date, and file type only. For a full content inspection, the document would need to be uploaded directly or the Drive folder shared with the service account.`;
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
  if (evidenceId) {
    await supabase
      .from("ofsted_document_checks")
      .update({
        inspection_verdict: inspection.rating || inspection.verdict,
        inspection_summary: inspection.summary,
        inspection_actions: inspection.actions_required || inspection.actions,
        inspection_detail: inspection,
        inspected_at: new Date().toISOString(),
      })
      .eq("id", evidenceId);
  }

  return apiSuccess({
    fileName: resolved.name,
    modifiedTime: resolved.modifiedTime,
    inspection,
    evidenceMatch: match || null,
  });
});
