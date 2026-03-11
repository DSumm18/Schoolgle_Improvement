-- ============================================================
-- Meeting & Workflow Hub Migration
-- Expands Meeting Companion into full Meeting & Workflow Hub
-- Tables: meeting_attendees, meeting_actions, sickness_absence_records,
--         sickness_trigger_config, hr_letter_templates, hr_letters_generated
-- Also: widen meeting_templates categories, Bradford Factor function,
--        backfill attendees, seed templates & triggers
-- ============================================================

-- ============================================================
-- 1. Widen meeting_templates category constraint
-- ============================================================
DO $$
BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'meeting_templates'
      AND constraint_type = 'CHECK'
      AND constraint_name = 'meeting_templates_category_check'
  ) THEN
    ALTER TABLE meeting_templates DROP CONSTRAINT meeting_templates_category_check;
  END IF;
END $$;

ALTER TABLE meeting_templates ADD CONSTRAINT meeting_templates_category_check
  CHECK (category IN (
    'hr', 'governance', 'slt_leadership', 'department',
    'safeguarding', 'teaching_learning', 'send', 'parents',
    'operational', 'general', 'custom'
  ));

-- ============================================================
-- 2. meeting_attendees junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff_directory(id) ON DELETE SET NULL,
  user_id TEXT,
  attendee_name TEXT NOT NULL,
  attendee_role TEXT,
  attendee_email TEXT,
  attendance_status TEXT NOT NULL DEFAULT 'invited'
    CHECK (attendance_status IN ('invited', 'confirmed', 'attended', 'apologies', 'absent')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  invited_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting ON meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_staff ON meeting_attendees(staff_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_user ON meeting_attendees(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_meeting_attendees_unique
  ON meeting_attendees(meeting_id, COALESCE(staff_id::text, user_id, attendee_email));

-- ============================================================
-- 3. meeting_actions junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, action_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_actions_meeting ON meeting_actions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_actions_action ON meeting_actions(action_id);

-- ============================================================
-- 4. sickness_absence_records table
-- ============================================================
CREATE TABLE IF NOT EXISTS sickness_absence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  working_days_lost DECIMAL(5,1),
  reason_category TEXT NOT NULL CHECK (reason_category IN (
    'cold_flu', 'stomach', 'headache_migraine', 'musculoskeletal',
    'mental_health', 'surgery', 'injury', 'covid', 'pregnancy_related',
    'hospital', 'dental', 'eye', 'chronic_condition', 'other'
  )),
  reason_detail TEXT,
  self_certified BOOLEAN DEFAULT true,
  fit_note_received BOOLEAN DEFAULT false,
  fit_note_expiry DATE,
  occupational_health_referral BOOLEAN DEFAULT false,
  return_date DATE,
  return_meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  phased_return BOOLEAN DEFAULT false,
  phased_return_plan JSONB,
  trigger_hit TEXT,
  formal_stage TEXT DEFAULT 'none' CHECK (formal_stage IN (
    'none', 'informal', 'stage_1', 'stage_2', 'stage_3'
  )),
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sickness_absence_org ON sickness_absence_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_sickness_absence_staff ON sickness_absence_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_sickness_absence_dates ON sickness_absence_records(start_date, end_date);

-- ============================================================
-- 5. sickness_trigger_config table
-- ============================================================
CREATE TABLE IF NOT EXISTS sickness_trigger_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trigger_name TEXT NOT NULL,
  trigger_value INTEGER NOT NULL,
  review_period_months INTEGER NOT NULL DEFAULT 12,
  action_required TEXT NOT NULL DEFAULT 'informal_review',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, trigger_name)
);

-- ============================================================
-- 6. hr_letter_templates table
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'absence_warning', 'capability_warning', 'meeting_invitation',
    'meeting_outcome', 'return_to_work', 'phased_return',
    'occupational_health_referral', 'dismissal', 'appeal',
    'probation_outcome', 'grievance_outcome', 'general'
  )),
  description TEXT,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  available_placeholders JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_letter_templates_org ON hr_letter_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_hr_letter_templates_category ON hr_letter_templates(category);
CREATE INDEX IF NOT EXISTS idx_hr_letter_templates_system ON hr_letter_templates(is_system);

-- ============================================================
-- 7. hr_letters_generated table
-- ============================================================
CREATE TABLE IF NOT EXISTS hr_letters_generated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES hr_letter_templates(id),
  staff_id UUID NOT NULL REFERENCES staff_directory(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
  absence_record_id UUID REFERENCES sickness_absence_records(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'finalised', 'sent', 'acknowledged'
  )),
  sent_at TIMESTAMPTZ,
  sent_to_email TEXT,
  exported_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_letters_generated_org ON hr_letters_generated(organization_id);
CREATE INDEX IF NOT EXISTS idx_hr_letters_generated_staff ON hr_letters_generated(staff_id);
CREATE INDEX IF NOT EXISTS idx_hr_letters_generated_template ON hr_letters_generated(template_id);
CREATE INDEX IF NOT EXISTS idx_hr_letters_generated_meeting ON hr_letters_generated(meeting_id);
CREATE INDEX IF NOT EXISTS idx_hr_letters_generated_absence ON hr_letters_generated(absence_record_id);
CREATE INDEX IF NOT EXISTS idx_hr_letters_generated_status ON hr_letters_generated(status);

