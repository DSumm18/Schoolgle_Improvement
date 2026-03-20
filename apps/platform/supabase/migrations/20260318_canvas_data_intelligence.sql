-- ============================================================================
-- SCHOOLGLE CANVAS — Data Intelligence Platform
-- Migration: 20260318_canvas_data_intelligence.sql
--
-- Phase 1: Smart Ingest, Semantic Field Matching, GDPR Reconciliation
-- ============================================================================

-- ============================================================================
-- 1. EXTEND DATA_SOURCES FOR CANVAS
-- ============================================================================

ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS canvas_visible boolean DEFAULT true;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS canvas_business_area text;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS trust_ranking integer DEFAULT 5;
ALTER TABLE data_sources ADD COLUMN IF NOT EXISTS schema_snapshot jsonb;

COMMENT ON COLUMN data_sources.trust_ranking IS 'Source of truth priority: 1=payroll (highest), 2=MIS, 3=HR system, 4=Schoolgle, 5=spreadsheet';
COMMENT ON COLUMN data_sources.schema_snapshot IS 'Column names and detected types from last successful read';

-- ============================================================================
-- 2. FIELD MAPPING REGISTRY (network effect — learns across all schools)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_field_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source identification
  source_system text NOT NULL,           -- 'arbor', 'bromcom', 'sims', 'every_hr', 'sage', 'unknown'
  source_column text NOT NULL,           -- original column name from export

  -- Target mapping
  target_entity text NOT NULL,           -- 'staff', 'pupil', 'transaction', 'attendance', 'supplier'
  target_field text NOT NULL,            -- Schoolgle canonical field name

  -- Confidence & detection
  confidence numeric DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  detection_method text NOT NULL CHECK (detection_method IN (
    'label_exact',        -- exact column name match
    'label_fuzzy',        -- fuzzy string match on column name
    'data_pattern',       -- regex/pattern match on data content
    'data_fingerprint',   -- statistical fingerprint (postcode, email, salary range, etc.)
    'user_confirmed',     -- human approved this mapping
    'ai_inferred'         -- AI semantic analysis
  )),

  -- Data pattern info (for data-based matching)
  data_pattern_regex text,               -- regex that matches this column's data
  data_pattern_description text,         -- human-readable: 'UK postcodes', 'email addresses', etc.
  sample_values text[],                  -- anonymised examples (max 5)

  -- Network effect tracking
  confirmed_count integer DEFAULT 0,     -- how many schools have confirmed this mapping
  rejected_count integer DEFAULT 0,      -- how many schools have rejected it
  last_confirmed_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(source_system, source_column, target_entity, target_field)
);

CREATE INDEX idx_canvas_field_mappings_source ON canvas_field_mappings(source_system, source_column);
CREATE INDEX idx_canvas_field_mappings_target ON canvas_field_mappings(target_entity, target_field);
CREATE INDEX idx_canvas_field_mappings_confidence ON canvas_field_mappings(confidence DESC);

COMMENT ON TABLE canvas_field_mappings IS 'Network-effect field mapping registry. Learns column mappings across all schools for auto-detection.';

