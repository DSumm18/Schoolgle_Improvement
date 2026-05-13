# UK GDPR Compliance Audit Report

**Platform:** Schoolgle - AI-Powered School Improvement Platform
**Audit Date:** 8 March 2026
**Auditor:** Automated Code Audit (requires DPO/legal review)
**Jurisdiction:** UK GDPR + Data Protection Act 2018
**Overall RAG Status:** RED

---

## Executive Summary

Schoolgle processes personal data of school staff, governors, and â€” through its compliance module â€” children's consent records, safeguarding concerns, and DBS/SCR data. The platform sends unmasked personal data to **13+ third-party processors**, predominantly US-based, through AI integrations. While foundational security controls exist (encryption, RLS, GDPR export/delete endpoints), **critical gaps** remain around children's data safeguards, Data Processing Agreements, AI data minimisation, and missing DPIAs.

### Overall RAG: RED

| Area                       | RAG   | Summary                                                             |
| -------------------------- | ----- | ------------------------------------------------------------------- |
| Legal Basis Documentation  | AMBER | Privacy Policy exists but incomplete for children/compliance module |
| Data Minimisation          | RED   | Full documents sent to AI providers without PII masking             |
| Children's Data Safeguards | RED   | Consent records store pupil names; no Article 8 compliance          |
| Third-Party DPAs           | RED   | DPA template exists but not signed; 8+ processors undocumented      |
| RLS & Access Control       | AMBER | RLS on most tables; 7 API routes missing auth checks                |
| Retention & Deletion       | AMBER | GDPR delete endpoint exists; no automated retention enforcement     |
| DPIA Coverage              | RED   | Zero formal DPIAs despite high-risk processing activities           |
| International Transfers    | RED   | Data sent to China (Qwen), US providers without verified SCCs       |
| Audit Logging              | AMBER | Basic logging exists; not tamper-evident                            |
| Consent Management         | RED   | No cookie consent banner; no parental consent verification          |

---

## Top 5 Priority Actions

### 1. CRITICAL: Implement PII Masking Before AI Processing

- **Risk:** Full document text (including headteacher names, staff details, potentially pupil references) sent unmasked to OpenRouter, DeepSeek, Gemini, Whisper, Deepgram
- **Impact:** UK GDPR Article 5(1)(c) data minimisation violation; Article 44 international transfer without adequate safeguards
- **Action:** Implement pre-processing PII detection and masking/pseudonymisation before any AI API call
- **Files:** `apps/platform/src/lib/ai-evidence-matcher.ts`, `apps/platform/src/lib/ai-openrouter.ts`

### 2. CRITICAL: Complete DPIAs for High-Risk Processing

- **Risk:** Zero DPIAs exist for: AI document analysis, safeguarding data, children's consent management, SCR/DBS processing, voice transcription
- **Impact:** Article 35 violation â€” mandatory DPIAs required for systematic processing of special category data and children's data
- **Action:** Commission DPIAs for each high-risk activity (templates provided in this audit package)

### 3. CRITICAL: Remove China-Based AI Provider (Qwen)

- **Risk:** Qwen 2.5 VL model (Alibaba, China) used for chart/diagram analysis via OpenRouter. No UK adequacy decision for China; no lawful transfer mechanism
- **Impact:** Schrems II equivalent violation under UK GDPR; potential ICO enforcement
- **Action:** Disable Qwen model immediately in `apps/platform/src/lib/ai-evidence-matcher.ts`
- **File:** `MODEL_CONFIG` in `ai-evidence-matcher.ts`

### 4. CRITICAL: Establish Signed DPAs With All Sub-Processors

- **Risk:** DPA template exists (`docs/legal/DATA_PROCESSING_AGREEMENT.md`) but lists only 5 processors. Actual integrations include 13+ services: OpenRouter, DeepSeek, Mistral, Gemini, Deepgram, Fish Audio, Stripe, Firebase, etc.
- **Impact:** Article 28 violation â€” processing without binding DPA
- **Action:** Obtain signed DPAs or verify existing terms for every sub-processor

