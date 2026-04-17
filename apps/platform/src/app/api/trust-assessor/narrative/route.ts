import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY,
});

const MODEL = 'anthropic/claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are a senior School Improvement Partner with 20 years of experience in UK primary education. You write concise, professional board reports for trustees and governors.

Your writing style:
- Clear, direct, professional English — no jargon soup
- Lead with the most important finding
- Use specific numbers but embed them naturally in sentences
- Frame concerns as questions for leaders, not accusations
- Acknowledge context (FSM, SEND, cohort size) before making judgements
- When data looks positive, say so — don't only focus on problems
- Maximum 4-5 paragraphs per school summary
- Maximum 3-4 paragraphs for the trust overview

You are writing for an audience of headteachers, governors, and trust board members who are intelligent but may not be data specialists. They need to understand what the data means, not just what the numbers are.

IMPORTANT: Every claim must be traceable to the data provided. Do not invent statistics or make assumptions beyond what the data shows. If data is missing, say so.`;

/**
 * POST /api/trust-assessor/narrative
 * Generates AI narrative summaries for trust and per-school data.
 *
 * Body: {
 *   type: 'trust-overview' | 'school',
 *   schoolAbbrev?: string,
 *   data: { ... computed metrics ... }
 * }
 *
 * Returns: { narrative: string, generatedAt: string, model: string }
 */
export const POST = protectedRoute(async (_auth, req: NextRequest) => {
  const body = await req.json();
  const { type, schoolAbbrev, data } = body;

  if (!type || !data) {
    return apiError('type and data are required', 400);
  }

  let userPrompt = '';

  if (type === 'trust-overview') {
    userPrompt = `Write a trust-wide overview for a multi-academy trust board report.

Trust data (from the trust's own mid-year data capture spreadsheet — self-reported, not externally validated):

${JSON.stringify(data, null, 2)}

Write 3-4 paragraphs covering:
1. Overall trust performance summary — where does the trust stand?
2. Key strengths — which schools or year groups are performing well?
3. Key concerns — what patterns need attention across the trust?
4. Strategic questions for the board to consider

Be specific. Use school abbreviations and actual percentages from the data.`;
  } else if (type === 'school') {
    userPrompt = `Write a school-specific assessment summary for ${schoolAbbrev} for inclusion in a trust board report.

School data (from the trust's mid-year data capture spreadsheet — self-reported, not externally validated):

${JSON.stringify(data, null, 2)}

Write 4-5 paragraphs covering:
1. Context — school size, disadvantage level (FSM%), SEND%, how this compares to the trust average
2. Strengths — what is this school doing well based on the data?
3. Concerns — where are the gaps, inconsistencies, or areas below expectation?
4. Specific questions for the school's leadership to address
5. If there are any data quality issues, note them

Be direct but fair. If high FSM or SEND explains weaker headline figures, say so. If it doesn't explain them, say that too. Use the actual numbers.`;
  } else {
    return apiError('type must be trust-overview or school', 400);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    });

    const narrative = completion.choices[0]?.message?.content ?? 'Unable to generate narrative.';
    const model = completion.model ?? MODEL;

    return apiSuccess({
      narrative,
      generatedAt: new Date().toISOString(),
      model,
      type,
      schoolAbbrev,
    });
  } catch (err) {
    console.error('[trust-assessor/narrative] AI error:', err);
    return apiError(
      `Failed to generate narrative: ${err instanceof Error ? err.message : 'Unknown error'}`,
      500,
    );
  }
}, { orgOptional: true });