-- ============================================================
-- 8. Bradford Factor function
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_bradford_factor(
  staff_id_param UUID,
  org_id_param UUID,
  period_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  occasions INTEGER,
  total_days DECIMAL,
  bradford_score DECIMAL,
  trigger_level TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_occasions INTEGER;
  v_total_days DECIMAL;
  v_bradford DECIMAL;
  v_trigger TEXT;
  v_cutoff DATE;
BEGIN
  v_cutoff := CURRENT_DATE - (period_months || ' months')::INTERVAL;

  -- Count distinct spells (occasions) within the review period
  SELECT COUNT(*)
  INTO v_occasions
  FROM sickness_absence_records
  WHERE staff_id = staff_id_param
    AND organization_id = org_id_param
    AND start_date >= v_cutoff;

  -- Sum total working days lost within the review period
  SELECT COALESCE(SUM(
    CASE
      WHEN working_days_lost IS NOT NULL THEN working_days_lost
      ELSE
        -- Estimate: weekdays between start and end (or today if ongoing)
        (SELECT COUNT(*)
         FROM generate_series(
           sar.start_date,
           COALESCE(sar.end_date, CURRENT_DATE),
           '1 day'::INTERVAL
         ) d
         WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)
        )
    END
  ), 0)
  INTO v_total_days
  FROM sickness_absence_records sar
  WHERE sar.staff_id = staff_id_param
    AND sar.organization_id = org_id_param
    AND sar.start_date >= v_cutoff;

  -- Bradford Factor = S x S x D
  v_bradford := v_occasions * v_occasions * v_total_days;

  -- Determine trigger level from config
  SELECT COALESCE(
    (SELECT tc.action_required
     FROM sickness_trigger_config tc
     WHERE tc.organization_id = org_id_param
       AND tc.trigger_name = 'bradford_threshold'
       AND tc.is_active = true
       AND v_bradford >= tc.trigger_value
     ORDER BY tc.trigger_value DESC
     LIMIT 1),
    'none'
  ) INTO v_trigger;

  -- If no Bradford trigger, check occasions threshold
  IF v_trigger = 'none' THEN
    SELECT COALESCE(
      (SELECT tc.action_required
       FROM sickness_trigger_config tc
       WHERE tc.organization_id = org_id_param
         AND tc.trigger_name = 'occasions_threshold'
         AND tc.is_active = true
         AND v_occasions >= tc.trigger_value
       ORDER BY tc.trigger_value DESC
       LIMIT 1),
      'none'
    ) INTO v_trigger;
  END IF;

  -- If still no trigger, check days threshold
  IF v_trigger = 'none' THEN
    SELECT COALESCE(
      (SELECT tc.action_required
       FROM sickness_trigger_config tc
       WHERE tc.organization_id = org_id_param
         AND tc.trigger_name = 'days_threshold'
         AND tc.is_active = true
         AND v_total_days >= tc.trigger_value
       ORDER BY tc.trigger_value DESC
       LIMIT 1),
      'none'
    ) INTO v_trigger;
  END IF;

  RETURN QUERY SELECT v_occasions, v_total_days, v_bradford, v_trigger;
END;
$$;

-- ============================================================
-- 9. Backfill existing meetings into meeting_attendees
-- ============================================================
INSERT INTO meeting_attendees (meeting_id, attendee_name, attendee_role, attendance_status)
SELECT
  m.id,
  m.attendee_name,
  m.attendee_role,
  CASE
    WHEN m.status = 'completed' THEN 'attended'
    WHEN m.status = 'cancelled' THEN 'absent'
    ELSE 'invited'
  END
FROM meetings m
WHERE m.attendee_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM meeting_attendees ma
    WHERE ma.meeting_id = m.id
      AND ma.attendee_name = m.attendee_name
  );

-- ============================================================
-- 10. Seed default sickness triggers
-- ============================================================
-- These are inserted with a NULL organization_id sentinel pattern;
-- each org gets defaults on first use. We use a system-level approach:
-- insert for a placeholder org only if table is empty.
-- Actually, triggers are per-org. We seed a reference set that the
-- application layer copies when an org first configures sickness tracking.
-- For now, we create a helper view/comment. The app seeds on first access.

-- Instead, insert a well-known set with organization_id = NULL as system defaults.
-- The app copies these for each org on first use.
-- But the FK requires organization_id to reference organizations(id).
-- So we use a DO block that inserts for every existing org that lacks config.

DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    -- Occasions threshold: 3 occasions in 12 months
    INSERT INTO sickness_trigger_config (organization_id, trigger_name, trigger_value, review_period_months, action_required)
    VALUES (org.id, 'occasions_threshold', 3, 12, 'informal_review')
    ON CONFLICT (organization_id, trigger_name) DO NOTHING;

    -- Days threshold: 10 days in 12 months
    INSERT INTO sickness_trigger_config (organization_id, trigger_name, trigger_value, review_period_months, action_required)
    VALUES (org.id, 'days_threshold', 10, 12, 'informal_review')
    ON CONFLICT (organization_id, trigger_name) DO NOTHING;

    -- Bradford Factor threshold: 200 in 12 months
    INSERT INTO sickness_trigger_config (organization_id, trigger_name, trigger_value, review_period_months, action_required)
    VALUES (org.id, 'bradford_threshold', 200, 12, 'informal_review')
    ON CONFLICT (organization_id, trigger_name) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================
-- 11. Seed system meeting templates for new categories
-- ============================================================

