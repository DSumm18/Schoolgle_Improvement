/* eslint-disable @typescript-eslint/no-explicit-any */
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import OpenAI from "openai";
import { generateMinutesContent, renderMinutesHtml } from "@/lib/meetings";
import type { OrganizationBranding } from "@/lib/meetings";
import {
  getMeetingDocumentRecipient,
  mapMeetingTemplateToDocumentModule,
} from "@/lib/meetings/meeting-document-linking";

const MEETING_MINUTES_MODEL = "openai/gpt-4o-mini";

interface OrganizationSettings {
  logo_url?: string | null;
  trust_logo_url?: string | null;
  primary_color?: string | null;
  footer_text?: string | null;
}

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://schoolgle.co.uk",
      "X-Title": "Schoolgle Meeting Companion",
    },
  });
}

/**
 * Extract meeting ID from the URL pathname.
 * URL pattern: /api/meetings/[id]/minutes
 */
function getMeetingId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/");
  // ["", "api", "meetings", "<id>", "minutes"]
  return segments[3];
}

function buildOrganizationBranding(
  organization: {
    name?: string | null;
    organization_type?: string | null;
    settings?: OrganizationSettings | null;
  } | null,
): OrganizationBranding {
  const settings = organization?.settings || {};
  const isTrustLevel =
    organization?.organization_type === "trust" ||
    organization?.organization_type === "local_authority";

  return {
    logo_url:
      (isTrustLevel ? settings.trust_logo_url || settings.logo_url : settings.logo_url) ||
      null,
    school_name: organization?.name || "Meeting Companion",
    school_address: null,
    primary_color: settings.primary_color || null,
    footer_text: settings.footer_text || null,
  };
}

/**
 * GET /api/meetings/[id]/minutes
 * Get minutes for a meeting
 */
export const GET = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  // orgId MUST come from authenticated session — never from caller
  const organizationId = auth.organizationId;

  if (!organizationId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  const [minutesRes, signaturesRes] = await Promise.all([
    supabase
      .from("meeting_minutes")
      .select("*")
      .eq("meeting_id", id)
      .maybeSingle(),
    supabase
      .from("meeting_signatures")
      .select("*")
      .eq("meeting_id", id)
      .order("signed_at"),
  ]);

  if (minutesRes.error) {
    console.error("Error fetching minutes:", minutesRes.error);
    return apiError("Failed to fetch minutes", 500);
  }

  return apiSuccess({
    minutes: minutesRes.data,
    signatures: signaturesRes.data || [],
  });
});

/**
 * POST /api/meetings/[id]/minutes
 * Generate minutes from meeting data
 */
export const POST = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  await request.json().catch(() => ({}));
  // orgId MUST come from authenticated session — never from caller
  const resolvedOrgId = auth.organizationId;

  if (!resolvedOrgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  // Fetch meeting, template, checklist, and organisation branding
  const [meetingRes, checklistRes, organizationRes] = await Promise.all([
    supabase
      .from("meetings")
      .select("*")
      .eq("id", id)
      .eq("organization_id", resolvedOrgId)
      .single(),
    supabase
      .from("meeting_checklist_items")
      .select("*")
      .eq("meeting_id", id)
      .order("order_index"),
    supabase
      .from("organizations")
      .select("name, organization_type, settings")
      .eq("id", resolvedOrgId)
      .single(),
  ]);

  if (meetingRes.error || !meetingRes.data) {
    return apiError("Meeting not found", 404);
  }

  const meeting = meetingRes.data;
  const branding = buildOrganizationBranding(organizationRes.data);

  const [{ data: template }, { data: attendees }] = await Promise.all([
    supabase
      .from("meeting_templates")
      .select("*")
      .eq("id", meeting.template_id)
      .single(),
    supabase.from("meeting_attendees").select("*").eq("meeting_id", id),
  ]);

  if (!template) {
    return apiError("Template not found", 404);
  }

  // Check if we have a transcript (from Deepgram recording)
  const { data: transcript } = await supabase
    .from("meeting_transcripts")
    .select("*")
    .eq("meeting_id", id)
    .maybeSingle();

  let content;
  let html;

  if (transcript?.full_text) {
    // AI-powered minutes from diarised transcript
    const aiResult = await generateAiMinutes(
      meeting,
      template,
      checklistRes.data || [],
      transcript.full_text,
      branding,
    );
    content = aiResult.content;
    html = aiResult.html;
  } else {
    // Template-based minutes (free tier fallback)
    content = generateMinutesContent(
      meeting,
      template,
      checklistRes.data || [],
    );
    html = renderMinutesHtml(content, branding);
  }

  // Check if minutes already exist for this meeting
  const { data: existing } = await supabase
    .from("meeting_minutes")
    .select("id")
    .eq("meeting_id", id)
    .maybeSingle();

  let minutes;
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("meeting_minutes")
      .update({
        content,
        html,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) {
      console.error("Error updating minutes:", error);
      return apiError("Failed to update minutes", 500);
    }
    minutes = data;
  } else {
    // Create new
    const { data, error } = await supabase
      .from("meeting_minutes")
      .insert({ meeting_id: id, content, html, status: "draft" })
      .select()
      .single();
    if (error) {
      console.error("Error creating minutes:", error);
      return apiError("Failed to create minutes", 500);
    }
    minutes = data;
  }

  await upsertMinutesGeneratedDocument(supabase, {
    organizationId: resolvedOrgId,
    userId: auth.userId,
    meeting,
    template,
    attendees: attendees || [],
    minutesHtml: html,
  });

  return apiSuccess({ minutes }, 201);
});

