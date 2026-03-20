# School Onboarding Model

**Date:** 2026-03-19
**Purpose:** How a new school is set up, what data is expected, and how partial data is handled

---

## Overview

Schoolgle uses a structured onboarding model where each school or trust gets:

1. A dedicated organisational tenant (multi-tenancy via `organization_id`)
2. DfE-enriched school metadata (auto-populated from GIAS)
3. Initial data population via CSV imports and manual entry
4. Progressive data enrichment as the school uses the platform

---

## Onboarding Flow (Current Implementation)

### Step 1: Account Creation

- User signs up via Firebase Auth (Google or Microsoft OAuth)
- Account created in Supabase `users` table

### Step 2: School Selection

- User searches by school name, town, or URN
- Search hits DfE GIAS API via `/api/school/search`
- Option to skip school selection (for trusts or non-school orgs)

### Step 3: Organisation Creation

- `/api/onboarding/complete` creates or reuses organisation by URN
- Auto-enriches with DfE data: name, address, phone, email, website, LA, phase, type
- Detects church schools and enables SIAMS features
- First user gets `admin` role in `organization_members`

### Step 4: Dashboard Access

- User lands on `/dashboard` with empty-state modules
- Can begin manual data entry or CSV imports

**Current status: WORKING** — Clean 3-step onboarding. DfE enrichment functional.

---

## Expected Source Data by Module

### Immediate Setup (Week 1)

| Data               | Source            | Import Method                             | Format                                  | Required?   |
| ------------------ | ----------------- | ----------------------------------------- | --------------------------------------- | ----------- |
| Staff list         | School/HR records | CSV upload or manual                      | CSV with name, role, email, employee_id | Recommended |
| Organisation users | Admin list        | CSV upload via `/api/organization/import` | CSV with email, displayName, role       | Recommended |
| Class assignments  | School timetable  | Manual via Settings → Class Assignments   | UI form                                 | Optional    |

### Progressive Setup (Weeks 2-4)

| Data                | Source                 | Import Method                | Format  | Required?             |
| ------------------- | ---------------------- | ---------------------------- | ------- | --------------------- |
| Governors           | School records         | Manual entry                 | UI form | For Governance module |
| Risk register       | Existing risk register | Manual entry                 | UI form | For Risk module       |
| Compliance policies | Existing policies      | Manual + 36 seeded templates | UI      | For Compliance module |
| Estates assets      | Asset register         | Manual entry                 | UI form | For Estates module    |
| Term dates          | School calendar        | Manual entry                 | UI form | For Calendar module   |

### Advanced Setup (Month 2+)

| Data              | Source                 | Import Method                      | Format            | Required?          |
| ----------------- | ---------------------- | ---------------------------------- | ----------------- | ------------------ |
| Budget data       | FMS/LA system          | CSV/XLSX via `/api/finance/import` | FMS export format | For Finance module |
| Pupil assessments | MIS export             | CSV via Intelligence module        | Pseudonymised CSV | For Intelligence   |
| DfE warehouse     | GIAS/Explore Education | Pre-populated                      | Automatic         | Background         |

---

## CSV Template Standards

### Staff Import Template

```csv
# Schoolgle Staff Import Template
# Required: first_name, last_name, job_title
# salutation,first_name,last_name,email,phone,employee_id,job_title,role_category,is_super_user,is_active,action
Mrs,Jane,Smith,jane.smith@school.sch.uk,07700900001,EMP001,Headteacher,headteacher,yes,yes,
Mr,John,Brown,john.brown@school.sch.uk,,EMP002,Year 6 Teacher,teacher,no,yes,
```

### Organisation Import Template

```csv
email,displayName,role
admin@school.sch.uk,School Admin,admin
teacher1@school.sch.uk,Jane Teacher,teacher
```

---

## Validation Rules

### Staff Import

- `first_name`, `last_name`, `job_title` — required
- `email` — optional but used for dedup
- `employee_id` — optional but used for dedup
- `role_category` — fuzzy matched to 13 categories (e.g., "head" → "headteacher")
- `salutation` — strict match: Mr, Mrs, Ms, Dr, Prof, Miss
- Duplicate detection by email OR employee_id

### Organisation Import

- `email` — required, regex validated, lowercased
- `role` — required, must be: admin, teacher, or slt
- Duplicate detection against existing members and pending invitations

### Finance Import

- Checksum dedup prevents duplicate transaction imports
- Dry-run mode available for validation before commit
- CFR code mapping for DfE-standard budget lines
- Balance reconciliation checks

---

## How Partial Data Is Handled

| Scenario             | Behaviour                                                                |
| -------------------- | ------------------------------------------------------------------------ |
| No staff imported    | Staff Directory shows empty state with "Add staff" CTA                   |
| No governors entered | Governance portal auto-creates empty board record, shows "Add governors" |
| No risks created     | Risk Register shows empty heatmap with "Add Risk" CTA                    |
| No compliance items  | Compliance Hub shows 36 templates ready to use                           |
| No budget uploaded   | Finance hub shows demo data WITH prominent "DEMO DATA" banner            |
| No attendance data   | Attendance shows demo data with `is_demo` flag (needs UI banner)         |
| No SEND data         | SEND shows 15 demo pupils with `demo` flag (needs UI banner)             |
| No behaviour data    | Behaviour shows demo incidents with `demo` flag (needs UI banner)        |
| No calendar events   | Calendar shows empty state                                               |

**Design principle:** Every module should either show an honest empty state with a clear CTA, or show demo data with an unmissable "DEMO DATA" indicator. Never show demo data as if it were real.

---

## Historic Data Expectations

For a mature pilot, schools may provide:

| Data                | Ideal History             | Minimum            |
| ------------------- | ------------------------- | ------------------ |
| Staff records       | Current academic year     | Current staff only |
| Budget/transactions | 3 years                   | Current year       |
| Attendance          | 3 years                   | Current term       |
| Pupil assessments   | 3 years                   | Last KS2 cohort    |
| DfE warehouse       | Auto-populated (5+ years) | N/A (background)   |

Historic data enables trend analysis in the Intelligence Engine but is not required for core operations.

---

## Onboarding Gaps

1. **No guided setup wizard** — After onboarding, user lands on dashboard with no structured "complete your setup" flow
2. **No standard school template** — Cannot say "set up a 2FE primary" and auto-populate 14 classes, 30 staff, etc.
3. **No MIS live connector** — Canvas can ingest snapshots but no streaming sync from Arbor/SIMS/Bromcom
4. **No pupil CSV import** — Attendance, SEND, and Behaviour have no bulk import for pupil records
5. **No import status dashboard** — No "what have I imported, when, from where" overview

## Recommendations

1. **Build guided setup checklist** (post-onboarding) showing completion % per module
2. **Build pupil CSV import** — single import populates pupils across Attendance, SEND, Behaviour
3. **Add import audit log** visible to admins showing what was imported and when
4. **Create pre-built school templates** for common structures (1FE primary, 2FE primary, secondary, special)
