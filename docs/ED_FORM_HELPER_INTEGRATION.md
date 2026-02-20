# Ed Form Helper Mode - Integration Plan

## Executive Summary

Form Helper Mode is a **new capability** that plugs into the existing Ed framework. It does NOT replace anything - it extends Ed's abilities to detect, understand, and help fill forms.

```
EXISTING: User asks Ed question → Ed responds
EXTENDED:  User on form page → Ed detects form → Ed offers to guide → User fills form with Ed's help
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXISTING ED FRAMEWORK                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐            │
│  │ Floating Ed    │───▶│ Ed Chat UI     │───▶│ /api/ed/chat   │            │
│  │ Button         │    │ (React Widget) │    │ (POST handler) │            │
│  └────────────────┘    └────────────────┘    └────────┬───────┘            │
│          │                      │                       │                   │
│          │                      ▼                       ▼                   │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐            │
│  │ Ctrl+Shift+E   │    │ Voice I/O      │    │ @schoolgle/    │            │
│  │ Keyboard       │    │ (Fish TTS)     │    │ ed-agents      │            │
│  └────────────────┘    └────────────────┘    └────────┬───────┘            │
│                                                         │                   │
│                                                         ▼                   │
│                                                 ┌────────────────┐            │
│                                                 │ Orchestrator   │            │
│                                                 │ Agent Router   │            │
│                                                 └────────┬───────┘            │
└──────────────────────────────────────────────────────────┼─────────────────────┘
                                                           │
                  ┌────────────────────────────────────────┼─────────────────┐
                  │                                        │                 │
                  │    NEW: FORM HELPER MODE EXTENSIONS    │                 │
                  ▼                                        ▼                 │
          ┌───────────────────┐              ┌───────────────────┐            │
          │ Form Detector     │              │ Form Knowledge    │            │
          │ (extension)       │              │ (Supabase)        │            │
          └─────────┬─────────┘              └─────────┬─────────┘            │
                    │                                   │                      │
                    │     ┌─────────────────────────────┘                      │
                    ▼     ▼                                                     │
          ┌─────────────────────────┐    ┌───────────────────┐                 │
          │ Form Helper Handler     │───▶│ Skills Registry   │                 │
          │ (new agent handler)     │    │ (fill-riddor,     │                 │
          └─────────────────────────┘    │  fill-send, etc.) │                 │
                                        └───────────────────┘                 │
                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Form Detection (Browser Extension)

### What It Does

When user navigates to a page, Ed detects if there's a form and offers help.

### Integration Points

| File | Change |
|------|--------|
| `packages/ed-extension/src/content/form-template-matcher.ts` | **ALREADY EXISTS** - Add to main inject.ts |
| `packages/ed-extension/src/content/inject.ts` | Import and initialize form matcher |
| `packages/ed-extension/src/background/service-worker.ts` | Handle form helper messages |

### Code Changes

```typescript
// packages/ed-extension/src/content/inject.ts
// ADD: Import form template matcher
import { checkForTemplateMatch, showFormHelperPrompt } from './form-template-matcher';

