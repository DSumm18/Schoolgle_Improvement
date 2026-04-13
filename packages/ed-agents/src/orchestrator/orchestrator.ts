/**
 * Ed Orchestrator - Main entry point for processing user questions through the agent framework
 */

import type {
  OrchestratorConfig,
  AppContext,
  EdResponse,
  Domain,
} from "../types";
import { routeToSpecialist } from "./agent-router";
import { classifyIntent, isWorkRelated } from "./intent-classifier";
import { createCreditManager } from "../credit/manager";
import { applyGuardrails } from "../guardrails/pipeline";
import { generateMultiPerspectiveResponse } from "../perspectives/generator";
import {
  buildEnrichedPrompt,
  loadSchoolContext,
  getTypeSpecificGuidance,
  injectExpertKnowledge,
  mapUrlToDomain,
  generateProactiveContext,
} from "./context-loader";

import { CommunicationRouter } from "../communication/communication-router";
import {
  CommunicationPayload,
  CommunicationResult,
} from "../communication/types";
import { ResendProvider } from "../communication/providers/resend";
import { TwilioProvider } from "../communication/providers/twilio";
import { FishAudioProvider } from "../communication/providers/fish-audio";

/**
 * Ed Orchestrator - coordinates all agent processing
 */
export class EdOrchestrator {
  private config: OrchestratorConfig;
  private creditManager: ReturnType<typeof createCreditManager>;
  private commRouter: CommunicationRouter;
  private schoolContext: AppContext["schoolData"] | null = null;
  private totalTokensUsed = 0;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.creditManager = createCreditManager(config.subscription);
    this.schoolContext = config.schoolData || null;