-- Governance: Board Meeting
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'Full Governing Board Meeting',
  'governance',
  'Termly meeting of the full governing board. Covers headteacher report, committee updates, statutory duties, and strategic oversight.',
  '["Good evening and welcome to the [term] meeting of the full governing board.", "I would like to confirm that we are quorate. Could the clerk please confirm the attendance and any apologies received?", "Before we begin, I remind all governors that discussions in this meeting are confidential unless agreed otherwise.", "Are there any declarations of interest in relation to items on tonight''s agenda?"]'::jsonb,
  '["Thank you all for your contributions this evening. We have covered a great deal of important business.", "The clerk will circulate the draft minutes within ten working days. Please review them and send any corrections before the next meeting.", "The date of the next meeting is [date]. If there are any items you would like to add to the agenda, please send them to the clerk at least two weeks in advance.", "I declare the meeting closed. Thank you for your time."]'::jsonb,
  '[{"phrase": "Confirm the meeting is quorate.", "category": "Governance", "is_critical": true, "order_index": 0}, {"phrase": "Record attendance and apologies.", "category": "Governance", "is_critical": true, "order_index": 1}, {"phrase": "Ask for declarations of interest.", "category": "Governance", "is_critical": true, "order_index": 2}, {"phrase": "Approve the minutes of the previous meeting.", "category": "Governance", "is_critical": true, "order_index": 3}, {"phrase": "Review matters arising from the previous minutes.", "category": "Governance", "is_critical": true, "order_index": 4}, {"phrase": "Receive the headteacher''s report.", "category": "Strategic", "is_critical": true, "order_index": 5}, {"phrase": "Review pupil achievement and progress data.", "category": "Strategic", "is_critical": true, "order_index": 6}, {"phrase": "Receive committee reports and ratify any decisions.", "category": "Governance", "is_critical": true, "order_index": 7}, {"phrase": "Review safeguarding update.", "category": "Safeguarding", "is_critical": true, "order_index": 8}, {"phrase": "Confirm the date of the next meeting.", "category": "Admin", "is_critical": false, "order_index": 9}]'::jsonb,
  '{"context_prompts": ["Ensure the agenda has been circulated at least seven days in advance.", "Confirm the meeting is quorate before proceedings begin.", "Prepare copies of the headteacher report and any committee reports.", "Review any actions from the previous meeting."], "documents_needed": ["Agenda", "Previous meeting minutes", "Headteacher report", "Committee reports", "Financial monitoring report", "Safeguarding update"], "key_phrases": ["Quorate", "Declarations of interest", "Ratify", "Strategic oversight"], "policy_refs": ["Governance Handbook (DfE)", "Academy Trust Handbook 2025", "School Governance (Roles, Procedures and Allowances) (England) Regulations 2013"]}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'Full Governing Board Meeting' AND organization_id IS NULL
);

-- Governance: Committee Meeting
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'Committee Meeting',
  'governance',
  'Meeting of a delegated committee of the governing board (e.g. Finance, Curriculum, Pay, Premises). Follows the terms of reference for the committee.',
  '["Good evening. Welcome to the meeting of the [Committee Name] Committee.", "Could the clerk please confirm attendance and apologies? I need to check we are quorate under our terms of reference.", "Are there any declarations of interest in relation to items on tonight''s agenda?", "The purpose of this meeting is to review matters delegated to this committee and make recommendations to the full board where necessary."]'::jsonb,
  '["Thank you for your contributions this evening.", "I will prepare a summary of our recommendations for the next full board meeting.", "The clerk will circulate draft minutes within ten working days.", "The next committee meeting is scheduled for [date]. Please send any agenda items to the clerk."]'::jsonb,
  '[{"phrase": "Confirm the committee is quorate.", "category": "Governance", "is_critical": true, "order_index": 0}, {"phrase": "Record attendance and apologies.", "category": "Governance", "is_critical": true, "order_index": 1}, {"phrase": "Ask for declarations of interest.", "category": "Governance", "is_critical": true, "order_index": 2}, {"phrase": "Approve previous minutes.", "category": "Governance", "is_critical": true, "order_index": 3}, {"phrase": "Review matters arising.", "category": "Governance", "is_critical": false, "order_index": 4}, {"phrase": "Review delegated business items.", "category": "Committee Business", "is_critical": true, "order_index": 5}, {"phrase": "Agree recommendations for the full board.", "category": "Committee Business", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Review the committee terms of reference before the meeting.", "Check quorum requirements for this specific committee.", "Prepare relevant papers and circulate at least seven days before the meeting.", "Identify any items that require full board approval."], "documents_needed": ["Committee terms of reference", "Agenda", "Previous minutes", "Relevant reports and papers"], "key_phrases": ["Quorate", "Terms of reference", "Delegated authority", "Recommendations to full board"], "policy_refs": ["Governance Handbook (DfE)", "Committee Terms of Reference", "Scheme of Delegation"]}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'Committee Meeting' AND organization_id IS NULL
);

-- SLT: SLT Meeting
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'SLT Meeting',
  'slt_leadership',
  'Regular meeting of the Senior Leadership Team. Covers strategic priorities, operational matters, school improvement, and key decisions.',
  '["Good morning everyone. Thank you for being here.", "Let us start with a brief round-table update from each area before we move to the main agenda items.", "Please keep updates concise so we have time for the substantive items."]'::jsonb,
  '["Thank you everyone. To summarise the key actions from today: [summarise actions and owners].", "Please ensure your actions are completed by the agreed deadlines.", "I will circulate a summary of today''s decisions and actions by the end of the day.", "Our next SLT meeting is on [date]. Please send any agenda items to me by [deadline]."]'::jsonb,
  '[{"phrase": "Round-table updates from each SLT member.", "category": "Updates", "is_critical": false, "order_index": 0}, {"phrase": "Review progress against school improvement priorities.", "category": "School Improvement", "is_critical": true, "order_index": 1}, {"phrase": "Discuss any safeguarding concerns or updates.", "category": "Safeguarding", "is_critical": true, "order_index": 2}, {"phrase": "Review pupil achievement and assessment data.", "category": "Data", "is_critical": true, "order_index": 3}, {"phrase": "Address staffing and HR matters.", "category": "HR", "is_critical": false, "order_index": 4}, {"phrase": "Review budget position and any spending decisions.", "category": "Finance", "is_critical": false, "order_index": 5}, {"phrase": "Agree actions, owners, and deadlines.", "category": "Actions", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Review the school improvement plan and progress against milestones.", "Prepare a brief update on your area of responsibility.", "Consider any emerging risks or issues that need SLT attention.", "Review actions from the previous SLT meeting."], "documents_needed": ["School improvement plan", "Previous SLT meeting notes", "Assessment data summaries", "Budget monitoring report", "Safeguarding log summary"], "key_phrases": ["School improvement priorities", "Safeguarding", "Actions and owners", "Strategic direction"], "policy_refs": ["School Improvement Plan", "Ofsted Education Inspection Framework"]}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'SLT Meeting' AND organization_id IS NULL
);

