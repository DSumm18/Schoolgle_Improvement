const KEY = "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";

console.log('Testing OpenRouter with DeepSeek...\n');

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://schoolgle.co.uk',
    'X-Title': 'Schoolgle Ed'
  },
  body: JSON.stringify({
    model: 'deepseek/deepseek-chat',
    messages: [{ role: 'user', content: 'Say Hello from Ed!' }],
    max_tokens: 30
  })
});

const data = await response.json();

if (data.error) {
  console.log('❌ Error:', data.error.message);
} else {
  console.log('✅ Success!');
  console.log('Response:', data.choices[0].message.content);
  console.log('Model:', data.model);
  console.log('Tokens:', data.usage.total_tokens);
}
