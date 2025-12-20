# Schoolgle Database & Data Architecture Audit

**Date:** 2025-01-XX  
**Auditor:** Senior Systems Architect & Data Auditor  
**Purpose:** Internal understanding and planning for product validation

---

## Executive Summary

The Schoolgle database is built on Supabase (PostgreSQL) with a comprehensive schema supporting multi-tenant school improvement workflows. The architecture includes 50+ tables covering Ofsted/SIAMS frameworks, evidence management, statutory documents, and operational tracking. External DfE data is integrated via a separate schema (`dfe_data`) with views for public access. Row Level Security (RLS) is enabled but user-facing policies are incomplete. The schema demonstrates strong alignment with School Improvement needs but has gaps in multi-year trend analysis, evidence indexing, and some operational workflows.

---

## 1. Database Inventory

### 1.1 Core Tables (Multi-Tenancy & Auth)

| Table | Purpose | Key Fields | Relationships | Data Type |
|-------|---------|------------|---------------|-----------|
| `users` | User accounts (Firebase UID mapping) | `id` (text, PK), `email`, `display_name` | Referenced by `organization_members` | System/Meta |
| `organizations` | Schools/organizations (multi-tenant root) | `id` (uuid, PK), `urn` (DfE), `school_type`, `is_church_school`, `diocese` | Referenced by all tenant-scoped tables | Operational |
| `organization_members` | User-organization membership | `organization_id` (FK), `user_id` (FK), `role` | Links users ↔ organizations | System/Meta |
| `invitations` | Organization invitation system | `id`, `email`, `organization_id`, `role`, `token`, `status` | FK to `organizations`, `users` | System/Meta |

**Notes:**
- Multi-tenancy is enforced via `organization_id` on all tenant-scoped tables
- Users can belong to multiple organizations (composite PK on `organization_members`)
- `urn` field links to DfE data warehouse for external lookups

### 1.2 Framework Tables (Ofsted & SIAMS)

| Table | Purpose | Key Fields | Relationships | Data Type |
|-------|---------|------------|---------------|-----------|
| `ofsted_categories` | Ofsted framework categories (Nov 2025) | `id` (text, PK), `name`, `display_order` | Referenced by `ofsted_subcategories` | System/Meta |
| `ofsted_subcategories` | Ofsted subcategories | `id`, `category_id` (FK), `name`, `key_indicators[]` | Referenced by `ofsted_assessments` | System/Meta |
| `siams_strands` | SIAMS framework strands | `id` (text, PK), `name`, `key_indicators[]` | Referenced by `siams_assessments` | System/Meta |
| `siams_questions` | SIAMS inspection questions | `id`, `strand_id` (FK), `question`, `evidence_required[]` | Referenced by `siams_assessments` | System/Meta |
| `evidence_requirements` | Evidence requirements per subcategory | `id`, `subcategory_id` (FK), `importance`, `eef_link` | Links to EEF strategies | System/Meta |

**Framework Data:**
- Ofsted: 7 categories (6 main + safeguarding), ~20 subcategories seeded
- SIAMS: 7 strands seeded
- Framework structure is static/reference data (not school-entered)

### 1.3 Assessment Tables (School Self-Evaluation)

| Table | Purpose | Key Fields | Relationships | Data Type |
|-------|---------|------------|---------------|-----------|
| `ofsted_assessments` | School self-assessments per subcategory | `id`, `organization_id` (FK), `subcategory_id` (FK), `school_rating` (5-point scale), `ai_rating`, `evidence_count` | Unique on `(organization_id, subcategory_id)` | Operational |
| `safeguarding_assessments` | Safeguarding binary assessment | `id`, `organization_id` (FK), `status` ('met'/'not_met'), checklist fields | Unique on `organization_id` | Operational |
| `siams_assessments` | SIAMS assessments per question | `id`, `organization_id` (FK), `question_id` (FK), `rating` (4-point scale) | Unique on `(organization_id, question_id)` | Operational |

**Assessment Scale:**
- Ofsted: `exceptional`, `strong_standard`, `expected_standard`, `needs_attention`, `urgent_improvement`
- SIAMS: `excellent`, `good`, `requires_improvement`, `ineffective`
- Safeguarding: Binary `met`/`not_met`

### 1.4 Evidence & Documents

