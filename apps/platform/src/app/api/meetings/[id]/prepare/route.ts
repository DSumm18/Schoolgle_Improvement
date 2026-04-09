import { ROUTER_MODELS } from "@/lib/ai-openrouter";

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import OpenAI from "openai";

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://schoolgle.co.uk",
    "X-Title": "Schoolgle Meeting Companion",
  },
});

/**
 * Extract meeting ID from the URL pathname.
 * URL pattern: /api/meetings/[id]/prepare
 */
function getMeetingId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // ["", "api", "meetings", "<id>", "prepare"]
  return segments[3];
}

/**
 * POST /api/meetings/[id]/prepare
 * Upload documents and get AI-powered meeting preparation
 */
export const POST = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const formData = await request.formData();
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch meeting and template
  const { data: meeting, error: meetingError } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (meetingError || !meeting) {
    return apiError("Meeting not found", 404);
  }

  const { data: template } = await supabase
    .from("meeting_templates")
    .select("*")
    .eq("id", meeting.template_id)
    .single();

  if (!template) {
    return apiError("Template not found", 404);
  }

  // Extract text from uploaded files
  const files = formData.getAll("files") as File[];
  const extractedTexts: { filename: string; text: string }[] = [];

  for (const file of files) {
    const text = await extractFileText(file);
    if (text) {
      extractedTexts.push({ filename: file.name, text });
    }
  }

  if (extractedTexts.length === 0) {
    return apiError("No text could be extracted from uploaded documents", 400);
  }

  // Get checklist items for context
  const { data: checklistItems } = await supabase
    .from("meeting_checklist_items")
    .select("*")
    .eq("meeting_id", id)
    .order("order_index");

  // AI analysis
  const prepData = await analyzeDocuments(
    extractedTexts,
    meeting,
    template,
    checklistItems || [],
  );

  // Store prep data on the meeting
  await supabase
    .from("meetings")
    .update({
      prep_context: prepData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return apiSuccess({ preparation: prepData });
});

/**
 * GET /api/meetings/[id]/prepare
 * Get existing preparation data
 */
export const GET = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const { searchParams } = new URL(request.url);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();
  const { data: meeting } = await supabase
    .from("meetings")
    .select("prep_context")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  return apiSuccess({
    preparation: meeting?.prep_context || null,
  });
});

async function extractFileText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase();

  try {
    if (ext === "txt" || ext === "csv") {
      return buffer.toString("utf-8");
    }

    if (ext === "docx") {
      // Use mammoth for DOCX extraction
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
      } catch {
        return buffer.toString("utf-8");
      }
    }

    if (ext === "pdf") {
      // Simple PDF text extraction - try pdf2json
      try {
        // Fallback: return a note that PDF was uploaded
        return `[PDF document: ${file.name} - ${Math.round(file.size / 1024)}KB]`;
      } catch {
        return "";
      }
    }

    // Default: try as text
    return buffer.toString("utf-8");
  } catch {
    return "";
  }
}

async function analyzeDocuments(
  documents: { filename: string; text: string }[],
  meeting: any,
  template: any,
  checklistItems: any[],
): Promise<any> {
  const docTexts = documents
    .map((d) => `--- ${d.filename} ---\n${d.text.slice(0, 3000)}`)
    .join("\n\n");

  const checklistPhrases = checklistItems
    .map(
      (i) =>
        `- "${i.phrase}" [${i.category}]${i.is_critical ? " (CRITICAL)" : ""}`,
    )
    .join("\n");

  const prompt = `You are an HR meeting preparation assistant for UK schools. Analyse the uploaded documents and prepare a meeting briefing.

MEETING TYPE: ${template.name}
MEETING DESCRIPTION: ${template.description}
ATTENDEE: ${meeting.attendee_name}${meeting.attendee_role ? ` (${meeting.attendee_role})` : ""}
DATE: ${meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleDateString("en-GB") : "Not set"}

COMPLIANCE CHECKLIST (items that must be covered):
${checklistPhrases}

UPLOADED DOCUMENTS:
${docTexts}

INSTRUCTIONS:
1. Extract all relevant facts from the documents (absence dates, days off, OH recommendations, dates of letters, etc.)
2. Identify which placeholder values in the checklist can be filled in (e.g., "[X days]" → "12 days", "[date]" → "3rd March 2026", "[X]" → "1")
3. Flag any concerns or things the meeting leader should be aware of
4. Suggest any additional context that would be helpful during the meeting

Return ONLY valid JSON (no markdown, no code fences):
{
  "summary": "<2-3 sentence summary of the key facts from the documents>",
  "extracted_facts": [
    { "label": "<fact label>", "value": "<extracted value>", "source": "<filename>" }
  ],
  "placeholder_replacements": {
    "[placeholder]": "replacement value"
  },
  "concerns": ["<any concerns or warnings for the meeting leader>"],
  "context_notes": ["<additional context that would help during the meeting>"],
  "suggested_opening": "<optional: a personalised opening statement incorporating the facts>"
}`;

  try {
    const completion = await openrouter.chat.completions.create({
      model: ROUTER_MODELS.DEFAULT,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("AI analysis failed:", error);
    // Return basic extraction without AI
    return {
      summary: `Documents uploaded for ${template.name} meeting with ${meeting.attendee_name}.`,
      extracted_facts: documents.map((d) => ({
        label: "Document",
        value: d.filename,
        source: d.filename,
      })),
      placeholder_replacements: {},
      concerns: [],
      context_notes: [
        "AI analysis was unavailable. Please review the uploaded documents manually.",
      ],
    };
  }
}
