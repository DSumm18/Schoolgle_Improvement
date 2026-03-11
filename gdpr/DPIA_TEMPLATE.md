# Data Protection Impact Assessment (DPIA) Template

**Organisation:** Schoolgle Ltd (Data Processor) / [School Name] (Data Controller)
**Template Version:** 1.0
**Date:** 8 March 2026

> This template is pre-populated for the Schoolgle platform context. Each high-risk processing activity requires its own completed DPIA. Modules rated HIGH or CRITICAL in the audit have individual DPIAs below.

---

## How to Use This Template

1. Copy the relevant section for the module you are assessing
2. Complete all [REQUIRES HUMAN INPUT] fields
3. Have the DPO review and sign off
4. Review annually or when processing changes materially
5. File with the ICO if residual risk remains HIGH after mitigations

---

# DPIA 1: AI Document Analysis Pipeline

**Status:** CRITICAL — Required before pilot school onboarding

## Step 1: Identify the Need for a DPIA

| Question                                                | Answer                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Does the processing use new technologies?               | Yes — AI/LLM models for document analysis                                     |
| Does it involve systematic processing on a large scale? | Yes — all school documents processed through AI                               |
| Does it involve special category data?                  | Potentially — documents may contain safeguarding, health, or pupil references |
| Does it involve children's data?                        | Potentially — school documents may reference children                         |
| Does it involve international transfers?                | Yes — data sent to US-based AI providers                                      |

**Conclusion:** DPIA is mandatory under Article 35.

## Step 2: Describe the Processing

| Item                     | Detail                                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nature of processing** | School documents (policies, SEF, curriculum plans, evidence) are extracted as text and sent to AI models for analysis against Ofsted/SIAMS frameworks |
| **Scope**                | All documents uploaded or scanned from Google Drive/OneDrive for subscribing schools                                                                  |
| **Context**              | Schools use Schoolgle to prepare for inspections; AI analyses documents to identify evidence of framework compliance                                  |
| **Purpose**              | Automated matching of school evidence to inspection framework requirements                                                                            |
| **Data categories**      | Document text (up to 20,000 chars per document), file metadata (name, folder, date), framework requirements                                           |
| **Data subjects**        | School staff (named in documents), potentially children (if referenced in documents), headteachers                                                    |
| **Recipients**           | OpenRouter (US), DeepSeek (China/US), Google Gemini (US), Anthropic Claude (US), Mistral (EU via US)                                                  |
| **Retention**            | AI processing is real-time; matched evidence stored in Supabase (EU) indefinitely until deleted                                                       |

## Step 3: Assess Necessity and Proportionality

| Principle                       | Assessment                                                                                                                 | Compliant?                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Lawful basis**                | Contract performance (Art 6(1)(b)) for the service; schools consent to AI processing via DPA                               | Partial — needs explicit mention in DPA |
| **Purpose limitation**          | Data used only for framework evidence matching                                                                             | Yes                                     |
| **Data minimisation**           | **NO** — full document text sent without PII masking. Documents may contain far more than necessary for framework matching | **NO**                                  |
| **Accuracy**                    | AI analysis results are presented as suggestions, not authoritative; staff review required                                 | Yes                                     |
| **Storage limitation**          | Evidence matches stored indefinitely; no automated retention                                                               | **NO**                                  |
| **Integrity & confidentiality** | TLS 1.3 in transit; AES-256 at rest in Supabase; but no encryption during AI processing                                    | Partial                                 |

## Step 4: Identify and Assess Risks

| Risk                                                                          | Likelihood | Impact | Overall Risk | Mitigation                                                      |
| ----------------------------------------------------------------------------- | ---------- | ------ | ------------ | --------------------------------------------------------------- |
| Personal data (staff names, headteacher) in documents sent to US AI providers | High       | Medium | **HIGH**     | Implement PII masking before AI transmission                    |
| Children's data accidentally included in school documents                     | Medium     | High   | **HIGH**     | Content classification to detect and warn about pupil data      |
| AI provider retains data beyond processing                                    | Low        | High   | **MEDIUM**   | Verify provider deletion policies; enforce via DPA              |
| Data sent to China (Qwen model) without adequacy                              | High       | High   | **CRITICAL** | Remove Qwen model from configuration immediately                |
| Cross-border transfer without adequate safeguards                             | High       | Medium | **HIGH**     | Execute signed IDTAs/SCCs with all US providers                 |
| AI hallucination leads to incorrect compliance assessment                     | Medium     | Medium | **MEDIUM**   | Clear disclaimers; human review required                        |
| Bulk document scanning captures sensitive HR/financial docs                   | Medium     | High   | **HIGH**     | Implement file-type filtering; warn on sensitive document types |

## Step 5: Measures to Reduce Risk

