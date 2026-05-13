const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  throw new Error("Set OPENROUTER_API_KEY before running this local integration test.");
}

console.log("Full Integration Test: Ed Backend -> OpenRouter\n");
console.log("Testing with configured API key...\n");

console.log("Test 1: Direct OpenRouter Connection");
console.log("=====================================");

const directTest = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://schoolgle.co.uk",
    "X-Title": "Schoolgle Ed AI",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: "Briefly explain what Ofsted looks for in reading in UK schools.",
      },
    ],
    max_tokens: 150,
  }),
});

const directData = await directTest.json();

if (directData.error) {
  console.log("Direct API failed:", directData.error.message);
} else {
  console.log("Direct API success.");
  console.log("\nResponse:");
  console.log("-".repeat(70));
  console.log(directData.choices[0].message.content);
  console.log("-".repeat(70));
  console.log(`\nModel: ${directData.model}`);
  console.log(`Tokens: ${directData.usage.total_tokens}`);
}

console.log("\n\nTest 2: Ed API Endpoint (via Next.js)");
console.log("======================================");

const edTest = await fetch("http://localhost:3000/api/ed/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    messages: [
      { role: "user", content: "Briefly explain what Ofsted looks for in reading." },
    ],
    context: {
      organizationId: "demo",
      schoolName: "Test Primary School",
      page: "quality-of-education",
    },
  }),
});

const edData = await edTest.json();

if (edData.error || !edData.metadata) {
  console.log("Ed API returned fallback response.");
  console.log("This means the API route is working but OpenRouter call failed.");
  console.log("\nFallback response:");
  console.log(`${edData.response?.substring(0, 150) || ""}...`);
} else {
  console.log("Ed API success.");
  console.log("\nEd Response:");
  console.log("-".repeat(70));
  console.log(edData.response);
  console.log("-".repeat(70));
  console.log(`\nModel: ${edData.metadata.model}`);
  console.log(`Tokens: ${edData.metadata.tokens}`);
  console.log(`Cost: $${edData.metadata.cost.toFixed(5)}`);
}

console.log("\n\nIntegration test complete.");