### 5. HIGH: Implement Cookie Consent Banner & Children's Data Controls

- **Risk:** No cookie consent mechanism; compliance module stores children's names in consent records without Article 8 parental consent verification
- **Impact:** PECR violation (cookies); DPA 2018 s.130 violation (children under 13)
- **Action:** Implement cookie consent banner; add parental consent verification flow for under-13s data

---

## Phase 1: Discovery Findings

### 1.1 Personal Data Inventory

#### User Account Data

| Field        | Table                  | Category     | Sensitivity |
| ------------ | ---------------------- | ------------ | ----------- |
| email        | `users`                | Contact      | Medium      |
| display_name | `users`                | Identity     | Medium      |
| avatar_url   | `users`                | Identity     | Low         |
| role         | `organization_members` | Professional | Low         |
| job_title    | `organization_members` | Professional | Low         |
| firebase_uid | `users.id`             | Technical    | Medium      |

#### Staff Directory Data

| Field                 | Table             | Category     | Sensitivity |
| --------------------- | ----------------- | ------------ | ----------- |
| first_name, last_name | `staff_directory` | Identity     | Medium      |
| email, phone          | `staff_directory` | Contact      | Medium      |
| role, department      | `staff_directory` | Professional | Low         |
| qualifications        | `staff_directory` | Professional | Low         |

#### Children's Data (via Compliance Module)

| Field                                  | Table                           | Category           | Sensitivity  |
| -------------------------------------- | ------------------------------- | ------------------ | ------------ |
| pupil_name                             | `compliance_consent_records`    | Child Identity     | **CRITICAL** |
| pupil_id                               | `compliance_consent_records`    | Child Identity     | **CRITICAL** |
| parent_name, parent_email              | `compliance_consent_records`    | Parent Contact     | High         |
| consent_type (photo/medical/biometric) | `compliance_consent_records`    | Special Category   | **CRITICAL** |
| person_of_concern                      | `compliance_low_level_concerns` | Safeguarding       | **CRITICAL** |
| children_involved                      | `compliance_low_level_concerns` | Child Safeguarding | **CRITICAL** |

#### Special Category Data

| Field                                  | Table                           | Category                        | Article 9 Basis                               |
| -------------------------------------- | ------------------------------- | ------------------------------- | --------------------------------------------- |
| DBS certificate number                 | `compliance_scr_entries`        | Criminal Records                | Art 9(2)(g) - substantial public interest     |
| Disqualification declaration           | `compliance_scr_entries`        | Criminal/Safeguarding           | Art 9(2)(g)                                   |
| Low-level concern details              | `compliance_low_level_concerns` | Safeguarding                    | Art 9(2)(c) - vital interests                 |
| Absence reason (may contain health)    | `staff_absences`                | Health                          | [REQUIRES HUMAN INPUT - may need Art 9(2)(b)] |
| Incident metadata (unstructured JSONB) | `incident_logs`                 | Potentially health/safeguarding | **UNDETERMINED**                              |

### 1.2 Database Tables With Personal Data

96+ tables identified. Key tables with personal data and their RLS status:

