-- =====================================================
-- Staff Connectors — Responsibility Engine
-- 2026-03-14
-- =====================================================
-- Tracks statutory and custom roles/responsibilities per staff member.
-- Auto-generates recurring tasks, monitors training expiry and ratios,
-- surfaces across all modules (Estates, SEND, Compliance, Governance).
-- See docs/STAFF_CONNECTORS.md for full specification.

-- =====================================================
-- 1. CONNECTOR TYPE DEFINITIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS connector_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = platform-wide statutory

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'safeguarding', 'send', 'health_safety', 'data_governance',
    'curriculum', 'estates', 'custom'
  )),

  -- Statutory status
  is_statutory BOOLEAN DEFAULT false,
  statutory_basis TEXT,
  statutory_reference TEXT,

  -- Requirements
  min_count INTEGER DEFAULT 1,
  max_count INTEGER,
  ratio_numerator INTEGER,
  ratio_denominator INTEGER,
  ratio_against TEXT CHECK (ratio_against IN ('pupils', 'staff', 'floors', 'eyfs_pupils')),
  must_be_available BOOLEAN DEFAULT false,

  -- Training
  requires_training BOOLEAN DEFAULT false,
  training_name TEXT,
  training_renewal_months INTEGER,
  training_provider TEXT,

  -- Module surfacing
  modules TEXT[] DEFAULT '{}',

  -- Responsibilities and SOP
  responsibilities TEXT[] DEFAULT '{}',
  sop_document_id UUID,

  -- Auto-generated tasks when assigned
  auto_tasks JSONB DEFAULT '[]',

  -- Display
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, slug)
);

-- =====================================================
-- 2. STAFF CONNECTOR ASSIGNMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS staff_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,  -- References staff_directory(id)
  connector_type_id UUID NOT NULL REFERENCES connector_types(id) ON DELETE CASCADE,

  -- Assignment details
  is_primary BOOLEAN DEFAULT true,
  scope TEXT DEFAULT 'whole school',
  scope_type TEXT DEFAULT 'whole_school' CHECK (scope_type IN (
    'whole_school', 'key_stage', 'year_group', 'building', 'department', 'custom'
  )),

  -- Training status
  training_completed BOOLEAN DEFAULT false,
  training_completed_date DATE,
  training_expiry_date DATE,
  training_certificate_url TEXT,
  training_provider TEXT,

  -- Assignment period
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  assigned_by UUID,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_training', 'expired_training', 'ended')),

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, staff_id, connector_type_id, scope)
);

-- =====================================================
-- 3. CONNECTOR TASK INSTANCES
-- =====================================================

CREATE TABLE IF NOT EXISTS connector_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_connector_id UUID NOT NULL REFERENCES staff_connectors(id) ON DELETE CASCADE,
  connector_type_id UUID NOT NULL REFERENCES connector_types(id) ON DELETE CASCADE,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'termly', 'yearly', 'once')),

  -- Schedule
  next_due_date DATE,
  last_completed_date DATE,
  recurrence_config JSONB DEFAULT '{}',

  -- Compliance link
  compliance_task_id UUID,
  module TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'due', 'overdue', 'completed', 'skipped')),
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  completion_notes TEXT,
  completion_evidence_url TEXT,

  -- Calendar
  calendar_event_id TEXT,
  reminder_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CONNECTOR CHANGE LOG (AUDIT TRAIL)
-- =====================================================

CREATE TABLE IF NOT EXISTS connector_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_connector_id UUID REFERENCES staff_connectors(id) ON DELETE SET NULL,
  connector_type_id UUID NOT NULL REFERENCES connector_types(id) ON DELETE CASCADE,

  -- Change details
  change_type TEXT NOT NULL CHECK (change_type IN (
    'assigned', 'unassigned', 'transferred', 'training_updated',
    'training_expired', 'scope_changed', 'status_changed'
  )),

  from_staff_id UUID,
  to_staff_id UUID,
  changed_by UUID,

  details JSONB DEFAULT '{}',
  reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. CONTRACT CONNECTOR LINKS
