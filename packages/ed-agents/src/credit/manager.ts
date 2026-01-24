/**
 * Credit Manager
 * Tracks and manages credit usage
 */

import type { TokenUsage, SubscriptionContext } from '../types';
import { calculateCost } from '../models/router';

/**
 * Credit manager state
 */
interface CreditState {
  subscription: SubscriptionContext;
  sessionUsage: number;
  lastReset: Date;
}

/**
 * Credit Manager class
 */
export class CreditManager {
  private state: CreditState;

  constructor(subscription: SubscriptionContext) {
    this.state = {
      subscription,
      sessionUsage: 0,
      lastReset: new Date(),
    };
  }

  /**
   * Track credit usage for a request
   */
  trackUsage(modelId: string, inputTokens: number, outputTokens: number): TokenUsage {
    const cost = calculateCost(modelId, inputTokens, outputTokens);
    const totalTokens = inputTokens + outputTokens;

    this.state.sessionUsage += cost;

    return {
      input: inputTokens,
      output: outputTokens,
      total: totalTokens,
      cost,
    };
  }

  /**
   * Get remaining credits
   */
  getRemainingCredits(): number {
    return Math.max(0, this.state.subscription.creditsRemaining - this.state.sessionUsage);
  }

  /**
   * Get session usage
   */
  getSessionUsage(): number {
    return this.state.sessionUsage;
  }

  /**
   * Check if user has sufficient credits
   */
  hasSufficientCredits(estimatedCost: number): boolean {
    return this.getRemainingCredits() >= estimatedCost;
  }

  /**
   * Get subscription plan
   */
  getPlan(): SubscriptionContext['plan'] {
    return this.state.subscription.plan;
  }

  /**
   * Update subscription (e.g., after credits purchased)
   */
  updateSubscription(subscription: Partial<SubscriptionContext>): void {
    this.state.subscription = { ...this.state.subscription, ...subscription };
  }

  /**
   * Get credit usage summary
   */
  getSummary(): {
    plan: string;
    creditsRemaining: number;
    sessionUsage: number;
    estimatedRemaining: number;
  } {
    return {
      plan: this.state.subscription.plan,
      creditsRemaining: this.state.subscription.creditsRemaining,
      sessionUsage: this.state.sessionUsage,
      estimatedRemaining: this.getRemainingCredits(),
    };
  }

  /**
   * Reset session usage
   */
  resetSession(): void {
    this.state.sessionUsage = 0;
    this.state.lastReset = new Date();
  }
}

/**
 * Create a credit manager from subscription context
 */
export function createCreditManager(subscription: SubscriptionContext): CreditManager {
  return new CreditManager(subscription);
}