| Measure                                                   | Status   | Owner       | Deadline  |
| --------------------------------------------------------- | -------- | ----------- | --------- |
| Remove Qwen (China) model                                 | NOT DONE | CTO         | Immediate |
| Implement PII masking layer before AI calls               | NOT DONE | Engineering | 30 days   |
| Sign IDTAs/SCCs with OpenRouter, Deepgram, OpenAI         | NOT DONE | Legal       | 30 days   |
| Add file-type filtering for cloud storage scanning        | NOT DONE | Engineering | 30 days   |
| Add content warning when documents may contain pupil data | NOT DONE | Engineering | 60 days   |
| Implement evidence match retention policy                 | NOT DONE | Engineering | 60 days   |
| Add opt-out for AI processing per document                | NOT DONE | Product     | 90 days   |

## Step 6: Sign Off

| Role                                 | Name                   | Date | Signature |
| ------------------------------------ | ---------------------- | ---- | --------- |
| Data Protection Officer              | [REQUIRES HUMAN INPUT] |      |           |
| Senior Information Risk Owner (SIRO) | [REQUIRES HUMAN INPUT] |      |           |
| Project Lead                         | [REQUIRES HUMAN INPUT] |      |           |

**Residual risk after mitigations:** [REQUIRES HUMAN INPUT — reassess after implementing measures]

**ICO consultation required?** If residual risk remains HIGH after mitigations, consultation with the ICO is required under Article 36.

---

# DPIA 2: Compliance Module — Children's Consent Management

**Status:** CRITICAL — Required before compliance module goes live

## Step 2: Describe the Processing

| Item                   | Detail                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Nature**             | Schools record parental consent decisions (photography, trips, medical treatment, biometric) for individual pupils    |
| **Scope**              | All children in subscribing schools where Compliance module is active                                                 |
| **Data categories**    | Pupil name, pupil ID (optional), parent/carer name, parent email, consent type, consent status, date, withdrawal date |
| **Data subjects**      | Children (including under-13s), parents/carers                                                                        |
| **Special categories** | Medical consent, biometric consent (Article 9 data)                                                                   |
| **Recipients**         | Stored in Supabase (EU) only; not sent to AI providers                                                                |
| **Retention**          | Currently indefinite; no automated deletion                                                                           |

## Step 3: Necessity and Proportionality

| Principle                     | Assessment                                                             | Compliant?                                                    |
| ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| **Lawful basis**              | Art 6(1)(a) — parental consent; Art 8 — parental consent for under-13s | **Partial** — no verification mechanism for parental identity |
| **Special category basis**    | Art 9(2)(a) — explicit consent for medical/biometric                   | **Partial** — "explicit" not enforced technically             |
| **Data minimisation**         | Pupil name required for identification; pupil_id is optional           | Acceptable                                                    |
| **Children's rights (Art 8)** | No parental consent verification; no age-gating                        | **NO**                                                        |

## Step 4: Risks

| Risk                                                           | Likelihood | Impact | Overall      | Mitigation                                                            |
| -------------------------------------------------------------- | ---------- | ------ | ------------ | --------------------------------------------------------------------- |
| Under-13 consent recorded without parental verification        | High       | High   | **CRITICAL** | Implement parental consent verification flow                          |
| Biometric consent recorded without "explicit" consent standard | Medium     | High   | **HIGH**     | Add explicit consent mechanism with separate confirmation             |
| Consent records retained indefinitely after child leaves       | High       | Medium | **HIGH**     | Implement retention policy (delete on child departure + grace period) |
| Unauthorised access to children's data                         | Low        | High   | **MEDIUM**   | RLS enabled; org-scoped access                                        |
| No child-friendly privacy information                          | High       | Medium | **HIGH**     | Create age-appropriate privacy notice                                 |

## Step 5: Measures

| Measure                                                 | Status   | Owner       | Deadline |
| ------------------------------------------------------- | -------- | ----------- | -------- |
| Parental consent verification flow                      | NOT DONE | Engineering | 30 days  |
| Explicit consent UI for biometric/medical               | NOT DONE | Engineering | 30 days  |
| Retention policy: auto-flag records for review annually | NOT DONE | Engineering | 60 days  |
| Child-friendly privacy notice                           | NOT DONE | Legal/DPO   | 30 days  |
| Age field on consent records                            | NOT DONE | Engineering | 30 days  |

---

# DPIA 3: Safeguarding Data — Low-Level Concerns

**Status:** CRITICAL — Required for safeguarding compliance

## Step 2: Describe the Processing

| Item                   | Detail                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Nature**             | Schools record low-level concerns about staff, with potential references to children involved                     |
| **Scope**              | All subscribing schools using the Compliance module                                                               |
| **Data categories**    | Person of concern (staff name/role), description, context, children involved, DSL review notes, escalation status |
| **Data subjects**      | School staff (person of concern), children (potentially identified), DSL                                          |
| **Special categories** | Safeguarding allegations (Article 9); potential criminal matters (Article 10)                                     |
| **Retention**          | Currently indefinite; should be 7 years per safeguarding guidance                                                 |

## Step 4: Risks

