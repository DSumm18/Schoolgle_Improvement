import {
  createCreditManager
} from "./chunk-DHRE3F6T.mjs";
import {
  DOMAIN_KEYWORDS,
  getAgent,
  getAgentByDomain
} from "./chunk-NOR2KXUH.mjs";
import {
  applyGuardrails
} from "./chunk-7SSKUU7Q.mjs";
import {
  generateMultiPerspectiveResponse
} from "./chunk-VGXQEGV6.mjs";
import {
  queryKnowledgeBase
} from "./chunk-TMZ5VDLU.mjs";
import {
  getModelRouter
} from "./chunk-XCFC4OXF.mjs";
import {
  __spreadProps,
  __spreadValues
} from "./chunk-C3N2FVDJ.mjs";

// src/orchestrator/intent-classifier.ts
var WORK_KEYWORDS = [
  "help with",
  "how do i",
  "what is the",
  "how to",
  "can you help",
  "need to",
  "want to",
  "report",
  "fill in",
  "complete",
  "submit",
  "guidance",
  "advice",
  "requirements",
  "policy",
  "procedure"
];
var CHAT_KEYWORDS = [
  "tell me a joke",
  "how are you",
  "what do you think",
  "lets chat",
  "conversation",
  "just saying",
  "bored",
  "nothing",
  "hi",
  "hello"
];
var COMPLEX_DECISION_KEYWORDS = [
  "should we",
  "should i",
  "recommend",
  "decision",
  "choose",
  "best",
  "better",
  "versus",
  "vs",
  "compare",
  "option",
  "switch",
  "change",
  "implement",
  "introduce",
  "start using"
];
function scoreDomain(query, domain) {
  const keywords = DOMAIN_KEYWORDS[domain] || [];
  const queryLower = query.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (queryLower.includes(keyword.toLowerCase())) {
      score += 1;
      if (keyword.split(" ").length > 1) {
        score += 0.5;
      }
    }
  }
  return score;
}
function isWorkRelated(query) {
  const queryLower = query.toLowerCase().trim();
  const hasChatKeywords = CHAT_KEYWORDS.some((kw) => queryLower.includes(kw));
  const hasWorkKeywords = WORK_KEYWORDS.some((kw) => queryLower.includes(kw));
  const hasDomainKeywords = Object.values(DOMAIN_KEYWORDS).some(
    (keywords) => keywords.some((kw) => queryLower.includes(kw.toLowerCase()))
  );
  if (hasChatKeywords && !hasWorkKeywords && !hasDomainKeywords) {
    return { isWorkRelated: false, confidence: 0.9 };
  }
  if (hasWorkKeywords || hasDomainKeywords) {
    return { isWorkRelated: true, confidence: 0.8 };
  }
  return { isWorkRelated: true, confidence: 0.5 };
}
function requiresMultiPerspective(query) {
  const queryLower = query.toLowerCase();
  const hasComplexKeyword = COMPLEX_DECISION_KEYWORDS.some(
    (kw) => queryLower.includes(kw)
  );
  return hasComplexKeyword;
}
function classifyIntent(query, activeApp, userRole) {
  var _a;
  const queryLower = query.toLowerCase();
  const { isWorkRelated: isWorkRelated3 } = isWorkRelated3(query);
  if (!isWorkRelated3) {
    return {
      domain: "general",
      specialist: "ed-general",
      confidence: 0.9,
      reasoning: "Query appears to be general chat, not work-related",
      requiresMultiPerspective: false,
      isWorkRelated: false
    };
  }
  const needsMultiPerspective = requiresMultiPerspective(query);
  const domainScores = [];
  for (const domain of Object.keys(DOMAIN_KEYWORDS)) {
    if (domain === "general") continue;
    const score = scoreDomain(query, domain);
    if (score > 0) {
      domainScores.push({ domain, score });
    }
  }
  domainScores.sort((a, b) => b.score - a.score);
  let bestDomain;
  let confidence;
  if (domainScores.length > 0) {
    bestDomain = domainScores[0].domain;
    const topScore = domainScores[0].score;
    const secondScore = ((_a = domainScores[1]) == null ? void 0 : _a.score) || 0;
    confidence = Math.min(0.95, 0.6 + (topScore - secondScore) * 0.1);
  } else {
    bestDomain = "general";
    confidence = 0.3;
  }
  if (confidence < 0.5 && activeApp) {
    switch (activeApp) {
      case "estates-compliance":
        bestDomain = "estates";
        confidence = 0.7;
        break;
      case "hr":
        bestDomain = "hr";
        confidence = 0.7;
        break;
    }
  }
  const agent = getAgentByDomain(bestDomain);
  const specialist = agent.id;
  return {
    domain: bestDomain,
    specialist,
    confidence,
    reasoning: domainScores.length > 0 ? `Matched keywords for ${bestDomain} domain (score: ${domainScores[0].score})` : `Using ${bestDomain} based on app context`,
    requiresMultiPerspective: needsMultiPerspective,
    isWorkRelated: true
  };
}
function explainRouting(classification) {
  const parts = [
    `Domain: ${classification.domain}`,
    `Specialist: ${classification.specialist}`,
    `Confidence: ${Math.round(classification.confidence * 100)}%`
  ];
  if (classification.reasoning) {
    parts.push(`Reasoning: ${classification.reasoning}`);
  }
  if (classification.requiresMultiPerspective) {
    parts.push("Multi-perspective: Yes (complex decision)");
  }
  return parts.join(" | ");
}

