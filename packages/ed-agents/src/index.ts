/**
 * @schoolgle/ed-agents
 *
 * Agentic framework for Ed chatbot - specialist personas with qualified expertise
 *
 * @example
 * ```typescript
 * import { createOrchestrator } from '@schoolgle/ed-agents';
 *
 * const orchestrator = await createOrchestrator({
 *   supabase,
 *   userId: 'user-123',
 *   orgId: 'org-456',
 *   userRole: 'staff',
 *   subscription: { plan: 'schools', features: [], creditsRemaining: 10000, creditsUsed: 0 },
 * });
 *
 * const response = await orchestrator.processQuestion(
 *   'What temperature should legionella water be?'
 * );
 * ```
 */

// Core types
export * from './types';

// Agent registry and definitions
export * from './agents';

// Orchestrator (main entry point)
export * from './orchestrator';

// Guardrails
export * from './guardrails';

// Perspectives
export * from './perspectives';

// Skills
export * from './skills';

// Knowledge base
export * from './knowledge-base';

// Models (OpenRouter integration)
export * from './models';

// Credit management
export * from './credit';

// Re-export commonly used OpenRouter types for convenience
export type {
  ChatMessage,
  ChatOptions,
  ChatResponse,
  OpenRouterConfig,
} from './models';

// Re-export OpenRouter utilities
export {
  OpenRouterClient,
  OpenRouterError,
  MODEL_ALIASES,
  OPENROUTER_MODELS,
  ModelRouter,
  getModelRouter,
} from './models';

// Version
export const VERSION = '0.1.0';