-- ============================================================================
-- 3. CANVAS REPORTS (saved visualisations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by text NOT NULL,

  -- Content
  title text NOT NULL,
  business_area text NOT NULL,
  description text,

  -- Viz specification (declarative, not raw HTML)
  viz_spec jsonb,                        -- chart type, axes, series, filters, annotations
  viz_html_cache text,                   -- rendered HTML (regenerated from spec + fresh data)

  -- Data query
  query_spec jsonb,                      -- data query parameters (tables, filters, joins)
  data_source_ids uuid[],               -- which data_sources were used

  -- Template
  template_id uuid,                      -- if built from a canvas template

  -- Mode
  mode text DEFAULT 'snapshot' CHECK (mode IN ('snapshot', 'live')),

  -- Widget
  is_widget boolean DEFAULT false,
  widget_position integer,

  -- Sharing
  shared_with_roles text[],
  shared_with_users text[],

  -- Report pack
  report_pack_id uuid,
  report_pack_order integer,

  -- Branding snapshot (at time of creation)
  school_branding_snapshot jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_canvas_reports_org ON canvas_reports(organization_id);
CREATE INDEX idx_canvas_reports_area ON canvas_reports(organization_id, business_area);
CREATE INDEX idx_canvas_reports_widget ON canvas_reports(organization_id, is_widget) WHERE is_widget = true;

-- ============================================================================
-- 4. CANVAS SESSIONS (Ed conversation + stage tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id uuid REFERENCES canvas_reports(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id text NOT NULL,

  -- Stage machine
  stage text NOT NULL DEFAULT 'WELCOME',

  -- Conversation
  messages jsonb[] DEFAULT '{}',

  -- Data analysis
  anomalies_detected jsonb[] DEFAULT '{}',
  field_mappings_approved jsonb,         -- user-approved column mappings for this session
  reconciliation_findings jsonb,         -- discrepancies found during this session

  -- Template
  template_used uuid,
  refinement_count integer DEFAULT 0,

  -- Session type
  session_type text DEFAULT 'visualization' CHECK (session_type IN (
    'visualization',     -- building a chart/dashboard
    'reconciliation',    -- cross-system data check
    'migration',         -- MIS migration report
    'health_check',      -- proactive data quality scan
    'report_pack'        -- composing a report pack
  )),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_canvas_sessions_org ON canvas_sessions(organization_id);
CREATE INDEX idx_canvas_sessions_user ON canvas_sessions(organization_id, user_id);

-- ============================================================================
-- 5. RECONCILIATION LOG (GDPR Article 5(1)(d) audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_reconciliation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id uuid REFERENCES canvas_sessions(id) ON DELETE SET NULL,

  -- What entity was reconciled
  entity_type text NOT NULL CHECK (entity_type IN (
    'staff', 'pupil', 'supplier', 'asset', 'contact', 'address'
  )),
  entity_identifier text NOT NULL,       -- pseudonymised ID or staff_link_id
  field_name text NOT NULL,              -- 'address', 'pay_scale', 'email', 'phone', etc.

  -- The conflict
  source_a text NOT NULL,                -- system name: 'arbor', 'payroll', etc.
  source_a_value text,                   -- the value in source A
  source_b text NOT NULL,                -- system name
  source_b_value text,                   -- the value in source B

  -- Resolution
  resolution text NOT NULL CHECK (resolution IN (
    'accept_a', 'accept_b', 'manual_value', 'deferred', 'dismissed'
  )),
  resolved_value text,                   -- final value chosen (if manual_value)
  resolution_reason text,                -- user's justification

  -- GDPR compliance
  gdpr_article text DEFAULT 'Article 5(1)(d)',

  -- Approval
  approved_by text NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),

  -- Sync job (if auto-sync was created from this)
  sync_rule_id uuid,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_canvas_reconciliation_org ON canvas_reconciliation_log(organization_id);
CREATE INDEX idx_canvas_reconciliation_entity ON canvas_reconciliation_log(organization_id, entity_type, entity_identifier);
CREATE INDEX idx_canvas_reconciliation_date ON canvas_reconciliation_log(organization_id, approved_at DESC);

COMMENT ON TABLE canvas_reconciliation_log IS 'GDPR Article 5(1)(d) compliance audit trail. Every data reconciliation decision is logged with who approved what, when, and why.';

-- ============================================================================
-- 6. STANDING RECONCILIATION RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_reconciliation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Rule definition
  entity_type text NOT NULL,
  field_name text NOT NULL,
  preferred_source text NOT NULL,        -- which system wins: 'payroll', 'arbor', etc.
  override_source text NOT NULL,         -- which system gets overridden

  -- Automation
  auto_apply boolean DEFAULT false,      -- true = apply without re-approval each time
  requires_annual_review boolean DEFAULT true,

  -- Approval
  approved_by text NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  last_reviewed_at timestamptz,
  next_review_due timestamptz,

  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(organization_id, entity_type, field_name, preferred_source, override_source)
);

CREATE INDEX idx_canvas_recon_rules_org ON canvas_reconciliation_rules(organization_id, is_active);

-- ============================================================================
-- 7. CANVAS TEMPLATES (pre-built starting points)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  name text NOT NULL,
  business_area text NOT NULL,
  description text,
  category text,                         -- 'attendance', 'finance', 'hr', 'send', 'governance', etc.

  -- Viz specification template (parameterised)
  viz_spec_template jsonb NOT NULL,

  -- Data requirements
  required_data_sources text[],          -- which tables/connectors needed
  required_tables text[],                -- Schoolgle tables needed

  -- Target audience
  target_roles text[],                   -- who this template is designed for

  -- System vs school-created
  is_system boolean DEFAULT true,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,

  -- Usage tracking
  usage_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_canvas_templates_area ON canvas_templates(business_area);
CREATE INDEX idx_canvas_templates_system ON canvas_templates(is_system) WHERE is_system = true;

-- ============================================================================
-- 8. REPORT PACKS (composable documents)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_report_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by text NOT NULL,

  -- Pack info
  title text NOT NULL,
  description text,

  -- Output configuration
  tone text DEFAULT 'governor_brief' CHECK (tone IN (
    'governor_brief',      -- formal, strategic, plain English
    'staff_update',        -- professional but warm, action-focused
    'ofsted_evidence',     -- evaluative, framework language
    'parent_communication',-- simple, reassuring, positive
    'trust_board',         -- data-heavy, benchmarked, risk-flagged
    'la_return',           -- compliant format, statutory language
    'custom'               -- user-defined tone instructions
  )),
  custom_tone_instructions text,         -- if tone = 'custom'
  output_formats text[] DEFAULT '{pdf}',

  -- Template or custom
  is_template boolean DEFAULT false,

  -- Schedule
  schedule text,                         -- 'termly', 'monthly', 'half_termly', null (manual)
  last_generated_at timestamptz,
  next_due_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_canvas_report_packs_org ON canvas_report_packs(organization_id);

-- ============================================================================
-- 9. DATA FINGERPRINT PATTERNS (for semantic field matching)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_data_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern definition
  name text NOT NULL UNIQUE,             -- 'uk_postcode', 'email', 'uk_phone', 'salary_range', etc.
  description text NOT NULL,

  -- Detection rules
  regex_pattern text,                    -- primary regex
  regex_flags text DEFAULT 'i',
  min_match_ratio numeric DEFAULT 0.7,   -- % of non-null values that must match

  -- Statistical checks
  numeric_min numeric,                   -- for range-based detection
  numeric_max numeric,
  typical_cardinality text,              -- 'low' (<20 unique), 'medium', 'high' (>80% unique)

  -- What it maps to
  likely_entity text NOT NULL,           -- 'staff', 'pupil', 'transaction', etc.
  likely_field text NOT NULL,            -- 'postcode', 'email', 'salary', etc.

  -- Confidence when detected
  base_confidence numeric DEFAULT 0.7,

  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Seed data fingerprint patterns
INSERT INTO canvas_data_fingerprints (name, description, regex_pattern, likely_entity, likely_field, base_confidence, numeric_min, numeric_max, typical_cardinality) VALUES
  -- Identity patterns
  ('uk_postcode', 'UK postcode (e.g. SW1A 1AA)', '^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$', 'staff', 'postcode', 0.95, null, null, 'high'),
  ('email_address', 'Email address', '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', 'staff', 'email', 0.95, null, null, 'high'),
  ('uk_phone', 'UK phone number', '^(\+44|0)\d{9,10}$', 'staff', 'phone', 0.85, null, null, 'high'),
  ('uk_national_insurance', 'UK NI number', '^[A-Z]{2}\d{6}[A-D]$', 'staff', 'ni_number', 0.98, null, null, 'high'),
  ('uk_dbs_number', 'DBS certificate number (12 digits)', '^\d{12}$', 'staff', 'dbs_number', 0.80, null, null, 'high'),
  ('upn', 'Unique Pupil Number (13 chars)', '^[A-Z]\d{12}$', 'pupil', 'upn', 0.98, null, null, 'high'),

  -- Date patterns
  ('date_dd_mm_yyyy', 'Date DD/MM/YYYY', '^\d{2}/\d{2}/\d{4}$', 'staff', 'date_field', 0.60, null, null, 'high'),
  ('date_yyyy_mm_dd', 'Date YYYY-MM-DD (ISO)', '^\d{4}-\d{2}-\d{2}$', 'staff', 'date_field', 0.60, null, null, 'high'),

  -- Financial patterns
  ('salary_range', 'UK teacher/support salary (£15k-£130k)', null, 'staff', 'salary', 0.85, 15000, 130000, 'medium'),
  ('pay_scale_point', 'DfE pay scale point (M1-M6, U1-U3, L1-L43)', '^(M[1-6]|U[1-3]|L\d{1,2}|UQ[1-6])$', 'staff', 'pay_scale', 0.95, null, null, 'low'),
  ('cfr_code', 'DfE CFR code (I01-I17, E01-E32)', '^[IE]\d{2}$', 'transaction', 'cfr_code', 0.95, null, null, 'low'),
  ('money_gbp', 'GBP amount (£ or numeric)', '^£?\d{1,3}(,\d{3})*(\.\d{2})?$', 'transaction', 'amount', 0.70, null, null, 'high'),

  -- Education patterns
  ('year_group', 'Year group (R, 1-13)', '^(R|Reception|Nursery|[1-9]|1[0-3]|Year\s*\d{1,2})$', 'pupil', 'year_group', 0.90, null, null, 'low'),
  ('sen_status', 'SEN status (N, K, E)', '^(N|K|E|No SEN|SEN Support|EHCP|None)$', 'pupil', 'sen_status', 0.90, null, null, 'low'),
  ('gender', 'Gender (M/F/Male/Female)', '^(M|F|Male|Female|Boy|Girl|Other|Non-binary)$', 'pupil', 'gender', 0.85, null, null, 'low'),
  ('boolean_yn', 'Yes/No boolean', '^(Y|N|Yes|No|TRUE|FALSE|1|0)$', 'staff', 'boolean_field', 0.60, null, null, 'low'),

  -- System-specific patterns
  ('arbor_employee_id', 'Arbor employee ID (numeric, 4-8 digits)', '^\d{4,8}$', 'staff', 'employee_id', 0.50, null, null, 'high'),
  ('urn', 'School URN (6 digits)', '^\d{6}$', 'school', 'urn', 0.80, null, null, 'low')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 10. SOURCE SYSTEM SIGNATURES (for auto-detection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_source_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- System identification
  system_name text NOT NULL,             -- 'arbor', 'bromcom', 'sims', 'every_hr', etc.
  system_category text NOT NULL,         -- 'mis', 'finance', 'hr', 'payroll'
  export_type text NOT NULL,             -- 'staff', 'pupils', 'attendance', 'transactions'

  -- Signature: columns that identify this system's export
  signature_columns text[] NOT NULL,     -- columns that MUST be present
  optional_columns text[],               -- columns that are often present
  column_count_min integer,              -- typical min columns
  column_count_max integer,              -- typical max columns

  -- Pre-built field mapping
  default_mappings jsonb NOT NULL,       -- {source_col: {target_entity, target_field, confidence}}

  -- Detection confidence
  match_confidence numeric DEFAULT 0.8,

  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(system_name, export_type)
);

-- Seed source system signatures
INSERT INTO canvas_source_signatures (system_name, system_category, export_type, signature_columns, optional_columns, default_mappings, match_confidence) VALUES

-- Arbor Staff Export
('arbor', 'mis', 'staff',
  ARRAY['Employee ID', 'First Name', 'Last Name', 'Email', 'Job Title'],
  ARRAY['Date of Birth', 'Start Date', 'End Date', 'NI Number', 'Pay Scale', 'Staff Code', 'Department', 'Contract Type', 'FTE', 'Payroll Number'],
  '{
    "Employee ID": {"target_entity": "staff", "target_field": "employee_id", "confidence": 0.95},
    "First Name": {"target_entity": "staff", "target_field": "first_name", "confidence": 0.99},
    "Last Name": {"target_entity": "staff", "target_field": "last_name", "confidence": 0.99},
    "Email": {"target_entity": "staff", "target_field": "email", "confidence": 0.99},
    "Job Title": {"target_entity": "staff", "target_field": "job_title", "confidence": 0.95},
    "Date of Birth": {"target_entity": "staff", "target_field": "date_of_birth", "confidence": 0.95},
    "Start Date": {"target_entity": "staff", "target_field": "start_date", "confidence": 0.95},
    "End Date": {"target_entity": "staff", "target_field": "end_date", "confidence": 0.90},
    "NI Number": {"target_entity": "staff", "target_field": "ni_number", "confidence": 0.99},
    "Pay Scale": {"target_entity": "staff", "target_field": "pay_scale", "confidence": 0.95},
    "Staff Code": {"target_entity": "staff", "target_field": "staff_code", "confidence": 0.90},
    "Department": {"target_entity": "staff", "target_field": "department", "confidence": 0.85},
    "Contract Type": {"target_entity": "staff", "target_field": "contract_type", "confidence": 0.90},
    "FTE": {"target_entity": "staff", "target_field": "fte", "confidence": 0.95},
    "Payroll Number": {"target_entity": "staff", "target_field": "payroll_ref", "confidence": 0.90}
  }'::jsonb,
  0.90
),

-- Arbor Pupil Export
('arbor', 'mis', 'pupils',
  ARRAY['Student ID', 'UPN', 'Legal First Name', 'Legal Last Name'],
  ARRAY['Date of Birth', 'Year Group', 'Registration Group', 'FSM Eligible', 'Pupil Premium', 'SEN Status', 'Gender', 'Ethnicity', 'EAL'],
  '{
    "Student ID": {"target_entity": "pupil", "target_field": "student_id", "confidence": 0.95},
    "UPN": {"target_entity": "pupil", "target_field": "upn", "confidence": 0.99},
    "Legal First Name": {"target_entity": "pupil", "target_field": "first_name", "confidence": 0.99},
    "Legal Last Name": {"target_entity": "pupil", "target_field": "last_name", "confidence": 0.99},
    "Date of Birth": {"target_entity": "pupil", "target_field": "date_of_birth", "confidence": 0.95},
    "Year Group": {"target_entity": "pupil", "target_field": "year_group", "confidence": 0.95},
    "Registration Group": {"target_entity": "pupil", "target_field": "class", "confidence": 0.85},
    "FSM Eligible": {"target_entity": "pupil", "target_field": "fsm_eligible", "confidence": 0.95},
    "Pupil Premium": {"target_entity": "pupil", "target_field": "pupil_premium", "confidence": 0.95},
    "SEN Status": {"target_entity": "pupil", "target_field": "sen_status", "confidence": 0.95},
    "Gender": {"target_entity": "pupil", "target_field": "gender", "confidence": 0.95},
    "Ethnicity": {"target_entity": "pupil", "target_field": "ethnicity", "confidence": 0.90},
    "EAL": {"target_entity": "pupil", "target_field": "eal", "confidence": 0.90}
  }'::jsonb,
  0.92
),

