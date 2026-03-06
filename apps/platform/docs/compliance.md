# Compliance Module

The Compliance module provides statutory policy management, training compliance tracking, GDPR toolkit, and document builder for UK schools.

## Features

### 1. Compliance Dashboard (`/dashboard/compliance`)

- Health scores for policies, training, and GDPR
- Overdue reviews and expiring training alerts
- Recent activity feed from audit log
- Quick actions to create policies, incidents, DPIAs, training records

### 2. Policies (`/dashboard/compliance/policies`)

- Policy catalogue with filter by category: Statutory, Recommended, Trust Required, School Custom
- Create policies from maintained templates with placeholder variables
- HTML content editor with preview
- Version history with change summaries
- Approval workflow: Author > SLT Review > Trust Review > Governor Approval
- Review schedule with configurable frequency (annual/termly/quarterly)
- Staff read & acknowledge tracking

### 3. Document Builder (`/dashboard/compliance/docs`)

- Template picker for incident reports, records of concern, complaint summaries, etc.
- Form-based creation from template JSON schema
- Documents stored as compliance items with versioning

### 4. Training Checker (`/dashboard/compliance/training`)

- Pre-seeded course library (safeguarding, first aid, fire safety, GDPR, etc.)
- Compliance rate tracking per course
- Expiry tracking with countdown
- Record completions with certificate upload
- Provider-agnostic (no API dependency)

### 5. GDPR Toolkit (`/dashboard/compliance/gdpr`)

- **DPIA Builder**: Multi-step wizard following ICO guidance (describe processing, assess necessity, identify risks, mitigations, sign-off)
- **SAR Tracker**: Log requests, verify identity, track deadlines (auto-calculated 30 days), record responses
- **Breach Log**: Record breaches with severity, ICO notification status, root cause, preventive measures

### 6. Compliance Tasks (`/dashboard/compliance/tasks`)

- Task management linked to compliance items
- Status tracking (pending, in_progress, completed)
- Due date and assignment tracking

### 7. Single Central Record (`/dashboard/compliance/scr`)

- Digital SCR with all pre-employment check columns
- DBS, identity, qualifications, right to work, prohibition, Section 128, overseas, references, medical fitness
- Green/red check indicators per field
- Staff search and filter
- Export capability

### 8. Complaints Tracker (`/dashboard/compliance/complaints`)

- 3-stage complaints procedure (DfE compliant)
- Stage 1: Informal → Stage 2: Headteacher → Stage 3: Governor Panel
- Auto-generated reference numbers (COMP-YYYY-NNN)
- Stage progression tracking with dates and outcomes
- Resolution and lessons learned recording

### 9. Low-Level Concerns Log (`/dashboard/compliance/concerns`)

- KCSIE Part 4 Section 2 compliant
- DSL-only access (confidential)
- Pattern detection when same person appears multiple times
- LADO escalation tracking
- DSL review workflow

### 10. Consent Manager (`/dashboard/compliance/consent`)

- Photo, trip, medical, biometric, research, marketing consent types
- Per-pupil consent tracking with parent details
- Academic year filtering
- Consent withdrawal recording
- Consent rate reporting

### 11. FOI Tracker (`/dashboard/compliance/foi`)

- FOIA 2000 compliant request tracking
- Auto-calculated 20 working day deadline
- Deadline countdown with amber/red alerts
- Exemption recording (Part II FOIA)
- Response tracking

### 12. DPO Service (`/dashboard/compliance/dpo`)

- Outsourced DPO via Vrisk partnership
- Three tiers: Standard (£1,200/yr), Enhanced (£2,400/yr), Premium (£4,800/yr)
- Consultant details, SLA, contract management
- ICO registration tracking
- Revenue model: Schoolgle 15% / Vrisk consultant 85%

## Architecture

### Database

Tables are in migration `20260305_compliance_module.sql`:

