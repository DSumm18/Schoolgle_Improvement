import {
  __asyncGenerator,
  __await,
  __spreadValues,
  __yieldStar
} from "./chunk-C3N2FVDJ.mjs";

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
function calculateTokenCost(modelId, inputTokens, outputTokens) {
  const model = OPENROUTER_MODELS[modelId];
  if (!model) return 0;
  const inputCost = inputTokens / 1e6 * model.costPerMillionTokens;
  const outputCost = outputTokens / 1e6 * (model.costPerMillionTokens * 3);
  return inputCost + outputCost;
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
async function selectModel(task, context) {
  const router = getModelRouter();
  return router.selectModel(task, context);
}
async function checkCredits(subscription) {
  const estimatedTokens = 1e3;
  const model = OPENROUTER_MODELS["google/gemini-2.0-flash-exp"];
  const estimatedCost = estimatedTokens / 1e6 * model.costPerMillionTokens;
  return {
    sufficient: subscription.creditsRemaining > estimatedCost,
    estimatedCost
  };
}
function calculateCost(modelId, inputTokens, outputTokens) {
  return calculateTokenCost(modelId, inputTokens, outputTokens);
}
function getModel(id) {
  const router = getModelRouter();
  return router.getModel(id);
}
function getAllModels() {
  const router = getModelRouter();
  return router.getAllModels();
}

export {
  OPENROUTER_MODELS,
  MODEL_ALIASES,
  OpenRouterClient,
  OpenRouterError,
  createOpenRouterClient,
  calculateTokenCost,
  ModelRouter,
  getModelRouter,
  selectModel,
  checkCredits,
  calculateCost,
  getModel,
  getAllModels
};
//# sourceMappingURL=chunk-XCFC4OXF.mjs.map