# Sub-Processor List

**Data Processor:** Schoolgle Ltd
**Date:** 9 March 2026
**Version:** 2.0

> Per Article 28(2) UK GDPR, this document lists all sub-processors engaged by Schoolgle to process personal data on behalf of schools (Data Controllers). Schools are notified at least 30 days before any changes.

---

## Active Sub-Processors

### Infrastructure & Hosting

| Sub-Processor       | Purpose                                        | Data Processed                                                          | Location                         | DPA Status                                              | International Transfer Safeguard              |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| **Supabase Inc.**   | Database hosting, storage, authentication      | All platform data (accounts, assessments, evidence, compliance records) | EU (Frankfurt, AWS eu-central-1) | [REQUIRES HUMAN INPUT â€” verify DPA signed]              | N/A â€” EU region, UK adequacy decision applies |
| **Google Firebase** | User authentication (SSO)                      | Email, display name, OAuth tokens, login events                         | EU (Belgium/Netherlands)         | [REQUIRES HUMAN INPUT â€” verify Google Cloud DPA signed] | N/A â€” EU region                               |
| **Vercel Inc.**     | Application hosting, CDN, serverless functions | Request data, IP addresses (transient), application code                | US/EU (edge locations)           | [REQUIRES HUMAN INPUT â€” verify DPA signed]              | UK IDTA / SCCs required for US processing     |

### AI & Machine Learning

| Sub-Processor                   | Purpose                                                     | Data Processed                                                     | Location                                  | DPA Status                                          | International Transfer Safeguard          |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| **OpenRouter Inc.**             | AI model routing and API gateway                            | PII-masked document text (up to 20K chars), framework requirements | US                                        | **ACTION: Sign DPA + UK IDTA**                      | UK IDTA / SCCs required                   |
| **Google (Gemini API)**         | Primary document analysis, vision, AI chat (via OpenRouter) | PII-masked document text, room photographs, chat messages          | US                                        | [REQUIRES HUMAN INPUT â€” verify Gemini-specific DPA] | Likely covered by Google Cloud SCCs       |
| **Mistral AI** (via OpenRouter) | OCR for scanned documents                                   | Scanned PDF images                                                 | EU (France) â†’ US (via OpenRouter gateway) | [REQUIRES HUMAN INPUT]                              | EU-based but routed through US OpenRouter |
| **Anthropic PBC**               | Premium report generation (Claude, via OpenRouter)          | Analysis summaries, synthesised evidence                           | US                                        | [REQUIRES HUMAN INPUT â€” verify DPA signed]          | UK IDTA / SCCs required                   |

**REMOVED (v2.0):**

- ~~DeepSeek~~ â€” removed due to China/US location, no UK adequacy decision (Schrems II risk)
- ~~Alibaba Cloud (Qwen)~~ â€” removed due to China location, no lawful basis for transfer

### Audio & Voice

| Sub-Processor                            | Purpose                                        | Data Processed                                           | Location            | DPA Status                                 | International Transfer Safeguard                                                   |
| ---------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- | ------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------- |
| **OpenAI Inc.**                          | Voice transcription (Whisper API)              | Audio recordings containing identifiable voices          | US                  | [REQUIRES HUMAN INPUT â€” verify DPA signed] | UK IDTA / SCCs required; note OpenAI may retain audio 90 days for abuse monitoring |
| **Deepgram Inc.**                        | Meeting transcription with speaker diarisation | Full meeting audio (up to 100MB), speaker identification | US                  | **ACTION: Sign DPA + UK IDTA**             | UK IDTA / SCCs required                                                            |
| **Fish Audio**                           | Text-to-speech synthesis                       | Text content for audio conversion                        | **Unknown**         | **ACTION: Verify entity or replace**       | **UNKNOWN â€” consider replacing with Azure TTS**                                    |
| **Microsoft Azure** (Cognitive Services) | Neural text-to-speech                          | Text content for audio conversion                        | UK (uksouth region) | Likely covered by Microsoft DPA            | N/A â€” UK region                                                                    |

### Payment Processing

| Sub-Processor      | Purpose                                         | Data Processed                                      | Location | DPA Status                                                           | International Transfer Safeguard                           |
| ------------------ | ----------------------------------------------- | --------------------------------------------------- | -------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Stripe Inc.**    | Subscription payment processing                 | Organisation name, payment card details (tokenised) | US       | DPF (Data Privacy Framework) participant; standard terms include DPA | US-UK Data Privacy Framework (successor to Privacy Shield) |
| **GoCardless Ltd** | Direct debit payments (planned, not yet active) | Bank account details, mandate information           | UK       | [REQUIRES HUMAN INPUT â€” not yet active]                              | N/A â€” UK-based                                             |