- `compliance_items` - parent record for all documents/policies/incidents
- `compliance_versions` - version history with content hash
- `compliance_approvals` - multi-stage approval workflow
- `compliance_review_schedule` - review dates and reminder configuration
- `compliance_tasks` - action items linked to compliance records
- `compliance_evidence_files` - uploaded certificates and evidence
- `compliance_audit_log` - immutable audit trail (insert-only)
- `compliance_templates` - maintained template library
- `compliance_acknowledgements` - staff read-and-acknowledge records
- `compliance_training_courses` - course catalogue
- `compliance_training_requirements` - role-based requirements
- `compliance_training_completions` - completion records with expiry
- `compliance_dpia_records` - DPIA detail records
- `compliance_sar_records` - SAR detail records
- `compliance_breach_records` - breach detail records
- `compliance_risk_links` - cross-references to risk register
- `compliance_chat_sessions` - Ed document capture sessions
- `compliance_notifications` - in-app reminders
- `compliance_dpo_service` - DPO outsource service records (Vrisk)
- `compliance_consent_records` - parental/pupil consent tracking
- `compliance_scr_entries` - Single Central Record
- `compliance_low_level_concerns` - KCSIE low-level concerns log
- `compliance_complaints` - 3-stage complaints tracker
- `compliance_foi_requests` - FOI request management

### API Routes (`/api/compliance/`)

| Route                      | Methods          | Purpose                                  |
| -------------------------- | ---------------- | ---------------------------------------- |
| `/items`                   | GET, POST        | List/create compliance items             |
| `/items/[id]`              | GET, PUT, DELETE | Single item CRUD (DELETE = archive)      |
| `/items/[id]/versions`     | GET, POST        | Version management                       |
| `/items/[id]/approve`      | GET, POST        | Approval workflow                        |
| `/items/[id]/acknowledge`  | GET, POST        | Staff acknowledgements                   |
| `/dashboard`               | GET              | Dashboard statistics                     |
| `/templates`               | GET              | Template library                         |
| `/training`                | GET, POST        | Training completions                     |
| `/training/courses`        | GET, POST        | Course management                        |
| `/training/requirements`   | GET, POST        | Role requirements                        |
| `/gdpr/dpia`               | GET, POST        | DPIA management                          |
| `/gdpr/sar`                | GET, POST        | SAR management                           |
| `/gdpr/breach`             | GET, POST        | Breach management                        |
| `/audit`                   | GET              | Audit log (paginated)                    |
| `/tasks`                   | GET, POST, PUT   | Task management                          |
| `/reminders`               | POST             | Generate reminders (manual/cron trigger) |
| `/scr`                     | GET, POST        | Single Central Record entries            |
| `/scr/[id]`                | GET, PUT, DELETE | SCR entry CRUD (DELETE = set leaver)     |
| `/complaints`              | GET, POST        | Complaints tracker                       |
| `/complaints/[id]`         | GET, PUT         | Complaint updates & stage progression    |
| `/foi`                     | GET, POST        | FOI request tracker                      |
| `/consent`                 | GET, POST, PUT   | Consent records                          |
| `/low-level-concerns`      | GET, POST        | Low-level concerns log                   |
| `/low-level-concerns/[id]` | GET, PUT         | Concern review & escalation              |
| `/dpo-service`             | GET, POST        | DPO outsource service management         |

### RLS

- All tables have RLS enabled
- Service role has full access for API routes
- Data isolated by `organization_id`

## Template Maintenance

### How templates work

- Templates are stored in `compliance_templates` table
- Seeded via the migration SQL
- Each template has:
  - `content_html`: HTML with `{{PLACEHOLDER}}` variables
  - `json_schema`: JSON defining required/optional fields
  - `version`: integer for update tracking
  - `source_reference`: citation (e.g. "KCSIE 2024")

### Central Template Versioning & Cascade

When Schoolgle updates a template centrally (e.g., legislation changes from KCSIE 2024 → 2025):

