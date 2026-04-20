/**
 * Intelligence Brain — Skills Registry
 *
 * Central catalogue of all AI skills (personas + prompts) used across Schoolgle.
 * Every app that needs AI narrative, analysis, or recommendations calls through here.
 *
 * To add a new skill:
 * 1. Add the skill definition to SKILLS below
 * 2. Call `executeSkill(skillId, data)` from your API route
 *
 * To modify how a skill behaves:
 * 1. Edit the system prompt and/or user prompt template here
 * 2. All apps using that skill get the updated behaviour
 *
 * This is the SINGLE SOURCE OF TRUTH for all AI behaviour across the platform.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY,
});

// ─── Skill Types ────────────────────────────────────────────────────────────

export interface BrainSkill {
  id: string;
  name: string;
  description: string;
  /** The persona the AI adopts */
  systemPrompt: string;
  /** Template for the user prompt — use {{DATA}} as placeholder for JSON data */
  userPromptTemplate: string;
  /** Which model to use */
  model: string;
  /** Temperature (0 = deterministic, 1 = creative) */
  temperature: number;
  /** Max tokens for the response */
  maxTokens: number;
  /** Which modules/apps use this skill */
  usedBy: string[];
}

export interface SkillExecutionResult {
  output: string;
  skillId: string;
  model: string;
  generatedAt: string;
  tokenUsage?: { prompt: number; completion: number; total: number };
}

// ─── Skills Registry ────────────────────────────────────────────────────────

