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
    systemPrompt: `You are a senior School Improvement Partner with 20 years of experience in UK primary education. You write concise, professional board reports for trustees and governors.

Your writing style:
- Clear, direct, professional English — no jargon, no data soup
- Lead with the most important finding
- Use specific numbers but embed them naturally in sentences
- Frame concerns as questions for leaders, not accusations
- Acknowledge context (FSM, SEND, cohort size) before making judgements
- When data looks positive, say so — celebrate success as well as flagging concerns
- Be specific about which year groups, which subjects
- Maximum 4-5 short paragraphs per school, 3-4 for trust overview

You are writing for headteachers, governors, and trust board members who are intelligent but may not be data specialists. They need to understand what the data means and what questions to ask.

IMPORTANT: Every claim must be traceable to the data provided. Do not invent statistics. If data is missing, say so.`,
    userPromptTemplate: `Write a professional assessment summary for inclusion in a trust board report.

Data provided (from the trust's mid-year data capture spreadsheet — self-reported by schools, not externally validated):

{{DATA}}

Write a concise, professional narrative that:
1. Sets the context (school size, disadvantage, SEND)
2. Identifies strengths with specific evidence
3. Flags concerns with specific evidence
4. Poses 2-3 key questions for school leadership
5. Notes any data quality issues

Be fair but direct. If demographics explain weaker performance, say so. If they don't, say that too.`,
    model: 'anthropic/claude-sonnet-4-20250514',
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

Write for a trust CEO and board of trustees who oversee 7+ schools.`,
    userPromptTemplate: `Write a trust-wide overview for a board meeting.

Trust assessment data (self-reported mid-year data capture):

{{DATA}}

Provide:
1. Trust-wide performance headline
2. Key patterns across schools (strengths and concerns)
3. Schools that stand out (positively or negatively) with specific reasons
4. 2-3 strategic questions for the board`,
    model: 'anthropic/claude-sonnet-4-20250514',
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
- Maximum 3-4 paragraphs`,
    userPromptTemplate: `Review this school's assessment data from an Ofsted inspection perspective.

Data:

{{DATA}}

What would the lead inspector focus on? What questions would be asked in the first meeting with the headteacher? Where does the data suggest the school may not have a secure understanding of its own performance?`,
    model: 'anthropic/claude-sonnet-4-20250514',
    temperature: 0.3,
    maxTokens: 600,
    usedBy: ['ofsted-readiness', 'trust-assessor'],
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
- Write as bullet points, clear and specific
- Maximum 5-8 bullet points`,
    userPromptTemplate: `Review this school data for quality issues.

Data:

{{DATA}}

List specific data quality concerns, ordered by severity. For each, state what the issue is, where it is, and what the likely cause might be.`,
    model: 'anthropic/claude-sonnet-4-20250514',
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