// In the main initialization function, after Ed widget loads:
async function initializeEd() {
  // ... existing widget initialization ...

  // NEW: Check if we're on a known form page
  const templateMatch = await checkForTemplateMatch(window.location.href);
  if (templateMatch) {
    // Ask user if they want help
    showFormHelperPrompt(templateMatch);
  }
}
```

### User Experience

```
┌─────────────────────────────────────────────────────────────────┐
│  User navigates to: https://www.hse.gov.uk/riddor/report       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [2 seconds later...]                                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 Ed                                                   │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │  I see you're on the RIDDOR reporting form.     │    │   │
│  │  │                                                  │    │   │
│  │  │  I can help you fill this out step by step.     │    │   │
│  │  │                                                  │    │   │
│  │  │  [Guide me through it]  [No thanks, I've got this]│   │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Chat API Extensions

### What It Does

Extend `/api/ed/chat` to handle form-specific requests.

### Integration Points

| File | Change Type | Description |
|------|-------------|-------------|
| `apps/platform/src/app/api/ed/chat/route.ts` | **MODIFY** | Add form mode detection |
| `packages/ed-agents/src/orchestrator/intent-classifier.ts` | **MODIFY** | Detect form-related intents |
| `packages/ed-agents/src/agents/agents.ts` | **ADD** | New `form-specialist` agent |
| `packages/ed-agents/src/agents/prompts/form-specialist.ts` | **CREATE** | Form guidance system prompt |

### Code Changes

#### 1. Extend Chat API

```typescript
// apps/platform/src/app/api/ed/chat/route.ts
// ADD: Form mode detection to the existing request body interface

interface ChatRequest {
  question: string;
  context: {
    url: string;
    hostname: string;
    title: string;
    tool?: { id: string; name: string; category: string; };
    visibleText: string;
    headings: Array<{ level: number; text: string }>;
    selectedText?: string;
  };
  pageState?: {
    screenshot: string;
    domSnapshot: string;
  };
  // NEW: Form mode fields
  formMode?: {
    active: boolean;
    templateId?: string;
    currentField?: string;
    fieldsFilled?: string[];
  };
  // NEW: Language preference
  language?: 'en' | 'ur' | 'cy' | 'other';
}

// In the POST handler, add form mode check:
export async function POST(request: NextRequest) {
  const body: ChatRequest = await request.json();

  // EXISTING: Check if automation request
  const needsAutomation = detectAutomationRequest(body.question);

  // NEW: Check if this is a form helper request
  const isFormRequest = detectFormRequest(body.question, body.context?.url);
  if (isFormRequest) {
    return await handleFormRequest(body, supabase, orchestrator);
  }

  // ... rest of existing logic ...
}

// NEW: Form request handler
async function handleFormRequest(
  body: ChatRequest,
  supabase: any,
  orchestrator: any
): Promise<NextResponse> {
  const { question, context, formMode, language } = body;

  // Detect which form template
  const templateId = formMode?.templateId || await matchFormTemplate(context?.url || '');

  if (!templateId) {
    // Generic form guidance
    return NextResponse.json({
      id: crypto.randomUUID(),
      answer: "I can see there's a form on this page. Could you tell me what it's for?",
      confidence: 0.7,
      source: 'ai',
    });
  }

  // Get form knowledge from database
  const formKnowledge = await getFormKnowledge(supabase, templateId);

  // Process through form specialist agent
  const response = await orchestrator.processQuestion(question, {
    app: 'form-helper',
    page: context?.title,
    formTemplate: templateId,
    formKnowledge,
  });

  return NextResponse.json({
    id: crypto.randomUUID(),
    answer: response.response,
    confidence: response.confidence === 'HIGH' ? 0.9 : 0.7,
    source: 'ai',
    formMode: {
      active: true,
      templateId,
      currentField: response.metadata?.currentField,
      suggestedWording: response.metadata?.suggestedWording,
      redFlags: response.metadata?.redFlags,
    },
  });
}
```

#### 2. Add Form Specialist Agent

```typescript
// packages/ed-agents/src/agents/agents.ts
// ADD to existing agent registry

import { getFormSpecialistPrompt } from './prompts/form-specialist';

export const AGENTS: AgentDefinition[] = [
  // ... existing agents ...

  {
    id: 'form-specialist',
    name: 'Ed Form Specialist',
    domain: 'general',
    qualifications: [
      'Trained on HSE RIDDOR reporting guidance',
      'Knowledgeable about DfE safeguarding reporting requirements',
      'Familiar with LA form submission processes',
      'Expert in SEND EHCP application forms',
    ],
    capabilities: [
      'Explain form fields in plain language',
      'Guide users through complex forms step-by-step',
      'Suggest professional wording for sensitive topics',
      'Identify red flags that may harm applications',
      'Provide field-specific legal context',
      'Translate between languages for understanding',
    ],
    systemPrompt: getFormSpecialistPrompt(),
  },
];
```

#### 3. Form Specialist System Prompt

```typescript
// packages/ed-agents/src/agents/prompts/form-specialist.ts

export function getFormSpecialistPrompt(): string {
  return `You are Ed's Form Specialist - an expert at helping people fill out complex forms.

YOUR ROLE:
- Guide users through forms step by step
- Explain what each field means in plain language
- Suggest professional, effective wording
- Warn about red flags that could harm their application
- NEVER submit anything - user always reviews and approves

YOUR PERSONALITY:
- Patient and understanding
- Explains things simply, no jargon
- Never judges - "no stupid questions"
- Helpful even with small details

YOUR APPROACH:
1. Ask what the form is for (if not clear)
2. Guide through each section one at a time
3. For each field:
   - Explain what they're asking for
   - Give examples of good answers
   - Warn about common mistakes
   - Suggest wording if helpful
4. Always offer to explain differently if confused

FORM FIELD GUIDANCE:
When explaining a field, use this format:
"What they're asking: [plain English explanation]"
"Good to include: [what to put]"
"Be careful with: [red flags]"

WORDING SUGGESTIONS:
If user provides casual wording, suggest a more formal version:
- User: "The school is failing my child"
- Suggest: "I am concerned that my child is not making expected progress despite additional support"

Always explain WHY the suggested wording is better.

SAFEGUARDS:
- User must approve any wording changes
- Show before/after comparison
- Let user edit suggestions
- Never submit without explicit approval

MULTILINGUAL:
- If user speaks in another language, respond in that language
- Show translations side-by-side
- Explain form requirements in their preferred language
- Suggest English wording for the actual form submission`;
}
```

---

## Phase 3: Form Knowledge Base (Database)

### What It Does

Store field-level guidance, red flags, and suggested wording for common forms.

### Integration Points

| Table | Purpose |
|-------|---------|
| `ed_form_templates` | Form definitions (RIDDOR, SEND, etc.) |
| `ed_form_field_knowledge` | Field explanations and guidance |
| `ed_form_mistakes` | Common mistakes to avoid |
| `ed_wording_improvements` | Example wording improvements |

### Schema (Already Created)

The migration `20260219_ed_form_knowledge.sql` already created these tables.

### API Endpoint

```typescript
// apps/platform/src/app/api/ed/form-knowledge/route.ts
// NEW: Get field knowledge for a form template

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('template_id');
  const fieldKey = searchParams.get('field_key');
  const orgId = searchParams.get('org_id');

  if (!templateId) {
    return NextResponse.json({ error: 'template_id required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get field knowledge
  let query = supabase
    .from('ed_form_field_knowledge')
    .select('*')
    .eq('template_id', templateId);

  if (fieldKey) {
    query = query.eq('field_key', fieldKey);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ knowledge: data });
}
```

---

## Phase 4: RPA Skills (Automated Form Filling)

### What It Does

Pre-built "skills" that can extract data from HR systems and fill forms automatically (with human review).

### Integration Points

| File | Change |
|------|--------|
| `packages/ed-agents/src/skills/registry.ts` | **MODIFY** - Add form skills |
| `packages/ed-agents/src/skills/handlers/forms.ts` | **CREATE** - Form skill handlers |
| `apps/platform/supabase/migrations/20260219_ed_rpa_skills.sql` | **ALREADY EXISTS** - RPA tables |

### Code Changes

```typescript
// packages/ed-agents/src/skills/registry.ts
// ADD: Form skills to existing registry

export const FORM_SKILLS: SkillDefinition[] = [
  {
    id: 'fill_riddor_injury',
    name: 'RIDDOR Injury Reporting',
    description: 'Extract incident details and fill RIDDOR form with human review',
    category: 'Safety',
    defaultChannel: 'email', // For approval workflow
    isAutomated: true,
  },
  {
    id: 'fill_safeguarding',
    name: 'Safeguarding Concern Form',
    description: 'Guide through safeguarding report with suggested wording',
    category: 'Safety',
    defaultChannel: 'email',
    isAutomated: false, // Always human-guided
  },
  {
    id: 'fill_send_ehcp',
    name: 'SEND EHCP Application',
    description: 'Help parents complete EHCP request with legal guidance',
    category: 'Leadership',
    defaultChannel: 'email',
    isAutomated: false,
  },
  {
    id: 'report_bradford_sickness',
    name: 'Bradford Sickness Reporting',
    description: 'Extract sickness data from Arbor and submit to Bradford Council',
    category: 'HR',
    defaultChannel: 'email',
    isAutomated: true,
  },
];

// Merge with existing skills
export const ALL_SKILLS = [
  ...BATCH_1_SKILLS,
  ...BATCH_2_SKILLS,
  ...BATCH_3_SKILLS,
  ...FORM_SKILLS,
];
```

### Skill Handler Example

```typescript
// packages/ed-agents/src/skills/handlers/forms.ts
// NEW: Form-specific skill handlers

import type { SkillContext, SkillResult } from '../../types';

export async function handleRiddorFill(
  context: SkillContext
): Promise<SkillResult> {
  const { supabase, orgId, userId } = context;

  // 1. Get incident details from conversation/context
  const incidentDetails = extractIncidentDetails(context.userMessage);

  // 2. Get RIDDOR form template
  const { data: template } = await supabase
    .from('ed_form_templates')
    .select('*')
    .eq('form_key', 'riddor_injury')
    .single();

  // 3. Map incident to form fields
  const formData = mapToRiddorFields(incidentDetails, template);

  // 4. Store for approval (human review)
  const { data: run } = await supabase
    .from('ed_rpa_runs')
    .insert({
      skill_id: 'fill_riddor_injury',
      organization_id: orgId,
      triggered_by: userId,
      status: 'pending_approval',
      input_data: incidentDetails,
      output_data: formData,
    })
    .select()
    .single();

  return {
    success: true,
    requiresApproval: true,
    approvalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/ed/approvals/${run.id}`,
    message: `I've prepared the RIDDOR report with the following details:

**Incident Date:** ${formData.incidentDate}
**Injured Person:** ${formData.personName}
**Injury Type:** ${formData.injuryType}
**Severity:** ${formData.severity}

Please review and approve before I submit to HSE.`,
    data: formData,
  };
}

