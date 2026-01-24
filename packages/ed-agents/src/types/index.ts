/**
 * Core types for Ed Agent Framework
 */

// ============================================================================
// Domain Types
// ============================================================================

export type Domain =
  | 'estates'
  | 'hr'
  | 'send'
  | 'data'
  | 'curriculum'
  | 'it-tech'
  | 'procurement'
  | 'governance'
  | 'communications'
  | 'general';

export type SpecialistId =
  | 'estates-specialist'
  | 'hr-specialist'
  | 'send-specialist'
  | 'data-specialist'
  | 'curriculum-specialist'
  | 'it-tech-specialist'
  | 'procurement-specialist'
  | 'governance-specialist'
  | 'communications-specialist'
  | 'ed-general';

// ============================================================================
// Confidence Levels
// ============================================================================

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface FreshnessInfo {
  lastVerified: Date;
  sourceUrl?: string;
  confidence: ConfidenceLevel;
  nextReviewDue?: Date;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentDefinition {
  id: SpecialistId;
  name: string;
  domain: Domain;
  qualifications: string[];
  capabilities: string[];
  systemPrompt: string;
}

export interface AgentResponse {
  agentId: SpecialistId;
  content: string;
  sources?: SourceInfo[];
  confidence: ConfidenceLevel;
  requiresHuman?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SourceInfo {
  name: string;
  url?: string;
  type: string; // 'HSE', 'DfE', 'ACAS', etc.
  lastVerified?: Date;
}

// ============================================================================
// App Context
// ============================================================================

export type AppSlug =
  | 'estates-compliance'
  | 'hr'
  | 'send'
  | 'data'
  | 'schoolgle-platform'
  | 'unknown';

export type UserRole = 'admin' | 'staff' | 'viewer';

export type SubscriptionPlan = 'free' | 'schools' | 'trusts';

export interface SubscriptionContext {
  plan: SubscriptionPlan;
  features: string[];
  creditsRemaining: number;
  creditsUsed: number;
}

export interface AppContext {
  userId: string;
  orgId: string;
  userRole: UserRole;
  subscription: SubscriptionContext;
  activeApp?: AppSlug;
  currentTask?: string;
  schoolData?: SchoolContext;
  sessionId: string;
  openRouterApiKey?: string; // Optional: Pass API key directly
}

export interface SchoolContext {
  urn: number;
  name: string;
  address: string[];
  phone?: string;
  email?: string;
  typeName: string;
  phaseName: string;
  laCode?: number;
  laName?: string;
  trustName?: string;
  ofstedRating?: string;
  ofstedLastInspection?: Date;
  imdDecile?: number;
  isIndependent?: boolean;
}

// ============================================================================
// Intent Classification
// ============================================================================

export interface IntentClassification {
  domain: Domain;
  specialist: SpecialistId;
  confidence: number;
  reasoning?: string;
  requiresMultiPerspective?: boolean;
  isWorkRelated: boolean;
}

// ============================================================================
// Knowledge Base
// ============================================================================

export interface KnowledgeEntry {
  id: string;
  domain: Domain;
  topic: string;
  question: string;
  answer: string;
  sourceUrl?: string;
  sourceName: string;
  sourceType: string;
  confidence: ConfidenceLevel;
  lastVerified: Date;
  nextReviewDue?: Date;
  version: number;
  rank?: number;
}

export interface KnowledgeQueryOptions {
  domain?: Domain;
  confidence?: ConfidenceLevel;
  limit?: number;
}

// ============================================================================
// Perspective Types
// ============================================================================

export type PerspectiveType = 'optimist' | 'critic' | 'neutral';

export interface PerspectiveResponse {
  optimist: string;
  critic: string;
  neutral: string;
}

// ============================================================================
// Guardrail Types
// ============================================================================

export interface GuardrailResult {
  passed: boolean;
  response?: string;
  warning?: string;
  requiresHuman?: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface GuardrailCheck {
  name: string;
  check: (response: string, context: AppContext) => Promise<GuardrailResult>;
}

// ============================================================================
// Model Types
// ============================================================================

export type ModelProvider = 'anthropic' | 'openai' | 'openrouter' | 'google';

export type TaskType =
  | 'intent-classification'
  | 'work-focus-check'
  | 'specialist-response'
  | 'perspective-generation'
  | 'synthesis'
  | 'ui-analysis'
  | 'action-planning';

export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  model: string;
  costPerMillionTokens: number;
  capabilities: {
    vision: boolean;
    streaming: boolean;
    jsonMode: boolean;
  };
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  cost: number;
}

// ============================================================================
// Ed Response Types
// ============================================================================

export interface EdResponse {
  response: string;
  specialist: SpecialistId;
  confidence: ConfidenceLevel;
  sources: SourceInfo[];
  requiresHuman: boolean;
  perspectives?: {
    optimist?: string;
    critic?: string;
    neutral?: string;
  };
  warnings?: string[];
  metadata: {
    domain: Domain;
    tokensUsed?: TokenUsage;
    cached?: boolean;
    processedAt: Date;
  };
}

// ============================================================================
// Browser Automation Types
// ============================================================================

export interface BrowserAction {
  type: 'navigate' | 'click' | 'fill' | 'select' | 'scroll' | 'screenshot' | 'wait';
  selector?: string;
  value?: string;
  url?: string;
  timeout?: number;
}

export interface BrowserAutomationResult {
  success: boolean;
  actionsTaken: BrowserAction[];
  screenshot?: string;
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class EdAgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'EdAgentError';
  }
}

export class SpecialistNotFoundError extends EdAgentError {
  constructor(specialistId: string) {
    super(`Specialist not found: ${specialistId}`, 'SPECIALIST_NOT_FOUND');
    this.name = 'SpecialistNotFoundError';
  }
}

export class GuardrailFailedError extends EdAgentError {
  constructor(reason: string, public result: GuardrailResult) {
    super(`Guardrail failed: ${reason}`, 'GUARDRAIL_FAILED');
    this.name = 'GuardrailFailedError';
  }
}

export class InsufficientCreditsError extends EdAgentError {
  constructor(required: number, available: number) {
    super(
      `Insufficient credits: ${available} available, ${required} required`,
      'INSUFFICIENT_CREDITS'
    );
    this.name = 'InsufficientCreditsError';
  }
}

export class KnowledgeNotFoundError extends EdAgentError {
  constructor(query: string) {
    super(`No knowledge found for query: ${query}`, 'KNOWLEDGE_NOT_FOUND');
    this.name = 'KnowledgeNotFoundError';
  }
}

// ============================================================================
// Orchestrator Config
// ============================================================================

export interface OrchestratorConfig {
  supabase: any; // SupabaseClient
  userId: string;
  orgId: string;
  userRole: UserRole;
  subscription: SubscriptionContext;
  schoolData?: SchoolContext;
  activeApp?: AppSlug;
  enableMultiPerspective?: boolean;
  enableBrowserAutomation?: boolean;
  debug?: boolean;
  openRouterApiKey?: string; // Optional: Pass API key directly (bypasses env var)
}
