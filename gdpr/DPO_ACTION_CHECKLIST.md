# DPO Action Checklist — Schoolgle Ltd

**DPO:** David (dpo@schoolgle.co.uk)
**Date:** 9 March 2026

This is your personal to-do list. Everything technical has been implemented. These are the human/legal actions that only you can complete.

---

## 1. ICO Registration (Do First)

- [x] **Pay ICO data protection fee** — £40/year for micro organisations ✅ **ZC103199 (11 Mar 2026)**
  - Go to: https://ico.org.uk/for-organisations/data-protection-fee/
  - Select: "Data controller" → answer the questions about Schoolgle
  - Pay online (card or direct debit)
  - You'll get a registration number (e.g., ZA123456) — add it to the privacy policy footer

- [ ] **Register your DPO with the ICO**
  - After paying the fee, log into your ICO account
  - Add DPO details: your name, dpo@schoolgle.co.uk
  - This is a legal requirement under Article 37(7)

---

## 2. DPAs to Sign (Priority Order)

These are the Data Processing Agreements you need with each sub-processor. Most are online forms or PDF signatures.

### Critical (sign before schools go live)

| Provider       | Where to find DPA             | What to do                                                                                                                                             |
| -------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **OpenRouter** | Email support@openrouter.ai   | Request their DPA. If they don't have one, ask for their standard T&Cs with data processing clauses. Attach a UK IDTA addendum.                        |
| **Deepgram**   | https://deepgram.com/dpa      | Sign their standard DPA online. Request UK IDTA addendum.                                                                                              |
| **Fish Audio** | Unknown — email their support | Try to verify their legal entity and location. If unverifiable, **switch to Azure TTS only** (already integrated, UK-hosted, Microsoft DPA covers it). |

### Important (sign within 30 days)

| Provider                  | Where to find DPA                                       | What to do                                                                                                                                           |
| ------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Cloud (Gemini)** | https://cloud.google.com/terms/data-processing-addendum | Accept their DPA in the Google Cloud Console. This covers Firebase + Gemini. Includes SCCs automatically.                                            |
| **OpenAI**                | https://openai.com/policies/dpa                         | Sign online. Includes SCCs. Note: they may retain audio for 90 days for abuse monitoring — acceptable but disclose in privacy policy (already done). |
| **Anthropic**             | Email privacy@anthropic.com                             | Request DPA. They have a standard one. Attach UK IDTA.                                                                                               |
| **Vercel**                | https://vercel.com/legal/dpa                            | Accept in Vercel dashboard under Settings → Legal.                                                                                                   |

### Already Covered (verify only)

| Provider            | Action                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| **Supabase**        | Check your Supabase dashboard → Settings → Legal. Their T&Cs include a DPA. Verify it's accepted. |
| **Stripe**          | Included in standard Stripe T&Cs. DPF participant. No action needed.                              |
| **Microsoft Azure** | Covered by Microsoft Online Services DPA. Verify in Azure portal.                                 |

---

## 3. UK IDTA / SCCs

For every US-based provider, you need either:

- A **UK International Data Transfer Addendum (IDTA)** — ICO template at https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/international-data-transfer-agreement-and-guidance/
- Or **Standard Contractual Clauses (SCCs)** with a UK addendum

Most large providers (Google, OpenAI, Stripe) include SCCs in their standard DPA. For smaller ones (OpenRouter, Deepgram), you may need to attach the ICO's IDTA template yourself.

**Download the IDTA template:** https://ico.org.uk/media/for-organisations/documents/4019539/international-data-transfer-addendum.docx

---

## 4. DPIA Sign-Off

Six DPIAs have been pre-populated in `/gdpr/DPIA_TEMPLATE.md`. As DPO you need to:

- [ ] Review each DPIA
- [ ] Sign off (add your name, date, and "Approved" or "Approved with conditions")
- [ ] Store signed copies (the markdown file is fine, or print to PDF)

The six DPIAs:

1. AI Document Analysis (CRITICAL)
2. Children's Consent Records (CRITICAL)
3. Safeguarding Low-Level Concerns (CRITICAL)
4. Voice Transcription (HIGH)
5. SCR/DBS Records (HIGH)
6. Staff Absence Data (HIGH)

---

## 5. Fish Audio Decision

Fish Audio's legal entity and data location are unverified. You have two options:

- **Option A:** Email Fish Audio, ask for their registered company name, data processing location, and DPA. If satisfactory, sign DPA and keep using them.
- **Option B (recommended):** Remove Fish Audio entirely and use Azure TTS (already integrated, UK-hosted, Microsoft DPA covers it). This removes the unknown from your sub-processor list.

To implement Option B, just remove the `FISH_AUDIO_API_KEY` from your environment variables — the code already requires it to be set and will return a 500 if missing, effectively disabling Fish Audio.

---

## 6. Annual Review Calendar

Set these reminders:

| When        | What                                                           |
| ----------- | -------------------------------------------------------------- |
| Every March | Review all DPAs are still valid, sub-processor list is current |
| Every March | Renew ICO data protection fee                                  |
| Every March | Review and update privacy policy                               |
| Every March | Review retention schedule compliance                           |
| Quarterly   | Check sub-processor list for changes                           |
| On change   | Notify schools 30 days before any sub-processor change         |

---

## 7. What's Already Done (Technical)

These are implemented in code — no action needed from you:

- [x] PII masking before all AI calls (`pii-masker.ts`)
- [x] DeepSeek and Qwen/Alibaba removed from model config
- [x] Gemini Flash as primary model (cost-effective, Google DPA)
- [x] All API routes authenticated (no more `'demo'` fallbacks)
- [x] GDPR delete endpoint covers all tables including compliance module
- [x] GDPR export endpoint authenticated and rate-limited
- [x] Email hash uses SHA-256 (not reversible base64)
- [x] Privacy Policy page live at `/privacy`
- [x] Cookie Policy page live at `/cookies`
- [x] Cookie consent banner (PECR compliant) on all marketing pages
- [x] Footer links to privacy policy, cookie policy, DPO email
- [x] Hardcoded API keys removed from source code
- [x] 7 GDPR documents in `/gdpr/` folder

---

## Summary: What a DPO External Check Will Look For

A DPO or ICO auditor will typically check:

| Check                                 | Status                                                 |
| ------------------------------------- | ------------------------------------------------------ |
| ICO registration and fee paid         | ✅ **ZC103199** (11 Mar 2026)                            |
| DPO appointed and registered          | **YOU NEED TO DO THIS**                                |
| Privacy policy publicly accessible    | ✅ `/privacy`                                          |
| Cookie consent mechanism              | ✅ Banner with essential/analytics choice              |
| Article 30 ROPA (processing register) | ✅ `/gdpr/DATA_PROCESSING_REGISTER.md`                 |
| Sub-processor list with DPAs          | ✅ List done, **DPAs need signing**                    |
| International transfer safeguards     | ✅ Documented, **IDTAs need signing**                  |
| DPIAs for high-risk processing        | ✅ Written, **need your sign-off**                     |
| Data subject rights mechanism         | ✅ Export + delete endpoints working                   |
| Retention schedule                    | ✅ Documented (automated enforcement planned)          |
| Security measures                     | ✅ Auth on all routes, PII masking, encryption at rest |

**Bottom line:** The technical and documentation work is done. ICO registration is complete (ZC103199). You need to sign ~6 DPAs online and sign off the DPIAs. That's a couple of hours of work.
