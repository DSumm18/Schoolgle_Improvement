-- ============================================================================
-- Survey Module - Complete Schema
-- ============================================================================

-- Enums
CREATE TYPE survey_status AS ENUM ('draft', 'active', 'paused', 'closed', 'archived');
CREATE TYPE survey_type AS ENUM ('standard', 'nps', 'pulse', 'poll', 'quiz', 'assessment', 'feedback_360');
CREATE TYPE audience_type AS ENUM ('parent', 'staff', 'student', 'governor', 'mixed', 'public');
CREATE TYPE question_type AS ENUM (
  'multiple_choice', 'checkbox', 'dropdown', 'short_text', 'long_text',
  'rating', 'nps', 'likert_scale', 'matrix', 'ranking',
  'slider', 'date_picker', 'file_upload', 'image_choice', 'yes_no',
  'opinion_scale', 'continuous_sum', 'semantic_differential', 'contact_info', 'statement'
);
CREATE TYPE condition_type AS ENUM (
  'equals', 'not_equals', 'contains', 'greater_than', 'less_than',
  'is_answered', 'is_not_answered', 'between', 'starts_with', 'ends_with'
);
CREATE TYPE logic_action_type AS ENUM (
  'skip_to_page', 'skip_to_question', 'hide_question', 'show_question',
  'hide_page', 'end_survey', 'set_variable', 'trigger_email'
);
CREATE TYPE response_status AS ENUM ('in_progress', 'completed', 'disqualified');
CREATE TYPE distribution_channel AS ENUM ('email', 'sms', 'link', 'qr_code', 'embed', 'parentmail_integration');
CREATE TYPE distribution_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');
CREATE TYPE email_trigger_type AS ENUM ('on_complete', 'on_condition', 'on_nps_detractor', 'on_low_score', 'scheduled_digest');
CREATE TYPE email_recipient_type AS ENUM ('fixed_email', 'respondent_email', 'piped_from_question', 'role_based');
CREATE TYPE template_category AS ENUM (
  'parent_satisfaction', 'staff_wellbeing', 'student_voice', 'governor_feedback',
  'event_feedback', 'ofsted_prep', 'safeguarding', 'curriculum', 'facilities',
  'communication', 'custom'
);
CREATE TYPE collaborator_role AS ENUM ('editor', 'viewer', 'analyst');

-- ============================================================================
-- Core Tables
-- ============================================================================

CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status survey_status NOT NULL DEFAULT 'draft',
  survey_type survey_type NOT NULL DEFAULT 'standard',
  audience_type audience_type NOT NULL DEFAULT 'mixed',
  is_anonymous BOOLEAN NOT NULL DEFAULT true,
  is_toolbox BOOLEAN NOT NULL DEFAULT false,
  slug TEXT UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_surveys_org ON surveys(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_surveys_status ON surveys(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_surveys_slug ON surveys(slug) WHERE slug IS NOT NULL;

CREATE TABLE survey_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_random BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_pages_survey ON survey_pages(survey_id);

CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES survey_pages(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question_type question_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  scoring JSONB NOT NULL DEFAULT '{}'::jsonb,
  piping_source UUID REFERENCES survey_questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_questions_page ON survey_questions(page_id);
CREATE INDEX idx_survey_questions_survey ON survey_questions(survey_id);

CREATE TABLE survey_choices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_other BOOLEAN NOT NULL DEFAULT false,
  score_value NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_choices_question ON survey_choices(question_id);

CREATE TABLE survey_logic_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  source_question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  condition_type condition_type NOT NULL,
  condition_value TEXT,
  action_type logic_action_type NOT NULL,
  target_id UUID,
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_logic_survey ON survey_logic_rules(survey_id);
CREATE INDEX idx_survey_logic_source ON survey_logic_rules(source_question_id);

-- ============================================================================
-- Response Tables
-- ============================================================================

CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  respondent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  status response_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  ip_hash TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_score NUMERIC,
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_survey_responses_session ON survey_responses(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_survey_responses_status ON survey_responses(survey_id, status);

CREATE TABLE survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_choices UUID[],
  answer_numeric NUMERIC,
  answer_date DATE,
  answer_json JSONB,
  score NUMERIC,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_answers_response ON survey_answers(response_id);
CREATE INDEX idx_survey_answers_question ON survey_answers(question_id);

-- ============================================================================
-- Distribution & Triggers
-- ============================================================================

CREATE TABLE survey_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  channel distribution_channel NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status distribution_status NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_distributions_survey ON survey_distributions(survey_id);

CREATE TABLE survey_email_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  trigger_type email_trigger_type NOT NULL,
  condition_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipient_type email_recipient_type NOT NULL,
  recipient_value TEXT,
  email_subject TEXT,
  email_body TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_survey_email_triggers_survey ON survey_email_triggers(survey_id);

-- ============================================================================
-- Templates, Collaboration & Variables
-- ============================================================================

CREATE TABLE survey_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category template_category NOT NULL DEFAULT 'custom',
  audience_type audience_type NOT NULL DEFAULT 'mixed',
  template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE survey_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role collaborator_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(survey_id, user_id)
);

CREATE INDEX idx_survey_collaborators_survey ON survey_collaborators(survey_id);

CREATE TABLE survey_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  default_value TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(survey_id, key)
);

-- ============================================================================
-- Auto-update timestamps trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_surveys_updated_at BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE FUNCTION update_survey_updated_at();
CREATE TRIGGER trg_survey_pages_updated_at BEFORE UPDATE ON survey_pages FOR EACH ROW EXECUTE FUNCTION update_survey_updated_at();
CREATE TRIGGER trg_survey_questions_updated_at BEFORE UPDATE ON survey_questions FOR EACH ROW EXECUTE FUNCTION update_survey_updated_at();
CREATE TRIGGER trg_survey_responses_updated_at BEFORE UPDATE ON survey_responses FOR EACH ROW EXECUTE FUNCTION update_survey_updated_at();
CREATE TRIGGER trg_survey_distributions_updated_at BEFORE UPDATE ON survey_distributions FOR EACH ROW EXECUTE FUNCTION update_survey_updated_at();
CREATE TRIGGER trg_survey_email_triggers_updated_at BEFORE UPDATE ON survey_email_triggers FOR EACH ROW EXECUTE FUNCTION update_survey_updated_at();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_logic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_variables ENABLE ROW LEVEL SECURITY;

-- Surveys: org members can manage
CREATE POLICY "Org can view own surveys" ON surveys FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Org can insert surveys" ON surveys FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Org can update surveys" ON surveys FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));
CREATE POLICY "Org can delete surveys" ON surveys FOR DELETE
  USING (organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()));

-- Toolbox surveys: anyone can view active toolbox surveys
CREATE POLICY "Public can view active toolbox surveys" ON surveys FOR SELECT
  USING (is_toolbox = true AND status = 'active' AND deleted_at IS NULL);

-- Survey pages: via survey ownership
CREATE POLICY "Org can manage survey pages" ON survey_pages FOR ALL
  USING (survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- Survey questions: via survey ownership
CREATE POLICY "Org can manage survey questions" ON survey_questions FOR ALL
  USING (survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- Survey choices: via question ownership
CREATE POLICY "Org can manage survey choices" ON survey_choices FOR ALL
  USING (question_id IN (SELECT id FROM survey_questions WHERE survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))));

-- Logic rules: via survey ownership
CREATE POLICY "Org can manage logic rules" ON survey_logic_rules FOR ALL
  USING (survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- Responses: anyone can insert (for public surveys), org can view
CREATE POLICY "Anyone can submit responses" ON survey_responses FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Respondents can update own in-progress" ON survey_responses FOR UPDATE
  USING (session_id IS NOT NULL AND status = 'in_progress');
CREATE POLICY "Org can view survey responses" ON survey_responses FOR SELECT
  USING (survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- Answers: anyone can insert, org can view
CREATE POLICY "Anyone can submit answers" ON survey_answers FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Org can view survey answers" ON survey_answers FOR SELECT
  USING (response_id IN (SELECT id FROM survey_responses WHERE survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid()))));

