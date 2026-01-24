/**
 * Example: Test OpenRouter API
 *
 * Run this to verify your OpenRouter API key works:
 * OPENROUTER_API_KEY=sk-or-... npx tsx examples/test-openrouter.ts
 */

import { createOpenRouterClient, MODEL_ALIASES } from '../src/models';

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY environment variable not set');
    console.log('\nSet it with: export OPENROUTER_API_KEY=sk-or-...');
    process.exit(1);
  }

  console.log('✅ OPENROUTER_API_KEY is set\n');

  const client = createOpenRouterClient();

  // Test 1: Simple chat
  console.log('📝 Test 1: Simple chat with gpt-4o-mini');
  try {
    const response = await client.chatWithSystem(
      'You are Ed, a helpful school assistant. Be brief and friendly.',
      'What is RIDDOR?',
      { model: MODEL_ALIASES.fast, maxTokens: 200 }
    );

    console.log(`✅ Response: "${response.content.substring(0, 100)}..."`);
    console.log(`   Model: ${response.model}`);
    console.log(`   Tokens: ${response.usage.totalTokens} (${response.usage.promptTokens} in, ${response.usage.completionTokens} out)`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n---\n');

  // Test 2: Specialist response
  console.log('📝 Test 2: Estates specialist response');
  try {
    const specialistPrompt = `You are the ESTATES COMPLIANCE SPECIALIST.

Qualifications: IOSH, NEBOSH, IWFM

Answer with sources and confidence level.`;

    const response = await client.chatWithSystem(
      specialistPrompt,
      'What temperature should legionella water be?',
      { model: MODEL_ALIASES.premium, maxTokens: 500 }
    );

    console.log(`✅ Response: "${response.content.substring(0, 200)}..."`);
    console.log(`   Model: ${response.model}`);
    console.log(`   Tokens: ${response.usage.totalTokens}`);
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n---\n');

  // Test 3: Cost comparison
  console.log('📝 Test 3: Cost comparison across models');
  const question = 'What is the school census spring deadline?';

  for (const [alias, modelId] of Object.entries(MODEL_ALIASES)) {
    try {
      const response = await client.chatWithSystem(
        'You are Ed, a school data specialist. Be brief.',
        question,
        { model: modelId, maxTokens: 100 }
      );

      console.log(`✅ ${alias.padEnd(10)} | ${response.usage.totalTokens.toString().padEnd(4)} tokens`);
    } catch (error) {
      console.log(`❌ ${alias.padEnd(10)} | Error: ${(error as Error).message}`);
    }
  }

  console.log('\n✅ All tests completed!');
}

main().catch(console.error);
