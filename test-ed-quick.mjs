const KEY = process.env.OPENROUTER_API_KEY;

if (!KEY) {
  throw new Error("Set OPENROUTER_API_KEY before running this local test.");
}

console.log("Testing OpenRouter with configured key...\n");

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://schoolgle.co.uk",
    "X-Title": "Schoolgle Ed",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: "Say Hello from Ed!" }],
    max_tokens: 30,
  }),
});

const data = await response.json();

if (data.error) {
  console.log("Error:", data.error.message);
} else {
  console.log("Success!");
  console.log("Response:", data.choices[0].message.content);
  console.log("Model:", data.model);
  console.log("Tokens:", data.usage.total_tokens);
}