-- Bromcom Staff Export
('bromcom', 'mis', 'staff',
  ARRAY['PersonID', 'Forename', 'Surname', 'EmailAddress'],
  ARRAY['DateOfBirth', 'StartDate', 'LeavingDate', 'NINumber', 'PayPoint', 'StaffType', 'FullPartTime', 'FTE'],
  '{
    "PersonID": {"target_entity": "staff", "target_field": "employee_id", "confidence": 0.95},
    "Forename": {"target_entity": "staff", "target_field": "first_name", "confidence": 0.99},
    "Surname": {"target_entity": "staff", "target_field": "last_name", "confidence": 0.99},
    "EmailAddress": {"target_entity": "staff", "target_field": "email", "confidence": 0.99},
    "DateOfBirth": {"target_entity": "staff", "target_field": "date_of_birth", "confidence": 0.95},
    "StartDate": {"target_entity": "staff", "target_field": "start_date", "confidence": 0.95},
    "LeavingDate": {"target_entity": "staff", "target_field": "end_date", "confidence": 0.90},
    "NINumber": {"target_entity": "staff", "target_field": "ni_number", "confidence": 0.99},
    "PayPoint": {"target_entity": "staff", "target_field": "pay_scale", "confidence": 0.85},
    "StaffType": {"target_entity": "staff", "target_field": "role_category", "confidence": 0.80},
    "FullPartTime": {"target_entity": "staff", "target_field": "contract_type", "confidence": 0.85},
    "FTE": {"target_entity": "staff", "target_field": "fte", "confidence": 0.95}
  }'::jsonb,
  0.88
),

