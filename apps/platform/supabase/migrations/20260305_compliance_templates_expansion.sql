-- ============================================================
-- COMPLIANCE MODULE: EXPANDED TEMPLATE LIBRARY
-- Covers all statutory/recommended compliance areas for UK schools
-- Legislation sources: UK GDPR, DPA 2018, KCSIE 2024, H&S at Work Act 1974,
-- Equality Act 2010, SEND Code of Practice 2015, Education Act 2002/2011,
-- School Governance Regulations 2013, Admissions Code 2021
-- ============================================================

-- ============================================================
-- DPO OUTSOURCE SERVICE (Vrisk Partnership Model)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_dpo_service (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  service_tier TEXT NOT NULL DEFAULT 'standard', -- standard, enhanced, premium
  dpo_provider TEXT NOT NULL DEFAULT 'vrisk', -- vrisk or internal
  consultant_name TEXT,
  consultant_email TEXT,
  consultant_phone TEXT,
  contract_start DATE,
  contract_end DATE,
  annual_fee_pence INT, -- stored in pence for accuracy
  schoolgle_fee_pct NUMERIC(5,2) DEFAULT 15.00, -- platform fee %
  vrisk_fee_pct NUMERIC(5,2) DEFAULT 85.00, -- consultant share %
  service_includes JSONB DEFAULT '[]',
  sla_response_hours INT DEFAULT 48,
  ico_registration_number TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, pending, expired, cancelled
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dpo_service_org ON compliance_dpo_service(organization_id);
ALTER TABLE compliance_dpo_service ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON compliance_dpo_service FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- CONSENT RECORDS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  consent_type TEXT NOT NULL, -- photo, trip, medical, biometric, research, marketing
  pupil_id TEXT, -- reference to pupil record
  pupil_name TEXT NOT NULL,
  parent_name TEXT,
  parent_email TEXT,
  granted BOOLEAN NOT NULL DEFAULT false,
  granted_date DATE,
  withdrawn_date DATE,
  scope TEXT, -- e.g. "school website, social media, local press"
  academic_year TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_org ON compliance_consent_records(organization_id);
CREATE INDEX idx_consent_type ON compliance_consent_records(organization_id, consent_type);
ALTER TABLE compliance_consent_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON compliance_consent_records FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SINGLE CENTRAL RECORD (SCR)
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_scr_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  staff_name TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date DATE,
  dbs_certificate_number TEXT,
  dbs_date DATE,
  dbs_type TEXT, -- enhanced, enhanced_barred, standard
  dbs_update_service BOOLEAN DEFAULT false,
  dbs_update_checked_date DATE,
  identity_verified BOOLEAN DEFAULT false,
  identity_verified_date DATE,
  qualifications_verified BOOLEAN DEFAULT false,
  qualifications_date DATE,
  right_to_work_verified BOOLEAN DEFAULT false,
  right_to_work_date DATE,
  prohibition_check BOOLEAN DEFAULT false,
  prohibition_check_date DATE,
  section_128_check BOOLEAN DEFAULT false,
  section_128_date DATE,
  overseas_check BOOLEAN DEFAULT false,
  overseas_check_date DATE,
  references_obtained BOOLEAN DEFAULT false,
  references_date DATE,
  medical_fitness BOOLEAN DEFAULT false,
  medical_fitness_date DATE,
  safer_recruitment_trained BOOLEAN DEFAULT false,
  disqualification_declaration BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, leaver
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scr_org ON compliance_scr_entries(organization_id);
ALTER TABLE compliance_scr_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON compliance_scr_entries FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- LOW-LEVEL CONCERNS LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_low_level_concerns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  reported_by_user_id UUID,
  reported_by_name TEXT NOT NULL,
  date_of_concern DATE NOT NULL,
  date_reported DATE NOT NULL,
  person_of_concern TEXT NOT NULL,
  person_role TEXT,
  description TEXT NOT NULL,
  context TEXT,
  action_taken TEXT,
  outcome TEXT,
  pattern_identified BOOLEAN DEFAULT false,
  escalated_to_lado BOOLEAN DEFAULT false,
  escalation_date DATE,
  reviewed_by_dsl BOOLEAN DEFAULT false,
  dsl_review_date DATE,
  dsl_notes TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open, reviewed, closed, escalated
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_llc_org ON compliance_low_level_concerns(organization_id);
ALTER TABLE compliance_low_level_concerns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON compliance_low_level_concerns FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- COMPLAINTS TRACKER
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  reference_number TEXT,
  complainant_name TEXT NOT NULL,
  complainant_relationship TEXT, -- parent, carer, member_of_public, staff, other
  date_received DATE NOT NULL,
  nature_of_complaint TEXT NOT NULL,
  category TEXT, -- curriculum, behaviour, bullying, staff_conduct, facilities, communication, send, other
  current_stage TEXT NOT NULL DEFAULT 'stage_1', -- stage_1, stage_2, stage_3, resolved, withdrawn
  stage_1_handler TEXT,
  stage_1_response_date DATE,
  stage_1_outcome TEXT,
  stage_2_handler TEXT,
  stage_2_response_date DATE,
  stage_2_outcome TEXT,
  stage_3_panel_date DATE,
  stage_3_panel_members TEXT[],
  stage_3_outcome TEXT,
  resolution_date DATE,
  lessons_learned TEXT,
  complainant_satisfied BOOLEAN,
  escalated_to_ofsted BOOLEAN DEFAULT false,
  escalated_to_esfa BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open, resolved, withdrawn
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_complaints_org ON compliance_complaints(organization_id);
ALTER TABLE compliance_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON compliance_complaints FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- FOI REQUEST TRACKER
-- ============================================================

CREATE TABLE IF NOT EXISTS compliance_foi_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  requester_name TEXT,
  requester_contact TEXT,
  date_received DATE NOT NULL,
  description TEXT NOT NULL,
  deadline_date DATE NOT NULL, -- 20 working days
  status TEXT NOT NULL DEFAULT 'received', -- received, in_progress, responded, refused, internal_review, ico_complaint
  exemptions_applied TEXT[], -- s.40, s.41, s.43 etc.
  response_date DATE,
  response_summary TEXT,
  fee_charged_pence INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_foi_org ON compliance_foi_requests(organization_id);
ALTER TABLE compliance_foi_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON compliance_foi_requests FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- NOTE: Skeletal templates removed. Expert-level templates are in:
--   20260305_compliance_templates_gdpr.sql (10 GDPR templates)
--   20260305_compliance_templates_safeguarding_hs.sql (12 Safeguarding/H&S templates)
--   20260305_compliance_templates_hr_gov_eq.sql (14 HR/Gov/Equality templates)
-- ============================================================



-- ============================================================
-- ADDITIONAL TRAINING COURSES
-- ============================================================

INSERT INTO compliance_training_courses (id, title, provider_name, category, validity_days, is_global, description) VALUES
  (gen_random_uuid(), 'Safer Recruitment Refresher', NULL, 'safeguarding', 1825, true, 'Safer recruitment refresher every 5 years for all panel members'),
  (gen_random_uuid(), 'Mental Health First Aid', NULL, 'wellbeing', 1095, true, 'Mental Health First Aid qualification (3-year renewal)'),
  (gen_random_uuid(), 'Positive Handling / Team Teach', NULL, 'behaviour', 365, true, 'Annual positive handling/restraint refresher'),
  (gen_random_uuid(), 'Anaphylaxis / Epi-Pen Training', NULL, 'health_safety', 365, true, 'Annual epi-pen training for staff with medical responsibilities'),
  (gen_random_uuid(), 'Medication Administration', NULL, 'health_safety', 365, true, 'Administration of medicines in schools training'),
  (gen_random_uuid(), 'Working at Heights', NULL, 'health_safety', 1095, true, 'Working at heights safety training (3-year renewal)'),
  (gen_random_uuid(), 'Food Hygiene (Level 2)', NULL, 'health_safety', 1095, true, 'Food hygiene certificate for kitchen/catering staff'),
  (gen_random_uuid(), 'Display Screen Equipment', NULL, 'health_safety', NULL, true, 'DSE assessment and awareness for office-based staff'),
  (gen_random_uuid(), 'COSHH Awareness', NULL, 'health_safety', 1095, true, 'Control of substances hazardous to health awareness'),
  (gen_random_uuid(), 'FGM Awareness', NULL, 'safeguarding', 365, true, 'Female genital mutilation awareness and mandatory reporting duty'),
  (gen_random_uuid(), 'CSE & CCE Awareness', NULL, 'safeguarding', 365, true, 'Child sexual exploitation and child criminal exploitation awareness'),
  (gen_random_uuid(), 'County Lines Awareness', NULL, 'safeguarding', 365, true, 'County lines and criminal exploitation awareness for school staff'),
  (gen_random_uuid(), 'Bereavement & Loss Support', NULL, 'wellbeing', NULL, true, 'Supporting bereaved children and families in schools'),
  (gen_random_uuid(), 'SEND Awareness', NULL, 'general', NULL, true, 'Awareness of special educational needs and disabilities'),
  (gen_random_uuid(), 'Autism Awareness', NULL, 'general', NULL, true, 'Understanding autism spectrum conditions in education')
ON CONFLICT DO NOTHING;