| Table | Purpose | Key Fields | Relationships | Data Type |
|-------|---------|------------|---------------|-----------|
| `documents` | Uploaded/scanned documents | `id` (bigserial), `organization_id` (FK), `name`, `file_path`, `provider` (local/gdrive/onedrive), `content`, `embedding` (vector 1536) | Referenced by `evidence_matches` | Operational |
| `evidence_matches` | AI-matched evidence to framework | `id`, `organization_id` (FK), `document_id` (FK), `framework_type`, `category_id`, `subcategory_id`, `confidence`, `matched_keywords[]`, `strengths[]`, `gaps[]` | Links documents → framework areas | Operational |
| `scan_jobs` | Document scanning job tracking | `id`, `organization_id` (FK), `source_type`, `status`, `total_files`, `processed_files` | Tracks bulk scan operations | Operational |

**Evidence Capabilities:**
- Vector embeddings (pgvector) for semantic search
- AI matching to framework areas with confidence scores
- Support for Google Drive, OneDrive, local storage
- Content hash for change detection

### 1.5 Actions & Improvement Tracking

| Table | Purpose | Key Fields | Relationships | Data Type |
|-------|---------|------------|---------------|-----------|
| `actions` | Improvement actions | `id`, `organization_id` (FK), `framework_type`, `category_id`, `subcategory_id`, `title`, `priority`, `status`, `owner_id`, `due_date`, `eef_strategy` | Links to framework areas | Operational |
| `action_notes` | Notes on actions | Not found in schema (may be handled via `notes` table) | — | — |
| `sdp_priorities` | School Development Plan priorities | `id`, `organization_id` (FK), `academic_year`, `priority_number`, `title`, `status`, `progress_percentage` | Referenced by `sdp_milestones` | Operational |
| `sdp_milestones` | SDP milestones | `id`, `priority_id` (FK), `target_term`, `status`, `rag_status` | Links to priorities | Operational |

**Action Sources:**
- `source` field: `manual`, `ed_recommendation`, `scan_gap`, `observation`
- Links to EEF strategies for evidence-based interventions

### 1.6 Statutory Documents

| Table | Purpose | Key Fields | Relationships | Data Type |
|-------|---------|------------|---------------|-----------|
| `statutory_documents` | SEF, SDP, PP Strategy, etc. | `id`, `organization_id` (FK), `document_type` (sef/siams_sef/sdp/pp_strategy/sports_premium/accessibility/behaviour_policy), `content` (jsonb), `version`, `is_current`, `status`, `is_published_to_website` | Version control via `previous_version_id` | Operational |
| `pupil_premium_data` | PP data per academic year | `id`, `organization_id` (FK), `academic_year`, `pp_pupils`, `pp_allocation`, `barriers` (jsonb), `outcomes` (jsonb) | Unique on `(organization_id, academic_year)` | Operational |
| `pp_spending` | PP spending by tier (EEF) | `id`, `organization_id` (FK), `academic_year`, `tier` (1/2/3), `activity_name`, `allocated_amount`, `impact_rating` | Links to barriers via `barrier_ids[]` | Operational |
| `sports_premium_data` | Sports Premium data | `id`, `organization_id` (FK), `academic_year`, `allocation`, `swimming_*_percentage` | Unique on `(organization_id, academic_year)` | Operational |
| `sports_premium_spending` | Sports Premium spending by key indicator | `id`, `organization_id` (FK), `academic_year`, `key_indicator` (1-5), `activity_name`, `is_sustainable` | — | Operational |

**Document Types:**
- SEF (Self-Evaluation Form)
- SIAMS SEF
- SDP (School Development Plan)
- PP Strategy Statement
- Sports Premium Report
- Accessibility Plan
- Behaviour Policy

### 1.7 Operational Tables

