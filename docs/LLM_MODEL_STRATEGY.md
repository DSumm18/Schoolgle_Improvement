# Schoolgle LLM Model Strategy

**Version:** 1.0
**Date:** 2026-01-23
**Purpose:** Central directory for all LLM model usage across Schoolgle applications

## Executive Summary

This document defines which AI models are used for which tasks across all Schoolgle applications. The strategy balances **cost optimization** with **quality requirements**, ensuring we use the right model for each job while maintaining high quality standards.

---

## Model Selection Principles

1. **Cost-Performance Balance**: Use cheaper models for simple tasks, premium models for complex ones
2. **Quality Gates**: Certain user-facing outputs require minimum quality thresholds
3. **Latency Requirements**: Real-time interactions need fast responses
4. **Specialization**: Some models excel at specific tasks (vision, OCR, reasoning)
5. **Fallback Strategy**: Always have a backup model if primary fails

---

## Model Portfolio

### Primary Models (via OpenRouter)

| Model | Cost (per 1M tokens) | Best For | Max Tokens | Notes |
|-------|---------------------|----------|------------|-------|
| **DeepSeek V3** | $0.24 (input)<br>$0.96 (output) | Document analysis, text processing | 8,000 | Primary workhorse - 95% of tasks |
| **Claude 3.5 Sonnet** | ~$3.00 (input)<br>~$15.00 (output) | Complex reasoning, synthesis, final reports | 8,000 | Premium quality for critical outputs |
| **Gemini 2.0 Flash Lite** | ~$0.075 (input)<br>~$0.30 (output) | Fast responses, fallback, retries | 8,000 | Fast, reliable fallback |
| **Gemini 3 Flash** | - | Screen analysis, vision, action planning | - | Via Google API directly |
| **Mistral OCR** | ~$0.20-0.40 per 100 docs | Scanned PDFs, images | 4,000 | OCR specialist |
| **Qwen 2.5 VL 72B** | ~$0.40 (input) | Charts, diagrams, visual reports | 6,000 | Vision for complex visuals |
| **GPT-4o-mini** | ~$0.15 (input)<br>~$0.60 (output) | Voice observation processing | - | Via OpenRouter |
| **Gemini Pro Vision** | - | Alternative vision | - | Via OpenRouter |

---

## Task → Model Mapping

### Evidence & Document Processing

| Task | Primary Model | Fallback | Cost Estimate | Quality Requirement |
|------|---------------|----------|---------------|---------------------|
| DOCX analysis | DeepSeek V3 | Gemini 2.0 Flash Lite | $0.0008/doc | HIGH |
| XLSX analysis | DeepSeek V3 | Gemini 2.0 Flash Lite | $0.0008/doc | HIGH |
| Text PDF | DeepSeek V3 | Gemini 2.0 Flash Lite | $0.0008/doc | HIGH |
| Scanned PDF | Mistral OCR | Qwen 2.5 VL | $0.002/doc | MEDIUM |
| Charts/Diagrams | Qwen 2.5 VL | Gemini Pro Vision | $0.001/doc | MEDIUM |
| JSON parsing retry | Gemini 2.0 Flash Lite | Claude 3.5 Sonnet | $0.0003 | HIGH |

### Browser Automation (New - Ed's Browser Capabilities)

| Task | Primary Model | Fallback | Cost Estimate | Quality Requirement |
|------|---------------|----------|---------------|---------------------|
| Screen snapshot analysis | Gemini 3 Flash | Gemini Pro Vision | $0.001/page | HIGH |
| Action planning | Gemini 3 Flash | Claude 3.5 Sonnet | $0.001/plan | HIGH |
| Form understanding | DeepSeek V3 | Gemini 2.0 Flash Lite | $0.0008/form | HIGH |
| Translation (Native ↔ EN) | DeepSeek V3 | Gemini 2.0 Flash Lite | $0.0008/translation | MEDIUM |
| Language detection | Rule-based (free) | DeepSeek V3 | $0 | MEDIUM |
| Conversational chat | DeepSeek V3 | Claude 3.5 Sonnet | $0.0008/msg | HIGH |
| Approval prompt generation | DeepSeek V3 | - | $0.0008 | LOW |

