import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { generateMinutesContent, renderMinutesHtml } from "@/lib/meetings";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://schoolgle.co.uk",
    "X-Title": "Schoolgle Meeting Companion",
  },
});

/**
 * GET /api/meetings/[id]/minutes
 * Get minutes for a meeting
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: minutes, error } = await supabase
      .from("meeting_minutes")
      .select("*")
      .eq("meeting_id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching minutes:", error);
      return NextResponse.json(
        { error: "Failed to fetch minutes" },
        { status: 500 },
      );
    }

    return NextResponse.json({ minutes });
  } catch (error: any) {
    console.error("Minutes fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/meetings/[id]/minutes
 * Generate minutes from meeting data
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch meeting, template, and checklist
    const [meetingRes, checklistRes] = await Promise.all([
      supabase
        .from("meetings")
        .select("*")
        .eq("id", id)
        .eq("organization_id", organizationId)
        .single(),
      supabase
        .from("meeting_checklist_items")
        .select("*")
        .eq("meeting_id", id)
        .order("order_index"),
    ]);

    if (meetingRes.error || !meetingRes.data) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const meeting = meetingRes.data;

    const { data: template } = await supabase
      .from("meeting_templates")
      .select("*")
      .eq("id", meeting.template_id)
      .single();

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
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
      html = renderMinutesHtml(content);
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
        return NextResponse.json(
          { error: "Failed to update minutes" },
          { status: 500 },
        );
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
        return NextResponse.json(
          { error: "Failed to create minutes" },
          { status: 500 },
        );
      }
      minutes = data;
    }

    return NextResponse.json({ minutes }, { status: 201 });
  } catch (error: any) {
    console.error("Minutes generation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
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
): Promise<{ content: any; html: string }> {
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
    model: "deepseek/deepseek-chat",
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

  const html = renderMinutesHtml(content);
  return { content, html };
}

/**
 * PATCH /api/meetings/[id]/minutes
 * Update minutes (edit content, finalise)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { organizationId, content, html, status: minutesStatus } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Missing organizationId" },
        { status: 400 },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      return NextResponse.json(
        { error: "Failed to update minutes" },
        { status: 500 },
      );
    }

    return NextResponse.json({ minutes });
  } catch (error: any) {
    console.error("Minutes update error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