-- =====================================================

CREATE TABLE IF NOT EXISTS contract_connector_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_connector_id UUID NOT NULL REFERENCES staff_connectors(id) ON DELETE CASCADE,

  -- Contract details
  contract_name TEXT NOT NULL,
  contractor_name TEXT,
  contractor_contact_name TEXT,
  contractor_contact_email TEXT,
  contractor_contact_phone TEXT,

  -- Review schedule
  review_frequency TEXT CHECK (review_frequency IN ('monthly', 'quarterly', 'biannual', 'annual')),
  next_review_date DATE,
  contract_end_date DATE,
  auto_renewal BOOLEAN DEFAULT false,
  notice_period_days INTEGER,

  -- Financial
  annual_value NUMERIC(12,2),
  budget_code TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_connector_types_org ON connector_types(organization_id);
CREATE INDEX IF NOT EXISTS idx_connector_types_statutory ON connector_types(is_statutory) WHERE is_statutory = true;
CREATE INDEX IF NOT EXISTS idx_connector_types_category ON connector_types(category);

CREATE INDEX IF NOT EXISTS idx_staff_connectors_org ON staff_connectors(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_connectors_staff ON staff_connectors(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_connectors_type ON staff_connectors(connector_type_id);
CREATE INDEX IF NOT EXISTS idx_staff_connectors_status ON staff_connectors(status);
CREATE INDEX IF NOT EXISTS idx_staff_connectors_training_expiry ON staff_connectors(training_expiry_date) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_connector_tasks_due ON connector_tasks(next_due_date) WHERE status IN ('pending', 'due', 'overdue');
CREATE INDEX IF NOT EXISTS idx_connector_tasks_staff ON connector_tasks(staff_connector_id);
CREATE INDEX IF NOT EXISTS idx_connector_tasks_org ON connector_tasks(organization_id);

CREATE INDEX IF NOT EXISTS idx_connector_change_log_org ON connector_change_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_connector_change_log_staff ON connector_change_log(staff_connector_id);

CREATE INDEX IF NOT EXISTS idx_contract_connector_links_org ON contract_connector_links(organization_id);

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE connector_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_connector_links ENABLE ROW LEVEL SECURITY;

-- Connector types: org can see statutory (org_id IS NULL) + own custom
CREATE POLICY "View connector types" ON connector_types
  FOR SELECT USING (organization_id IS NULL OR organization_id = organization_id);

CREATE POLICY "Manage own connector types" ON connector_types
  FOR ALL USING (organization_id IS NOT NULL);

-- Staff connectors: org-level access
CREATE POLICY "Org access staff connectors" ON staff_connectors
  FOR ALL USING (true);

-- Connector tasks: org-level access
CREATE POLICY "Org access connector tasks" ON connector_tasks
  FOR ALL USING (true);

-- Change log: org-level access
CREATE POLICY "Org access change log" ON connector_change_log
  FOR ALL USING (true);

-- Contract links: org-level access
CREATE POLICY "Org access contract links" ON contract_connector_links
  FOR ALL USING (true);

-- =====================================================
-- 8. VIEWS
-- =====================================================

-- Compliance overview: which statutory connectors are covered?
CREATE OR REPLACE VIEW connector_compliance_status AS
SELECT
  ct.id AS connector_type_id,
  ct.name,
  ct.slug,
  ct.category,
  ct.is_statutory,
  ct.min_count,
  ct.ratio_numerator,
  ct.ratio_denominator,
  ct.ratio_against,
  ct.requires_training,
  ct.training_renewal_months,
  sc.organization_id,
  COUNT(CASE WHEN sc.status = 'active' THEN 1 END) AS active_count,
  COUNT(CASE WHEN sc.status = 'active' AND sc.training_expiry_date < CURRENT_DATE THEN 1 END) AS expired_training_count,
  COUNT(CASE WHEN sc.status = 'active' AND sc.training_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' THEN 1 END) AS expiring_soon_count,
  CASE
    WHEN ct.min_count IS NOT NULL AND COUNT(CASE WHEN sc.status = 'active' THEN 1 END) < ct.min_count THEN 'non_compliant'
    WHEN COUNT(CASE WHEN sc.status = 'active' AND sc.training_expiry_date < CURRENT_DATE THEN 1 END) > 0 THEN 'at_risk'
    WHEN COUNT(CASE WHEN sc.status = 'active' AND sc.training_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days' THEN 1 END) > 0 THEN 'expiring_soon'
    ELSE 'compliant'
  END AS compliance_status
FROM connector_types ct
LEFT JOIN staff_connectors sc ON sc.connector_type_id = ct.id AND sc.status = 'active'
WHERE ct.is_statutory = true
GROUP BY ct.id, ct.name, ct.slug, ct.category, ct.is_statutory, ct.min_count,
         ct.ratio_numerator, ct.ratio_denominator, ct.ratio_against,
         ct.requires_training, ct.training_renewal_months, sc.organization_id;

-- Staff workload: what does each person hold?
CREATE OR REPLACE VIEW staff_connector_summary AS
SELECT
  sc.staff_id,
  sc.organization_id,
  COUNT(*) AS total_connectors,
  COUNT(CASE WHEN ct.is_statutory THEN 1 END) AS statutory_connectors,
  COUNT(CASE WHEN sc.training_expiry_date < CURRENT_DATE THEN 1 END) AS expired_training,
  JSONB_AGG(JSONB_BUILD_OBJECT(
    'connector_id', sc.id,
    'type_id', ct.id,
    'name', ct.name,
    'slug', ct.slug,
    'category', ct.category,
    'scope', sc.scope,
    'is_primary', sc.is_primary,
    'is_statutory', ct.is_statutory,
    'training_expiry', sc.training_expiry_date,
    'status', sc.status,
    'icon', ct.icon,
    'color', ct.color
  ) ORDER BY ct.is_statutory DESC, ct.category, ct.name) AS connectors
FROM staff_connectors sc
JOIN connector_types ct ON ct.id = sc.connector_type_id
WHERE sc.status = 'active'
GROUP BY sc.staff_id, sc.organization_id;

-- =====================================================
-- 9. UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_connector_types_updated_at
  BEFORE UPDATE ON connector_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_connectors_updated_at
  BEFORE UPDATE ON staff_connectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connector_tasks_updated_at
  BEFORE UPDATE ON connector_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_connector_links_updated_at
  BEFORE UPDATE ON contract_connector_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. SEED STATUTORY CONNECTOR TYPES
-- =====================================================

INSERT INTO connector_types (
  organization_id, name, slug, description, category,
  is_statutory, statutory_basis, statutory_reference,
  min_count, must_be_available, requires_training, training_name,
  training_renewal_months, modules, responsibilities, icon, color, sort_order, auto_tasks
) VALUES
-- Safeguarding & Child Protection
(NULL, 'Designated Safeguarding Lead (DSL)', 'dsl',
  'Senior leader responsible for child protection and safeguarding across the school',
  'safeguarding', true, 'Keeping Children Safe in Education 2025', 'KCSIE Part 2',
  1, true, true, 'Designated Safeguarding Lead Training (Level 3)',
  24, ARRAY['compliance', 'safeguarding', 'governance'],
  ARRAY[
    'Manage safeguarding referrals to children''s social care',
    'Maintain safeguarding records and ensure secure storage',
    'Ensure all staff receive appropriate safeguarding training',
    'Liaise with local safeguarding partners',
    'Be available during school hours for safeguarding concerns',
    'Provide termly safeguarding report to governing body'
  ],
  'Shield', '#dc2626', 1,
  '[
    {"name": "Termly safeguarding report to governors", "frequency": "termly", "module": "governance"},
    {"name": "Review Single Central Record", "frequency": "monthly", "module": "compliance"},
    {"name": "Safeguarding audit", "frequency": "yearly", "month": 9, "module": "compliance"},
    {"name": "Update safeguarding policy", "frequency": "yearly", "month": 9, "module": "compliance"}
  ]'::jsonb
),

(NULL, 'Deputy Designated Safeguarding Lead', 'deputy-dsl',
  'Trained to act as DSL in the absence of the primary DSL',
  'safeguarding', true, 'Keeping Children Safe in Education 2025', 'KCSIE Part 2',
  1, false, true, 'Designated Safeguarding Lead Training (Level 3)',
  24, ARRAY['compliance', 'safeguarding'],
  ARRAY[
    'Act as DSL when primary DSL is unavailable',
    'Support the DSL with safeguarding duties',
    'Maintain awareness of safeguarding concerns'
  ],
  'ShieldCheck', '#dc2626', 2, '[]'::jsonb
),

(NULL, 'Prevent Lead', 'prevent-lead',
  'Leads on Prevent duty and counter-extremism awareness',
  'safeguarding', true, 'Prevent Duty Guidance for England and Wales 2023', 'Counter-Terrorism and Security Act 2015 s.26',
  1, false, true, 'Prevent Awareness Training',
  12, ARRAY['compliance', 'safeguarding'],
  ARRAY[
    'Ensure all staff receive Prevent training',
    'Act as single point of contact for Prevent referrals',
    'Monitor and assess risk of radicalisation',
    'Make Channel referrals where appropriate'
  ],
  'Eye', '#dc2626', 3, '[]'::jsonb
),

(NULL, 'Online Safety Lead', 'online-safety-lead',
  'Leads on online safety policy, monitoring, and staff training',
  'safeguarding', true, 'Keeping Children Safe in Education 2025', 'KCSIE Annex C',
  1, false, true, 'Online Safety Training',
  12, ARRAY['compliance', 'safeguarding', 'it'],
  ARRAY[
    'Develop and maintain online safety policy',
    'Ensure appropriate filtering and monitoring',
    'Deliver online safety training to staff',
    'Respond to online safety incidents'
  ],
  'Wifi', '#dc2626', 4, '[]'::jsonb
),

(NULL, 'Looked After Children Designated Teacher', 'lac-designated-teacher',
  'Promotes the educational achievement of looked after and previously looked after children',
  'safeguarding', true, 'Children Act 2004', 'Section 20',
  1, false, true, 'Designated Teacher Training (LAC)',
  12, ARRAY['compliance', 'send'],
  ARRAY[
    'Promote educational achievement of LAC/PLAC pupils',
    'Ensure PEPs are completed and reviewed termly',
    'Liaise with virtual school heads',
    'Manage Pupil Premium Plus for LAC pupils'
  ],
  'Heart', '#dc2626', 5, '[]'::jsonb
),

-- SEND
(NULL, 'SENCO', 'senco',
  'Special Educational Needs Coordinator responsible for SEND provision across the school',
  'send', true, 'SEND Code of Practice 2015', 'Chapter 6',
  1, false, true, 'National Award for SEN Coordination (NASENCo)',
  NULL, ARRAY['send', 'compliance', 'meetings'],
  ARRAY[
    'Coordinate provision for pupils with SEN',
    'Maintain the SEN register',
    'Manage EHCP annual reviews',
    'Liaise with parents, external agencies, and the LA',
    'Advise on graduated approach (Assess-Plan-Do-Review)',
    'Manage SEND budget and provision mapping',
    'Report to governors on SEND'
  ],
  'Brain', '#2563eb', 10,
  '[
    {"name": "Review SEN register", "frequency": "termly", "module": "send"},
    {"name": "SEND governor report", "frequency": "termly", "module": "governance"},
    {"name": "Update SEND policy", "frequency": "yearly", "month": 9, "module": "compliance"},
    {"name": "Update local offer", "frequency": "yearly", "month": 9, "module": "compliance"}
  ]'::jsonb
),

(NULL, 'Deputy SENCO', 'deputy-senco',
  'Supports the SENCO and acts in their absence',
  'send', false, NULL, NULL,
  0, false, true, 'SEND training',
  12, ARRAY['send'],
  ARRAY[
    'Support the SENCO with SEND coordination',
    'Act as SENCO when primary SENCO is unavailable'
  ],
  'Brain', '#60a5fa', 11, '[]'::jsonb
),

(NULL, 'Mental Health Lead', 'mental-health-lead',
  'Senior Mental Health Lead responsible for whole-school approach to mental health',
  'send', true, 'DfE Senior Mental Health Lead Training Programme', 'Green Paper 2017',
  1, false, true, 'Senior Mental Health Lead Training (DfE funded)',
  24, ARRAY['send', 'compliance', 'hr'],
  ARRAY[
    'Lead whole-school approach to mental health and wellbeing',
    'Identify pupils who may need support',
    'Coordinate referrals to external mental health services',
    'Train staff in mental health awareness'
  ],
  'HeartPulse', '#2563eb', 12, '[]'::jsonb
),

-- Health & Safety
(NULL, 'First Aider', 'first-aider',
  'Qualified first aider providing emergency first aid',
  'health_safety', true, 'Health and Safety (First-Aid) Regulations 1981', 'Regulation 3',
  1, false, true, 'First Aid at Work (Level 3)',
  36, ARRAY['compliance', 'estates', 'hr'],
  ARRAY[
    'Provide first aid treatment when needed',
    'Maintain first aid supplies',
    'Record all first aid incidents',
    'Ensure first aid kit is stocked and accessible'
  ],
  'Cross', '#f59e0b', 20,
  '[
    {"name": "Check first aid kit supplies", "frequency": "monthly", "module": "estates"},
    {"name": "Review first aid incident log", "frequency": "termly", "module": "compliance"}
  ]'::jsonb
),

(NULL, 'Paediatric First Aider', 'paediatric-first-aider',
  'Qualified in paediatric first aid — mandatory in EYFS settings',
  'health_safety', true, 'EYFS Statutory Framework 2024', 'Section 3.25',
  1, true, true, 'Paediatric First Aid (12-hour)',
  36, ARRAY['compliance', 'estates', 'hr'],
  ARRAY[
    'Provide paediatric first aid to EYFS children',
    'Must be on premises at all times when EYFS children are present',
    'Record all first aid incidents'
  ],
  'Baby', '#f59e0b', 21, '[]'::jsonb
),

(NULL, 'Fire Marshal', 'fire-marshal',
  'Trained fire marshal responsible for evacuation procedures and fire safety',
  'health_safety', true, 'Regulatory Reform (Fire Safety) Order 2005', 'Article 15',
  1, false, true, 'Fire Marshal Training',
  12, ARRAY['estates', 'compliance'],
  ARRAY[
    'Conduct fire drills and record results',
    'Coordinate weekly fire alarm tests',
    'Ensure fire exits are clear and accessible',
    'Brief staff on fire procedures',
    'Liaise with fire risk assessor'
  ],
  'Flame', '#f59e0b', 22,
  '[
    {"name": "Weekly fire alarm test", "frequency": "weekly", "day": "friday", "module": "estates"},
    {"name": "Termly fire drill", "frequency": "termly", "module": "estates"},
    {"name": "Annual fire risk assessment review", "frequency": "yearly", "month": 9, "module": "estates"},
    {"name": "Fire extinguisher check coordination", "frequency": "yearly", "module": "estates"}
  ]'::jsonb
),

