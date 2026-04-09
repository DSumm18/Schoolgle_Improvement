# Privacy & Guardrails Documentation

> **Status**: Draft - For internal use until public launch
> **Last Updated**: 2026-02-19
> **Applies To**: All Schoolgle AI features (Ed chatbot, Form Helper, Skills)

---

## Core Privacy Principles

1. **Zero Retention by Default** - User data deleted immediately after processing
2. **No Training on User Data** - Never use conversations to improve models
3. **Explicit Consent** - Users must opt-in before data processing
4. **Data Minimization** - Collect only what's necessary for the task
5. **Transparency** - Clear, plain-language privacy notices
6. **User Control** - Easy withdrawal of consent and data deletion

---

## Feature-Specific Privacy Policies

### Ed Chatbot (Website Visitor Mode)

**What we do:**
- Answer questions about the school using scanned website content
- No personal data collected
- No conversation history stored

**What we DON'T do:**
- Don't store what visitors ask
- Don't train on visitor conversations
- Don't collect personal information

**Privacy notice:**
> "I'm Ed, the school's AI assistant. I can help answer questions about this school using information from their website. I don't collect any personal information and I don't remember what we talk about."

---

### Ed Form Helper (Prototype)

**Purpose:** Help users fill out school forms with voice input and translation support

**What we do:**
- Process form data to fill fields
- Translate between languages (user's language ↔ English)
- Delete all data immediately after form submission

**What we DON'T do:**
- Don't store form data
- Don't store what users say
- Don't train on form conversations
- Don't see submitted forms (data goes directly to school)

**Privacy notice:**
> "I can help you fill out this form. Here's how your data is handled:
>
> 🗑️ **I don't keep your data** - everything you say is deleted immediately after the form is filled
>
> 🔒 **The school receives your form** - they handle it according to their own privacy policy
>
> ❌ **I don't train on what you say** - your conversations won't improve my abilities
>
> ✅ **You can stop anytime** - just close this window
>
> By continuing, you agree that I will process your responses to fill the form, but I won't store any of your information."

**Technical implementation:**
- Use Zero Data Retention (ZDR) API endpoints where available
- Set `store: false` on all API calls
- Clear form data from memory immediately after submission
- No persistent chat history for form sessions

---

### Ed Skills (Staff Dashboard)

**Purpose:** AI assistant for school staff to manage tasks

**What we do:**
- Process staff requests within authenticated sessions
- Store task data in school's own database
- Log actions for audit trail

**What we DON'T do:**
- Don't use school data to train models
- Don't share data between organizations

---

## Model & API Configurations

### OpenRouter / Model Access

**Primary Model for Multimodal (Form Helper):**
- **Model**: Qwen2.5-VL-72B (via OpenRouter)
- **Why**: Open source alternatives, strong multimodal capabilities, multilingual
- **Cost**: Check OpenRouter pricing
- **Privacy**: Configure with appropriate data handling settings

**Fallback Models:**
- Gemini 2.0 Flash - Fast, cost-effective translation
- GPT-4o - Best overall accuracy when needed

**API Configuration:**
```javascript
// Zero-retention configuration
const apiConfig = {
  store: false,  // Don't store for training
  metadata: {
    purpose: "form-filling",
    retention: "zero",
    organization_id: orgId
  }
};
```

---

## Data Protection by Design

### Technical Safeguards

| Safeguard | Implementation |
|-----------|----------------|
| **Encryption in transit** | HTTPS/TLS 1.2+ for all API calls |
| **School Data Guardian™** | All AI prompts are intercepted by our **Zero-Trust PII Firewall** before reaching external LLMs. Names, DOBs, UPNs, and Emails are intercepted and cryptographically scrubbed out prior to generation. |
| **No persistent storage** | In-memory processing only |
| **Session isolation** | Each form session is isolated |
| **Automatic cleanup** | Data cleared on form submit or window close |
| **No logging of PII** | Only anonymized metrics logged |

### Anonymous Analytics (For Performance Testing Only)

```javascript
// ✅ ALLOWED - Anonymous metrics
{
  formType: "safeguarding",
  userLanguage: "urd",  // ISO 639-2 code
  fieldCount: 3,
  completionTime: 45,   // seconds
  success: true,
  corrections: 1,       // how many times user corrected Ed
  timestamp: "2026-02-19T10:00:00Z"
}

// ❌ PROHIBITED - Personal data
{
  userName: "Ahmed",
  userPhone: "07700 900123",
  concernText: "Bullying in playground",
  email: "ahmed@example.com"
}
```

---

## Legal Compliance

### UK Data Protection Act 2018 (GDPR)

**Principles we follow:**
1. **Lawfulness, fairness, transparency** - Clear consent, privacy notices
2. **Purpose limitation** - Data used only for form filling
3. **Data minimization** - Only collect fields needed for the form
4. **Accuracy** - User verifies information before submission
5. **Storage limitation** - Zero retention after form submission
6. **Integrity and confidentiality** - Secure processing, encryption
7. **Accountability** - Documentation, DPIA completed

### User Rights

| Right | How We Support It |
|-------|-------------------|
| **Right to be informed** | Clear privacy notice before processing |
| **Right to access** | N/A - we don't store data to access |
| **Right to rectification** | User can correct before form submission |
| **Right to erasure** | Automatic - data deleted immediately |
| **Right to restrict processing** | User can stop at any time |
| **Right to withdraw consent** | One-click stop button |

### FERPA (US Schools) / Data Protection (UK Schools)

**We do NOT:**
- Process student educational records without explicit consent
- Store student data on our servers
- Use student data for any purpose other than immediate form completion

**Schools remain data controllers** - form data goes directly to their systems under their existing policies.

---

## Guardrails for Different Contexts

### Website Visitors (Public Ed)

**Allowed:**
- Answer questions about the school
- Provide information from scanned website
- Offer form help if available

**Not Allowed:**
- Access personal student data
- Perform actions requiring authentication
- Bypass school controls

### Logged-In Parents

**Allowed:**
- Website visitor features +
- Form filling assistance
- Access their own child's information (via school's systems)

