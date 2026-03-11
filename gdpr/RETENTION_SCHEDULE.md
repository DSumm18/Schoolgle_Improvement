# Data Retention Schedule

**Organisation:** Schoolgle Ltd
**Date:** 8 March 2026
**Version:** 1.0

> This schedule defines the retention period for every category of personal data processed by Schoolgle. Where retention is not yet implemented in code, this is noted. All retention periods should be enforced technically (automated deletion) and documented in the privacy notice.

---

## Retention Principles

1. **Storage limitation (Article 5(1)(e)):** Personal data shall be kept no longer than necessary for the purpose for which it is processed
2. **Default retention:** Where no specific statutory requirement exists, data shall be retained for the minimum period necessary and reviewed annually
3. **Deletion method:** Hard deletion preferred; soft deletion (with 30-day grace period) where accidental deletion recovery is needed
4. **Backups:** Data in backups will be automatically purged within 90 days of the primary deletion
5. **Legal holds:** Retention periods may be extended if data is subject to legal proceedings, regulatory investigation, or data subject dispute

---

## Retention Schedule

### User & Account Data

| Data Category                      | Retention Period                                         | Justification                                | Deletion Method                                    | Implemented?                  | Owner       |
| ---------------------------------- | -------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- | ----------------------------- | ----------- |
| User account (email, name, avatar) | Until account deletion + 30 days                         | Contract performance; 30-day recovery window | Hard delete via `/api/gdpr/delete`                 | YES                           | Engineering |
| Organisation record                | Until org deletion + 30 days                             | Contract performance                         | Hard delete via `/api/gdpr/delete` (DELETE method) | YES                           | Engineering |
| Organisation membership            | Until removal or account deletion                        | Access control                               | Hard delete                                        | YES                           | Engineering |
| Invitation records                 | 90 days after acceptance or expiry                       | No longer needed                             | Hard delete                                        | **NO — needs implementation** | Engineering |
| Firebase authentication tokens     | Per Firebase default (1 hour access, long-lived refresh) | Authentication                               | Managed by Firebase                                | YES (external)                | Firebase    |
| Supabase session tokens            | Until logout or expiry                                   | Authentication                               | Auto-expired by Supabase                           | YES (external)                | Supabase    |

### School Improvement Data

| Data Category                 | Retention Period                  | Justification               | Deletion Method                                 | Implemented? | Owner       |
| ----------------------------- | --------------------------------- | --------------------------- | ----------------------------------------------- | ------------ | ----------- |
| Ofsted/SIAMS assessments      | Until deleted by school + 30 days | School improvement tracking | Hard delete (GDPR endpoint anonymises assessor) | YES          | Engineering |
| Actions/tasks                 | Until deleted by school + 30 days | School improvement planning | Hard delete (GDPR endpoint removes assignee)    | YES          | Engineering |
| Evidence documents            | Until deleted by school + 30 days | Inspection preparation      | Hard delete                                     | YES          | Engineering |
| Evidence matches (AI results) | Until deleted by school + 30 days | Evidence mapping            | Hard delete                                     | YES          | Engineering |
| Lesson observations           | Until deleted by school + 30 days | Teaching quality monitoring | Hard delete (GDPR endpoint)                     | YES          | Engineering |
| SDP priorities & milestones   | Until deleted by school           | Strategic planning          | Hard delete                                     | YES          | Engineering |

### Compliance Module Data

| Data Category                  | Retention Period                                        | Justification                                                | Deletion Method                     | Implemented?                 | Owner       |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------- | ---------------------------- | ----------- |
| **SCR/DBS records**            | Duration of employment + 6 years                        | KCSIE guidance; limitation period for claims                 | Automated purge                     | **NO — stored indefinitely** | Engineering |
| **Low-level concerns**         | 7 years from date of concern or resolution              | Safeguarding guidance (KCSIE Part 4); pattern identification | Automated purge                     | **NO — stored indefinitely** | Engineering |
| **Children's consent records** | Until child leaves school OR consent withdrawn + 1 year | Purpose fulfilment; grace period for disputes                | Automated purge triggered by school | **NO — stored indefinitely** | Engineering |
| **Complaints**                 | 6 years from resolution                                 | DfE complaints guidance; limitation period                   | Automated purge                     | **NO — stored indefinitely** | Engineering |
| **FOI requests**               | 3 years from response                                   | ICO guidance on FOI record keeping                           | Automated purge                     | **NO — stored indefinitely** | Engineering |
| **DSAR records**               | 3 years from completion                                 | ICO accountability requirement                               | Automated purge                     | **NO — stored indefinitely** | Engineering |
| **DPIA records**               | Duration of processing + 3 years                        | Article 35 accountability                                    | Manual review                       | **NO — stored indefinitely** | DPO         |
| **Data breach records**        | 5 years from notification                               | ICO accountability; limitation period                        | Automated purge                     | **NO — stored indefinitely** | Engineering |
| **Policy documents**           | Until superseded + 3 years                              | Audit trail of policy versions                               | Archive then purge                  | **NO — stored indefinitely** | Engineering |
| **Training completions**       | Duration of employment + 6 years                        | H&S and safeguarding compliance evidence                     | Automated purge                     | **NO — stored indefinitely** | Engineering |
| **Compliance audit log**       | 7 years                                                 | Regulatory accountability                                    | Automated purge                     | **NO — stored indefinitely** | Engineering |