| Table | Purpose | Key Fields | Relationships | Data Type |
|-------|---------|------------|---------------|-----------|
| `lesson_observations` | Lesson observation records | `id`, `organization_id` (FK), `date`, `teacher_name`, `subject`, `overall_judgement` (5-point scale), `linked_framework_area` | Links to Ofsted subcategories | Operational |
| `meetings` | Meeting records | `id`, `organization_id` (FK), `meeting_type`, `date`, `agenda`, `minutes`, `transcript`, `ai_summary` | Referenced by `meeting_actions` | Operational |
| `meeting_actions` | Actions from meetings | `id`, `meeting_id` (FK), `action_id` (FK) | Links meetings → actions | Operational |
| `monitoring_visits` | Learning walks, book looks, etc. | `id`, `organization_id` (FK), `visit_type`, `date`, `focus_area`, `framework_link`, `strengths[]`, `areas_for_development[]` | Links to framework areas | Operational |
| `cpd_records` | Staff CPD tracking | `id`, `organization_id` (FK), `title`, `date`, `attendee_ids[]`, `cost`, `funded_by`, `framework_link`, `impact_rating` | Links to SDP priorities | Operational |
| `policies` | Policy tracking | `id`, `organization_id` (FK), `name`, `category`, `version`, `last_reviewed`, `next_review`, `is_statutory` | Review cycle tracking | Operational |
| `surveys` | Survey records (pupil/parent/staff) | `id`, `organization_id` (FK), `survey_type`, `questions` (jsonb), `response_count`, `ai_summary`, `sentiment_score` | Referenced by `survey_responses` | Operational |
| `survey_responses` | Anonymized survey responses | `id`, `survey_id` (FK), `responses` (jsonb), `respondent_type`, `year_group` | Links to surveys | Operational |
| `external_visits` | External validation visits | `id`, `organization_id` (FK), `visitor_type`, `date`, `report_summary`, `recommendations[]` | Links to framework areas | Operational |
| `risks` | Risk register | `id`, `organization_id` (FK), `title`, `category`, `likelihood`, `impact`, `risk_score` (calculated), `status` | Risk owner tracking | Operational |
| `notes` | Notes attached to any entity | `id`, `organization_id` (FK), `entity_type`, `entity_id`, `content`, `is_private` | Generic attachment | Operational |
| `activity_log` | Audit trail | `id`, `organization_id` (FK), `action_type`, `entity_type`, `entity_id`, `changes` (jsonb), `user_id` | Generic audit log | System/Meta |
| `reminders` | Reminders & calendar | `id`, `organization_id` (FK), `title`, `due_date`, `entity_type`, `entity_id`, `is_recurring` | Generic reminder system | Operational |

### 1.8 Module & Subscription System

| Table | Purpose | Key Fields | Relationships | Data Type |
|-------|---------|------------|---------------|-----------|
| `modules` | Available modules (App Store) | `id` (text, PK), `name`, `category`, `price_monthly`, `price_annual`, `features` (jsonb), `default_limits` (jsonb) | Referenced by `organization_modules` | System/Meta |
| `organization_modules` | Module entitlements | `organization_id` (FK), `module_id` (FK), `enabled`, `custom_limits` (jsonb), `usage_current` (jsonb) | Composite PK | System/Meta |
| `subscriptions` | Subscription plans | `id`, `organization_id` (FK), `plan`, `status`, `stripe_subscription_id`, `billing_cycle`, `current_period_start/end` | Unique on `organization_id` | System/Meta |
| `usage_logs` | Usage tracking for billing | `id`, `organization_id` (FK), `user_id`, `action_type`, `module_id`, `model_used`, `tokens_input/output`, `cost_estimate` | Links to modules | System/Meta |
| `ai_models` | AI model configuration | `id` (text, PK), `provider`, `model_name`, `cost_per_m_input/output`, `capabilities[]`, `recommended_for[]` | Reference data | System/Meta |
| `framework_updates` | Framework update tracking | `id` (text, PK), `framework`, `title`, `effective_date`, `impact_areas[]`, `is_acknowledged` | Reference data | System/Meta |

**Modules Seeded:**
- Core (free)
- Inspection Ready Bundle
- Voice Suite
- Insights Pro
- AI Coach
- Quick Capture Mobile
- Operations Suite
- Stakeholder Voice
- Everything Bundle

### 1.9 Views & Functions

**Views:**
- `public.schools` → `dfe_data.schools`
- `public.area_demographics` → `dfe_data.area_demographics`
- `public.local_authority_finance` → `dfe_data.local_authority_finance`
- `public.school_area_links` → `dfe_data.school_area_links`

**Functions:**
- `get_user_organizations(user_id_param text)` → Returns user's organizations
- `calculate_category_readiness(org_id uuid, category_id_param text)` → Calculates readiness score from assessments
- `get_evidence_for_subcategory(org_id uuid, subcategory_id_param text)` → Returns evidence matches for a subcategory
- `get_last_inspection(lookup_urn text)` → Returns last inspection from DfE data (RPC)
- `get_headteacher_info(lookup_urn text)` → Returns headteacher info from DfE data (RPC)
- `get_performance_trends(lookup_urn text)` → Returns performance trends from DfE data (RPC)
- `is_organization_member(user_id_param text, org_id uuid)` → Checks organization membership (RLS helper)

**Enums:**
- None explicitly defined (uses CHECK constraints instead)

---

## 2. Data Sources

### 2.1 External Datasets (DfE Data Warehouse)

**Schema:** `dfe_data` (separate schema, accessed via views)

| Table/View | Purpose | Frequency | Date Range | Join Key |
|------------|---------|-----------|------------|----------|
| `dfe_data.schools` | School identity & basic info | Static (periodic updates) | Current | `urn` (integer) |
| `dfe_data.area_demographics` | Area deprivation (IMD scores) | Static (periodic updates) | Current | `lsoa_code` (via `school_area_links`) |
| `dfe_data.local_authority_finance` | LA finance data (DSG, SEND spending) | Periodic (annual) | Multi-year | `la_code` |
| `dfe_data.school_area_links` | Links schools to LSOA areas | Static | Current | `urn` → `lsoa_code` |
| `dfe_data.school_profiles` | School profiles (inspection dates, performance) | Periodic | Multi-year | `urn` |
| `dfe_data.school_history` | Historical school data | Periodic | Multi-year | `urn` + `year` |