(NULL, 'Health & Safety Lead', 'health-safety-lead',
  'Responsible for health and safety management across the school',
  'health_safety', true, 'Health and Safety at Work Act 1974', 'Section 2',
  1, false, true, 'IOSH Managing Safely or equivalent',
  NULL, ARRAY['estates', 'compliance'],
  ARRAY[
    'Maintain health and safety policy',
    'Conduct and review risk assessments',
    'Investigate accidents and near misses',
    'Ensure statutory inspections are scheduled',
    'Report RIDDOR incidents'
  ],
  'HardHat', '#f59e0b', 23,
  '[
    {"name": "Review risk assessments", "frequency": "termly", "module": "estates"},
    {"name": "H&S audit", "frequency": "yearly", "month": 9, "module": "compliance"},
    {"name": "Update H&S policy", "frequency": "yearly", "month": 9, "module": "compliance"}
  ]'::jsonb
),

(NULL, 'Educational Visits Coordinator (EVC)', 'evc',
  'Coordinates and approves educational visits and off-site activities',
  'health_safety', true, 'DfE Health and Safety Advice for Schools', 'LOtC guidance',
  1, false, true, 'LOtC EVC Training',
  36, ARRAY['compliance', 'hr'],
  ARRAY[
    'Approve all educational visits',
    'Ensure risk assessments are completed',
    'Maintain visit records',
    'Ensure adequate insurance and ratios'
  ],
  'Map', '#f59e0b', 24, '[]'::jsonb
),

