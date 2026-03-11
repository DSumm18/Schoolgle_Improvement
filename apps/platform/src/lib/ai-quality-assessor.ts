/**
 * AI Quality Assessor — Area-Specific Ofsted Evidence Assessment
 *
 * Instead of just counting evidence items, this module uses specialist AI prompts
 * for each Ofsted evaluation area that know exactly what "good" looks like.
 *
 * Architecture:
 * 1. Evidence Matcher (ai-evidence-matcher.ts) → identifies WHICH documents match WHICH areas
 * 2. Quality Assessor (this file) → assesses HOW GOOD the evidence is against Ofsted criteria
 * 3. Assessment Updater (assessment-updater.ts) → stores the results
 */

import OpenAI from "openai";
import { MODEL_CONFIG } from "./ai-evidence-matcher";

// --- Types ---

export type QualityRating =
  | "exceptional"
  | "strong_standard"
  | "expected_standard"
  | "needs_attention"
  | "urgent_improvement"
  | "not_assessed";

export interface QualityAssessmentResult {
  subcategoryId: string;
  categoryId: string;
  rating: QualityRating;
  score: number; // 0-100
  rationale: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  keyFindings: string[];
  benchmarkComparison?: string;
  modelUsed: string;
  processingTime: number;
}

export interface DfEBenchmarkData {
  schoolUrn?: string;
  attendance?: {
    overall: number;
    persistentAbsence: number;
    nationalAverage: number;
    nationalPA: number;
  };
  outcomes?: {
    ks2ReadingExpected: number;
    ks2WritingExpected: number;
    ks2MathsExpected: number;
    ks2CombinedExpected: number;
    nationalCombined: number;
    progressReading: number;
    progressWriting: number;
    progressMaths: number;
  };
  workforce?: {
    pupilTeacherRatio: number;
    meanSalary: number;
    teacherVacancyRate: number;
  };
  census?: {
    totalPupils: number;
    fsmPercentage: number;
    sendPercentage: number;
    ealPercentage: number;
  };
}

// --- Area-Specific Quality Prompts ---

const AREA_PROMPTS: Record<
  string,
  {
    systemPrompt: string;
    qualityCriteria: string;
  }