**Data Available:**
- ✅ School identity (name, URN, address, LA, phase, type, trust)
- ✅ Area deprivation (IMD scores, deciles)
- ✅ LA finance (DSG deficits, SEND spending)
- ✅ Inspection dates & ratings (via `school_profiles`)
- ✅ Headteacher info (name, start date) — if columns exist
- ✅ Performance data (P8, Att8) — if columns exist

**Data NOT Available (Must Ask Schools):**
- ❌ Religious character / faith designation (for SIAMS/CSI detection)
- ❌ User preferences (evidence storage location)

**Ingestion Method:**
- Views in `public` schema point to `dfe_data` tables
- RPC functions (`get_last_inspection`, `get_headteacher_info`, `get_performance_trends`) query DfE data
- No automated ingestion scripts found in codebase
- Manual/periodic updates assumed

### 2.2 Operational Data (School-Entered)

**Frequency:** Real-time (user-entered)
**Date Ranges:** Varies by table (academic year tracking on statutory docs)

**Key Operational Tables:**
- Assessments (`ofsted_assessments`, `siams_assessments`, `safeguarding_assessments`)
- Actions (`actions`)
- Evidence (`documents`, `evidence_matches`)
- Statutory documents (`statutory_documents`, `pupil_premium_data`, `pp_spending`, `sports_premium_data`)
- Observations (`lesson_observations`, `monitoring_visits`)
- Meetings (`meetings`, `meeting_actions`)
- CPD (`cpd_records`)
- Surveys (`surveys`, `survey_responses`)

### 2.3 System/Meta Data

**Frequency:** Real-time (system-generated)
**Purpose:** Multi-tenancy, entitlements, telemetry, audit

**Key System Tables:**
- Auth (`users`, `organization_members`, `invitations`)
- Modules (`modules`, `organization_modules`, `subscriptions`)
- Usage (`usage_logs`, `ai_models`)
- Audit (`activity_log`)
- Telemetry (`tool_telemetry` — referenced in code but not found in schema files)

**Note:** `tool_telemetry` table is referenced in `packages/mcp-server/src/utils/telemetry.ts` but not defined in schema files. This is a gap.

---

## 3. School Improvement Alignment

### 3.1 Multi-Year Trend Analysis

**Current State:**
- ❌ **No explicit multi-year assessment history table**
- ✅ `ofsted_assessments` has `assessed_at` timestamp but only one row per `(organization_id, subcategory_id)` (unique constraint)
- ✅ `pupil_premium_data`, `pp_spending`, `sports_premium_data` have `academic_year` field (supports year-over-year)
- ✅ `statutory_documents` has version control (`version`, `previous_version_id`, `is_current`)
- ✅ `sdp_priorities` has `academic_year` field
- ⚠️ **Assessment history is overwritten, not preserved**

**Gap:**
- Cannot track how a school's self-assessment changed over time (e.g., "Curriculum went from 'needs_attention' to 'strong_standard' in 2024")
- No audit trail of assessment changes (only `activity_log` has generic change tracking)

**Recommendation:**
- Add `assessment_history` table or remove unique constraint and add `assessed_at` to PK
- Or add `assessment_snapshots` table with periodic snapshots

### 3.2 Leadership Change Tracking

**Current State:**
- ✅ `get_headteacher_info(urn)` RPC function queries DfE data for headteacher name and start date
- ✅ Calculates tenure in months and flags if new (< 12 months)
- ❌ **No internal tracking of leadership changes** (only external DfE lookup)
- ❌ No tracking of SLT changes, governor changes, etc.

**Gap:**
- Cannot track internal leadership changes (e.g., "Headteacher changed in Jan 2024")
- No link between leadership changes and assessment/action changes

**Recommendation:**
- Add `leadership_changes` table or extend `external_visits` to track internal leadership transitions

### 3.3 Intervention Tracking

**Current State:**
- ✅ `actions` table links to framework areas (`category_id`, `subcategory_id`)
- ✅ `actions` has `eef_strategy` and `eef_impact_months` for evidence-based interventions
- ✅ `actions` tracks `status`, `due_date`, `completed_date`, `owner_id`
- ✅ `actions` has `source` field (`manual`, `ed_recommendation`, `scan_gap`, `observation`)
- ✅ `sdp_priorities` and `sdp_milestones` track improvement priorities
- ✅ `pp_spending` tracks spending by EEF tier (1/2/3)
- ✅ `cpd_records` links to framework areas and SDP priorities