-- SIMS Staff Export
('sims', 'mis', 'staff',
  ARRAY['Staff Code', 'Forename', 'Surname', 'Date of Birth'],
  ARRAY['Title', 'Gender', 'Email', 'Telephone', 'Start Date', 'Leaving Date', 'Post', 'Contract', 'Teaching Staff'],
  '{
    "Staff Code": {"target_entity": "staff", "target_field": "staff_code", "confidence": 0.95},
    "Forename": {"target_entity": "staff", "target_field": "first_name", "confidence": 0.99},
    "Surname": {"target_entity": "staff", "target_field": "last_name", "confidence": 0.99},
    "Date of Birth": {"target_entity": "staff", "target_field": "date_of_birth", "confidence": 0.95},
    "Title": {"target_entity": "staff", "target_field": "title", "confidence": 0.90},
    "Gender": {"target_entity": "staff", "target_field": "gender", "confidence": 0.90},
    "Email": {"target_entity": "staff", "target_field": "email", "confidence": 0.99},
    "Telephone": {"target_entity": "staff", "target_field": "phone", "confidence": 0.85},
    "Start Date": {"target_entity": "staff", "target_field": "start_date", "confidence": 0.95},
    "Leaving Date": {"target_entity": "staff", "target_field": "end_date", "confidence": 0.90},
    "Post": {"target_entity": "staff", "target_field": "job_title", "confidence": 0.85},
    "Contract": {"target_entity": "staff", "target_field": "contract_type", "confidence": 0.85},
    "Teaching Staff": {"target_entity": "staff", "target_field": "is_teaching", "confidence": 0.90}
  }'::jsonb,
  0.88
),

