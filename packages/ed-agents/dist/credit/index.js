"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
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

// src/credit/index.ts
var credit_exports = {};
__export(credit_exports, {
  CreditManager: () => CreditManager,
  createCreditManager: () => createCreditManager
});
module.exports = __toCommonJS(credit_exports);

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
function calculateTokenCost(modelId, inputTokens, outputTokens) {
  const model = OPENROUTER_MODELS[modelId];
  if (!model) return 0;
  const inputCost = inputTokens / 1e6 * model.costPerMillionTokens;
  const outputCost = outputTokens / 1e6 * (model.costPerMillionTokens * 3);
  return inputCost + outputCost;
}

// src/models/router.ts
function calculateCost(modelId, inputTokens, outputTokens) {
  return calculateTokenCost(modelId, inputTokens, outputTokens);
}

// src/credit/manager.ts
var CreditManager = class {
  constructor(subscription) {
    this.state = {
      subscription,
      sessionUsage: 0,
      lastReset: /* @__PURE__ */ new Date()
    };
  }
  /**
   * Track credit usage for a request
   */
  trackUsage(modelId, inputTokens, outputTokens) {
    const cost = calculateCost(modelId, inputTokens, outputTokens);
    const totalTokens = inputTokens + outputTokens;
    this.state.sessionUsage += cost;
    return {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
      cost
    };
  }
  /**
   * Get remaining credits
   */
  getRemainingCredits() {
    return Math.max(0, this.state.subscription.creditsRemaining - this.state.sessionUsage);
  }
  /**
   * Get session usage
   */
  getSessionUsage() {
    return this.state.sessionUsage;
  }
  /**
   * Check if user has sufficient credits
   */
  hasSufficientCredits(estimatedCost) {
    return this.getRemainingCredits() >= estimatedCost;
  }
  /**
   * Get subscription plan
   */
  getPlan() {
    return this.state.subscription.plan;
  }
  /**
   * Update subscription (e.g., after credits purchased)
   */
  updateSubscription(subscription) {
    this.state.subscription = __spreadValues(__spreadValues({}, this.state.subscription), subscription);
  }
  /**
   * Get credit usage summary
   */
  getSummary() {
    return {
      plan: this.state.subscription.plan,
      creditsRemaining: this.state.subscription.creditsRemaining,
      sessionUsage: this.state.sessionUsage,
      estimatedRemaining: this.getRemainingCredits()
    };
  }
  /**
   * Reset session usage
   */
  resetSession() {
    this.state.sessionUsage = 0;
    this.state.lastReset = /* @__PURE__ */ new Date();
  }
};
function createCreditManager(subscription) {
  return new CreditManager(subscription);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CreditManager,
  createCreditManager
});
//# sourceMappingURL=index.js.map