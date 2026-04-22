import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type {
  LSPupil,
  LSSchemeMapping,
  LSSchemeProgression,
  LSTimetableSlot,
} from "@/types/lesson-studio";
import { generateVisualisation } from "@/lib/lesson-studio/generate-visualisation";
import type { LessonIntent } from "@/lib/lesson-studio/extract-intent";

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

function buildClassProfile(
  pupils: LSPupil[],
  adaptationProfiles?: Record<string, Record<string, unknown>>,
): string {
  const gds = pupils.filter(
    (p) => p.attainment_maths === "GDS" || p.attainment_reading === "GDS",
  );
  const exs = pupils.filter(
    (p) =>
      !gds.includes(p) &&
      (p.attainment_maths === "EXS" || p.attainment_reading === "EXS"),
  );
  const wts = pupils.filter((p) => !gds.includes(p) && !exs.includes(p));

  const lines: string[] = [
    `CLASS PROFILE (${pupils.length} pupils):`,
    `- Greater Depth: ${gds.map(decodeName).join(", ") || "None"} (${gds.length} pupils)`,
    `- Expected Standard: ${exs.map(decodeName).join(", ") || "None"} (${exs.length} pupils)`,
    `- Working Towards: ${wts.map(decodeName).join(", ") || "None"} (${wts.length} pupils)`,
    "",
  ];

  // Build detailed per-pupil adaptation profiles
  lines.push("PUPIL ADAPTATION PROFILES:");
  lines.push(
    "(Generate individualised resources for EVERY pupil, not just SEND pupils)",
  );
  lines.push("");

  for (const p of pupils) {
    const name = decodeName(p);
    const profile = adaptationProfiles?.[p.pupil_ref] || {};
    const parts: string[] = [];

    // Identity & attainment
    const attainments: string[] = [];
    if (p.attainment_reading) attainments.push(`R:${p.attainment_reading}`);
    if (p.attainment_writing) attainments.push(`W:${p.attainment_writing}`);
    if (p.attainment_maths) attainments.push(`M:${p.attainment_maths}`);
    if (attainments.length) parts.push(attainments.join(" "));

    // Standardised scores (more granular than attainment bands)
    const ext = p as unknown as Record<string, unknown>;
    if (ext.standardised_score_reading)
      parts.push(`StdRd:${ext.standardised_score_reading}`);
    if (ext.standardised_score_maths)
      parts.push(`StdMa:${ext.standardised_score_maths}`);
    if (ext.reading_age) parts.push(`ReadAge:${ext.reading_age}`);

    // SEND status
    if (p.has_ehcp) parts.push(`EHCP-${p.send_primary_need || "SEN"}`);
    else if (p.has_send_support)
      parts.push(`SEN Support-${p.send_primary_need || "SEN"}`);

    // Vulnerability flags
    if (p.is_pupil_premium) parts.push("PP");
    if (p.is_looked_after) parts.push("LAC");
    if (p.is_eal) parts.push(`EAL Stage ${p.eal_stage || "?"}`);

    // Medical
    if (ext.medical_conditions)
      parts.push(`Medical: ${ext.medical_conditions}`);

    // Communication
    if (ext.communication_method && ext.communication_method !== "Verbal") {
      parts.push(`Communication: ${ext.communication_method}`);
    }

    // EHCP provisions (legally mandated)
    if (ext.ehcp_provisions) {
      parts.push(`EHCP provisions: ${ext.ehcp_provisions}`);
    }

    // Accessibility needs
    if (p.accessibility_needs?.length) {
      parts.push(`Accessibility: ${p.accessibility_needs.join(", ")}`);
    }

    // Adaptation profile enrichment (from teacher/SENCO/pupil voice)
    if (profile.instruction_style && profile.instruction_style !== "standard") {
      parts.push(`Instructions: ${profile.instruction_style}`);
    }
    if (profile.focus_duration_mins) {
      parts.push(`Focus: ${profile.focus_duration_mins} min blocks`);
    }
    if (
      profile.rendering_prefs &&
      Object.keys(profile.rendering_prefs as object).length > 0
    ) {
      const rp = profile.rendering_prefs as Record<string, unknown>;
      const rpParts: string[] = [];
      if (rp.font && rp.font !== "standard") rpParts.push(`font:${rp.font}`);
      if (rp.font_size && rp.font_size !== 12)
        rpParts.push(`size:${rp.font_size}pt`);
      if (rp.background && rp.background !== "#FFFFFF")
        rpParts.push(`bg:${rp.background}`);
      if (rpParts.length) parts.push(`Rendering: ${rpParts.join(", ")}`);
    }
    if (
      Array.isArray(profile.effective_strategies) &&
      (profile.effective_strategies as string[]).length > 0
    ) {
      parts.push(
        `What works: ${(profile.effective_strategies as string[]).join("; ")}`,
      );
    }
    if (
      Array.isArray(profile.ineffective_strategies) &&
      (profile.ineffective_strategies as string[]).length > 0
    ) {
      parts.push(
        `Avoid: ${(profile.ineffective_strategies as string[]).join("; ")}`,
      );
    }
    if (
      Array.isArray(profile.preferred_contexts) &&
      (profile.preferred_contexts as string[]).length > 0
    ) {
      parts.push(
        `Interests: ${(profile.preferred_contexts as string[]).join(", ")}`,
      );
    }

    // Topic-specific gaps from quest data
    if (
      profile.misconceptions &&
      Array.isArray(profile.misconceptions) &&
      (profile.misconceptions as unknown[]).length > 0
    ) {
      const mc = (profile.misconceptions as Array<Record<string, unknown>>)
        .filter((m) => !m.resolved)
        .map((m) => m.description)
        .slice(0, 3);
      if (mc.length) parts.push(`Known gaps: ${mc.join("; ")}`);
    }

    if (parts.length > 0) {
      lines.push(`${name} (${p.pupil_ref}): ${parts.join(" | ")}`);
    } else {
      lines.push(`${name} (${p.pupil_ref}): No additional needs identified`);
    }
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
  previousLesson: { title: string; objective: string; criteria: string[] } | null;
}): string {
  const recapSection = params.previousLesson
    ? `\n\nPREVIOUS LESSON (build a 5-minute retrieval starter based on this):
Title: ${params.previousLesson.title}
Objective: ${params.previousLesson.objective}
Success Criteria: ${params.previousLesson.criteria.join("; ")}
Start this lesson with a quick retrieval activity that tests whether pupils remember the key concepts from the previous lesson. This could be a quick quiz, partner discussion, or whiteboard activity. The Starter section should begin with this recap.`
    : "";

  return `You are an expert UK primary school teacher creating a lesson plan.${recapSection}

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
  "supplyBrief": "Human-readable summary for a supply teacher covering this lesson.",
  "secondarySubjects": [
    {
      "subject": "English",
      "ncCodes": ["Y6W3"],
      "supportingFocus": "Pupils write explanations using fraction vocabulary"
    }
  ]
}

IMPORTANT — Cross-curricular links:
If this lesson naturally TOUCHES ON other subjects (not TEACHES them), list them as "secondarySubjects". For example:
- A Maths lesson on fractions might support English (Y6W3 — writing to explain) if pupils write method explanations
- A Science lesson on forces might support Maths (6M5 — units) if pupils convert between units
- A History lesson might support English (reading comprehension) if pupils analyse primary sources

Rules:
- Only list secondary subjects that are GENUINELY engaged, not tokenistic
- Primary subject is what is being TAUGHT. Secondary is what is TOUCHED ON.
- Leave empty array if no cross-curricular link is authentic.`;
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

  // Load class, slot, pupils, scheme state, adaptation profiles, and previous lesson in parallel.
  // Scheme identity (which scheme for which subject) is school-wide via organization_schemes;
  // per-class progression (current_unit / current_step) still lives in ls_scheme_mappings.scheme_config.
  const [
    classRes,
    slotRes,
    pupilsRes,
    orgSchemesRes,
    classSchemesRes,
    profilesRes,
    prevLessonRes,
  ] = await Promise.all([
    supabase.from("ls_classes").select("*").eq("id", classId).single(),
    supabase.from("ls_timetable_slots").select("*").eq("id", slotId).single(),
    supabase
      .from("ls_pupils")
      .select("*")
      .eq("class_id", classId)
      .order("display_name_encrypted"),
    supabase
      .from("organization_schemes")
      .select("subject, scheme_name")
      .eq("organization_id", orgId),
    supabase.from("ls_scheme_mappings").select("*").eq("class_id", classId),
    supabase
      .from("ls_pupil_adaptation_profiles")
      .select("*")
      .eq("organization_id", orgId),
    // Fetch most recent lesson for this class + subject to build recap
    supabase
      .from("ls_lesson_plans")
      .select("title, learning_objective, success_criteria, key_vocabulary, differentiation_groups, send_adaptations")
      .eq("class_id", classId)
      .eq("organization_id", orgId)
      .lt("week_commencing", weekCommencing)
      .order("week_commencing", { ascending: false })
      .limit(1),
  ]);

  if (classRes.error || !classRes.data) return apiError("Class not found", 404);
  if (slotRes.error || !slotRes.data) return apiError("Slot not found", 404);

  const cls = classRes.data;
  const slot = slotRes.data as LSTimetableSlot;
  const pupils = (pupilsRes.data ?? []) as LSPupil[];
  const classSchemes = (classSchemesRes.data ?? []) as LSSchemeMapping[];
  const orgSchemeForSubject = (orgSchemesRes.data ?? []).find(
    (s) => s.subject === slot.subject,
  );

  // Index adaptation profiles by pupil_ref for fast lookup
  const adaptationProfiles: Record<string, Record<string, unknown>> = {};
  for (const profile of profilesRes.data ?? []) {
    adaptationProfiles[profile.pupil_ref] = profile;
  }

  // Scheme identity: prefer school-wide (organization_schemes); fall back to the
  // class-level ls_scheme_mappings row for orgs that haven't adopted yet.
  const classSchemeMapping = classSchemes.find((s) => s.subject === slot.subject);
  const schemeName: string | null =
    orgSchemeForSubject?.scheme_name ?? classSchemeMapping?.scheme_name ?? null;

  let progression: LSSchemeProgression | null = null;
  let schemeStep: string | null = null;
  let unitName: string | null = null;
  let methodologyNotes: string | null = null;

  if (schemeName) {
    // Per-class progression (which unit / step the class is currently on) still
    // lives on ls_scheme_mappings.scheme_config. That's legitimately per-class —
    // two Y6 classes may be at different points in the same school-wide scheme.
    unitName = classSchemeMapping?.scheme_config?.current_unit ?? null;
    const stepNum = classSchemeMapping?.scheme_config?.current_step ?? 1;

    const { data: prog } = await supabase
      .from("ls_scheme_progressions")
      .select("*")
      .eq("scheme_name", schemeName)
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

  const classProfile = buildClassProfile(pupils, adaptationProfiles);

  const prompt = buildPrompt({
    subject: slot.subject,
    yearGroup: cls.year_group,
    keyStage: cls.key_stage,
    schemeName,
    schemeStep,
    unitName,
    methodologyNotes,
    startTime: slot.start_time,
    endTime: slot.end_time,
    classProfile,
    teacherNote: teacherNote ?? null,
    previousLesson: (() => {
      const prev = prevLessonRes.data?.[0];
      if (!prev?.title) return null;
      return {
        title: prev.title,
        objective: prev.learning_objective || "",
        criteria: Array.isArray(prev.success_criteria) ? prev.success_criteria : [],
      };
    })(),
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

  // Build visualisation intent from the generated content
  const visIntent: LessonIntent = {
    subject: slot.subject,
    year_group: cls.year_group,
    topic: (generated.title as string) || slot.subject,
    concept_to_visualise: (generated.objective as string) || "",
    learning_objectives: (generated.successCriteria as string[]) ?? [],
    key_vocabulary: ((generated.vocabulary as Array<{ word: string; definition: string }>) ?? []),
    curriculum_codes: progression?.steps?.[(classSchemeMapping?.scheme_config?.current_step ?? 1) - 1]?.nc_codes ?? [],
    suggested_interaction_points: [],
  };

  let visualisation: { svg: string; html: string; interaction_manifest: unknown } | null = null;
  try {
    visualisation = await generateVisualisation(visIntent);
  } catch (e) {
    console.warn("[Lesson Generate] Visualisation generation failed, continuing without:", e);
  }

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
    scheme_name: schemeName,
    scheme_step: schemeStep,
    title: (generated.title as string) || `${slot.subject} Lesson`,
    learning_objective: (generated.objective as string) || "",
    success_criteria: generated.successCriteria ?? [],
    key_vocabulary: generated.vocabulary ?? [],
    prior_learning_summary: (generated.priorLearning as string) || null,
    plan_sections: generated.planSections ?? [],
    differentiation_groups: generated.differentiationGroups ?? [],
    send_adaptations: generated.sendAdaptations ?? [],
    nc_objective_codes:
      progression?.steps?.[
        (classSchemeMapping?.scheme_config?.current_step ?? 1) - 1
      ]?.nc_codes ?? [],
    secondary_subjects: (generated.secondarySubjects as Array<{subject: string; ncCodes: string[]; supportingFocus: string}>) ?? [],
    supply_brief: (generated.supplyBrief as string) || null,
    generated_resources_json: {
      worksheetQuestions: generated.worksheetQuestions ?? {},
      exitTicket: generated.exitTicket ?? [],
      quiz: generated.quiz ?? [],
      starterQuestions: generated.starterQuestions ?? [],
      visualisation: visualisation ?? null,
    },
    status: "draft",
    ai_model: MODEL_ID,
    generation_time_ms: generationTimeMs,
  };

  const { data: saved, error: saveError } = await supabase
    .from("ls_lesson_plans")
    .upsert(plan, {
      onConflict: "class_id,week_commencing,day_of_week,subject",
    })
    .select()
    .single();

  if (saveError) return apiError(saveError.message, 500);

  // Sync matching calendar event — update title and link to plan
  if (saved?.id) {
    const eventDate = new Date(weekCommencing);
    // day_of_week: 1=Mon, so add (day_of_week - 1) days to Monday
    eventDate.setDate(eventDate.getDate() + (slot.day_of_week - 1));
    const eventDateStr = eventDate.toISOString().split("T")[0];

    await supabase
      .from("ls_calendar_events")
      .update({
        title: saved.title,
        lesson_plan_id: saved.id,
      })
      .eq("class_id", classId)
      .eq("event_date", eventDateStr)
      .eq("subject", slot.subject);
  }

  return apiSuccess(saved);
});