**Strengths:**
- Clear link between actions and framework areas
- EEF strategy tracking for evidence-based interventions
- Action ownership and status tracking

**Gap:**
- ❌ **No explicit "intervention → impact → outcome" chain**
- ❌ No measurement of action effectiveness (e.g., "Action X improved attendance by 5%")
- ❌ No link between actions and assessment changes (e.g., "Action completed → assessment improved")

**Recommendation:**
- Add `action_impact` table or extend `actions` with `measured_impact` field
- Link actions to assessment changes via `activity_log` or explicit FK

### 3.4 Evidence-Based Narratives for Inspection

**Current State:**
- ✅ `evidence_matches` links documents to framework areas with confidence scores
- ✅ `evidence_matches` has `strengths[]`, `gaps[]`, `suggestions[]` fields
- ✅ `documents` table supports vector embeddings for semantic search
- ✅ `get_evidence_for_subcategory()` function returns evidence for a subcategory
- ✅ `ofsted_assessments` has `evidence_count` and `evidence_quality_score` fields
- ✅ `statutory_documents` can store structured content (jsonb)

**Strengths:**
- AI-powered evidence matching to framework areas
- Confidence scoring and gap identification
- Document scanning and embedding support

**Gap:**
- ❌ **No explicit "evidence → narrative" generation**
- ❌ No SEF generation workflow (only `statutory_documents` storage)
- ❌ No inspection report generation (only document storage)

**Recommendation:**
- Add `narrative_templates` or `inspection_artefacts` table
- Or extend `statutory_documents` with `generation_method` field

### 3.5 Linking Actions → Impact → Outcomes

**Current State:**
- ✅ `actions` links to framework areas
- ✅ `actions` has `success_criteria` field
- ✅ `actions` tracks `completed_date`
- ✅ `pp_spending` has `impact_rating` and `actual_impact` fields
- ✅ `cpd_records` has `impact_rating` and `actual_impact` fields
- ❌ **No explicit link between actions and assessment changes**
- ❌ No measurement of action impact on outcomes

**Gap:**
- Cannot answer: "Did Action X improve the 'Curriculum' assessment from 'needs_attention' to 'strong_standard'?"
- No causal link between interventions and outcomes

**Recommendation:**
- Add `action_outcomes` table or extend `actions` with `outcome_assessment_id` FK
- Or use `activity_log` to infer links (requires analysis)

---

## 4. Evidence & Ofsted Readiness

### 4.1 Evidence Indexing

**Current State:**
- ✅ `documents` table supports file storage (`file_path`, `provider`, `external_id`)
- ✅ `documents` has `content` field (text extraction)
- ✅ `documents` has `embedding` field (vector 1536) for semantic search
- ✅ `documents` has `content_hash` for change detection
- ✅ `scan_jobs` tracks bulk scanning operations
- ✅ `evidence_matches` links documents to framework areas

**Capabilities:**
- Google Drive, OneDrive, local storage support
- Vector embeddings for semantic search
- AI matching to framework areas

**Gap:**
- ❌ **No explicit folder structure mapping** (e.g., "Ofsted/Curriculum/Evidence/")
- ❌ No metadata tagging (e.g., "Year 5", "Maths", "2024-25")
- ❌ No document versioning (only `content_hash` for change detection)

**Recommendation:**
- Add `document_folders` table or extend `documents` with `folder_path` (already exists but not structured)
- Add `document_tags` table or `tags[]` array field

### 4.2 Mapping Evidence to Inspection Themes

**Current State:**
- ✅ `evidence_matches` links to `framework_type`, `category_id`, `subcategory_id`
- ✅ `evidence_matches` has `confidence` score (0-1)
- ✅ `evidence_matches` has `matched_keywords[]` and `relevance_explanation`
- ✅ `get_evidence_for_subcategory()` function returns evidence for a subcategory
- ✅ `ofsted_assessments` has `evidence_count` field

**Strengths:**
- AI-powered matching with confidence scores
- Framework area mapping (Ofsted/SIAMS)

**Gap:**
- ❌ **No manual override** (cannot manually link evidence to framework areas)
- ❌ No evidence quality scoring beyond confidence
- ❌ No evidence expiry/outdated flagging

**Recommendation:**
- Add `evidence_matches.manual_override` boolean field
- Add `evidence_matches.quality_score` field
- Add `evidence_matches.is_outdated` boolean field

### 4.3 Identifying Evidence Gaps

