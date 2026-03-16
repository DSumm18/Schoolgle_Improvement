-- ============================================================================
-- HR Personnel Records: Emergency Contacts, DBS, Qualifications, Training,
-- Right to Work, Medical Info, Disciplinary
-- ============================================================================

-- 1. Staff Emergency Contacts
CREATE TABLE IF NOT EXISTS staff_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- partner, parent, sibling, spouse, friend, other
  phone_primary TEXT NOT NULL,
  phone_secondary TEXT,
  email TEXT,
  address TEXT,
  is_next_of_kin BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 1, -- 1 = first contact, 2 = second, etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Staff DBS Records
CREATE TABLE IF NOT EXISTS staff_dbs_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  dbs_type TEXT NOT NULL CHECK (dbs_type IN ('enhanced', 'enhanced_barred', 'standard', 'basic')),
  certificate_number TEXT,
  issue_date DATE,
  -- DBS certificates don't expire, but schools re-check periodically
  last_checked_date DATE,
  next_check_due DATE,
  check_frequency_months INTEGER DEFAULT 36, -- typically 3 years
  checked_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'clear', 'flags_noted', 'barred', 'awaiting_result', 'expired_check')),
  barred_list_checked BOOLEAN DEFAULT false,
  children_barred_list BOOLEAN DEFAULT false,
  adults_barred_list BOOLEAN DEFAULT false,
  overseas_check_required BOOLEAN DEFAULT false,
  overseas_check_country TEXT,
  overseas_check_status TEXT CHECK (overseas_check_status IN ('not_required', 'pending', 'clear', 'flags_noted')),
  risk_assessment_done BOOLEAN DEFAULT false,
  risk_assessment_notes TEXT,
  update_service_registered BOOLEAN DEFAULT false,
  update_service_id TEXT,
  -- We do NOT store certificate content (GDPR sensitive personal data)
  -- We only record: checked yes/no, clear yes/no, date, reference
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Staff Qualifications
CREATE TABLE IF NOT EXISTS staff_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  qualification_type TEXT NOT NULL CHECK (qualification_type IN (
    'qts', 'pgce', 'bed', 'ba_education', 'npqh', 'npqsl', 'npqml', 'npqlt', 'npqltd', 'npqeyl',
    'hlta', 'eyts', 'send_qualification', 'first_aid_work', 'first_aid_paediatric', 'first_aid_emergency',
    'mental_health_first_aid', 'fire_marshal', 'manual_handling', 'food_hygiene',
    'degree', 'masters', 'doctorate', 'diploma', 'certificate', 'nvq',
    'iosh_managing_safely', 'nebosh_general', 'nebosh_fire', 'gas_safe', 'electrical',
    'other'
  )),
  qualification_name TEXT NOT NULL, -- e.g. "PGCE Primary Education"
  awarding_body TEXT, -- e.g. "University of Birmingham", "St John Ambulance"
  reference_number TEXT, -- certificate/registration number
  date_achieved DATE,
  expiry_date DATE, -- NULL if no expiry (e.g. degree), set for first aid (3yr), food hygiene (3yr)
  is_mandatory BOOLEAN DEFAULT false, -- school requires this for the role
  is_verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_date DATE,
  document_url TEXT, -- link to scanned certificate
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Staff Training Records
CREATE TABLE IF NOT EXISTS staff_training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  training_name TEXT NOT NULL, -- e.g. "Safeguarding Level 1", "GDPR Awareness"
  training_category TEXT NOT NULL CHECK (training_category IN (
    'safeguarding', 'child_protection', 'prevent', 'kcsie', 'fgm',
    'first_aid', 'fire_safety', 'health_safety', 'manual_handling',
    'gdpr_data_protection', 'cyber_security',
    'send', 'autism', 'dyslexia', 'mental_health',
    'behaviour_management', 'de_escalation', 'restraint',
    'curriculum', 'assessment', 'pedagogy', 'phonics', 'maths_mastery',
    'leadership', 'governance', 'finance',
    'ect_induction', 'nqt_mentoring',
    'equality_diversity', 'unconscious_bias',
    'food_hygiene', 'allergen_awareness',
    'it_systems', 'mis_training',
    'other'
  )),
  provider TEXT, -- who delivered the training
  training_type TEXT DEFAULT 'face_to_face' CHECK (training_type IN ('face_to_face', 'online', 'blended', 'self_study', 'conference', 'webinar', 'coaching', 'shadowing')),
  completion_date DATE NOT NULL,
  expiry_date DATE, -- when refresh is needed
  refresh_frequency_months INTEGER, -- e.g. 12 for annual safeguarding
  hours_completed NUMERIC(5,1),
  cost NUMERIC(10,2) DEFAULT 0,
  funded_by TEXT, -- school, personal, grant, etc.
  certificate_url TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'completed' CHECK (status IN ('booked', 'in_progress', 'completed', 'failed', 'cancelled', 'expired')),
  impact_notes TEXT, -- how training was applied
  cpd_points NUMERIC(5,1),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Staff Right to Work
