/**
 * Simplified test that directly imports from source
 * This avoids the bundling issues with tsup/tsx
 */

import { createTestOrchestrator } from '../src/orchestrator/orchestrator';

async function test() {
  console.log('🤖 Ed Agent Framework - Simplified Test\n');

  const orchestrator = createTestOrchestrator({
    enableMultiPerspective: false, // Start without multi-perspective
  });

  console.log('✅ Orchestrator created\n');

  // Test 1: Simple question
  console.log('Test 1: "What temperature should legionella water be?"');
  const startTime = Date.now();

  const response = await orchestrator.processQuestion('What temperature should legionella water be?');

  const duration = Date.now() - startTime;

  console.log(`Specialist: ${response.specialist}`);
  console.log(`Confidence: ${response.confidence}`);
  console.log(`Duration: ${duration}ms`);
  console.log(`Response: ${response.response.substring(0, 200)}...`);

  if (response.metadata.tokensUsed) {
    console.log(`Tokens: ${response.metadata.tokensUsed.total}`);
    console.log(`Cost: $${response.metadata.tokensUsed.cost.toFixed(4)}`);
  }

  // Get credit summary
  const summary = orchestrator.getCreditSummary();
  console.log(`\nSession tokens: ${summary.totalSessionTokens || 0}`);
  console.log(`Estimated cost: $${summary.estimatedCost?.toFixed(4) || '0.0000'}`);
}

test().catch(console.error);