| Risk                                                                   | Likelihood | Impact | Overall      | Mitigation                                                                       |
| ---------------------------------------------------------------------- | ---------- | ------ | ------------ | -------------------------------------------------------------------------------- |
| Children identified in free-text fields without additional protections | High       | High   | **CRITICAL** | Add guidance/validation to minimise child identifiers; consider pseudonymisation |
| No retention policy for concerns — stored indefinitely                 | High       | Medium | **HIGH**     | Implement 7-year retention with automated review/purge                           |
| Concern data accessed by non-DSL staff                                 | Low        | High   | **MEDIUM**   | Restrict access to DSL/admin roles only (additional RLS policy)                  |
| LADO referral data stored without Article 10 basis documented          | Medium     | High   | **HIGH**     | Document Art 10 basis in processing register                                     |

---

# DPIA 4: Voice Transcription and Meeting Recording

**Status:** HIGH — Required before voice features used in production

## Step 2: Describe the Processing

| Item                | Detail                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| **Nature**          | Audio recordings of classroom observations or meetings transcribed to text           |
| **Scope**           | Staff who use voice-to-observation or meeting transcription features                 |
| **Data categories** | Audio containing identifiable voices, speaker identification, transcribed text       |
| **Data subjects**   | Teachers (observed), observers, meeting participants                                 |
| **Recipients**      | OpenAI Whisper (US), Deepgram (US)                                                   |
| **Retention**       | Audio stored in Supabase after transcription; transcription text stored indefinitely |

## Step 4: Risks

| Risk                                                              | Likelihood | Impact | Overall    | Mitigation                                                              |
| ----------------------------------------------------------------- | ---------- | ------ | ---------- | ----------------------------------------------------------------------- |
| Identifiable voices sent to US providers without specific consent | High       | Medium | **HIGH**   | Add explicit consent before recording; inform participants              |
| OpenAI retains audio for 90 days (abuse monitoring)               | Medium     | Medium | **MEDIUM** | Verify; request opt-out; document in privacy notice                     |
| Audio files accumulate without retention policy                   | High       | Medium | **HIGH**   | Auto-delete audio after 30 days (keep transcription only)               |
| Meeting audio captures confidential HR/safeguarding discussions   | Medium     | High   | **HIGH**   | Warning before recording; do-not-record guidance for sensitive meetings |

---

# DPIA 5: SCR/DBS Processing

**Status:** HIGH — Required for compliance module

## Step 2: Describe the Processing

| Item                   | Detail                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Nature**             | Schools maintain Single Central Record of staff vetting checks                                                                        |
| **Data categories**    | DBS certificate number, prohibition check, section 128 check, overseas check, disqualification declaration, right to work, start date |
| **Data subjects**      | All school staff, governors, volunteers                                                                                               |
| **Special categories** | Article 10 — criminal convictions data (DBS checks, disqualification)                                                                 |
| **Retention**          | Currently indefinite; should be 6 years post-employment                                                                               |

## Step 4: Risks

| Risk                                                              | Likelihood | Impact | Overall    | Mitigation                                           |
| ----------------------------------------------------------------- | ---------- | ------ | ---------- | ---------------------------------------------------- |
| DBS data retained indefinitely beyond statutory need              | High       | Medium | **HIGH**   | Implement retention policy (6 years post-employment) |
| No Article 10 lawful basis formally documented                    | High       | Medium | **HIGH**   | Document Schedule 1 Part 1 DPA 2018 basis            |
| Disqualification declarations without appropriate policy document | Medium     | Medium | **MEDIUM** | Create Appropriate Policy Document per DPA 2018      |

---

# DPIA 6: Staff Absence Reporting

**Status:** HIGH — Health data risk

## Step 2: Describe the Processing

| Item                   | Detail                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Nature**             | Schools record staff absences with type and reason                                     |
| **Data categories**    | Staff name, absence type (sickness/emergency/medical/other), reason (free text), dates |
| **Data subjects**      | School staff                                                                           |
| **Special categories** | Potentially Article 9 health data if reason field contains health information          |

## Step 4: Risks

| Risk                                                            | Likelihood | Impact | Overall    | Mitigation                                                     |
| --------------------------------------------------------------- | ---------- | ------ | ---------- | -------------------------------------------------------------- |
| Free-text reason field contains health data without Art 9 basis | High       | Medium | **HIGH**   | Restrict to enum values; remove free-text reason field         |
| Health-related absence patterns become identifiable             | Medium     | Medium | **MEDIUM** | Aggregate reporting only; restrict individual access to HR/SLT |

---

## Summary of Required DPIAs

| #   | Processing Activity                   | Risk Rating | Status                               |
| --- | ------------------------------------- | ----------- | ------------------------------------ |
| 1   | AI Document Analysis Pipeline         | CRITICAL    | Template provided — needs completion |
| 2   | Children's Consent Management         | CRITICAL    | Template provided — needs completion |
| 3   | Safeguarding Low-Level Concerns       | CRITICAL    | Template provided — needs completion |
| 4   | Voice Transcription/Meeting Recording | HIGH        | Template provided — needs completion |
| 5   | SCR/DBS Processing                    | HIGH        | Template provided — needs completion |
| 6   | Staff Absence Reporting               | HIGH        | Template provided — needs completion |

All DPIAs must be reviewed and signed by the DPO before the relevant features are used by pilot schools.
