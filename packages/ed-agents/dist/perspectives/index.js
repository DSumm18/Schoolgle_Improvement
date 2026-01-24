"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : /* @__PURE__ */ Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __await = function(promise, isYieldStar) {
  this[0] = promise;
  this[1] = isYieldStar;
};
var __asyncGenerator = (__this, __arguments, generator) => {
  var resume = (k, v, yes, no) => {
    try {
      var x = generator[k](v), isAwait = (v = x.value) instanceof __await, done = x.done;
      Promise.resolve(isAwait ? v[0] : v).then((y) => isAwait ? resume(k === "return" ? k : "next", v[1] ? { done: y.done, value: y.value } : y, yes, no) : yes({ value: y, done })).catch((e) => resume("throw", e, yes, no));
    } catch (e) {
      no(e);
    }
  }, method = (k) => it[k] = (x) => new Promise((yes, no) => resume(k, x, yes, no)), it = {};
  return generator = generator.apply(__this, __arguments), it[__knownSymbol("asyncIterator")] = () => it, method("next"), method("throw"), method("return"), it;
};
var __yieldStar = (value) => {
  var obj = value[__knownSymbol("asyncIterator")], isAwait = false, method, it = {};
  if (obj == null) {
    obj = value[__knownSymbol("iterator")]();
    method = (k) => it[k] = (x) => obj[k](x);
  } else {
    obj = obj.call(value);
    method = (k) => it[k] = (v) => {
      if (isAwait) {
        isAwait = false;
        if (k === "throw") throw v;
        return v;
      }
      isAwait = true;
      return {
        done: false,
        value: new __await(new Promise((resolve) => {
          var x = obj[k](v);
          if (!(x instanceof Object)) __typeError("Object expected");
          resolve(x);
        }), 1)
      };
    };
  }
  return it[__knownSymbol("iterator")] = () => it, method("next"), "throw" in obj ? method("throw") : it.throw = (x) => {
    throw x;
  }, "return" in obj && method("return"), it;
};

// src/perspectives/index.ts
var perspectives_exports = {};
__export(perspectives_exports, {
  CRITIC_PROMPT: () => CRITIC_PROMPT,
  NEUTRAL_PROMPT: () => NEUTRAL_PROMPT,
  OPTIMIST_PROMPT: () => OPTIMIST_PROMPT,
  SYNTHESIS_PROMPT: () => SYNTHESIS_PROMPT,
  clearPerspectiveCache: () => clearPerspectiveCache,
  generateMultiPerspectiveResponse: () => generateMultiPerspectiveResponse,
  generatePerspectivesCached: () => generatePerspectivesCached
});
module.exports = __toCommonJS(perspectives_exports);

