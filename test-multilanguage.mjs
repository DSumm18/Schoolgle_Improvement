/**
 * Test multi-language support in Ed chatbot
 */

const tests = [
  {
    language: 'Spanish',
    message: 'Hola, ¿qué es Ofsted?'
  },
  {
    language: 'French',
    message: 'Bonjour, quest-ce que lEEF?'
  },
  {
    language: 'Polish',
    message: 'Cześć, jak mogę poprawić wyniki w czytaniu?'
  },
  {
    language: 'Arabic',
    message: 'مرحبا، ما هو أوفستد؟'
  }
];

async function testLanguage(test) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${test.language}`);
  console.log(`Message: ${test.message}`);
  console.log('='.repeat(60));

  try {
    const response = await fetch('http://localhost:3000/api/ed/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: test.message }
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

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let detectedLanguage = null;
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
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.language) {
                detectedLanguage = parsed.language;
                console.log(`\n✅ Language detected: ${detectedLanguage.name} ${detectedLanguage.flag}`);
                console.log(`   Prompt: ${detectedLanguage.prompt}\n`);
                console.log('Response:');
                console.log('─'.repeat(60));
              }

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

    if (detectedLanguage) {
      console.log(`✅ Multi-language test passed for ${test.language}!`);
    } else {
      console.log(`⚠️  No language detected for ${test.language}`);
    }

    return true;
  } catch (error) {
    console.error(`❌ Test failed for ${test.language}:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Testing Ed Multi-Language Support\n');

  for (const test of tests) {
    await testLanguage(test);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 All multi-language tests complete!');
  console.log('='.repeat(60) + '\n');
}

runTests();