-- Every HR Staff Export
('every_hr', 'hr', 'staff',
  ARRAY['Employee First Name', 'Surname', 'Email Address'],
  ARRAY['Employee Number', 'Date of Birth', 'Date Joined', 'Date Left', 'NI Number', 'Job Title', 'Department', 'Salary', 'Contract Hours', 'Address Line 1', 'Postcode', 'Emergency Contact'],
  '{
    "Employee First Name": {"target_entity": "staff", "target_field": "first_name", "confidence": 0.99},
    "Surname": {"target_entity": "staff", "target_field": "last_name", "confidence": 0.99},
    "Email Address": {"target_entity": "staff", "target_field": "email", "confidence": 0.99},
    "Employee Number": {"target_entity": "staff", "target_field": "employee_id", "confidence": 0.90},
    "Date of Birth": {"target_entity": "staff", "target_field": "date_of_birth", "confidence": 0.95},
    "Date Joined": {"target_entity": "staff", "target_field": "start_date", "confidence": 0.95},
    "Date Left": {"target_entity": "staff", "target_field": "end_date", "confidence": 0.90},
    "NI Number": {"target_entity": "staff", "target_field": "ni_number", "confidence": 0.99},
    "Job Title": {"target_entity": "staff", "target_field": "job_title", "confidence": 0.95},
    "Department": {"target_entity": "staff", "target_field": "department", "confidence": 0.85},
    "Salary": {"target_entity": "staff", "target_field": "salary", "confidence": 0.95},
    "Contract Hours": {"target_entity": "staff", "target_field": "contract_hours", "confidence": 0.90},
    "Address Line 1": {"target_entity": "staff", "target_field": "address_line_1", "confidence": 0.95},
    "Postcode": {"target_entity": "staff", "target_field": "postcode", "confidence": 0.95},
    "Emergency Contact": {"target_entity": "staff", "target_field": "emergency_contact", "confidence": 0.85}
  }'::jsonb,
  0.85
),