// src/orchestrator/context-loader.ts
async function loadSchoolContext(orgId, supabase) {
  try {
    return null;
  } catch (error) {
    return null;
  }
}
function buildEnrichedPrompt(basePrompt, schoolContext) {
  if (!schoolContext) {
    return basePrompt;
  }
  const contextBlock = buildSchoolContextBlock(schoolContext);
  return `${contextBlock}

${basePrompt}`;
}
function buildSchoolContextBlock(schoolContext) {
  const parts = [
    "## School Context",
    `You are helping **${schoolContext.name}**`,
    ""
  ];
  if (schoolContext.phaseName) {
    parts.push(`- **Type:** ${schoolContext.phaseName}`);
  }
  if (schoolContext.trustName) {
    parts.push(`- **Trust:** ${schoolContext.trustName}`);
  }
  if (schoolContext.laName && !schoolContext.trustName) {
    parts.push(`- **Local Authority:** ${schoolContext.laName}`);
  }
  if (schoolContext.ofstedRating) {
    parts.push(`- **Ofsted Rating:** ${schoolContext.ofstedRating}`);
  }
  if (schoolContext.imdDecile !== void 0) {
    const deprivationLevel = schoolContext.imdDecile <= 3 ? "high deprivation area" : schoolContext.imdDecile <= 7 ? "average deprivation" : "low deprivation area";
    parts.push(`- **Context:** ${deprivationLevel} (IMD decile ${schoolContext.imdDecile}/10)`);
  }
  parts.push("");
  parts.push("Use this context to provide relevant, tailored advice.");
  parts.push("");
  return parts.join("\n");
}
function getTypeSpecificGuidance(schoolContext) {
  var _a, _b, _c, _d;
  const guidance = [];
  if (schoolContext.trustName) {
    guidance.push("This is an academy trust - check trust policies in addition to national guidance.");
  } else if (((_a = schoolContext.typeName) == null ? void 0 : _a.toLowerCase().includes("la-maintained")) || ((_b = schoolContext.typeName) == null ? void 0 : _b.toLowerCase().includes("local authority"))) {
    guidance.push("This is an LA-maintained school - the local authority may provide additional guidance and services.");
  }
  if (schoolContext.isIndependent) {
    guidance.push("This is an independent school - some statutory requirements may differ, particularly around inspection and curriculum.");
  }
  if ((_c = schoolContext.phaseName) == null ? void 0 : _c.toLowerCase().includes("primary")) {
    guidance.push("Primary school context: Consider early years and key stage 1-2 specific requirements.");
  } else if ((_d = schoolContext.phaseName) == null ? void 0 : _d.toLowerCase().includes("secondary")) {
    guidance.push("Secondary school context: Consider key stage 3-5, GCSE, and post-16 specific requirements.");
  }
  return guidance;
}

