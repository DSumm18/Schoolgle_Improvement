# Schoolgle Security Overview

## For School IT Teams, DPOs, and Governors

## Status

This is a draft technical security overview. It must be read alongside the current GDPR/security audit findings before being used for customer assurance. Do not use this document to make a final legal claim that Schoolgle is “UK GDPR compliant” without dated technical evidence and DPO/legal sign-off.

## Executive Summary

Schoolgle is designed as a multi-tenant school technology platform with organisation-scoped access controls, encrypted hosting, and AI-assisted workflows. Because the platform includes modules for documents, HR, safeguarding-adjacent workflows, SEND, incidents, compliance, governance and school operations, schools may process sensitive staff, pupil, parent, safeguarding, SEND, HR, financial, document and incident data depending on enabled modules and usage.

Customer-facing assurance must therefore be evidence-backed and dated. Each assurance pack should include live database/RLS checks, storage bucket checks, API authorization checks, secrets scan output, dependency scan output, AI-provider/subprocessor review, retention review, and DPO/legal validation where required.

## Current Assurance Position

| Area | Status | Notes |
| --- | --- | --- |
| Encryption in transit/at rest | PASS / PROVIDER-EVIDENCED | Depends on Vercel, Supabase and connected providers. Evidence should be archived from current provider docs/contracts. |
| Multi-tenant isolation | NEEDS PERIODIC EVIDENCE | Code uses organisation scoping and Supabase RLS patterns, but live RLS/policy/storage checks must be run before assurance. |
| Pupil data claim | GAP IN PREVIOUS DOCS | The platform should minimise pupil data, but some modules can process pupil/parent/safeguarding/SEND/incident data if used. |
| UK GDPR / DPA 2018 compliance | NEEDS DPO/LEGAL REVIEW | Do not claim legal compliance without DPIA, DPA, subprocessor and transfer evidence. |
| AI/provider data flows | NEEDS REVIEW | Approved provider/model policy, PII minimisation, retention/training settings and international transfer position must be evidenced. |
| Secrets management | GAP BEING REMEDIATED | Previously exposed keys must be rotated. No secrets should be stored in tracked code/docs/config. |

## Data Classification

| Classification | Examples | Expected Controls |
| --- | --- | --- |
| Public | Marketing copy, generic framework information | No customer data. |
| Internal | Templates, product configuration, non-sensitive metadata | Authenticated access and change control. |
| Confidential | Staff names/emails, school documents, governance records, operational notes | Organisation isolation, role-based access, audit trail, retention rules. |
| Restricted | Safeguarding, SEND, pupil/parent data, medical details, HR casework, incident records, DBS/SCR data | Strict role access, minimisation, audit logging, retention policy, DPO review and DPIA where applicable. |

## Architecture Controls

- Authentication is handled through the platform auth layer and organisation membership checks.
- API routes should derive `organization_id` from the authenticated session, not from caller-controlled input.
- Supabase RLS should be enabled for tenant data tables unless access is deliberately service-route-only and documented.
- Server-side service-role use should be limited, reviewed and never exposed to clients.
- Storage buckets must be reviewed for public/private status and file access policies.
- Documents and generated outputs should inherit organisation branding and organisation scoping.

## AI and Provider Controls

- Only approved provider families should process customer/school data unless a DPA, transfer and GDPR review has been completed.
- AI prompts should use the minimum data needed for the task.
- PII masking should be used where feasible before sending data to AI providers.
- Voice recordings and meeting recordings should have clear retention/deletion rules.
- Provider training, retention, region and subprocessor terms must be evidenced.

## Incident and Breach Response

Schoolgle should maintain an incident response process covering:

- Detection and triage.
- Customer notification.
- ICO notification support where applicable.
- Containment and remediation.
- Evidence preservation.
- Post-incident review.
- DPO/legal sign-off.

## School Responsibilities

Schools should:

1. Keep user access reviewed and remove leavers promptly.
2. Use SSO/MFA where available.
3. Minimise personal data uploaded to the platform.
4. Only use sensitive-data workflows where local policy, lawful basis and retention rules are understood.
5. Report suspected incidents promptly.

## Assurance Pack Requirements

Before customer-facing security assurance is issued, archive:

- Date/time and environment audited.
- Supabase RLS/policy/grants/storage/function security outputs.
- API authorization coverage notes.
- Secrets scan output.
- Dependency audit output.
- AI provider/subprocessor review.
- DPIA/DPA/legal review status.
- Risk register and remediation tracker.

## Document Control

| Version | Date | Owner | Changes |
| --- | --- | --- | --- |
| 1.1 | 2026-04-28 | Product/Security | Replaced over-confident compliance/no-pupil-data claims with evidence-backed assurance wording. |