function extractIncidentDetails(message: string) {
  // Use AI to extract structured data from user's message
  // This would call the orchestrator with a prompt
  return {
    incidentDate: null,
    personName: null,
    injuryType: null,
    // etc.
  };
}

function mapToRiddorFields(incident: any, template: any) {
  // Map extracted data to form template fields
  return {
    'incident[date]': incident.incidentDate,
    'injured[name]': incident.personName,
    // etc.
  };
}
```

---

## Phase 5: Multilingual Support

### What It Does

Show user's input in their language alongside English translation, with approval before submission.

### Integration Points

| Component | Change |
|-----------|--------|
| `EdChatbot.tsx` | **MODIFY** - Add translation display |
| `/api/ed/chat` | **MODIFY** - Add translation handling |
| Translation service | **ADD** - DeepSeek or OpenRouter for translation |

### Code Changes

```typescript
// apps/platform/src/components/EdChatbot.tsx
// MODIFY: Add translation support to message interface

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  // NEW: Translation fields
  translation?: {
    originalText: string;
    originalLanguage: string;
    translatedText: string;
    suggestedWording?: string; // Formal version for forms
  };
  needsApproval?: boolean;
}

// In the message render:
{message.translation && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
    <div className="text-xs text-gray-500 mb-1">Translation:</div>
    <div className="text-sm">
      <span className="font-medium">{message.translation.originalText}</span>
      <span className="mx-2 text-gray-400">→</span>
      <span className="text-blue-700">{message.translation.translatedText}</span>
    </div>
    {message.translation.suggestedWording && (
      <div className="mt-2 text-xs">
        <span className="font-medium text-gray-600">Suggested for form: </span>
        <span className="italic text-gray-700">{message.translation.suggestedWording}</span>
      </div>
    )}
    <div className="flex gap-2 mt-2">
      <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
        Use English
      </button>
      <button className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
        Edit
      </button>
    </div>
  </div>
)}
```

### API Translation Handler

```typescript
// apps/platform/src/app/api/ed/chat/route.ts
// ADD: Translation processing

