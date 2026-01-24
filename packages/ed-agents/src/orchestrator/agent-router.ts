/**
 * Agent Router
 * Routes questions to appropriate specialist agent and generates LLM responses
 */

import type {
  AppContext,
  SpecialistId,
  AgentResponse,
  SchoolContext,
} from '../types';
import { AGENTS, getAgent } from '../agents';
import { classifyIntent } from './intent-classifier';
import { queryKnowledgeBase } from '../knowledge-base/query';
import { getModelRouter } from '../models';
import { buildEnrichedPrompt, getTypeSpecificGuidance, buildSchoolContextBlock } from './context-loader';

/**
 * Route question to appropriate specialist and get response
 */
export async function routeToSpecialist(
  question: string,
  context: AppContext
): Promise<AgentResponse> {
  // 1. Classify intent
  const classification = classifyIntent(
    question,
    context.activeApp,
    context.userRole
  );

  // 2. Check if user has access to this feature
  if (!hasFeatureAccess(context, classification.domain)) {
    return {
      agentId: 'ed-general',
      content: getUpgradeMessage(classification.domain),
      confidence: 'HIGH',
      requiresHuman: false,
      metadata: { blocked: 'feature_access' },
    };
  }

  // 3. Check knowledge base first (for high-confidence factual queries)
  if (classification.confidence > 0.7 && classification.isWorkRelated) {
    const cached = await queryKnowledgeBase(question, classification.domain);
    if (cached && cached.confidence === 'HIGH') {
      return {
        agentId: classification.specialist,
        content: formatCachedResponse(cached),
        sources: [{
          name: cached.sourceName,
          url: cached.sourceUrl,
          type: cached.sourceType,
          lastVerified: cached.lastVerified,
        }],
        confidence: cached.confidence,
        metadata: { cached: true, knowledgeId: cached.id },
      };
    }
  }

  // 4. Get specialist agent definition
  const agent = getAgent(classification.specialist);
  if (!agent) {
    throw new Error(`Specialist not found: ${classification.specialist}`);
  }

  // 5. Build enriched prompt with school context
  const enrichedPrompt = buildSpecialistPrompt(
    agent.systemPrompt,
    context.schoolData,
    question
  );

  // 6. Call LLM via OpenRouter
  const modelRouter = getModelRouter(context.openRouterApiKey);
  const model = modelRouter.selectModel('specialist-response', context);

  try {
    const llmResponse = await modelRouter.chat(
      enrichedPrompt,
      question,
      {
        model: model.id,
        temperature: 0.7,
        maxTokens: 2048,
      }
    );

    // 7. Format response
    return {
      agentId: classification.specialist,
      content: llmResponse.content,
      sources: [{
        name: `${agent.name} (AI)`,
        type: 'AI Specialist',
      }],
      confidence: 'MEDIUM',
      metadata: {
        classification,
        modelUsed: model.id,
        tokensUsed: {
          input: llmResponse.usage.promptTokens,
          output: llmResponse.usage.completionTokens,
          total: llmResponse.usage.totalTokens,
        },
      },
    };

  } catch (error) {
    // Handle LLM errors gracefully
    return {
      agentId: classification.specialist,
      content: getErrorMessage(error),
      confidence: 'LOW',
      requiresHuman: true,
      metadata: {
        classification,
        modelUsed: model.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Build specialist prompt with school context
 */
function buildSpecialistPrompt(
  basePrompt: string,
  schoolContext: SchoolContext | null | undefined,
  question: string
): string {
  let prompt = basePrompt;

  // Add school context if available
  if (schoolContext) {
    const contextBlock = buildSchoolContextBlock(schoolContext);
    prompt = `${contextBlock}\n\n${prompt}`;

    // Add type-specific guidance
    const typeGuidance = getTypeSpecificGuidance(schoolContext);
    if (typeGuidance.length > 0) {
      prompt = `${prompt}\n\n## Additional Context for This School\n\n${typeGuidance.join('\n')}`;
    }
  }

  return prompt;
}

/**
 * Check if user has access to the feature/domain
 */
function hasFeatureAccess(context: AppContext, domain: string): boolean {
  if (context.subscription.plan === 'free') {
    return ['general', 'it-tech'].includes(domain);
  }

  if (context.subscription.plan === 'schools') {
    return !['procurement', 'governance'].includes(domain);
  }

  return true;
}

/**
 * Get upgrade message for locked features
 */
function getUpgradeMessage(domain: string): string {
  const upgradeMessages: Record<string, string> = {
    estates: 'Estates Compliance support is available on the Schools plan. Upgrade to access RIDDOR, fire safety, and compliance guidance.',
    hr: 'HR support is available on the Schools plan. Upgrade to access sickness, absence, and employment guidance.',
    send: 'SEND support is available on the Schools plan. Upgrade to access EHCP and SEND guidance.',
    data: 'Data support is available on the Schools plan. Upgrade to access census and data protection guidance.',
    curriculum: 'Curriculum support is available on the Schools plan. Upgrade to access Ofsted and curriculum guidance.',
    procurement: 'Procurement support is available on the Trusts plan. Upgrade to access framework and procurement guidance.',
    governance: 'Governance support is available on the Trusts plan. Upgrade to access trust governance guidance.',
    communications: 'Communications support is available on the Schools plan. Upgrade to access parent and media guidance.',
  };

  return upgradeMessages[domain] || 'This feature is not available on your current plan.';
}

/**
 * Format cached knowledge base response
 */
function formatCachedResponse(cached: any): string {
  return `${cached.answer}

---
*This information is from ${cached.sourceName} and was last verified on ${new Date(cached.lastVerified).toLocaleDateString()}.*`;
}

/**
 * Get error message for LLM failures
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `I'm having trouble connecting to my knowledge base right now.

**Error:** ${error.message}

Please try again in a moment. If this continues, please contact support.`;
  }
  return 'I encountered an error processing your request. Please try again.';
}
