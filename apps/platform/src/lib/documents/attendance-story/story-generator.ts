import { callOpenRouterWithGuardian } from '@/lib/ai/openrouter-guardian';
import type { AttendanceStoryData } from './types';
import { buildAttendancePrompt } from './prompt-builder';

export interface GenerateStoryResult {
  narrative: string;
  model: string;
  tokensUsed: number;
  guardianCategoriesDetected: string[];
}

/**
 * Generate an attendance narrative via OpenRouter + Guardian.
 * Uses Gemini 2.5 Flash by default — passed through the full Guardian pipeline.
 * Does NOT do any analysis itself — the LLM does all the work from real data.
 */
export async function generateAttendanceNarrative(
  data: AttendanceStoryData,
  orgId: string,
  model: string = 'google/gemini-2.5-flash',
): Promise<GenerateStoryResult> {
  const { system, user, allowlist } = buildAttendancePrompt(data);

  const result = await callOpenRouterWithGuardian({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.6,
    maxTokens: 1500,
    orgId,
    callerName: 'attendance-story-generator',
    allowlist,
    rehydrateOutput: true,
  });

  return {
    narrative: result.content,
    model: result.model,
    tokensUsed: result.tokensUsed,
    guardianCategoriesDetected: result.guardianResult.categoriesDetected,
  };
}
