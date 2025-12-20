/**
 * MCP Tool: generate_room_brief
 * 
 * Estates Skill (Pilot Skill)
 * 
 * Generates a design brief for a room type based on BB104 guidance.
 * 
 * Logic:
 * 1. Call consult_knowledge_pack('estates', roomType) - £0.00
 * 2. Use retrieved rules as grounding context
 * 3. Call CHEAP LLM (OpenRouter: haiku/mini) to structure brief
 * 4. Output cites BB104 rules explicitly
 * 5. Remains advisory
 * 6. Copy-paste ready
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';
import { handleConsultKnowledgePack } from './knowledge.js';
import { logTelemetry } from '../utils/telemetry.js';
import { 
  callOpenRouter, 
  getDefaultModels, 
  estimateTokenUsage, 
  type OpenRouterError 
} from '../llm/openrouter.js';
import type { Rule } from '../knowledge/schema.js';

// ============================================================================
// ZOD SCHEMA
// ============================================================================

export const GenerateRoomBriefSchema = z.object({
  roomType: z.string()
    .describe('Type of room (e.g., "classroom", "science_lab", "classroom_minimum_area")'),
  constraints: z.string()
    .optional()
    .describe('Additional constraints (e.g., "primary school", "30 pupils", "2 wheelchair users")'),
  ageGroup: z.enum(['primary', 'secondary', 'mixed'])
    .optional()
    .describe('Age group if applicable'),
});

export type GenerateRoomBriefInput = z.infer<typeof GenerateRoomBriefSchema>;

export interface RoomBrief {
  // Structured sections (consultant-grade output)
  project_summary: string;
  intended_use_and_users: string;
  constraints_and_assumptions: string;
  practical_considerations: {
    light?: string;
    acoustics?: string;
    circulation?: string;
    supervision?: string;
    access?: string;
  };
  risks_and_mitigations: string;
  open_questions: string[];
  cited_guidance_used: Array<{
    source: string;
    section: string;
    page?: string;
    authority_level?: 'statutory' | 'guidance' | 'local_policy' | 'trust_standard';
    quote?: string;
  }>;
  // Metadata
  roomType: string;
  warnings: string[];
  generated_at: string;
  llm_used: boolean;
  model?: string;
}

// ============================================================================
// LLM STRUCTURING (CHEAP MODEL)
// ============================================================================

/**
 * Build context from rules for LLM prompt
 */
function buildRulesContext(rules: Rule[]): string {
  return rules.map(rule => {
    const citations = rule.citations.map(c => {
      const authLevel = c.authority_level ? ` (${c.authority_level})` : '';
      return `- ${c.source} ${c.section}${c.page ? `, p.${c.page}` : ''}${authLevel}`;
    }).join('\n');
    
    return `Rule: ${rule.topic}
Applies when: ${rule.applies_when_text}
Content: ${rule.content}
Citations:
${citations}`;
  }).join('\n\n');
}

/**
 * Use cheap LLM to structure the brief with exact headings
 */
