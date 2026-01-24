import {
  calculateCost
} from "./chunk-XCFC4OXF.mjs";
import {
  __spreadValues
} from "./chunk-C3N2FVDJ.mjs";

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

export {
  CreditManager,
  createCreditManager
};
//# sourceMappingURL=chunk-DHRE3F6T.mjs.map