CREATE TABLE IF NOT EXISTS staff_right_to_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  right_to_work_type TEXT NOT NULL CHECK (right_to_work_type IN (
    'british_citizen', 'irish_citizen', 'settled_status', 'pre_settled_status',
    'tier_2_visa', 'tier_5_visa', 'skilled_worker_visa', 'student_visa',
    'spouse_visa', 'indefinite_leave', 'refugee', 'eea_national',
    'other'
  )),
  document_type TEXT, -- passport, BRP, share code, etc.
  document_reference TEXT,
  check_date DATE NOT NULL,
  checked_by TEXT NOT NULL,
  expiry_date DATE, -- NULL if indefinite (e.g. British citizen)
  follow_up_check_date DATE, -- for time-limited right to work
  share_code TEXT, -- Home Office online share code
  restrictions TEXT, -- any work restrictions noted
  is_current BOOLEAN DEFAULT true,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Staff Medical Info (minimal — only what school legally needs)
CREATE TABLE IF NOT EXISTS staff_medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  -- Only store what's needed for duty of care / first aid response
  has_medical_conditions BOOLEAN DEFAULT false,
  conditions_summary TEXT, -- brief: "asthma, epipen carried"
  allergies TEXT, -- critical for first aiders to know
  medication_on_site BOOLEAN DEFAULT false,
  medication_location TEXT, -- "EpiPen in staffroom first aid kit"
  dietary_requirements TEXT,
  emergency_medical_notes TEXT, -- what first aider needs to know
  occupational_health_referral BOOLEAN DEFAULT false,
  occupational_health_date DATE,
  occupational_health_outcome TEXT,
  reasonable_adjustments TEXT, -- Equality Act 2010
  fit_to_work_confirmed BOOLEAN DEFAULT true,
  last_reviewed_date DATE,
  reviewed_by TEXT,
  -- Consent
  consent_to_share_with_first_aiders BOOLEAN DEFAULT false,
  consent_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, staff_id)
);

-- 7. Staff Disciplinary Records
CREATE TABLE IF NOT EXISTS staff_disciplinary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  case_type TEXT NOT NULL CHECK (case_type IN (
    'informal_conversation', 'verbal_warning', 'first_written_warning',
    'final_written_warning', 'dismissal', 'suspension',
    'capability_informal', 'capability_formal', 'capability_final',
    'grievance', 'appeal', 'investigation'
  )),
  case_reference TEXT, -- internal reference number
  start_date DATE NOT NULL,
  end_date DATE, -- when warning expires or case closes
  expiry_date DATE, -- when warning falls off record (typically 6/12 months)
  reason TEXT NOT NULL,
  details TEXT,
  investigating_officer TEXT,
  hearing_date DATE,
  hearing_panel TEXT, -- who was on the panel
  outcome TEXT,
  right_of_appeal_given BOOLEAN DEFAULT true,
  appeal_submitted BOOLEAN DEFAULT false,
  appeal_date DATE,
  appeal_outcome TEXT,
  union_representative TEXT,
  union_name TEXT,
  -- Document references (actual docs in Drive/OneDrive, we just track)
  investigation_report_url TEXT,
  outcome_letter_url TEXT,
  meeting_minutes_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'hearing_scheduled', 'concluded', 'appealed', 'expired', 'withdrawn')),
  is_live BOOLEAN DEFAULT true, -- false when expired/withdrawn
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Additional staff_directory columns (personal details)
-- ============================================================================