### Staff Data

| Data Category           | Retention Period                 | Justification                                 | Deletion Method                                         | Implemented?                   | Owner       |
| ----------------------- | -------------------------------- | --------------------------------------------- | ------------------------------------------------------- | ------------------------------ | ----------- |
| Staff directory records | Duration of employment + 30 days | Operational need                              | Soft delete (deleted_at) then hard delete after 30 days | **PARTIAL — soft delete only** | Engineering |
| Staff absences          | Duration of employment + 6 years | Employment law; Equality Act claims (6 years) | Automated purge                                         | **NO — stored indefinitely**   | Engineering |
| Staff qualifications    | Duration of employment + 6 years | Professional verification                     | Automated purge                                         | **NO — stored indefinitely**   | Engineering |

### Governance Data

| Data Category      | Retention Period          | Justification                                | Deletion Method | Implemented?                 | Owner       |
| ------------------ | ------------------------- | -------------------------------------------- | --------------- | ---------------------------- | ----------- |
| Governor directory | Term of office + 6 years  | Governance accountability                    | Automated purge | **NO — stored indefinitely** | Engineering |
| Meeting records    | 6 years from meeting date | Governance accountability; limitation period | Automated purge | **NO — stored indefinitely** | Engineering |
| Governor training  | Term of office + 6 years  | Safeguarding compliance evidence             | Automated purge | **NO — stored indefinitely** | Engineering |
| Monitoring visits  | 6 years from visit date   | Governance accountability                    | Automated purge | **NO — stored indefinitely** | Engineering |

### Estates & Facilities Data

| Data Category          | Retention Period               | Justification                     | Deletion Method | Implemented?                 | Owner       |
| ---------------------- | ------------------------------ | --------------------------------- | --------------- | ---------------------------- | ----------- |
| Asset register         | Until asset disposed + 3 years | Insurance claims; audit trail     | Manual review   | **NO — stored indefinitely** | Engineering |
| Room assessment photos | 3 years from assessment        | H&S evidence                      | Automated purge | **NO — stored indefinitely** | Engineering |
| Contractor records     | Duration of contract + 6 years | Contractual claims                | Automated purge | **NO — stored indefinitely** | Engineering |
| Helpdesk tickets       | 3 years from resolution        | Maintenance audit trail           | Automated purge | **NO — stored indefinitely** | Engineering |
| Incident logs          | 7 years from incident          | H&S legislation; RIDDOR reporting | Automated purge | **NO — stored indefinitely** | Engineering |

### Audio & Voice Data

| Data Category                | Retention Period                  | Justification                                                          | Deletion Method | Implemented?                 | Owner       |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------- | --------------- | ---------------------------- | ----------- |
| Observation audio recordings | 30 days after transcription       | Transcription is the deliverable; audio unnecessary after verification | Automated purge | **NO — stored indefinitely** | Engineering |
| Meeting audio recordings     | 30 days after transcription       | Transcription is the deliverable                                       | Automated purge | **NO — stored indefinitely** | Engineering |
| Transcription text           | Until deleted by school + 30 days | Meeting/observation records                                            | Hard delete     | **NO — stored indefinitely** | Engineering |

### Analytics & Operational Data

| Data Category                | Retention Period                                   | Justification                                 | Deletion Method        | Implemented?                     | Owner       |
| ---------------------------- | -------------------------------------------------- | --------------------------------------------- | ---------------------- | -------------------------------- | ----------- |
| Activity/usage logs          | 12 months                                          | Service improvement; stated in privacy policy | Automated purge        | **NO — stated but not enforced** | Engineering |
| Usage events                 | 12 months                                          | Billing verification; service improvement     | Automated purge        | **NO — stored indefinitely**     | Engineering |
| Daily usage summaries        | 24 months                                          | Trend analysis (aggregated)                   | Automated purge        | **NO — stored indefinitely**     | Engineering |
| AI processing (at provider)  | Real-time (not stored by Schoolgle)                | N/A                                           | Managed by provider    | YES (external)                   | Provider    |
| AI processing (OpenAI audio) | [REQUIRES HUMAN INPUT — OpenAI may retain 90 days] | Provider abuse monitoring                     | N/A (provider-managed) | N/A                              | Provider    |

### Survey Data

