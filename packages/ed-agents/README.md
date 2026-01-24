# @schoolgle/ed-agents

Agentic framework for Ed chatbot - specialist personas with qualified expertise.

## Overview

Ed uses a team of AI specialists, each with real qualifications and domain expertise, to help school staff complete real work. Each specialist:

- Has **real qualifications** (IOSH, NEBOSH, CIPD, NASENCO, etc.)
- **Cites sources** with dates and confidence levels
- Follows a **knowledge freshness protocol** for regulatory compliance
- Can use **reusable skills** (WRITE_SOP, WRITE_EMAIL, etc.)

## Specialists

| Specialist | Qualifications | Domain |
|------------|----------------|--------|
| **Estates** | IOSH, NEBOSH, IWFM | Health & safety, RIDDOR, fire, legionella |
| **HR** | CIPD Level 7, MCIPD | Sickness, absence, policies, contracts |
| **SEND** | NASENCO, M.Ed SEND | EHCPs, SEN support, annual reviews |
| **Data** | MSc Data Science, IGCSE | Census, attendance, GDPR |
| **Curriculum** | NPQSL, MA Curriculum | Ofsted, assessment, deep dives |
| **IT Tech** | CompTIA A+, Azure, CCNA | Hardware, software, troubleshooting |
| **Procurement** | MCIPS, CIPS Level 6 | Frameworks, tenders, value for money |
| **Governance** | NPQH, DfE trainer | Trust boards, LGBs, committees |
| **Communications** | CIPR Diploma, Journalism | Parent comms, media, crisis |

## Usage

```typescript
import { createOrchestrator } from '@schoolgle/ed-agents';

// Initialize orchestrator with user context
const orchestrator = await createOrchestrator({
  supabase,
  userId: 'user-123',
  orgId: 'org-456',
  userRole: 'staff',
  subscription: {
    plan: 'schools',
    features: ['estates', 'hr', 'send'],
    creditsRemaining: 10000,
    creditsUsed: 0,
  },
});

// Process a question
const response = await orchestrator.processQuestion(
  'What temperature should legionella water be?'
);

console.log(response.response);
// => "Cold water outlets should be below 20°C at the outlet...
//     Source: HSE L8 | Confidence: High"
```

## Architecture

```
User Question
      ↓
Intent Classifier (which specialist?)
      ↓
Knowledge Base Check (is there a cached answer?)
      ↓
Specialist Agent (qualified response)
      ↓
Multi-Perspective Generator (optimist, critic, neutral)
      ↓
Guardrails Pipeline (safety, compliance, tone)
      ↓
Response to User (with sources and confidence)
```

## Features

### Intent Classification
Routes questions to the right specialist based on keywords and context.

### Knowledge Base
Caches common questions with confidence levels for fast, accurate responses.

### Multi-Perspective Responses
For complex decisions, provides optimist, critic, and neutral perspectives.

### Guardrails
Six-layer protection before any response reaches the user:
1. Safety check
2. Compliance check
3. Confidence check
4. Tone check
5. Permission check
6. Source requirement

### Credit Management
Tracks usage and optimizes model selection based on subscription plan.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run typecheck

# Test
npm run test
```

## License

UNLICENSED