-- SLT: Weekly Briefing
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'Weekly Briefing',
  'slt_leadership',
  'Short weekly briefing for all staff or key staff groups. Covers the week ahead, key reminders, celebrations, and operational updates.',
  '["Good morning everyone. Welcome to the weekly briefing.", "I will keep this brief so we can all get to our classes on time.", "Let me start with some celebrations and good news before we cover the week ahead."]'::jsonb,
  '["Thank you everyone. Have a great week.", "If you have anything you would like included in next week''s briefing, please let me know by Thursday.", "A written summary will be on the staff noticeboard and emailed to everyone by lunchtime."]'::jsonb,
  '[{"phrase": "Share celebrations and positive news.", "category": "Morale", "is_critical": false, "order_index": 0}, {"phrase": "Cover key dates and events for the week.", "category": "Operational", "is_critical": true, "order_index": 1}, {"phrase": "Highlight any cover arrangements or staffing changes.", "category": "Staffing", "is_critical": true, "order_index": 2}, {"phrase": "Share any safeguarding reminders.", "category": "Safeguarding", "is_critical": false, "order_index": 3}, {"phrase": "Open the floor for brief questions or announcements.", "category": "Open", "is_critical": false, "order_index": 4}]'::jsonb,
  '{"context_prompts": ["Check the school calendar for the week ahead.", "Identify any cover or staffing changes.", "Gather any celebrations or good news to share.", "Keep the briefing to 10-15 minutes maximum."], "documents_needed": ["School calendar / weekly planner", "Cover arrangements", "Any notices or updates from SLT"], "key_phrases": ["Celebrations", "Week ahead", "Cover arrangements", "Safeguarding reminders"], "policy_refs": []}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'Weekly Briefing' AND organization_id IS NULL
);

-- Department: Department Meeting
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'Department Meeting',
  'department',
  'Regular meeting of a curriculum department or year group team. Covers curriculum planning, moderation, assessment, pupil progress, and professional development.',
  '["Thank you all for coming. Let us get started.", "The focus of today''s meeting is [topic]. I want to make sure we have time for a proper discussion, so I will keep the housekeeping brief.", "Does anyone have anything urgent to raise before we begin?"]'::jsonb,
  '["Thank you for a productive meeting. The key actions are: [summarise].", "I will add these to our department action tracker and we will review progress at the next meeting.", "If anyone has concerns or ideas between meetings, please come and speak to me.", "Our next meeting is on [date]."]'::jsonb,
  '[{"phrase": "Review actions from the previous meeting.", "category": "Actions", "is_critical": false, "order_index": 0}, {"phrase": "Discuss curriculum coverage and sequencing.", "category": "Curriculum", "is_critical": true, "order_index": 1}, {"phrase": "Review pupil progress and assessment data.", "category": "Assessment", "is_critical": true, "order_index": 2}, {"phrase": "Moderate work samples or assessment outcomes.", "category": "Moderation", "is_critical": false, "order_index": 3}, {"phrase": "Share good practice and professional development.", "category": "CPD", "is_critical": false, "order_index": 4}, {"phrase": "Discuss any SEND or disadvantaged pupil concerns.", "category": "Inclusion", "is_critical": true, "order_index": 5}, {"phrase": "Agree actions, owners, and deadlines.", "category": "Actions", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Review the department development plan and progress against targets.", "Prepare assessment data or work samples for discussion.", "Consider cross-curricular links and opportunities.", "Identify any CPD needs within the team."], "documents_needed": ["Department development plan", "Assessment data", "Scheme of work / curriculum map", "Previous meeting notes"], "key_phrases": ["Curriculum sequencing", "Pupil progress", "Moderation", "Good practice"], "policy_refs": ["National Curriculum", "Ofsted Education Inspection Framework — Quality of Education"]}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'Department Meeting' AND organization_id IS NULL
);

-- Safeguarding: DSL Supervision
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'DSL Supervision',
  'safeguarding',
  'Formal supervision session for the Designated Safeguarding Lead. Provides professional support, case review, and wellbeing check for the DSL.',
  '["Thank you for making time for this supervision session. It is an important part of supporting you in your role.", "This is a confidential space for you to reflect on your caseload, discuss any concerns, and receive support.", "Let us start by reviewing your current cases and any that have been particularly challenging since our last session."]'::jsonb,
  '["Thank you for being so thorough in your review today. Your dedication to safeguarding the children in our care is evident.", "To summarise the actions we have agreed: [summarise].", "Please do not wait for our next supervision if something is troubling you — my door is always open.", "Our next supervision session is on [date]."]'::jsonb,
  '[{"phrase": "Review the current safeguarding caseload.", "category": "Caseload", "is_critical": true, "order_index": 0}, {"phrase": "Discuss any new referrals or concerns since the last session.", "category": "Referrals", "is_critical": true, "order_index": 1}, {"phrase": "Review any open cases with external agencies (children''s social care, police, LADO).", "category": "Multi-Agency", "is_critical": true, "order_index": 2}, {"phrase": "Check that CPOMS / safeguarding records are up to date.", "category": "Record Keeping", "is_critical": true, "order_index": 3}, {"phrase": "Discuss the DSL''s own wellbeing and any impact of the caseload.", "category": "Wellbeing", "is_critical": true, "order_index": 4}, {"phrase": "Review safeguarding training needs and compliance.", "category": "Training", "is_critical": true, "order_index": 5}, {"phrase": "Identify any systemic issues or patterns.", "category": "Strategic", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Review the DSL''s caseload summary before the session.", "Check that all statutory referrals have been made within required timescales.", "Consider the DSL''s workload and emotional wellbeing.", "Review any safeguarding audits or Section 175 returns."], "documents_needed": ["Safeguarding caseload summary", "CPOMS / MyConcern log", "Previous supervision notes", "Safeguarding training matrix", "KCSIE Part 1 compliance record"], "key_phrases": ["Caseload review", "Referrals", "Multi-agency", "DSL wellbeing", "CPOMS records"], "policy_refs": ["Keeping Children Safe in Education (KCSIE)", "Working Together to Safeguard Children", "Safeguarding Policy"]}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'DSL Supervision' AND organization_id IS NULL
);