DO $$ BEGIN
  -- Date of birth (needed for pension, DBS, contracts)
  ALTER TABLE staff_directory ADD COLUMN date_of_birth DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN ethnicity TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN national_insurance_number TEXT; -- encrypted at app level
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN teacher_reference_number TEXT; -- TRN (7-digit DfE number)
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN address_line_1 TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN address_line_2 TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN city TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN postcode TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN personal_email TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN personal_phone TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN start_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN leaving_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN leaving_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN pension_scheme TEXT CHECK (pension_scheme IN ('teachers_pension', 'lgps', 'nest', 'opted_out', 'other'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN pension_reference TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE staff_directory ADD COLUMN payroll_number TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_staff_emergency_contacts_staff ON staff_emergency_contacts(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_emergency_contacts_org ON staff_emergency_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_dbs_records_staff ON staff_dbs_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_dbs_records_org ON staff_dbs_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_dbs_records_next_check ON staff_dbs_records(next_check_due);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_staff ON staff_qualifications(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_org ON staff_qualifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_expiry ON staff_qualifications(expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_type ON staff_qualifications(qualification_type);
CREATE INDEX IF NOT EXISTS idx_staff_training_records_staff ON staff_training_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_training_records_org ON staff_training_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_training_records_expiry ON staff_training_records(expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_training_records_category ON staff_training_records(training_category);
CREATE INDEX IF NOT EXISTS idx_staff_right_to_work_staff ON staff_right_to_work(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_right_to_work_expiry ON staff_right_to_work(expiry_date);
CREATE INDEX IF NOT EXISTS idx_staff_medical_info_staff ON staff_medical_info(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_disciplinary_staff ON staff_disciplinary(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_disciplinary_org ON staff_disciplinary(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_disciplinary_status ON staff_disciplinary(status);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE staff_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_dbs_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_right_to_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_disciplinary ENABLE ROW LEVEL SECURITY;

-- Emergency contacts: org members can read, SLT+ can manage
CREATE POLICY staff_emergency_contacts_read ON staff_emergency_contacts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
  ));
CREATE POLICY staff_emergency_contacts_manage ON staff_emergency_contacts FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
  ));

-- DBS: SLT+ only (sensitive)
CREATE POLICY staff_dbs_records_read ON staff_dbs_records FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
  ));
CREATE POLICY staff_dbs_records_manage ON staff_dbs_records FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher')
  ));

-- Qualifications: org members read, SLT+ manage
CREATE POLICY staff_qualifications_read ON staff_qualifications FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
  ));
CREATE POLICY staff_qualifications_manage ON staff_qualifications FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
  ));

-- Training: org members read, SLT+ manage
CREATE POLICY staff_training_records_read ON staff_training_records FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
  ));
CREATE POLICY staff_training_records_manage ON staff_training_records FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
  ));

-- Right to work: SLT+ only (sensitive)
CREATE POLICY staff_right_to_work_read ON staff_right_to_work FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
  ));
CREATE POLICY staff_right_to_work_manage ON staff_right_to_work FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher')
  ));

-- Medical: SLT+ read, headteacher manage (highly sensitive)
CREATE POLICY staff_medical_info_read ON staff_medical_info FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher', 'slt')
  ));
CREATE POLICY staff_medical_info_manage ON staff_medical_info FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher')
  ));

-- Disciplinary: headteacher only (highest sensitivity)
CREATE POLICY staff_disciplinary_read ON staff_disciplinary FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher')
  ));
CREATE POLICY staff_disciplinary_manage ON staff_disciplinary FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid()::text AND role IN ('admin', 'headteacher')
  ));
