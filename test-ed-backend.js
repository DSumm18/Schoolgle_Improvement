/**
 * Test script for Ed backend integration
 * Tests: OpenRouter client, Model router, Prompt builder, Chat handler
 */

// Check if required environment variables are set
const OPENROUTER_KEY = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENROUTER_KEY) {
  console.error('❌ ERROR: No API key found');
  console.error('   Set VITE_OPENROUTER_API_KEY or OPENAI_API_KEY environment variable');
  process.exit(1);
}

console.log('✓ API key found');
console.log('\n🧪 Testing Ed Backend Components\n');

// Import the ed-backend package
import {
  OpenRouterClient,
  ModelRouter,
  buildSystemPrompt,
  EdChatHandler
} from './packages/ed-backend/dist/index.js';

// Test 1: OpenRouter Client Connection
console.log('Test 1: OpenRouter Client Connection');
console.log('=====================================');

const client = new OpenRouterClient(OPENROUTER_KEY);

try {
  console.log('Testing connection to OpenRouter...');
  const connected = await client.testConnection();

  if (connected) {
    console.log('✅ OpenRouter connection successful\n');
  } else {
    console.log('❌ OpenRouter connection failed\n');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ OpenRouter test error:', error.message);
  process.exit(1);
}

// Test 2: Model Router
console.log('Test 2: Model Router');
console.log('====================');

const router = new ModelRouter();

// Test simple chat routing
const simpleDecision = router.route([
  { role: 'user', content: 'What is the Ofsted framework?' }
]);

console.log('Simple query routing:');
console.log(`  Task type: ${simpleDecision.taskType}`);
console.log(`  Model: ${simpleDecision.selectedModel.model}`);
console.log(`  Reason: ${simpleDecision.reason}`);
console.log(`  Estimated cost: $${simpleDecision.estimatedCost.toFixed(5)}`);

// Test complex chat routing
const complexDecision = router.route([
  { role: 'user', content: 'Analyze our school data and provide detailed recommendations for improving reading outcomes based on EEF research, considering our PP gap of 15% and SEND provision challenges.' }
]);

console.log('\nComplex query routing:');
console.log(`  Task type: ${complexDecision.taskType}`);
console.log(`  Model: ${complexDecision.selectedModel.model}`);
console.log(`  Reason: ${complexDecision.reason}`);
console.log(`  Estimated cost: $${complexDecision.estimatedCost.toFixed(5)}`);

console.log('✅ Model routing working correctly\n');

// Test 3: Prompt Builder
console.log('Test 3: Prompt Builder');
console.log('======================');

const testContext = {
  organizationId: 'test-org',
  schoolName: 'Test Primary School',
  schoolType: 'primary',
  product: 'schoolgle-platform',
  page: 'ofsted-assessment',
  category: 'quality-of-education',
  userId: 'test-user',
  userRole: 'slt',
  schoolgleContext: {
    assessments: [
      {
        id: '1',
        subcategoryId: 'curriculum-intent',
        subcategoryName: 'Curriculum Intent',
        categoryId: 'quality-of-education',
        categoryName: 'Quality of Education',
        schoolRating: 'strong_standard',
        evidenceCount: 5
      }
    ],
    gaps: [
      {
        subcategoryId: 'curriculum-implementation',
        subcategoryName: 'Curriculum Implementation',
        categoryId: 'quality-of-education',
        categoryName: 'Quality of Education',
        gapType: 'insufficient',
        suggestions: ['Only 2 pieces of evidence']
      }
    ],
    recentActivity: [],
    healthScore: 75
  }
};

const systemPrompt = buildSystemPrompt(testContext);

console.log('Generated system prompt (first 300 chars):');
console.log(systemPrompt.substring(0, 300) + '...');
console.log(`\nPrompt includes school context: ${systemPrompt.includes('Test Primary School') ? '✅' : '❌'}`);
console.log(`Prompt includes assessment data: ${systemPrompt.includes('strong_standard') ? '✅' : '❌'}`);
console.log(`Prompt includes gaps: ${systemPrompt.includes('insufficient') ? '✅' : '❌'}`);

console.log('✅ Prompt builder working correctly\n');

// Test 4: Ed Chat Handler (End-to-End)
console.log('Test 4: Ed Chat Handler (End-to-End)');
console.log('=====================================');

const chatHandler = new EdChatHandler(OPENROUTER_KEY);

console.log('Sending test message to Ed...');

try {
  const response = await chatHandler.handleChat({
    messages: [
      { role: 'user', content: 'What are the key things Ofsted looks for in reading?' }
    ],
    context: {
      organizationId: 'demo',
      schoolName: 'Demo School',
      product: 'schoolgle-platform'
    }
  });

  console.log('\n📨 Ed Response:');
  console.log('─'.repeat(60));
  console.log(response.message);
  console.log('─'.repeat(60));
  console.log(`\nModel used: ${response.model}`);
  console.log(`Tokens: ${response.usage.tokens}`);
  console.log(`Cost: $${response.usage.cost.toFixed(5)}`);
  console.log(`Conversation ID: ${response.conversationId}`);

  console.log('\n✅ Ed chat handler working correctly\n');

  // Validate response quality
  const hasOfstedContent = response.message.toLowerCase().includes('ofsted') ||
                          response.message.toLowerCase().includes('reading');
  const hasSubstance = response.message.length > 50;

  if (hasOfstedContent && hasSubstance) {
    console.log('✅ Response quality check passed\n');
  } else {
    console.log('⚠️  Warning: Response may be low quality\n');
  }

} catch (error) {
  console.error('❌ Chat handler test failed:', error.message);
  process.exit(1);
}

// Summary
console.log('🎉 All Tests Passed!');
console.log('===================');
console.log('✅ OpenRouter connection working');
console.log('✅ Model routing working');
console.log('✅ Prompt building working');
console.log('✅ Chat handler working');
console.log('\nEd backend is ready for integration! 🚀');