-- Teaching & Learning: Lesson Observation Debrief
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'Lesson Observation Debrief',
  'teaching_learning',
  'Post-observation feedback meeting. Follows a coaching model to support professional development. Not a judgement — focuses on strengths and areas for development.',
  '["Thank you for allowing me to observe your lesson today. I always appreciate the opportunity to see teaching and learning in action.", "This conversation is about professional growth, not judgement. I am here to support you.", "I would like to start by hearing your reflections on the lesson before I share mine. How do you feel it went?"]'::jsonb,
  '["Thank you for such an open and reflective conversation. I can see how much thought you put into your practice.", "To summarise what we have agreed: your key strength was [strength], and the development focus is [focus].", "I will arrange a follow-up visit in [X] weeks to see how the development area is progressing.", "If you would like any coaching, resources, or peer observation opportunities, please let me know."]'::jsonb,
  '[{"phrase": "Ask the teacher to reflect on the lesson first.", "category": "Coaching", "is_critical": true, "order_index": 0}, {"phrase": "Identify specific strengths observed during the lesson.", "category": "Strengths", "is_critical": true, "order_index": 1}, {"phrase": "Discuss the impact on pupil learning and progress.", "category": "Impact", "is_critical": true, "order_index": 2}, {"phrase": "Explore one or two areas for development.", "category": "Development", "is_critical": true, "order_index": 3}, {"phrase": "Discuss any differentiation or SEND provision observed.", "category": "Inclusion", "is_critical": true, "order_index": 4}, {"phrase": "Agree specific, achievable next steps.", "category": "Actions", "is_critical": true, "order_index": 5}, {"phrase": "Offer support: coaching, CPD, peer observation.", "category": "Support", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Review your observation notes and identify key strengths and development areas.", "Prepare specific examples from the lesson to discuss.", "Consider the context: class profile, time of day, subject.", "Plan open questions that encourage the teacher to reflect."], "documents_needed": ["Lesson observation form / notes", "Class profile (including SEND and PP information)", "Teachers'' Standards (for reference)", "Previous observation records (if applicable)"], "key_phrases": ["Professional growth", "Teacher reflection", "Pupil learning", "Next steps", "Coaching"], "policy_refs": ["Teachers'' Standards", "Ofsted Education Inspection Framework — Quality of Education", "School Teaching and Learning Policy"]}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'Lesson Observation Debrief' AND organization_id IS NULL
);

-- SEND: EHCP Annual Review
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'EHCP Annual Review',
  'send',
  'Statutory annual review of an Education, Health and Care Plan. Must be held within 12 months of the last review. Involves parents, the young person, and relevant professionals.',
  '["Thank you all for attending this annual review. I know how busy everyone is, and I appreciate you making the time.", "The purpose of this meeting is to review [pupil name]''s Education, Health and Care Plan, consider their progress, and discuss whether any changes are needed.", "We want to hear from everyone — especially from [pupil name / parents] — about how things have been going and what we should focus on for the year ahead.", "I will be taking notes, and a written report will be sent to the local authority and all attendees within two weeks."]'::jsonb,
  '["Thank you all for your contributions. It is clear that everyone here is committed to supporting [pupil name].", "To summarise the key points: [summarise outcomes, targets, and any requested amendments].", "I will write up the annual review report and send it to the local authority within two weeks, as required.", "If anyone has additional information to share, please send it to me within the next five working days so I can include it in the report.", "The next annual review will be due by [date — 12 months from today]."]'::jsonb,
  '[{"phrase": "Confirm all invited parties are present or have submitted written views.", "category": "Attendance", "is_critical": true, "order_index": 0}, {"phrase": "Seek the views of the child or young person.", "category": "Pupil Voice", "is_critical": true, "order_index": 1}, {"phrase": "Seek the views of the parents or carers.", "category": "Parent Voice", "is_critical": true, "order_index": 2}, {"phrase": "Review progress against the outcomes in the current EHCP.", "category": "Progress", "is_critical": true, "order_index": 3}, {"phrase": "Review the provision specified in Sections F, G, and H.", "category": "Provision", "is_critical": true, "order_index": 4}, {"phrase": "Discuss whether the EHCP should be maintained, amended, or ceased.", "category": "Decision", "is_critical": true, "order_index": 5}, {"phrase": "Set new targets and outcomes for the year ahead.", "category": "Targets", "is_critical": true, "order_index": 6}, {"phrase": "Confirm the report will be sent to the LA within two weeks.", "category": "Statutory", "is_critical": true, "order_index": 7}]'::jsonb,
  '{"context_prompts": ["Send invitations at least two weeks before the review date.", "Gather written reports from all professionals involved (e.g. SALT, EP, OT).", "Obtain the views of the child/young person in advance using a person-centred approach.", "Prepare a progress summary against each EHCP outcome."], "documents_needed": ["Current EHCP", "Progress reports from all professionals", "Pupil views (one-page profile, All About Me)", "Parent views", "Attendance data", "Assessment data", "Previous annual review report"], "key_phrases": ["Annual review", "EHCP outcomes", "Pupil voice", "Parent voice", "Maintain, amend, or cease"], "policy_refs": ["SEND Code of Practice 2015 — Chapter 9", "Children and Families Act 2014", "Special Educational Needs and Disability Regulations 2014"]}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'EHCP Annual Review' AND organization_id IS NULL
);