### Vision & Image Analysis

| Task | Primary Model | Fallback | Cost Estimate | Quality Requirement |
|------|---------------|----------|---------------|---------------------|
| Facilities photo triage | Claude 3.5 Sonnet | Gemini 2.5 Pro | $0.015/image | CRITICAL |
| Photo severity scoring | Claude 3.5 Sonnet | Qwen 2.5 VL | $0.015/image | HIGH |
| Issue categorization | DeepSeek V3 | Gemini 3 Flash | $0.0008/image | MEDIUM |
| Handwritten text | Mistral OCR | Gemini Pro Vision | $0.002/image | MEDIUM |

### Voice & Speech

| Task | Primary Model | Fallback | Cost Estimate | Quality Requirement |
|------|---------------|----------|---------------|---------------------|
| Speech-to-text | Google STT (Fish Audio) | - | $0.006/min | HIGH |
| Text-to-speech | Fish Audio (Edwina) | - | $0.006/min | HIGH |
| Observation transcript analysis | GPT-4o-mini | DeepSeek V3 | $0.001/transcript | HIGH |

### Report Generation

| Task | Primary Model | Fallback | Cost Estimate | Quality Requirement |
|------|---------------|----------|---------------|---------------------|
| SEF generation | Claude 3.5 Sonnet | DeepSeek V3 | $0.015/report | CRITICAL |
| SDP generation | Claude 3.5 Sonnet | DeepSeek V3 | $0.015/plan | HIGH |
| Action planning | DeepSeek V3 | Gemini 2.0 Flash Lite | $0.0008/plan | MEDIUM |
| Final synthesis | Claude 3.5 Sonnet | DeepSeek V3 | $0.015/synthesis | HIGH |

---

## Cost Optimization Strategies

### 1. Tiered Processing Pipeline

```
Document Upload → DeepSeek V3 (Fast, Cheap)
                    ↓
              Success? → Done
                    ↓
               Failure
                    ↓
          Gemini 2.0 Flash Lite (Fallback, Cheap)
                    ↓
              Success? → Done
                    ↓
               Failure
                    ↓
           Claude 3.5 Sonnet (Premium, Reliable)
```

### 2. Caching Strategy

- **Translation Cache**: 30-day TTL, prevents re-translation of same text
- **Document Embeddings**: Semantic search reduces need for full re-analysis
- **Form Templates**: Reuse form schemas for common forms (Pupil Premium, RIDDOR)

### 3. Smart Model Selection

```typescript
// Example: Select model based on task complexity
function selectModelForTask(task: TaskType): Model {
  const complexity = assessTaskComplexity(task);

  if (complexity === 'simple') {
    return MODELS.cheap; // Gemini 2.0 Flash Lite
  } else if (complexity === 'medium') {
    return MODELS.standard; // DeepSeek V3
  } else if (complexity === 'complex') {
    return MODELS.smart; // Claude 3.5 Sonnet
  }
}
```

---

## Quality Gates

### Critical Tasks (Require Premium Models)

- **SEF Generation**: School self-evaluation form - requires highest quality
- **Facilities Photo Triage**: Safety-critical, needs accurate analysis
- **Final Report Synthesis**: Customer-facing documents

### High Quality Tasks (Can Use Standard Models)

- **Document Analysis**: DeepSeek V3 sufficient for 95% of cases
- **Form Understanding**: Structured data extraction
- **Conversational Chat**: Real-time responses

### Medium Quality Tasks (Can Use Cheaper Models)

- **Translation**: Cached translations, glossary lookups
- **Language Detection**: Rule-based first, LLM fallback
- **Simple Q&A**: Pre-computed responses

---

## Cost Monitoring

### Budget Allocations (Monthly)

| Application | Budget | Primary Cost Driver |
|-------------|--------|---------------------|
| Evidence Processing | $500 | Document analysis |
| Browser Automation | $200 | Screen snapshots, actions |
| Voice Features | $150 | Fish Audio TTS/STT |
| Report Generation | $150 | SEF, SDP generation |
| Vision Triage | $100 | Photo analysis |
| **Total** | **~$1,100/month** | |