-- LA Payroll Export (SAP/Oracle format)
('la_payroll', 'payroll', 'staff',
  ARRAY['FORENAME', 'SURNAME', 'PAYROLL_REF'],
  ARRAY['EMPLOYEE_NO', 'NI_NO', 'DOB', 'EMPLOY_START', 'GRADE', 'POINT', 'FTE', 'ANNUAL_SALARY', 'WORK_EMAIL', 'HOME_ADDRESS_1', 'HOME_POSTCODE', 'BANK_SORT', 'TAX_CODE', 'NI_CATEGORY'],
  '{
    "FORENAME": {"target_entity": "staff", "target_field": "first_name", "confidence": 0.99},
    "SURNAME": {"target_entity": "staff", "target_field": "last_name", "confidence": 0.99},
    "PAYROLL_REF": {"target_entity": "staff", "target_field": "payroll_ref", "confidence": 0.99},
    "EMPLOYEE_NO": {"target_entity": "staff", "target_field": "employee_id", "confidence": 0.90},
    "NI_NO": {"target_entity": "staff", "target_field": "ni_number", "confidence": 0.99},
    "DOB": {"target_entity": "staff", "target_field": "date_of_birth", "confidence": 0.95},
    "EMPLOY_START": {"target_entity": "staff", "target_field": "start_date", "confidence": 0.95},
    "GRADE": {"target_entity": "staff", "target_field": "pay_scale", "confidence": 0.85},
    "POINT": {"target_entity": "staff", "target_field": "pay_point", "confidence": 0.90},
    "FTE": {"target_entity": "staff", "target_field": "fte", "confidence": 0.95},
    "ANNUAL_SALARY": {"target_entity": "staff", "target_field": "salary", "confidence": 0.99},
    "WORK_EMAIL": {"target_entity": "staff", "target_field": "email", "confidence": 0.99},
    "HOME_ADDRESS_1": {"target_entity": "staff", "target_field": "address_line_1", "confidence": 0.95},
    "HOME_POSTCODE": {"target_entity": "staff", "target_field": "postcode", "confidence": 0.95}
  }'::jsonb,
  0.85
),