// src/models/openrouter.ts
var OPENROUTER_MODELS = {
  // ========== PREMIUM MODELS (High quality, higher cost) ==========
  "anthropic/claude-3.5-sonnet": {
    id: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    model: "anthropic/claude-3.5-sonnet",
    costPerMillionTokens: 3,
    // Input, output is ~$15
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false
    }
  },
  "anthropic/claude-3.5-sonnet:beta": {
    id: "anthropic/claude-3.5-sonnet:beta",
    provider: "openrouter",
    model: "anthropic/claude-3.5-sonnet:beta",
    costPerMillionTokens: 3,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false
    }
  },
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    provider: "openrouter",
    model: "openai/gpt-4o",
    costPerMillionTokens: 2.5,
    // Input, output is ~$10
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: true
    }
  },
  "google/gemini-2.0-flash-exp": {
    id: "google/gemini-2.0-flash-exp",
    provider: "openrouter",
    model: "google/gemini-2.0-flash-exp",
    costPerMillionTokens: 0.075,
    // Very cheap!
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false
    }
  },
  "google/gemini-2.5-pro": {
    id: "google/gemini-2.5-pro",
    provider: "openrouter",
    model: "google/gemini-2.5-pro",
    costPerMillionTokens: 1.25,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false
    }
  },
  "google/gemini-2.5-flash-thinking-exp": {
    id: "google/gemini-2.5-flash-thinking-exp",
    provider: "openrouter",
    model: "google/gemini-2.5-flash-thinking-exp",
    costPerMillionTokens: 0.1,
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: false
    }
  },
  // ========== FAST CHEAP MODELS (Routing, classification) ==========
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    provider: "openrouter",
    model: "openai/gpt-4o-mini",
    costPerMillionTokens: 0.15,
    // Input, output is ~$0.60
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: true
    }
  },
  "deepseek/deepseek-chat": {
    id: "deepseek/deepseek-chat",
    provider: "openrouter",
    model: "deepseek/deepseek-chat",
    costPerMillionTokens: 0.27,
    // Input, output is ~$1.10
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: true
    }
  },
  "deepseek/deepseek-chat-v3-0324": {
    id: "deepseek/deepseek-chat-v3-0324",
    provider: "openrouter",
    model: "deepseek/deepseek-chat-v3-0324",
    costPerMillionTokens: 0.27,
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: true
    }
  },
  "deepseek/deepseek-r1": {
    id: "deepseek/deepseek-r1",
    provider: "openrouter",
    model: "deepseek/deepseek-r1",
    costPerMillionTokens: 0.55,
    // Reasoning model
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: true
    }
  },
  // ========== ULTRA-CHEAP MODELS ==========
  // Note: Free models change frequently - check openrouter.ai for current free options
  // ========== VISION MODELS ==========
  "anthropic/claude-3.5-sonnet": {
    id: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    model: "anthropic/claude-3.5-sonnet",
    costPerMillionTokens: 3,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false
    }
  },
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    provider: "openrouter",
    model: "openai/gpt-4o",
    costPerMillionTokens: 2.5,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: true
    }
  },
  "google/gemini-2.0-flash-exp": {
    id: "google/gemini-2.0-flash-exp",
    provider: "openrouter",
    model: "google/gemini-2.0-flash-exp",
    costPerMillionTokens: 0.075,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false
    }
  },
  // ========== REASONING MODELS ==========
  "deepseek/deepseek-r1": {
    id: "deepseek/deepseek-r1",
    provider: "openrouter",
    model: "deepseek/deepseek-r1",
    costPerMillionTokens: 0.55,
    capabilities: {
      vision: false,
      streaming: true,
      jsonMode: true
    }
  }
};
var MODEL_ALIASES = {
  // Primary models
  "premium": "anthropic/claude-3.5-sonnet",
  "fast": "openai/gpt-4o-mini",
  "cheap": "deepseek/deepseek-chat",
  // Specific model aliases
  "claude": "anthropic/claude-3.5-sonnet",
  "gpt4": "openai/gpt-4o",
  "gpt4-mini": "openai/gpt-4o-mini",
  "gemini": "google/gemini-2.5-flash-thinking-exp",
  "deepseek": "deepseek/deepseek-chat",
  "deepseek-r1": "deepseek/deepseek-r1"
};
var OpenRouterClient = class {
  constructor(config) {
    this.config = config;
    this.baseURL = config.baseURL || "https://openrouter.ai/api/v1";
  }
  /**
   * Send a chat completion request
   */
  async chat(messages, options = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const model = options.model || "anthropic/claude-3.5-sonnet";
    const requestBody = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content
      })),
      temperature: (_a = options.temperature) != null ? _a : 0.7,
      max_tokens: (_b = options.maxTokens) != null ? _b : 4096,
      top_p: options.topP,
      stream: (_c = options.stream) != null ? _c : false
    };
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": typeof window !== "undefined" ? window.location.href : "https://schoolgle.co.uk",
        "X-Title": "Schoolgle Ed"
      },
      body: JSON.stringify(requestBody),
      signal: options.timeout ? AbortSignal.timeout(options.timeout) : void 0
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new OpenRouterError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        response.status,
        errorText
      );
    }
    const data = await response.json();
    const choice = (_d = data.choices) == null ? void 0 : _d[0];
    if (!choice) {
      throw new OpenRouterError("No choices returned from OpenRouter", 500);
    }
    return {
      content: ((_e = choice.message) == null ? void 0 : _e.content) || "",
      model: data.model || model,
      usage: {
        promptTokens: ((_f = data.usage) == null ? void 0 : _f.prompt_tokens) || 0,
        completionTokens: ((_g = data.usage) == null ? void 0 : _g.completion_tokens) || 0,
        totalTokens: ((_h = data.usage) == null ? void 0 : _h.total_tokens) || 0
      },
      finishReason: choice.finish_reason
    };
  }
  /**
   * Send a chat completion request with system prompt
   */
  async chatWithSystem(systemPrompt, userMessage, options = {}) {
    return this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      options
    );
  }
  /**
   * Stream a chat completion (for future implementation)
   */
  chatStream(_0) {
    return __asyncGenerator(this, arguments, function* (messages, options = {}) {
      var _a, _b, _c, _d, _e, _f;
      const model = options.model || "anthropic/claude-3.5-sonnet";
      const requestBody = {
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content
        })),
        temperature: (_a = options.temperature) != null ? _a : 0.7,
        max_tokens: (_b = options.maxTokens) != null ? _b : 4096,
        stream: true
      };
      const response = yield new __await(fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://schoolgle.co.uk",
          "X-Title": "Schoolgle Ed"
        },
        body: JSON.stringify(requestBody)
      }));
      if (!response.ok) {
        throw new OpenRouterError(
          `OpenRouter API error: ${response.status} ${response.statusText}`,
          response.status
        );
      }
      const reader = (_c = response.body) == null ? void 0 : _c.getReader();
      if (!reader) throw new OpenRouterError("No response body", 500);
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = yield new __await(reader.read());
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim());
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") return;
              try {
                const parsed = JSON.parse(data);
                const content = (_f = (_e = (_d = parsed.choices) == null ? void 0 : _d[0]) == null ? void 0 : _e.delta) == null ? void 0 : _f.content;
                if (content) yield content;
              } catch (e) {
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    });
  }
  /**
   * Get model info
   */
  getModel(modelIdOrAlias) {
    const modelId = MODEL_ALIASES[modelIdOrAlias] || modelIdOrAlias;
    return OPENROUTER_MODELS[modelId];
  }
  /**
   * Get all available models
   */
  getAllModels() {
    return __spreadValues({}, OPENROUTER_MODELS);
  }
};
var OpenRouterError = class extends Error {
  constructor(message, statusCode, responseText) {
    super(message);
    this.statusCode = statusCode;
    this.responseText = responseText;
    this.name = "OpenRouterError";
  }
};
function createOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }
  return new OpenRouterClient({
    apiKey,
    timeout: 3e4
    // 30 second default
  });
}

