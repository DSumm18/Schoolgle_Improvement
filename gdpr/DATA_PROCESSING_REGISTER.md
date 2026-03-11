# Record of Processing Activities (ROPA)

**Data Processor:** Schoolgle Ltd
**Article 30(2) UK GDPR Record**
**Date:** 8 March 2026
**Version:** 1.0

> This register covers all processing activities carried out by Schoolgle Ltd as Data Processor on behalf of schools (Data Controllers). Schools must maintain their own Article 30(1) register as Data Controller.

---

## Processor Details

| Field                | Detail                      |
| -------------------- | --------------------------- |
| **Organisation**     | Schoolgle Ltd               |
| **Role**             | Data Processor (Article 28) |
| **DPO Contact**      | dpo@schoolgle.co.uk         |
| **ICO Registration** | [REQUIRES HUMAN INPUT]      |
| **Address**          | [REQUIRES HUMAN INPUT]      |

---

## Processing Activity Register

### PA-001: User Authentication & Account Management

| Field                           | Detail                                                       |
| ------------------------------- | ------------------------------------------------------------ |
| **Processing purpose**          | Authenticate users and manage access to the platform         |
| **Categories of data subjects** | School staff, governors, administrators                      |
| **Categories of personal data** | Email, display name, avatar URL, Firebase UID, OAuth tokens  |
| **Lawful basis**                | Article 6(1)(b) — contract performance                       |
| **Recipients**                  | Google Firebase (authentication), Supabase (account storage) |
| **International transfers**     | US (Firebase Auth — Google DPA + SCCs)                       |
| **Retention**                   | Until account deletion + 30 days                             |
| **Technical measures**          | TLS 1.3, AES-256, RLS, session timeout                       |
| **DPIA required?**              | No                                                           |

### PA-002: Organisation & Membership Management

| Field                           | Detail                                                         |
| ------------------------------- | -------------------------------------------------------------- |
| **Processing purpose**          | Manage school organisations, member roles, invitations         |
| **Categories of data subjects** | School staff, administrators                                   |
| **Categories of personal data** | Organisation name, member roles, job titles, invitation emails |
| **Lawful basis**                | Article 6(1)(b) — contract performance                         |
| **Recipients**                  | Supabase (EU)                                                  |
| **International transfers**     | None                                                           |
| **Retention**                   | Until organisation deleted + 30 days                           |
| **Technical measures**          | RLS, org-scoped access, admin-only management                  |
| **DPIA required?**              | No                                                             |

### PA-003: School Improvement Assessments (Ofsted/SIAMS)

| Field                           | Detail                                                                            |
| ------------------------------- | --------------------------------------------------------------------------------- |
| **Processing purpose**          | Track school self-assessments against inspection frameworks                       |
| **Categories of data subjects** | School staff (assessors)                                                          |
| **Categories of personal data** | Assessor user ID, assessment ratings, evidence notes                              |
| **Lawful basis**                | Article 6(1)(b) — contract; Article 6(1)(e) — public task (education improvement) |
| **Recipients**                  | Supabase (EU)                                                                     |
| **International transfers**     | None (assessment data not sent to AI)                                             |
| **Retention**                   | Until deleted by school + 30 days                                                 |
| **Technical measures**          | RLS, org-scoped                                                                   |
| **DPIA required?**              | No                                                                                |

### PA-004: AI Document Evidence Matching

| Field                           | Detail                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Processing purpose**          | Analyse school documents to match evidence against framework requirements                                 |
| **Categories of data subjects** | School staff (named in documents), potentially children (if referenced)                                   |
| **Categories of personal data** | Document text (up to 20,000 chars), file metadata, staff names in documents                               |
| **Lawful basis**                | Article 6(1)(b) — contract performance                                                                    |
| **Special category**            | Potentially — if documents contain safeguarding/health references                                         |
| **Recipients**                  | OpenRouter (US), DeepSeek (China/US), Google Gemini (US), Anthropic Claude (US), Mistral (EU via US)      |
| **International transfers**     | US (OpenRouter, Gemini, Claude — [REQUIRES HUMAN INPUT: signed SCCs]); China (Qwen — **NO LAWFUL BASIS**) |
| **Retention**                   | AI processing real-time; evidence matches in Supabase indefinitely                                        |
| **Technical measures**          | TLS 1.3 in transit; **NO PII masking before transmission**                                                |
| **DPIA required?**              | **YES — CRITICAL** (see DPIA 1)                                                                           |

### PA-005: Voice-to-Observation Transcription