| Table                           | Personal Data             | RLS Enabled  | Soft Delete      | Retention            |
| ------------------------------- | ------------------------- | ------------ | ---------------- | -------------------- |
| `users`                         | email, name, avatar       | **NO** (gap) | No (hard delete) | Until deletion + 30d |
| `organization_members`          | role, job_title, user_id  | Yes          | No               | Until removal        |
| `staff_directory`               | name, email, phone, quals | Yes          | Yes (deleted_at) | [UNDOCUMENTED]       |
| `compliance_consent_records`    | pupil_name, parent_email  | Yes          | No               | [UNDOCUMENTED]       |
| `compliance_low_level_concerns` | person details, children  | Yes          | No               | [UNDOCUMENTED]       |
| `compliance_scr_entries`        | DBS number, vetting data  | Yes          | No               | [UNDOCUMENTED]       |
| `compliance_complaints`         | complainant name, details | Yes          | No               | [UNDOCUMENTED]       |
| `staff_absences`                | absence type, reason      | Yes          | No               | [UNDOCUMENTED]       |
| `incident_logs`                 | description, metadata     | Yes          | No               | [UNDOCUMENTED]       |
| `lesson_observations`           | teacher_name, observer    | Yes          | No               | Until deletion       |
| `usage_events`                  | user_id, event data       | Yes          | No               | [UNDOCUMENTED]       |
| `activity_log`                  | user_id, event data       | Yes          | No               | Stated 12 months     |
| `ed_knowledge_patterns`         | Anonymised patterns       | Yes          | No               | [UNDOCUMENTED]       |
| `ed_skill_audit_log`            | Action type (no content)  | Yes          | No               | [UNDOCUMENTED]       |
| `survey_responses`              | Potentially identifiable  | Yes          | No               | [UNDOCUMENTED]       |

**Key finding:** The `users` table does NOT have RLS explicitly enabled in the core schema, though it may inherit policies from the security migration. This requires verification.

### 1.3 Third-Party Integrations & Data Flows

| Service                               | Location       | Data Sent                                         | DPA Status                      | Risk     |
| ------------------------------------- | -------------- | ------------------------------------------------- | ------------------------------- | -------- |
| **OpenRouter**                        | US             | Full document text (up to 20K chars), staff names | NOT SIGNED                      | CRITICAL |
| **DeepSeek** (via OpenRouter)         | China/US       | Full document text                                | NOT SIGNED                      | CRITICAL |
| **Qwen 2.5 VL** (via OpenRouter)      | **China**      | Images, charts                                    | NOT SIGNED                      | CRITICAL |
| **Google Gemini**                     | US             | Images, chat context, base64 photos               | NOT VERIFIED                    | HIGH     |
| **Anthropic Claude** (via OpenRouter) | US             | Analysis results, report synthesis                | NOT VERIFIED                    | HIGH     |
| **Mistral OCR** (via OpenRouter)      | EUâ†’US gateway  | Scanned PDF images                                | NOT VERIFIED                    | HIGH     |
| **OpenAI Whisper**                    | US             | Audio recordings with voices                      | NOT VERIFIED                    | HIGH     |
| **Deepgram**                          | US             | Meeting audio (up to 100MB)                       | NOT SIGNED                      | CRITICAL |
| **Fish Audio**                        | Unknown        | Text for TTS                                      | NOT SIGNED                      | CRITICAL |
| **Azure Neural TTS**                  | UK South       | Text for TTS                                      | Likely covered by Microsoft DPA | MEDIUM   |
| **Firebase Auth**                     | US/EU          | Email, OAuth tokens                               | Google DPA available            | MEDIUM   |
| **Supabase**                          | EU (Frankfurt) | All database content                              | DPA available                   | LOW      |
| **Stripe**                            | US             | Org name, payment method                          | DPF participant                 | LOW      |
| **GoCardless**                        | UK             | Bank details (planned)                            | UK-based                        | LOW      |
| **Vercel**                            | US/EU          | Application hosting                               | DPA available                   | LOW      |
| **DfE GIAS**                          | UK             | Public school data                                | Public data - N/A               | LOW      |

**Hardcoded API Key Found:** Fish Audio API key hardcoded as fallback in `apps/platform/src/app/api/fish-audio/tts/route.ts` line 12. This is a credential leak.

### 1.4 Authentication & Access Control

**Strengths:**

- Firebase Auth with Google/Microsoft SSO
- 7-tier role system (admin â†’ viewer)
- RLS on 40+ tables with organisation-scoped policies
- GDPR export and delete endpoints implemented
- Rate limiting on GDPR delete endpoint

**Gaps:**

