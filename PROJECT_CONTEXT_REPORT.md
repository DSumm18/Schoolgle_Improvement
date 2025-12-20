# Project Context Report: Schoolgle Improvement Platform

**Generated**: 2025-01-26  
**Purpose**: Complete technical context for external architecture review  
**Platform**: UK EdTech - Ofsted/SIAMS Inspection Preparation & School Improvement

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Database Schema](#database-schema)
3. [Installed Tools & Packages](#installed-tools--packages)
4. [Current MCP Tools](#current-mcp-tools)
5. [Auth & Security](#auth--security)
6. [Key Business Logic](#key-business-logic)
7. [Architecture Overview](#architecture-overview)

---

## Project Structure

```
Schoolgle_Improvement/
├── apps/
│   ├── platform/          # Main Next.js platform application
│   ├── ed-parent/         # Parent-facing application
│   └── ed-staff/          # Staff-facing application
├── packages/
│   ├── core/              # Core authentication & security module
│   │   └── src/
│   │       ├── auth.ts    # Dual-auth system (JWT + API Keys)
│   │       └── index.ts
│   ├── mcp-server/        # Model Context Protocol server
│   │   └── src/
│   │       ├── index.ts           # MCP server entry point
│   │       ├── middleware/
│   │       │   └── safety.ts     # Tool safety & audit middleware
│   │       └── tools/
│   │           ├── financials.ts # get_financial_records tool
│   │           ├── evidence.ts   # get_evidence_matches tool
│   │           └── assessments.ts # get_assessments tool
│   ├── ed-backend/        # Education backend services
│   ├── ed-widget/         # Widget components
│   └── shared/            # Shared utilities
├── supabase/
│   └── migrations/        # Database migrations
│       ├── 20240101_security_core.sql
│       ├── 20240102_entitlements_and_safety.sql
│       ├── 20240103_fix_security_issues.sql
│       ├── 20240104_fix_remaining_rls.sql
│       └── 20240105_register_assessments_tool.sql
├── PROMPTS/
│   └── OFSTED_INSPECTOR_SYSTEM_PROMPT.md
└── supabase_schema.sql     # Complete database schema
```

---

## Database Schema

### Core Tables

#### `users`
- **Purpose**: User accounts (maps Firebase UIDs)
- **Columns**:
  - `id` (text, PK) - Firebase UID
  - `email` (text, not null)
  - `display_name` (text)
  - `avatar_url` (text)
  - `created_at`, `updated_at` (timestamps)

#### `organizations`
- **Purpose**: Schools/Organizations (multi-tenant root)
- **Columns**:
  - `id` (uuid, PK)
  - `name` (text, not null)
  - `urn` (text) - Unique Reference Number (DfE)
  - `school_type` (text) - 'primary', 'secondary', 'special', 'nursery', 'all-through'
  - `is_church_school` (boolean) - If true, SIAMS applies
  - `diocese` (text)
  - `local_authority` (text)
  - `address` (jsonb)
  - `settings` (jsonb)
  - `created_at`, `updated_at` (timestamps)

#### `organization_members`
- **Purpose**: User-Organization membership with roles
- **Columns**:
  - `organization_id` (uuid, FK → organizations.id)
  - `user_id` (text, FK → users.id)
  - `role` (text, not null) - 'admin', 'slt', 'teacher', 'governor', 'viewer'
  - `job_title` (text)
  - `created_at` (timestamp)
  - **Primary Key**: (organization_id, user_id)

#### `invitations`
- **Purpose**: Organization invitation system
- **Columns**:
  - `id` (uuid, PK)
  - `email` (text, not null)
  - `organization_id` (uuid, FK)
  - `role` (text, not null)
  - `token` (uuid)
  - `invited_by` (text, FK → users.id)
  - `status` (text) - 'pending', 'accepted', 'expired', 'cancelled'
  - `created_at`, `expires_at` (timestamps)

### Framework Tables

#### `ofsted_categories`
- **Purpose**: Ofsted framework categories (November 2025)
- **Columns**:
  - `id` (text, PK) - e.g., 'inclusion', 'curriculum-teaching'
  - `name` (text, not null)
  - `description` (text)
  - `color` (text)
  - `guidance_summary` (text)
  - `guidance_link` (text)
  - `display_order` (integer)
  - `is_active` (boolean, default true)
  - `created_at` (timestamp)

#### `ofsted_subcategories`
- **Purpose**: Ofsted subcategories within categories
- **Columns**:
  - `id` (text, PK) - e.g., 'curriculum-teaching-1'
  - `category_id` (text, FK → ofsted_categories.id)
  - `name` (text, not null)
  - `description` (text)
  - `display_order` (integer)
  - `key_indicators` (text[])
  - `inspection_focus` (text[])
  - `created_at` (timestamp)

#### `ofsted_assessments`
- **Purpose**: School self-assessments and AI assessments per subcategory
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK → organizations.id)
  - `subcategory_id` (text, FK → ofsted_subcategories.id)
  - `school_rating` (text) - 'exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement', 'not_assessed'
  - `school_rationale` (text)
  - `ai_rating` (text) - Same enum as school_rating
  - `ai_rationale` (text)
  - `ai_confidence` (decimal(3,2))
  - `evidence_count` (integer, default 0)
  - `evidence_quality_score` (decimal(3,2))
  - `assessed_by` (text, FK → users.id)
  - `assessed_at` (timestamp)
  - `created_at`, `updated_at` (timestamps)
  - **Unique**: (organization_id, subcategory_id)

#### `safeguarding_assessments`
- **Purpose**: Binary Met/Not Met safeguarding assessment
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `status` (text) - 'met', 'not_met', 'not_assessed'
  - `rationale` (text)
  - `scr_compliant` (boolean)
  - `dsl_trained` (boolean)
  - `staff_trained` (boolean)
  - `policy_current` (boolean)
  - `procedures_followed` (boolean)
  - `assessed_by`, `assessed_at` (references)
  - `created_at`, `updated_at` (timestamps)
  - **Unique**: (organization_id)

#### `siams_strands`, `siams_questions`, `siams_assessments`
- **Purpose**: SIAMS framework for church schools (similar structure to Ofsted)

### Evidence & Documents

#### `documents`
- **Purpose**: Uploaded/scanned documents (Google Drive, OneDrive, local)
- **Columns**:
  - `id` (bigserial, PK)
  - `organization_id` (uuid, FK)
  - `user_id` (text, FK)
  - `name` (text, not null)
  - `file_path` (text)
  - `file_type` (text) - mime type
  - `file_size` (bigint)
  - `provider` (text) - 'local', 'google_drive', 'onedrive'
  - `external_id` (text) - Cloud file ID
  - `web_view_link` (text)
  - `content` (text) - Extracted text for search
  - `content_hash` (text)
  - `embedding` (vector(1536)) - pgvector for semantic search
  - `folder_path` (text)
  - `scanned_at` (timestamp)
  - `created_at`, `updated_at` (timestamps)

#### `evidence_matches`
- **Purpose**: AI-identified evidence linked to framework subcategories
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `document_id` (bigint, FK → documents.id)
  - `framework_type` (text) - 'ofsted' | 'siams'
  - `category_id` (text, not null)
  - `subcategory_id` (text, not null)
  - `confidence` (decimal(3,2), 0-1)
  - `matched_keywords` (text[])
  - `relevance_explanation` (text)
  - `key_quotes` (text[])
  - `strengths` (text[])
  - `gaps` (text[])
  - `suggestions` (text[])
  - `document_link` (text)
  - `created_at`, `updated_at` (timestamps)

### Financial Data

#### `pupil_premium_data`
- **Purpose**: Pupil Premium funding and outcomes data
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `academic_year` (text, not null) - e.g., '2024-25'
  - `total_pupils` (integer)
  - `pp_pupils` (integer)
  - `pp_percentage` (decimal(5,2))
  - `pp_allocation` (decimal(12,2))
  - `recovery_premium` (decimal(12,2))
  - `total_funding` (decimal(12,2))
  - `barriers` (jsonb) - Array of barrier objects
  - `outcomes` (jsonb) - {reading: {pp: 65, non_pp: 78, national: 72}, ...}
  - `pp_attendance` (decimal(5,2))
  - `non_pp_attendance` (decimal(5,2))
  - `pp_persistent_absence` (decimal(5,2))
  - `created_at`, `updated_at` (timestamps)
  - **Unique**: (organization_id, academic_year)

#### `pp_spending`
- **Purpose**: Pupil Premium spending breakdown (EEF Tier 1, 2, 3)
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `academic_year` (text, not null)
  - `tier` (integer) - 1, 2, or 3
  - `activity_name` (text, not null)
  - `description` (text)
  - `eef_strategy_id` (text)
  - `eef_impact_months` (decimal(3,1))
  - `allocated_amount` (decimal(10,2))
  - `actual_spent` (decimal(10,2))
  - `barrier_ids` (text[])
  - `intended_outcomes` (text)
  - `success_criteria` (text)
  - `actual_impact` (text)
  - `impact_rating` (text) - 'high', 'moderate', 'low', 'not_measured'
  - `staff_lead` (text)
  - `created_at`, `updated_at` (timestamps)

#### `sports_premium_data`
- **Purpose**: Sports Premium funding data
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `academic_year` (text, not null)
  - `allocation` (decimal(10,2))
  - `carried_forward` (decimal(10,2))
  - `total_available` (decimal(10,2))
  - `swimming_25m_percentage` (decimal(5,2))
  - `swimming_strokes_percentage` (decimal(5,2))
  - `swimming_rescue_percentage` (decimal(5,2))
  - `created_at`, `updated_at` (timestamps)
  - **Unique**: (organization_id, academic_year)

#### `sports_premium_spending`
- **Purpose**: Sports Premium spending (5 Key Indicators)
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `academic_year` (text, not null)
  - `key_indicator` (integer) - 1-5
  - `activity_name` (text, not null)
  - `description` (text)
  - `allocated_amount` (decimal(10,2))
  - `actual_spent` (decimal(10,2))
  - `intended_impact` (text)
  - `actual_impact` (text)
  - `is_sustainable` (boolean)
  - `sustainability_plan` (text)
  - `created_at`, `updated_at` (timestamps)

### Operations Tables

#### `actions`
- **Purpose**: Improvement actions linked to framework areas
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `framework_type` (text) - 'ofsted' | 'siams'
  - `category_id` (text)
  - `subcategory_id` (text)
  - `title` (text, not null)
  - `description` (text)
  - `success_criteria` (text)
  - `eef_strategy` (text)
  - `eef_impact_months` (decimal(3,1))
  - `priority` (text) - 'critical', 'high', 'medium', 'low'
  - `status` (text) - 'draft', 'approved', 'in_progress', 'completed', 'cancelled'
  - `owner_id` (text, FK → users.id)
  - `owner_name` (text)
  - `due_date` (date)
  - `completed_date` (date)
  - `approved_by`, `approved_at` (references)
  - `source` (text) - 'manual', 'ed_recommendation', 'scan_gap', 'observation'
  - `created_by`, `created_at`, `updated_at` (references)

#### `sdp_priorities`, `sdp_milestones`
- **Purpose**: School Development Plan priorities and milestones

#### `lesson_observations`
- **Purpose**: Lesson observation records
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `date` (date, not null)
  - `teacher_name` (text, not null)
  - `subject` (text)
  - `year_group` (text)
  - `focus_area` (text)
  - `duration_minutes` (integer)
  - `rating_subject_knowledge` (integer, 1-4)
  - `rating_pedagogical_skills` (integer, 1-4)
  - `rating_adaptive_teaching` (integer, 1-4)
  - `rating_assessment` (integer, 1-4)
  - `rating_behaviour` (integer, 1-4)
  - `rating_engagement` (integer, 1-4)
  - `overall_judgement` (text) - 'exceptional', 'strong_standard', 'expected_standard', 'needs_attention', 'urgent_improvement'
  - `strengths`, `areas_for_development`, `next_steps` (text)
  - `is_scheme_followed`, `is_cpd_needed`, `is_support_plan_needed` (boolean)
  - `linked_framework_area` (text)
  - `observer_id`, `observer_name` (references)
  - `created_at`, `updated_at` (timestamps)

#### `statutory_documents`
- **Purpose**: SEF, SDP, PP Strategy, Sports Premium reports, etc.
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `document_type` (text) - 'sef', 'siams_sef', 'sdp', 'pp_strategy', 'sports_premium', 'accessibility', 'behaviour_policy', 'other'
  - `title` (text, not null)
  - `academic_year` (text)
  - `content` (jsonb, not null)
  - `version` (integer, default 1)
  - `is_current` (boolean, default true)
  - `previous_version_id` (uuid, FK → statutory_documents.id)
  - `status` (text) - 'draft', 'review', 'approved', 'published', 'archived'
  - `is_published_to_website` (boolean)
  - `website_publish_date` (timestamp)
  - `created_by`, `reviewed_by`, `approved_by` (references)
  - `reviewed_at`, `approved_at` (timestamps)
  - `deadline_date` (date)
  - `reminder_sent` (boolean)
  - `created_at`, `updated_at` (timestamps)

#### `meetings`, `meeting_actions`, `monitoring_visits`, `cpd_records`, `notes`, `activity_log`, `reminders`, `policies`, `surveys`, `survey_responses`, `external_visits`, `risks`
- **Purpose**: Various operational tables for school management

### Module & Entitlements System

#### `modules`
- **Purpose**: Available modules (App Store)
- **Columns**:
  - `id` (text, PK) - e.g., 'core', 'inspection_ready', 'finance_suite'
  - `key` (text, unique, not null) - e.g., 'core', 'ofsted_inspector', 'finance_bot'
  - `name` (text, not null)
  - `short_name` (text)
  - `category` (text)
  - `price_monthly` (decimal)
  - `price_annual` (decimal)
  - `features` (jsonb)
  - `default_limits` (jsonb)
  - `display_order` (integer)

#### `organization_modules`
- **Purpose**: Which modules each organization has purchased (entitlements)
- **Columns**:
  - `organization_id` (uuid, FK)
  - `module_id` (text, FK → modules.id)
  - `module_key` (text) - Denormalized for faster lookups
  - `enabled` (boolean, default true)
  - `enabled_at` (timestamp)
  - `expires_at` (timestamp)
  - `custom_limits` (jsonb)
  - `usage_current` (jsonb)
  - `usage_reset_at` (timestamp)
  - **Primary Key**: (organization_id, module_id)

#### `tool_definitions`
- **Purpose**: MCP tools and their module associations
- **Columns**:
  - `id` (uuid, PK)
  - `tool_key` (text, unique, not null) - e.g., 'get_financial_records'
  - `tool_name` (text, not null)
  - `description` (text)
  - `module_key` (text, FK → modules.key)
  - `risk_level` (text) - 'low', 'medium', 'high'
  - `requires_approval` (boolean, default false)
  - `approval_required_for` (text[])
  - `sanitize_inputs` (boolean, default true)
  - `sensitive_fields` (text[])
  - `is_active` (boolean, default true)
  - `created_at`, `updated_at` (timestamps)

#### `tool_audit_logs`
- **Purpose**: GDPR-compliant audit trail for all tool usage
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `user_id` (uuid, FK → auth.users.id)
  - `tool_name` (text, not null)
  - `tool_module_key` (text)
  - `request_inputs` (jsonb, not null) - Sanitized
  - `request_timestamp` (timestamp)
  - `response_output` (jsonb) - Sanitized
  - `response_timestamp` (timestamp)
  - `response_status` (text) - 'success', 'error', 'blocked', 'pending_approval'
  - `error_message` (text)
  - `risk_level` (text) - 'low', 'medium', 'high'
  - `requires_approval` (boolean)
  - `approved_by` (uuid, FK)
  - `approved_at` (timestamp)
  - `ip_address` (inet)
  - `user_agent` (text)
  - `session_id` (text)
  - `created_at` (timestamp)

#### `api_keys`
- **Purpose**: B2B partner API key authentication
- **Columns**:
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `name` (text, not null)
  - `key_hash` (text, unique, not null) - SHA-256 hash
  - `description` (text)
  - `permissions` (text[])
  - `expires_at` (timestamp)
  - `is_active` (boolean, default true)
  - `last_used_at` (timestamp)
  - `usage_count` (integer, default 0)
  - `created_by` (uuid, FK → auth.users.id)
  - `created_at`, `updated_at` (timestamps)

### Additional Tables

- `evidence_requirements` - Evidence requirements per subcategory
- `subscriptions` - Subscription management
- `usage_logs` - Usage tracking
- `ai_models` - AI model configuration
- `framework_updates` - Framework change tracking
- `scan_jobs` - Document scanning job tracking

---

## Installed Tools & Packages

### Root Dependencies (package.json)

**Runtime:**
- `@supabase/supabase-js` (^2.84.0) - Supabase client
- `next` (16.0.3) - Next.js framework
- `react` (19.2.0) - React library
- `react-dom` (19.2.0) - React DOM
- `zod` (^4.1.13) - Schema validation
- `openai` (^6.9.1) - OpenAI API client
- `firebase` (^12.6.0) - Firebase (legacy, being migrated)
- `framer-motion` (^12.23.24) - Animation library
- `lucide-react` (^0.554.0) - Icon library
- `mammoth` (^1.11.0) - DOCX parser
- `officeparser` (^5.2.2) - Office document parser
- `pdf2json` (^4.0.0) - PDF parser
- `pdfjs-dist` (^5.4.394) - PDF.js
- `xlsx` (^0.18.5) - Excel parser

**Dev:**
- `typescript` (^5) - TypeScript
- `tailwindcss` (^4) - CSS framework
- `vitest` (^2.1.8) - Testing framework
- `eslint` (^9) - Linting

### Package-Specific Dependencies

#### `@schoolgle/core`
- `@supabase/supabase-js` (^2.84.0)

#### `@schoolgle/mcp-server`
- `@modelcontextprotocol/sdk` (^0.5.0) - MCP SDK
- `@schoolgle/core` (*) - Internal dependency
- `@supabase/supabase-js` (^2.84.0)
- `zod` (^4.1.13)

---

## Current MCP Tools

### 1. `get_financial_records`

**Module**: `finance_bot`  
**Risk Level**: `low`  
**Requires Approval**: `false`

**Purpose**: Retrieves Pupil Premium and Sports Premium financial records for the authenticated organization.

**Input Schema** (Zod):
```typescript
{
  fiscalYear?: string          // YYYY-YY format (e.g., "2024-25"), optional
  category?: enum              // 'pupil_premium' | 'sports_premium' | 'both' (default: 'both')
  includeSpending?: boolean    // Include spending breakdown (default: false)
}
```

**Output**:
```typescript
{
  pupilPremium?: {
    data: {
      id, academicYear, totalPupils, ppPupils, ppPercentage,
      ppAllocation, recoveryPremium, totalFunding,
      barriers (jsonb), outcomes (jsonb),
      ppAttendance, nonPpAttendance, ppPersistentAbsence
    }
    spending?: Array<{
      tier (1|2|3), activityName, description, eefStrategyId,
      allocatedAmount, actualSpent, barrierIds,
      intendedOutcomes, successCriteria, actualImpact,
      impactRating, staffLead
    }>
  }
  sportsPremium?: {
    data: {
      id, academicYear, allocation, carriedForward, totalAvailable,
      swimming25mPercentage, swimmingStrokesPercentage, swimmingRescuePercentage
    }
    spending?: Array<{
      keyIndicator (1|2|3|4|5), activityName, description,
      allocatedAmount, actualSpent, intendedImpact, actualImpact,
      isSustainable, sustainabilityPlan
    }>
  }
  fiscalYear: string
  organizationId: string
}
```

**Security**: `organization_id` is injected from `AuthContext`, never from user input. RLS enforces tenant isolation.

---

### 2. `get_evidence_matches`

**Module**: `ofsted_inspector`  
**Risk Level**: `low`  
**Requires Approval**: `false`

**Purpose**: Retrieves evidence matches for a specific Ofsted subcategory, automatically filtered by organization.

**Input Schema** (Zod):
```typescript
{
  subcategoryId: string        // Required (e.g., "curriculum-teaching-1")
  frameworkType?: enum         // 'ofsted' | 'siams' (default: 'ofsted')
  categoryId?: string          // Optional category filter
  minConfidence?: number       // 0-1 (default: 0.5)
  limit?: number               // 1-100 (default: 20)
  includeDocumentDetails?: boolean // Default: true
}
```

**Output**:
```typescript
{
  matches: Array<{
    id, documentId, frameworkType, categoryId, subcategoryId,
    confidence, matchedKeywords, relevanceExplanation,
    keyQuotes, strengths, gaps, suggestions,
    documentLink, document?: {name, webViewLink, folderPath, mimeType, filePath}
  }>
  count: number
  subcategoryId: string
  frameworkType: 'ofsted' | 'siams'
  minConfidence: number
  organizationId: string
}
```

**Security**: `organization_id` is injected from `AuthContext`. RLS enforces tenant isolation.

---

### 3. `get_assessments`

**Module**: `ofsted_inspector`  
**Risk Level**: `low`  
**Requires Approval**: `false`

**Purpose**: Retrieves Ofsted assessment data including school self-assessments and AI-generated assessments for subcategories.

**Input Schema** (Zod):
```typescript
{
  subcategoryId?: string       // Optional filter
  categoryId?: string          // Optional filter
  includeNotAssessed?: boolean // Include "not_assessed" ratings (default: false)
  ratingFilter?: enum          // 'exceptional' | 'strong_standard' | 'expected_standard' | 'needs_attention' | 'urgent_improvement'
  minEvidenceCount?: number    // Minimum evidence count (default: 0)
  minQualityScore?: number     // 0-1, minimum quality score
}
```

**Output**:
```typescript
{
  assessments: Array<{
    id, subcategoryId, subcategoryName, categoryId, categoryName,
    schoolRating, schoolRationale,
    aiRating, aiRationale, aiConfidence,
    evidenceCount, evidenceQualityScore,
    assessedBy, assessedAt, createdAt, updatedAt
  }>
  count: number
  organizationId: string
  filters: { ... }  // Echo of applied filters
}
```

**Security**: `organization_id` is injected from `AuthContext`. RLS enforces tenant isolation.

---

## Auth & Security

### Dual-Auth System

The platform supports two authentication methods:

#### 1. User JWT Authentication (`authenticateUserJWT`)

**Flow**:
1. User provides Supabase Auth JWT token (Bearer token)
2. Extract `auth.uid()` → `userId`
3. Extract `organization_id` from JWT claims:
   - `user_metadata.organization_id` OR
   - `app_metadata.organization_id` OR
   - Fallback: Lookup from `organization_members` table
4. Verify user is member of organization
5. Return `AuthContext` with scoped Supabase client

**JWT Claims Structure**:
```json
{
  "sub": "user-uuid",
  "user_metadata": {
    "organization_id": "org-uuid",
    "role": "admin"
  }
}
```

#### 2. API Key Authentication (`authenticateAPIKey`)

**Flow**:
1. User provides API key (not Bearer token)
2. Hash API key with SHA-256
3. Lookup in `api_keys` table by `key_hash`
4. Verify key is active and not expired
5. Update `last_used_at` and `usage_count`
6. Return `AuthContext` with organization context

**API Key Structure**:
- Stored as SHA-256 hash in `api_keys.key_hash`
- Linked to `organization_id`
- Has `permissions` array, `expires_at`, `is_active` flag

### Row Level Security (RLS)

**Implementation**: All tenant-scoped tables have RLS enabled via migrations.

**Policy Pattern**:
```sql
-- Example: ofsted_assessments table
CREATE POLICY "Users can access their organization's assessments"
ON ofsted_assessments
FOR ALL
USING (
  organization_id = any(get_user_organization_ids())
  OR
  organization_id::text = current_setting('request.jwt.claims', true)::json->>'organization_id'
);
```

**Helper Functions**:

1. **`is_organization_member(org_id uuid)`**
   - Checks if `auth.uid()` is member of organization
   - Uses JWT claims for `organization_id` verification
   - Returns boolean

2. **`get_user_organization_ids()`**
   - Returns array of organization UUIDs user belongs to
   - Used in RLS policies for multi-org users

3. **`organization_has_module(org_id uuid, module_key_param text)`**
   - Checks if organization has purchased module
   - Used for tool entitlement filtering

4. **`get_available_tools(org_id uuid)`**
   - Returns tools available to organization based on module entitlements
   - Used by MCP server to filter tool list

**Security Features**:
- All functions use `SECURITY DEFINER` with `set search_path = ''` to prevent search_path injection
- RLS policies check both `auth.uid()` and JWT claims
- Service role key is only used for API key lookup (not data access)
- All tool handlers validate membership before querying

### Tool Safety Middleware

**Purpose**: GDPR-compliant audit logging and high-risk tool approval workflow.

**Features**:
1. **Audit Logging**: Every tool request/response logged to `tool_audit_logs`
2. **Input Sanitization**: Sensitive fields redacted in audit logs
3. **Approval Workflow**: High-risk tools require human approval before execution
4. **Risk Levels**: Tools marked as 'low', 'medium', or 'high' risk

**Process**:
1. Tool request received
2. Lookup tool definition in `tool_definitions`
3. Create audit log entry with sanitized inputs
4. Check if approval required (based on `risk_level` and `approval_required_for`)
5. If approval required: Block execution, return approval request ID
6. If approved: Execute tool handler
7. Log response (sanitized) to audit log

---

## Key Business Logic

### Core Package (`packages/core`)

**Purpose**: Shared authentication and security utilities.

**Exports**:
- `authenticate()` - Unified auth handler (JWT or API key)
- `authenticateUserJWT()` - User JWT authentication
- `authenticateAPIKey()` - API key authentication
- `AuthContext` interface - Context passed to all tools
- `getOrganizationIdFromJWT()` - Helper to extract org ID from JWT

**AuthContext Structure**:
```typescript
interface AuthContext {
  userId: string              // User UUID or "api_key:{id}"
  organizationId: string     // Organization UUID (from JWT or API key)
  userRole?: string          // 'admin', 'slt', 'teacher', etc.
  authType: 'user_jwt' | 'api_key'
  supabase: SupabaseClient   // RLS-scoped Supabase client
}
```

### MCP Server (`packages/mcp-server`)

**Architecture**:
- Uses `@modelcontextprotocol/sdk` for MCP protocol
- Supports both `stdio` and `sse` transports
- Connection-scoped authentication (context stored per connection)
- Tool filtering based on module entitlements

**Flow**:
1. Client connects to MCP server
2. Client authenticates via `auth/authenticate` endpoint
3. Server validates auth and stores `AuthContext` per connection
4. Client calls `tools/list` → Server filters tools by entitlements
5. Client calls `tools/call` → Server routes to handler, processes through safety middleware
6. Handler validates inputs with Zod, injects `organization_id` from context
7. Handler queries Supabase (RLS enforces tenant isolation)
8. Response logged to audit trail

**Tool Registration**:
- Tools registered in `tool_definitions` table
- Linked to modules via `module_key`
- MCP server queries `get_available_tools()` RPC to filter by entitlements
- Input schemas defined in `getToolInputSchema()` function

### Ed-Backend (`packages/ed-backend`)

**Purpose**: Education-specific backend services (context fetching, etc.)

**Key Functions**:
- `getSchoolgleContext()` - Fetches assessments, gaps, activity for organization
- Used by frontend applications for dashboard data

---

## Architecture Overview

### Multi-Tenancy

**Tenant Isolation**: Database-level via Row Level Security (RLS)
- Every tenant-scoped table has `organization_id` column
- RLS policies enforce `organization_id` matching from JWT claims
- No application-level filtering needed (RLS handles it)

**Context Injection**:
- `organization_id` extracted from JWT claims or API key
- Injected into all tool handlers via `AuthContext`
- Never accepted from user input (security)

### Module Entitlements (App Store)

**System**:
- Organizations purchase modules (stored in `organization_modules`)
- Tools linked to modules (stored in `tool_definitions.module_key`)
- MCP server filters available tools based on purchased modules
- Core module tools always available

**Modules**:
- `core` - Core platform (free)
- `ofsted_inspector` - Ofsted inspection tools (£49/mo)
- `finance_bot` - Financial analysis tools (£39/mo)

### GDPR Compliance

**Features**:
1. **EU Data Residency**: Supabase hosted in EU regions (eu-west-2, eu-central-1, eu-west-1)
2. **Audit Logging**: All tool usage logged to `tool_audit_logs`
3. **Data Sanitization**: Sensitive fields redacted in audit logs
4. **Approval Workflows**: High-risk operations require human approval
5. **Native Supabase Auth**: No custom auth middleware (uses Supabase Auth)

### Migration from Firebase

**Status**: In progress
- Currently using Firebase for user authentication (legacy)
- Migrating to native Supabase Auth
- `users.id` stores Firebase UID (text, not uuid)
- JWT claims will include `organization_id` once migration complete

---

## Next Steps for External Architect

1. **Review RLS Policies**: Verify all tenant-scoped tables have proper RLS policies
2. **Audit Security Functions**: Review `SECURITY DEFINER` functions for vulnerabilities
3. **Module System**: Evaluate entitlement system scalability
4. **MCP Tool Expansion**: Plan additional tools for Ofsted Inspector module
5. **Performance**: Review query patterns and indexing strategy
6. **Migration Strategy**: Plan Firebase → Supabase Auth migration completion

---

**End of Report**