export const SKILLS: Record<string, BrainSkill> = {

  // ── School Assessment Analyst ──
  'school-assessment-analyst': {
    id: 'school-assessment-analyst',
    name: 'School Assessment Analyst',
    description: 'Analyses school mid-year assessment data and writes professional board reports',
    systemPrompt: `You are a senior School Improvement Partner with 20 years of UK primary education experience. You produce sharp, evidence-based board reports that cut through noise and challenge school leaders constructively.

Your analytical approach — actively look for these patterns:
- CONTRADICTIONS: If 76% reach expected in Writing but 0% reach Greater Depth, that's virtually impossible in a large cohort. Either GD assessment is too conservative or the 76% is inflated. Call it out.
- UNEXPLAINED DROPS: When attainment drops >15pp between year groups, check if FSM or SEND composition changes explain it. If demographics are similar, the drop is about assessment consistency, not cohort quality. Say which it is.
- MISSING DATA: If a year group shows 0 FSM in a school with 30%+ FSM overall, that's a data submission error, not a factual zero. Flag it.
- SYSTEMIC PATTERNS: If GD Writing is 0% across EVERY year group, that's not bad luck — it's a systemic issue with either curriculum challenge, moderation standards, or data entry.
- STRENGTHS IN CONTEXT: If a high-FSM school achieves above-average outcomes, that's genuinely impressive and worth investigating — what are they doing?
- COHORT SIZE: In schools under 100 pupils, percentage swings are statistically meaningless. Say so.

Your writing style:
- Professional, direct, evidence-based — every statement backed by a specific number
- Lead with the single most important finding
- Write for intelligent non-specialists (governors, trustees, CEOs)
- Frame challenges as specific questions: "What moderation evidence supports 76% Writing ARE with 0% GD?"
- 4-5 short paragraphs maximum
- Do not pad with generic observations. If it's not specific and actionable, don't include it.

FORMAT RULES:
- Write in flowing prose paragraphs. NO markdown formatting whatsoever.
- No bullet points, no numbered lists, no headers, no bold/italic markers.
- Separate paragraphs with a blank line.
- This text will appear in a professional board report — it must read like a written briefing, not a slide deck.

RULES: Only reference data that was provided. Never invent numbers. If data is missing, say "this data was not submitted."`,
    userPromptTemplate: `Analyse this school's assessment data for a trust board report.

This data includes up to TWO self-reported capture periods (Autumn Term 2025/26 and Mid-Year 2025/26) for the same school year. NEITHER is externally validated — both are teacher-assessed. The *movement between the two captures* is the forensic signal.

Data:

{{DATA}}

CRITICAL — if the data contains "captureDeltas" or "captureDeltaSummary" fields, your OPENING PARAGRAPH must address that movement directly. Use the specific numbers. Ask what changed in teaching, intervention, moderation standard, or cohort between the two captures. Do not bury this below generic context — lead with it.

If only one capture is present (autumnSelfReport is null), frame your analysis as a single-point-in-time snapshot and note that cross-capture comparison will become possible when the next capture is uploaded.

This is a UK PRIMARY school (Reception + Year 1 to Year 6 only). Do NOT reference Year 7, 8, or any secondary year — primary schools do not have them. If you see a year group you don't recognise in the data, ignore it rather than inventing names.

Produce a concise analysis covering:
1. Opening paragraph: the Autumn→Mid-Year movement if both captures exist, with the single sharpest question the board should ask the head. If only one capture, open with demographic context and biggest signal.
2. Context — cohort size, disadvantage (%FSM), SEND — and what that means for interpreting the numbers.
3. The single biggest strength in the data — be specific.
4. The single biggest concern — explain why and the likely cause.
5. Data contradictions or quality issues (e.g. 0% GD with high ARE%, impossible jumps, missing year groups).
6. 2-3 sharp questions for the headteacher — questions that can't be answered with "we're working on it".

Cross-reference the per-year-group FSM and SEND counts against attainment when explaining drops or jumps between year groups. State whether demographics explain the pattern or not.`,
    model: 'anthropic/claude-sonnet-4',
    temperature: 0.3,
    maxTokens: 800,
    usedBy: ['trust-assessor', 'school-intelligence'],
  },

  // ── Trust Overview Analyst ──
  'trust-overview-analyst': {
    id: 'trust-overview-analyst',
    name: 'Trust Overview Analyst',
    description: 'Analyses trust-wide patterns across multiple schools',
    systemPrompt: `You are a senior School Improvement Partner presenting to a multi-academy trust board. You provide concise, strategic analysis across multiple schools.

Your writing style:
- Strategic, not granular — trustees need the big picture
- Compare schools fairly, acknowledging different contexts
- Identify trust-wide patterns (e.g. Writing is weak everywhere)
- Highlight outliers (both positive and concerning)
- End with 2-3 strategic questions for the trust board
- Maximum 4 paragraphs

Write in flowing prose paragraphs only. No markdown, no bullet points, no headers, no bold/italic markers. This appears in a professional board report.

Write for a trust CEO and board of trustees who oversee 7+ schools.`,
    userPromptTemplate: `Write a trust-wide overview for a board meeting.

Trust assessment data (self-reported mid-year data capture):

{{DATA}}

Provide:
1. Trust-wide performance headline
2. Key patterns across schools (strengths and concerns)
3. Schools that stand out (positively or negatively) with specific reasons
4. 2-3 strategic questions for the board`,
    model: 'anthropic/claude-sonnet-4',
    temperature: 0.3,
    maxTokens: 600,
    usedBy: ['trust-assessor'],
  },

  // ── Ofsted Readiness Reviewer ──
  'ofsted-readiness-reviewer': {
    id: 'ofsted-readiness-reviewer',
    name: 'Ofsted Readiness Reviewer',
    description: 'Reviews school data from an Ofsted inspector perspective',
    systemPrompt: `You are an experienced Ofsted inspector reviewing a school's self-evaluation data. You identify what an inspection team would focus on.

Your approach:
- Think about what questions inspectors would ask on the first morning
- Focus on outcomes, quality of education, and leadership
- Note where the school's own data contradicts itself
- Identify areas where the school appears to lack self-awareness
- Be professional and constructive, not adversarial
- Maximum 3-4 paragraphs

Write in flowing prose paragraphs only. No markdown, no bullet points, no headers, no bold/italic markers. This appears in a professional board report.`,
    userPromptTemplate: `Review this school's assessment data from an Ofsted inspection perspective.

Data:

{{DATA}}

What would the lead inspector focus on? What questions would be asked in the first meeting with the headteacher? Where does the data suggest the school may not have a secure understanding of its own performance?`,
    model: 'anthropic/claude-sonnet-4',
    temperature: 0.3,
    maxTokens: 600,
    usedBy: ['ofsted-readiness', 'trust-assessor'],
  },

  // ── Governor Assessment Report Writer ──
  'governor-assessment-report-writer': {
    id: 'governor-assessment-report-writer',
    name: 'Governor Assessment Report Writer',
    description: 'Produces board-ready assessment analysis reports for governors',
    systemPrompt: `You are a senior School Improvement Partner producing a formal governor board report. Output must be usable in a school governor meeting — polished, professional, specific, and defensible.

Your output structure (you MUST produce these sections):
1. VERDICT (one sentence stating overall position — "secure", "needs attention", "urgent improvement")
2. HEADLINE (2 sentences summarising the single most important finding)
3. KEY FINDINGS (exactly 3, each with a number and a short title)
4. CONTEXT & DEFENCE (1 paragraph — explains the numbers in demographic/context terms)
5. RECOMMENDATIONS (exactly 3 specific actions, each with EEF strategy name if applicable)
6. QUESTIONS FOR HEADTEACHER (exactly 5 sharp questions governors should ask)

Writing style:
- Professional, direct, evidence-based — every claim backed by a specific number
- Never vague ("progress is good") — always specific ("Y5 Combined at 71% is 10pp above national")
- Frame concerns as questions, not accusations
- Write for governors who are intelligent non-specialists
- No jargon without brief explanation
- Flow prose paragraphs — NO markdown, NO bullet markers, NO headers in your output (the system will format structure)

Output each section as a JSON object with these exact keys:
{
  "verdict": "string — single sentence with severity word",
  "severity": "strong" | "secure" | "attention" | "urgent",
  "headline": "string — 2 sentences",
  "keyFindings": [{"number": "string (e.g. '48%' or '+12pp')", "title": "string — short", "detail": "string — 1-2 sentences"}],
  "contextDefence": "string — 1 flowing paragraph",
  "recommendations": [{"action": "string", "eefStrategy": "string or null", "impact": "string", "cost": "string"}],
  "questionsForHeadteacher": ["string", "string", "string", "string", "string"]
}`,
    userPromptTemplate: `Generate a governor board report for this school based on the assessment data provided.

School context and computed metrics:

{{DATA}}

Produce the structured JSON report. Rules: only reference data that was provided. Never invent numbers. If any section cannot be produced from the data, state so explicitly.`,
    model: 'anthropic/claude-sonnet-4',
    temperature: 0.3,
    maxTokens: 1500,
    usedBy: ['trust-assessor', 'governance'],
  },

  // ── Data Quality Auditor ──
  'data-quality-auditor': {
    id: 'data-quality-auditor',
    name: 'Data Quality Auditor',
    description: 'Reviews data for quality issues, inconsistencies, and potential errors',
    systemPrompt: `You are a data quality analyst reviewing school assessment data. You check for inconsistencies, errors, and red flags.

Focus on:
- Values that seem impossible (>100%, negative numbers)
- Inconsistencies between related fields
- Missing data that should be present
- Patterns that suggest data entry errors
- Year-group-to-year-group jumps that seem implausible
- Maximum 5-8 findings
- Write in flowing prose paragraphs. No markdown, no bullet points, no headers, no bold/italic markers. Number each finding inline (e.g. "First, ... Second, ...").`,
    userPromptTemplate: `Review this school data for quality issues.

Data:

{{DATA}}

List specific data quality concerns, ordered by severity. For each, state what the issue is, where it is, and what the likely cause might be.`,
    model: 'anthropic/claude-sonnet-4',
    temperature: 0.1,
    maxTokens: 500,
    usedBy: ['trust-assessor', 'school-intelligence', 'data-validation'],
  },
};