**Current State:**
- ✅ `evidence_matches` has `gaps[]` field (AI-identified)
- ✅ `evidence_requirements` table defines required evidence per subcategory
- ✅ `ofsted_assessments` has `evidence_count` field
- ❌ **No explicit gap analysis** (e.g., "Missing evidence for 'Curriculum Intent'")

**Gap:**
- Cannot automatically identify: "You have 0 evidence items for 'SEND Provision'"
- No gap report generation

**Recommendation:**
- Add `evidence_gaps` table or view comparing `evidence_requirements` vs `evidence_matches`
- Or add function `get_evidence_gaps(org_id, subcategory_id)`

### 4.4 Generating Inspection Artefacts

**Current State:**
- ✅ `statutory_documents` table stores SEF, SDP, PP Strategy, etc.
- ✅ `statutory_documents` has `content` (jsonb) for structured storage
- ✅ `statutory_documents` has version control (`version`, `previous_version_id`)
- ✅ `statutory_documents` has workflow (`status`: draft/review/approved/published)
- ✅ `statutory_documents` has `is_published_to_website` flag
- ❌ **No explicit generation workflow** (only storage)
- ❌ No template system for document generation

**Gap:**
- Cannot generate SEF from assessments + evidence automatically
- No SDP generation from priorities
- No inspection report generation

**Recommendation:**
- Add `document_templates` table
- Or extend `statutory_documents` with `generation_method` and `source_data` fields

---

## 5. Multi-Product Readiness

### 5.1 School Improvement / Ofsted App

**Current State:**
- ✅ Full Ofsted framework (categories, subcategories, assessments)
- ✅ Evidence matching to framework areas
- ✅ Action tracking linked to framework
- ✅ Assessment tracking (5-point scale)
- ✅ Statutory document storage (SEF, SDP, PP Strategy)
- ✅ Lesson observations, monitoring visits
- ✅ Risk register

**Readiness:** ✅ **Strong** — Core functionality present

**Gaps:**
- Multi-year trend analysis (see 3.1)
- Evidence gap analysis (see 4.3)
- SEF generation (see 4.4)

### 5.2 SIAMS / Faith Inspection Variants

**Current State:**
- ✅ `is_church_school` flag on `organizations`
- ✅ `diocese` field on `organizations`
- ✅ Full SIAMS framework (`siams_strands`, `siams_questions`, `siams_assessments`)
- ✅ `siams_sef` document type in `statutory_documents`
- ✅ `actions` supports `framework_type` ('ofsted' | 'siams')
- ✅ `evidence_matches` supports `framework_type` ('ofsted' | 'siams')

**Readiness:** ✅ **Strong** — SIAMS fully supported

**Gaps:**
- ❌ **No CSI (Catholic) framework** (only SIAMS for Anglican/Methodist)
- ❌ No Section 48 (Muslim/Jewish/Hindu/Sikh) framework
- ❌ No ISI (Independent Schools) framework

**Recommendation:**
- Extend `framework_type` to include 'csi', 'section48', 'isi'
- Add framework tables for each variant

### 5.3 Parent-Facing School Comparison App

**Current State:**
- ✅ DfE data available (schools, area demographics, LA finance)
- ✅ `organizations` table has basic school info
- ❌ **No public-facing data model** (all tables are tenant-scoped)
- ❌ No comparison metrics (e.g., "Similar schools" algorithm)
- ❌ No public API endpoints (only tenant-scoped RLS)

**Readiness:** ❌ **Not Ready** — Requires separate public schema or API

**Gap:**
- Cannot expose school data to parents without breaking multi-tenancy
- No anonymized/aggregated comparison data

**Recommendation:**
- Create `public_school_profiles` view or table (read-only, aggregated)
- Or create separate public API with different auth model

### 5.4 Website Chatbot (Ed) Knowledge Base

**Current State:**
- ✅ `framework_updates` table tracks framework changes
- ✅ `ai_models` table configures AI models
- ✅ `usage_logs` tracks AI usage
- ❌ **No knowledge pack tables in schema** (only TypeScript files in codebase)
- ❌ No `tool_telemetry` table (referenced in code but not in schema)

**Readiness:** ⚠️ **Partial** — Knowledge engine exists in code but not in DB

**Gap:**
- Knowledge packs are in TypeScript files (`packages/mcp-server/src/knowledge/packs/`)
- No Supabase storage for knowledge packs (planned but not implemented)
- Telemetry table missing

**Recommendation:**
- Add `knowledge_packs` and `knowledge_rules` tables (see `packages/mcp-server/src/knowledge/README.md`)
- Add `tool_telemetry` table

### 5.5 Internal Staff Productivity Tooling