> = {
  inclusion: {
    systemPrompt: `You are a specialist Ofsted inspector focusing on INCLUSION — how effectively the school supports ALL pupils, especially those with SEND, disadvantaged pupils, and those with mental health needs.

You assess against the EIF 2025 Inclusion judgement. You know that inspectors look for:
- A graduated approach (assess, plan, do, review) that is genuinely implemented, not just documented
- Evidence that interventions have measurable IMPACT, not just existence
- Pupil Premium strategy that addresses specific barriers (not generic interventions)
- SEND provision that enables full curriculum access
- Mental health support that is proactive, not reactive`,

    qualityCriteria: `
## Exceptional (90-100)
- SEND policy is comprehensive, references current SEND Code of Practice, and is clearly implemented in practice
- Graduated approach has specific, dated examples of assess-plan-do-review cycles with evidence of adaptation
- Provision maps show targeted interventions with quantified impact data (progress scores, assessment gains)
- PP strategy explicitly identifies barriers per cohort with EEF-backed interventions and tracked impact
- EHCP reviews are timely, involve parents/pupil voice, and show ambitious targets being met
- SENCO has dedicated time, relevant qualifications (NASENCo), and evidence of systemic impact

## Strong Standard (70-89)
- Policies are current and referenced in practice
- Evidence of graduated approach with some impact data
- PP strategy is specific to school context with measurable targets
- SEND provision is well-organised with clear systems

## Expected Standard (50-69)
- Required policies exist and are broadly current
- Systems are in place but impact evidence is limited or inconsistent
- PP strategy exists but may be generic or lack specific barrier analysis
- SEND register is maintained but graduated approach evidence is thin

## Needs Attention (30-49)
- Policies exist but are outdated or clearly template-based without school-specific content
- Limited evidence of graduated approach in practice
- PP spending cannot be clearly linked to impact
- SEND provision is reactive rather than strategic

## Urgent Improvement (0-29)
- Key policies missing or significantly out of date
- No evidence of graduated approach or impact tracking
- PP funding not targeted or tracked
- SEND needs not being identified or met`,
  },

  "curriculum-teaching": {
    systemPrompt: `You are a specialist Ofsted inspector focusing on CURRICULUM AND TEACHING — the quality, breadth and ambition of the curriculum and how effectively it is taught.

You assess against the EIF 2025 Curriculum and Teaching judgement. You know that inspectors look for:
- Curriculum INTENT that is ambitious for all pupils and clearly sequenced
- IMPLEMENTATION through quality-first teaching with strong subject knowledge
- Reading and phonics that uses a DfE-validated systematic synthetic phonics (SSP) programme
- Assessment that genuinely informs teaching, not just data collection
- Evidence of knowledge building over time (not just coverage)`,

    qualityCriteria: `
## Exceptional (90-100)
- Curriculum overview shows deliberate sequencing of knowledge across all year groups with clear rationale
- Subject policies articulate intent that is ambitious AND adapted for school context
- Progression maps demonstrate cumulative knowledge building, not just content coverage
- Phonics programme is DfE-validated, implemented with fidelity, books are decodable and matched
- Lesson observations show consistent quality-first teaching with adaptive practice
- Assessment policy shows how formative assessment directly shapes subsequent teaching
- CPD records show subject-specific professional development with evidence of classroom impact

## Strong Standard (70-89)
- Clear curriculum maps with progression between year groups
- Subject-specific intent statements that go beyond generic aims
- Phonics programme implemented consistently with good outcomes
- Regular monitoring shows teaching quality is at least good

## Expected Standard (50-69)
- Curriculum overview exists with some evidence of sequencing
- Phonics programme in place (may or may not be DfE validated)
- Some monitoring evidence (observations, work scrutiny)
- Assessment approach is defined but impact on teaching is unclear

## Needs Attention (30-49)
- Curriculum coverage documented but sequencing rationale is weak
- Phonics programme inconsistently implemented or not DfE validated
- Limited monitoring evidence or no clear follow-up from monitoring
- Assessment is primarily summative, rarely informing teaching

## Urgent Improvement (0-29)
- No curriculum overview or one that is clearly copied from another school
- Phonics teaching is ad-hoc or programme not implemented with fidelity
- No monitoring evidence
- No coherent assessment approach`,
  },

  achievement: {
    systemPrompt: `You are a specialist Ofsted inspector focusing on ACHIEVEMENT — the outcomes pupils achieve and the progress they make from their starting points.

You assess against the EIF 2025 Achievement judgement. You know that inspectors look for:
- Outcomes in context — not just raw data, but progress from starting points
- Trends over time, not just single-year snapshots
- Disaggregated data showing outcomes for ALL groups (SEND, PP, EAL, boys/girls)
- Comparison with national benchmarks
- Evidence that school's own tracking data is validated and accurate`,

    qualityCriteria: `
## Exceptional (90-100)
- KS2 outcomes significantly above national in all measures (R, W, M, combined)
- Progress scores positive and above national in all subjects
- Phonics screening pass rate above national
- EYFS GLD at or above national
- Disadvantaged gap is closing and smaller than national
- SEND pupils make strong progress from starting points with evidence
- Trend data shows sustained improvement over 3+ years
- School tracking data is validated against external assessments

## Strong Standard (70-89)
- KS2 outcomes at least in line with national in most measures
- Progress scores broadly positive
- Phonics outcomes at or above national
- Most groups achieving at least in line with national comparators
- Trend data shows improvement

## Expected Standard (50-69)
- KS2 outcomes broadly in line with national
- Some progress data available but may be from internal tracking only
- Phonics outcomes acceptable
- Some gap analysis present but may not show clear trends

## Needs Attention (30-49)
- KS2 outcomes below national in one or more measures
- Progress data limited or unreliable
- Significant gaps between groups
- No clear trend of improvement

## Urgent Improvement (0-29)
- KS2 outcomes significantly below national
- No reliable progress measures
- No disaggregated data
- Declining trend in outcomes`,
  },

  "attendance-behaviour": {
    systemPrompt: `You are a specialist Ofsted inspector focusing on ATTENDANCE AND BEHAVIOUR — pupils' attendance, behaviour, attitudes to learning and conduct.

You assess against the EIF 2025 Attendance and Behaviour judgement. You know that:
- National primary attendance benchmark is ~96% (2024/25)
- National persistent absence rate is ~17-19% for primary
- Inspectors look for same-day response to absence
- Behaviour must be consistently managed with high expectations
- Attitudes to learning matter as much as conduct`,

    qualityCriteria: `
## Exceptional (90-100)
- Overall attendance ≥96% and above national average
- Persistent absence <10% and below national average
- Attendance for disadvantaged pupils within 2pp of non-disadvantaged
- Same-day response to absence with clear escalation procedures
- Behaviour policy is clear, consistently applied, and understood by pupils
- Exclusion rate is very low with evidence of restorative approaches
- Pupil voice evidence shows pupils feel safe and enjoy learning
- Attitudes to learning observed as consistently positive

## Strong Standard (70-89)
- Overall attendance 94-96% broadly in line with national
- PA rate reducing and actions in place
- Behaviour policy implemented consistently
- Low exclusion rate
- Positive attitudes to learning

## Expected Standard (50-69)
- Overall attendance 92-94% (slightly below national)
- PA rate acknowledged with intervention strategies
- Behaviour policy exists and is broadly applied
- Some evidence of attitudes to learning

## Needs Attention (30-49)
- Overall attendance <92%
- PA rate above national with limited effective intervention
- Behaviour management inconsistent
- Limited evidence of attitudes to learning

## Urgent Improvement (0-29)
- Overall attendance <90%
- PA rate significantly above national
- No effective attendance strategy
- Behaviour is not managed effectively
- High exclusion rate with no evidence of alternative approaches`,
  },

  "personal-development": {
    systemPrompt: `You are a specialist Ofsted inspector focusing on PERSONAL DEVELOPMENT AND WELL-BEING — the broader development of pupils as individuals and citizens.

You assess against the EIF 2025 Personal Development judgement. You know that inspectors look for:
- Character education that is deliberately planned, not incidental
- British Values that are meaningfully explored, not just displayed on a wall
- RSE that meets statutory requirements AND is age-appropriate
- Enrichment that builds cultural capital and is accessible to ALL pupils
- SMSC development that prepares pupils for life in modern Britain`,

    qualityCriteria: `
## Exceptional (90-100)
- PSHE curriculum is comprehensive, well-sequenced, and taught by trained staff
- RSE policy meets all statutory requirements, parents consulted, age-appropriate delivery evidenced
- British Values are embedded across curriculum with specific, meaningful examples (not just posters)
- Enrichment programme is rich, accessible to all (including disadvantaged), and builds cultural capital
- Pupil leadership opportunities (school council, ambassadors) with genuine impact
- Character education is explicit with defined traits and progression
- Evidence of pupil voice genuinely influencing school decisions

## Strong Standard (70-89)
- PSHE taught regularly with clear progression
- RSE delivered to statutory requirements
- British Values explored through curriculum and assemblies
- Good enrichment offer with reasonable uptake

## Expected Standard (50-69)
- PSHE/RSE curriculum exists and is delivered
- Some British Values coverage
- Enrichment activities available
- Basic character development through school ethos

## Needs Attention (30-49)
- PSHE/RSE is ad-hoc or coverage is incomplete
- British Values are tokenistic (posters only)
- Limited enrichment, especially for disadvantaged
- No deliberate character education

## Urgent Improvement (0-29)
- RSE not meeting statutory requirements
- No evidence of British Values education
- Minimal or no enrichment
- No planned personal development curriculum`,
  },

  "leadership-governance": {
    systemPrompt: `You are a specialist Ofsted inspector focusing on LEADERSHIP AND GOVERNANCE — the effectiveness of leadership at all levels including governance.

You assess against the EIF 2025 Leadership and Governance judgement. You know that inspectors look for:
- A clear, ambitious vision that is shared and understood
- Accurate self-evaluation that leads to the right priorities
- Governance that provides both support AND challenge
- Staff development that improves teaching quality
- Workload management and staff wellbeing`,

    qualityCriteria: `
## Exceptional (90-100)
- Vision statement is clear, ambitious, specific to school context, and evidenced in practice
- SEF/self-evaluation is honest, accurate, data-informed, and identifies precise priorities
- School development plan has SMART targets linked to pupil outcomes with regular review evidence
- Governor minutes show probing questions, data scrutiny, and holding leaders to account
- Governor training records show strategic development aligned to school priorities
- CPD programme is subject-specific, evidence-based, and has demonstrable impact on teaching
- Staff voice evidence shows workload is manageable and wellbeing is prioritised
- Parent engagement is strong with evidence of communication, consultation, and partnership

## Strong Standard (70-89)
- Clear vision reflected in school policies and plans
- SEF is broadly accurate with appropriate priorities
- SDP has measurable targets and review points
- Governance provides effective oversight
- CPD is regular and relevant

## Expected Standard (50-69)
- Vision and values documented
- SEF exists with some accuracy
- SDP in place with targets
- Governors meet regularly with minutes
- Some CPD evidence

## Needs Attention (30-49)
- Vision is vague or not shared
- SEF is inaccurate or overly generous
- SDP targets are not measurable
- Governance is supportive but not challenging
- CPD is generic, not aligned to school needs

## Urgent Improvement (0-29)
- No clear vision or direction
- No self-evaluation or wildly inaccurate
- No development plan or one that is unrealistic
- Governance fails to hold leaders to account
- No systematic CPD`,
  },

  safeguarding: {
    systemPrompt: `You are a specialist Ofsted inspector assessing SAFEGUARDING — whether the school's safeguarding arrangements are effective. This is a BINARY assessment: Met or Not Met.

A "Not Met" judgement is one of the most serious outcomes of an inspection. You know that:
- The safeguarding policy MUST reference KCSIE 2024 (current edition)
- The SCR must have ALL required fields with NO gaps
- ALL DBS checks must be current
- DSL training must be within 2 years
- ALL staff must have signed to confirm they have read KCSIE Part 1
- Safer recruitment procedures must be documented and followed
- Online safety must be current and reflect modern risks`,

    qualityCriteria: `
## Met (safeguarding_met = true)
ALL of the following must be evidenced:
1. Safeguarding policy references KCSIE 2024 (not earlier)
2. Single Central Record has all required fields, no gaps, up to date
3. All DBS checks are current (enhanced with barred list check)
4. DSL (and deputies) trained within last 2 years
5. Online safety policy is current and addresses current risks
6. All staff have signed KCSIE Part 1 confirmation (annual)
7. Whistleblowing policy is present and accessible
8. Safer recruitment training completed by at least 2 people on every panel
9. Referral procedures (MASH/LADO) are documented and known by staff
10. Evidence of safeguarding culture (regular briefings, scenario training)

## Not Met (safeguarding_met = false)
ANY of the following will result in Not Met:
- Safeguarding policy references outdated KCSIE (pre-2024)
- SCR has gaps or missing fields
- Any DBS check expired or missing
- DSL training expired (>2 years)
- No online safety policy or significantly outdated
- Staff KCSIE sign-off incomplete
- No safer recruitment evidence
- Referral procedures unclear or not documented`,
  },
};

