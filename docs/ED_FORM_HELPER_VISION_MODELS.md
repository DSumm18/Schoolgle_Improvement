# Ed Form Helper - Advanced Vision Models

## Using Meta & Other Models for Form Understanding

You're right - Meta's models and others are excellent at this now.

---

## Best Vision Models for Form Detection

| Model | Provider | Strength | Cost | Best For |
|-------|----------|----------|------|----------|
| **Llama 3.2-Vision** | Meta/Groq | Fast, accurate | ~Free | Form detection |
| **Qwen2.5-VL-72B** | Alibaba/OpenRouter | Excellent OCR | $0.40/M input | Complex forms |
| **Gemini 2.0 Flash** | Google | Very fast | $0.075/M input | Real-time |
| **GPT-4V** | OpenAI | Best understanding | $2.50/M input | Tricky forms |
| **Claude 3.5 Sonnet** | Anthropic | Great at UI | ~Free (via API) | Web interfaces |

---

## Strategy: Use Multiple Models in Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-MODE PIPELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. FAST DETECT (Llama 3.2-Vision on Groq)                      │
│     "Is there a form? How many fields?"                          │
│              ↓                                                  │
│  2. FIELD EXTRACTION (Qwen2.5-VL)                               │
│     "Extract all field labels and types"                         │
│              ↓                                                  │
│  3. FORM UNDERSTANDING (Claude 3.5 Sonnet)                      │
│     "What type of form is this? What questions to ask?"         │
│              ↓                                                  │
│  4. CONVERSATION (DeepSeek Chat)                                │
│     Chat with user to get values                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation: Model Selection

```typescript
interface VisionModel {
  name: string;
  provider: string;
  model: string;
  costPerInput: number;
  maxTokens: number;
  supportsStreaming: boolean;
}

const VISION_MODELS: Record<string, VisionModel> = {
  fast_detect: {
    name: 'Llama 3.2-Vision',
    provider: 'groq',
    model: 'llava-llama-3-8b-v1.405-8b',
    costPerInput: 0,
    maxTokens: 4096,
    supportsStreaming: true,
  },
  field_extract: {
    name: 'Qwen2.5-VL-72B',
    provider: 'openrouter',
    model: 'qwen/qwen-2.5-vl-72b-instruct',
    costPerInput: 0.0004, // per 1M tokens
    maxTokens: 8192,
    supportsStreaming: true,
  },
  form_understand: {
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    costPerInput: 0.003,
    maxTokens: 8192,
    supportsStreaming: true,
  },
};
```

---

## Step 1: Fast Form Detection (Llama on Groq)

Groq offers Llama models with ultra-fast inference. Perfect for quick detection:

```typescript
async function detectFormGroq(screenshot: string): Promise<FormDetection> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llava-llama-3-8b-v1.405-8b',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: screenshot }
          },
          {
            type: 'text',
            text: `Is there a form on this page? If yes, count the input fields.

            Respond ONLY with JSON:
            {"hasForm": true/false, "fieldCount": number}`
          }
        ]
      }],
      response_format: { type: "json_object" },
      max_tokens: 100,
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

**Cost**: Free via Groq cloud
**Speed**: ~100ms
**Accuracy**: Good for detection

---

## Step 2: Field Extraction (Qwen2.5-VL)

Once we know there's a form, extract detailed field info:

```typescript
async function extractFieldsQwen(screenshot: string): Promise<FormField[]> {
  const response = await openrouter.chat.completions.create({
    model: 'qwen/qwen-2.5-vl-72b-instruct',
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: screenshot }
        },
        {
          type: 'text',
          text: `Extract ALL form fields from this image. For each field, identify:
          - The label/question text
          - The field type (text, email, phone, dropdown, textarea, radio, checkbox)
          - Whether it's required (marked with * or "required")
          - The position (you can number them top to bottom)

          Be thorough. Return JSON:
          {
            "fields": [
              {"index": 1, "label": "Your Name", "type": "text", "required": true},
              {"index": 2, "label": "Email Address", "type": "email", "required": true}
            ]
          }`
        }
      ]
    }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**Cost**: $0.0004 per 1M tokens (~$0.01 per 100 forms)
**Speed**: ~2-3 seconds
**Accuracy**: Excellent at OCR and layout understanding

---

## Step 3: Form Understanding (Claude 3.5 Sonnet)

Now understand WHAT the form is for and HOW to ask:

