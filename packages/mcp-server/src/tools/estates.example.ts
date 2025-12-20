/**
 * Example/Test Harness for generate_room_brief
 * 
 * Demonstrates:
 * - Case with rules -> LLM used
 * - Case without rules -> LLM not used
 * 
 * Usage:
 * - Set OPENROUTER_API_KEY in environment
 * - Run: npx tsx src/tools/estates.example.ts
 */

import { handleGenerateRoomBrief } from './estates.js';
import type { AuthContext } from '@schoolgle/core/auth';

// Mock auth context for testing
const mockContext: AuthContext = {
  organizationId: 'test-org-123',
  userId: 'test-user-456',
  supabase: {
    from: () => ({
      insert: () => Promise.resolve({ data: null, error: null }),
    }),
  } as any,
};

/**
 * Example 1: With rules (LLM will be used)
 */
async function exampleWithRules() {
  console.log('\n=== Example 1: With Rules (LLM Used) ===\n');
  
  try {
    const result = await handleGenerateRoomBrief(
      {
        roomType: 'classroom_minimum_area',
        constraints: 'primary school, 30 pupils',
        ageGroup: 'primary',
      },
      mockContext,
      'req-with-rules',
      'session-1'
    );
    
    console.log('✅ Success!');
    console.log(`LLM Used: ${result.llm_used}`);
    console.log(`Model: ${result.model || 'N/A'}`);
    console.log(`\nProject Summary:\n${result.project_summary}`);
    console.log(`\nOpen Questions: ${result.open_questions.length}`);
    console.log(`Cited Guidance: ${result.cited_guidance_used.length} sources`);
    console.log(`\nFull result:`, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example 2: Without rules (LLM will NOT be used)
 */
async function exampleWithoutRules() {
  console.log('\n=== Example 2: Without Rules (LLM Not Used) ===\n');
  
  try {
    const result = await handleGenerateRoomBrief(
      {
        roomType: 'nonexistent_room_type',
        constraints: 'some constraints',
      },
      mockContext,
      'req-no-rules',
      'session-2'
    );
    
    console.log('✅ Success!');
    console.log(`LLM Used: ${result.llm_used}`);
    console.log(`Model: ${result.model || 'N/A'}`);
    console.log(`\nProject Summary:\n${result.project_summary}`);
    console.log(`\nOpen Questions: ${result.open_questions.length}`);
    console.log(`\nFull result:`, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Run examples
 */
async function main() {
  console.log('🚀 Running generate_room_brief Examples\n');
  console.log('Make sure OPENROUTER_API_KEY is set in environment\n');
  
  // Check for API key
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('⚠️  OPENROUTER_API_KEY not set. LLM calls will fail.');
    console.warn('   Set it to test LLM integration: export OPENROUTER_API_KEY=your_key\n');
  }
  
  // Run examples
  await exampleWithoutRules(); // This should work even without API key
  await exampleWithRules();    // This needs API key for LLM
  
  console.log('\n✅ Examples complete!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { exampleWithRules, exampleWithoutRules };


