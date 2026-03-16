import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { LSPupil, LSSchemeMapping, LSSchemeProgression, LSTimetableSlot } from "@/types/lesson-studio";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
});

// Use Gemini Flash for lesson generation (good quality, low cost)
const MODEL_ID = "google/gemini-2.0-flash-001";

function decodeName(pupil: LSPupil): string {
  const enc = pupil.display_name_encrypted;
  if (enc?.startsWith("enc:")) return enc.slice(4);
  return pupil.pupil_ref;
}

function buildClassProfile(pupils: LSPupil[]): string {
  const gds = pupils.filter((p) => p.attainment_maths === "GDS" || p.attainment_reading === "GDS");
  const exs = pupils.filter((p) => !gds.includes(p) && (p.attainment_maths === "EXS" || p.attainment_reading === "EXS"));
  const wts = pupils.filter((p) => !gds.includes(p) && !exs.includes(p));

  const lines: string[] = [
    `CLASS PROFILE (${pupils.length} pupils):`,
    `- Greater Depth: ${gds.map(decodeName).join(", ") || "None"} (${gds.length} pupils)`,
    `- Expected Standard: ${exs.map(decodeName).join(", ") || "None"} (${exs.length} pupils)`,
    `- Working Towards: ${wts.map(decodeName).join(", ") || "None"} (${wts.length} pupils)`,
    "",
    "SEND/ADDITIONAL NEEDS:",
  ];

  for (const p of pupils) {
    const needs: string[] = [];
    if (p.has_ehcp) needs.push(`EHCP-${p.send_primary_need || "SEN"}`);
    else if (p.has_send_support) needs.push(`SEN Support-${p.send_primary_need || "SEN"}`);
    if (p.accessibility_needs?.length) needs.push(p.accessibility_needs.join(", "));
    if (p.is_eal) needs.push(`EAL Stage ${p.eal_stage || "?"}`);
    if (p.is_pupil_premium) needs.push("Pupil Premium");
    if (p.is_looked_after) needs.push("LAC");
    if (needs.length) lines.push(`${decodeName(p)}: ${needs.join("; ")}`);
  }

  return lines.join("\n");
}