| Data Category                   | Retention Period          | Justification                    | Deletion Method | Implemented?                 | Owner       |
| ------------------------------- | ------------------------- | -------------------------------- | --------------- | ---------------------------- | ----------- |
| Survey templates                | Until deleted by school   | Re-use                           | Hard delete     | YES                          | Engineering |
| Survey responses (anonymous)    | 3 years from survey close | Analysis and benchmarking        | Automated purge | **NO — stored indefinitely** | Engineering |
| Survey responses (identifiable) | 1 year from survey close  | Purpose fulfilled after analysis | Automated purge | **NO — stored indefinitely** | Engineering |

### Payment Data

| Data Category        | Retention Period                   | Justification                  | Deletion Method              | Implemented?   | Owner   |
| -------------------- | ---------------------------------- | ------------------------------ | ---------------------------- | -------------- | ------- |
| Subscription records | Duration of subscription + 7 years | HMRC requirements; tax records | Managed by Stripe/GoCardless | YES (external) | Finance |
| Payment invoices     | 7 years from transaction           | HMRC requirements              | Managed by provider          | YES (external) | Finance |

### GDPR Operational Data

| Data Category                      | Retention Period                     | Justification                                        | Deletion Method                            | Implemented?                           | Owner       |
| ---------------------------------- | ------------------------------------ | ---------------------------------------------------- | ------------------------------------------ | -------------------------------------- | ----------- |
| GDPR deletion audit log            | 7 years from deletion                | Article 5(2) accountability; prove deletion occurred | Manual review (should not be auto-deleted) | YES (stored in activity_log)           | DPO         |
| GDPR export audit log              | 3 years from export                  | Accountability                                       | Automated purge                            | **NO — stored indefinitely**           | Engineering |
| Consent records (platform cookies) | Until consent withdrawn or 12 months | PECR compliance                                      | Automated expiry                           | **NO — no cookie consent implemented** | Engineering |

### Backup Data

| Data Category               | Retention Period | Justification     | Deletion Method                     | Implemented?   | Owner    |
| --------------------------- | ---------------- | ----------------- | ----------------------------------- | -------------- | -------- |
| Database backups            | 90 days          | Disaster recovery | Automated expiry (Supabase-managed) | YES (external) | Supabase |
| Point-in-time recovery logs | 90 days          | Disaster recovery | Automated expiry                    | YES (external) | Supabase |

---

## Implementation Status Summary

| Status                                | Count  | Percentage |
| ------------------------------------- | ------ | ---------- |
| Implemented (automated deletion)      | 8      | 18%        |
| Externally managed (provider handles) | 6      | 14%        |
| Partial (soft delete only)            | 1      | 2%         |
| **NOT IMPLEMENTED**                   | **29** | **66%**    |

**Key finding:** 66% of data categories have no automated retention enforcement. This is a significant compliance gap.

---

## Recommended Implementation Priority

### Phase 1 (Immediate — before pilot)

1. Audio recordings (30-day auto-purge after transcription)
2. Children's consent records (school-triggered deletion)
3. Activity/usage logs (12-month purge — already stated in privacy policy)

### Phase 2 (30 days)

4. SCR/DBS records (employment + 6 years)
5. Low-level concerns (7-year retention)
6. Staff absences (employment + 6 years)
7. Complaints (6 years from resolution)

### Phase 3 (60 days)

8. Governance records (term + 6 years)
9. Estates records (appropriate periods per table)
10. Survey responses (1-3 years)
11. Invitation records (90-day expiry)

### Phase 4 (90 days)

12. Remaining compliance module tables
13. Aggregated analytics (24-month retention)
14. Cookie consent records (implement system first)

---

## Technical Implementation Notes

### Recommended Approach

1. **Supabase scheduled function** (pg_cron) to run nightly retention checks
2. **Retention policy table** (`compliance_retention_policies` already exists but is empty) — populate with periods from this schedule
3. **Soft delete first, hard delete after grace period** — prevents accidental data loss
4. **Audit trail** — log all automated deletions to `activity_log` before executing
5. **Exemptions** — implement legal hold flag to prevent deletion during disputes/investigations

### Example Implementation

```sql
-- Nightly retention enforcement (pseudocode)
SELECT * FROM compliance_low_level_concerns
WHERE created_at < NOW() - INTERVAL '7 years'
AND legal_hold = false;

-- Log before delete
INSERT INTO activity_log (event_type, event_data)
VALUES ('retention_purge', jsonb_build_object(
  'table', 'compliance_low_level_concerns',
  'count', <count>,
  'oldest_record', <date>
));

-- Execute deletion
DELETE FROM compliance_low_level_concerns
WHERE created_at < NOW() - INTERVAL '7 years'
AND legal_hold = false;
```

---

**Schedule maintained by:** DPO (dpo@schoolgle.co.uk)
**Next review:** [REQUIRES HUMAN INPUT — recommend annually or when processing changes]