- **7 API routes missing authentication checks:**
  - `GET /api/estates/assets` â€” TODO comment in code
  - `GET/POST /api/estates/evidence` â€” TODO comment
  - `GET /api/ed/analytics` â€” TODO comment
  - `GET /api/estates/contractors` â€” org_id param not validated
  - `POST /api/estates/tasks` â€” multiple TODO comments
  - `GET /api/estates/checks/custom` â€” no auth
  - `GET/POST /api/estates-compliance/daily-checks` â€” no validation
- `GET /api/admin/health` returns aggregate data for ALL organisations without auth
- Service role key (bypasses RLS) used in 22+ API routes
- GDPR export endpoint has no rate limiting (delete endpoint does)
- `POST /api/organization/create` accepts arbitrary userId without verifying caller
- No MFA enforcement (available but optional)

### 1.5 Data Storage Locations

| Storage                  | Location     | Region                       | Encryption                          |
| ------------------------ | ------------ | ---------------------------- | ----------------------------------- |
| Supabase PostgreSQL      | AWS          | EU (Frankfurt)               | AES-256 at rest, TLS 1.3 in transit |
| Supabase Storage         | AWS          | EU (Frankfurt)               | AES-256                             |
| Firebase Auth            | Google Cloud | EU                           | Google-managed                      |
| Vercel Edge/Serverless   | Vercel       | US/EU (deployment-dependent) | TLS 1.3                             |
| localStorage (browser)   | Client       | N/A                          | **NONE**                            |
| Chrome extension storage | Client       | N/A                          | **NONE**                            |

**Client-side storage concerns:**

- Supabase auth tokens persisted in localStorage (standard practice but requires privacy notice)
- SIAMS config stores API keys in localStorage unencrypted
- Chrome extension stores auth tokens, response cache, tool history without consent
- No cookie consent banner implemented
- Usage tracking session ID in sessionStorage (anonymised - acceptable)

---

## Phase 2: Risk Assessment by Module

| Module                      | Data Processed                                                                                     | Data Subjects                        | Lawful Basis                                          | Risk Level   | Gaps                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| **Estates Management**      | Asset register, room photos, location data, contractor details                                     | Staff, contractors                   | Art 6(1)(b) contract, Art 6(1)(e) public task         | MEDIUM       | 3 unprotected API routes; room photos may contain identifiable features sent to AI                       |
| **Compliance Module**       | Policy docs, training records, consent records, SCR/DBS, low-level concerns, complaints, FOI, DSAR | Staff, children, parents, governors  | Art 6(1)(c) legal obligation, Art 6(1)(e) public task | **CRITICAL** | Children's names stored; no DPIA; no Art 8 parental consent verification; DBS data retained indefinitely |
| **Daily Checks**            | Safeguarding checks, fire safety, premises audits                                                  | Staff (checkers)                     | Art 6(1)(e) public task                               | LOW          | No auth check on daily-checks endpoint                                                                   |
| **Ticketing/Helpdesk**      | Helpdesk tickets with descriptions, reporter details                                               | Staff                                | Art 6(1)(b) contract                                  | LOW          | Minimal PII in normal use                                                                                |
| **Ofsted Readiness**        | Self-assessments, evidence documents, action plans, observations                                   | Staff, teachers                      | Art 6(1)(b) contract, Art 6(1)(e) public task         | HIGH         | Evidence documents sent to AI unmasked; may contain student references in free text                      |
| **COSHH/Room Scanner**      | Room photos analysed by AI for hazards                                                             | Staff (peripheral), premises         | Art 6(1)(e) public task                               | MEDIUM       | Photos may include identifiable people; sent to Gemini/Qwen without redaction                            |
| **Staff Directory**         | Names, emails, phone numbers, roles, qualifications                                                | Staff                                | Art 6(1)(b) contract                                  | MEDIUM       | CSV import/export could leak data; no audit trail for bulk imports                                       |
| **Comms/Absence Reporting** | Staff absences with type and reason                                                                | Staff                                | Art 6(1)(b) contract                                  | HIGH         | Free-text reason field may contain health data (special category) without Article 9 basis                |
| **Governance Portal**       | Governor names, meeting minutes, training, visit reports                                           | Governors, staff                     | Art 6(1)(e) public task                               | MEDIUM       | Meeting minutes may reference individuals; no data retention policy                                      |
| **AI/Ed Assistant**         | Chat messages, voice recordings, form data, website visitor questions                              | Staff, website visitors              | Art 6(1)(a) consent, Art 6(1)(b) contract             | HIGH         | Audio sent to OpenAI/Deepgram unmasked; public website chat endpoint; no consent for website visitors    |
| **Surveys**                 | Survey responses (staff, parent, student audiences)                                                | Staff, parents, potentially children | Art 6(1)(a) consent, Art 6(1)(e) public task          | HIGH         | `is_anonymous` flag UI-only, not DB-enforced; student audience surveys may identify children             |
| **Mission Control**         | Aggregate analytics, AI costs, feature usage                                                       | Staff (aggregated)                   | Art 6(1)(f) legitimate interest                       | LOW          | Admin health endpoint exposes all orgs without auth                                                      |