**Current State:**
- ✅ Meeting management (`meetings`, `meeting_actions`)
- ✅ CPD tracking (`cpd_records`)
- ✅ Policy tracking (`policies`)
- ✅ Reminders (`reminders`)
- ✅ Surveys (`surveys`, `survey_responses`)
- ✅ Notes (`notes`)
- ✅ Activity log (`activity_log`)

**Readiness:** ✅ **Strong** — Operational tools present

**Gaps:**
- ❌ No time tracking
- ❌ No task management (beyond `actions`)
- ❌ No calendar integration

---

## 6. Security & Data Separation

### 6.1 Multi-Tenancy Approach

**Current State:**
- ✅ All tenant-scoped tables have `organization_id` (uuid, FK to `organizations`)
- ✅ `organization_members` enforces user-organization membership
- ✅ Users can belong to multiple organizations (composite PK)
- ✅ RLS is enabled on all tables

**Approach:**
- **Row-level isolation** via `organization_id` on every tenant table
- **Membership-based access** via `organization_members` join

**Strengths:**
- Clear tenant boundary (`organization_id`)
- Supports multi-org users

**Weaknesses:**
- No explicit tenant hierarchy (e.g., Trust → Schools)
- No cross-tenant data sharing (e.g., MAT-level reporting)

### 6.2 RLS Usage

**Current State:**
- ✅ RLS enabled on all tables (50+ tables)
- ✅ Service role policies exist (`"Service role full access"` using `true`)
- ⚠️ **User-facing RLS policies are incomplete**

**User-Facing Policies:**
- Migration `20240101_security_core.sql` creates policies using `is_organization_member(organization_id)`
- Migration `1738000000_secure_rls.sql` creates helper functions (`is_organization_member`, `get_connection_user_id`)
- Policies use `auth.uid()` and JWT claims for user identification

**Gap:**
- Policies assume Supabase Auth (`auth.uid()`), but codebase uses Firebase Auth
- Connection-scoped context (MCP) may not set JWT claims correctly
- No explicit policy testing/documentation

**Recommendation:**
- Verify RLS policies work with Firebase Auth (may need custom claims)
- Test connection-scoped context for MCP tools
- Document RLS policy behavior

### 6.3 Separation Between School-Owned and System Data

**Current State:**
- ✅ **School-owned data:** All tables with `organization_id` (assessments, actions, documents, etc.)
- ✅ **System data:** `users`, `organizations`, `organization_members`, `modules`, `subscriptions`, `usage_logs`
- ✅ **Reference data:** `ofsted_categories`, `siams_strands`, `ai_models`, `framework_updates` (no `organization_id`)

**Separation:**
- Clear distinction: school data has `organization_id`, system data does not
- Reference data is shared across all tenants

**Risk:**
- ⚠️ **No explicit data retention policy** (e.g., "Delete school data after 7 years")
- ⚠️ **No data export/deletion workflow** (GDPR right to erasure)

**Recommendation:**
- Add `data_retention_policy` table or `organizations.data_retention_years` field
- Add `data_deletion_requests` table for GDPR compliance

### 6.4 Risks if Evidence Scanning or Pupil-Level Data Added

**Current State:**
- ✅ `documents` table supports file storage and content extraction
- ✅ `evidence_matches` links documents to framework areas
- ❌ **No pupil-level data tables** (only aggregate data in `pupil_premium_data`)

**Risks if Pupil-Level Data Added:**
- ⚠️ **GDPR compliance:** Pupil data requires explicit consent and retention policies
- ⚠️ **Data minimization:** Should only store necessary fields
- ⚠️ **Access controls:** Need role-based access (e.g., "Teachers can only see their class")
- ⚠️ **Pseudonymization:** May need `pupil_id` (pseudonymous) vs `real_id` (encrypted) separation

**Recommendation:**
- Add `pupils` table with pseudonymous `id` (not real name)
- Add `pupil_data_access_log` for audit trail
- Add `pupil_consent` table for GDPR compliance
- Extend RLS policies for pupil-level data (role-based)

**Risks if Evidence Scanning Expanded:**
- ⚠️ **Storage costs:** Vector embeddings are large (1536 dimensions)
- ⚠️ **Scanning costs:** AI matching requires LLM calls (tracked in `usage_logs`)
- ⚠️ **Privacy:** Documents may contain sensitive data (PII, safeguarding)

**Recommendation:**
- Add `document_sensitivity` field (e.g., 'public', 'internal', 'confidential', 'safeguarding')
- Add `document_access_log` for audit trail
- Extend RLS policies for sensitive documents

---

## 7. Gaps & Recommendations

### 7.1 Critical Gaps (Must-Have for Next Phase)