-- Sage Finance Export
('sage', 'finance', 'transactions',
  ARRAY['Nominal Code', 'Date', 'Reference', 'Details', 'Amount'],
  ARRAY['Type', 'Tax Code', 'Dept', 'Bank', 'Net Amount', 'VAT Amount'],
  '{
    "Nominal Code": {"target_entity": "transaction", "target_field": "nominal_code", "confidence": 0.95},
    "Date": {"target_entity": "transaction", "target_field": "transaction_date", "confidence": 0.95},
    "Reference": {"target_entity": "transaction", "target_field": "reference", "confidence": 0.90},
    "Details": {"target_entity": "transaction", "target_field": "description", "confidence": 0.90},
    "Amount": {"target_entity": "transaction", "target_field": "amount", "confidence": 0.95},
    "Type": {"target_entity": "transaction", "target_field": "transaction_type", "confidence": 0.85},
    "Tax Code": {"target_entity": "transaction", "target_field": "vat_code", "confidence": 0.90},
    "Dept": {"target_entity": "transaction", "target_field": "department", "confidence": 0.85},
    "Net Amount": {"target_entity": "transaction", "target_field": "net_amount", "confidence": 0.95},
    "VAT Amount": {"target_entity": "transaction", "target_field": "vat_amount", "confidence": 0.95}
  }'::jsonb,
  0.85
)

ON CONFLICT (system_name, export_type) DO NOTHING;

-- ============================================================================
-- 11. RLS POLICIES
-- ============================================================================

-- canvas_reports
ALTER TABLE canvas_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read canvas reports in their org" ON canvas_reports;
CREATE POLICY "Users can read canvas reports in their org"
  ON canvas_reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = canvas_reports.organization_id
      AND om.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert canvas reports in their org" ON canvas_reports;
CREATE POLICY "Users can insert canvas reports in their org"
  ON canvas_reports FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = canvas_reports.organization_id
      AND om.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Creators can update their canvas reports" ON canvas_reports;
CREATE POLICY "Creators can update their canvas reports"
  ON canvas_reports FOR UPDATE TO authenticated
  USING (created_by = auth.uid()::text);

DROP POLICY IF EXISTS "Creators can delete their canvas reports" ON canvas_reports;
CREATE POLICY "Creators can delete their canvas reports"
  ON canvas_reports FOR DELETE TO authenticated
  USING (created_by = auth.uid()::text);