### Critical Risk Flags

1. **Children's data processed without Article 8 compliance** â€” `compliance_consent_records` stores pupil names and biometric/photo consent types with no parental consent verification mechanism
2. **Special category data without DPIA** â€” Low-level concerns (safeguarding), SCR/DBS records, staff health absence reasons, biometric consent tracking
3. **Data sent to Chinese processor** â€” Qwen model (Alibaba) via OpenRouter; no adequacy decision for China
4. **No RLS on users table** â€” Core `users` table may lack explicit RLS policies
5. **AI models receiving identifiable personal data** â€” Full document text with names sent to 6+ US-based providers
6. **No data deletion mechanism for compliance module** â€” GDPR delete endpoint covers core tables but not compliance\_\* tables (consent records, SCR, complaints, etc.)

---

## Phase 3: Gap Analysis

### Legal Basis Gaps

| Processing Activity             | Claimed Basis         | Gap                                                                                 |
| ------------------------------- | --------------------- | ----------------------------------------------------------------------------------- |
| AI document analysis            | Not documented        | No specific legal basis stated for sending school documents to US AI providers      |
| Voice transcription             | Not documented        | Audio containing identifiable voices sent to OpenAI/Deepgram without specific basis |
| Children's consent management   | Not documented        | Storing pupil names requires parental consent under DPA 2018 s.130                  |
| Safeguarding low-level concerns | Art 6(1)(e) (implied) | Not formally documented; requires Art 9 special category basis                      |
| DBS/SCR processing              | Not documented        | Requires Art 10 criminal convictions basis                                          |
| Website visitor chat (Ed embed) | Not documented        | Public endpoint processes visitor data without any consent                          |
| Analytics/usage tracking        | "Legitimate interest" | No LIA (Legitimate Interest Assessment) conducted                                   |
| Staff absence reasons           | Art 6(1)(b) (implied) | Free text may contain health data requiring Art 9 basis                             |

### Data Minimisation Gaps

1. **AI processing:** Full document text (up to 20,000 chars) sent to models. No PII stripping, no content classification before transmission
2. **Cloud storage scanning:** Blanket folder access â€” no file-type filtering, potentially scans HR, payroll, SEND documents
3. **GDPR export:** Returns `SELECT *` from tables â€” includes internal IDs and technical fields beyond data subject rights
4. **Compliance module:** Free-text fields (incident metadata, complaint descriptions, low-level concern context) allow unbounded personal data entry
5. **Staff absence reason:** Free text field â€” should be restricted to enum values to prevent health data leaking in

### Retention & Deletion Gaps