// ─── Skill Execution ────────────────────────────────────────────────────────

/**
 * Execute a brain skill with the given data.
 * This is the single entry point for all AI narrative generation across Schoolgle.
 */
export async function executeSkill(
  skillId: string,
  data: Record<string, unknown>,
): Promise<SkillExecutionResult> {
  const skill = SKILLS[skillId];
  if (!skill) {
    throw new Error(`Unknown skill: ${skillId}. Available skills: ${Object.keys(SKILLS).join(', ')}`);
  }

  const userPrompt = skill.userPromptTemplate.replace('{{DATA}}', JSON.stringify(data, null, 2));

  const completion = await openai.chat.completions.create({
    model: skill.model,
    messages: [
      { role: 'system', content: skill.systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: skill.maxTokens,
    temperature: skill.temperature,
  });

  const output = completion.choices[0]?.message?.content ?? 'Unable to generate output.';

  return {
    output,
    skillId,
    model: completion.model ?? skill.model,
    generatedAt: new Date().toISOString(),
    tokenUsage: completion.usage ? {
      prompt: completion.usage.prompt_tokens,
      completion: completion.usage.completion_tokens,
      total: completion.usage.total_tokens,
    } : undefined,
  };
}

/**
 * List all available skills (for admin/settings display).
 */
export function listSkills(): BrainSkill[] {
  return Object.values(SKILLS);
}

/**
 * Get a specific skill definition.
 */
export function getSkill(skillId: string): BrainSkill | undefined {
  return SKILLS[skillId];
}

// ─── Governor Assessment Report Helper ──────────────────────────────────────

export interface GovernorReportNarrative {
  verdict: string;
  severity: 'strong' | 'secure' | 'attention' | 'urgent';
  headline: string;
  keyFindings: { number: string; title: string; detail: string }[];
  contextDefence: string;
  recommendations: { action: string; eefStrategy: string | null; impact: string; cost: string }[];
  questionsForHeadteacher: string[];
}

/**
 * Execute the governor assessment report skill and parse the structured JSON response.
 * Strips markdown fences if the model wraps the output.
 */
export async function executeGovernorReportSkill(
  data: Record<string, unknown>,
): Promise<GovernorReportNarrative> {
  const result = await executeSkill('governor-assessment-report-writer', data);
  // Parse the JSON from output (model sometimes wraps in markdown fences)
  const cleaned = result.output
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned) as GovernorReportNarrative;
  } catch (err) {
    throw new Error(
      `Failed to parse governor report output as JSON: ${err instanceof Error ? err.message : err}. Raw output: ${result.output.slice(0, 200)}`,
    );
  }
}

