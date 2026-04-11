/**
 * OpenRouter + Guardian wrapper
 *
 * Every AI call made through this wrapper:
 *   1. Passes input messages through SchoolDataGuardian.scrub()
 *   2. Sends the scrubbed messages to OpenRouter
 *   3. Rehydrates tokens in the response using the captured tokenMap
 *   4. Writes an audit entry to guardian_audit_log
 *
 * This is the ONLY sanctioned way for Phase 2.1+ code to call an LLM. Direct
 * fetch to OpenRouter is a Phase 2.2 migration target (see the audit doc for
 * the list of 17 bypass routes).
 */

import { SchoolDataGuardian, type GuardianCategory, type GuardianResult } from '../school-data-guardian';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GuardianCallOptions {
  model: string;                          // e.g. 'google/gemini-2.5-flash'
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  orgId: string;
  callerName: string;                     // for audit log
  skipCategories?: GuardianCategory[];
  allowlist?: string[];                   // public strings that must pass through
  rehydrateOutput?: boolean;              // default true
}

export interface GuardianCallResult {
  content: string;                        // rehydrated response
  rawContent: string;                     // raw response before rehydration
  tokensUsed: number;
  model: string;
  guardianResult: GuardianResult;         // what Guardian did to the input
}

export async function callOpenRouterWithGuardian(
  options: GuardianCallOptions,
): Promise<GuardianCallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  // 1. Scrub every message through the Guardian, merging the token maps.
  const combinedTokenMap = new Map<string, string>();
  const scrubbedCounts: Record<string, number> = {};
  const scrubbedCategories = new Set<GuardianCategory>();
  let inputLength = 0;

  const scrubbedMessages: ChatMessage[] = options.messages.map((msg) => {
    inputLength += msg.content.length;
    const result = SchoolDataGuardian.scrub(msg.content, {
      skipCategories: options.skipCategories,
      allowlist: options.allowlist,
      callerName: options.callerName,
      orgId: options.orgId,
    });
    for (const [token, original] of result.tokenMap.entries()) {
      combinedTokenMap.set(token, original);
    }
    for (const [cat, n] of Object.entries(result.counts)) {
      scrubbedCounts[cat] = (scrubbedCounts[cat] ?? 0) + n;
    }
    for (const cat of result.categoriesDetected) {
      scrubbedCategories.add(cat);
    }
    return { role: msg.role, content: result.sanitised };
  });

  const guardianResult: GuardianResult = {
    sanitised: scrubbedMessages.map((m) => m.content).join('\n'),
    tokenMap: combinedTokenMap,
    isClean: combinedTokenMap.size === 0,
    categoriesDetected: Array.from(scrubbedCategories),
    counts: scrubbedCounts,
  };

  // 2. Call OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://schoolgle.co.uk',
      'X-Title': 'Schoolgle Document Generation',
    },
    body: JSON.stringify({
      model: options.model,
      messages: scrubbedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const rawContent: string = data.choices?.[0]?.message?.content ?? '';
  const tokensUsed: number = data.usage?.total_tokens ?? 0;

  // 3. Rehydrate output (optional — default on)
  const shouldRehydrate = options.rehydrateOutput !== false;
  const content = shouldRehydrate
    ? SchoolDataGuardian.rehydrate(rawContent, combinedTokenMap)
    : rawContent;

  // 4. Audit log — best effort
  await SchoolDataGuardian.logAudit(
    guardianResult,
    inputLength,
    rawContent.length,
    { orgId: options.orgId, callerName: options.callerName },
  );

  return {
    content,
    rawContent,
    tokensUsed,
    model: options.model,
    guardianResult,
  };
}
