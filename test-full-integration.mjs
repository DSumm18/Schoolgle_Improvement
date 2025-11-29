const API_KEY = "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";

console.log('🧪 Full Integration Test: Ed Backend → OpenRouter\n');
console.log('Testing with actual API key...\n');

// Test 1: Direct OpenRouter API
console.log('Test 1: Direct OpenRouter Connection');
console.log('=====================================');

const directTest = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://schoolgle.co.uk',
    'X-Title': 'Schoolgle Ed AI'
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-chat',
    messages: [{ role: 'user', content: 'Briefly explain what Ofsted looks for in reading in UK schools.' }],
    max_tokens: 150
  })
});

const directData = await directTest.json();

if (directData.error) {
  console.log('❌ Direct API Failed:', directData.error.message);
} else {
  console.log('✅ Direct API Success!');
  console.log('\nResponse:');
  console.log('─'.repeat(70));
  console.log(directData.choices[0].message.content);
  console.log('─'.repeat(70));
  console.log(`\nModel: ${directData.model}`);
  console.log(`Tokens: ${directData.usage.total_tokens}`);
}

// Test 2: Ed API Endpoint
console.log('\n\nTest 2: Ed API Endpoint (via Next.js)');
console.log('======================================');

const edTest = await fetch('http://localhost:3000/api/ed/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Briefly explain what Ofsted looks for in reading.' }
    ],
    context: {
      organizationId: 'demo',
      schoolName: 'Test Primary School',
      page: 'quality-of-education'
    }
  })
});

const edData = await edTest.json();

if (edData.error || !edData.metadata) {
  console.log('⚠️  Ed API returned fallback response');
  console.log('This means the API route is working but OpenRouter call failed');
  console.log('\nFallback response:');
  console.log(edData.response.substring(0, 150) + '...');
} else {
  console.log('✅ Ed API Success!');
  console.log('\nEd Response:');
  console.log('─'.repeat(70));
  console.log(edData.response);
  console.log('─'.repeat(70));
  console.log(`\nModel: ${edData.metadata.model}`);
  console.log(`Tokens: ${edData.metadata.tokens}`);
  console.log(`Cost: $${edData.metadata.cost.toFixed(5)}`);
}

console.log('\n\n🎯 Integration Test Complete!');