```typescript
async function understandFormClaude(fields: FormField[], userLanguage: string): Promise<FormPlan> {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Analyze this form and create a conversational filling plan.

      Fields: ${JSON.stringify(fields, null, 2)}
      User Language: ${userLanguage}

      Determine:
      1. What type of form is this? (safeguarding, job application, contact, etc.)
      2. What questions should I ask the user in ${userLanguage}?
      3. What order makes sense?
      4. Are there any fields that should be grouped together?

      Return JSON:
      {
        "formType": "safeguarding",
        "introMessage": "I can help you fill this safeguarding concern form...",
        "questions": [
          {
            "fieldIndex": 0,
            "question": "What is your full name?",
            "questionInUserLanguage": "آپ کا پورا نام کیا ہے؟",
            "example": "Ahmed Ali",
            "helpText": "Please say your first and last name"
          }
        ],
        "outroMessage": "I've filled everything. Please review..."
      }`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

**Cost**: $0.003 per 1M tokens (~$0.002 per form)
**Speed**: ~1-2 seconds
**Accuracy**: Best at understanding context and intent

---

## Step 4: Smart Model Selection

```typescript
class AdaptiveFormAnalyzer {
  async analyzeForm(screenshot: string, userLanguage: string) {
    // 1. Quick check with Llama (fast & free)
    const detection = await this.detectFormGroq(screenshot);

    if (!detection.hasForm) {
      return { hasForm: false };
    }

    // 2. If it's a simple form (< 10 fields), use Claude for everything
    if (detection.fieldCount < 10) {
      return await this.analyzeSimpleForm(screenshot, userLanguage);
    }

    // 3. Complex form: Use Qwen for extraction, then Claude for understanding
    const fields = await this.extractFieldsQwen(screenshot);
    const plan = await this.understandFormClaude(fields, userLanguage);

    return { hasForm: true, fields, plan };
  }

  private async analyzeSimpleForm(screenshot: string, userLanguage: string) {
    // Claude can handle detection + extraction + understanding in one go
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', data: screenshot.split(',')[1] }
          },
          {
            type: 'text',
            text: `Extract and understand this form. Create questions in ${userLanguage}.`
          }
        ]
      }]
    });

    return this.parseClaudeResponse(response);
  }
}
```

---

## Cost Optimization

```typescript
// Cost per form analysis (average form with 5 fields):
const COST_PER_FORM = {
  groq_detection: 0,                    // Free
  qwen_extraction: 0.0001,              // ~$0.01
  claude_understanding: 0.001,          // ~$0.001
  total: 0.0011                         // ~$0.01 per form!
};

// For 1,000 forms per month: $11 total
```

---

## Meta Llama 3.2 Vision via Groq

```typescript
// Groq offers Llama models with lightning-fast inference
const GROQ_CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
  models: {
    llama32_11b: 'llama-3.2-11b-vision-preview',
    llama32_90b: 'llama-3.2-90b-vision-preview',
    llava: 'llava-llama-3-8b-v1.405-8b',
  }
};

async function analyzeWithLlama(screenshot: string) {
  const response = await fetch(`${GROQ_CONFIG.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_CONFIG.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_CONFIG.models.llava,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: screenshot } },
          { type: 'text', text: 'Describe this form and its fields' }
        ]
      }],
      temperature: 0,
      max_tokens: 512,
    })
  });

  return await response.json();
}
```

---

## Complete Pipeline

```typescript
class SmartFormDetector {
  async detectAndAnalyze(screenshot: string, userLanguage: string) {
    console.log('🔍 Detecting form with Llama (fast)...');
    const hasForm = await this.quickDetect(screenshot);

    if (!hasForm) {
      return { detected: false };
    }

    console.log('✅ Form found! Extracting fields with Qwen...');
    const fields = await this.extractFields(screenshot);

    console.log('📝 Understanding form with Claude...');
    const plan = await this.createPlan(fields, userLanguage);

    return {
      detected: true,
      fields,
      plan,
      confidence: this.calculateConfidence(fields, plan)
    };
  }

  private async quickDetect(screenshot: string): Promise<boolean> {
    // Use Llama on Groq for free, fast detection
    // ~100ms response time
  }

  private async extractFields(screenshot: string): Promise<FormField[]> {
    // Use Qwen2.5-VL for accurate extraction
    // Excellent at OCR and understanding form layout
    // ~2s response time
  }

  private async createPlan(fields: FormField[], language: string): Promise<FormPlan> {
    // Use Claude 3.5 Sonnet for understanding
    // Best at context and multilingual support
    // ~1.5s response time
  }
}
```

---

## Summary: Model Strategy

| Stage | Model | Why | Cost | Speed |
|-------|-------|-----|------|-------|
| **Detect** | Llama 3.2-Vision (Groq) | Free, fast | $0 | ~100ms |
| **Extract** | Qwen2.5-VL-72B | Best OCR | ~$0.01 | ~2s |
| **Understand** | Claude 3.5 Sonnet | Best reasoning | ~$0.001 | ~1.5s |
| **Converse** | DeepSeek Chat | Fast, cheap | ~$0.0002 | ~500ms |

**Total per form**: ~$0.01, ~4 seconds, excellent accuracy