    // Initialize Communication Router
    this.commRouter = new CommunicationRouter(this.creditManager);
    this.initializeProviders();
  }

  /**
   * Initialize communication providers based on available config
   */
  private initializeProviders() {
    // Email (Resend)
    if (process.env.RESEND_API_KEY) {
      this.commRouter.registerProvider(
        new ResendProvider(process.env.RESEND_API_KEY),
      );
    }

    // SMS (Twilio)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.commRouter.registerProvider(
        new TwilioProvider(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN,
        ),
      );
    }

    // TTS (Fish Audio)
    if (process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY) {
      this.commRouter.registerProvider(
        new FishAudioProvider(process.env.NEXT_PUBLIC_FISH_AUDIO_API_KEY),
      );
    }
  }

  /**
   * Send a communication message
   */
  async sendMessage(
    payload: CommunicationPayload,
  ): Promise<CommunicationResult> {
    const result = await this.commRouter.send(payload);

    if (result.success) {
      this.creditManager.trackCommunication(result.channel, result.cost);
    }

    return result;
  }

  /**
   * Process a user question through the agent framework
   */
  async processQuestion(
    question: string,
    context: {
      app?: string;
      page?: string;
      url?: string;
      screenshot?: string;
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
    } = {},
  ): Promise<EdResponse> {
    const startTime = Date.now();

    // Build full app context
    const appContext: AppContext = {
      userId: this.config.userId,
      orgId: this.config.orgId,
      userRole: this.config.userRole,
      subscription: this.config.subscription,
      activeApp: (context.app as any) || this.config.activeApp,
      currentTask: context.page,
      // @ts-expect-error - Auto-masked during strict compilation enforcement
      url: context.url,
      schoolData: this.schoolContext ?? undefined,
      sessionId: this.generateSessionId(),
      openRouterApiKey: this.config.openRouterApiKey,
      supabase: this.config.supabase,
    };

    // Load school context if not already loaded
    if (!this.schoolContext && this.config.supabase) {
      try {
        this.schoolContext = await loadSchoolContext(
          this.config.orgId,
          this.config.supabase,
        );
        appContext.schoolData = this.schoolContext ?? undefined;
      } catch {
        // Don't fail if context loading fails
      }
    }

    try {
      // Step 0: Detect domain from URL for context-aware routing
      const urlDomain = (appContext as any).url
        ? mapUrlToDomain((appContext as any).url)
        : appContext.currentTask
          ? mapUrlToDomain(appContext.currentTask)
          : null;

      // Prefix question with page context so classifier routes correctly
      const contextualQuestion = urlDomain
        ? `[User is currently in the ${urlDomain} module] ${question}`
        : question;

      // Step 1: Classify intent and check if work-related
      const classification = classifyIntent(
        contextualQuestion,
        appContext.activeApp,
        appContext.userRole,
      );

      // If not work-related, return redirect message
      if (!classification.isWorkRelated) {
        return {
          response: this.getWorkFocusRedirect(),
          specialist: "ed-general",
          confidence: "HIGH",
          sources: [],
          requiresHuman: false,
          metadata: {
            domain: "general",
            processedAt: new Date(),
          },
        };
      }

      // Step 2: Inject expert knowledge for the detected domain
      const domain = urlDomain;
      let enrichedQuestion = question;

      if (domain && this.config.supabase) {
        const expertKnowledge = await injectExpertKnowledge(
          domain,
          this.config.supabase,
        );
        if (expertKnowledge) {
          enrichedQuestion = `${expertKnowledge}\n\nUser Question: ${question}`;
        }
      }

      // Step 3: Route to specialist and get initial response
      const agentResponse = await routeToSpecialist(
        enrichedQuestion,
        appContext,
        {
          screenshot: context.screenshot,
          messages: context.messages,
        },
      );

      // Track tokens from specialist response
      if (agentResponse.metadata?.tokensUsed) {
        const tokens = agentResponse.metadata.tokensUsed as { total: number };
        this.totalTokensUsed += tokens.total;
      }

      // Step 3: Check if multi-perspective is needed
      let finalContent = agentResponse.content;
      let perspectives: EdResponse["perspectives"] | undefined;
      let additionalTokens = 0;

      if (
        classification.requiresMultiPerspective &&
        this.config.enableMultiPerspective !== false
      ) {
        const perspectiveResponse = await generateMultiPerspectiveResponse(
          question,
          agentResponse.content,
          appContext,
        );
        finalContent = perspectiveResponse.synthesized;
        perspectives = perspectiveResponse.perspectives;

        // Estimate perspective tokens (roughly: 3 perspectives + synthesis)
        additionalTokens = 800; // Approximate
        this.totalTokensUsed += additionalTokens;
      }

      // Step 4: Apply guardrails
      const guardedResponse = await applyGuardrails(
        finalContent,
        appContext,
        (await this.getDomainForSpecialist(agentResponse.agentId)) || undefined,
      );

      // Estimate guardrails tokens
      this.totalTokensUsed += 200; // Rough estimate for guardrails checks

      // Step 5: Strip any thinking/reasoning text from the response
      // Some models (DeepSeek, etc.) include chain-of-thought in their output
      let cleanedResponse = guardedResponse.response || finalContent;
      // Remove <think>...</think> blocks
      cleanedResponse = cleanedResponse.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      // Remove lines that start with thinking patterns (e.g. "Initiating Pleasantries", "Clarifying this")
      cleanedResponse = cleanedResponse.replace(/^(Initiating|Clarifying|Considering|Analyzing|Thinking about|Processing|Evaluating|Reflecting on|Assessing|Determining|Formulating|Synthesiz|Prioritiz|Recogniz|Acknowledg|Contemplat|Deliberat|Ponder|Weigh|Strategiz|Orchestrat|Architect|Investigat|Examin|Evaluat|Interpret|Decipher|Navigat|Calibrat|Reconcil|Brainstorm)[^\n]*\n*/gim, '').trim();
      // Remove any remaining empty lines at the start
      cleanedResponse = cleanedResponse.replace(/^\s*\n+/, '').trim();

      // Step 6: Format final response
      const response: EdResponse = {
        response: cleanedResponse,
        specialist: agentResponse.agentId,
        confidence: agentResponse.confidence,
        sources: agentResponse.sources || [],
        requiresHuman:
          guardedResponse.requiresHuman || agentResponse.requiresHuman || false,
        warnings: guardedResponse.warning
          ? [guardedResponse.warning]
          : undefined,
        perspectives,
        metadata: {
          domain:
            ((await this.getDomainForSpecialist(
              agentResponse.agentId,
            )) as Domain) || "general",
          tokensUsed: {
            input: Math.round(this.totalTokensUsed * 0.4),
            output: Math.round(this.totalTokensUsed * 0.6),
            total: this.totalTokensUsed,
            cost: this.estimateCost(this.totalTokensUsed),
          },
          processedAt: new Date(),
          cached: (agentResponse.metadata as any)?.cached,
          blocked: (agentResponse.metadata as any)?.blocked,
          categories: (agentResponse.metadata as any)?.categories,
        },
      };

      return response;
    } catch (error) {
      // Handle errors gracefully
      return {
        response: this.getErrorResponse(error),
        specialist: "ed-general",
        confidence: "LOW",
        sources: [],
        requiresHuman: true,
        warnings: ["An error occurred while processing your question."],
        metadata: {
          domain: "general" as Domain,
          processedAt: new Date(),
        },
      };
    }
  }

  /**
   * Get school context
   */
  getSchoolContext() {
    return this.schoolContext;
  }

  /**
   * Update school context
   */
  setSchoolContext(context: AppContext["schoolData"]) {
    this.schoolContext = context;
  }

  /**
   * Get credit summary
   */
  getCreditSummary() {
    const baseSummary = this.creditManager.getSummary();
    return {
      ...baseSummary,
      totalSessionTokens: this.totalTokensUsed,
      estimatedCost: this.estimateCost(this.totalTokensUsed),
    };
  }

  /**
   * Get total tokens used this session
   */
  getTotalTokensUsed(): number {
    return this.totalTokensUsed;
  }

  /**
   * Reset session
   */
  resetSession() {
    this.totalTokensUsed = 0;
    this.creditManager.resetSession();
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get domain for specialist
   */
  private async getDomainForSpecialist(
    specialistId: string,
  ): Promise<string | undefined> {
    const { getAgent } = await import("../agents");
    const agent = getAgent(specialistId as any);
    return agent?.domain;
  }

  /**
   * Estimate cost based on tokens used
   */
  private estimateCost(tokens: number): number {
    // Rough estimate using average model cost
    const avgCostPerMillion = 1.0; // $1 per million tokens
    return (tokens / 1_000_000) * avgCostPerMillion;
  }

  /**
   * Handle greeting — conversation-aware
   *
   * Checks how many times this user has chatted today.
   * First visit: "Hi David, what can I help you with?"
   * Returning: "Hi David, what else can I help you with today?"
   * With alerts: leads with the most urgent alert.
   */
  async handleProactiveGreeting(context: {
    url?: string;
    title?: string;
    userName?: string;
    userRole?: string;
  }): Promise<{ greeting: string; alerts: string[]; recentTopics?: string[] }> {
    const domain = context.url ? mapUrlToDomain(context.url) : null;
    const name = context.userName || "there";
    let alerts: string[] = [];
    let conversationsToday = 0;
    let lastTopic: string | undefined;

    if (this.config.supabase && this.config.orgId) {
      // Count today's conversations for this user
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayChats, count } = await this.config.supabase
          .from("ed_conversation_log")
          .select("topic_summary, created_at", { count: "exact" })
          .eq("organization_id", this.config.orgId)
          .eq("user_id", this.config.userId)
          .gte("created_at", todayStart.toISOString())
          .order("created_at", { ascending: false })
          .limit(5);

        conversationsToday = count || 0;

        if (todayChats && todayChats.length > 0) {
          lastTopic = todayChats[0].topic_summary;
        }
      } catch {
        // Table may not exist yet
      }

      // Load proactive alerts for the current domain
      if (domain) {
        alerts = await generateProactiveContext(
          this.config.orgId,
          domain,
          this.config.supabase,
        );
      }
    }

    // Build greeting using the new system
    const { buildGreeting } = await import("../agents/contextual-greeting");
    const result = buildGreeting({
      firstName: name,
      conversationsToday,
      lastTopic,
      alerts,
      domain: domain || undefined,
    });

    return {
      greeting: result.greeting,
      alerts: result.suggestions,
    };
  }

  /**
   * Redirect non-work queries — short, no capability list
   */
  private getWorkFocusRedirect(): string {
    return "I'm set up to help with school work — what do you need?";
  }

  /**
   * Get error response
   */
  private getErrorResponse(error: unknown): string {
    if (error instanceof Error) {
      // Check for specific error types
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        return `I'm having trouble connecting to my AI services right now.

This might be an API configuration issue. Please try again or contact support.`;
      }

      if (
        error.message.includes("429") ||
        error.message.includes("rate limit")
      ) {
        return `I'm receiving too many requests right now.

Please wait a moment and try again.`;
      }

      return `I'm sorry, something went wrong while trying to help you.

**Error:** ${error.message}

If this continues, please contact support.`;
    }
    return "I encountered an error processing your request. Please try again.";
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create orchestrator with config
 */
export async function createOrchestrator(
  config: OrchestratorConfig,
): Promise<EdOrchestrator> {
  // Load school context if orgId provided and not already loaded
  let schoolContext = config.schoolData;
  if (config.orgId && !schoolContext && config.supabase) {
    try {
      schoolContext =
        (await loadSchoolContext(config.orgId, config.supabase)) ?? undefined;
    } catch {
      // Don't fail entire orchestrator if context loading fails
    }
  }

  return new EdOrchestrator({
    ...config,
    schoolData: schoolContext ?? undefined,
  });
}

/**
 * Create a simple orchestrator for testing
 */
export function createTestOrchestrator(
  overrides?: Partial<OrchestratorConfig>,
): EdOrchestrator {
  return new EdOrchestrator({
    supabase: null,
    userId: "test-user",
    orgId: "test-org",
    userRole: "staff",
    subscription: {
      plan: "schools",
      features: ["estates", "hr", "send", "data", "curriculum"],
      creditsRemaining: 10000,
      creditsUsed: 0,
    },
    enableMultiPerspective: false,
    enableBrowserAutomation: false,
    debug: true,
    ...overrides,
  });
}
