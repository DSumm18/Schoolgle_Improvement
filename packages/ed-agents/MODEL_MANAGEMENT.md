# Model Management with OpenRouter

The `@schoolgle/ed-agents` package uses [OpenRouter](https://openrouter.ai/) as its unified model provider. This gives us:

- **Single API key** for all models
- **Easy model switching** via configuration
- **Access to latest models** as they're released
- **Cost optimization** with per-task model selection

## Configuration

Set your OpenRouter API key as an environment variable:

```bash
OPENROUTER_API_KEY=sk-or-...
```

## Available Models

### Primary Models

| Model ID | Use Case | Cost/1M tokens | Capabilities |
|----------|----------|----------------|--------------|
| `anthropic/claude-3.5-sonnet` | Premium specialist responses | ~$3.00 (in) / $15 (out) | Vision, streaming |
| `openai/gpt-4o` | High quality responses | ~$2.50 / $10.00 | Vision, streaming, JSON mode |
| `deepseek/deepseek-chat` | Balanced quality/cost | ~$0.27 / $1.10 | Streaming, JSON mode |
| `openai/gpt-4o-mini` | Fast routing/classification | ~$0.15 / $0.60 | Vision, streaming, JSON mode |
| `google/gemini-2.0-flash-exp` | Ultra-fast, cheap | ~$0.075 | Vision, streaming |

### Model Aliases

Use aliases for easier reference:

```typescript
import { MODEL_ALIASES } from '@schoolgle/ed-agents/models';

MODEL_ALIASES.premium      // 'anthropic/claude-3.5-sonnet'
MODEL_ALIASES.fast        // 'openai/gpt-4o-mini'
MODEL_ALIASES.cheap        // 'deepseek/deepseek-chat'
MODEL_ALIASES.gemini       // 'google/gemini-2.0-flash-exp'
```

## Task-Based Model Selection

The framework automatically selects the best model for each task:

| Task | Default Model | Fallbacks |
|------|---------------|-----------|
| Intent classification | `gpt-4o-mini` | gemini-2.0-flash, deepseek-chat |
| Specialist response | `claude-3.5-sonnet` | deepseek-chat, gpt-4o |
| Perspective generation | `deepseek-chat` | gpt-4o-mini, gemini-2.0-flash |
| UI analysis | `claude-3.5-sonnet` | gpt-4o, gemini-2.5-pro |
| Action planning | `gpt-4o-mini` | gemini-2.0-flash |

## Usage Examples

### Direct Chat with OpenRouter

```typescript
import { getModelRouter } from '@schoolgle/ed-agents/models';

const router = getModelRouter();

const response = await router.chat(
  'You are a helpful assistant.',
  'What is the RIDDOR reporting deadline?',
  {
    model: 'anthropic/claude-3.5-sonnet',
    temperature: 0.7,
    maxTokens: 2048,
  }
);

console.log(response.content);
console.log(response.usage); // { promptTokens, completionTokens, totalTokens }
```

### Model Selection by Context

```typescript
import { getModelRouter } from '@schoolgle/ed-agents/models';

const router = getModelRouter();

// Get model based on user's subscription and task
const model = router.selectModel('specialist-response', {
  userId: 'user-123',
  orgId: 'org-456',
  userRole: 'staff',
  subscription: {
    plan: 'schools',       // 'free' | 'schools' | 'trusts'
    features: [],
    creditsRemaining: 5000,
    creditsUsed: 0,
  },
});

console.log(model.id); // 'anthropic/claude-3.5-sonnet' (or cheaper if low credits)
```

### Cost Calculation

```typescript
import { calculateTokenCost } from '@schoolgle/ed-agents/models';

const cost = calculateTokenCost(
  'anthropic/claude-3.5-sonnet',
  500,  // input tokens
  1000  // output tokens
);

console.log(`Estimated cost: $${cost.toFixed(4)}`);
```

## Changing Models

### To Change the Default Model for a Task

Edit `packages/ed-agents/src/models/router.ts`:

```typescript
const TASK_MODEL_MAP: Record<TaskType, string[]> = {
  'specialist-response': [
    'your-new-model-here',    // Just change this!
    'deepseek/deepseek-chat',  // Fallback
    'openai/gpt-4o',          // Another fallback
  ],
  // ...
};
```

### To Add a New Model

Edit `packages/ed-agents/src/models/openrouter.ts`:

```typescript
export const OPENROUTER_MODELS: Record<string, ModelConfig> = {
  // ... existing models ...

  'provider/new-model': {
    id: 'provider/new-model',
    provider: 'openrouter',
    model: 'provider/new-model',
    costPerMillionTokens: 1.23,
    capabilities: {
      vision: true,
      streaming: true,
      jsonMode: false,
    },
  },
};
```

## Plan-Based Model Constraints

Different subscription plans have access to different models:

| Plan | Available Models |
|------|------------------|
| `free` | gpt-4o-mini, gemini-2.0-flash, deepseek-chat |
| `schools` | claude-3.5-sonnet, deepseek-chat, gpt-4o, gemini-2.0-flash |
| `trusts` | claude-3.5-sonnet, deepseek-r1 (reasoning), gpt-4o |

Edit `PLAN_MODEL_CONSTRAINTS` in `router.ts` to adjust.

## Monitoring

The framework tracks token usage and costs:

```typescript
import { createOrchestrator } from '@schoolgle/ed-agents';

const orchestrator = await createOrchestrator({
  // ... config
});

const response = await orchestrator.processQuestion('What temperature should legionella water be?');

// Check credit summary
const summary = orchestrator.getCreditSummary();
console.log(summary);
// { plan: 'schools', creditsRemaining: 5000, sessionUsage: 0.002, estimatedRemaining: 4998 }
```

## Testing Different Models

You can test models without changing the framework:

```typescript
import { createOpenRouterClient } from '@schoolgle/ed-agents/models';

const client = createOpenRouterClient();

// Test two models side-by-side
const [response1, response2] = await Promise.all([
  client.chatWithSystem('You are Ed...', 'What is RIDDOR?', { model: 'anthropic/claude-3.5-sonnet' }),
  client.chatWithSystem('You are Ed...', 'What is RIDDOR?', { model: 'deepseek/deepseek-chat' }),
]);

// Compare quality and cost
console.log('Claude:', response1.content, response1.usage);
console.log('DeepSeek:', response2.content, response2.usage);
```

## Free Models

OpenRouter offers some free models (with limitations):

```typescript
const response = await router.chat(
  systemPrompt,
  userMessage,
  { model: 'google/gemini-2.0-flash-thinking-exp:free' }
);
```

**Warning:** Free models may have rate limits, queue times, or lower quality.

## Model Selection Best Practices

1. **Start with defaults** - The framework uses sensible defaults
2. **Monitor costs** - Check `getCreditsRemaining()` regularly
3. **Test new models** - Before switching defaults
4. **Use fallbacks** - Always have cheaper fallbacks configured
5. **Consider latency** - Some models are faster than others
