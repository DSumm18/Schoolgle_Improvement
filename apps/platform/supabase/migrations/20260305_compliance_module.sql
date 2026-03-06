-- Compliance Module: Core Schema
-- Provides policy management, document builder, training checker, GDPR toolkit,
-- versioning, approvals, audit trails, and review scheduling.

-- ============================================================
-- ENUMS (idempotent - skip if already exists)
-- ============================================================

DO $$ BEGIN CREATE TYPE compliance_item_type AS ENUM ('policy','incident','dpia','sar','breach','evidence_pack','doc'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE compliance_doc_status AS ENUM ('draft','in_review','approved','published','archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE confidentiality_level AS ENUM ('public_internal','restricted','highly_restricted'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE content_format AS ENUM ('html','markdown','docx_render','pdf_render'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE approval_stage AS ENUM ('author','slt_review','trust_review','governor_approval'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE approval_decision AS ENUM ('pending','approved','rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE review_frequency AS ENUM ('annual','termly','quarterly','custom_days'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE evidence_type AS ENUM ('certificate','minutes','signed_ack','photo','other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE template_type AS ENUM ('policy','incident','dpia','sar','breach','generic_doc'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE school_phase AS ENUM ('primary','secondary','all'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE training_source AS ENUM ('upload','manual','provider_sync'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE policy_category AS ENUM ('statutory','recommended','trust_required','school_custom'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================================
-- RETENTION POLICIES
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  retention_days INT NOT NULL DEFAULT 2555, -- ~7 years
  applies_to compliance_item_type[] NOT NULL DEFAULT '{}',
  auto_archive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- COMPLIANCE ITEMS (parent record for all compliance documents)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  trust_id UUID,
  type compliance_item_type NOT NULL,
  title TEXT NOT NULL,
  status compliance_doc_status NOT NULL DEFAULT 'draft',
  owner_user_id UUID,
  category policy_category DEFAULT 'school_custom',
  tags TEXT[] DEFAULT '{}',
  confidentiality_level confidentiality_level NOT NULL DEFAULT 'public_internal',
  retention_policy_id UUID REFERENCES compliance_retention_policies(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_items_org ON compliance_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_items_type ON compliance_items(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_compliance_items_status ON compliance_items(organization_id, status);

-- ============================================================
-- COMPLIANCE VERSIONS (version history for each item)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  source_template_id UUID,
  content_format content_format NOT NULL DEFAULT 'html',
  content_html TEXT,
  content_md TEXT,
  generated_from_chat_id UUID,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_summary TEXT,
  content_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_compliance_versions_item ON compliance_versions(compliance_item_id);
CREATE UNIQUE INDEX idx_compliance_versions_unique ON compliance_versions(compliance_item_id, version_number);

-- ============================================================
-- COMPLIANCE APPROVALS
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  version_id UUID REFERENCES compliance_versions(id) ON DELETE CASCADE,
  stage approval_stage NOT NULL DEFAULT 'author',
  approver_user_id UUID,
  approver_role TEXT,
  decision approval_decision NOT NULL DEFAULT 'pending',
  decision_notes TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_approvals_item ON compliance_approvals(compliance_item_id);
CREATE INDEX IF NOT EXISTS idx_compliance_approvals_pending ON compliance_approvals(approver_user_id) WHERE decision = 'pending';

-- ============================================================
-- COMPLIANCE REVIEW SCHEDULE
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  review_frequency TEXT NOT NULL DEFAULT 'annual',
  custom_days INT,
  next_review_date DATE,
  last_review_date DATE,
  reminder_days INT[] NOT NULL DEFAULT '{90,30,7,0}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_review_next ON compliance_review_schedule(next_review_date);
CREATE UNIQUE INDEX idx_compliance_review_item ON compliance_review_schedule(compliance_item_id);

-- ============================================================
-- COMPLIANCE TASKS
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  compliance_item_id UUID REFERENCES compliance_items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to_user_id UUID,
  assigned_to_role TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  evidence_required BOOLEAN NOT NULL DEFAULT false,
  created_by_user_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_tasks_org ON compliance_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tasks_assigned ON compliance_tasks(assigned_to_user_id) WHERE status != 'completed';

-- ============================================================
-- COMPLIANCE EVIDENCE FILES
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID REFERENCES compliance_items(id) ON DELETE CASCADE,
  task_id UUID REFERENCES compliance_tasks(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size INT,
  uploaded_by_user_id UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_type evidence_type NOT NULL DEFAULT 'other'
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_item ON compliance_evidence_files(compliance_item_id);

-- ============================================================
-- COMPLIANCE AUDIT LOG (immutable, insert-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_user_id UUID,
  actor_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_org ON compliance_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_entity ON compliance_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_created ON compliance_audit_log(organization_id, created_at DESC);

-- ============================================================
-- COMPLIANCE TEMPLATES
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type template_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  school_phase school_phase NOT NULL DEFAULT 'all',
  jurisdiction TEXT NOT NULL DEFAULT 'england',
  maintained_by TEXT NOT NULL DEFAULT 'schoolgle_core',
  version INT NOT NULL DEFAULT 1,
  content_html TEXT,
  json_schema JSONB DEFAULT '{}',
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_reference TEXT,
  is_statutory BOOLEAN NOT NULL DEFAULT false,
  dfe_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_templates_type ON compliance_templates(template_type);

-- ============================================================
-- STAFF ACKNOWLEDGEMENTS (for published policies)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  version_id UUID REFERENCES compliance_versions(id),
  user_id UUID NOT NULL,
  user_name TEXT,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT DEFAULT 'digital'
);

CREATE INDEX IF NOT EXISTS idx_compliance_ack_item ON compliance_acknowledgements(compliance_item_id);
CREATE UNIQUE INDEX idx_compliance_ack_unique ON compliance_acknowledgements(compliance_item_id, version_id, user_id);

-- ============================================================
-- TRAINING COURSES
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  provider_name TEXT,
  course_code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  accreditation TEXT,
  validity_days INT,
  category TEXT DEFAULT 'general',
  is_global BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_courses_org ON compliance_training_courses(organization_id);

-- ============================================================
-- TRAINING REQUIREMENTS (per role)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_training_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  trust_id UUID,
  role_key TEXT NOT NULL,
  course_id UUID NOT NULL REFERENCES compliance_training_courses(id) ON DELETE CASCADE,
  required BOOLEAN NOT NULL DEFAULT true,
  renewal_days INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_req_org ON compliance_training_requirements(organization_id);
CREATE UNIQUE INDEX idx_training_req_unique ON compliance_training_requirements(organization_id, role_key, course_id);

-- ============================================================
-- TRAINING COMPLETIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES compliance_training_courses(id) ON DELETE CASCADE,
  completed_at DATE NOT NULL,
  expires_at DATE,
  evidence_file_id UUID REFERENCES compliance_evidence_files(id),
  source training_source NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_comp_org ON compliance_training_completions(organization_id);
CREATE INDEX IF NOT EXISTS idx_training_comp_user ON compliance_training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_comp_expiry ON compliance_training_completions(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- GDPR: DPIA RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_dpia_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  processing_description TEXT,
  purpose TEXT,
  lawful_basis TEXT,
  data_categories TEXT[],
  special_category_data BOOLEAN NOT NULL DEFAULT false,
  recipients TEXT,
  transfers_outside_uk BOOLEAN NOT NULL DEFAULT false,
  necessity_assessment TEXT,
  proportionality_assessment TEXT,
  risks JSONB DEFAULT '[]',
  mitigations JSONB DEFAULT '[]',
  consultation_required BOOLEAN NOT NULL DEFAULT false,
  consultation_notes TEXT,
  signoff_user_id UUID,
  signoff_date DATE,
  review_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_dpia_item ON compliance_dpia_records(compliance_item_id);

-- ============================================================
-- GDPR: SAR RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_sar_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_relationship TEXT,
  date_received DATE NOT NULL,
  identity_verified BOOLEAN NOT NULL DEFAULT false,
  identity_verified_date DATE,
  deadline_date DATE NOT NULL,
  extension_applied BOOLEAN NOT NULL DEFAULT false,
  extension_reason TEXT,
  response_date DATE,
  data_provided TEXT,
  exemptions_applied TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_sar_item ON compliance_sar_records(compliance_item_id);

-- ============================================================
-- GDPR: BREACH RECORDS
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_breach_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  date_discovered DATE NOT NULL,
  date_occurred DATE,
  description TEXT NOT NULL,
  data_affected TEXT,
  individuals_affected INT,
  severity TEXT NOT NULL DEFAULT 'low',
  ico_notified BOOLEAN NOT NULL DEFAULT false,
  ico_notification_date DATE,
  ico_reference TEXT,
  individuals_notified BOOLEAN NOT NULL DEFAULT false,
  root_cause TEXT,
  actions_taken TEXT,
  preventive_measures TEXT,
  reported_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_breach_item ON compliance_breach_records(compliance_item_id);

-- ============================================================
-- RISK LINKS (cross-referencing compliance items to risk register)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_risk_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  risk_id UUID NOT NULL,
  compliance_item_id UUID NOT NULL REFERENCES compliance_items(id) ON DELETE CASCADE,
  link_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_links_org ON compliance_risk_links(organization_id);
CREATE UNIQUE INDEX idx_risk_links_unique ON compliance_risk_links(risk_id, compliance_item_id);

-- ============================================================
-- CHAT SESSIONS (for Ed document capture)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  purpose TEXT NOT NULL,
  template_id UUID REFERENCES compliance_templates(id),
  transcript JSONB DEFAULT '[]',
  extracted_fields JSONB DEFAULT '{}',
  compliance_item_id UUID REFERENCES compliance_items(id),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_org ON compliance_chat_sessions(organization_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_notif_user ON compliance_notifications(user_id, read);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_training_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_dpia_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_sar_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_breach_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_risk_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_retention_policies ENABLE ROW LEVEL SECURITY;

-- Service role bypass for all tables
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_items FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_versions FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_approvals FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_review_schedule FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_tasks FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_evidence_files FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_audit_log FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_templates FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_acknowledgements FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_training_courses FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_training_requirements FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_training_completions FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_dpia_records FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_sar_records FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_breach_records FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_risk_links FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_chat_sessions FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_notifications FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;
DO $$
 BEGIN
  EXECUTE 'CREATE POLICY "Service role full access" ON compliance_retention_policies FOR ALL USING (true) WITH CHECK (true);';
 EXCEPTION WHEN duplicate_object THEN null;
 END
$$;

-- Audit log is insert-only (no update/delete for regular users)
-- The service role policy above covers admin access

-- ============================================================
-- SEED: Default training courses (global)
-- ============================================================

INSERT INTO compliance_training_courses (id, title, provider_name, category, validity_days, is_global, description) VALUES
  (gen_random_uuid(), 'Safeguarding & Child Protection (Level 1)', NULL, 'safeguarding', 365, true, 'Annual safeguarding awareness training for all staff'),
  (gen_random_uuid(), 'Safeguarding & Child Protection (DSL)', NULL, 'safeguarding', 730, true, 'Designated Safeguarding Lead training (2-year renewal)'),
  (gen_random_uuid(), 'Prevent Duty', NULL, 'safeguarding', 365, true, 'Counter-terrorism awareness and Prevent duty training'),
  (gen_random_uuid(), 'First Aid at Work', NULL, 'health_safety', 1095, true, '3-day first aid at work qualification (3-year validity)'),
  (gen_random_uuid(), 'Paediatric First Aid', NULL, 'health_safety', 1095, true, 'Paediatric first aid for EYFS settings (3-year validity)'),
  (gen_random_uuid(), 'Fire Safety Awareness', NULL, 'health_safety', 365, true, 'Annual fire safety awareness for all staff'),
  (gen_random_uuid(), 'Fire Marshal', NULL, 'health_safety', 1095, true, 'Fire marshal/warden training (3-year renewal)'),
  (gen_random_uuid(), 'Manual Handling', NULL, 'health_safety', 1095, true, 'Manual handling awareness and technique training'),
  (gen_random_uuid(), 'GDPR & Data Protection', NULL, 'data_protection', 365, true, 'Annual data protection awareness training'),
  (gen_random_uuid(), 'Safer Recruitment', NULL, 'safeguarding', NULL, true, 'Safer recruitment training for interview panel members'),
  (gen_random_uuid(), 'Health & Safety Essentials', NULL, 'health_safety', 365, true, 'General H&S awareness for all staff'),
  (gen_random_uuid(), 'Asbestos Awareness', NULL, 'health_safety', 365, true, 'Asbestos awareness for site staff and caretakers'),
  (gen_random_uuid(), 'Legionella Awareness', NULL, 'health_safety', 365, true, 'Legionella risk and water hygiene awareness'),
  (gen_random_uuid(), 'Equality & Diversity', NULL, 'general', 365, true, 'Equality, diversity and inclusion training'),
  (gen_random_uuid(), 'Online Safety', NULL, 'safeguarding', 365, true, 'Online safety and digital safeguarding for staff')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED: Default policy templates
-- ============================================================

INSERT INTO compliance_templates (id, template_type, name, description, is_statutory, dfe_reference, json_schema, content_html) VALUES
(
  gen_random_uuid(),
  'policy',
  'Safeguarding & Child Protection Policy',
  'Statutory safeguarding policy aligned to Keeping Children Safe in Education. Must be reviewed annually and read by all staff.',
  true,
  'KCSIE 2024',
  '{"required_fields": ["school_name", "dsl_name", "dsl_contact", "deputy_dsl_name", "chair_of_governors", "local_authority", "lado_contact", "review_date"], "optional_fields": ["trust_name", "diocese", "online_safety_lead"]}',
  '<h1>Safeguarding and Child Protection Policy</h1>
<p><strong>School:</strong> {{school_name}}</p>
<p><strong>Designated Safeguarding Lead:</strong> {{dsl_name}} ({{dsl_contact}})</p>
<p><strong>Deputy DSL:</strong> {{deputy_dsl_name}}</p>
<p><strong>Chair of Governors:</strong> {{chair_of_governors}}</p>
<p><strong>Local Authority:</strong> {{local_authority}}</p>
<p><strong>LADO Contact:</strong> {{lado_contact}}</p>
<p><strong>Date of Last Review:</strong> {{review_date}}</p>
<hr/>
<h2>1. Purpose and Scope</h2>
<p>This policy applies to all staff, volunteers, and governors at {{school_name}}. It sets out our commitment to safeguarding and promoting the welfare of children in accordance with:</p>
<ul>
<li>Keeping Children Safe in Education (KCSIE) 2024</li>
<li>Working Together to Safeguard Children 2023</li>
<li>The Children Act 1989 and 2004</li>
<li>The Education Act 2002 (Section 175/157)</li>
</ul>
<h2>2. Roles and Responsibilities</h2>
<p>The Designated Safeguarding Lead (DSL) is {{dsl_name}}, who takes lead responsibility for safeguarding and child protection. The deputy DSL is {{deputy_dsl_name}}.</p>
<h2>3. Recognising Abuse and Neglect</h2>
<p>All staff should be aware of the indicators of abuse and neglect as outlined in Part 1 of KCSIE, which all staff must read.</p>
<h2>4. Reporting Concerns</h2>
<p>Any concern about a child must be reported immediately to the DSL. In their absence, report to the deputy DSL. If a child is at immediate risk of harm, call 999.</p>
<h2>5. Record Keeping</h2>
<p>All concerns, discussions and decisions made, and the reasons for those decisions, must be recorded in writing on the same day.</p>
<h2>6. Staff Training</h2>
<p>All staff receive safeguarding training at induction and regular updates thereafter. The DSL and deputy undertake training every two years.</p>
<h2>7. Online Safety</h2>
<p>This policy should be read alongside our Online Safety Policy. The school has appropriate filtering and monitoring systems in place.</p>
<h2>8. Review</h2>
<p>This policy will be reviewed annually by the governing body. Staff will be required to read and acknowledge Part 1 of KCSIE annually.</p>'
),
(
  gen_random_uuid(),
  'policy',
  'Complaints Procedure',
  'Statutory complaints procedure for parents and stakeholders. Must comply with DfE guidance on handling complaints.',
  true,
  'DfE Best Practice Guidance for School Complaints 2019',
  '{"required_fields": ["school_name", "headteacher_name", "chair_of_governors", "clerk_contact", "review_date"], "optional_fields": ["trust_name", "trust_complaints_contact"]}',
  '<h1>Complaints Procedure</h1>
<p><strong>School:</strong> {{school_name}}</p>
<p><strong>Headteacher:</strong> {{headteacher_name}}</p>
<p><strong>Chair of Governors:</strong> {{chair_of_governors}}</p>
<p><strong>Date of Last Review:</strong> {{review_date}}</p>
<hr/>
<h2>1. Introduction</h2>
<p>{{school_name}} is committed to dealing with all complaints fairly and promptly. This procedure applies to all complaints from parents, carers, and members of the public about any provision of facilities or services that we provide.</p>
<h2>2. Stages of the Complaints Procedure</h2>
<h3>Stage 1: Informal Resolution</h3>
<p>We encourage parents to raise concerns informally with the class teacher or relevant member of staff in the first instance.</p>
<h3>Stage 2: Formal Complaint to Headteacher</h3>
<p>If the matter is not resolved informally, a formal written complaint should be made to {{headteacher_name}}. The headteacher will acknowledge receipt within 5 school days and provide a written response within 15 school days.</p>
<h3>Stage 3: Appeal to Governors</h3>
<p>If the complainant is not satisfied with the response, they may write to the Chair of Governors ({{chair_of_governors}}) via the Clerk ({{clerk_contact}}). A panel of governors will convene within 20 school days.</p>
<h2>3. Recording and Monitoring</h2>
<p>All formal complaints are logged and monitored by the governing body on at least an annual basis.</p>
<h2>4. Review</h2>
<p>This procedure will be reviewed annually.</p>'
),
(
  gen_random_uuid(),
  'policy',
  'Data Protection & GDPR Policy',
  'Statutory data protection policy covering GDPR compliance, data processing, rights of data subjects, and breach procedures.',
  true,
  'UK GDPR / Data Protection Act 2018',
  '{"required_fields": ["school_name", "dpo_name", "dpo_contact", "headteacher_name", "review_date"], "optional_fields": ["trust_name", "trust_dpo_name", "ico_registration_number"]}',
  '<h1>Data Protection Policy</h1>
<p><strong>School:</strong> {{school_name}}</p>
<p><strong>Data Protection Officer:</strong> {{dpo_name}} ({{dpo_contact}})</p>
<p><strong>Date of Last Review:</strong> {{review_date}}</p>
<hr/>
<h2>1. Introduction</h2>
<p>{{school_name}} collects and uses personal data about pupils, parents, staff and other individuals. This policy sets out how we comply with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
<h2>2. Data Protection Principles</h2>
<p>We process personal data in accordance with the six data protection principles. Data is processed lawfully, fairly and transparently; collected for specified purposes; adequate and relevant; accurate; kept no longer than necessary; and processed securely.</p>
<h2>3. Lawful Basis for Processing</h2>
<p>We process personal data under various lawful bases including public task, legal obligation, contract, vital interests, and legitimate interests.</p>
<h2>4. Data Subject Rights</h2>
<p>Individuals have the right to be informed, access their data, rectification, erasure, restrict processing, data portability, and object to processing. Subject access requests should be directed to {{dpo_name}} at {{dpo_contact}}.</p>
<h2>5. Data Breaches</h2>
<p>Any data breach must be reported immediately to the DPO. Breaches that pose a risk to individuals will be reported to the ICO within 72 hours.</p>
<h2>6. Review</h2>
<p>This policy is reviewed annually by the governing body.</p>'
),
(
  gen_random_uuid(),
  'policy',
  'Staff Code of Conduct',
  'Code of conduct for all school staff covering professional standards, relationships, use of technology, and safeguarding expectations.',
  true,
  'DfE Statutory Guidance',
  '{"required_fields": ["school_name", "headteacher_name", "review_date"], "optional_fields": ["trust_name"]}',
  '<h1>Staff Code of Conduct</h1>
<p><strong>School:</strong> {{school_name}}</p>
<p><strong>Headteacher:</strong> {{headteacher_name}}</p>
<p><strong>Date of Last Review:</strong> {{review_date}}</p>
<hr/>
<h2>1. Purpose</h2>
<p>This code of conduct sets out the professional standards expected of all staff at {{school_name}}. It applies to all employees, volunteers, supply staff and contractors.</p>
<h2>2. Professional Conduct</h2>
<p>Staff must maintain high standards of ethics and behaviour at all times, both within and outside of school, where conduct could bring the school into disrepute.</p>
<h2>3. Safeguarding</h2>
<p>Staff must read and comply with Part 1 of Keeping Children Safe in Education. Any safeguarding concern must be reported immediately to the DSL.</p>
<h2>4. Relationships and Communication</h2>
<p>Staff must maintain professional boundaries with pupils at all times. Personal social media contact with current pupils is not permitted.</p>
<h2>5. Use of Technology</h2>
<p>Staff must use school technology systems responsibly and in accordance with our Acceptable Use Policy. Personal devices must not be used to photograph or film pupils.</p>
<h2>6. Dress and Appearance</h2>
<p>Staff should dress in a manner that is professional and appropriate to their role.</p>
<h2>7. Review</h2>
<p>This code of conduct is reviewed annually.</p>'
),
(
  gen_random_uuid(),
  'incident',
  'Incident Report Template',
  'Standard template for recording incidents involving pupils or staff. Captures key details for safeguarding and compliance.',
  false,
  NULL,
  '{"required_fields": ["incident_date", "incident_time", "location", "persons_involved", "description", "reporter_name", "reporter_role"], "optional_fields": ["witnesses", "actions_taken", "follow_up_required", "parents_informed", "external_agencies"]}',
  '<h1>Incident Report</h1>
<p><strong>Date:</strong> {{incident_date}} <strong>Time:</strong> {{incident_time}}</p>
<p><strong>Location:</strong> {{location}}</p>
<p><strong>Reported by:</strong> {{reporter_name}} ({{reporter_role}})</p>
<hr/>
<h2>Persons Involved</h2>
<p>{{persons_involved}}</p>
<h2>Description of Incident</h2>
<p>{{description}}</p>
<h2>Witnesses</h2>
<p>{{witnesses}}</p>
<h2>Actions Taken</h2>
<p>{{actions_taken}}</p>
<h2>Follow-up Required</h2>
<p>{{follow_up_required}}</p>
<p><strong>Parents/Carers Informed:</strong> {{parents_informed}}</p>
<p><strong>External Agencies Contacted:</strong> {{external_agencies}}</p>'
),
(
  gen_random_uuid(),
  'dpia',
  'Data Protection Impact Assessment',
  'DPIA template following ICO guidance. Use for any new processing activity that could result in a high risk to individuals.',
  false,
  'ICO DPIA Guidance',
  '{"required_fields": ["project_name", "data_controller", "dpo_name", "processing_description", "purpose", "lawful_basis"], "optional_fields": ["data_categories", "recipients", "retention_period", "transfers_outside_uk"]}',
  '<h1>Data Protection Impact Assessment</h1>
<p><strong>Project/System:</strong> {{project_name}}</p>
<p><strong>Data Controller:</strong> {{data_controller}}</p>
<p><strong>DPO:</strong> {{dpo_name}}</p>
<hr/>
<h2>Step 1: Describe the Processing</h2>
<p>{{processing_description}}</p>
<h2>Step 2: Purpose of Processing</h2>
<p>{{purpose}}</p>
<h2>Step 3: Lawful Basis</h2>
<p>{{lawful_basis}}</p>
<h2>Step 4: Necessity and Proportionality</h2>
<p>[Assess whether the processing is necessary and proportionate to the purpose]</p>
<h2>Step 5: Identify and Assess Risks</h2>
<p>[List risks to individuals and assess likelihood and severity]</p>
<h2>Step 6: Mitigating Measures</h2>
<p>[Describe measures to reduce or eliminate identified risks]</p>
<h2>Step 7: Sign-off</h2>
<p>[DPO sign-off and date]</p>'
)
ON CONFLICT DO NOTHING;