### Per-User Cost Estimates

| Feature | Cost per 1,000 uses |
|---------|-------------------|
| Form fill | ~$0.05 |
| Translation | ~$0.01 (cached) |
| Photo triage | ~$0.15 |
| Voice chat | ~$0.01 (STT) + $0.01 (TTS) |

---

## Model Configuration Files

### Existing Configuration Files

| File | Purpose | Models Used |
|------|---------|-------------|
| `apps/platform/src/lib/ai-evidence-matcher.ts` | Document evidence matching | DeepSeek V3, Mistral OCR, Qwen VL, Gemini Flash Lite, Claude 3.5 |
| `apps/platform/src/lib/automation/model-config.ts` | Automation models | Gemini 3 Flash |
| `packages/mcp-server/src/llm/openrouter.ts` | MCP server LLM calls | Gemini Flash, Claude 3.5, via OpenRouter |
| `packages/ed-backend/lib/model-router.ts` | Ed chatbot model routing | OpenRouter models |

---

## Recommended Updates

### 1. Browser Automation Model Config

```typescript
// apps/platform/src/lib/automation/model-config.ts - ENHANCED
export const AUTOMATION_MODELS = {
  // Vision for screen analysis
  VISION: 'gemini-3-flash', // Via Google API

  // Fast action planning
  PLANNING: 'gemini-3-flash',

  // Form understanding (can use cheaper model)
  FORM_UNDERSTANDING: 'deepseek/deepseek-chat',

  // Conversational chat
  CHAT: 'deepseek/deepseek-chat',

  // Translation (bidirectional)
  TRANSLATION: 'deepseek/deepseek-chat',

  // Approval prompt generation
  APPROVAL: 'deepseek/deepseek-chat',
} as const;

// Cost tracking
export const MODEL_COSTS = {
  'deepseek/deepseek-chat': { input: 0.00024, output: 0.00096 }, // per token
  'gemini-3-flash': { input: 0.0001, output: 0.0001 }, // estimated
  'claude-3.5-sonnet': { input: 0.003, output: 0.015 }, // per token
} as const;
```

### 2. Central Model Router

```typescript
// packages/shared/src/model-router.ts - NEW
export class ModelRouter {
  /**
   * Get the optimal model for a given task
   */
  static getModel(task: TaskType, options?: ModelOptions): string {
    // Check cache first
    // Check budget
    // Check quality requirements
    // Return best model
  }

  /**
   * Track usage and costs
   */
  static trackUsage(model: string, task: TaskType, usage: TokenUsage): void {
    // Log to usage tracking table
  }

  /**
   * Get cost estimate for a task
   */
  static estimateCost(task: TaskType, inputSize: number): number {
    // Return estimated cost in USD
  }
}
```

---

## OpenRouter Environment Variables

```bash
# Required
OPENROUTER_API_KEY=your_key_here

# Model Selection (can override defaults)
OPENROUTER_CHEAP_MODEL=google/gemini-flash-1.5
OPENROUTER_SMART_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_VISION_MODEL=google/gemini-pro-vision

# For Ed's Browser Capabilities
OPENROUTER_BROWSER_MODEL=deepseek/deepseek-chat
OPENROUTER_TRANSLATION_MODEL=deepseek/deepseek-chat
```

---

## RIDDOR Terminology

**RIDDOR** = **Reporting of Injuries, Diseases and Dangerous Occurrences Regulations** (UK)

This is the correct terminology. The system previously used "RIDA" which has been corrected to "RIDDOR" throughout:

- Form glossaries: `riddor` (not `rida`)
- Documentation references
- User-facing descriptions

---

## Next Steps

1. **Update form glossaries** from `rida` to `riddor`
2. **Implement Perplexity Comet-inspired browser control indicator**
3. **Integrate Edwina voice** into mobile chatbot
4. **Add proactive language detection** with asking UX
5. **Create centralized model router** in shared package

---

**Document Status:** Draft - Ready for Review
**Last Updated:** 2026-01-23