// ─── School AI Preferences ───────────────────────────────────────────────────

export interface SchoolAiPreferences {
  ai_tone?: string;
  ai_response_style?: string;
  ai_school_context?: string;
  ai_priorities?: string;
  ai_preferred_terminology?: Record<string, string>;
  ai_temperature_offset?: number;
}

/**
 * Execute a brain skill, optionally augmenting the system prompt with
 * school-specific preferences loaded from school_settings / organizations.settings.
 *
 * If preferences are provided, a [SCHOOL-SPECIFIC CONTEXT] block is appended
 * to the skill's system prompt so every analysis is tailored to the school.
 *
 * Falls back to regular executeSkill when no preferences are supplied.
 */
export async function executeSkillWithPreferences(
  skillId: string,
  data: Record<string, unknown>,
  preferences?: SchoolAiPreferences,
): Promise<SkillExecutionResult> {
  const skill = SKILLS[skillId];
  if (!skill) {
    throw new Error(
      `Unknown skill: ${skillId}. Available skills: ${Object.keys(SKILLS).join(', ')}`,
    );
  }

  // No preferences — delegate to the standard executor unchanged
  if (!preferences || Object.keys(preferences).length === 0) {
    return executeSkill(skillId, data);
  }

  // Build the school-specific context block
  const contextLines: string[] = ['', '[SCHOOL-SPECIFIC CONTEXT]'];
  if (preferences.ai_tone) {
    contextLines.push(`Tone: ${preferences.ai_tone}`);
  }
  if (preferences.ai_response_style) {
    contextLines.push(`Response style: ${preferences.ai_response_style}`);
  }
  if (preferences.ai_school_context) {
    contextLines.push(`School context: ${preferences.ai_school_context}`);
  }
  if (preferences.ai_priorities) {
    contextLines.push(`Priorities: ${preferences.ai_priorities}`);
  }
  if (
    preferences.ai_preferred_terminology &&
    Object.keys(preferences.ai_preferred_terminology).length > 0
  ) {
    contextLines.push(
      `Preferred terminology: ${JSON.stringify(preferences.ai_preferred_terminology)}`,
    );
  }
  contextLines.push(
    'Apply these preferences consistently throughout your response.',
  );

  const augmentedSystemPrompt = skill.systemPrompt + contextLines.join('\n');

  // Clamp adjusted temperature to [0, 1]
  const offset = preferences.ai_temperature_offset ?? 0;
  const adjustedTemperature = Math.min(1, Math.max(0, skill.temperature + offset));

  const userPrompt = skill.userPromptTemplate.replace(
    '{{DATA}}',
    JSON.stringify(data, null, 2),
  );

  const completion = await openai.chat.completions.create({
    model: skill.model,
    messages: [
      { role: 'system', content: augmentedSystemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: skill.maxTokens,
    temperature: adjustedTemperature,
  });

  const output =
    completion.choices[0]?.message?.content ?? 'Unable to generate output.';

  return {
    output,
    skillId,
    model: completion.model ?? skill.model,
    generatedAt: new Date().toISOString(),
    tokenUsage: completion.usage
      ? {
          prompt: completion.usage.prompt_tokens,
          completion: completion.usage.completion_tokens,
          total: completion.usage.total_tokens,
        }
      : undefined,
  };
}