-- Distributions: org can manage
CREATE POLICY "Org can manage distributions" ON survey_distributions FOR ALL
  USING (survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- Email triggers: org can manage
CREATE POLICY "Org can manage email triggers" ON survey_email_triggers FOR ALL
  USING (survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- Templates: system templates visible to all, custom templates per org
CREATE POLICY "Anyone can view system templates" ON survey_templates FOR SELECT
  USING (is_system = true);
CREATE POLICY "Service can manage templates" ON survey_templates FOR ALL
  USING (true);

-- Collaborators: org can manage
CREATE POLICY "Org can manage collaborators" ON survey_collaborators FOR ALL
  USING (survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- Variables: org can manage
CREATE POLICY "Org can manage variables" ON survey_variables FOR ALL
  USING (survey_id IN (SELECT id FROM surveys WHERE organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())));

-- ============================================================================
-- Seed: System Templates
-- ============================================================================

INSERT INTO survey_templates (title, description, category, audience_type, is_system, template_data) VALUES
(
  'Parent Satisfaction Survey',
  'Comprehensive survey covering communication, teaching quality, safety, facilities, and overall satisfaction.',
  'parent_satisfaction',
  'parent',
  true,
  '{"pages":[{"title":"Communication","questions":[{"type":"rating","title":"How well does the school communicate with you about your child''s progress?","is_required":true,"settings":{"rating_count":5,"rating_icon":"star"}},{"type":"likert_scale","title":"I feel informed about school events and activities.","is_required":true},{"type":"long_text","title":"How could we improve our communication with parents?","settings":{"word_limit":200}}]},{"title":"Teaching & Learning","questions":[{"type":"rating","title":"How satisfied are you with the quality of teaching your child receives?","is_required":true,"settings":{"rating_count":5,"rating_icon":"star"}},{"type":"multiple_choice","title":"My child is appropriately challenged in lessons.","choices":["Strongly agree","Agree","Neither agree nor disagree","Disagree","Strongly disagree"],"is_required":true},{"type":"rating","title":"How satisfied are you with the homework set?","settings":{"rating_count":5,"rating_icon":"star"}}]},{"title":"Safety & Wellbeing","questions":[{"type":"yes_no","title":"Does your child feel safe at school?","is_required":true},{"type":"rating","title":"How well does the school handle bullying?","settings":{"rating_count":5,"rating_icon":"star"}},{"type":"long_text","title":"Do you have any concerns about your child''s wellbeing at school?","settings":{"word_limit":300}}]},{"title":"Overall","questions":[{"type":"nps","title":"How likely are you to recommend this school to other parents?","is_required":true},{"type":"long_text","title":"What does the school do well?","settings":{"word_limit":300}},{"type":"long_text","title":"What could the school improve?","settings":{"word_limit":300}}]}]}'
),
(
  'Staff Wellbeing Check-in',
  'Anonymous pulse survey covering workload, support, mental health, and professional development.',
  'staff_wellbeing',
  'staff',
  true,
  '{"pages":[{"title":"Workload & Balance","questions":[{"type":"rating","title":"How manageable is your current workload?","is_required":true,"settings":{"rating_count":5,"rating_icon":"star"}},{"type":"likert_scale","title":"I have a good work-life balance.","is_required":true},{"type":"opinion_scale","title":"On a scale of 1-10, how stressed do you feel at work?","settings":{"min":1,"max":10,"min_label":"Not stressed","max_label":"Extremely stressed"}}]},{"title":"Support & Culture","questions":[{"type":"rating","title":"How supported do you feel by your line manager?","is_required":true,"settings":{"rating_count":5,"rating_icon":"star"}},{"type":"likert_scale","title":"I feel valued as a member of staff.","is_required":true},{"type":"yes_no","title":"Do you feel comfortable raising concerns with leadership?","is_required":true}]},{"title":"Professional Development","questions":[{"type":"rating","title":"How satisfied are you with CPD opportunities?","settings":{"rating_count":5,"rating_icon":"star"}},{"type":"long_text","title":"What training or development would you find most helpful?","settings":{"word_limit":200}},{"type":"nps","title":"How likely are you to recommend this school as a place to work?","is_required":true}]}]}'
),
(
  'Student Voice Survey',
  'Capture student perspectives on lessons, teachers, facilities, and school life.',
  'student_voice',
  'student',
  true,
  '{"pages":[{"title":"Lessons","questions":[{"type":"rating","title":"How much do you enjoy your lessons?","is_required":true,"settings":{"rating_count":5,"rating_icon":"smiley"}},{"type":"multiple_choice","title":"Which subject do you enjoy most?","choices":["English","Maths","Science","History","Geography","Art","PE","Music","Computing","Other"]},{"type":"yes_no","title":"Do teachers explain things clearly?","is_required":true}]},{"title":"School Life","questions":[{"type":"yes_no","title":"Do you feel safe at school?","is_required":true},{"type":"rating","title":"How happy are you at school?","is_required":true,"settings":{"rating_count":5,"rating_icon":"smiley"}},{"type":"checkbox","title":"What would make school better?","choices":["More clubs","Better food","More break time","Better facilities","More help with learning","Other"]}]},{"title":"Your Voice","questions":[{"type":"long_text","title":"What is the best thing about your school?","settings":{"word_limit":150}},{"type":"long_text","title":"If you could change one thing, what would it be?","settings":{"word_limit":150}}]}]}'
),
(
  'Governor Self-Assessment',
  'Annual governance effectiveness review aligned to the Governance Handbook.',
  'governor_feedback',
  'governor',
  true,
  '{"pages":[{"title":"Strategic Direction","questions":[{"type":"likert_scale","title":"The governing board has a clear vision for the school.","is_required":true},{"type":"likert_scale","title":"I understand the school''s strategic priorities.","is_required":true},{"type":"rating","title":"How effective is the board at holding leaders to account?","settings":{"rating_count":5,"rating_icon":"star"}}]},{"title":"Knowledge & Skills","questions":[{"type":"likert_scale","title":"I have sufficient training to fulfil my governance role.","is_required":true},{"type":"checkbox","title":"Which areas would you like more training in?","choices":["Finance","Safeguarding","SEND","Curriculum","Data analysis","HR & staffing","Health & Safety"]},{"type":"yes_no","title":"Do you feel confident interpreting school performance data?"}]},{"title":"Effectiveness","questions":[{"type":"rating","title":"Overall, how effective do you think the governing board is?","is_required":true,"settings":{"rating_count":5,"rating_icon":"star"}},{"type":"long_text","title":"What should the board focus on improving?","settings":{"word_limit":300}}]}]}'
),
(
  'Event Feedback',
  'Quick feedback form for school events, performances, and open days.',
  'event_feedback',
  'mixed',
  true,
  '{"pages":[{"title":"Event Feedback","questions":[{"type":"rating","title":"How would you rate the event overall?","is_required":true,"settings":{"rating_count":5,"rating_icon":"star"}},{"type":"rating","title":"How well organised was the event?","settings":{"rating_count":5,"rating_icon":"star"}},{"type":"yes_no","title":"Would you attend a similar event in the future?","is_required":true},{"type":"long_text","title":"What did you enjoy most?","settings":{"word_limit":200}},{"type":"long_text","title":"Any suggestions for improvement?","settings":{"word_limit":200}}]}]}'
),
(
  'Ofsted Parent View',
  'Questions aligned to Ofsted Parent View categories for inspection preparation.',
  'ofsted_prep',
  'parent',
  true,
  '{"pages":[{"title":"Ofsted Parent View","questions":[{"type":"likert_scale","title":"My child is happy at this school.","is_required":true},{"type":"likert_scale","title":"My child feels safe at this school.","is_required":true},{"type":"likert_scale","title":"The school makes sure its pupils are well behaved.","is_required":true},{"type":"likert_scale","title":"My child has been bullied and the school dealt with the bullying quickly and effectively.","is_required":true},{"type":"likert_scale","title":"The school makes me aware of what my child will learn during the year.","is_required":true},{"type":"likert_scale","title":"When I have raised concerns with the school, they have been dealt with properly.","is_required":true},{"type":"likert_scale","title":"My child has SEND, and the school gives them the support they need to succeed."},{"type":"likert_scale","title":"The school has high expectations for my child.","is_required":true},{"type":"likert_scale","title":"My child does well at this school.","is_required":true},{"type":"likert_scale","title":"The school lets me know how my child is doing.","is_required":true},{"type":"likert_scale","title":"There is a good range of subjects available to my child at this school.","is_required":true},{"type":"likert_scale","title":"My child can take part in clubs and activities at this school.","is_required":true},{"type":"likert_scale","title":"The school supports my child''s wider personal development.","is_required":true},{"type":"nps","title":"Would you recommend this school to another parent?","is_required":true}]}]}'
),
(
  'Quick Pulse Poll',
  'Single-question pulse check. Reusable for weekly/monthly check-ins.',
  'custom',
  'mixed',
  true,
  '{"pages":[{"title":"Pulse Check","questions":[{"type":"opinion_scale","title":"How are you feeling today?","is_required":true,"settings":{"min":1,"max":5,"min_label":"Struggling","max_label":"Great"}},{"type":"long_text","title":"Anything you''d like to share? (optional)","settings":{"word_limit":100}}]}]}'
),
(
  'NPS Template',
  'Standard Net Promoter Score survey with follow-up branching for Promoters and Detractors.',
  'custom',
  'mixed',
  true,
  '{"pages":[{"title":"Net Promoter Score","questions":[{"type":"nps","title":"How likely are you to recommend our school to a friend or colleague?","is_required":true},{"type":"long_text","title":"What is the primary reason for your score?","is_required":true,"settings":{"word_limit":300}}]}]}'
);
