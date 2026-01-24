/**
 * OpenRouter Integration Tests
 *
 * These tests verify the OpenRouter integration works correctly.
 * Set OPENROUTER_API_KEY environment variable before running.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { createOpenRouterClient, getModelRouter, MODEL_ALIASES } from '../models';

describe('OpenRouter Integration', () => {
  let client: ReturnType<typeof createOpenRouterClient>;

  beforeAll(() => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn('OPENROUTER_API_KEY not set - skipping OpenRouter tests');
      return;
    }
    client = createOpenRouterClient();
  });

  describe('Model Catalog', () => {
    it('should have model aliases defined', () => {
      expect(MODEL_ALIASES.premium).toBe('anthropic/claude-3.5-sonnet');
      expect(MODEL_ALIASES.fast).toBe('openai/gpt-4o-mini');
      expect(MODEL_ALIASES.cheap).toBe('deepseek/deepseek-chat');
      expect(MODEL_ALIASES.gemini).toBe('google/gemini-2.0-flash-exp');
    });

    it('should resolve model aliases', () => {
      const router = getModelRouter();

      expect(router.getModel('premium')?.id).toBe('anthropic/claude-3.5-sonnet');
      expect(router.getModel('claude')?.id).toBe('anthropic/claude-3.5-sonnet');
      expect(router.getModel('gpt4')?.id).toBe('openai/gpt-4o');
      expect(router.getModel('fast')?.id).toBe('openai/gpt-4o-mini');
    });

    it('should have vision capabilities defined', () => {
      const router = getModelRouter();

      const claude = router.getModel('anthropic/claude-3.5-sonnet');
      expect(claude?.capabilities.vision).toBe(true);

      const gpt4 = router.getModel('openai/gpt-4o');
      expect(gpt4?.capabilities.vision).toBe(true);

      const deepseek = router.getModel('deepseek/deepseek-chat');
      expect(deepseek?.capabilities.vision).toBe(false);
    });
  });

  describe.skipIf(!process.env.OPENROUTER_API_KEY)('API Calls', () => {
    it('should send a simple chat request', async () => {
      const response = await client.chatWithSystem(
        'You are a helpful assistant. Answer briefly.',
        'What is 2 + 2?',
        { model: 'openai/gpt-4o-mini' }
      );

      expect(response.content).toBeTruthy();
      expect(response.usage.totalTokens).toBeGreaterThan(0);
      expect(response.model).toBeTruthy();
    });

    it('should support different models', async () => {
      const models = ['openai/gpt-4o-mini', 'deepseek/deepseek-chat'];

      for (const model of models) {
        const response = await client.chatWithSystem(
          'You are Ed, a helpful school assistant.',
          'What is RIDDOR?',
          { model, maxTokens: 100 }
        );

        expect(response.content).toBeTruthy();
        expect(response.model).toBeTruthy();
      }
    });

    it('should handle specialist prompts', async () => {
      const specialistPrompt = `You are the ESTATES COMPLIANCE SPECIALIST.

Your Qualifications:
- IOSH certified
- NEBOSH National General Certificate
- IWFM Level 4

Question: What temperature should cold water outlets be?`;

      const response = await client.chatWithSystem(
        specialistPrompt,
        'What temperature should cold water outlets be?',
        { model: 'anthropic/claude-3.5-sonnet', maxTokens: 500 }
      );

      expect(response.content).toBeTruthy();
      expect(response.content.toLowerCase()).toContain('20');
      expect(response.usage.totalTokens).toBeGreaterThan(0);
    });
  });
});

describe('Model Router', () => {
  it('should select models based on task', () => {
    const router = getModelRouter();

    const mockContext = {
      userId: 'test',
      orgId: 'test',
      userRole: 'staff' as const,
      subscription: {
        plan: 'schools' as const,
        features: [],
        creditsRemaining: 10000,
        creditsUsed: 0,
      },
    };

    const classificationModel = router.selectModel('intent-classification', mockContext);
    expect(classificationModel.id).toBe('openai/gpt-4o-mini');

    const specialistModel = router.selectModel('specialist-response', mockContext);
    expect(specialistModel.id).toBe('anthropic/claude-3.5-sonnet');
  });

  it('should select cheaper models when credits are low', () => {
    const router = getModelRouter();

    const lowCreditsContext = {
      userId: 'test',
      orgId: 'test',
      userRole: 'staff' as const,
      subscription: {
        plan: 'schools' as const,
        features: [],
        creditsRemaining: 500, // Low!
        creditsUsed: 0,
      },
    };

    const model = router.selectModel('specialist-response', lowCreditsContext);
    // Should select cheapest option
    expect(['deepseek/deepseek-chat', 'openai/gpt-4o-mini']).toContain(model.id);
  });

  it('should respect plan constraints', () => {
    const router = getModelRouter();

    const freeContext = {
      userId: 'test',
      orgId: 'test',
      userRole: 'viewer' as const,
      subscription: {
        plan: 'free' as const,
        features: [],
        creditsRemaining: 1000,
        creditsUsed: 0,
      },
    };

    const model = router.selectModel('specialist-response', freeContext);
    // Free plan shouldn't get Claude
    expect(model.id).not.toBe('anthropic/claude-3.5-sonnet');
  });
});