| Data Category              | Stated Retention       | Implemented                                                 | Gap                                                      |
| -------------------------- | ---------------------- | ----------------------------------------------------------- | -------------------------------------------------------- |
| Account data               | Until deletion + 30d   | GDPR delete endpoint exists                                 | No automated 30-day purge after deletion request         |
| Activity logs              | 12 months              | Stated in export response                                   | **No automated purge job found in code**                 |
| Backups                    | 90 days                | Stated                                                      | Supabase-managed; [REQUIRES HUMAN INPUT] to verify       |
| Staff directory            | [UNDOCUMENTED]         | Soft delete only                                            | No hard deletion mechanism; no retention period          |
| Compliance consent records | [UNDOCUMENTED]         | No deletion mechanism                                       | **Children's data without retention policy**             |
| SCR/DBS records            | [UNDOCUMENTED]         | No deletion mechanism                                       | **Should be 6 years post-employment per KCSIE guidance** |
| Low-level concerns         | [UNDOCUMENTED]         | No deletion mechanism                                       | **Should be 7 years per safeguarding guidance**          |
| Complaints                 | [UNDOCUMENTED]         | No deletion mechanism                                       | **Should be per DfE complaints guidance**                |
| Usage events               | [UNDOCUMENTED]         | No purge                                                    | Tracks user_id indefinitely                              |
| Lesson observations        | Until deletion         | GDPR delete covers this                                     | Acceptable                                               |
| Survey responses           | [UNDOCUMENTED]         | No purge                                                    | May contain identifiable student data                    |
| AI processing              | Real-time (not stored) | Correct for Schoolgle; **but OpenAI retains audio 90 days** | [REQUIRES HUMAN INPUT] to verify provider retention      |

### Third-Party DPA Status

| Processor        | DPA Exists                  | Signed                     | SCCs for US Transfer       | Gap                                  |
| ---------------- | --------------------------- | -------------------------- | -------------------------- | ------------------------------------ |
| Supabase         | Yes (their standard)        | [REQUIRES HUMAN INPUT]     | N/A (EU)                   | Verify signed                        |
| Firebase/Google  | Yes (their standard)        | [REQUIRES HUMAN INPUT]     | Yes                        | Verify signed                        |
| OpenRouter       | **Unknown**                 | **No**                     | **No**                     | **CRITICAL - establish DPA**         |
| DeepSeek         | **Unknown**                 | **No**                     | **No**                     | **CRITICAL - China-routed provider** |
| Qwen-Alibaba     | **None**                    | **No**                     | **No**                     | **CRITICAL - China; no adequacy**    |
| Google Gemini    | Separate from Workspace DPA | [REQUIRES HUMAN INPUT]     | Likely via Google standard | Verify Gemini-specific DPA           |
| Anthropic Claude | Available on request        | [REQUIRES HUMAN INPUT]     | Yes (if signed)            | Verify signed                        |
| Mistral          | Available (EU-based)        | [REQUIRES HUMAN INPUT]     | N/A (EU via OpenRouter US) | Data routes through US               |
| OpenAI (Whisper) | Available                   | [REQUIRES HUMAN INPUT]     | Yes (DPF)                  | Verify signed; check audio retention |
| Deepgram         | **Unknown**                 | **No**                     | **No**                     | **CRITICAL - audio data**            |
| Fish Audio       | **Unknown**                 | **No**                     | **No**                     | **CRITICAL - unknown location**      |
| Azure TTS        | Microsoft DPA               | Likely via Azure agreement | Yes                        | [REQUIRES HUMAN INPUT]               |
| Stripe           | Yes (DPF participant)       | Automatic with ToS         | Yes (DPF)                  | Low risk                             |
| GoCardless       | Yes (UK-based)              | [REQUIRES HUMAN INPUT]     | N/A (UK)                   | Not yet active                       |
| Vercel           | Yes                         | [REQUIRES HUMAN INPUT]     | Yes                        | Verify signed                        |

### Security Gaps

