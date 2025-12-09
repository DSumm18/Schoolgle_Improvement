/**
 * Test streaming responses from Ed backend
 */

const OPENROUTER_KEY = process.env.VITE_OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

if (!OPENROUTER_KEY) {
  console.error('❌ ERROR: No API key found');
  console.error('   Set VITE_OPENROUTER_API_KEY or OPENAI_API_KEY');
  process.exit(1);
}

console.log('✓ API key found\n');
console.log('🧪 Testing Ed Streaming API\n');

const testStreaming = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/ed/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Explain Ofsted in one sentence.' }
        ],
        context: {
          organizationId: 'demo',
          schoolName: 'Test School',
          product: 'schoolgle-platform'
        },
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    console.log('✅ Streaming connection established!\n');
    console.log('Response:');
    console.log('─'.repeat(60));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                process.stdout.write(parsed.content);
                fullResponse += parsed.content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`\n✨ Total characters: ${fullResponse.length}`);
    console.log('\n🎉 Streaming test successful!');

    return true;
  } catch (error) {
    console.error('❌ Streaming test failed:', error.message);
    return false;
  }
};

testStreaming();