// src/models/router.ts
var TASK_MODEL_MAP = {
  // Fast/cheap for routing
  "intent-classification": ["openai/gpt-4o-mini", "google/gemini-2.0-flash-exp", "deepseek/deepseek-chat"],
  "work-focus-check": ["openai/gpt-4o-mini", "google/gemini-2.0-flash-exp"],
  // High quality for specialist responses
  "specialist-response": ["anthropic/claude-3.5-sonnet", "deepseek/deepseek-chat", "openai/gpt-4o"],
  "perspective-generation": ["deepseek/deepseek-chat", "openai/gpt-4o-mini", "google/gemini-2.0-flash-exp"],
  "synthesis": ["anthropic/claude-3.5-sonnet", "deepseek/deepseek-chat"],
  // Vision needed
  "ui-analysis": ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "google/gemini-2.5-pro"],
  // Fast/cheap for actions
  "action-planning": ["openai/gpt-4o-mini", "google/gemini-2.0-flash-exp"]
};
var PLAN_MODEL_CONSTRAINTS = {
  "free": ["openai/gpt-4o-mini", "google/gemini-2.0-flash-exp", "deepseek/deepseek-chat"],
  "schools": ["anthropic/claude-3.5-sonnet", "deepseek/deepseek-chat", "openai/gpt-4o", "google/gemini-2.0-flash-exp"],
  "trusts": ["anthropic/claude-3.5-sonnet", "deepseek/deepseek-r1", "openai/gpt-4o"]
};
var ModelRouter = class {
  constructor() {
    this.client = createOpenRouterClient();
  }
  /**
   * Select the best model for a given task based on context
   */
  selectModel(task, context) {
    const availableModels = TASK_MODEL_MAP[task] || TASK_MODEL_MAP["specialist-response"];
    const { plan, creditsRemaining } = context.subscription;
    const planModels = PLAN_MODEL_CONSTRAINTS[plan] || availableModels;
    const eligibleModels = availableModels.filter((m) => planModels.includes(m));
    if (creditsRemaining < 1e3) {
      return this.getCheapestModel(eligibleModels);
    }
    const modelId = eligibleModels[0];
    const model = OPENROUTER_MODELS[modelId];
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    return model;
  }
  /**
   * Send chat completion request
   */
  async chat(systemPrompt, userMessage, options = {}) {
    return this.client.chatWithSystem(systemPrompt, userMessage, options);
  }
  /**
   * Send chat completion with message array
   */
  async chatMessages(messages, options = {}) {
    return this.client.chat(messages, options);
  }
  /**
   * Stream chat completion (for future use)
   */
  chatStream(_0) {
    return __asyncGenerator(this, arguments, function* (messages, options = {}) {
      yield* __yieldStar(this.client.chatStream(messages, options));
    });
  }
  /**
   * Get cheapest model from list
   */
  getCheapestModel(modelIds) {
    let cheapest = OPENROUTER_MODELS[modelIds[0]];
    let lowestCost = (cheapest == null ? void 0 : cheapest.costPerMillionTokens) || Infinity;
    for (const modelId of modelIds) {
      const model = OPENROUTER_MODELS[modelId];
      if (model && model.costPerMillionTokens < lowestCost) {
        cheapest = model;
        lowestCost = model.costPerMillionTokens;
      }
    }
    return cheapest || OPENROUTER_MODELS["openai/gpt-4o-mini"];
  }
  /**
   * Get model by ID or alias
   */
  getModel(idOrAlias) {
    const modelId = MODEL_ALIASES[idOrAlias] || idOrAlias;
    return OPENROUTER_MODELS[modelId];
  }
  /**
   * Get all available models
   */
  getAllModels() {
    return __spreadValues({}, OPENROUTER_MODELS);
  }
};
var routerInstance = null;
function getModelRouter() {
  if (!routerInstance) {
    routerInstance = new ModelRouter();
  }
  return routerInstance;
}

