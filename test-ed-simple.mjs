/**
 * Simple test for Ed backend - tests OpenRouter connection only
 */

const OPENROUTER_KEY = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENROUTER_KEY) {
  console.error('❌ ERROR: No API key found');
  console.error('   Set VITE_OPENROUTER_API_KEY or OPENAI_API_KEY');
  process.exit(1);
}

console.log('✓ API key found\n');
console.log('🧪 Testing OpenRouter Connection\n');

// Test direct API call
const testConnection = async () => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://schoolgle.co.uk',
        'X-Title': 'Schoolgle Ed AI Test'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'user', content: 'Say "Hello from Ed!"' }
        ],
        max_tokens: 20
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content;

    console.log('✅ OpenRouter API connection successful!\n');
    console.log('Response from DeepSeek Chat:');
    console.log('─'.repeat(60));
    console.log(message);
    console.log('─'.repeat(60));
    console.log(`\nModel: ${data.model}`);
    console.log(`Tokens used: ${data.usage?.total_tokens || 'unknown'}`);
    console.log('\n🎉 Ed backend API integration working!');

    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
};

testConnection();