1. **`tool_telemetry` table missing**
   - **Impact:** Telemetry logging fails (code references table that doesn't exist)
   - **Fix:** Add `tool_telemetry` table with fields: `id`, `tool_name`, `used_llm`, `model`, `timestamp`, `organization_id`, `user_id`, `duration_ms`, `request_id`, `session_id`, `outcome`, `error_code`, `usage_tokens` (jsonb)

2. **Multi-year assessment history not preserved**
   - **Impact:** Cannot track assessment trends over time
   - **Fix:** Remove unique constraint on `ofsted_assessments` and add `assessed_at` to PK, or add `assessment_history` table

3. **User-facing RLS policies may not work with Firebase Auth**
   - **Impact:** Data access may fail or be insecure
   - **Fix:** Verify RLS policies work with Firebase Auth (may need custom JWT claims or connection-scoped context)

4. **Knowledge packs not in database**
   - **Impact:** Knowledge engine relies on TypeScript files (not scalable)
   - **Fix:** Add `knowledge_packs` and `knowledge_rules` tables (see `packages/mcp-server/src/knowledge/README.md`)

5. **No evidence gap analysis**
   - **Impact:** Cannot identify missing evidence for inspection readiness
   - **Fix:** Add `evidence_gaps` view or function comparing `evidence_requirements` vs `evidence_matches`

### 7.2 Non-Blocking Gaps (Can Wait)

1. **No leadership change tracking (internal)**
   - **Impact:** Cannot track internal leadership changes (only external DfE lookup)
   - **Fix:** Add `leadership_changes` table or extend `external_visits`

2. **No action → impact → outcome chain**
   - **Impact:** Cannot measure action effectiveness
   - **Fix:** Add `action_outcomes` table or extend `actions` with `outcome_assessment_id` FK

3. **No SEF/document generation workflow**
   - **Impact:** Documents must be manually created (no auto-generation)
   - **Fix:** Add `document_templates` table or extend `statutory_documents` with `generation_method`

4. **No CSI/Section 48/ISI frameworks**
   - **Impact:** Only SIAMS supported for faith schools
   - **Fix:** Extend `framework_type` and add framework tables

5. **No public-facing data model for parent app**
   - **Impact:** Cannot expose school data to parents without breaking multi-tenancy
   - **Fix:** Create `public_school_profiles` view or separate public API

6. **No data retention/deletion workflow**
   - **Impact:** GDPR compliance risk
   - **Fix:** Add `data_retention_policy` and `data_deletion_requests` tables

### 7.3 Schema Addition Recommendations (Concepts Only)

1. **`assessment_history` table**
   - Purpose: Track assessment changes over time
   - Fields: `id`, `organization_id`, `subcategory_id`, `rating`, `assessed_at`, `assessed_by`
   - Remove unique constraint from `ofsted_assessments`

2. **`tool_telemetry` table**
   - Purpose: Track tool usage for cost/audit
   - Fields: As defined in `packages/mcp-server/src/utils/telemetry.ts`

3. **`knowledge_packs` and `knowledge_rules` tables**
   - Purpose: Store deterministic guidance (BB104, KCSIE, etc.)
   - Fields: As defined in `packages/mcp-server/src/knowledge/README.md`

4. **`evidence_gaps` view**
   - Purpose: Identify missing evidence per framework area
   - Logic: Compare `evidence_requirements` vs `evidence_matches` per organization

5. **`action_outcomes` table**
   - Purpose: Link actions to assessment changes
   - Fields: `id`, `action_id`, `assessment_id`, `impact_description`, `measured_improvement`

6. **`document_templates` table**
   - Purpose: Store templates for SEF, SDP, PP Strategy generation
   - Fields: `id`, `document_type`, `template_content` (jsonb), `version`

7. **`pupils` table (if pupil-level data needed)**
   - Purpose: Store pseudonymous pupil data
   - Fields: `id` (pseudonymous), `organization_id`, `year_group`, `pp_flag`, `send_flag` (no real names)
   - RLS: Role-based access (teachers see only their class)

8. **`data_deletion_requests` table**
   - Purpose: GDPR right to erasure workflow
   - Fields: `id`, `organization_id`, `requested_by`, `requested_at`, `status`, `completed_at`

---

## Appendix: Table Count Summary

**Total Tables:** ~50+ tables

**By Category:**
- Core (Auth/Multi-tenancy): 4
- Framework (Ofsted/SIAMS): 5
- Assessments: 3
- Evidence/Documents: 3
- Actions/Improvement: 4
- Statutory Documents: 6
- Operational: 12
- Modules/Subscriptions: 6
- System/Meta: 7+

**By Data Type:**
- Historic (DfE): 5+ (via `dfe_data` schema)
- Operational (School-entered): ~35
- System/Meta: ~10

---

**End of Report**