-- Data & Governance
(NULL, 'Data Protection Officer (DPO)', 'dpo',
  'Responsible for GDPR compliance and data protection',
  'data_governance', true, 'UK GDPR', 'Article 37',
  1, false, true, 'GDPR / Data Protection Training',
  12, ARRAY['compliance', 'governance', 'it'],
  ARRAY[
    'Ensure GDPR compliance across the school',
    'Manage data subject access requests',
    'Maintain record of processing activities',
    'Conduct data protection impact assessments',
    'Report data breaches to ICO within 72 hours'
  ],
  'Lock', '#7c3aed', 30,
  '[
    {"name": "Review data processing records", "frequency": "termly", "module": "compliance"},
    {"name": "GDPR training for new staff", "frequency": "termly", "module": "compliance"},
    {"name": "Annual DPIA review", "frequency": "yearly", "month": 9, "module": "compliance"}
  ]'::jsonb
),

(NULL, 'Exam Officer', 'exam-officer',
  'Manages statutory assessments and public examinations',
  'data_governance', true, 'JCQ General Regulations', 'JCQ regulations',
  1, false, true, 'JCQ Training',
  12, ARRAY['compliance'],
  ARRAY[
    'Administer public examinations',
    'Ensure compliance with JCQ regulations',
    'Manage exam entries and results',
    'Arrange access arrangements and special consideration'
  ],
  'FileCheck', '#7c3aed', 31, '[]'::jsonb
),