async function structureBriefWithLLM(
  rules: Rule[],
  roomType: string,
  constraints: string | undefined,
  ageGroup: string | undefined
): Promise<{ brief: Omit<RoomBrief, 'warnings' | 'generated_at' | 'llm_used' | 'model'>; model: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const models = getDefaultModels();
  const rulesContext = buildRulesContext(rules);
  
  const systemPrompt = `You are a school estates consultant. Structure design briefs using ONLY the provided guidance rules. 
CRITICAL RULES:
- Use advisory language: "suggests", "indicates", "should", "considers"
- NEVER use "must" or "requires" unless the citation has authority_level='statutory' AND you're directly quoting that statutory requirement
- Preserve citations verbatim with their authority_level
- Structure output as JSON with these exact keys:
  - project_summary: Brief overview
  - intended_use_and_users: Who will use the space and how
  - constraints_and_assumptions: Known constraints and assumptions
  - practical_considerations: Object with keys: light, acoustics, circulation, supervision, access (all optional strings)
  - risks_and_mitigations: Risks and how to address them
  - open_questions: Array of strings
  - cited_guidance_used: Array of objects with: source, section, page (optional), authority_level (optional), quote (optional, max 25 words)
  
Return ONLY valid JSON, no markdown, no code blocks.`;

  const userPrompt = `Generate a design brief for: ${roomType}
${constraints ? `Constraints: ${constraints}` : ''}
${ageGroup ? `Age group: ${ageGroup}` : ''}

Guidance rules to use:
${rulesContext}

Structure the brief using the exact headings above. Include all citations from the rules in cited_guidance_used.`;

  try {
    const response = await callOpenRouter({
      model: models.cheap,
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.3, // Lower temperature for more consistent structure
      maxTokens: 2000,
    });

    // Parse JSON response
    let parsed: any;
    try {
      // Remove markdown code blocks if present
      const cleaned = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      throw new Error(`Failed to parse LLM response as JSON: ${parseError}`);
    }

    // Validate structure
    const brief: Omit<RoomBrief, 'warnings' | 'generated_at' | 'llm_used' | 'model'> = {
      project_summary: parsed.project_summary || '',
      intended_use_and_users: parsed.intended_use_and_users || '',
      constraints_and_assumptions: parsed.constraints_and_assumptions || '',
      practical_considerations: parsed.practical_considerations || {},
      risks_and_mitigations: parsed.risks_and_mitigations || '',
      open_questions: Array.isArray(parsed.open_questions) ? parsed.open_questions : [],
      cited_guidance_used: Array.isArray(parsed.cited_guidance_used) ? parsed.cited_guidance_used : [],
      roomType,
    };

    return {
      brief,
      model: response.model,
      usage: response.usage,
    };
  } catch (error) {
    if (error instanceof Error && 'error_code' in error) {
      throw error; // Re-throw OpenRouter errors
    }
    throw new Error(`LLM structuring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate brief without LLM (when no rules found)
 */
function generateBriefWithoutRules(
  roomType: string,
  constraints: string | undefined,
  ageGroup: string | undefined
): Omit<RoomBrief, 'warnings' | 'generated_at' | 'llm_used' | 'model'> {
  return {
    project_summary: `Design brief for ${roomType}. No specific guidance found in knowledge base.`,
    intended_use_and_users: `To be determined based on school requirements.${ageGroup ? ` Age group: ${ageGroup}.` : ''}`,
    constraints_and_assumptions: constraints || 'No constraints specified.',
    practical_considerations: {},
    risks_and_mitigations: 'No guidance available - verify all requirements from official sources (BB104, Building Regulations, etc.).',
    open_questions: [
      'What is the expected pupil capacity?',
      'Are there any SEND provisions required?',
      'What are the accessibility requirements?',
      'What measurements or photos are needed to assess the space?',
      'What are the specific functional requirements?',
    ],
    cited_guidance_used: [],
    roomType,
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export async function handleGenerateRoomBrief(
  args: GenerateRoomBriefInput,
  context: AuthContext,
  requestId?: string,
  sessionId?: string
): Promise<RoomBrief> {
  const startTime = Date.now();
  const { roomType, constraints, ageGroup } = args;
  let llmUsed = false;
  let model: string | undefined;
  let usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;
  let outcome: 'success' | 'no_rules_found' | 'rules_filtered_no_citations' | 'error' = 'success';
  let errorCode: string | undefined;
  
  try {
    // Step 1: Retrieve knowledge pack rules (deterministic, £0.00)
    const knowledgeResult = await handleConsultKnowledgePack(
      {
        domain: 'estates',
        topic: roomType,
        context: constraints || (ageGroup ? `${ageGroup} school` : undefined),
      },
      context,
      requestId,
      sessionId
    );
    
    // Step 2: Check if we should call LLM
    const shouldCallLLM = 
      knowledgeResult.rules.length > 0 && 
      knowledgeResult.pack.confidence_level !== 'draft';
    
    let brief: Omit<RoomBrief, 'warnings' | 'generated_at' | 'llm_used' | 'model'>;
    
    if (!shouldCallLLM) {
      // No rules found or rules filtered - don't call LLM
      brief = generateBriefWithoutRules(roomType, constraints, ageGroup);
      outcome = knowledgeResult.rules.length === 0 
        ? 'no_rules_found' 
        : 'rules_filtered_no_citations';
    } else {
      // Rules exist - call LLM to structure
      llmUsed = true;
      const llmResult = await structureBriefWithLLM(
        knowledgeResult.rules,
        roomType,
        constraints,
        ageGroup
      );
      brief = llmResult.brief;
      model = llmResult.model;
      usage = llmResult.usage;
      outcome = 'success';
    }
    
    // Step 3: Combine with warnings from knowledge pack
    const result: RoomBrief = {
      ...brief,
      warnings: knowledgeResult.warnings,
      generated_at: new Date().toISOString(),
      llm_used: llmUsed,
      model,
    };
    
    // Log telemetry
    const duration = Date.now() - startTime;
    const tokenUsage = usage || (llmUsed ? {
      prompt_tokens: estimateTokenUsage(JSON.stringify(brief)),
      completion_tokens: estimateTokenUsage(JSON.stringify(brief)),
      total_tokens: estimateTokenUsage(JSON.stringify(brief)) * 2,
    } : undefined);
    
    await logTelemetry(
      {
        tool_name: 'generate_room_brief',
        used_llm: llmUsed,
        model: model || undefined,
        timestamp: new Date().toISOString(),
        organization_id: context.organizationId,
        user_id: context.userId,
        duration_ms: duration,
        request_id: requestId,
        session_id: sessionId,
        outcome,
        error_code: errorCode,
        token_usage: tokenUsage,
      },
      context.supabase
    );
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    outcome = 'error';
    
    if (error instanceof Error && 'error_code' in error) {
      errorCode = (error as OpenRouterError).error_code;
    } else {
      errorCode = 'UNKNOWN_ERROR';
    }
    
    // Log error telemetry
    await logTelemetry(
      {
        tool_name: 'generate_room_brief',
        used_llm: llmUsed,
        model: model || undefined,
        timestamp: new Date().toISOString(),
        organization_id: context.organizationId,
        user_id: context.userId,
        duration_ms: duration,
        request_id: requestId,
        session_id: sessionId,
        outcome: 'error',
        error_code: errorCode,
        token_usage: usage,
      },
      context.supabase
    );
    
    throw error;
  }
}

