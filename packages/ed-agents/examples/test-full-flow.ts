/**
 * Example: Test Full Ed Agent Flow
 *
 * Demonstrates the complete agent framework:
 * - Intent classification
 * - Specialist routing
 * - LLM responses via OpenRouter
 * - Multi-perspective generation (for complex decisions)
 * - Guardrails (safety, compliance, tone, permissions, sources)
 *
 * Run with:
 * OPENROUTER_API_KEY=sk-or-... npx tsx examples/test-full-flow.ts
 */

import { createTestOrchestrator } from '../src/orchestrator';

async function main() {
  console.log('🤖 Ed Agent Framework - Full Flow Test\n');

  // Create test orchestrator
  const orchestrator = createTestOrchestrator({
    enableMultiPerspective: true,
  });

  // Test cases
  const testQuestions = [
    {
      question: 'What temperature should legionella water be?',
      description: 'Simple factual question (estates)',
    },
    {
      question: 'Should we switch from SIMS to Arbor?',
      description: 'Complex decision (triggers multi-perspective)',
    },
    {
      question: 'Tell me a joke',
      description: 'Non-work question (redirect)',
    },
  ];

  for (const { question, description } of testQuestions) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Test: ${description}`);
    console.log(`Question: "${question}"`);
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      const response = await orchestrator.processQuestion(question);
      const duration = Date.now() - startTime;

      console.log(`\n📊 Specialist: ${response.specialist}`);
      console.log(`📊 Confidence: ${response.confidence}`);
      console.log(`📊 Duration: ${duration}ms`);

      if (response.metadata.tokensUsed) {
        console.log(`📊 Tokens: ${response.metadata.tokensUsed.total} (${response.metadata.tokensUsed.input} in, ${response.metadata.tokensUsed.output} out)`);
        console.log(`📊 Cost: $${response.metadata.tokensUsed.cost.toFixed(4)}`);
      }

      console.log(`\n💬 Response:\n${response.response.substring(0, 500)}...`);

      if (response.warnings) {
        console.log(`\n⚠️ Warnings: ${response.warnings.join(', ')}`);
      }

      if (response.perspectives && Object.keys(response.perspectives).length > 0) {
        console.log(`\n👥 Perspectives Generated:`);
        if (response.perspectives.optimist) {
          console.log(`  🟢 Optimist: ${response.perspectives.optimist.substring(0, 80)}...`);
        }
        if (response.perspectives.critic) {
          console.log(`  🔴 Critic: ${response.perspectives.critic.substring(0, 80)}...`);
        }
        if (response.perspectives.neutral) {
          console.log(`  🟡 Neutral: ${response.perspectives.neutral.substring(0, 80)}...`);
        }
      }

      if (response.sources && response.sources.length > 0) {
        console.log(`\n📚 Sources: ${response.sources.map(s => s.name).join(', ')}`);
      }

    } catch (error) {
      console.error(`❌ Error:`, error);
    }
  }

  // Session summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 Session Summary');
  console.log('='.repeat(60));

  const summary = orchestrator.getCreditSummary();
  console.log(`Total Tokens: ${summary.totalSessionTokens || 0}`);
  console.log(`Estimated Cost: $${summary.estimatedCost?.toFixed(4) || '0.0000'}`);
  console.log(`Credits Remaining: ${summary.creditsRemaining}`);
}

main().catch(console.error);