| Field                           | Detail                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| **Processing purpose**          | Transcribe classroom observation audio recordings to text             |
| **Categories of data subjects** | Teachers (observed), observers                                        |
| **Categories of personal data** | Audio recordings (identifiable voices), transcribed text              |
| **Lawful basis**                | Article 6(1)(b) — contract; Article 6(1)(a) — consent (for recording) |
| **Recipients**                  | OpenAI Whisper (US)                                                   |
| **International transfers**     | US (OpenAI — [REQUIRES HUMAN INPUT: signed SCCs])                     |
| **Retention**                   | Audio and transcription in Supabase indefinitely                      |
| **Technical measures**          | TLS 1.3                                                               |
| **DPIA required?**              | **YES — HIGH** (see DPIA 4)                                           |

### PA-006: Meeting Transcription

| Field                           | Detail                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| **Processing purpose**          | Transcribe meeting audio with speaker identification                  |
| **Categories of data subjects** | Meeting participants (staff, governors)                               |
| **Categories of personal data** | Audio recordings (up to 100MB), speaker-labelled transcriptions       |
| **Lawful basis**                | Article 6(1)(b) — contract; Article 6(1)(a) — consent (for recording) |
| **Recipients**                  | Deepgram (US)                                                         |
| **International transfers**     | US (Deepgram — [REQUIRES HUMAN INPUT: signed SCCs])                   |
| **Retention**                   | Audio and transcription in Supabase indefinitely                      |
| **Technical measures**          | TLS 1.3                                                               |
| **DPIA required?**              | **YES — HIGH** (see DPIA 4)                                           |

### PA-007: Staff Directory Management

| Field                           | Detail                                                                |
| ------------------------------- | --------------------------------------------------------------------- |
| **Processing purpose**          | Maintain staff records for school management                          |
| **Categories of data subjects** | School staff                                                          |
| **Categories of personal data** | First name, last name, email, phone, role, department, qualifications |
| **Lawful basis**                | Article 6(1)(b) — contract performance                                |
| **Recipients**                  | Supabase (EU)                                                         |
| **International transfers**     | None                                                                  |
| **Retention**                   | Soft delete (deleted_at); no hard deletion policy documented          |
| **Technical measures**          | RLS, org-scoped                                                       |
| **DPIA required?**              | No                                                                    |

### PA-008: Staff Absence Recording

| Field                           | Detail                                                                    |
| ------------------------------- | ------------------------------------------------------------------------- |
| **Processing purpose**          | Record and manage staff absences                                          |
| **Categories of data subjects** | School staff                                                              |
| **Categories of personal data** | Staff name, absence type, reason (free text), dates                       |
| **Lawful basis**                | Article 6(1)(b) — contract                                                |
| **Special category**            | Potentially Article 9 — health data if reason contains health information |
| **Recipients**                  | Supabase (EU)                                                             |
| **International transfers**     | None                                                                      |
| **Retention**                   | [UNDOCUMENTED]                                                            |
| **Technical measures**          | RLS, org-scoped                                                           |
| **DPIA required?**              | **YES — HIGH** (see DPIA 6)                                               |

### PA-009: Compliance Training Tracking

| Field                           | Detail                                                                        |
| ------------------------------- | ----------------------------------------------------------------------------- |
| **Processing purpose**          | Track staff completion of statutory training courses                          |
| **Categories of data subjects** | School staff, governors                                                       |
| **Categories of personal data** | Staff name, course completed, completion date, expiry date, evidence file     |
| **Lawful basis**                | Article 6(1)(c) — legal obligation (H&S at Work Act 1974, Education Act 2002) |
| **Recipients**                  | Supabase (EU)                                                                 |
| **International transfers**     | None                                                                          |
| **Retention**                   | [UNDOCUMENTED — recommend duration of employment + 6 years]                   |
| **Technical measures**          | RLS, org-scoped                                                               |
| **DPIA required?**              | No                                                                            |

### PA-010: SCR/DBS Vetting Records

| Field                           | Detail                                                                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Processing purpose**          | Maintain Single Central Record of staff vetting and safeguarding checks                                                                      |
| **Categories of data subjects** | School staff, governors, volunteers                                                                                                          |
| **Categories of personal data** | DBS certificate number, prohibition check status, section 128 check, overseas check, disqualification declaration, right to work, start date |
| **Lawful basis**                | Article 6(1)(c) — legal obligation (Education Act 2002, KCSIE)                                                                               |
| **Special category**            | Article 10 — criminal convictions data (DPA 2018 Schedule 1 Part 1)                                                                          |
| **Recipients**                  | Supabase (EU)                                                                                                                                |
| **International transfers**     | None                                                                                                                                         |
| **Retention**                   | Currently indefinite; should be 6 years post-employment                                                                                      |
| **Technical measures**          | RLS, org-scoped, admin-only access                                                                                                           |
| **DPIA required?**              | **YES — HIGH** (see DPIA 5)                                                                                                                  |

### PA-011: Low-Level Concerns Register