1. **Hardcoded API key:** Fish Audio key in source code (`apps/platform/src/app/api/fish-audio/tts/route.ts` line 12)
2. **Service role key exposure:** DFE Supabase client uses service role key that could be exposed in client-side code (lazy-loaded)
3. **7 unprotected API routes:** Estates and analytics endpoints accessible without authentication
4. **No Stripe webhook signature validation** visible in webhook route
5. **Console.log leaks:** Organisation IDs and user IDs logged in production (e.g., `estates/assets/route.ts` line 34)
6. **No WAF rules** for GDPR endpoints (export/delete) â€” only rate limiting on delete
7. **Audit log not tamper-evident:** No cryptographic signing or append-only guarantees

### Children's Data Safeguards Assessment

| Requirement                                           | Status          | Evidence                                                       |
| ----------------------------------------------------- | --------------- | -------------------------------------------------------------- |
| Article 8 - Age verification                          | NOT IMPLEMENTED | No age-gating; consent records accept any pupil                |
| Article 8 - Parental consent verification             | NOT IMPLEMENTED | No parent identity verification flow                           |
| Article 12 - Transparent information (child-friendly) | NOT IMPLEMENTED | No child-facing privacy notice                                 |
| Article 13/14 - Information duty to children/parents  | NOT IMPLEMENTED | Privacy policy addresses adults only                           |
| DPA 2018 s.130 - Under-13 consent                     | NOT IMPLEMENTED | No minimum age enforcement                                     |
| ICO Age Appropriate Design Code                       | NOT ASSESSED    | [REQUIRES HUMAN INPUT] â€” likely in scope given consent records |

### AI/LLM Processing Assessment

| AI Use Case           | Data Sent                                       | Anonymised First?     | Provider                     | Risk       |
| --------------------- | ----------------------------------------------- | --------------------- | ---------------------------- | ---------- |
| Evidence matching     | Full document text (school policies, SEF, etc.) | **NO**                | OpenRouter â†’ approved-provider models | HIGH       |
| Voice-to-observation  | Audio recording of classroom                    | **NO**                | OpenAI Whisper               | HIGH       |
| Meeting transcription | Full meeting audio                              | **NO**                | Deepgram                     | HIGH       |
| Room/COSHH scanning   | Photos of school rooms                          | **NO**                | Gemini/Qwen                  | MEDIUM     |
| Ed chatbot            | User questions + page context                   | **NO**                | Gemini Flash                 | MEDIUM     |
| SEF report generation | Aggregated analysis results                     | Partially (summaries) | Anthropic Claude             | MEDIUM     |
| TTS (text-to-speech)  | Text content for reading aloud                  | **NO**                | Fish Audio / Azure TTS       | LOW-MEDIUM |

---

## Appendices

### A. Files Reviewed

- All Supabase migrations in `apps/platform/supabase/migrations/` and `supabase/migrations/`
- All API routes in `apps/platform/src/app/api/`
- Authentication context: `apps/platform/src/context/SupabaseAuthContext.tsx`
- AI integration: `apps/platform/src/lib/ai-evidence-matcher.ts`, `ai-openrouter.ts`
- Cloud services: `apps/platform/src/lib/cloud-service.ts`
- Legal documents: `docs/legal/PRIVACY_POLICY.md`, `DATA_PROCESSING_AGREEMENT.md`, `SECURITY_OVERVIEW.md`
- Compliance types: `apps/platform/src/lib/compliance/types.ts`
- Skills system: `apps/platform/src/lib/skills/`
- Extension: `packages/ed-extension/src/`

### B. Out of Scope

- Penetration testing
- Live database inspection (code-only audit)
- Verification of signed DPAs (contractual review)
- ICO registration status
- Staff training records
- Physical security assessment

### C. Recommended Follow-Up

1. DPO to review and approve this audit
2. Legal counsel to verify DPA status with all processors
3. ICO registration to be confirmed
4. Penetration test to validate technical controls
5. Live database audit to verify RLS enforcement
6. Staff data protection training assessment

---

**Report Status:** DRAFT - Requires DPO Approval
**Next Review:** Within 30 days (post-remediation of critical items)
**Distribution:** DPO, CTO, Legal Counsel (CONFIDENTIAL)