-- Parents: Parent Concern Meeting
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id)
SELECT
  'Parent Concern Meeting',
  'parents',
  'Meeting with a parent or carer who has raised a concern. Aims to listen, understand, and resolve the issue informally before it becomes a formal complaint.',
  '["Thank you for coming in to speak with us today. We appreciate you raising this with us directly.", "I want to assure you that we take your concerns seriously, and the purpose of this meeting is to listen, understand your perspective, and work together to find a resolution.", "Please take your time to explain what has happened. I will take notes so that we have an accurate record of our discussion."]'::jsonb,
  '["Thank you for sharing your concerns so openly. I understand this has been a difficult experience.", "To summarise what we have discussed and agreed: [summarise key points and actions].", "I will follow up on the actions we have agreed and will contact you by [date] with an update.", "If you feel the matter has not been resolved, you have the right to make a formal complaint. Our complaints procedure is available on the school website and from the office."]'::jsonb,
  '[{"phrase": "Thank the parent for raising their concern.", "category": "Opening", "is_critical": true, "order_index": 0}, {"phrase": "Listen without interruption to the parent''s account.", "category": "Listening", "is_critical": true, "order_index": 1}, {"phrase": "Clarify the specific concerns and what outcome the parent is seeking.", "category": "Understanding", "is_critical": true, "order_index": 2}, {"phrase": "Share relevant information (without breaching confidentiality of other pupils or staff).", "category": "Information Sharing", "is_critical": true, "order_index": 3}, {"phrase": "Agree actions and a timeline for resolution.", "category": "Resolution", "is_critical": true, "order_index": 4}, {"phrase": "Inform the parent of the formal complaints procedure if they wish to escalate.", "category": "Rights", "is_critical": true, "order_index": 5}]'::jsonb,
  '{"context_prompts": ["Review any background information about the concern before the meeting.", "Consider whether another member of staff should be present.", "Prepare factual information relevant to the concern.", "Ensure you have a private, comfortable meeting space."], "documents_needed": ["Any written correspondence from the parent", "Relevant incident records or behaviour logs", "School complaints procedure", "Class/pupil context (if appropriate)"], "key_phrases": ["We take your concerns seriously", "Work together", "Formal complaints procedure", "Follow up by"], "policy_refs": ["School Complaints Procedure", "DfE Best Practice Advice for School Complaints Procedures 2019"]}'::jsonb,
  false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM meeting_templates WHERE name = 'Parent Concern Meeting' AND organization_id IS NULL
);

-- ============================================================
-- 12. Seed system HR letter templates
-- ============================================================

-- Meeting Invitation
INSERT INTO hr_letter_templates (name, category, description, subject_template, body_template, available_placeholders, is_system, organization_id)
SELECT
  'Meeting Invitation',
  'meeting_invitation',
  'Standard letter inviting an employee to a formal meeting. Includes the right to be accompanied.',
  'Invitation to {{meeting_type}} — {{meeting_date}}',
  '<p>Dear {{staff_name}},</p>

<p>I am writing to invite you to a <strong>{{meeting_type}}</strong> which has been arranged for:</p>

<ul>
  <li><strong>Date:</strong> {{meeting_date}}</li>
  <li><strong>Time:</strong> {{meeting_time}}</li>
  <li><strong>Location:</strong> {{meeting_location}}</li>
  <li><strong>Chaired by:</strong> {{chair_name}}, {{chair_title}}</li>
</ul>

<p>The purpose of this meeting is {{meeting_purpose}}.</p>

<p>You have the right to be accompanied at this meeting by a trade union representative or a workplace colleague. Please let me know in advance if you intend to bring a companion so that appropriate arrangements can be made.</p>

<p>If you are unable to attend on this date, please contact me as soon as possible so that we can arrange an alternative time. Please note that if you fail to attend without giving reasonable notice, the meeting may proceed in your absence.</p>

<p>If you have any questions about this letter or the meeting, please do not hesitate to contact me.</p>

<p>Yours sincerely,</p>

<p>{{sender_name}}<br/>{{sender_title}}<br/>{{school_name}}</p>',
  '["staff_name", "meeting_type", "meeting_date", "meeting_time", "meeting_location", "chair_name", "chair_title", "meeting_purpose", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM hr_letter_templates WHERE name = 'Meeting Invitation' AND is_system = true AND organization_id IS NULL
);

-- Absence Warning (Stage 1)
INSERT INTO hr_letter_templates (name, category, description, subject_template, body_template, available_placeholders, is_system, organization_id)
SELECT
  'Absence Warning — Stage 1',
  'absence_warning',
  'Formal Stage 1 absence warning letter following a sickness review meeting. Sets out attendance targets and consequences of non-improvement.',
  'Outcome of Stage 1 Sickness Absence Review Meeting — {{meeting_date}}',
  '<p>Dear {{staff_name}},</p>

<p>I am writing to confirm the outcome of the Stage 1 Sickness Absence Review meeting held on <strong>{{meeting_date}}</strong>.</p>

