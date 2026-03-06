-- Meeting Companion & HR Sentinel module
-- 5 tables: meeting_templates, meetings, meeting_checklist_items, meeting_transcripts, meeting_minutes

-- ============================================================
-- 1. meeting_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('hr', 'operational', 'governance')),
  description TEXT,
  opening_script JSONB NOT NULL DEFAULT '[]',
  closing_script JSONB NOT NULL DEFAULT '[]',
  compliance_items JSONB NOT NULL DEFAULT '[]',
  preparation_guide JSONB NOT NULL DEFAULT '{}',
  is_custom BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meeting_templates_org ON meeting_templates(organization_id);
CREATE INDEX idx_meeting_templates_category ON meeting_templates(category);

-- ============================================================
-- 2. meetings
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES meeting_templates(id),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL,
  attendee_name TEXT NOT NULL,
  attendee_role TEXT,
  purpose TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  calendar_event_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  notes JSONB NOT NULL DEFAULT '[]',
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_meetings_org ON meetings(organization_id);
CREATE INDEX idx_meetings_leader ON meetings(leader_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX idx_meetings_template ON meetings(template_id);

-- ============================================================
-- 3. meeting_checklist_items
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  phrase TEXT NOT NULL,
  category TEXT,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'red'
    CHECK (status IN ('red', 'amber', 'green')),
  manually_ticked BOOLEAN NOT NULL DEFAULT false,
  detected_at TIMESTAMPTZ,
  ai_confidence FLOAT,
  ai_suggestion TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_meeting_checklist_meeting ON meeting_checklist_items(meeting_id);

-- ============================================================
-- 4. meeting_transcripts (Phase 3 — table created now)
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  chunks JSONB NOT NULL DEFAULT '[]',
  full_text TEXT,
  audio_url TEXT
);

CREATE UNIQUE INDEX idx_meeting_transcripts_meeting ON meeting_transcripts(meeting_id);

-- ============================================================
-- 5. meeting_minutes
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  content JSONB,
  html TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'finalised')),
  exported_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_meeting_minutes_meeting ON meeting_minutes(meeting_id);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE meeting_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_minutes ENABLE ROW LEVEL SECURITY;