async function ensureMeetingMinutesTemplate(
  supabase: any,
  documentModule: string,
): Promise<string | null> {
  const slug = "meeting-minutes-record";

  const { data: existing } = await supabase
    .from("document_templates")
    .select("id")
    .eq("slug", slug)
    .eq("module", documentModule)
    .is("organization_id", null)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("document_templates")
    .insert({
      organization_id: null,
      name: "Meeting Minutes Record",
      slug,
      description:
        "System template used to store meeting minutes generated from Meeting Companion.",
      module: documentModule,
      category: "meeting_record",
      document_type: "minutes",
      subject_template: "Minutes: {{meeting_title}}",
      body_template: "{{minutes_html}}",
      available_placeholders: ["meeting_title", "minutes_html"],
      data_sources: ["meeting_companion"],
      is_system: true,
      tags: ["meeting", "minutes", "evidence"],
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error ensuring meeting minutes document template:", error);
    return null;
  }

  return created?.id || null;
}

async function upsertMinutesGeneratedDocument(
  supabase: any,
  input: {
    organizationId: string;
    userId: string;
    meeting: any;
    template: any;
    attendees: any[];
    minutesHtml: string;
  },
) {
  const documentModule = mapMeetingTemplateToDocumentModule(input.template);
  const templateId = await ensureMeetingMinutesTemplate(
    supabase,
    documentModule,
  );
  if (!templateId) return;

  const recipient = getMeetingDocumentRecipient({
    meeting: input.meeting,
    attendees: input.attendees,
  });

  const documentRow = {
    organization_id: input.organizationId,
    template_id: templateId,
    module: documentModule,
    document_type: "minutes",
    subject: `Minutes: ${input.template.name}`,
    body_html: input.minutesHtml,
    placeholder_values: {
      meeting_id: input.meeting.id,
      meeting_title: input.template.name,
    },
    recipient_type: recipient.recipient_type,
    recipient_id: recipient.recipient_id,
    recipient_name: recipient.recipient_name,
    recipient_email: recipient.recipient_email,
    context_type: "meeting",
    context_id: input.meeting.id,
    status: "draft",
    created_by: input.userId,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("generated_documents")
    .select("id")
    .eq("organization_id", input.organizationId)
    .eq("context_type", "meeting")
    .eq("context_id", input.meeting.id)
    .eq("document_type", "minutes")
    .maybeSingle();

  const { error } = existing?.id
    ? await supabase
        .from("generated_documents")
        .update(documentRow)
        .eq("id", existing.id)
    : await supabase.from("generated_documents").insert(documentRow);

  if (error) {
    console.error("Error linking meeting minutes to generated documents:", error);
  }
}

/**
 * Generate AI-powered minutes from a diarised transcript.
 */
async function generateAiMinutes(
  meeting: any,
  template: any,
  checklistItems: any[],
  transcriptText: string,
  branding: OrganizationBranding,
): Promise<{ content: any; html: string }> {
  const openrouter = getOpenRouterClient();
  if (!openrouter) {
    const fallbackContent = generateMinutesContent(
      meeting,
      template,
      checklistItems,
    );
    return {
      content: fallbackContent,
      html: renderMinutesHtml(fallbackContent, branding),
    };
  }

  const checkedItems = checklistItems.filter((i) => i.manually_ticked);
  const uncheckedItems = checklistItems.filter((i) => !i.manually_ticked);
  const criticalMissed = uncheckedItems.filter((i) => i.is_critical);

  const prompt = `You are a professional meeting minute-taker for UK schools. Generate formal meeting minutes from the transcript below.

MEETING DETAILS:
- Type: ${template.name}
- Date: ${meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleDateString("en-GB") : "Unknown"}
- Location: ${meeting.location || "Not specified"}
- Attendee: ${meeting.attendee_name}${meeting.attendee_role ? ` (${meeting.attendee_role})` : ""}
- Purpose: ${meeting.purpose || template.description}

COMPLIANCE CHECKLIST (items that SHOULD have been covered):
Covered: ${checkedItems.map((i) => `- ${i.phrase} [${i.category}]`).join("\n") || "None"}
Not covered: ${uncheckedItems.map((i) => `- ${i.phrase} [${i.category}]${i.is_critical ? " **CRITICAL**" : ""}`).join("\n") || "All covered"}

TRANSCRIPT (with speaker diarisation):
${transcriptText}

INSTRUCTIONS:
1. Write formal, professional meeting minutes suitable for an HR file
2. Use proper UK English spelling and terminology
3. Structure with clear sections: Opening, Discussion Points (grouped by topic), Actions Agreed, Closing
4. Attribute statements to speakers where appropriate (use "Meeting Leader" and "${meeting.attendee_name}" instead of "Speaker 0/1")
5. Note which compliance items were covered in the discussion
6. Flag any critical compliance items that were NOT addressed
7. Include a compliance summary at the end
8. Keep the tone neutral, factual, and professional
9. Do NOT fabricate content — only include what was actually discussed

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "title": "Minutes: ${template.name}",
  "date": "${meeting.scheduled_at ? new Date(meeting.scheduled_at).toLocaleDateString("en-GB") : ""}",
  "location": ${JSON.stringify(meeting.location || null)},
  "leader": "Meeting Leader",
  "attendee": "${meeting.attendee_name}",
  "attendee_role": ${JSON.stringify(meeting.attendee_role || null)},
  "purpose": ${JSON.stringify(meeting.purpose || template.description)},
  "opening": ["<opening paragraph summarising how the meeting began>"],
  "sections": [
    {
      "title": "<section title>",
      "items": [
        { "phrase": "<key point or compliance item>", "covered": true, "notes": "<what was discussed>" }
      ]
    }
  ],
  "notes": ["<any additional notes or observations>"],
  "closing": ["<closing paragraph summarising agreed next steps>"],
  "compliance_summary": {
    "total": ${checklistItems.length},
    "covered": ${checkedItems.length},
    "score": ${checklistItems.length > 0 ? Math.round((checkedItems.length / checklistItems.length) * 100) : 100}
  }
}`;

  const completion = await openrouter.chat.completions.create({
    model: MEETING_MINUTES_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const raw = completion.choices?.[0]?.message?.content || "";

  let content;
  try {
    // Strip any markdown code fences if present
    const cleaned = raw
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    content = JSON.parse(cleaned);
  } catch {
    // Fallback: wrap the raw text as a simple minutes structure
    content = {
      title: `Minutes: ${template.name}`,
      date: meeting.scheduled_at
        ? new Date(meeting.scheduled_at).toLocaleDateString("en-GB")
        : "",
      location: meeting.location || null,
      leader: "Meeting Leader",
      attendee: meeting.attendee_name,
      attendee_role: meeting.attendee_role || null,
      purpose: meeting.purpose || template.description,
      opening: ["Meeting opened. AI transcript summary follows."],
      sections: [
        {
          title: "AI Transcript Summary",
          items: [
            {
              phrase: "Full transcript summary",
              covered: true,
              notes: raw.slice(0, 2000),
            },
          ],
        },
      ],
      notes: [],
      closing: ["Meeting concluded."],
      compliance_summary: {
        total: checklistItems.length,
        covered: checkedItems.length,
        score:
          checklistItems.length > 0
            ? Math.round((checkedItems.length / checklistItems.length) * 100)
            : 100,
      },
    };
  }

  // Add critical missed items warning if any
  if (criticalMissed.length > 0) {
    content.notes = content.notes || [];
    content.notes.push(
      `WARNING: ${criticalMissed.length} critical compliance item(s) were not addressed: ${criticalMissed.map((i) => i.phrase).join("; ")}`,
    );
  }

  const html = renderMinutesHtml(content, branding);
  return { content, html };
}

/**
 * PATCH /api/meetings/[id]/minutes
 * Update minutes (edit content, finalise)
 */
export const PATCH = protectedRoute(async (auth, request) => {
  const id = getMeetingId(request);
  const body = await request.json();
  const { content, html, status: minutesStatus } = body;

  // orgId MUST come from authenticated session — never from caller
  const resolvedOrgId = auth.organizationId;

  if (!resolvedOrgId) {
    return apiError("Missing organizationId", 400);
  }

  const supabase = createServiceRoleClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (content !== undefined) updates.content = content;
  if (html !== undefined) updates.html = html;
  if (minutesStatus !== undefined) updates.status = minutesStatus;

  const { data: minutes, error } = await supabase
    .from("meeting_minutes")
    .update(updates)
    .eq("meeting_id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating minutes:", error);
    return apiError("Failed to update minutes", 500);
  }

  return apiSuccess({ minutes });
});