**Not Allowed:**
- Access other children's data
- Perform administrative actions

### School Staff

**Allowed:**
- All parent features +
- Execute skills (actions, documents, etc.)
- View organization data

**Not Allowed:**
- Share data outside their organization
- Use skills for personal purposes

---

## When We Log Data (For Improvement)

We ONLY log **anonymized metrics** to improve performance:

```javascript
// Form Helper analytics
{
  sessionId: "anon_" + hash(timestamp + random),
  organizationId: orgId,
  formType: "safeguarding|admissions|free-school-meals",
  detectedLanguage: "urd|pol|rom|ben|...",
  fieldsDetected: 5,
  fieldsFilled: 5,
  userCorrections: 2,
  completionSeconds: 67,
  abandoned: false,
  timestamp: ISO8601
}
```

**What we DON'T log:**
- Names, emails, phone numbers
- Form content (concerns, addresses, etc.)
- Voice recordings
- Anything that could identify a person

---

## Third-Party Services

| Service | Purpose | Privacy |
|---------|---------|----------|
| **OpenRouter** | AI model access | Check their privacy policy |
| **Qwen2.5-VL** | Multimodal processing | Open source, self-hostable option |
| **Supabase** | Database (school data) | School's own database, not ours |
| **Vercel** | Hosting | Infrastructure only |

---

## Compliance Checklist

For any new feature, ask:

- [ ] Do we store personal data? If yes, why is it necessary?
- [ ] Is user consent obtained? How?
- [ ] Is data deleted immediately after use?
- [ ] Do we train on user data? (Answer must be NO)
- [ ] Is there a privacy notice? Is it clear?
- [ ] Can users withdraw consent easily?
- [ ] Are we logging only anonymized metrics?
- [ ] Would this pass a DPIA (Data Protection Impact Assessment)?

---

## Documentation Requirements

When we go public, we need:

1. **Public Privacy Policy** - Covering all AI features
2. **DPIA (Data Protection Impact Assessment)** - For high-risk processing
3. **Cookie Policy** - If we use any tracking
4. **Accessibility Statement** - WCAG compliance
5. **Terms of Service** - Legal terms for using Schoolgle
6. **Fair Processing Notice** - Specific to AI features

---

## Changes Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-19 | Initial privacy documentation | Claude |
| | | |

---

## Notes

- This is living documentation - update as features evolve
- Always err on the side of more privacy
- When in doubt, don't store data
- Be transparent about what you do with data