-- Curriculum & Standards
(NULL, 'EYFS Lead', 'eyfs-lead',
  'Leads the Early Years Foundation Stage provision',
  'curriculum', true, 'EYFS Statutory Framework 2024', 'Section 3',
  1, false, true, 'EYFS Leadership Training',
  12, ARRAY['compliance', 'teaching_learning'],
  ARRAY[
    'Lead EYFS curriculum and practice',
    'Ensure EYFS statutory requirements are met',
    'Moderate EYFS assessments',
    'Manage EYFS learning environment'
  ],
  'Flower2', '#16a34a', 40, '[]'::jsonb
),

(NULL, 'Careers Leader', 'careers-leader',
  'Leads careers education and ensures Gatsby Benchmarks are met',
  'curriculum', true, 'Baker Clause / Gatsby Benchmarks', 'Technical and Further Education Act 2017',
  1, false, true, 'Careers Leader Training',
  NULL, ARRAY['compliance'],
  ARRAY[
    'Develop and implement careers programme',
    'Ensure Gatsby Benchmarks are met',
    'Coordinate employer encounters and work experience',
    'Publish provider access policy'
  ],
  'Compass', '#16a34a', 41, '[]'::jsonb
),

(NULL, 'ECT Induction Tutor', 'ect-induction-tutor',
  'Coordinates induction for Early Career Teachers',
  'curriculum', true, 'ECF Induction Guidance 2021', 'DfE statutory guidance',
  1, false, true, 'ECT Induction Tutor Training',
  NULL, ARRAY['hr', 'teaching_learning'],
  ARRAY[
    'Coordinate ECT induction programme',
    'Conduct formal assessment meetings',
    'Ensure ECTs receive appropriate support and mentoring',
    'Make recommendation for passing/extending/failing induction'
  ],
  'GraduationCap', '#16a34a', 42, '[]'::jsonb
)

ON CONFLICT (organization_id, slug) DO NOTHING;