### Government Data Sources

| Sub-Processor | Purpose                 | Data Processed                                                 | Location | DPA Status        | International Transfer Safeguard |
| ------------- | ----------------------- | -------------------------------------------------------------- | -------- | ----------------- | -------------------------------- |
| **DfE GIAS**  | School directory lookup | Public school data only (URN, name, address, headteacher name) | UK       | N/A â€” public data | N/A                              |

---

## Planned / Placeholder Sub-Processors (Not Yet Active)

| Sub-Processor | Purpose                  | Status                | Notes                              |
| ------------- | ------------------------ | --------------------- | ---------------------------------- |
| **Resend**    | Transactional email      | Placeholder code only | EU-based; not sending emails       |
| **Twilio**    | SMS/voice communications | Placeholder code only | US-based; would require DPA + SCCs |

---

## Sub-Processor Risk Summary

| Risk Level   | Sub-Processors                       | Action Required                                      |
| ------------ | ------------------------------------ | ---------------------------------------------------- |
| **HIGH**     | OpenRouter, Deepgram, Fish Audio     | Sign DPAs immediately; verify Fish Audio or replace  |
| **MEDIUM**   | OpenAI, Google Gemini, Anthropic     | Verify existing DPAs; execute UK IDTAs where missing |
| **LOW**      | Firebase, Vercel, Mistral, Azure TTS | Verify standard DPAs are signed and current          |
| **RESOLVED** | Supabase, Stripe, GoCardless, GIAS   | Standard terms adequate; verify annually             |

---

## Data Flow Diagram

```
School Staff (Browser)
       â”‚
       â–¼
   Vercel (US/EU) â”€â”€â”€â”€ Application Hosting
       â”‚
       â”œâ”€â”€â–º Supabase (EU) â”€â”€â”€â”€ Database, Storage
       â”‚
       â”œâ”€â”€â–º Firebase (EU) â”€â”€â”€â”€ Authentication
       â”‚
       â”œâ”€â”€â–º OpenRouter (US) â”€â”€â–º Gemini Flash (US) â€” primary analysis
       â”‚                   â”€â”€â–º Gemini Flash Lite (US) â€” fallback
       â”‚                   â”€â”€â–º Mistral OCR (EUâ†’US) â€” scanned docs
       â”‚                   â”€â”€â–º Claude (US) â€” premium reports
       â”‚
       â”œâ”€â”€â–º OpenAI (US) â”€â”€â”€â”€ Whisper Transcription
       â”‚
       â”œâ”€â”€â–º Deepgram (US) â”€â”€â”€â”€ Meeting Transcription
       â”‚
       â”œâ”€â”€â–º Azure TTS (UK) â”€â”€â”€â”€ Text-to-Speech
       â”‚
       â”œâ”€â”€â–º Stripe (US) â”€â”€â”€â”€ Payments
       â”‚
       â””â”€â”€â–º Google/Microsoft (US) â”€â”€â”€â”€ Drive/OneDrive APIs

   âœ… PII masking applied before all AI calls
   âœ… DeepSeek (China) REMOVED
   âœ… Qwen-Alibaba (China) REMOVED
   âœ… Fish Audio under review (consider Azure TTS replacement)
```

---

## Change Notification Process

Per our DPA (Section 4.4):

1. Schoolgle will notify school admins via email at least **30 days** before adding, removing, or changing any sub-processor
2. Schools may object to a new sub-processor by emailing dpo@schoolgle.co.uk within the 30-day notice period
3. If the school objects and Schoolgle cannot provide the service without the sub-processor, either party may terminate the affected service

---

## Document Control

| Version | Date         | Change                                                            | Author               |
| ------- | ------------ | ----------------------------------------------------------------- | -------------------- |
| 1.0     | 8 March 2026 | Initial audit discovery                                           | Automated GDPR Audit |
| 2.0     | 9 March 2026 | Removed non-approved providers; Gemini Flash as primary; PII masking noted | Engineering          |

**Next review:** Quarterly or on any sub-processor change

**Maintained by:** DPO (dpo@schoolgle.co.uk)