<p>Present at the meeting were:</p>
<ul>
  <li>{{chair_name}}, {{chair_title}} (Chair)</li>
  <li>{{staff_name}}, {{staff_title}}</li>
  <li>{{companion_name}} ({{companion_role}})</li>
</ul>

<p><strong>Absence Record</strong></p>
<p>During the review period of {{review_period}}, your absence record is as follows:</p>
<ul>
  <li><strong>Number of occasions of absence:</strong> {{absence_occasions}}</li>
  <li><strong>Total working days lost:</strong> {{absence_days}}</li>
  <li><strong>Bradford Factor score:</strong> {{bradford_score}}</li>
</ul>

<p>This level of absence has triggered a formal review under Stage 1 of the school''s Sickness Absence Policy.</p>

<p><strong>Decision</strong></p>
<p>Having considered all the information presented at the meeting, I have decided to issue a <strong>Stage 1 Written Warning</strong>. This warning will remain on your personnel file for a period of <strong>{{warning_duration}}</strong>.</p>

<p><strong>Attendance Target</strong></p>
<p>Your attendance will be monitored over the next <strong>{{monitoring_period}}</strong>. During this time, you are expected to achieve the following target:</p>
<ul>
  <li>{{attendance_target}}</li>
</ul>

<p>If your attendance does not improve to the required level during the monitoring period, a Stage 2 review meeting may be convened, which could result in a final written warning.</p>

<p><strong>Support</strong></p>
<p>The following support has been agreed:</p>
<ul>
  <li>{{support_measures}}</li>
</ul>

<p><strong>Right of Appeal</strong></p>
<p>You have the right to appeal against this decision. Any appeal must be submitted in writing to {{appeal_recipient}} within {{appeal_deadline}} working days of receiving this letter.</p>

<p>If you have any questions, please do not hesitate to contact me.</p>

<p>Yours sincerely,</p>

<p>{{sender_name}}<br/>{{sender_title}}<br/>{{school_name}}</p>',
  '["staff_name", "staff_title", "meeting_date", "chair_name", "chair_title", "companion_name", "companion_role", "review_period", "absence_occasions", "absence_days", "bradford_score", "warning_duration", "monitoring_period", "attendance_target", "support_measures", "appeal_recipient", "appeal_deadline", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM hr_letter_templates WHERE name = 'Absence Warning — Stage 1' AND is_system = true AND organization_id IS NULL
);

-- Return to Work Letter
INSERT INTO hr_letter_templates (name, category, description, subject_template, body_template, available_placeholders, is_system, organization_id)
SELECT
  'Return to Work Confirmation',
  'return_to_work',
  'Letter confirming the outcome of a return-to-work meeting and any agreed support or adjustments.',
  'Return to Work Meeting — Confirmation of Discussion',
  '<p>Dear {{staff_name}},</p>

<p>Thank you for attending the return-to-work meeting on <strong>{{meeting_date}}</strong> following your absence from <strong>{{absence_start}}</strong> to <strong>{{absence_end}}</strong> ({{absence_days}} working days).</p>

<p>This letter confirms what was discussed during our meeting.</p>

<p><strong>Reason for Absence</strong></p>
<p>You informed me that your absence was due to {{absence_reason}}.</p>

<p><strong>Fitness to Return</strong></p>
<p>You have confirmed that you are fit to return to your full duties{{phased_return_text}}.</p>

<p><strong>Support Agreed</strong></p>
<ul>
  <li>{{support_measures}}</li>
</ul>

<p><strong>Absence Record</strong></p>
<p>For your information, your absence record for the current review period ({{review_period}}) is:</p>
<ul>
  <li><strong>Occasions of absence:</strong> {{total_occasions}}</li>
  <li><strong>Total working days lost:</strong> {{total_days}}</li>
</ul>

{{trigger_text}}

<p>I hope you continue to feel well. If there is anything further I can do to support you, please do not hesitate to let me know.</p>

<p>Yours sincerely,</p>

<p>{{sender_name}}<br/>{{sender_title}}<br/>{{school_name}}</p>',
  '["staff_name", "meeting_date", "absence_start", "absence_end", "absence_days", "absence_reason", "phased_return_text", "support_measures", "review_period", "total_occasions", "total_days", "trigger_text", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM hr_letter_templates WHERE name = 'Return to Work Confirmation' AND is_system = true AND organization_id IS NULL
);

-- Occupational Health Referral
INSERT INTO hr_letter_templates (name, category, description, subject_template, body_template, available_placeholders, is_system, organization_id)
SELECT
  'Occupational Health Referral',
  'occupational_health_referral',
  'Letter to the occupational health provider requesting an assessment of a staff member.',
  'Occupational Health Referral — {{staff_name}}',
  '<p>Dear Occupational Health Practitioner,</p>

<p>I am writing to request an occupational health assessment for the following member of staff:</p>

<ul>
  <li><strong>Name:</strong> {{staff_name}}</li>
  <li><strong>Job Title:</strong> {{staff_title}}</li>
  <li><strong>Date of Birth:</strong> {{staff_dob}}</li>
  <li><strong>Start Date:</strong> {{staff_start_date}}</li>
  <li><strong>School:</strong> {{school_name}}</li>
</ul>

<p><strong>Reason for Referral</strong></p>
<p>{{referral_reason}}</p>

<p><strong>Absence History</strong></p>
<p>During the past {{review_period}}, {{staff_name}} has had {{absence_occasions}} occasion(s) of absence totalling {{absence_days}} working days. The reasons recorded are: {{absence_reasons}}.</p>