async function handleTranslation(
  text: string,
  targetLanguage: string = 'en'
): Promise<{ translated: string; suggested?: string }> {
  // Use DeepSeek for translation (cheaper than GPT-4)
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Translate to ${targetLanguage}. If the input is describing an incident or concern,
also provide a more formal version suitable for official forms.

Respond in JSON format:
{
  "translation": "direct translation",
  "suggested": "more formal version (if applicable)"
}`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  return {
    translated: result.translation,
    suggested: result.suggested,
  };
}
```

---

## Phase 6: UI/UX Enhancements

### Floating Button Natural Language

```typescript
// packages/ed-extension/src/content/ed-real-widget.ts
// MODIFY: Update button title/aria-label

const button = document.createElement('button');
button.title = "Ask Ed - I'm here to help with forms, questions, or tasks";
button.ariaLabel = "Ask Ed for help";
button.setAttribute('data-ed-help-text', "How can I help?");
```

### Form Helper Prompt UI

```typescript
// packages/ed-extension/src/content/form-template-matcher.ts
// MODIFY: Enhanced prompt UI

export function showFormHelperPrompt(template: FormTemplate) {
  const prompt = document.createElement('div');
  prompt.className = 'ed-form-prompt';
  prompt.innerHTML = `
    <div class="ed-prompt-header">
      <div class="ed-avatar">💬</div>
      <div class="ed-prompt-title">Ed noticed a form</div>
    </div>
    <div class="ed-prompt-body">
      <p>I can see you're on the <strong>${template.name}</strong>.</p>
      <p>Would you like me to guide you through it?</p>
      <div class="ed-prompt-actions">
        <button class="ed-btn-primary" data-action="guide">
          Guide me through it
        </button>
        <button class="ed-btn-secondary" data-action="autofill">
          Auto-fill from data (if available)
        </button>
        <button class="ed-btn-tertiary" data-action="dismiss">
          No thanks, I've got this
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(prompt);

  // Handle button clicks
  prompt.querySelector('[data-action="guide"]')?.addEventListener('click', () => {
    startFormGuidance(template);
    prompt.remove();
  });
}
```

---

## Implementation Order

| Phase | Priority | Dependencies | Est. Time |
|-------|----------|--------------|-----------|
| 1. Form Detection | High | None | 1 day |
| 2. Chat API Extensions | High | Phase 1 | 2 days |
| 3. Form Knowledge Base | Medium | Phase 2 | 2 days |
| 4. RPA Skills | Low | Phase 2, 3 | 3 days |
| 5. Multilingual | Medium | Phase 2 | 2 days |
| 6. UI/UX Enhancements | Medium | Phase 1 | 1 day |

**Total: ~11 days**

---

## Testing Strategy

### Unit Tests
- Form template matching
- Intent classification for form requests
- Translation handler

### Integration Tests
- End-to-end form guidance flow
- Multilingual approval flow
- RPA skill execution

### User Testing
- Safeguarding form (Bradford)
- RIDDOR form (HSE)
- SEND EHCP application (generic LA)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Form detection accuracy | >90% |
| User satisfaction with guidance | >4.5/5 |
| Forms completed with Ed help | 50+ in first month |
| Translation approval rate | >80% |
| Average time saved per form | 30% |

---

## Summary: No Replacements, Only Extensions

| Component | Status | Action |
|-----------|--------|--------|
| `/api/ed/chat` | ✅ Exists | Extend with form mode |
| `EdChatbot.tsx` | ✅ Exists | Add translation UI |
| `ed-real-widget.ts` | ✅ Exists | Add form detection trigger |
| `@schoolgle/ed-agents` | ✅ Exists | Add form specialist agent |
| Form database tables | ✅ Created | Query from API |
| RPA skills tables | ✅ Created | Add handlers |
| Translation | ❌ New | Add to chat API |

**All new functionality plugs into existing infrastructure.**