1. **Admin updates template** via `PUT /api/compliance/templates/[id]` with new `content_html`
2. Template `version` auto-increments and `last_updated_at` is set
3. Schools see **"Template Update Available"** banner in their Policy List
4. Banner shows which policies need review, with direct links
5. Schools review the updated template, diff against their version, and adopt changes
6. API: `GET /api/compliance/templates/updates?organizationId=...` checks all school policies against source templates

**Key files:**

- `src/app/api/compliance/templates/[id]/route.ts` — Template CRUD + version bumping
- `src/app/api/compliance/templates/updates/route.ts` — Template update availability checker
- `src/components/compliance/PolicyList.tsx` — "Update Available" banner UI

### Adding a new template

1. Insert into `compliance_templates` table (or add to migration):

```sql
INSERT INTO compliance_templates (template_type, name, description, is_statutory, json_schema, content_html)
VALUES ('policy', 'My New Policy', 'Description', true,
  '{"required_fields": ["school_name"], "optional_fields": []}',
  '<h1>{{school_name}} Policy</h1><p>Content here</p>');
```

2. Templates appear automatically in the Template Picker

### Update alerts

When a template version is updated, policies derived from older versions can be flagged as "update available" by comparing `source_template_id` + template version.

## Reminders

### How reminders run

- Call `POST /api/compliance/reminders` with `{ organizationId }`
- Checks:
  - Policy reviews past their `next_review_date`
  - Training completions past their `expires_at`
  - Pending approvals older than 3 days
  - SAR deadlines approaching or overdue