// --- Core Functions ---

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://schoolgle.co.uk",
      "X-Title": "Schoolgle - Quality Assessment",
    },
  });
}

/**
 * Assess the quality of evidence for a specific Ofsted area
 */
export async function assessAreaQuality(
  areaId: string,
  evidenceTexts: { filename: string; text: string; confidence: number }[],
  benchmarkData?: DfEBenchmarkData,
): Promise<QualityAssessmentResult> {
  const startTime = Date.now();
  const areaPrompt = AREA_PROMPTS[areaId];

  if (!areaPrompt) {
    return {
      subcategoryId: areaId,
      categoryId: areaId,
      rating: "not_assessed",
      score: 0,
      rationale: `No quality assessment prompt defined for area: ${areaId}`,
      strengths: [],
      weaknesses: [],
      recommendations: [],
      keyFindings: [],
      modelUsed: "none",
      processingTime: 0,
    };
  }

  // Build evidence summary (truncate each document to avoid token limits)
  const evidenceSummary = evidenceTexts
    .slice(0, 10) // Max 10 documents per area
    .map((doc, i) => {
      const truncated =
        doc.text.length > 5000
          ? doc.text.substring(0, 5000) + "\n[...truncated]"
          : doc.text;
      return `--- Document ${i + 1}: ${doc.filename} (match confidence: ${Math.round(doc.confidence * 100)}%) ---\n${truncated}`;
    })
    .join("\n\n");

  // Build benchmark context if available
  let benchmarkContext = "";
  if (benchmarkData) {
    benchmarkContext = "\n\n## School Context (DfE Data):\n";
    if (benchmarkData.attendance) {
      benchmarkContext += `- Overall attendance: ${benchmarkData.attendance.overall}% (national: ${benchmarkData.attendance.nationalAverage}%)\n`;
      benchmarkContext += `- Persistent absence: ${benchmarkData.attendance.persistentAbsence}% (national: ${benchmarkData.attendance.nationalPA}%)\n`;
    }
    if (benchmarkData.outcomes) {
      benchmarkContext += `- KS2 combined expected+: ${benchmarkData.outcomes.ks2CombinedExpected}% (national: ${benchmarkData.outcomes.nationalCombined}%)\n`;
      benchmarkContext += `- Progress reading: ${benchmarkData.outcomes.progressReading}, writing: ${benchmarkData.outcomes.progressWriting}, maths: ${benchmarkData.outcomes.progressMaths}\n`;
    }
    if (benchmarkData.census) {
      benchmarkContext += `- Total pupils: ${benchmarkData.census.totalPupils}\n`;
      benchmarkContext += `- FSM: ${benchmarkData.census.fsmPercentage}%, SEND: ${benchmarkData.census.sendPercentage}%, EAL: ${benchmarkData.census.ealPercentage}%\n`;
    }
  }

  const userPrompt = `Assess the quality of the following school evidence for the "${areaId}" Ofsted evaluation area.

${evidenceTexts.length} document(s) have been identified as relevant to this area.
${evidenceTexts.length === 0 ? "\n⚠️ NO EVIDENCE DOCUMENTS FOUND for this area. Rate accordingly." : ""}
${benchmarkContext}

## Evidence Documents:
${evidenceSummary || "No documents available."}

## Quality Criteria:
${areaPrompt.qualityCriteria}

## Instructions:
Assess the evidence against the quality criteria above. Return a JSON object:
{
  "rating": "exceptional" | "strong_standard" | "expected_standard" | "needs_attention" | "urgent_improvement",
  "score": 0-100,
  "rationale": "2-3 sentence overall assessment explaining why this rating was given",
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness or gap 1", "specific weakness or gap 2"],
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2"],
  "key_findings": ["key finding from the evidence 1", "key finding 2"]
}

Be precise. Reference specific documents and quotes where possible. If evidence is missing for critical requirements, say so explicitly.`;

  try {
    const openai = getOpenAIClient();
    const modelId = MODEL_CONFIG.primary.id;

    const response = await openai.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: areaPrompt.systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 4000,
    });

    const responseText = response.choices[0]?.message?.content || "";

    // Parse JSON from response
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(jsonText);

    return {
      subcategoryId: areaId,
      categoryId: areaId,
      rating: parsed.rating || "not_assessed",
      score: parsed.score || 0,
      rationale: parsed.rationale || "",
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      recommendations: parsed.recommendations || [],
      keyFindings: parsed.key_findings || [],
      benchmarkComparison: benchmarkData
        ? buildBenchmarkComparison(areaId, benchmarkData)
        : undefined,
      modelUsed: modelId,
      processingTime: Date.now() - startTime,
    };
  } catch (error: any) {
    console.error(
      `[Quality Assessor] Error assessing ${areaId}:`,
      error.message,
    );

    // Retry with fallback model
    try {
      const openai = getOpenAIClient();
      const fallbackModel = MODEL_CONFIG.fallback.id;

      const response = await openai.chat.completions.create({
        model: fallbackModel,
        messages: [
          { role: "system", content: areaPrompt.systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      });

      const responseText = response.choices[0]?.message?.content || "";
      let jsonText = responseText.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "");
      }

      const parsed = JSON.parse(jsonText);

      return {
        subcategoryId: areaId,
        categoryId: areaId,
        rating: parsed.rating || "not_assessed",
        score: parsed.score || 0,
        rationale: parsed.rationale || "",
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || [],
        keyFindings: parsed.key_findings || [],
        modelUsed: fallbackModel,
        processingTime: Date.now() - startTime,
      };
    } catch (fallbackError) {
      return {
        subcategoryId: areaId,
        categoryId: areaId,
        rating: "not_assessed",
        score: 0,
        rationale: `Quality assessment failed: ${error.message}`,
        strengths: [],
        weaknesses: [],
        recommendations: [
          "Re-run the evidence scan to generate quality assessment",
        ],
        keyFindings: [],
        modelUsed: "failed",
        processingTime: Date.now() - startTime,
      };
    }
  }
}

