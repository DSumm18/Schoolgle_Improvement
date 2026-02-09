# Ed Browser Capabilities - Implementation Plan

**Version:** 1.0
**Date:** 2026-01-23
**Status:** Planning Phase

## Executive Summary

This document outlines the technical implementation plan to extend Ed (Schoolgle's AI assistant) with browser automation capabilities using Vercel's **agent-browser** and **AI SDK 6**. The system will enable Ed to help parents and staff complete forms across multiple approved domains with built-in guardrails, multilingual support, and mobile-friendly interfaces.

## Table of Contents

1. [Vision & Use Cases](#vision--use-cases)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Component Breakdown](#component-breakdown)
5. [Database Schema](#database-schema)
6. [Security & Guardrails](#security--guardrails)
7. [Multilingual Translation Layer](#multilingual-translation-layer)
8. [Vision/Photo Triage System](#visionphoto-triage-system)
9. [Mobile UI Design](#mobile-ui-design)
10. [Implementation Phases](#implementation-phases)
11. [Integration Points](#integration-points)

---

## Vision & Use Cases

### Parent-Facing Forms

**Use Case:** Non-English speaking parents need to complete government forms (Pupil Premium, Free School Meals) with minimal friction.

**User Journey:**
1. Parent opens Ed chatbot on mobile device
2. Selects their preferred language (e.g., Polish, Urdu, Bengali)
3. Ed converses in their native language, collecting form data
4. Ed translates input to English and pre-fills the government form
5. Parent sees a side-by-side preview (native language chat + English form preview)
6. Parent confirms and submits
7. Ed provides confirmation in parent's language

**Approved Domains:**
- `gov.uk` (Universal Credit, Pupil Premium)
- Local authority domains (e.g., `birmingham.gov.uk`)
- `schoolgle.co.uk` (internal forms)

### Staff-Facing Tasks

**Use Case:** School staff need to complete RIDDOR (Reporting of Injuries, Diseases and Dangerous Occurrences Regulations) forms and help desk tickets efficiently.

**User Journey:**
1. Staff member opens Ed from dashboard or mobile
2. Requests "Help me file a RIDDOR report"
3. Ed asks structured questions to gather incident details
4. Ed navigates to the RIDDOR portal and pre-fills the form
5. Staff reviews and submits
6. Ed confirms and logs the action

**Approved Domains:**
- `hse.gov.uk` (Health & Safety Executive)
- Internal school domains
- LA support portals

### Facilities Issue Reporting

**Use Case:** Staff identify maintenance issues and need to report them with photo evidence.

**User Journey:**
1. Staff member chats with Ed: "The boiler in Room 3B is leaking"
2. Ed asks for photo/video evidence
3. Staff uploads photos via mobile
4. Ed analyzes images to:
   - Assess severity (critical/high/medium/low)
   - Categorize issue type (plumbing/electrical/structural)
   - Extract relevant details
5. Ed pre-fills a help desk ticket with rich context
6. Staff confirms submission
7. Ticket is triaged automatically based on severity

---

## Technology Stack

### Core Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **agent-browser** | Browser automation CLI | Latest (Vercel Labs) |
| **AI SDK 6** | Human-in-the-loop tool approval | `ai` package |
| **Next.js 16** | API routes and React components | 16.0.3 |
| **Supabase** | Database (allowlist, sessions, audit logs) | Postgres + RLS |
| **OpenAI GPT-4o** | Form understanding and translation | Via OpenRouter |
| **Claude 3.5 Sonnet** | Vision analysis for photo triage | Via OpenRouter |
| **MCP Server** | Existing tool integration | `@schoolgle/mcp-server` |
| **form-skill** | Existing PII masking and form filling | `@schoolgle/form-skill` |

### Infrastructure

- **Vercel Deployment** (Serverless functions for API routes)
- **Browserbase** (optional) - Remote browser infrastructure for serverless
- **CDN** - Static asset delivery for mobile UI components

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Mobile     │  │   Desktop    │  │   Tablet     │  │  Chromebook  │    │
│  │   Chat UI    │  │   Dashboard  │  │   Chat UI    │  │   Chat UI    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ WebSocket / HTTP
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                           NEXT.JS API LAYER                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │  /api/chat/ed    │  │ /api/browser/*   │  │  /api/vision/*   │         │
│  │                  │  │                  │  │                  │         │
│  │ - useChat hook   │  │ - Session mgmt   │  │ - Image upload   │         │
│  │ - HITL approval  │  │ - agent-browser  │  │ - Claude vision  │         │
│  │ - Tool routing   │  │ - Domain checks  │  │ - Severity score │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                          SERVICE LAYER                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │ Translation      │  │ Form Processor   │  │ Vision Analyzer  │         │
│  │ Service          │  │ (form-skill)     │  │                  │         │
│  │                  │  │                  │  │                  │         │
│  │ - Native ↔ EN    │  │ - PII masking    │  │ - Image          │         │
│  │ - Context aware  │  │ - DOM mapping    │  │   classification │         │
│  │ - Glossary mgmt  │  │ - Validation     │  │ - Severity       │         │
│  │                  │  │                  │  │   scoring        │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────┐      │
│  │                    MCP Server Integration                         │      │
│  │  (18+ existing tools + new browser tools)                         │      │
│  └──────────────────────────────────────────────────────────────────┘      │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                          DATA LAYER                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Supabase   │  │  Redis Cache │  │  S3/R2 Store │  │   Audit Log  │    │
│  │              │  │              │  │              │  │              │    │
│  │ - Domains    │  │ - Sessions   │  │ - Images     │  │ - Compliance │    │
│  │ - Sessions   │  │ - Transient  │  │ - Videos     │  │ - Actions    │    │
│  │ - Users      │  │   state      │  │              │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                    EXTERNAL BROWSER SERVICES                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │  agent-browser   │  │   Browserbase    │  │   CDP Remote     │         │
│  │  (CLI / npm)     │  │  (Cloud fallback)│  │   Browsers       │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Browser Service (`apps/platform/src/lib/browser-service.ts`)

**Purpose:** Wrapper around agent-browser CLI with session management and domain verification.

**Key Methods:**

```typescript
class BrowserService {
  // Create isolated session for user/org
  createSession(userId: string, orgId: string): Promise<SessionId>

  // Navigate to approved domain only
  navigate(sessionId: string, url: string): Promise<Snapshot>

  // Get snapshot with refs for AI processing
  getSnapshot(sessionId: string, options?: SnapshotOptions): Promise<Snapshot>

  // Interact with form elements
  fill(sessionId: string, ref: string, value: string): Promise<void>
  click(sessionId: string, ref: string): Promise<void>

  // Submit form and get result
  submit(sessionId: string, formRef: string): Promise<FormResult>

  // Capture screenshot for audit trail
  screenshot(sessionId: string): Promise<Buffer>

  // Clean up session
  close(sessionId: string): Promise<void>
}
```

**Features:**
- Domain allowlist enforcement before navigation
- Session isolation per user/org
- Automatic screenshot capture for audit
- Persistent profiles for authenticated sessions (with approval)
- Integration with existing form-skill PII masking

### 2. Translation Service (`apps/platform/src/lib/translation-service.ts`)

**Purpose:** Handle bidirectional translation between native language and English for form filling.

**Key Methods:**

```typescript
class TranslationService {
  // Detect language from user message
  detectLanguage(text: string): Promise<LanguageCode>

  // Translate to English for form submission
  translateToEnglish(text: string, sourceLang: LanguageCode): Promise<string>

  // Translate form response back to native language
  translateFromEnglish(text: string, targetLang: LanguageCode): Promise<string>

  // Get translated form field labels for preview
  translateFieldLabels(fields: FormField[], targetLang: LanguageCode): Promise<TranslatedField[]>

  // Validate translation quality score
  validateTranslation(original: string, translated: string): Promise<number>
}
```

**Supported Languages (Phase 1):**
- English (base)
- Polish
- Urdu
- Bengali
- Punjabi
- Gujarati
- Somali
- Romanian
- Portuguese

### 3. Form Processor (`apps/platform/src/lib/form-processor.ts`)

**Purpose:** Orchestrates form understanding, data collection, and submission using existing form-skill.

**Key Methods:**

```typescript
class FormProcessor {
  // Analyze form structure from snapshot
  analyzeForm(snapshot: Snapshot): Promise<FormSchema>

  // Collect form data through conversational UI
  collectFormData(schema: FormSchema, userLanguage: LanguageCode): Promise<FormData>

  // Validate collected data against form requirements
  validateFormData(schema: FormSchema, data: FormData): Promise<ValidationResult>

  // Fill form using agent-browser with PII masking
  fillForm(sessionId: string, schema: FormSchema, data: FormData): Promise<void>

  // Submit and capture confirmation
  submitForm(sessionId: string): Promise<FormSubmissionResult>
}
```

### 4. Vision Triage Service (`apps/platform/src/lib/vision-triage.ts`)

**Purpose:** Analyze uploaded photos/videos to assess issue severity and categorize for facilities tickets.

**Key Methods:**

```typescript
class VisionTriageService {
  // Analyze image for facilities issues
  analyzeImage(imageBuffer: Buffer, context: string): Promise<TriageAssessment>

  // Generate severity score (0-100)
  calculateSeverity(assessment: TriageAssessment): number

  // Categorize issue type
  categorizeIssue(assessment: TriageAssessment): FacilityCategory

  // Extract relevant details (location, equipment type, etc.)
  extractDetails(imageBuffer: Buffer): Promise<IssueDetails>

  // Generate ticket description
  generateTicketDescription(assessment: TriageAssessment, context: string): Promise<string>
}
```

**Triage Categories:**
- **Critical:** Safety hazards, major leaks, electrical issues
- **High:** Equipment failure, significant damage
- **Medium:** Minor leaks, wear and tear
- **Low:** Cosmetic issues, minor maintenance

### 5. Guardrails Middleware (`apps/platform/src/lib/guardrails.ts`)

**Purpose:** Enforce safety rules and approval requirements.

**Key Methods:**

```typescript
class GuardrailsMiddleware {
  // Check if domain is approved
  isDomainApproved(url: string, orgId: string): Promise<boolean>

  // Check if action requires approval
  requiresApproval(action: BrowserAction): Promise<boolean>

  // Validate form data against safety rules
  validateFormData(data: FormData): Promise<SafetyValidationResult>

  // Check for sensitive fields (password, payment)
  checkSensitiveFields(formSchema: FormSchema): SensitiveFieldWarning[]

  // Generate approval prompt for user
  generateApprovalPrompt(action: BrowserAction): Promise<ApprovalPrompt>
}
```

---

## Database Schema

### New Tables

```sql
-- Approved domains for browser automation
CREATE TABLE browser_approved_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'government', 'internal', 'vendor'
  requires_auth BOOLEAN DEFAULT false,
  auth_method TEXT, -- 'sso', 'headers', 'credentials'
  auth_config JSONB,
  allowed_paths TEXT[], -- Restrict to specific paths
  denied_paths TEXT[], -- Explicitly blocked paths
  max_session_duration INT DEFAULT 1800, -- 30 minutes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(organization_id, domain)
);

-- Browser sessions for audit and monitoring
CREATE TABLE browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  domain_id UUID REFERENCES browser_approved_domains(id),
  start_url TEXT NOT NULL,
  current_url TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'failed', 'expired'
  browser_metadata JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Browser actions for detailed audit trail
CREATE TABLE browser_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES browser_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'navigate', 'fill', 'click', 'submit', 'screenshot'
  target_ref TEXT,
  target_element JSONB,
  input_value TEXT,
  output_value TEXT,
  screenshot_path TEXT,
  approval_status TEXT, -- 'auto', 'pending', 'approved', 'denied'
  approval_requested_by UUID REFERENCES users(id),
  approval_requested_at TIMESTAMPTZ,
  approval_responded_by UUID REFERENCES users(id),
  approval_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Multilingual translations cache
CREATE TABLE translation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  quality_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  hash TEXT UNIQUE NOT NULL -- MD5 of source + source_lang + target_lang
);

-- Vision triage results
CREATE TABLE vision_triage_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  image_storage_path TEXT NOT NULL,
  issue_category TEXT NOT NULL, -- 'plumbing', 'electrical', 'structural', 'hvac'
  severity_score INT NOT NULL, -- 0-100
  severity_level TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  detected_objects JSONB,
  confidence_score DECIMAL(3,2),
  location_context TEXT,
  ticket_id UUID REFERENCES actions(id), -- Links to help desk ticket
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User language preferences
CREATE TABLE user_language_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  secondary_language TEXT,
  auto_translate BOOLEAN DEFAULT true,
  show_side_by_side BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form templates for common forms
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  form_url TEXT NOT NULL,
  domain_id UUID REFERENCES browser_approved_domains(id),
  form_schema JSONB NOT NULL,
  field_mappings JSONB,
  requires_approval BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_browser_sessions_user ON browser_sessions(user_id);
CREATE INDEX idx_browser_sessions_org ON browser_sessions(organization_id);
CREATE INDEX idx_browser_sessions_status ON browser_sessions(status);
CREATE INDEX idx_browser_actions_session ON browser_actions(session_id);
CREATE INDEX idx_browser_actions_approval ON browser_actions(approval_status);
CREATE INDEX idx_translation_cache_hash ON translation_cache(hash);
CREATE INDEX idx_triage_results_org ON vision_triage_results(organization_id);
CREATE INDEX idx_triage_results_severity ON vision_triage_results(severity_level);
CREATE INDEX idx_approved_domains_org ON browser_approved_domains(organization_id);

-- Row Level Security policies
ALTER TABLE browser_approved_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org can view their domains" ON browser_approved_domains
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()));

-- Similar RLS policies for other tables...
```

---

## Security & Guardrails

### Domain Allowlist System

**Approval Flow:**

1. **Admin adds domain** via dashboard
   - Domain: `hse.gov.uk`
   - Paths allowed: `/riddor/*`
   - Requires auth: Yes (headers)
   - Max session: 15 minutes

2. **System validates** before any navigation
   ```typescript
   const isApproved = await guardrails.isDomainApproved(url, orgId);
   if (!isApproved) {
     throw new DomainNotAllowedError(url);
   }
   ```

3. **Real-time monitoring** during session
   - URL changes are validated
   - Unexpected redirects trigger session termination
   - Screenshot capture on every page change

### Sensitive Field Detection

**Auto-Protected Fields:**
- Password inputs (`type="password"`)
- Credit card numbers (pattern: `^\d{13,19}$`)
- Bank account numbers (UK sort code + account)
- National Insurance numbers
- Medical data (GDPR special category)

**Handling Strategy:**

```typescript
const sensitiveFields = await guardrails.checkSensitiveFields(formSchema);

if (sensitiveFields.length > 0) {
  // Option 1: Skip auto-fill, require manual entry
  // Option 2: Require additional approval
  // Option 3: Mask in preview, fill with approval

  return {
    requiresApproval: true,
    sensitiveFields: sensitiveFields.map(f => ({
      field: f.label,
      reason: f.type, // 'password', 'payment', 'personal'
      action: 'manual_entry' // or 'approve_required'
    }))
  };
}
```

### Human-in-the-Loop Approval

**Using AI SDK 6 Pattern:**

```typescript
// Tool definition without execute function
const submitFormTool = tool({
  description: 'Submit a completed form',
  inputSchema: z.object({
    sessionId: z.string(),
    formData: z.record(z.string())
  }),
  outputSchema: z.string(),
  // No execute = requires approval
});
```

**Frontend Approval UI:**

```typescript
{part.state === 'input-available' && (
  <ApprovalCard
    title="Ready to Submit Form"
    details={{
      domain: currentDomain,
      fieldsCount: formData.length,
      sensitiveFields: sensitiveCount
    }}
    onApprove={async () => {
      await addToolOutput({
        toolCallId,
        tool: 'submitForm',
        output: APPROVAL.YES
      });
      sendMessage();
    }}
    onDeny={async () => {
      await addToolOutput({
        toolCallId,
        tool: 'submitForm',
        output: APPROVAL.NO
      });
      sendMessage();
    }}
  />
)}
```

### Audit Logging

**All Actions Logged:**
- User ID, organization ID, timestamp
- Action type (navigate, fill, click, submit)
- Target domain and URL
- Form fields filled (with PII masked)
- Approval chain (who requested, who approved)
- Screenshots (stored in R2 with secure URLs)
- Success/failure status

**GDPR Compliance:**
- Automatic data retention (90 days for actions, 1 year for sessions)
- Right to erasure support
- Data export capability
- PII masking in logs

---

## Multilingual Translation Layer

### Architecture

```
User Message (Native)
        │
        ▼
┌──────────────────┐
│  Language Detect │ → Auto-detect or use preference
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Process: Native │ → Ed understands in native language
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Form Data Extract│ → Structured data extraction
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Translate → EN  │ → For form submission
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Fill Form       │ → Agent-browser fills English form
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Get Response    │ → Capture form response
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Translate ← EN  │ → Back to native language
└──────────────────┘
        │
        ▼
┌──────────────────┐
│  Display Result  │ → Show in user's language
└──────────────────┘
```

### Side-by-Side Preview

**Mobile UI Layout:**

```
┌────────────────────────────────────────┐
│  💬 Ed Chat                            │
├────────────────────────────────────────┤
│                                        │
│  User: My name is Jan Kowalski         │
│        and I have 2 children            │
│                                        │
│  Ed: Thank you. Let me show you        │
│       what will be submitted:          │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ 📋 FORM PREVIEW                │   │
│  ├────────────────────────────────┤   │
│  │ Full Name: Jan Kowalski        │   │
│  │ Children: 2                    │   │
│  │ Postcode: [to be collected]    │   │
│  └────────────────────────────────┘   │
│                                        │
│  [✓ Confirm & Submit] [Edit Details]  │
└────────────────────────────────────────┘
```

### Context-Aware Translation

**Form-Specific Glossaries:**

```typescript
const formGlossaries = {
  'pupil_premium': {
    'income': 'dochód',
    'benefits': 'zasiłki',
    'free_school_meals': 'darmowe posiłki'
  },
  'riddor': {
    'injury': 'uraz',
    'witness': 'świadek',
    'first_aid': 'pierwsza pomoc'
  }
};
```

---

## Vision/Photo Triage System

### Image Analysis Pipeline

```typescript
// 1. Upload handler
const uploadResult = await handleImageUpload(file);

// 2. Vision analysis
const assessment = await visionTriage.analyzeImage(
  uploadResult.buffer,
  "Boiler leak in Room 3B"
);

// 3. Severity calculation
const severity = visionTriage.calculateSeverity(assessment);
// Returns: 85 (critical - water damage risk)

// 4. Categorization
const category = visionTriage.categorizeIssue(assessment);
// Returns: 'plumbing'

// 5. Detail extraction
const details = await visionTriage.extractDetails(uploadResult.buffer);
// Returns: { equipment: 'boiler', location: 'wall_mounted', ... }

// 6. Generate ticket
const ticketDescription = await visionTriage.generateTicketDescription(
  assessment,
  "Boiler leak in Room 3B"
);
// Returns: "CRITICAL: Active water leak from wall-mounted boiler..."
```

### Triage Decision Matrix

| Visual Indicators | Severity | Category | Response Time |
|-------------------|----------|----------|---------------|
| Active water leak, electrical sparks | Critical (90-100) | Plumbing/Electrical | < 2 hours |
| Standing water, damaged equipment | High (70-89) | Multiple | < 4 hours |
| Minor leaks, wear indicators | Medium (40-69) | Maintenance | < 24 hours |
| Cosmetic issues, dust | Low (0-39) | Cleaning | 3-5 days |

### Integration with Help Desk

```typescript
// Auto-create ticket in actions table
const ticket = await createAction({
  type: 'helpdesk_ticket',
  category: assessment.category,
  severity: assessment.severityLevel,
  title: `Facilities Issue: ${category}`,
  description: ticketDescription,
  evidence: {
    images: [uploadResult.storagePath],
    analysis: assessment
  },
  auto_triaged: true,
  created_via: 'ed_vision_triage'
});
```

---

## Mobile UI Design

### Chatbot Component

**Location:** `apps/platform/src/components/EdChatbotMobile.tsx`

**Key Features:**
- **Bottom sheet design** for easy thumb reach
- **Voice input** support for accessibility
- **Image capture** button in input area
- **Native language toggle** (quick switch)
- **Approval cards** with swipe gestures
- **Progress indicators** for multi-step forms

**Layout:**

```
┌────────────────────────────────────────┐
│ ← Ed Assistant                  EN ▼   │ ← Header
├────────────────────────────────────────┤
│                                        │
│  💬 Conversation History               │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 Ed: What's your full name?   │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ 👤 Jan Kowalski                 │   │
│  └─────────────────────────────────┘   │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 Ed: Great! Now, how many     │   │
│  │    children do you have?        │   │
│  └─────────────────────────────────┘   │
│                                        │
│                                        │
├────────────────────────────────────────┤
│ [📎] [🎤]  Type a message...      [➤]  │ ← Input
└────────────────────────────────────────┘
```

### Approval Card Component

```typescript
<ApprovalCard
  icon={<ShieldCheck className="text-amber-500" />}
  title="Confirm Form Submission"
  description="Ed has filled in the Pupil Premium form. Please review before submitting."
  fields={[
    { label: 'Full Name', value: 'Jan Kowalski' },
    { label: 'Children', value: '2' },
    { label: 'Postcode', value: 'B1 1AA' }
  ]}
  actions={{
    primary: { label: 'Approve', onPress: handleApprove },
    secondary: { label: 'Edit', onPress: handleEdit },
    dismiss: { label: 'Cancel', onPress: handleCancel }
  }}
/>
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goals:**
- Set up database schema
- Implement domain allowlist system
- Create browser service wrapper
- Basic HITL approval flow

**Deliverables:**
- [ ] Migration scripts for new tables
- [ ] `BrowserService` class with domain verification
- [ ] `GuardrailsMiddleware` with approval logic
- [ ] Admin UI for domain management
- [ ] Basic audit logging

### Phase 2: Translation Layer (Weeks 3-4)

**Goals:**
- Implement translation service
- Create language detection
- Build side-by-side preview
- Support 5 core languages

**Deliverables:**
- [ ] `TranslationService` with caching
- [ ] Language preference management
- [ ] Mobile chatbot UI with language toggle
- [ ] Form preview component
- [ ] Translation quality validation

### Phase 3: Form Automation (Weeks 5-6)

**Goals:**
- Integrate form-skill for PII masking
- Build form processor
- Implement conversational data collection
- Add form submission flow

**Deliverables:**
- [ ] `FormProcessor` class
- [ ] Integration with existing form-skill
- [ ] Multi-step form conversations
- [ ] Form template system
- [ ] Submission confirmation flow

### Phase 4: Vision Triage (Weeks 7-8)

**Goals:**
- Implement image analysis
- Build severity scoring
- Create ticket generation
- Add photo upload UI

**Deliverables:**
- [ ] `VisionTriageService` with Claude vision
- [ ] Image upload handler
- [ ] Severity calculation algorithm
- [ ] Auto-ticket creation
- [ ] Photo gallery in chat

### Phase 5: Testing & Hardening (Weeks 9-10)

**Goals:**
- End-to-end testing
- Security audit
- Performance optimization
- User acceptance testing

**Deliverables:**
- [ ] E2E test suite (Playwright)
- [ ] Security penetration testing
- [ ] Performance benchmarks
- [ ] User documentation
- [ ] Admin dashboard enhancements

---

## Integration Points

### With Existing MCP Server

**New MCP Tools:**

```typescript
// packages/mcp-server/src/tools/browser-tools.ts

export const browserTools = {
  navigate_to_approved_domain: {
    description: 'Navigate to an approved form domain',
    inputSchema: {
      url: 'string',
      sessionId: 'string'
    },
    execute: async ({ url, sessionId }, context) => {
      // Domain check, navigation, snapshot
    }
  },

  fill_form_field: {
    description: 'Fill a form field with translated data',
    inputSchema: {
      sessionId: 'string',
      fieldRef: 'string',
      value: 'string',
      language: 'string'
    },
    execute: async ({ sessionId, fieldRef, value, language }, context) => {
      // Translate if needed, PII mask, fill
    }
  },

  submit_form_with_approval: {
    description: 'Submit form requiring user approval',
    inputSchema: {
      sessionId: 'string',
      formData: 'object'
    },
    execute: null // No execute = requires approval
  },

  analyze_facilities_image: {
    description: 'Analyze uploaded image for issue triage',
    inputSchema: {
      imageBuffer: 'binary',
      context: 'string'
    },
    execute: async ({ imageBuffer, context }, context) => {
      // Vision analysis, severity score
    }
  }
};
```

### With Existing Form-Skill

**Enhanced PII Masking:**

```typescript
// Use existing form-sill's PII masking
import { maskPII } from '@schoolgle/form-sill';

const maskedData = await maskPII(formData, {
  strategy: 'partial', // Show last 4 chars
  fields: ['email', 'phone', 'nino']
});
```

### With Existing Auth System

**Session Management:**

```typescript
// Use existing Supabase auth
const { data: { user } } = await supabase.auth.getUser();

// Create browser session linked to auth user
const session = await browserService.createSession(
  user.id,
  user.organization_id
);
```

---

## Sources

- [Vercel AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6)
- [Human-in-the-Loop Agent with Next.js](https://ai-sdk.dev/cookbook/next/human-in-the-loop)
- [agent-browser GitHub Repository](https://github.com/vercel-labs/agent-browser)
- [AI SDK Core: Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [Next.js MCP Server Guide](https://nextjs.org/docs/app/guides/mcp)

---

**Document Status:** Draft - Ready for Review
**Next Steps:** Schedule architecture review meeting, finalize technology choices, begin Phase 1 implementation