// src/orchestrator/agent-router.ts
async function routeToSpecialist(question, context) {
  const classification = classifyIntent(
    question,
    context.activeApp,
    context.userRole
  );
  if (!hasFeatureAccess(context, classification.domain)) {
    return {
      agentId: "ed-general",
      content: getUpgradeMessage(classification.domain),
      confidence: "HIGH",
      requiresHuman: false,
      metadata: { blocked: "feature_access" }
    };
  }
  if (classification.confidence > 0.7 && classification.isWorkRelated) {
    const cached = await queryKnowledgeBase(question, classification.domain);
    if (cached && cached.confidence === "HIGH") {
      return {
        agentId: classification.specialist,
        content: formatCachedResponse(cached),
        sources: [{
          name: cached.sourceName,
          url: cached.sourceUrl,
          type: cached.sourceType,
          lastVerified: cached.lastVerified
        }],
        confidence: cached.confidence,
        metadata: { cached: true, knowledgeId: cached.id }
      };
    }
  }
  const agent = getAgent(classification.specialist);
  if (!agent) {
    throw new Error(`Specialist not found: ${classification.specialist}`);
  }
  const enrichedPrompt = buildSpecialistPrompt(
    agent.systemPrompt,
    context.schoolData,
    question
  );
  const modelRouter = getModelRouter();
  const model = modelRouter.selectModel("specialist-response", context);
  try {
    const llmResponse = await modelRouter.chat(
      enrichedPrompt,
      question,
      {
        model: model.id,
        temperature: 0.7,
        maxTokens: 2048
      }
    );
    return {
      agentId: classification.specialist,
      content: llmResponse.content,
      sources: [{
        name: `${agent.name} (AI)`,
        type: "AI Specialist"
      }],
      confidence: "MEDIUM",
      metadata: {
        classification,
        modelUsed: model.id,
        tokensUsed: {
          input: llmResponse.usage.promptTokens,
          output: llmResponse.usage.completionTokens,
          total: llmResponse.usage.totalTokens
        }
      }
    };
  } catch (error) {
    return {
      agentId: classification.specialist,
      content: getErrorMessage(error),
      confidence: "LOW",
      requiresHuman: true,
      metadata: {
        classification,
        modelUsed: model.id,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    };
  }
}
function buildSpecialistPrompt(basePrompt, schoolContext, question) {
  let prompt = basePrompt;
  if (schoolContext) {
    const contextBlock = buildSchoolContextBlock(schoolContext);
    prompt = `${contextBlock}

${prompt}`;
    const typeGuidance = getTypeSpecificGuidance(schoolContext);
    if (typeGuidance.length > 0) {
      prompt = `${prompt}

## Additional Context for This School

${typeGuidance.join("\n")}`;
    }
  }
  return prompt;
}
function hasFeatureAccess(context, domain) {
  if (context.subscription.plan === "free") {
    return ["general", "it-tech"].includes(domain);
  }
  if (context.subscription.plan === "schools") {
    return !["procurement", "governance"].includes(domain);
  }
  return true;
}
function getUpgradeMessage(domain) {
  const upgradeMessages = {
    estates: "Estates Compliance support is available on the Schools plan. Upgrade to access RIDDOR, fire safety, and compliance guidance.",
    hr: "HR support is available on the Schools plan. Upgrade to access sickness, absence, and employment guidance.",
    send: "SEND support is available on the Schools plan. Upgrade to access EHCP and SEND guidance.",
    data: "Data support is available on the Schools plan. Upgrade to access census and data protection guidance.",
    curriculum: "Curriculum support is available on the Schools plan. Upgrade to access Ofsted and curriculum guidance.",
    procurement: "Procurement support is available on the Trusts plan. Upgrade to access framework and procurement guidance.",
    governance: "Governance support is available on the Trusts plan. Upgrade to access trust governance guidance.",
    communications: "Communications support is available on the Schools plan. Upgrade to access parent and media guidance."
  };
  return upgradeMessages[domain] || "This feature is not available on your current plan.";
}
function formatCachedResponse(cached) {
  return `${cached.answer}

---
*This information is from ${cached.sourceName} and was last verified on ${new Date(cached.lastVerified).toLocaleDateString()}.*`;
}
function getErrorMessage(error) {
  if (error instanceof Error) {
    return `I'm having trouble connecting to my knowledge base right now.

**Error:** ${error.message}

Please try again in a moment. If this continues, please contact support.`;
  }
  return "I encountered an error processing your request. Please try again.";
}

// src/orchestrator/orchestrator.ts
var EdOrchestrator = class {
  constructor(config) {
    this.schoolContext = null;
    this.totalTokensUsed = 0;
    this.config = config;
    this.creditManager = createCreditManager(config.subscription);
    this.schoolContext = config.schoolData || null;
  }
  /**
   * Process a user question through the agent framework
   */
  async processQuestion(question, context = {}) {
    var _a, _b;
    const startTime = Date.now();
    const appContext = {
      userId: this.config.userId,
      orgId: this.config.orgId,
      userRole: this.config.userRole,
      subscription: this.config.subscription,
      activeApp: context.app || this.config.activeApp,
      currentTask: context.page,
      schoolData: this.schoolContext,
      sessionId: this.generateSessionId()
    };
    if (!this.schoolContext && this.config.supabase) {
      try {
        this.schoolContext = await loadSchoolContext(this.config.orgId, this.config.supabase);
        appContext.schoolData = this.schoolContext;
      } catch (e) {
      }
    }
    try {
      const classification = classifyIntent(
        question,
        appContext.activeApp,
        appContext.userRole
      );
      if (!classification.isWorkRelated) {
        return {
          response: this.getWorkFocusRedirect(),
          specialist: "ed-general",
          confidence: "HIGH",
          sources: [],
          requiresHuman: false,
          metadata: {
            domain: "general",
            processedAt: /* @__PURE__ */ new Date()
          }
        };
      }
      const agentResponse = await routeToSpecialist(question, appContext);
      if ((_a = agentResponse.metadata) == null ? void 0 : _a.tokensUsed) {
        const tokens = agentResponse.metadata.tokensUsed;
        this.totalTokensUsed += tokens.total;
      }
      let finalContent = agentResponse.content;
      let perspectives;
      let additionalTokens = 0;
      if (classification.requiresMultiPerspective && this.config.enableMultiPerspective !== false) {
        const perspectiveResponse = await generateMultiPerspectiveResponse(
          question,
          agentResponse.content,
          appContext
        );
        finalContent = perspectiveResponse.synthesized;
        perspectives = perspectiveResponse.perspectives;
        additionalTokens = 800;
        this.totalTokensUsed += additionalTokens;
      }
      const guardedResponse = await applyGuardrails(
        finalContent,
        appContext,
        await this.getDomainForSpecialist(agentResponse.agentId) || void 0
      );
      this.totalTokensUsed += 200;
      const response = {
        response: guardedResponse.response,
        specialist: agentResponse.agentId,
        confidence: agentResponse.confidence,
        sources: agentResponse.sources || [],
        requiresHuman: guardedResponse.requiresHuman || agentResponse.requiresHuman || false,
        warnings: guardedResponse.warning ? [guardedResponse.warning] : void 0,
        perspectives,
        metadata: {
          domain: await this.getDomainForSpecialist(agentResponse.agentId) || "general",
          tokensUsed: {
            input: Math.round(this.totalTokensUsed * 0.4),
            output: Math.round(this.totalTokensUsed * 0.6),
            total: this.totalTokensUsed,
            cost: this.estimateCost(this.totalTokensUsed)
          },
          processedAt: /* @__PURE__ */ new Date(),
          cached: (_b = agentResponse.metadata) == null ? void 0 : _b.cached,
          perspectiveUsed: !!perspectives
        }
      };
      return response;
    } catch (error) {
      return {
        response: this.getErrorResponse(error),
        specialist: "ed-general",
        confidence: "LOW",
        sources: [],
        requiresHuman: true,
        warnings: ["An error occurred while processing your question."],
        metadata: {
          domain: "general",
          processedAt: /* @__PURE__ */ new Date(),
          error: error instanceof Error ? error.message : "Unknown error"
        }
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
  setSchoolContext(context) {
    this.schoolContext = context;
  }
  /**
   * Get credit summary
   */
  getCreditSummary() {
    const baseSummary = this.creditManager.getSummary();
    return __spreadProps(__spreadValues({}, baseSummary), {
      totalSessionTokens: this.totalTokensUsed,
      estimatedCost: this.estimateCost(this.totalTokensUsed)
    });
  }
  /**
   * Get total tokens used this session
   */
  getTotalTokensUsed() {
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
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  /**
   * Get domain for specialist
   */
  async getDomainForSpecialist(specialistId) {
    const { getAgent: getAgent2 } = await import("./agents/index.mjs");
    const agent = getAgent2(specialistId);
    return agent == null ? void 0 : agent.domain;
  }
  /**
   * Estimate cost based on tokens used
   */
  estimateCost(tokens) {
    const avgCostPerMillion = 1;
    return tokens / 1e6 * avgCostPerMillion;
  }
  /**
   * Get work focus redirect message
   */
  getWorkFocusRedirect() {
    return `Hi! I'm Ed, and I'm here to help you get work done.

I can help with things like:
\u2022 School compliance (RIDDOR, fire safety, legionella)
\u2022 HR questions (sickness, policies, contracts)
\u2022 Data reporting (census, returns)
\u2022 Using school systems (SIMS, Arbor, etc.)
\u2022 And much more...

What work task can I help you with right now?`;
  }
  /**
   * Get error response
   */
  getErrorResponse(error) {
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        return `I'm having trouble connecting to my AI services right now.

This might be an API configuration issue. Please try again or contact support.`;
      }
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        return `I'm receiving too many requests right now.

Please wait a moment and try again.`;
      }
      return `I'm sorry, something went wrong while trying to help you.

**Error:** ${error.message}

If this continues, please contact support.`;
    }
    return "I encountered an error processing your request. Please try again.";
  }
};
async function createOrchestrator(config) {
  let schoolContext = config.schoolData;
  if (config.orgId && !schoolContext && config.supabase) {
    try {
      schoolContext = await loadSchoolContext(config.orgId, config.supabase);
    } catch (e) {
    }
  }
  return new EdOrchestrator(__spreadProps(__spreadValues({}, config), {
    schoolData: schoolContext || void 0
  }));
}
function createTestOrchestrator(overrides) {
  return new EdOrchestrator(__spreadValues({
    supabase: null,
    userId: "test-user",
    orgId: "test-org",
    userRole: "staff",
    subscription: {
      plan: "schools",
      features: ["estates", "hr", "send", "data", "curriculum"],
      creditsRemaining: 1e4,
      creditsUsed: 0
    },
    enableMultiPerspective: false,
    enableBrowserAutomation: false,
    debug: true
  }, overrides));
}

export {
  isWorkRelated,
  requiresMultiPerspective,
  classifyIntent,
  explainRouting,
  loadSchoolContext,
  buildEnrichedPrompt,
  buildSchoolContextBlock,
  getTypeSpecificGuidance,
  routeToSpecialist,
  EdOrchestrator,
  createOrchestrator,
  createTestOrchestrator
};
//# sourceMappingURL=chunk-KXGU75KO.mjs.map