// src/perspectives/generator.ts
var OPTIMIST_PROMPT = `You are the OPTIMIST perspective.

Your role is to highlight:
- What's working well
- What's possible
- Positive outcomes
- Encouraging aspects
- Benefits and opportunities

Keep it brief (2-3 sentences max). Focus on possibilities and what could go right.

**Important:** Be specific to the question asked, not generic positivity.`;
var CRITIC_PROMPT = `You are the CRITIC perspective (devil's advocate).

Your role is to highlight:
- What could go wrong
- Risks and concerns
- Missing information
- Areas that need caution
- Potential pitfalls

Keep it brief (2-3 sentences max). Focus on safety and what could go wrong.

**Important:** Be specific to the question asked, not generic negativity.`;
var NEUTRAL_PROMPT = `You are the NEUTRAL perspective.

Your role is to provide:
- Balanced factual summary
- Key points only
- No bias either way
- Objective assessment

Keep it brief (2-3 sentences max). Focus on facts.

**Important:** Be specific to the question asked, avoid vague statements.`;
var SYNTHESIS_PROMPT = `You are a SYNTHESIZER.

Your role is to combine three perspectives into a balanced, actionable response.

You will receive:
1. The original question
2. An expert's answer
3. Three perspectives: optimist, critic, and neutral

Create a response that:
- Acknowledges the expert guidance
- Incorporates valid points from all perspectives
- Provides a balanced view of the situation
- Ends with clear, actionable next steps

Be concise but comprehensive. Use markdown formatting for readability.`;
async function generateMultiPerspectiveResponse(question, specialistResponse, context) {
  const perspectiveModelId = "deepseek/deepseek-chat";
  const synthesisModelId = "anthropic/claude-3.5-sonnet";
  try {
    const [optimist, critic, neutral] = await Promise.all([
      generatePerspective(question, specialistResponse, "optimist", context, perspectiveModelId),
      generatePerspective(question, specialistResponse, "critic", context, perspectiveModelId),
      generatePerspective(question, specialistResponse, "neutral", context, perspectiveModelId)
    ]);
    const synthesized = await synthesizeResponse(question, specialistResponse, {
      optimist,
      critic,
      neutral
    }, context, synthesisModelId);
    return {
      synthesized,
      perspectives: {
        optimist,
        critic,
        neutral
      }
    };
  } catch (error) {
    console.error("Perspective generation failed:", error);
    return {
      synthesized: `${specialistResponse}

*Note: Unable to generate additional perspectives at this time.*`,
      perspectives: void 0
    };
  }
}
async function generatePerspective(question, specialistResponse, type, context, modelId) {
  const router = getModelRouter();
  const prompt = getPerspectivePrompt(type);
  const userMessage = `
**Question:** ${question}

**Specialist Response:** ${specialistResponse}

Provide your ${type} perspective on this guidance.`;
  try {
    const response = await router.chat(
      prompt,
      userMessage,
      {
        model: modelId,
        temperature: 0.7,
        maxTokens: 200
        // Perspectives should be brief
      }
    );
    return response.content.trim();
  } catch (error) {
    return getFallbackPerspective(type, question);
  }
}
function getPerspectivePrompt(type) {
  switch (type) {
    case "optimist":
      return OPTIMIST_PROMPT;
    case "critic":
      return CRITIC_PROMPT;
    case "neutral":
      return NEUTRAL_PROMPT;
  }
}
async function synthesizeResponse(question, specialistResponse, perspectives, context, modelId) {
  const router = getModelRouter();
  const userMessage = `
**Question:** ${question}

**Specialist Response:**
${specialistResponse}

**Perspectives:**

**Optimist says:**
${perspectives.optimist}

**Critic says:**
${perspectives.critic}

**Neutral says:**
${perspectives.neutral}

Please synthesize this into a balanced, actionable response.`;
  try {
    const response = await router.chat(
      SYNTHESIS_PROMPT,
      userMessage,
      {
        model: modelId,
        temperature: 0.7,
        maxTokens: 1e3
      }
    );
    return response.content.trim();
  } catch (error) {
    return formatFallbackSynthesis(specialistResponse, perspectives);
  }
}
function getFallbackPerspective(type, question) {
  switch (type) {
    case "optimist":
      return "From a positive perspective, this is a solvable challenge with clear steps forward. Following the guidance should lead to successful outcomes.";
    case "critic":
      return "From a cautious perspective, ensure you verify all guidance is current and follow procedures carefully. Don't cut corners on safety or compliance.";
    case "neutral":
      return "From a balanced perspective, follow the established procedures and verify guidance for your specific situation.";
  }
}
function formatFallbackSynthesis(specialistResponse, perspectives) {
  return `${specialistResponse}

---

### Additional Perspectives

**Optimistic View:**
${perspectives.optimist}

**Cautious View:**
${perspectives.critic}

**Balanced View:**
${perspectives.neutral}`;
}
var perspectiveCache = /* @__PURE__ */ new Map();
var CACHE_TTL = 1e3 * 60 * 60;
async function generatePerspectivesCached(question, specialistResponse, context) {
  const cacheKey = `${question}:${specialistResponse.substring(0, 100)}`;
  const cached = perspectiveCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.perspectives;
  }
  const result = await generateMultiPerspectiveResponse(question, specialistResponse, context);
  perspectiveCache.set(cacheKey, {
    perspectives: result,
    timestamp: Date.now()
  });
  return result;
}
function clearPerspectiveCache() {
  perspectiveCache.clear();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CRITIC_PROMPT,
  NEUTRAL_PROMPT,
  OPTIMIST_PROMPT,
  SYNTHESIS_PROMPT,
  clearPerspectiveCache,
  generateMultiPerspectiveResponse,
  generatePerspectivesCached
});
//# sourceMappingURL=index.js.map