function buildPrompt(params: {
  subject: string;
  yearGroup: string;
  keyStage: string;
  schemeName: string | null;
  schemeStep: string | null;
  unitName: string | null;
  methodologyNotes: string | null;
  startTime: string;
  endTime: string;
  classProfile: string;
  teacherNote: string | null;
}): string {
  return `You are an expert UK primary school teacher creating a lesson plan.

CONTEXT:
- Subject: ${params.subject}
- Year group: ${params.yearGroup}
- Key Stage: ${params.keyStage}
${params.schemeName ? `- Scheme of work: ${params.schemeName}` : ""}
${params.schemeStep ? `- Current position: ${params.schemeStep}` : ""}
${params.unitName ? `- Unit: ${params.unitName}` : ""}
${params.methodologyNotes ? `- Methodology: ${params.methodologyNotes}` : ""}
- Duration: ${params.startTime} to ${params.endTime}

${params.classProfile}

${params.teacherNote ? `TEACHER NOTE FOR THIS LESSON:\n${params.teacherNote}\n` : ""}

Return ONLY valid JSON with this exact structure:
{
  "title": "Lesson title",
  "objective": "Learning objective text",
  "successCriteria": ["I can...", "I can...", "I can..."],
  "vocabulary": [{"word": "...", "definition": "..."}],
  "priorLearning": "Summary of what should have been taught before this",
  "planSections": [
    {"phase": "Starter", "time": "5 min", "description": "Detailed activity", "icon": "zap"},
    {"phase": "Teach", "time": "10 min", "description": "...", "icon": "book-open"},
    {"phase": "Practice", "time": "20 min", "description": "...", "icon": "pencil"},
    {"phase": "Plenary", "time": "5 min", "description": "...", "icon": "target"}
  ],
  "differentiationGroups": [
    {"name": "Deeper", "pupils": "Named pupils from class", "description": "Task", "resourceNotes": "Blue pack"},
    {"name": "Core", "pupils": "...", "description": "...", "resourceNotes": "Green pack"},
    {"name": "Scaffold", "pupils": "...", "description": "...", "resourceNotes": "Yellow pack"},
    {"name": "Guided", "pupils": "...", "description": "TA-supported", "resourceNotes": "Red pack"}
  ],
  "sendAdaptations": [
    {"pupilName": "Name", "adaptation": "Specific adaptation for this pupil"}
  ],
  "worksheetQuestions": {
    "deeper": [{"q": "...", "type": "open", "marks": 3}],
    "core": [{"q": "...", "type": "fill", "parts": ["..."], "marks": 2}],
    "scaffold": [{"q": "...", "type": "fill", "parts": ["..."], "hint": "...", "marks": 1}],
    "guided": [{"q": "...", "type": "yesno", "marks": 1}]
  },
  "exitTicket": [
    {"q": "...", "type": "open", "marks": 2},
    {"q": "... (stretch)", "type": "open", "marks": 1}
  ],
  "quiz": [
    {"q": "...", "options": ["A","B","C","D"], "correct": 0, "topic": "...", "nc": "Y4-F1"}
  ],
  "starterQuestions": [
    {"q": "...", "age": "Yesterday", "interval": "1d", "nc": "Y4-D2"}
  ],
  "supplyBrief": "Human-readable summary for a supply teacher covering this lesson."
}`;
}

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const body = await req.json();
  const { classId, slotId, weekCommencing, teacherNote } = body as {
    classId: string;
    slotId: string;
    weekCommencing: string;
    teacherNote?: string;
  };

  if (!classId || !slotId || !weekCommencing) {
    return apiError("classId, slotId, weekCommencing required", 400);
  }

  const startTime = performance.now();

  // Load class, slot, pupils, scheme mapping in parallel
  const [classRes, slotRes, pupilsRes, schemesRes] = await Promise.all([
    supabase.from("ls_classes").select("*").eq("id", classId).single(),
    supabase.from("ls_timetable_slots").select("*").eq("id", slotId).single(),
    supabase.from("ls_pupils").select("*").eq("class_id", classId).order("display_name_encrypted"),
    supabase.from("ls_scheme_mappings").select("*").eq("class_id", classId),
  ]);

  if (classRes.error || !classRes.data) return apiError("Class not found", 404);
  if (slotRes.error || !slotRes.data) return apiError("Slot not found", 404);

  const cls = classRes.data;
  const slot = slotRes.data as LSTimetableSlot;
  const pupils = (pupilsRes.data ?? []) as LSPupil[];
  const schemes = (schemesRes.data ?? []) as LSSchemeMapping[];

  const schemeMapping = schemes.find((s) => s.subject === slot.subject);
  let progression: LSSchemeProgression | null = null;
  let schemeStep: string | null = null;
  let unitName: string | null = null;
  let methodologyNotes: string | null = null;

  if (schemeMapping) {
    unitName = schemeMapping.scheme_config?.current_unit ?? null;
    const stepNum = schemeMapping.scheme_config?.current_step ?? 1;

    // Load progression
    const { data: prog } = await supabase
      .from("ls_scheme_progressions")
      .select("*")
      .eq("scheme_name", schemeMapping.scheme_name)
      .eq("subject", slot.subject)
      .eq("year_group", cls.year_group)
      .maybeSingle();

    if (prog) {
      progression = prog as LSSchemeProgression;
      const step = progression.steps?.[stepNum - 1];
      if (step) schemeStep = `${unitName} — Step ${stepNum}: ${step.title}`;
      methodologyNotes = progression.methodology_notes;
    }
  }

  const classProfile = buildClassProfile(pupils);

  const prompt = buildPrompt({
    subject: slot.subject,
    yearGroup: cls.year_group,
    keyStage: cls.key_stage,
    schemeName: schemeMapping?.scheme_name ?? null,
    schemeStep,
    unitName,
    methodologyNotes,
    startTime: slot.start_time,
    endTime: slot.end_time,
    classProfile,
    teacherNote: teacherNote ?? null,
  });

  // Call AI
  const completion = await openai.chat.completions.create({
    model: MODEL_ID,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4000,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let generated: Record<string, unknown>;
  try {
    generated = JSON.parse(raw);
  } catch {
    return apiError("AI returned invalid JSON", 502);
  }

  const generationTimeMs = Math.round(performance.now() - startTime);

  // Build lesson plan row
  const plan = {
    organization_id: orgId,
    timetable_slot_id: slotId,
    class_id: classId,
    teacher_user_id: auth.userId,
    week_commencing: weekCommencing,
    day_of_week: slot.day_of_week,
    subject: slot.subject,
    unit_name: unitName,
    scheme_name: schemeMapping?.scheme_name ?? null,
    scheme_step: schemeStep,
    title: (generated.title as string) || `${slot.subject} Lesson`,
    learning_objective: (generated.objective as string) || "",
    success_criteria: generated.successCriteria ?? [],
    key_vocabulary: generated.vocabulary ?? [],
    prior_learning_summary: (generated.priorLearning as string) || null,
    plan_sections: generated.planSections ?? [],
    differentiation_groups: generated.differentiationGroups ?? [],
    send_adaptations: generated.sendAdaptations ?? [],
    nc_objective_codes: progression?.steps?.[(schemeMapping?.scheme_config?.current_step ?? 1) - 1]?.nc_codes ?? [],
    supply_brief: (generated.supplyBrief as string) || null,
    generated_resources_json: {
      worksheetQuestions: generated.worksheetQuestions ?? {},
      exitTicket: generated.exitTicket ?? [],
      quiz: generated.quiz ?? [],
      starterQuestions: generated.starterQuestions ?? [],
    },
    status: "draft",
    ai_model: MODEL_ID,
    generation_time_ms: generationTimeMs,
  };

  const { data: saved, error: saveError } = await supabase
    .from("ls_lesson_plans")
    .upsert(plan, { onConflict: "class_id,week_commencing,day_of_week,subject" })
    .select()
    .single();

  if (saveError) return apiError(saveError.message, 500);
  return apiSuccess(saved);
});