| Field                           | Detail                                                                                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Processing purpose**          | Record and manage low-level safeguarding concerns about staff                                             |
| **Categories of data subjects** | School staff (person of concern), children (potentially identified)                                       |
| **Categories of personal data** | Person of concern name/role, description, context, children involved, DSL review notes, escalation status |
| **Lawful basis**                | Article 6(1)(e) — public task (Education Act 2002 s.175/157, KCSIE)                                       |
| **Special category**            | Article 9(2)(c) — vital interests; Article 10 — criminal matters (if escalated)                           |
| **Recipients**                  | Supabase (EU)                                                                                             |
| **International transfers**     | None                                                                                                      |
| **Retention**                   | Currently indefinite; should be 7 years per safeguarding guidance                                         |
| **Technical measures**          | RLS, org-scoped                                                                                           |
| **DPIA required?**              | **YES — CRITICAL** (see DPIA 3)                                                                           |

### PA-012: Children's Consent Management

| Field                           | Detail                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| **Processing purpose**          | Record parental consent for school activities (photography, trips, medical, biometric)     |
| **Categories of data subjects** | Children (including under-13s), parents/carers                                             |
| **Categories of personal data** | Pupil name, pupil ID, parent/carer name, parent email, consent type, consent status, dates |
| **Lawful basis**                | Article 6(1)(a) — consent; Article 8 — parental consent for under-13s                      |
| **Special category**            | Article 9(2)(a) — explicit consent (medical, biometric)                                    |
| **Recipients**                  | Supabase (EU)                                                                              |
| **International transfers**     | None                                                                                       |
| **Retention**                   | Currently indefinite; [REQUIRES HUMAN INPUT: until child leaves school + grace period]     |
| **Technical measures**          | RLS, org-scoped                                                                            |
| **DPIA required?**              | **YES — CRITICAL** (see DPIA 2)                                                            |

### PA-013: Complaints Handling

| Field                           | Detail                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| **Processing purpose**          | Record and manage formal complaints                                                |
| **Categories of data subjects** | Complainants (parents, staff, public), staff (subjects of complaint)               |
| **Categories of personal data** | Complainant name, relationship, nature of complaint, category, resolution, outcome |
| **Lawful basis**                | Article 6(1)(c) — legal obligation (DfE complaints guidance)                       |
| **Recipients**                  | Supabase (EU)                                                                      |
| **International transfers**     | None                                                                               |
| **Retention**                   | [UNDOCUMENTED — recommend per DfE guidance]                                        |
| **Technical measures**          | RLS, org-scoped                                                                    |
| **DPIA required?**              | Only if involving children or special category data                                |

### PA-014: Estates & Facilities Management

| Field                           | Detail                                                          |
| ------------------------------- | --------------------------------------------------------------- |
| **Processing purpose**          | Manage school assets, contractors, room assessments, helpdesk   |
| **Categories of data subjects** | Staff, contractors                                              |
| **Categories of personal data** | Contractor names/companies, reporter details, room photos       |
| **Lawful basis**                | Article 6(1)(b) — contract; Article 6(1)(e) — public task (H&S) |
| **Recipients**                  | Supabase (EU); Google Gemini (US — for room scanning)           |
| **International transfers**     | US (Gemini — for AI room assessment)                            |
| **Retention**                   | [UNDOCUMENTED]                                                  |
| **Technical measures**          | RLS (some API routes missing auth — see audit)                  |
| **DPIA required?**              | No (unless room photos contain identifiable people)             |

### PA-015: Governance Portal

| Field                           | Detail                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| **Processing purpose**          | Manage governor directory, meetings, training, visit reports            |
| **Categories of data subjects** | Governors, school staff                                                 |
| **Categories of personal data** | Governor names, roles, term dates, meeting attendance, training records |
| **Lawful basis**                | Article 6(1)(e) — public task (Academies Act 2010, Education Act 2002)  |
| **Recipients**                  | Supabase (EU)                                                           |
| **International transfers**     | None                                                                    |
| **Retention**                   | [UNDOCUMENTED — recommend term of office + 6 years]                     |
| **Technical measures**          | RLS, org-scoped                                                         |
| **DPIA required?**              | No                                                                      |

### PA-016: Survey Data Collection

| Field                           | Detail                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| **Processing purpose**          | Collect and analyse survey responses from school stakeholders |
| **Categories of data subjects** | Staff, parents, potentially students                          |
| **Categories of personal data** | Survey responses, respondent metadata (if not anonymous)      |
| **Lawful basis**                | Article 6(1)(a) — consent; Article 6(1)(e) — public task      |
| **Recipients**                  | Supabase (EU)                                                 |
| **International transfers**     | None                                                          |
| **Retention**                   | [UNDOCUMENTED]                                                |
| **Technical measures**          | RLS; `is_anonymous` flag (UI-only, not DB-enforced)           |
| **DPIA required?**              | Yes, if student surveys with identifiable responses           |