-- meeting_templates: global templates readable by all, custom scoped to org
CREATE POLICY "meeting_templates_select" ON meeting_templates
  FOR SELECT USING (
    organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "meeting_templates_insert" ON meeting_templates
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "meeting_templates_update" ON meeting_templates
  FOR UPDATE USING (
    is_custom = true
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "meeting_templates_delete" ON meeting_templates
  FOR DELETE USING (
    is_custom = true
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- meetings: scoped to organization
CREATE POLICY "meetings_select" ON meetings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "meetings_insert" ON meetings
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "meetings_update" ON meetings
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "meetings_delete" ON meetings
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- meeting_checklist_items: via meeting's org
CREATE POLICY "meeting_checklist_select" ON meeting_checklist_items
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "meeting_checklist_modify" ON meeting_checklist_items
  FOR ALL USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- meeting_transcripts: via meeting's org
CREATE POLICY "meeting_transcripts_select" ON meeting_transcripts
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "meeting_transcripts_modify" ON meeting_transcripts
  FOR ALL USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- meeting_minutes: via meeting's org
CREATE POLICY "meeting_minutes_select" ON meeting_minutes
  FOR SELECT USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "meeting_minutes_modify" ON meeting_minutes
  FOR ALL USING (
    meeting_id IN (
      SELECT id FROM meetings WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================================
-- Seed: 8 Global Meeting Templates
-- ============================================================
INSERT INTO meeting_templates (name, category, description, opening_script, closing_script, compliance_items, preparation_guide, is_custom, organization_id) VALUES

-- 1. Return to Work — Short-term Absence
(
  'Return to Work — Short-term Absence',
  'hr',
  'Conducted after any period of sickness absence (typically 1–3 days). Ensures the employee is fit to return, identifies any support needed, and maintains the absence record.',
  '["Thank you for coming in to see me today. This is a routine return-to-work meeting following your recent absence.", "The purpose of this meeting is to welcome you back, check that you are well enough to return, and see if there is anything we can do to support you.", "This is an informal conversation and nothing you say will be used against you. I just want to make sure you are okay."]'::jsonb,
  '["Thank you for talking with me today. I hope you feel supported in your return.", "I will update your absence record and send you a copy of the notes from this meeting within five working days.", "If anything changes or you need further support, please do not hesitate to speak to me or another member of the leadership team."]'::jsonb,
  '[{"phrase": "Welcome back. We''re glad to see you.", "category": "Wellbeing", "is_critical": false, "order_index": 0}, {"phrase": "Can you tell me about your absence and how you''re feeling now?", "category": "Absence Detail", "is_critical": true, "order_index": 1}, {"phrase": "Is there anything work-related that contributed to your absence?", "category": "Root Cause", "is_critical": true, "order_index": 2}, {"phrase": "Is there anything we can do to support your return?", "category": "Support", "is_critical": true, "order_index": 3}, {"phrase": "Are you aware of our sickness absence policy and the triggers for formal review?", "category": "Policy", "is_critical": true, "order_index": 4}, {"phrase": "Is there anything else you''d like to discuss or any support you need?", "category": "Open", "is_critical": false, "order_index": 5}]'::jsonb,
  '{"context_prompts": ["Review the employee''s absence record before the meeting.", "Check whether this absence triggers any policy thresholds.", "Consider whether a referral to occupational health is appropriate."], "documents_needed": ["Employee absence record", "Sickness absence policy", "Return-to-work form (if applicable)"], "key_phrases": ["Welcome back", "Support your return", "Sickness absence policy", "Triggers for formal review"], "policy_refs": ["School Sickness Absence Policy", "ACAS Managing Attendance and Employee Turnover guidance"]}'::jsonb,
  false, NULL
),

-- 2. Return to Work — Long-term Absence
(
  'Return to Work — Long-term Absence',
  'hr',
  'For absences exceeding 4 weeks. Includes phased return planning, occupational health referral consideration, reasonable adjustments, and wellbeing support.',
  '["Welcome back. We want to make sure your return is as smooth as possible.", "This meeting is to discuss how you are feeling, whether any adjustments would help, and to plan your return together.", "There is no rush — take your time, and please let me know if you need a break at any point."]'::jsonb,
  '["Thank you for being so open with me today. We will put the agreed support in place before your first full day back.", "I will send you a written summary of what we have agreed, including any phased return arrangements and reasonable adjustments.", "We will schedule a follow-up meeting in [X] weeks to see how things are going. You can contact me at any time before then if you need anything."]'::jsonb,
  '[{"phrase": "Welcome back. We want to make sure your return is as smooth as possible.", "category": "Wellbeing", "is_critical": false, "order_index": 0}, {"phrase": "How are you feeling about coming back to work?", "category": "Wellbeing", "is_critical": true, "order_index": 1}, {"phrase": "Have there been any changes to your condition that we should be aware of?", "category": "Medical", "is_critical": true, "order_index": 2}, {"phrase": "Would a phased return be helpful for you?", "category": "Adjustments", "is_critical": true, "order_index": 3}, {"phrase": "Are there any reasonable adjustments we can put in place?", "category": "Adjustments", "is_critical": true, "order_index": 4}, {"phrase": "Have you been referred to or would you like a referral to occupational health?", "category": "Medical", "is_critical": true, "order_index": 5}, {"phrase": "Here is your current absence record. Let me explain what happens next under our policy.", "category": "Policy", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Review the full absence history and any medical certificates received.", "Check whether an occupational health referral has already been made.", "Consider what reasonable adjustments might be appropriate.", "Prepare a draft phased return plan to discuss."], "documents_needed": ["Employee absence record", "Medical certificates / fit notes", "Occupational health report (if available)", "Sickness absence policy", "Phased return plan template"], "key_phrases": ["Phased return", "Reasonable adjustments", "Occupational health", "Absence record"], "policy_refs": ["School Sickness Absence Policy", "Equality Act 2010 — Reasonable Adjustments", "ACAS Managing Attendance guidance"]}'::jsonb,
  false, NULL
),

-- 3. Informal Sickness Review
(
  'Informal Sickness Review',
  'hr',
  'Triggered when an employee hits an absence trigger point. Supportive in tone but ensures the employee understands the formal process that follows if attendance does not improve.',
  '["Thank you for meeting with me today. I want to start by saying that this is an informal conversation — it is not a disciplinary meeting.", "The purpose is to discuss your recent attendance, understand if there are any underlying issues, and see what support we can offer.", "I value you as a member of the team and I want to work with you to find a way forward."]'::jsonb,
  '["Thank you for being honest with me today. I appreciate that these conversations can feel uncomfortable.", "To summarise, we have agreed the following actions: [summarise agreed actions].", "I will monitor your attendance over the next [X] weeks. If your attendance improves, no further action will be needed. If it does not, the next step would be a formal Stage 1 meeting.", "I will send you a written record of this conversation within five working days."]'::jsonb,
  '[{"phrase": "This is an informal meeting to discuss your attendance.", "category": "Meeting Type", "is_critical": true, "order_index": 0}, {"phrase": "I want to understand if there are any underlying issues we can help with.", "category": "Support", "is_critical": true, "order_index": 1}, {"phrase": "Your current absence record shows [X days / X occasions] in the last [period].", "category": "Data", "is_critical": true, "order_index": 2}, {"phrase": "This has triggered an informal review under our sickness absence policy.", "category": "Policy", "is_critical": true, "order_index": 3}, {"phrase": "Is there anything happening at work or at home that is affecting your attendance?", "category": "Root Cause", "is_critical": true, "order_index": 4}, {"phrase": "What support can we offer to help improve your attendance?", "category": "Support", "is_critical": true, "order_index": 5}, {"phrase": "If your attendance does not improve, the next step would be a formal Stage 1 review.", "category": "Escalation", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Prepare the employee''s absence data: total days, number of occasions, pattern analysis.", "Review which policy trigger has been hit.", "Consider whether there may be an underlying health condition (Equality Act implications).", "Think about what support has already been offered."], "documents_needed": ["Employee absence record with dates and reasons", "Sickness absence policy (trigger points highlighted)", "Any previous return-to-work meeting notes", "Support services information (EAP, occupational health)"], "key_phrases": ["Informal meeting", "Absence trigger", "Support", "Stage 1 review"], "policy_refs": ["School Sickness Absence Policy — Trigger Points", "ACAS Code of Practice on Disciplinary and Grievance Procedures"]}'::jsonb,
  false, NULL
),

-- 4. Formal Sickness Review (Stage 1 / 2 / 3)
(
  'Formal Sickness Review (Stage 1 / 2 / 3)',
  'hr',
  'Formal meeting under the school''s sickness absence procedure. Employee has the right to be accompanied by a trade union representative or colleague.',
  '["Good [morning/afternoon]. Thank you for attending this meeting.", "This is a formal meeting under Stage [X] of our sickness absence procedure. I will explain the purpose and process before we begin.", "You have the right to be accompanied by a trade union representative or a workplace colleague. Can you confirm whether you have chosen to bring someone with you today?", "I will take notes during this meeting, and you will receive a written record of the discussion and any outcomes within five working days."]'::jsonb,
  '["Thank you for attending this meeting and for sharing your views.", "I will now consider everything that has been discussed before reaching a decision. You will receive the outcome in writing within [X] working days.", "You will have the right to appeal any decision made as a result of this meeting. The appeal process is set out in the sickness absence policy.", "Do you have any questions before we close?"]'::jsonb,
  '[{"phrase": "This is a formal meeting under Stage [X] of our sickness absence procedure.", "category": "Meeting Type", "is_critical": true, "order_index": 0}, {"phrase": "You have the right to be accompanied by a trade union representative or workplace colleague.", "category": "Rights", "is_critical": true, "order_index": 1}, {"phrase": "I will explain the purpose of this meeting and what may happen as a result.", "category": "Process", "is_critical": true, "order_index": 2}, {"phrase": "Your absence record for the review period is as follows...", "category": "Data", "is_critical": true, "order_index": 3}, {"phrase": "Have you received and understood the letter inviting you to this meeting?", "category": "Process", "is_critical": true, "order_index": 4}, {"phrase": "Is there any medical evidence or mitigating circumstances you wish to present?", "category": "Evidence", "is_critical": true, "order_index": 5}, {"phrase": "What support has been offered and what has been the outcome?", "category": "Support", "is_critical": true, "order_index": 6}, {"phrase": "I will now explain the possible outcomes of this meeting.", "category": "Outcomes", "is_critical": true, "order_index": 7}]'::jsonb,
  '{"context_prompts": ["Confirm the employee received the invitation letter at least 5 working days in advance.", "Prepare a chronological summary of all absence, support offered, and previous meetings.", "Check whether the employee is accompanied and note who is present.", "Have a clear understanding of the possible outcomes at this stage."], "documents_needed": ["Invitation letter (copy)", "Employee absence record (full history)", "Notes from any previous informal/formal meetings", "Occupational health reports", "Sickness absence policy", "Medical certificates / fit notes"], "key_phrases": ["Formal meeting", "Right to be accompanied", "Trade union representative", "Possible outcomes", "Right of appeal"], "policy_refs": ["School Sickness Absence Policy — Formal Stages", "ACAS Code of Practice on Disciplinary and Grievance Procedures", "Employment Rights Act 1996 — Section 10 (right to be accompanied)"]}'::jsonb,
  false, NULL
),

-- 5. Informal Capability Conversation
(
  'Informal Capability Conversation',
  'hr',
  'An early, supportive conversation when concerns about performance or capability first arise. Not a disciplinary matter.',
  '["Thank you for meeting with me. I want to have an open and honest conversation about how things are going.", "I want to be clear that this is not a formal process and it is not a disciplinary matter. This is about support and development.", "I want to hear your perspective and work together on a plan that helps you succeed."]'::jsonb,
  '["Thank you for being so open. I think this has been a productive conversation.", "To summarise, we have agreed the following targets and support: [summarise].", "We will meet again in [X] weeks to review progress. In the meantime, I am here if you need any help or have any concerns.", "I will send you a brief written summary of what we discussed and agreed."]'::jsonb,
  '[{"phrase": "I want to have an open conversation about how things are going in your role.", "category": "Opening", "is_critical": true, "order_index": 0}, {"phrase": "I''ve noticed some areas where I think we can work together to improve.", "category": "Concerns", "is_critical": true, "order_index": 1}, {"phrase": "This is not a formal process. It''s about support and development.", "category": "Reassurance", "is_critical": true, "order_index": 2}, {"phrase": "Can you share your perspective on how you feel things are going?", "category": "Employee Voice", "is_critical": true, "order_index": 3}, {"phrase": "What barriers or challenges are you facing?", "category": "Root Cause", "is_critical": true, "order_index": 4}, {"phrase": "Let''s agree on some specific targets and a timeline for review.", "category": "Actions", "is_critical": true, "order_index": 5}, {"phrase": "What training or support would help you?", "category": "Support", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Prepare specific, factual examples of the concerns (not opinions or hearsay).", "Consider what support, training, or resources could help.", "Think about SMART targets that are fair and achievable.", "Reflect on whether there are any external factors that may be contributing."], "documents_needed": ["Performance data or lesson observation notes", "Job description and person specification", "Capability/appraisal policy", "CPD records"], "key_phrases": ["Support and development", "Not a formal process", "Specific targets", "Timeline for review"], "policy_refs": ["School Capability Policy", "Teachers'' Standards (if applicable)", "ACAS Managing Performance guidance"]}'::jsonb,
  false, NULL
),

-- 6. Wellbeing Check-in
(
  'Wellbeing Check-in',
  'hr',
  'A general wellbeing conversation. Can be scheduled regularly or triggered by concerns. Focuses on the whole person, not just work performance.',
  '["Thank you for taking the time to meet with me. This is a confidential wellbeing check-in.", "There is no agenda or form to fill in — I just want to see how you are doing and whether there is anything I can do to support you.", "Nothing you say will be shared with anyone else unless you tell me something that raises a safeguarding concern, in which case I have a duty to act."]'::jsonb,
  '["Thank you for talking with me today. I really appreciate your openness.", "Remember, you can come to me at any time if something is on your mind.", "I will follow up on the things we discussed: [summarise any agreed actions].", "Take care of yourself, and I will check in again in [X] weeks."]'::jsonb,
  '[{"phrase": "This is a confidential check-in. Nothing you say will be shared without your consent unless there is a safeguarding concern.", "category": "Confidentiality", "is_critical": true, "order_index": 0}, {"phrase": "How are you doing, generally?", "category": "Wellbeing", "is_critical": true, "order_index": 1}, {"phrase": "Is there anything at work that''s causing you stress or concern?", "category": "Work", "is_critical": true, "order_index": 2}, {"phrase": "Is there anything outside of work that''s affecting you that you''d like support with?", "category": "Personal", "is_critical": false, "order_index": 3}, {"phrase": "Are you aware of the support services available to you, such as our Employee Assistance Programme?", "category": "Support", "is_critical": true, "order_index": 4}, {"phrase": "Is there anything I can do differently as your manager to support you?", "category": "Management", "is_critical": true, "order_index": 5}]'::jsonb,
  '{"context_prompts": ["Reflect on any recent changes in the employee''s behaviour or demeanour.", "Check whether they have had recent absences or have seemed withdrawn.", "Ensure you have a private, comfortable space for the conversation.", "Be prepared to listen more than you talk."], "documents_needed": ["Employee Assistance Programme details", "Mental health first aider contact information", "Occupational health referral form (in case needed)"], "key_phrases": ["Confidential", "How are you doing", "Support services", "Employee Assistance Programme"], "policy_refs": ["Staff Wellbeing Policy", "Safeguarding Policy (disclosure protocol)", "Health and Safety at Work Act 1974 — duty of care"]}'::jsonb,
  false, NULL
),

-- 7. Probation Review
(
  'Probation Review',
  'hr',
  'End-of-probation or mid-probation review meeting. Assesses performance against initial objectives and determines whether probation is passed, extended, or employment ended.',
  '["Thank you for meeting with me today. This meeting is to review your progress during your probation period.", "We will look at the objectives that were set when you started, hear your perspective on how things have gone, and discuss the next steps.", "This is a two-way conversation — I want to hear your views as well as share feedback."]'::jsonb,
  '["Thank you for your contributions during this probation period.", "Based on our discussion today, the outcome is: [state outcome — pass / extend / end].", "I will confirm this in writing within five working days, along with any ongoing objectives or support.", "Do you have any questions or anything else you would like to raise?"]'::jsonb,
  '[{"phrase": "This meeting is to review your progress during your probation period.", "category": "Purpose", "is_critical": true, "order_index": 0}, {"phrase": "Let''s look at the objectives that were set at the start of your employment.", "category": "Review", "is_critical": true, "order_index": 1}, {"phrase": "How do you feel you have settled into the role?", "category": "Employee Voice", "is_critical": true, "order_index": 2}, {"phrase": "Is there any training or support you feel you still need?", "category": "Support", "is_critical": true, "order_index": 3}, {"phrase": "I''d like to share feedback from your line manager and colleagues.", "category": "Feedback", "is_critical": true, "order_index": 4}, {"phrase": "Based on this review, the outcome is...", "category": "Outcome", "is_critical": true, "order_index": 5}]'::jsonb,
  '{"context_prompts": ["Gather feedback from colleagues, line manager, and any relevant stakeholders.", "Review the objectives set at the start of employment.", "Prepare evidence of performance against each objective.", "Consider whether the probation should be passed, extended, or ended — and the rationale."], "documents_needed": ["Probation objectives / induction plan", "Performance evidence (observations, feedback, data)", "Contract of employment (probation clause)", "Probation policy"], "key_phrases": ["Probation period", "Objectives", "Feedback", "Outcome"], "policy_refs": ["Probation Policy", "Contract of Employment — Probation Clause", "ACAS Recruitment and Induction guidance"]}'::jsonb,
  false, NULL
),

-- 8. Grievance Hearing (Initial)
(
  'Grievance Hearing (Initial)',
  'hr',
  'Formal meeting to hear an employee''s grievance. Must follow the ACAS Code of Practice.',
  '["Good [morning/afternoon]. Thank you for attending this grievance hearing.", "You have the right to be accompanied by a trade union representative or a workplace colleague. Can you confirm who is present with you today?", "The purpose of this hearing is to listen to your grievance, ask questions to ensure I fully understand it, and determine what steps to take next.", "I have received your written grievance dated [date]. I will ask you to explain it in your own words, and then I may ask some clarifying questions."]'::jsonb,
  '["Thank you for explaining your grievance. I appreciate that raising it may not have been easy.", "I will now consider everything you have told me. I may need to carry out further investigation before reaching a decision.", "You will receive the outcome in writing within [X] working days.", "If you are not satisfied with the outcome, you have the right to appeal. The appeal process is set out in the grievance policy."]'::jsonb,
  '[{"phrase": "This is a formal grievance hearing. You have the right to be accompanied.", "category": "Rights", "is_critical": true, "order_index": 0}, {"phrase": "I have received your written grievance dated [date].", "category": "Process", "is_critical": true, "order_index": 1}, {"phrase": "Please explain your grievance in your own words.", "category": "Employee Voice", "is_critical": true, "order_index": 2}, {"phrase": "What outcome are you seeking?", "category": "Resolution", "is_critical": true, "order_index": 3}, {"phrase": "I may need to adjourn to investigate further before reaching a decision.", "category": "Process", "is_critical": true, "order_index": 4}, {"phrase": "You will receive the outcome in writing within [X] working days.", "category": "Outcome", "is_critical": true, "order_index": 5}, {"phrase": "You have the right to appeal if you are not satisfied with the outcome.", "category": "Rights", "is_critical": true, "order_index": 6}]'::jsonb,
  '{"context_prompts": ["Read the written grievance carefully and identify the key issues.", "Consider whether you need to arrange for an impartial hearing officer.", "Prepare questions to clarify the nature and scope of the grievance.", "Ensure the employee was given at least 5 working days'' notice of this hearing."], "documents_needed": ["Written grievance from the employee", "Invitation letter (copy)", "Grievance policy", "Any relevant correspondence or evidence", "ACAS Code of Practice on Disciplinary and Grievance Procedures"], "key_phrases": ["Formal grievance hearing", "Right to be accompanied", "Written outcome", "Right to appeal"], "policy_refs": ["School Grievance Policy", "ACAS Code of Practice on Disciplinary and Grievance Procedures", "Employment Relations Act 1999 — Section 10"]}'::jsonb,
  false, NULL
);