<p><strong>Questions for the Occupational Health Practitioner</strong></p>
<ol>
  <li>Is {{staff_name}} fit to carry out the full duties of their role? If not, what duties can they undertake?</li>
  <li>Is there an underlying medical condition that may be contributing to their absence?</li>
  <li>Is the condition likely to be covered by the Equality Act 2010? If so, what reasonable adjustments would you recommend?</li>
  <li>What is the likely timescale for a return to full duties?</li>
  <li>Would a phased return to work be beneficial? If so, please outline a recommended plan.</li>
  <li>Are there any workplace factors that may be contributing to the condition?</li>
  <li>Is there any further treatment or support that could aid recovery?</li>
  <li>Are there any adjustments to the working environment or duties that would support attendance?</li>
</ol>

<p>Please contact the employee directly to arrange the appointment. A copy of this referral has been shared with {{staff_name}}.</p>

<p>If you require any further information, please do not hesitate to contact me.</p>

<p>Yours faithfully,</p>

<p>{{sender_name}}<br/>{{sender_title}}<br/>{{school_name}}<br/>{{school_address}}<br/>{{sender_email}}</p>',
  '["staff_name", "staff_title", "staff_dob", "staff_start_date", "school_name", "school_address", "referral_reason", "review_period", "absence_occasions", "absence_days", "absence_reasons", "sender_name", "sender_title", "sender_email"]'::jsonb,
  true, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM hr_letter_templates WHERE name = 'Occupational Health Referral' AND is_system = true AND organization_id IS NULL
);

-- ============================================================
-- 13. RLS Policies
-- ============================================================

-- meeting_attendees
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meeting_attendees_select') THEN
    CREATE POLICY "meeting_attendees_select" ON meeting_attendees
      FOR SELECT USING (
        meeting_id IN (
          SELECT id FROM meetings WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meeting_attendees_insert') THEN
    CREATE POLICY "meeting_attendees_insert" ON meeting_attendees
      FOR INSERT WITH CHECK (
        meeting_id IN (
          SELECT id FROM meetings WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meeting_attendees_update') THEN
    CREATE POLICY "meeting_attendees_update" ON meeting_attendees
      FOR UPDATE USING (
        meeting_id IN (
          SELECT id FROM meetings WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meeting_attendees_delete') THEN
    CREATE POLICY "meeting_attendees_delete" ON meeting_attendees
      FOR DELETE USING (
        meeting_id IN (
          SELECT id FROM meetings WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

-- meeting_actions
ALTER TABLE meeting_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meeting_actions_select') THEN
    CREATE POLICY "meeting_actions_select" ON meeting_actions
      FOR SELECT USING (
        meeting_id IN (
          SELECT id FROM meetings WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meeting_actions_insert') THEN
    CREATE POLICY "meeting_actions_insert" ON meeting_actions
      FOR INSERT WITH CHECK (
        meeting_id IN (
          SELECT id FROM meetings WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meeting_actions_update') THEN
    CREATE POLICY "meeting_actions_update" ON meeting_actions
      FOR UPDATE USING (
        meeting_id IN (
          SELECT id FROM meetings WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'meeting_actions_delete') THEN
    CREATE POLICY "meeting_actions_delete" ON meeting_actions
      FOR DELETE USING (
        meeting_id IN (
          SELECT id FROM meetings WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

-- sickness_absence_records
ALTER TABLE sickness_absence_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sickness_absence_records_select') THEN
    CREATE POLICY "sickness_absence_records_select" ON sickness_absence_records
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sickness_absence_records_insert') THEN
    CREATE POLICY "sickness_absence_records_insert" ON sickness_absence_records
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sickness_absence_records_update') THEN
    CREATE POLICY "sickness_absence_records_update" ON sickness_absence_records
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sickness_absence_records_delete') THEN
    CREATE POLICY "sickness_absence_records_delete" ON sickness_absence_records
      FOR DELETE USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- sickness_trigger_config
ALTER TABLE sickness_trigger_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sickness_trigger_config_select') THEN
    CREATE POLICY "sickness_trigger_config_select" ON sickness_trigger_config
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sickness_trigger_config_insert') THEN
    CREATE POLICY "sickness_trigger_config_insert" ON sickness_trigger_config
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sickness_trigger_config_update') THEN
    CREATE POLICY "sickness_trigger_config_update" ON sickness_trigger_config
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sickness_trigger_config_delete') THEN
    CREATE POLICY "sickness_trigger_config_delete" ON sickness_trigger_config
      FOR DELETE USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- hr_letter_templates
ALTER TABLE hr_letter_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hr_letter_templates_select') THEN
    CREATE POLICY "hr_letter_templates_select" ON hr_letter_templates
      FOR SELECT USING (
        organization_id IS NULL
        OR organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hr_letter_templates_insert') THEN
    CREATE POLICY "hr_letter_templates_insert" ON hr_letter_templates
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hr_letter_templates_update') THEN
    CREATE POLICY "hr_letter_templates_update" ON hr_letter_templates
      FOR UPDATE USING (
        is_system = false
        AND organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hr_letter_templates_delete') THEN
    CREATE POLICY "hr_letter_templates_delete" ON hr_letter_templates
      FOR DELETE USING (
        is_system = false
        AND organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

-- hr_letters_generated
ALTER TABLE hr_letters_generated ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hr_letters_generated_select') THEN
    CREATE POLICY "hr_letters_generated_select" ON hr_letters_generated
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hr_letters_generated_insert') THEN
    CREATE POLICY "hr_letters_generated_insert" ON hr_letters_generated
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hr_letters_generated_update') THEN
    CREATE POLICY "hr_letters_generated_update" ON hr_letters_generated
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'hr_letters_generated_delete') THEN
    CREATE POLICY "hr_letters_generated_delete" ON hr_letters_generated
      FOR DELETE USING (
        organization_id IN (
          SELECT organization_id FROM users WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