-- canvas_sessions
ALTER TABLE canvas_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own canvas sessions" ON canvas_sessions;
CREATE POLICY "Users can read their own canvas sessions"
  ON canvas_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert canvas sessions" ON canvas_sessions;
CREATE POLICY "Users can insert canvas sessions"
  ON canvas_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own canvas sessions" ON canvas_sessions;
CREATE POLICY "Users can update their own canvas sessions"
  ON canvas_sessions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text);

-- canvas_reconciliation_log
ALTER TABLE canvas_reconciliation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read reconciliation logs in their org" ON canvas_reconciliation_log;
CREATE POLICY "Users can read reconciliation logs in their org"
  ON canvas_reconciliation_log FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = canvas_reconciliation_log.organization_id
      AND om.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can insert reconciliation logs" ON canvas_reconciliation_log;
CREATE POLICY "Users can insert reconciliation logs"
  ON canvas_reconciliation_log FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = canvas_reconciliation_log.organization_id
      AND om.user_id = auth.uid()::text
    )
  );

-- canvas_reconciliation_rules
ALTER TABLE canvas_reconciliation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read reconciliation rules in their org" ON canvas_reconciliation_rules;
CREATE POLICY "Users can read reconciliation rules in their org"
  ON canvas_reconciliation_rules FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = canvas_reconciliation_rules.organization_id
      AND om.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Admins can manage reconciliation rules" ON canvas_reconciliation_rules;
CREATE POLICY "Admins can manage reconciliation rules"
  ON canvas_reconciliation_rules FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = canvas_reconciliation_rules.organization_id
      AND om.user_id = auth.uid()::text
      AND om.role IN ('admin', 'headteacher', 'slt')
    )
  );

-- canvas_report_packs
ALTER TABLE canvas_report_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read report packs in their org" ON canvas_report_packs;
CREATE POLICY "Users can read report packs in their org"
  ON canvas_report_packs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = canvas_report_packs.organization_id
      AND om.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can manage report packs in their org" ON canvas_report_packs;
CREATE POLICY "Users can manage report packs in their org"
  ON canvas_report_packs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = canvas_report_packs.organization_id
      AND om.user_id = auth.uid()::text
    )
  );

-- canvas_field_mappings (global, no org scoping — network effect)
-- No RLS needed — these are shared across all schools for auto-detection
-- Write access via service role only

-- canvas_templates
ALTER TABLE canvas_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system templates" ON canvas_templates;
CREATE POLICY "Anyone can read system templates"
  ON canvas_templates FOR SELECT TO authenticated
  USING (is_system = true OR organization_id IN (
    SELECT om.organization_id FROM organization_members om
    WHERE om.user_id = auth.uid()::text
  ));

-- canvas_data_fingerprints (global reference data, no RLS)
-- Read-only, managed by Schoolgle

-- canvas_source_signatures (global reference data, no RLS)
-- Read-only, managed by Schoolgle

-- ============================================================================
-- 12. UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER update_canvas_reports_updated_at BEFORE UPDATE ON canvas_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_canvas_sessions_updated_at BEFORE UPDATE ON canvas_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_canvas_reconciliation_rules_updated_at BEFORE UPDATE ON canvas_reconciliation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER update_canvas_report_packs_updated_at BEFORE UPDATE ON canvas_report_packs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- DONE
-- ============================================================================
COMMENT ON TABLE canvas_reports IS 'Saved Canvas visualisations and report widgets';
COMMENT ON TABLE canvas_sessions IS 'Ed conversation history and stage tracking for Canvas sessions';
COMMENT ON TABLE canvas_reconciliation_log IS 'GDPR Article 5(1)(d) audit trail — every data reconciliation decision logged';
COMMENT ON TABLE canvas_reconciliation_rules IS 'Standing rules for automatic data reconciliation between systems';
COMMENT ON TABLE canvas_templates IS 'Pre-built and school-created canvas templates';
COMMENT ON TABLE canvas_report_packs IS 'Composable report packs with tone control';
COMMENT ON TABLE canvas_data_fingerprints IS 'Data pattern fingerprints for semantic field matching';
COMMENT ON TABLE canvas_source_signatures IS 'Export format signatures for auto-detecting source systems';
