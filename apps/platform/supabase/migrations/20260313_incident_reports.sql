-- ============================================================================
-- H&S Incident / Near-Miss Reporting Module
-- RIDDOR-compliant (Reporting of Injuries, Diseases and Dangerous Occurrences
-- Regulations 2013), integrates with risk_register and estates_helpdesk_tickets
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. incident_reports — core incident/near-miss table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Classification
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'accident', 'near_miss', 'dangerous_occurrence', 'violence',
    'ill_health', 'fire', 'security', 'environmental', 'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),

  -- When/where
  incident_date DATE NOT NULL,
  incident_time TIME,
  location TEXT NOT NULL,
  location_detail TEXT,  -- e.g. "Playground - climbing frame area"

  -- Who was involved
  injured_person_name TEXT,
  injured_person_type TEXT CHECK (injured_person_type IN (
    'pupil', 'staff', 'visitor', 'contractor', 'other'
  )),
  injured_person_role TEXT,  -- e.g. "Year 3 pupil", "Site Manager"
  injured_person_year_group TEXT,  -- For pupils

  -- What happened
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  immediate_actions TEXT,  -- What was done straight away
  first_aid_given BOOLEAN DEFAULT false,
  first_aid_details TEXT,
  first_aider_name TEXT,
  hospital_attendance BOOLEAN DEFAULT false,
  hospital_details TEXT,

  -- Witnesses
  witnesses JSONB DEFAULT '[]',  -- [{name, role, statement}]

  -- RIDDOR fields
  -- Injury detail (feeds RIDDOR auto-detection)
  injury_type TEXT,  -- fracture, amputation, loss_of_sight, crush, scalping, thermal_burns, loss_of_consciousness, hypothermia, other
  injury_body_part TEXT,  -- e.g. "left wrist", "right femur"
  injury_is_fracture_excluded BOOLEAN DEFAULT false,  -- finger/thumb/toe fracture = NOT RIDDOR
  hospital_admission_type TEXT CHECK (hospital_admission_type IN (
    'admitted', 'treated_and_discharged', 'not_attended', NULL
  )),
  hospital_name TEXT,
  hospital_admission_date DATE,
  days_off_work INTEGER,  -- for >7-day detection (staff only)
  dangerous_occurrence_type TEXT,  -- scaffolding, electrical, fire, structural_collapse, substance_release, etc.
  occupational_disease_type TEXT,
  medical_diagnosis_date DATE,
  is_work_related BOOLEAN DEFAULT false,
  injured_person_dob DATE,
  injured_person_address TEXT,
  injured_person_phone TEXT,

  -- RIDDOR auto-detection
  is_riddor_reportable BOOLEAN DEFAULT false,
  riddor_auto_detected BOOLEAN DEFAULT false,  -- true if system detected, false if manual
  riddor_detection_reason TEXT,  -- why the system flagged it
  riddor_category TEXT CHECK (riddor_category IN (
    'death', 'specified_injury', 'over_7_day', 'non_fatal_non_worker',
    'dangerous_occurrence', 'occupational_disease', NULL
  )),
  riddor_reference TEXT,  -- HSE reference number once filed
  riddor_reported_date DATE,
  riddor_deadline DATE,  -- 10 working days from incident
  riddor_reported_by TEXT,
  riddor_form_data JSONB DEFAULT '{}',  -- Pre-filled F2508 data for Ed to populate

  -- Investigation
  investigation_required BOOLEAN DEFAULT false,
  investigation_lead TEXT,
  investigation_notes TEXT,
  root_cause TEXT,
  contributing_factors JSONB DEFAULT '[]',  -- ["equipment_failure", "inadequate_training", etc.]

  -- Evidence
  evidence_photos JSONB DEFAULT '[]',  -- [{url, caption, taken_at}]
  evidence_documents JSONB DEFAULT '[]',  -- [{url, name, type}]

  -- Cross-module links
  linked_risk_id UUID,  -- Auto-created risk from createRiskFromIncident()
  linked_helpdesk_ticket_id UUID,
  linked_asset_id UUID,
  linked_workflow_id UUID,

  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'investigating', 'awaiting_riddor', 'closed', 'closed_no_action'
  )),

  -- Reporting chain
  reported_by_id TEXT NOT NULL,
  reported_by_name TEXT NOT NULL,
  reviewed_by_id TEXT,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  closed_by_id TEXT,
  closed_by_name TEXT,
  closed_at TIMESTAMPTZ,
  closure_notes TEXT,

  -- Corrective actions
  corrective_actions JSONB DEFAULT '[]',
  -- [{title, description, assigned_to, due_date, status, completed_at}]

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incident_reports_org ON incident_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_type ON incident_reports(organization_id, incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON incident_reports(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_incident_reports_date ON incident_reports(incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_riddor ON incident_reports(organization_id, is_riddor_reportable) WHERE is_riddor_reportable = true;

-- RLS: org members read, SLT+ manage
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'incident_reports_read_org') THEN
    CREATE POLICY incident_reports_read_org ON incident_reports
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'incident_reports_insert_org') THEN
    CREATE POLICY incident_reports_insert_org ON incident_reports
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = auth.uid()::text
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'incident_reports_update_slt') THEN
    CREATE POLICY incident_reports_update_slt ON incident_reports
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()::text
          AND role IN ('admin', 'headteacher', 'slt')
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'incident_reports_delete_ht') THEN
    CREATE POLICY incident_reports_delete_ht ON incident_reports
      FOR DELETE USING (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = auth.uid()::text
          AND role IN ('admin', 'headteacher')
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Seed Aurora Primary demo incidents
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'aurora-primary' LIMIT 1;
  IF v_org_id IS NULL THEN RETURN; END IF;

  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM incident_reports WHERE organization_id = v_org_id) THEN RETURN; END IF;

  -- Incident 1: Playground fall (moderate, RIDDOR over-7-day)
  INSERT INTO incident_reports (
    organization_id, incident_type, severity, incident_date, incident_time,
    location, location_detail, injured_person_name, injured_person_type,
    injured_person_year_group, title, description, immediate_actions,
    first_aid_given, first_aid_details, first_aider_name,
    hospital_attendance, hospital_details,
    witnesses, is_riddor_reportable, riddor_category, riddor_deadline,
    investigation_required, investigation_lead, root_cause,
    contributing_factors, corrective_actions,
    status, reported_by_id, reported_by_name
  ) VALUES (
    v_org_id, 'accident', 'moderate', '2026-02-18', '10:45',
    'Playground', 'Main climbing frame - monkey bars section',
    'Pupil A (Year 4)', 'pupil', 'Year 4',
    'Pupil fall from climbing frame',
    'Pupil fell approximately 1.2m from monkey bars onto safety surface. Landed awkwardly on left wrist. Crying and unable to move wrist. Surface was wet from morning rain.',
    'Area cleared, pupil moved to medical room, cold compress applied, parent called immediately.',
    true, 'Cold compress to left wrist, arm supported in sling', 'Sarah Mitchell',
    true, 'A&E attendance — X-ray confirmed greenstick fracture. Cast applied, 6 weeks recovery.',
    '[{"name":"Mrs Thompson","role":"Lunchtime Supervisor","statement":"I saw the child swinging on the bars, hands slipped, fell sideways"},{"name":"Mr Johnson","role":"Site Manager","statement":"Surface was damp, rubberised surface in good condition"}]'::jsonb,
    true, 'non_fatal_non_worker', '2026-03-04',
    true, 'Keith Johnson',
    'Wet surface reduced grip on metal bars',
    '["wet_conditions","equipment_design","inadequate_supervision"]'::jsonb,
    '[{"title":"Install wet weather signs for climbing frame","description":"Signs to restrict climbing frame use in wet/icy conditions","assigned_to":"Keith Johnson","due_date":"2026-03-01","status":"completed","completed_at":"2026-02-25"},{"title":"Review playground supervision ratios","description":"Increase lunchtime supervisor ratio near climbing equipment","assigned_to":"Helen Frost","due_date":"2026-03-15","status":"in_progress","completed_at":null},{"title":"Add grip tape to monkey bars","description":"Apply anti-slip grip tape to all monkey bar rungs","assigned_to":"Keith Johnson","due_date":"2026-03-10","status":"completed","completed_at":"2026-03-05"}]'::jsonb,
    'investigating', 'playground-supervisor-1', 'Mrs Thompson'
  );

  -- Incident 2: Near miss - loose ceiling tile (minor)
  INSERT INTO incident_reports (
    organization_id, incident_type, severity, incident_date, incident_time,
    location, location_detail, title, description, immediate_actions,
    first_aid_given, investigation_required, investigation_lead,
    root_cause, contributing_factors, corrective_actions,
    status, reported_by_id, reported_by_name
  ) VALUES (
    v_org_id, 'near_miss', 'minor', '2026-03-01', '08:15',
    'Corridor', 'First floor corridor outside Year 5 classrooms',
    'Ceiling tile dislodged in corridor',
    'Loose ceiling tile noticed hanging at an angle above corridor. No one was underneath. Area is busy during lesson changeover with 60+ pupils passing through.',
    'Area cordoned off immediately. Helpdesk ticket raised. Tile removed and stored safely.',
    false, true, 'Keith Johnson',
    'Tile fixing deteriorated with age. Building is 1970s construction, tiles last replaced 2015.',
    '["equipment_deterioration","building_age"]'::jsonb,
    '[{"title":"Inspect all corridor ceiling tiles","description":"Full inspection of all suspended ceiling tiles in first floor corridor","assigned_to":"Keith Johnson","due_date":"2026-03-08","status":"completed","completed_at":"2026-03-06"},{"title":"Schedule ceiling tile replacement programme","description":"Budget for phased replacement of all 1970s ceiling tiles","assigned_to":"Angela Price","due_date":"2026-04-30","status":"in_progress","completed_at":null}]'::jsonb,
    'closed', 'site-manager-1', 'Keith Johnson'
  );

  -- Incident 3: Staff slip in kitchen (minor)
  INSERT INTO incident_reports (
    organization_id, incident_type, severity, incident_date, incident_time,
    location, location_detail, injured_person_name, injured_person_type,
    injured_person_role, title, description, immediate_actions,
    first_aid_given, first_aid_details, first_aider_name,
    hospital_attendance, is_riddor_reportable,
    status, reported_by_id, reported_by_name,
    reviewed_by_id, reviewed_by_name, reviewed_at,
    closed_by_id, closed_by_name, closed_at, closure_notes
  ) VALUES (
    v_org_id, 'accident', 'minor', '2026-02-10', '12:30',
    'Kitchen', 'Main kitchen near dishwasher area',
    'Janet Williams', 'staff', 'Kitchen Assistant',
    'Staff slip on wet kitchen floor',
    'Kitchen assistant slipped on wet floor near dishwasher. Water had leaked from dishwasher seal. Landed on hip, bruising only.',
    'First aid applied, area mopped, dishwasher taken out of service. Facilities contacted for repair.',
    true, 'Ice pack to hip, painkillers offered (declined)', 'Sarah Mitchell',
    false, false,
    'closed', 'kitchen-manager-1', 'Head Cook',
    'headteacher-1', 'Helen Frost', '2026-02-12',
    'headteacher-1', 'Helen Frost', '2026-02-14',
    'Dishwasher seal replaced same day. Staff returned to work next day. Non-slip mats added around dishwasher area. Reviewed kitchen H&S with all kitchen staff.'
  );

  -- Incident 4: Dangerous occurrence - gas smell (major)
  INSERT INTO incident_reports (
    organization_id, incident_type, severity, incident_date, incident_time,
    location, location_detail, title, description, immediate_actions,
    first_aid_given, is_riddor_reportable, riddor_category,
    riddor_deadline, investigation_required, investigation_lead,
    root_cause, contributing_factors,
    corrective_actions,
    status, reported_by_id, reported_by_name
  ) VALUES (
    v_org_id, 'dangerous_occurrence', 'major', '2026-01-15', '07:30',
    'Boiler Room', 'Main boiler room basement',
    'Gas leak detected in boiler room',
    'Site manager detected strong gas smell when opening boiler room for morning checks. Gas meter reading showed elevated levels. No ignition occurred. Building was empty (pre-opening checks).',
    'Boiler room sealed and locked. Gas emergency service called (National Grid 0800 111 999). Gas supply isolated at external meter. School opening delayed 90 minutes until gas safe engineer cleared the area. Parents notified via text of delayed opening.',
    false, true, 'dangerous_occurrence', '2026-01-29',
    true, 'Keith Johnson',
    'Corroded pipe fitting on boiler supply line. Fitting was 22 years old (original installation 2004).',
    '["equipment_deterioration","inadequate_inspection_frequency"]'::jsonb,
    '[{"title":"Emergency pipe repair","description":"Gas safe engineer replaced corroded fitting and tested all connections","assigned_to":"External - British Gas","due_date":"2026-01-15","status":"completed","completed_at":"2026-01-15"},{"title":"Full gas pipework survey","description":"Comprehensive survey of all gas pipework, prioritise sections >15 years old","assigned_to":"External - GasCare Ltd","due_date":"2026-02-15","status":"completed","completed_at":"2026-02-10"},{"title":"Increase gas safety check frequency","description":"Move from annual to 6-monthly CP42 inspection for boiler room","assigned_to":"Keith Johnson","due_date":"2026-03-01","status":"completed","completed_at":"2026-02-28"},{"title":"File RIDDOR report","description":"Report dangerous occurrence to HSE within 10 working days","assigned_to":"Helen Frost","due_date":"2026-01-29","status":"completed","completed_at":"2026-01-22"}]'::jsonb,
    'closed', 'site-manager-1', 'Keith Johnson'
  );

  -- Incident 5: Violence incident (moderate)
  INSERT INTO incident_reports (
    organization_id, incident_type, severity, incident_date, incident_time,
    location, location_detail, injured_person_name, injured_person_type,
    injured_person_role, title, description, immediate_actions,
    first_aid_given, first_aid_details, first_aider_name,
    hospital_attendance, is_riddor_reportable,
    investigation_required, investigation_lead,
    status, reported_by_id, reported_by_name
  ) VALUES (
    v_org_id, 'violence', 'moderate', '2026-03-10', '14:20',
    'Reception Classroom', 'Year R Ladybirds class',
    'Emma Roberts', 'staff', 'Class Teacher',
    'Staff assaulted by pupil during meltdown',
    'Pupil with EHCP (SEMH) had escalated meltdown during transition. Kicked teacher in shin and threw chair. Teacher sustained bruising to left shin. Pupil calmed by SENCO using Team Teach techniques. Parents called to collect.',
    'Teacher removed from situation. SENCO took over pupil support. First aid applied. Incident logged in safeguarding records. Parents contacted for both pupil and teacher.',
    true, 'Ice pack to shin, wound cleaned', 'Sarah Mitchell',
    false, false,
    true, 'Claire Dawson',
    'open', 'teacher-1', 'Emma Roberts'
  );

END $$;