### PA-017: Usage Analytics & Billing

| Field                           | Detail                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| **Processing purpose**          | Track feature usage, AI costs, and billing                              |
| **Categories of data subjects** | Platform users (staff)                                                  |
| **Categories of personal data** | User ID, event type, session ID, AI token usage                         |
| **Lawful basis**                | Article 6(1)(f) — legitimate interest (service improvement, billing)    |
| **Recipients**                  | Supabase (EU)                                                           |
| **International transfers**     | None                                                                    |
| **Retention**                   | [UNDOCUMENTED — stated as 12 months in privacy policy but not enforced] |
| **Technical measures**          | Anonymised session IDs                                                  |
| **DPIA required?**              | No                                                                      |

### PA-018: Payment Processing

| Field                           | Detail                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| **Processing purpose**          | Process subscription payments                                                         |
| **Categories of data subjects** | School administrators (billing contacts)                                              |
| **Categories of personal data** | Organisation name, payment method (via Stripe), bank details (planned via GoCardless) |
| **Lawful basis**                | Article 6(1)(b) — contract performance                                                |
| **Recipients**                  | Stripe (US — DPF), GoCardless (UK — planned)                                          |
| **International transfers**     | US (Stripe — Data Privacy Framework)                                                  |
| **Retention**                   | Per Stripe/GoCardless standard terms                                                  |
| **Technical measures**          | PCI DSS (Stripe-managed); TLS                                                         |
| **DPIA required?**              | No                                                                                    |

### PA-019: Ed Assistant / AI Chatbot

| Field                           | Detail                                                                           |
| ------------------------------- | -------------------------------------------------------------------------------- |
| **Processing purpose**          | AI-powered assistant for school improvement questions                            |
| **Categories of data subjects** | Platform users, website visitors (public embed)                                  |
| **Categories of personal data** | User questions, page context; website visitors: question text only               |
| **Lawful basis**                | Article 6(1)(b) — contract (users); Article 6(1)(a) — consent (website visitors) |
| **Recipients**                  | Google Gemini (US), OpenRouter (US)                                              |
| **International transfers**     | US                                                                               |
| **Retention**                   | Session-only for chat; knowledge patterns anonymised                             |
| **Technical measures**          | TLS 1.3; anonymised knowledge patterns                                           |
| **DPIA required?**              | No (if website embed adds consent banner)                                        |

### PA-020: Cloud Storage Scanning (Google Drive / OneDrive)

| Field                           | Detail                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| **Processing purpose**          | Scan school cloud storage for evidence documents                                   |
| **Categories of data subjects** | Document authors (staff), potentially any data subject referenced in documents     |
| **Categories of personal data** | File names, folder paths, full document text, file metadata                        |
| **Lawful basis**                | Article 6(1)(b) — contract; Article 6(1)(a) — consent (OAuth authorisation)        |
| **Recipients**                  | Google Drive API (US), Microsoft Graph API (US/EU), then AI providers for analysis |
| **International transfers**     | US (Google, Microsoft APIs)                                                        |
| **Retention**                   | Document metadata cached; text processed in real-time for AI analysis              |
| **Technical measures**          | OAuth token-based access; TLS; **no file-type filtering**                          |
| **DPIA required?**              | Covered under PA-004 (AI Document Analysis)                                        |

### PA-021: GDPR Data Subject Requests

| Field                           | Detail                                                                   |
| ------------------------------- | ------------------------------------------------------------------------ |
| **Processing purpose**          | Handle data export and deletion requests                                 |
| **Categories of data subjects** | Any data subject exercising rights                                       |
| **Categories of personal data** | All personal data held (for export); deletion reference and audit log    |
| **Lawful basis**                | Article 6(1)(c) — legal obligation (Articles 15, 17, 20)                 |
| **Recipients**                  | Supabase (EU)                                                            |
| **International transfers**     | None                                                                     |
| **Retention**                   | Deletion audit log retained for accountability                           |
| **Technical measures**          | Rate limiting (delete), service role access, admin-only for org deletion |
| **DPIA required?**              | No                                                                       |

---

## Summary Statistics

| Metric                                     | Count                                                      |
| ------------------------------------------ | ---------------------------------------------------------- |
| Total processing activities                | 21                                                         |
| Activities requiring DPIA                  | 7 (PA-004, PA-005, PA-006, PA-008, PA-010, PA-011, PA-012) |
| Activities with international transfers    | 9                                                          |
| Activities involving special category data | 5                                                          |
| Activities involving children's data       | 3 (PA-011, PA-012, PA-013)                                 |
| Activities with undocumented retention     | 11                                                         |

---

**Register maintained by:** DPO (dpo@schoolgle.co.uk)
**Next review date:** [REQUIRES HUMAN INPUT — recommend quarterly]
