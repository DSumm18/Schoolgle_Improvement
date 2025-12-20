# OpenRouter LLM Integration

Production-ready LLM wrapper for paid skills with strict output contracts and telemetry.

## Features

- **Environment-based model selection**: `OPENROUTER_CHEAP_MODEL`, `OPENROUTER_SMART_MODEL`, `OPENROUTER_VISION_MODEL`
- **Typed errors**: All errors include `error_code` for proper handling
- **Usage tracking**: Returns token usage when available, estimates otherwise
- **Strict output contracts**: Enforced via system prompts and JSON parsing

## Environment Variables

```bash
# Required
OPENROUTER_API_KEY=your_api_key_here

# Optional (defaults provided)
OPENROUTER_CHEAP_MODEL=google/gemini-flash-1.5
OPENROUTER_SMART_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_VISION_MODEL=google/gemini-pro-vision
OPENROUTER_HTTP_REFERER=https://schoolgle.com
```

## Usage

```typescript
import { callOpenRouter, getDefaultModels } from './llm/openrouter.js';

const models = getDefaultModels();

const response = await callOpenRouter({
  model: models.cheap,
  system: 'You are a helpful assistant.',
  user: 'Generate a design brief...',
  temperature: 0.3,
  maxTokens: 2000,
});

console.log(response.text);
console.log(response.model);
console.log(response.usage); // { prompt_tokens, completion_tokens, total_tokens }
```

## Error Handling

All errors are typed with `error_code`:

```typescript
try {
  await callOpenRouter({ ... });
} catch (error) {
  if (error instanceof OpenRouterError) {
    console.error(error.error_code); // 'MISSING_API_KEY', 'OPENROUTER_API_ERROR', etc.
    console.error(error.status_code); // HTTP status if available
  }
}
```

## Error Codes

- `MISSING_API_KEY`: `OPENROUTER_API_KEY` not set
- `OPENROUTER_API_ERROR`: API returned error (check `status_code`)
- `INVALID_RESPONSE`: Response missing expected fields
- `NETWORK_ERROR`: Network/fetch error

## Token Estimation

When OpenRouter doesn't provide usage data, `estimateTokenUsage()` provides rough estimates:
- ~4 characters per token
- Used for telemetry when actual usage unavailable