- Creates `compliance_notifications` records
- Skips duplicates (won't create if unread notification already exists)

### Running reminders

- **Manual**: Call the API endpoint from admin panel or Ed
- **Scheduled**: Set up a cron job or Vercel Cron to call the endpoint daily
- **Recommended schedule**: Daily at 07:00

## Training Requirements

### Configuring role-based requirements

1. Go to Training Checker
2. Use the API to set requirements:

```
POST /api/compliance/training/requirements
{
  "organizationId": "...",
  "role_key": "all_staff",
  "course_id": "...",
  "required": true,
  "renewal_days": 365
}
```

### Pre-seeded courses

The migration seeds 15 common training courses including:

- Safeguarding Level 1 & DSL (annual/biennial)
- Prevent Duty (annual)
- First Aid / Paediatric First Aid (3-year)
- Fire Safety / Fire Marshal
- Manual Handling
- GDPR & Data Protection (annual)
- Safer Recruitment
- H&S Essentials
- Asbestos / Legionella Awareness
- Equality & Diversity
- Online Safety

### Role keys

Standard role keys: `all_staff`, `teacher`, `support_staff`, `dsl`, `deputy_dsl`, `governor`, `site_manager`, `office_admin`, `headteacher`, `eyfs_staff`, `fire_marshal`, `first_aider`

## Audit Trail

Every write operation logs to `compliance_audit_log`:

- Entity type and ID
- Action (created, updated, approved, published, archived, exported)
- Actor user ID and name
- Timestamp
- Metadata (JSON details)

The audit log is immutable (insert-only, no updates or deletes via regular access).

## DPO Outsource Service (Vrisk Partnership)

### Business Model

Schoolgle offers outsourced Data Protection Officer services through a partnership with Vrisk consultants, all branded under the Schoolgle umbrella.

### Service Tiers

| Tier     | Annual Fee | Includes                                                                                               |
| -------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| Standard | £1,200     | Named DPO, annual data audit, breach support hotline, ROPA review, ICO registration                    |
| Enhanced | £2,400     | Everything in Standard + quarterly reviews, DPIA support, staff GDPR training, SAR handling            |
| Premium  | £4,800     | Everything in Enhanced + monthly DPO surgeries, unlimited DPIA reviews, ICO liaison, incident response |

### Revenue Split

- **Schoolgle platform fee**: 15% of annual fee
- **Vrisk consultant fee**: 85% of annual fee
- Schoolgle handles billing, onboarding, and platform integration
- Vrisk provides qualified DPO consultants (IAPP CIPP/E or equivalent)

### How It Works

1. School signs up for DPO service tier via Schoolgle
2. Vrisk assigns a named consultant based on school type and location
3. Consultant details appear in the DPO Service panel
4. All GDPR tools (DPIA, SAR, Breach) auto-populate consultant as DPO
5. Consultant has portal access for their assigned schools
6. SLA: 48-hour response for Standard, 24-hour for Enhanced, 4-hour for Premium

### Technical Integration

- `compliance_dpo_service` table stores service configuration per organization
- API: `/api/compliance/dpo-service` for management
- Template auto-fill: DPO name/contact populated into all GDPR templates
- Breach alerts: Consultant auto-notified on breach creation

## Template Library

### Legislation Mapping

The template library covers all statutory and recommended compliance documents for UK schools:

| Domain                 | Templates                                                                                                                                                                                                            | Key Legislation                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| GDPR & Data Protection | Privacy Notice (Pupils), Privacy Notice (Staff), Privacy Notice (Governors), Privacy Notice (Website), ROPA, Data Retention Schedule, DPIA, Data Breach Procedure, CCTV Policy, FOI Publication Scheme, Consent Form | UK GDPR, DPA 2018, PECR 2003, FOIA 2000                    |
| Safeguarding           | Safeguarding Policy, KCSIE Acknowledgement, Low-Level Concern Form, Record of Concern, Whistleblowing Policy                                                                                                         | KCSIE 2024, Children Act 1989/2004, Education Act 2002     |
| Health & Safety        | H&S Policy, Risk Assessment, Accident/RIDDOR Form, Fire Risk Assessment                                                                                                                                              | HSWA 1974, MHSWR 1999, RIDDOR 2013, Fire Safety Order 2005 |
| HR & Employment        | Disciplinary Procedure, Grievance Procedure, Capability Procedure, Staff Code of Conduct                                                                                                                             | Employment Rights Act 1996, ACAS Code of Practice          |
| Governance             | Register of Business Interests, Complaints Procedure                                                                                                                                                                 | School Governance Regs 2013, DfE Complaints Guidance 2019  |
| Equality & Inclusion   | Equality Information & Objectives, Accessibility Plan                                                                                                                                                                | Equality Act 2010, PSED                                    |
| SEND                   | SEND Information Report & Policy                                                                                                                                                                                     | Children and Families Act 2014, SEND Code of Practice 2015 |
| Admissions             | Admissions Policy                                                                                                                                                                                                    | School Admissions Code 2021                                |
| Online Safety          | Acceptable Use Policy (Staff), Online Safety Policy                                                                                                                                                                  | KCSIE 2024, Education Act 2011                             |
| Behaviour              | Behaviour Policy, Anti-Bullying Policy                                                                                                                                                                               | Education and Inspections Act 2006                         |
| Finance                | Charging and Remissions Policy                                                                                                                                                                                       | Education Act 1996 ss.449-462                              |

### Privacy Notices – Who Gets What

| Notice                     | Audience                                          | When Issued               | Review |
| -------------------------- | ------------------------------------------------- | ------------------------- | ------ |
| Privacy Notice – Pupils    | Parents/carers at admission, published on website | At admission + annually   | Annual |
| Privacy Notice – Staff     | All employees at appointment                      | At appointment + annually | Annual |
| Privacy Notice – Governors | All governors/trustees at appointment             | At appointment            | Annual |
| Privacy Notice – Website   | All website visitors (cookie banner)              | On website visit          | Annual |

### Template Count

- **Migration 1 (20260305_compliance_module.sql)**: 6 templates (Safeguarding, Complaints, GDPR Policy, Staff Code of Conduct, Incident Report, DPIA)
- **Migration 2 (20260305_compliance_templates_expansion.sql)**: 30 additional templates covering all compliance domains
- **Total**: 36 templates seeded, covering all statutory requirements for maintained schools, academies, and faith schools