/**
 * Assess safeguarding (binary Met/Not Met)
 */
export async function assessSafeguarding(
  evidenceTexts: { filename: string; text: string; confidence: number }[],
): Promise<{
  met: boolean;
  details: {
    checkId: string;
    checkName: string;
    met: boolean;
    evidence: string;
  }[];
  rationale: string;
  modelUsed: string;
}> {
  const areaPrompt = AREA_PROMPTS.safeguarding;
  const openai = getOpenAIClient();

  const evidenceSummary = evidenceTexts
    .slice(0, 15)
    .map((doc, i) => {
      const truncated =
        doc.text.length > 4000
          ? doc.text.substring(0, 4000) + "\n[...truncated]"
          : doc.text;
      return `--- Document ${i + 1}: ${doc.filename} ---\n${truncated}`;
    })
    .join("\n\n");

  const userPrompt = `Assess the school's safeguarding arrangements against the 10 requirements.

## Evidence Documents:
${evidenceSummary || "No safeguarding documents found."}

## Requirements:
${areaPrompt.qualityCriteria}

Return JSON:
{
  "overall_met": true/false,
  "checks": [
    { "id": "sg-policy", "name": "Safeguarding Policy", "met": true/false, "evidence": "Brief note on what was found or missing" },
    { "id": "sg-scr", "name": "Single Central Record", "met": true/false, "evidence": "..." },
    { "id": "sg-dbs", "name": "DBS Checks", "met": true/false, "evidence": "..." },
    { "id": "sg-dsl", "name": "DSL Training", "met": true/false, "evidence": "..." },
    { "id": "sg-online", "name": "Online Safety Policy", "met": true/false, "evidence": "..." },
    { "id": "sg-training", "name": "Staff Safeguarding Training", "met": true/false, "evidence": "..." },
    { "id": "sg-whistle", "name": "Whistleblowing Policy", "met": true/false, "evidence": "..." },
    { "id": "sg-recruit", "name": "Safer Recruitment", "met": true/false, "evidence": "..." },
    { "id": "sg-referral", "name": "Referral Procedures", "met": true/false, "evidence": "..." },
    { "id": "sg-culture", "name": "Safeguarding Culture", "met": true/false, "evidence": "..." }
  ],
  "rationale": "Overall safeguarding assessment summary"
}

Be strict. If evidence is ambiguous or insufficient for a requirement, mark it as NOT met.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_CONFIG.primary.id,
      messages: [
        { role: "system", content: areaPrompt.systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const responseText = response.choices[0]?.message?.content || "";
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const parsed = JSON.parse(jsonText);

    return {
      met: parsed.overall_met || false,
      details: (parsed.checks || []).map(
        (c: { id: string; name: string; met: boolean; evidence: string }) => ({
          checkId: c.id,
          checkName: c.name,
          met: c.met || false,
          evidence: c.evidence || "",
        }),
      ),
      rationale: parsed.rationale || "",
      modelUsed: MODEL_CONFIG.primary.id,
    };
  } catch (error: any) {
    console.error("[Quality Assessor] Safeguarding assessment failed:", error);
    return {
      met: false,
      details: [],
      rationale: `Assessment failed: ${error.message}`,
      modelUsed: "failed",
    };
  }
}

/**
 * Run quality assessment across all 6 evaluation areas
 */
export async function assessAllAreas(
  evidenceByArea: Record<
    string,
    { filename: string; text: string; confidence: number }[]
  >,
  benchmarkData?: DfEBenchmarkData,
  onProgress?: (area: string, index: number, total: number) => void,
): Promise<QualityAssessmentResult[]> {
  const areas = [
    "inclusion",
    "curriculum-teaching",
    "achievement",
    "attendance-behaviour",
    "personal-development",
    "leadership-governance",
  ];

  const results: QualityAssessmentResult[] = [];

  for (let i = 0; i < areas.length; i++) {
    const areaId = areas[i];
    const evidence = evidenceByArea[areaId] || [];

    if (onProgress) {
      onProgress(areaId, i + 1, areas.length);
    }

    const result = await assessAreaQuality(areaId, evidence, benchmarkData);
    results.push(result);

    // Brief pause between areas to avoid rate limiting
    if (i < areas.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results;
}

// --- Helper Functions ---

function buildBenchmarkComparison(
  areaId: string,
  data: DfEBenchmarkData,
): string {
  switch (areaId) {
    case "attendance-behaviour":
      if (data.attendance) {
        const diff = data.attendance.overall - data.attendance.nationalAverage;
        const direction = diff >= 0 ? "above" : "below";
        return `School attendance ${data.attendance.overall}% is ${Math.abs(diff).toFixed(1)}pp ${direction} national average (${data.attendance.nationalAverage}%). PA rate: ${data.attendance.persistentAbsence}% vs national ${data.attendance.nationalPA}%.`;
      }
      return "";

    case "achievement":
      if (data.outcomes) {
        const diff =
          data.outcomes.ks2CombinedExpected - data.outcomes.nationalCombined;
        const direction = diff >= 0 ? "above" : "below";
        return `KS2 combined ${data.outcomes.ks2CombinedExpected}% is ${Math.abs(diff).toFixed(0)}pp ${direction} national (${data.outcomes.nationalCombined}%). Progress: R=${data.outcomes.progressReading}, W=${data.outcomes.progressWriting}, M=${data.outcomes.progressMaths}.`;
      }
      return "";

    case "inclusion":
      if (data.census) {
        return `School context: ${data.census.totalPupils} pupils, ${data.census.fsmPercentage}% FSM, ${data.census.sendPercentage}% SEND, ${data.census.ealPercentage}% EAL.`;
      }
      return "";

    default:
      return "";
  }
}

/**
 * Convert quality assessment results to the format expected by assessment-updater
 */
export function qualityResultToAssessmentUpdate(
  result: QualityAssessmentResult,
): {
  aiRating: string;
  aiRationale: string;
  score: number;
} {
  // Build a rich rationale from the quality assessment
  let rationale = result.rationale;

  if (result.strengths.length > 0) {
    rationale += "\n\n**Strengths:**\n";
    result.strengths.forEach((s) => (rationale += `- ${s}\n`));
  }

  if (result.weaknesses.length > 0) {
    rationale += "\n**Areas for Development:**\n";
    result.weaknesses.forEach((w) => (rationale += `- ${w}\n`));
  }

  if (result.recommendations.length > 0) {
    rationale += "\n**Recommendations:**\n";
    result.recommendations.forEach((r) => (rationale += `- ${r}\n`));
  }

  if (result.benchmarkComparison) {
    rationale += `\n**DfE Benchmark:** ${result.benchmarkComparison}`;
  }

  return {
    aiRating: result.rating,
    aiRationale: rationale,
    score: result.score,
  };
}
