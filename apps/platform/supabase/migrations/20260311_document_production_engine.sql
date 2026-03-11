-- ============================================================
-- Document Production Engine Migration
-- Expands HR-only letter system into a universal cross-module
-- document engine. Existing hr_letter_templates and
-- hr_letters_generated tables are preserved for backwards compat.
-- New tables: document_templates, generated_documents,
--             document_delivery_log, document_trigger_rules
-- ============================================================

-- ============================================================
-- 1. document_templates
-- ============================================================
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL CHECK (module IN ('hr', 'compliance', 'governance', 'estates', 'teaching_learning', 'send', 'finance', 'general')),
  category TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'letter' CHECK (document_type IN ('letter', 'notice', 'report', 'certificate', 'newsletter', 'minutes', 'memo', 'form', 'invitation', 'policy_extract')),
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  header_template TEXT,
  footer_template TEXT,
  available_placeholders JSONB NOT NULL DEFAULT '[]',
  data_sources JSONB NOT NULL DEFAULT '[]',
  trigger_config JSONB,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  school_phase TEXT DEFAULT 'all',
  tags TEXT[] DEFAULT '{}',
  use_org_branding BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_document_templates_org_module ON document_templates(organization_id, module);
CREATE INDEX IF NOT EXISTS idx_document_templates_module_cat ON document_templates(module, category);
CREATE INDEX IF NOT EXISTS idx_document_templates_slug ON document_templates(slug);

-- ============================================================
-- 2. generated_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES document_templates(id),
  module TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'letter',
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  rendered_header TEXT,
  rendered_footer TEXT,
  placeholder_values JSONB NOT NULL DEFAULT '{}',
  recipient_type TEXT NOT NULL DEFAULT 'staff' CHECK (recipient_type IN ('staff', 'parent', 'governor', 'contractor', 'external', 'group')),
  recipient_id UUID,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  context_type TEXT,
  context_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'finalised', 'sent', 'delivered', 'acknowledged', 'rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  delivery_method TEXT CHECK (delivery_method IN ('email', 'print', 'download', 'portal')),
  sent_at TIMESTAMPTZ,
  sent_to_email TEXT,
  delivered_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  pdf_storage_path TEXT,
  ai_generated BOOLEAN DEFAULT false,
  ai_session_id TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_documents_org_module ON generated_documents(organization_id, module);
CREATE INDEX IF NOT EXISTS idx_generated_documents_org_status ON generated_documents(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_generated_documents_template ON generated_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_recipient ON generated_documents(recipient_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_context ON generated_documents(context_type, context_id);

-- ============================================================
-- 3. document_delivery_log
-- ============================================================
CREATE TABLE IF NOT EXISTS document_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES generated_documents(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  recipient_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,
  error_message TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_delivery_log_doc ON document_delivery_log(document_id);

-- ============================================================
-- 4. document_trigger_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS document_trigger_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES document_templates(id),
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  auto_generate BOOLEAN DEFAULT true,
  auto_send BOOLEAN DEFAULT false,
  notify_users TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_document_trigger_rules_org_event ON document_trigger_rules(organization_id, trigger_event);

-- ============================================================
-- 5. Data migration: copy hr_letter_templates → document_templates
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hr_letter_templates') THEN
    INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, created_at)
    SELECT
      name,
      lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')),
      description,
      'hr',
      category,
      'letter',
      subject_template,
      body_template,
      available_placeholders,
      is_system,
      organization_id,
      created_at
    FROM hr_letter_templates
    WHERE NOT EXISTS (
      SELECT 1 FROM document_templates
      WHERE slug = lower(regexp_replace(hr_letter_templates.name, '[^a-zA-Z0-9]+', '-', 'g'))
        AND document_templates.module = 'hr'
        AND (document_templates.organization_id = hr_letter_templates.organization_id
             OR (document_templates.organization_id IS NULL AND hr_letter_templates.organization_id IS NULL))
    );
  END IF;
END $$;

-- ============================================================
-- 6. Data migration: copy hr_letters_generated → generated_documents
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hr_letters_generated') THEN
    INSERT INTO generated_documents (
      organization_id, template_id, module, document_type,
      subject, body_html, placeholder_values,
      recipient_type, recipient_id, recipient_name,
      status, created_by, created_at, updated_at
    )
    SELECT
      hlg.organization_id,
      dt.id,
      'hr',
      'letter',
      hlg.subject,
      hlg.body_html,
      hlg.placeholder_values,
      'staff',
      hlg.staff_id,
      COALESCE(sd.full_name, 'Unknown'),
      hlg.status,
      hlg.created_by,
      hlg.created_at,
      hlg.updated_at
    FROM hr_letters_generated hlg
    JOIN hr_letter_templates hlt ON hlt.id = hlg.template_id
    JOIN document_templates dt ON dt.slug = lower(regexp_replace(hlt.name, '[^a-zA-Z0-9]+', '-', 'g'))
      AND dt.module = 'hr'
      AND (dt.organization_id = hlt.organization_id
           OR (dt.organization_id IS NULL AND hlt.organization_id IS NULL))
    LEFT JOIN staff_directory sd ON sd.id = hlg.staff_id
    WHERE NOT EXISTS (
      SELECT 1 FROM generated_documents gd
      WHERE gd.template_id = dt.id
        AND gd.recipient_id = hlg.staff_id
        AND gd.created_at = hlg.created_at
    );
  END IF;
END $$;

-- ============================================================
-- 7. Seed system templates — HR (new ones not already migrated)
-- ============================================================

-- Absence Warning Stage 2
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Absence Warning — Stage 2',
  'absence-warning-stage-2',
  'Second formal stage absence warning letter following absence review meeting',
  'hr',
  'absence_warning',
  'letter',
  'Stage 2 Absence Warning — {{staff_name}}',
  '<p>Dear {{staff_name}},</p>

<p><strong>Stage 2 Absence Warning — Written Warning</strong></p>

<p>I am writing to confirm the outcome of the Stage 2 Absence Review Meeting held on <strong>{{meeting_date}}</strong> at {{meeting_location}}, chaired by {{chair_name}}, {{chair_title}}. You were accompanied by {{companion_name}} ({{companion_role}}).</p>

<p>During the meeting, your attendance record was reviewed. The following was noted:</p>
<ul>
  <li>Number of absence occasions in the review period: <strong>{{absence_occasions}}</strong></li>
  <li>Total days absent: <strong>{{absence_days}}</strong></li>
  <li>Bradford Factor score: <strong>{{bradford_score}}</strong></li>
</ul>

<p>Despite the Stage 1 warning issued on {{stage1_date}}, your attendance has not improved to the required level. Having considered all the circumstances, I am issuing you with a <strong>Stage 2 Written Warning</strong> under the school''s Absence Management Policy.</p>

<p>This warning will remain on your file for <strong>{{warning_duration}}</strong>. During this time, your attendance will be monitored over a <strong>{{monitoring_period}}</strong> review period. The attendance target you are required to meet is: <strong>{{attendance_target}}</strong>.</p>

<p>Should your attendance fail to improve, the matter may progress to Stage 3 (Final Written Warning), which could ultimately result in dismissal.</p>

<p>The following support measures have been agreed:</p>
<ul>
  <li>{{support_measures}}</li>
</ul>

<p>You have the right to appeal this decision. Any appeal should be submitted in writing to {{appeal_recipient}} within {{appeal_deadline}} working days of receiving this letter.</p>

<p>I sincerely hope your attendance improves and this matter can be resolved positively.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["staff_name", "meeting_date", "meeting_location", "chair_name", "chair_title", "companion_name", "companion_role", "absence_occasions", "absence_days", "bradford_score", "stage1_date", "warning_duration", "monitoring_period", "attendance_target", "support_measures", "appeal_recipient", "appeal_deadline", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{hr, absence, warning, stage2}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'absence-warning-stage-2' AND is_system = true AND organization_id IS NULL);

-- Absence Warning Stage 3 (Final Written)
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Absence Warning — Stage 3 (Final Written)',
  'absence-warning-stage-3-final',
  'Final written absence warning — failure to improve may result in dismissal',
  'hr',
  'absence_warning',
  'letter',
  'Stage 3 Final Written Absence Warning — {{staff_name}}',
  '<p>Dear {{staff_name}},</p>

<p><strong>Stage 3 Final Written Warning — Attendance</strong></p>

<p>I am writing to confirm the outcome of the Stage 3 Absence Review Meeting held on <strong>{{meeting_date}}</strong> at {{meeting_location}}, chaired by {{chair_name}}, {{chair_title}}. You were accompanied by {{companion_name}} ({{companion_role}}).</p>

<p>Your attendance record during the monitoring period was reviewed:</p>
<ul>
  <li>Absence occasions: <strong>{{absence_occasions}}</strong></li>
  <li>Total days absent: <strong>{{absence_days}}</strong></li>
  <li>Bradford Factor score: <strong>{{bradford_score}}</strong></li>
</ul>

<p>Despite previous warnings at Stage 1 ({{stage1_date}}) and Stage 2 ({{stage2_date}}), your attendance has not reached the required standard.</p>

<p>I am therefore issuing a <strong>Final Written Warning</strong>. This is the last stage before dismissal proceedings. This warning will remain on your file for <strong>{{warning_duration}}</strong>.</p>

<p>Your attendance will be closely monitored over the next <strong>{{monitoring_period}}</strong>. If the attendance target of <strong>{{attendance_target}}</strong> is not met, the matter will be referred to a formal hearing at which dismissal will be considered.</p>

<p>Support measures agreed:</p>
<ul>
  <li>{{support_measures}}</li>
</ul>

<p>You have the right to appeal this decision in writing to {{appeal_recipient}} within {{appeal_deadline}} working days.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["staff_name", "meeting_date", "meeting_location", "chair_name", "chair_title", "companion_name", "companion_role", "absence_occasions", "absence_days", "bradford_score", "stage1_date", "stage2_date", "warning_duration", "monitoring_period", "attendance_target", "support_measures", "appeal_recipient", "appeal_deadline", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{hr, absence, warning, stage3, final}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'absence-warning-stage-3-final' AND is_system = true AND organization_id IS NULL);

-- Probation Review Outcome
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Probation Review Outcome',
  'probation-review-outcome',
  'Letter confirming the outcome of a probationary period review',
  'hr',
  'probation',
  'letter',
  'Probation Review Outcome — {{staff_name}}',
  '<p>Dear {{staff_name}},</p>

<p><strong>Outcome of Probationary Period Review</strong></p>

<p>Further to your probation review meeting on <strong>{{meeting_date}}</strong>, I am writing to confirm the outcome.</p>

<p>Your probationary period commenced on {{start_date}} and the review covered the period to {{review_date}}. During this time, your performance was assessed against the following objectives:</p>
<ul>
  <li>{{objectives}}</li>
</ul>

<p><strong>Outcome: {{outcome}}</strong></p>

<p>{{outcome_detail}}</p>

<p>{{next_steps}}</p>

<p>If you have any questions about this decision, please do not hesitate to speak with me.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["staff_name", "meeting_date", "start_date", "review_date", "objectives", "outcome", "outcome_detail", "next_steps", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{hr, probation}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'probation-review-outcome' AND is_system = true AND organization_id IS NULL);

-- Grievance Outcome Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Grievance Outcome Letter',
  'grievance-outcome-letter',
  'Formal outcome letter following a grievance hearing',
  'hr',
  'grievance',
  'letter',
  'Grievance Outcome — {{staff_name}}',
  '<p>Dear {{staff_name}},</p>

<p><strong>Outcome of Formal Grievance — Reference: {{reference}}</strong></p>

<p>I am writing to confirm the outcome of the grievance hearing held on <strong>{{hearing_date}}</strong>. The hearing was chaired by {{chair_name}}, {{chair_title}}. You were accompanied by {{companion_name}} ({{companion_role}}).</p>

<p>Your grievance concerned the following matters:</p>
<p>{{grievance_summary}}</p>

<p>Having carefully considered all the evidence presented, including witness statements and relevant documentation, I have reached the following conclusion:</p>

<p><strong>{{outcome}}</strong></p>

<p>{{outcome_detail}}</p>

<p>The following actions will be taken:</p>
<ul>
  <li>{{actions}}</li>
</ul>

<p>You have the right to appeal this decision. Any appeal must be submitted in writing to {{appeal_recipient}} within {{appeal_deadline}} working days of receiving this letter, setting out the grounds for your appeal.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["staff_name", "reference", "hearing_date", "chair_name", "chair_title", "companion_name", "companion_role", "grievance_summary", "outcome", "outcome_detail", "actions", "appeal_recipient", "appeal_deadline", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{hr, grievance}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'grievance-outcome-letter' AND is_system = true AND organization_id IS NULL);

-- Flexible Working Request Response
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Flexible Working Request Response',
  'flexible-working-response',
  'Formal response to a flexible working request under the Employment Rights Act 1996',
  'hr',
  'flexible_working',
  'letter',
  'Flexible Working Request — Decision — {{staff_name}}',
  '<p>Dear {{staff_name}},</p>

<p><strong>Flexible Working Request — Formal Decision</strong></p>

<p>Thank you for your flexible working request submitted on {{request_date}}, which was discussed at our meeting on <strong>{{meeting_date}}</strong>.</p>

<p>You requested the following change to your working pattern:</p>
<p>{{requested_change}}</p>

<p>Having given careful consideration to your request, the impact on the school, and the needs of our pupils, I can confirm the following decision:</p>

<p><strong>{{decision}}</strong></p>

<p>{{decision_detail}}</p>

<p>{{trial_period_text}}</p>

<p>The new arrangement will take effect from <strong>{{effective_date}}</strong>.</p>

<p>Please note that under the Employment Rights Act 1996 (as amended), you may make one statutory flexible working request in any 12-month period. You have the right to appeal this decision in writing to {{appeal_recipient}} within {{appeal_deadline}} days.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["staff_name", "request_date", "meeting_date", "requested_change", "decision", "decision_detail", "trial_period_text", "effective_date", "appeal_recipient", "appeal_deadline", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{hr, flexible_working}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'flexible-working-response' AND is_system = true AND organization_id IS NULL);

-- Staff Welcome Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Staff Welcome Letter',
  'staff-welcome-letter',
  'Welcome letter for newly appointed staff with joining instructions',
  'hr',
  'onboarding',
  'letter',
  'Welcome to {{school_name}} — {{staff_name}}',
  '<p>Dear {{staff_name}},</p>

<p><strong>Welcome to {{school_name}}</strong></p>

<p>I am delighted to confirm your appointment as <strong>{{job_title}}</strong>, commencing on <strong>{{start_date}}</strong>.</p>

<p>We are very much looking forward to you joining our team. Please find below some important information to help you prepare:</p>

<p><strong>Your First Day</strong></p>
<ul>
  <li>Please arrive at {{arrival_time}} and report to {{report_to}}</li>
  <li>Bring photographic ID and your right-to-work documents</li>
  <li>{{dress_code}}</li>
</ul>

<p><strong>Induction Programme</strong></p>
<p>Your induction will be overseen by {{induction_lead}}, who will be your mentor during the first term. The programme will include safeguarding training, a tour of the school, introductions to key staff, and an overview of policies and procedures.</p>

<p><strong>Pre-Employment Checks</strong></p>
<p>{{pre_employment_status}}</p>

<p><strong>Key Contacts</strong></p>
<ul>
  <li>Line Manager: {{line_manager}}</li>
  <li>HR Contact: {{hr_contact}}</li>
  <li>School Office: {{school_phone}}</li>
</ul>

<p>If you have any questions before your start date, please do not hesitate to contact us.</p>

<p>With warm regards,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["staff_name", "school_name", "job_title", "start_date", "arrival_time", "report_to", "dress_code", "induction_lead", "pre_employment_status", "line_manager", "hr_contact", "school_phone", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{hr, onboarding, welcome}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'staff-welcome-letter' AND is_system = true AND organization_id IS NULL);

-- Reference Request Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Reference Request Letter',
  'reference-request-letter',
  'Letter requesting a professional reference for a prospective employee',
  'hr',
  'recruitment',
  'letter',
  'Reference Request — {{candidate_name}}',
  '<p>Dear {{referee_name}},</p>

<p><strong>Confidential Reference Request</strong></p>

<p>{{candidate_name}} has applied for the post of <strong>{{job_title}}</strong> at {{school_name}} and has given your name as a referee.</p>

<p>The post involves working with children and/or young people. In line with Keeping Children Safe in Education (KCSiE) statutory guidance, we are required to request references before interview.</p>

<p>I should be grateful if you would complete and return the enclosed reference form, providing information on the following:</p>
<ul>
  <li>The candidate''s suitability for the post</li>
  <li>Their professional conduct and competence</li>
  <li>Any disciplinary action or capability proceedings in the last two years</li>
  <li>Whether you are satisfied regarding their suitability to work with children</li>
  <li>Any concerns that have been raised about their conduct towards children</li>
</ul>

<p>The candidate was/is employed by your organisation as {{candidate_role}} from {{employment_start}} to {{employment_end}}.</p>

<p>Please return this reference by <strong>{{deadline}}</strong> to {{return_email}}. All information will be treated in the strictest confidence.</p>

<p>Thank you for your assistance.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["referee_name", "candidate_name", "job_title", "school_name", "candidate_role", "employment_start", "employment_end", "deadline", "return_email", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{hr, recruitment, reference, safeguarding}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'reference-request-letter' AND is_system = true AND organization_id IS NULL);

-- Resignation Acknowledgement
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Resignation Acknowledgement',
  'resignation-acknowledgement',
  'Formal acknowledgement of a staff member''s resignation',
  'hr',
  'leavers',
  'letter',
  'Acknowledgement of Resignation — {{staff_name}}',
  '<p>Dear {{staff_name}},</p>

<p><strong>Acknowledgement of Resignation</strong></p>

<p>I write to acknowledge receipt of your letter of resignation dated {{resignation_date}}, in which you gave notice of your intention to leave your post as {{job_title}} at {{school_name}}.</p>

<p>In accordance with your contract of employment and the Burgundy Book/Green Book conditions, your last day of service will be <strong>{{last_day}}</strong>.</p>

<p>{{personal_message}}</p>

<p>During your remaining time with us, please ensure the following are completed:</p>
<ul>
  <li>Handover of responsibilities to {{handover_to}}</li>
  <li>Return of school property (keys, laptop, ID badge)</li>
  <li>Completion of any outstanding documentation</li>
</ul>

<p>Your final salary, including any outstanding holiday entitlement, will be paid in your {{final_pay_month}} pay. Details of your pension arrangements will be communicated separately by {{pension_provider}}.</p>

<p>We wish you every success in your future endeavours.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["staff_name", "resignation_date", "job_title", "school_name", "last_day", "personal_message", "handover_to", "final_pay_month", "pension_provider", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{hr, leavers, resignation}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'resignation-acknowledgement' AND is_system = true AND organization_id IS NULL);

-- ============================================================
-- 8. Seed system templates — Governance
-- ============================================================

-- Governor Appointment Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Governor Appointment Letter',
  'governor-appointment-letter',
  'Formal appointment letter for a newly elected or appointed governor',
  'governance',
  'appointments',
  'letter',
  'Appointment as {{governor_type}} Governor — {{school_name}}',
  '<p>Dear {{governor_name}},</p>

<p><strong>Appointment as {{governor_type}} Governor</strong></p>

<p>I am pleased to confirm your appointment as a {{governor_type}} Governor on the governing body of {{school_name}}, effective from <strong>{{appointment_date}}</strong>.</p>

<p>Your term of office is <strong>{{term_length}}</strong>, expiring on {{expiry_date}}, unless otherwise determined.</p>

<p>As a governor, you will be expected to:</p>
<ul>
  <li>Attend governing body meetings (typically {{meeting_frequency}})</li>
  <li>Serve on at least one committee</li>
  <li>Undertake governor training, including safeguarding</li>
  <li>Participate in monitoring visits as appropriate</li>
  <li>Maintain confidentiality in accordance with the Code of Conduct</li>
</ul>

<p>You are required to complete the following before your first meeting:</p>
<ul>
  <li>DBS Enhanced Disclosure (the school will arrange this)</li>
  <li>Register of Business Interests declaration</li>
  <li>Safeguarding induction training</li>
</ul>

<p>Your first governing body meeting will be held on <strong>{{first_meeting_date}}</strong> at {{meeting_time}} in {{meeting_location}}.</p>

<p>{{chair_name}}, Chair of Governors, and I look forward to working with you.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["governor_name", "governor_type", "school_name", "appointment_date", "term_length", "expiry_date", "meeting_frequency", "first_meeting_date", "meeting_time", "meeting_location", "chair_name", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{governance, appointment}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'governor-appointment-letter' AND is_system = true AND organization_id IS NULL);

-- Governor Term Expiry Notice
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Governor Term Expiry Notice',
  'governor-term-expiry-notice',
  'Notice informing a governor that their term of office is approaching expiry',
  'governance',
  'term_management',
  'notice',
  'Term of Office Expiry — {{governor_name}}',
  '<p>Dear {{governor_name}},</p>

<p><strong>Governor Term of Office — Expiry Notice</strong></p>

<p>I am writing to inform you that your current term of office as {{governor_type}} Governor at {{school_name}} is due to expire on <strong>{{expiry_date}}</strong>.</p>

<p>You were first appointed on {{appointment_date}} and have served for {{years_served}} years. During this time, your contribution to {{contribution_areas}} has been greatly valued.</p>

<p><strong>Options available to you:</strong></p>
<ol>
  <li><strong>Seek reappointment</strong> — Please confirm your willingness to serve a further term by {{response_deadline}}. {{reappointment_process}}</li>
  <li><strong>Stand down</strong> — If you do not wish to continue, please let us know so that arrangements can be made to fill the vacancy</li>
</ol>

<p>Please respond to {{clerk_name}} ({{clerk_email}}) by <strong>{{response_deadline}}</strong>.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["governor_name", "governor_type", "school_name", "expiry_date", "appointment_date", "years_served", "contribution_areas", "response_deadline", "reappointment_process", "clerk_name", "clerk_email", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{governance, term_expiry}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'governor-term-expiry-notice' AND is_system = true AND organization_id IS NULL);

-- Board Meeting Invitation
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Board Meeting Invitation',
  'board-meeting-invitation',
  'Formal invitation to a governing body or board meeting with agenda summary',
  'governance',
  'meetings',
  'invitation',
  'Governing Body Meeting — {{meeting_date}}',
  '<p>Dear {{governor_name}},</p>

<p><strong>Governing Body Meeting — {{meeting_date}}</strong></p>

<p>You are invited to attend the next meeting of the Governing Body of {{school_name}}.</p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date:</td><td>{{meeting_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Time:</td><td>{{meeting_time}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Venue:</td><td>{{meeting_location}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Chair:</td><td>{{chair_name}}</td></tr>
</table>

<p><strong>Agenda Summary:</strong></p>
<ol>
  <li>Welcome and apologies</li>
  <li>Declaration of pecuniary interests</li>
  <li>Minutes of previous meeting ({{previous_meeting_date}})</li>
  <li>Matters arising</li>
  <li>{{agenda_items}}</li>
  <li>Any other business</li>
  <li>Date of next meeting</li>
</ol>

<p>Full agenda and papers will follow at least seven days before the meeting. Please confirm your attendance to {{clerk_name}} ({{clerk_email}}) by <strong>{{rsvp_deadline}}</strong>.</p>

<p>If you are unable to attend, please submit your apologies as soon as possible.</p>

<p>Yours sincerely,</p>
<p>{{clerk_name}}<br>Clerk to the Governors<br>{{school_name}}</p>',
  '["governor_name", "meeting_date", "meeting_time", "meeting_location", "chair_name", "previous_meeting_date", "agenda_items", "clerk_name", "clerk_email", "rsvp_deadline", "school_name"]'::jsonb,
  true, NULL, '{governance, meeting, invitation}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'board-meeting-invitation' AND is_system = true AND organization_id IS NULL);

-- Board Meeting Minutes Template
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Board Meeting Minutes',
  'board-meeting-minutes',
  'Template for recording governing body meeting minutes',
  'governance',
  'meetings',
  'minutes',
  'Minutes — Governing Body Meeting — {{meeting_date}}',
  '<h2>{{school_name}} — Governing Body Meeting</h2>
<p><strong>Date:</strong> {{meeting_date}} | <strong>Time:</strong> {{meeting_time}} | <strong>Venue:</strong> {{meeting_location}}</p>

<p><strong>Present:</strong> {{attendees}}</p>
<p><strong>Apologies:</strong> {{apologies}}</p>
<p><strong>In Attendance:</strong> {{in_attendance}}</p>
<p><strong>Clerk:</strong> {{clerk_name}}</p>

<hr>

<h3>1. Welcome and Apologies</h3>
<p>The Chair, {{chair_name}}, welcomed all present. Apologies were received and accepted from {{apologies}}.</p>

<h3>2. Declaration of Pecuniary Interests</h3>
<p>{{pecuniary_interests}}</p>

<h3>3. Minutes of Previous Meeting ({{previous_meeting_date}})</h3>
<p>The minutes of the meeting held on {{previous_meeting_date}} were {{minutes_status}}.</p>

<h3>4. Matters Arising</h3>
<p>{{matters_arising}}</p>

<h3>5. Items of Business</h3>
<p>{{business_items}}</p>

<h3>6. Any Other Business</h3>
<p>{{aob}}</p>

<h3>7. Date of Next Meeting</h3>
<p>{{next_meeting_date}} at {{next_meeting_time}}</p>

<p style="margin-top:32px;"><strong>Signed:</strong> _______________________________ &nbsp;&nbsp; <strong>Date:</strong> _______________</p>
<p>{{chair_name}}, Chair of Governors</p>',
  '["school_name", "meeting_date", "meeting_time", "meeting_location", "attendees", "apologies", "in_attendance", "clerk_name", "chair_name", "pecuniary_interests", "previous_meeting_date", "minutes_status", "matters_arising", "business_items", "aob", "next_meeting_date", "next_meeting_time"]'::jsonb,
  true, NULL, '{governance, meeting, minutes}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'board-meeting-minutes' AND is_system = true AND organization_id IS NULL);

-- Committee Meeting Invitation
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Committee Meeting Invitation',
  'committee-meeting-invitation',
  'Invitation to a governor committee meeting (Finance, Curriculum, etc.)',
  'governance',
  'meetings',
  'invitation',
  '{{committee_name}} Committee Meeting — {{meeting_date}}',
  '<p>Dear {{governor_name}},</p>

<p><strong>{{committee_name}} Committee Meeting</strong></p>

<p>You are invited to attend the next meeting of the {{committee_name}} Committee.</p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date:</td><td>{{meeting_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Time:</td><td>{{meeting_time}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Venue:</td><td>{{meeting_location}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Committee Chair:</td><td>{{committee_chair}}</td></tr>
</table>

<p><strong>Key items for discussion:</strong></p>
<ul>
  <li>{{agenda_items}}</li>
</ul>

<p>Papers will be circulated by {{papers_date}}. Please confirm attendance to {{clerk_name}} ({{clerk_email}}) by {{rsvp_deadline}}.</p>

<p>Yours sincerely,</p>
<p>{{clerk_name}}<br>Clerk to the Governors<br>{{school_name}}</p>',
  '["governor_name", "committee_name", "meeting_date", "meeting_time", "meeting_location", "committee_chair", "agenda_items", "papers_date", "clerk_name", "clerk_email", "rsvp_deadline", "school_name"]'::jsonb,
  true, NULL, '{governance, committee, meeting, invitation}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'committee-meeting-invitation' AND is_system = true AND organization_id IS NULL);

-- Annual Governance Statement
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Annual Governance Statement',
  'annual-governance-statement',
  'Annual governance statement for publication on the school website as required by DfE',
  'governance',
  'statutory',
  'report',
  'Annual Governance Statement — {{academic_year}}',
  '<h2>{{school_name}} — Annual Governance Statement {{academic_year}}</h2>

<h3>Governance Structure</h3>
<p>The governing body of {{school_name}} is constituted under the {{constitution_type}}. It comprises {{governor_count}} governors: {{governor_breakdown}}.</p>

<p>The governing body met {{meeting_count}} times during the {{academic_year}} academic year. Attendance across all meetings averaged <strong>{{attendance_rate}}%</strong>.</p>

<h3>Key Priorities</h3>
<p>During {{academic_year}}, the governing body focused on the following strategic priorities:</p>
<ul>
  <li>{{priorities}}</li>
</ul>

<h3>Achievements</h3>
<p>{{achievements}}</p>

<h3>Financial Oversight</h3>
<p>{{financial_summary}}</p>

<h3>Safeguarding</h3>
<p>The governing body has ensured that the school has effective safeguarding policies and procedures in place. The designated safeguarding lead is {{dsl_name}}. The safeguarding governor, {{safeguarding_governor}}, has undertaken regular monitoring visits.</p>

<h3>Committees</h3>
<p>{{committee_summary}}</p>

<h3>Governor Training</h3>
<p>{{training_summary}}</p>

<h3>Contact</h3>
<p>The Chair of Governors, {{chair_name}}, can be contacted via the school office. The Clerk to the Governors is {{clerk_name}} ({{clerk_email}}).</p>',
  '["school_name", "academic_year", "constitution_type", "governor_count", "governor_breakdown", "meeting_count", "attendance_rate", "priorities", "achievements", "financial_summary", "dsl_name", "safeguarding_governor", "committee_summary", "training_summary", "chair_name", "clerk_name", "clerk_email"]'::jsonb,
  true, NULL, '{governance, statutory, annual}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'annual-governance-statement' AND is_system = true AND organization_id IS NULL);

-- ============================================================
-- 9. Seed system templates — Estates
-- ============================================================

-- Contractor Work Authorisation
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Contractor Work Authorisation',
  'contractor-work-authorisation',
  'Authorisation letter for contractor work on school premises',
  'estates',
  'contractors',
  'letter',
  'Work Authorisation — {{contractor_name}} — {{work_description}}',
  '<p>Dear {{contractor_name}},</p>

<p><strong>Authorisation to Carry Out Works</strong></p>

<p>This letter authorises {{contractor_company}} to carry out the following works at {{school_name}}:</p>

<p><strong>Description of Works:</strong> {{work_description}}</p>
<p><strong>Location:</strong> {{work_location}}</p>
<p><strong>Authorised Period:</strong> {{start_date}} to {{end_date}}</p>
<p><strong>Agreed Cost:</strong> {{agreed_cost}}</p>
<p><strong>Purchase Order:</strong> {{po_number}}</p>

<p><strong>Conditions of Access:</strong></p>
<ul>
  <li>All operatives must sign in at the school office on arrival and wear visible ID badges</li>
  <li>Valid DBS checks are required for any unsupervised access near children</li>
  <li>Current public liability insurance (min. &pound;5M) and employer''s liability insurance must be held</li>
  <li>Relevant RAMS (Risk Assessment and Method Statement) must be provided before work commences</li>
  <li>Working hours: {{working_hours}}</li>
  <li>{{additional_conditions}}</li>
</ul>

<p><strong>School Contact:</strong> {{site_contact}} ({{site_phone}})</p>

<p>Please confirm acceptance of these terms by return.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["contractor_name", "contractor_company", "school_name", "work_description", "work_location", "start_date", "end_date", "agreed_cost", "po_number", "working_hours", "additional_conditions", "site_contact", "site_phone", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{estates, contractor, authorisation}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'contractor-work-authorisation' AND is_system = true AND organization_id IS NULL);

-- Contractor Certificate Expiry Notice
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Contractor Certificate Expiry Notice',
  'contractor-certificate-expiry',
  'Notice to contractor that insurance or certification is approaching expiry',
  'estates',
  'contractors',
  'notice',
  'Certificate Expiry Notice — {{contractor_company}}',
  '<p>Dear {{contractor_name}},</p>

<p><strong>Expiry of {{certificate_type}}</strong></p>

<p>Our records indicate that the following certification for {{contractor_company}} is due to expire:</p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Certificate Type:</td><td>{{certificate_type}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Certificate Number:</td><td>{{certificate_number}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Expiry Date:</td><td>{{expiry_date}}</td></tr>
</table>

<p>Under our contractor management procedures, we require all contractors to hold valid and current certifications before any works can be undertaken on school premises.</p>

<p>Please provide a copy of the renewed certificate to {{school_contact}} ({{contact_email}}) by <strong>{{response_deadline}}</strong>. Failure to provide updated documentation will result in the suspension of your approved contractor status.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["contractor_name", "contractor_company", "certificate_type", "certificate_number", "expiry_date", "school_contact", "contact_email", "response_deadline", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{estates, contractor, certificate, expiry}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'contractor-certificate-expiry' AND is_system = true AND organization_id IS NULL);

-- Maintenance Issue Notification
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Maintenance Issue Notification',
  'maintenance-issue-notification',
  'Internal notification about a reported maintenance issue requiring attention',
  'estates',
  'maintenance',
  'memo',
  'Maintenance Issue — {{issue_title}} — {{location}}',
  '<p><strong>MAINTENANCE ISSUE NOTIFICATION</strong></p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Reference:</td><td>{{reference}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date Reported:</td><td>{{reported_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Reported By:</td><td>{{reported_by}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Priority:</td><td>{{priority}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Location:</td><td>{{location}}</td></tr>
</table>

<p><strong>Issue Description:</strong></p>
<p>{{issue_description}}</p>

<p><strong>Health &amp; Safety Impact:</strong> {{hs_impact}}</p>

<p><strong>Immediate Action Taken:</strong></p>
<p>{{immediate_action}}</p>

<p><strong>Assigned To:</strong> {{assigned_to}}</p>
<p><strong>Target Completion:</strong> {{target_date}}</p>

<p>{{additional_notes}}</p>

<p>{{sender_name}}<br>{{sender_title}}</p>',
  '["reference", "issue_title", "reported_date", "reported_by", "priority", "location", "issue_description", "hs_impact", "immediate_action", "assigned_to", "target_date", "additional_notes", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{estates, maintenance, helpdesk}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'maintenance-issue-notification' AND is_system = true AND organization_id IS NULL);

-- Fire Drill Report
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Fire Drill Report',
  'fire-drill-report',
  'Report template for recording fire evacuation drill outcomes',
  'estates',
  'fire_safety',
  'report',
  'Fire Evacuation Drill Report — {{drill_date}}',
  '<h2>{{school_name}} — Fire Evacuation Drill Report</h2>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date of Drill:</td><td>{{drill_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Time of Alarm:</td><td>{{alarm_time}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Type:</td><td>{{drill_type}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Total Evacuation Time:</td><td>{{evacuation_time}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Number on Site:</td><td>{{people_count}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Weather Conditions:</td><td>{{weather}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Conducted By:</td><td>{{conducted_by}}</td></tr>
</table>

<h3>Assembly Point Check</h3>
<p>All persons accounted for: <strong>{{all_accounted}}</strong></p>
<p>{{accounting_notes}}</p>

<h3>Observations</h3>
<p>{{observations}}</p>

<h3>Issues Identified</h3>
<ul>
  <li>{{issues}}</li>
</ul>

<h3>Actions Required</h3>
<ul>
  <li>{{actions}}</li>
</ul>

<h3>Comparison with Previous Drill</h3>
<p>Previous drill date: {{previous_drill_date}} | Previous time: {{previous_evacuation_time}}</p>
<p>{{comparison_notes}}</p>

<p style="margin-top:24px;"><strong>Signed:</strong> {{sender_name}}, {{sender_title}}</p>
<p><strong>Date:</strong> {{drill_date}}</p>',
  '["school_name", "drill_date", "alarm_time", "drill_type", "evacuation_time", "people_count", "weather", "conducted_by", "all_accounted", "accounting_notes", "observations", "issues", "actions", "previous_drill_date", "previous_evacuation_time", "comparison_notes", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{estates, fire_safety, drill, statutory}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'fire-drill-report' AND is_system = true AND organization_id IS NULL);

-- Health & Safety Incident Report
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Health & Safety Incident Report',
  'hs-incident-report',
  'Report template for recording H&S incidents, near-misses, and accidents on school premises',
  'estates',
  'health_safety',
  'report',
  'H&S Incident Report — {{incident_date}} — {{incident_type}}',
  '<h2>{{school_name}} — Health &amp; Safety Incident Report</h2>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Report Reference:</td><td>{{reference}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date of Incident:</td><td>{{incident_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Time:</td><td>{{incident_time}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Location:</td><td>{{incident_location}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Type:</td><td>{{incident_type}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">RIDDOR Reportable:</td><td>{{riddor_reportable}}</td></tr>
</table>

<h3>Person(s) Involved</h3>
<p><strong>Name:</strong> {{person_name}} | <strong>Role:</strong> {{person_role}} | <strong>Injury:</strong> {{injury_description}}</p>

<h3>Description of Incident</h3>
<p>{{incident_description}}</p>

<h3>Witnesses</h3>
<p>{{witnesses}}</p>

<h3>Immediate Action Taken</h3>
<p>{{immediate_action}}</p>

<h3>First Aid Administered</h3>
<p>{{first_aid}}</p>

<h3>Root Cause Analysis</h3>
<p>{{root_cause}}</p>

<h3>Corrective Actions</h3>
<ul>
  <li>{{corrective_actions}}</li>
</ul>

<p style="margin-top:24px;"><strong>Reported By:</strong> {{reporter_name}}, {{reporter_title}}</p>
<p><strong>Date:</strong> {{report_date}}</p>
<p><strong>Reviewed By:</strong> {{reviewer_name}}, {{reviewer_title}}</p>',
  '["school_name", "reference", "incident_date", "incident_time", "incident_location", "incident_type", "riddor_reportable", "person_name", "person_role", "injury_description", "incident_description", "witnesses", "immediate_action", "first_aid", "root_cause", "corrective_actions", "reporter_name", "reporter_title", "report_date", "reviewer_name", "reviewer_title"]'::jsonb,
  true, NULL, '{estates, health_safety, incident, riddor}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'hs-incident-report' AND is_system = true AND organization_id IS NULL);

-- ============================================================
-- 10. Seed system templates — Compliance
-- ============================================================

-- SAR Acknowledgement Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'SAR Acknowledgement Letter',
  'sar-acknowledgement-letter',
  'Acknowledgement of a Subject Access Request under UK GDPR Article 15',
  'compliance',
  'gdpr',
  'letter',
  'Subject Access Request — Acknowledgement — Ref: {{reference}}',
  '<p>Dear {{requester_name}},</p>

<p><strong>Subject Access Request — Acknowledgement</strong></p>
<p><strong>Reference:</strong> {{reference}}</p>

<p>Thank you for your Subject Access Request received on <strong>{{received_date}}</strong>. This letter confirms that we have received your request and it is being processed in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>

<p>Under Article 12(3) of the UK GDPR, we are required to respond to your request within <strong>one calendar month</strong> of receipt. The deadline for our response is therefore <strong>{{deadline_date}}</strong>.</p>

<p>{{identity_verification_text}}</p>

<p>If we need to extend this deadline (by up to two further months in cases of complex or numerous requests), we will notify you within the original one-month period and explain the reasons for the delay.</p>

<p>If you have any questions about the progress of your request, please contact our Data Protection Officer: {{dpo_name}} ({{dpo_email}}).</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["requester_name", "reference", "received_date", "deadline_date", "identity_verification_text", "dpo_name", "dpo_email", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{compliance, gdpr, sar}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'sar-acknowledgement-letter' AND is_system = true AND organization_id IS NULL);

-- Data Breach Notification (ICO)
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Data Breach Notification — ICO',
  'data-breach-notification-ico',
  'Notification to the Information Commissioner''s Office of a personal data breach under Article 33 UK GDPR',
  'compliance',
  'gdpr',
  'report',
  'Personal Data Breach Notification — {{school_name}} — {{breach_date}}',
  '<h2>Personal Data Breach Notification</h2>
<p><em>Submitted under Article 33 of the UK GDPR</em></p>

<h3>1. Organisation Details</h3>
<p><strong>Name:</strong> {{school_name}}<br>
<strong>ICO Registration Number:</strong> {{ico_registration}}<br>
<strong>DPO:</strong> {{dpo_name}} ({{dpo_email}}, {{dpo_phone}})</p>

<h3>2. Breach Details</h3>
<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date breach occurred:</td><td>{{breach_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date breach discovered:</td><td>{{discovery_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Breach type:</td><td>{{breach_type}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Data subjects affected:</td><td>{{subjects_affected}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Number of records:</td><td>{{record_count}}</td></tr>
</table>

<h3>3. Nature of the Breach</h3>
<p>{{breach_description}}</p>

<h3>4. Categories of Personal Data</h3>
<p>{{data_categories}}</p>

<h3>5. Likely Consequences</h3>
<p>{{consequences}}</p>

<h3>6. Measures Taken</h3>
<p>{{measures_taken}}</p>

<h3>7. Communication to Data Subjects</h3>
<p>{{subject_communication}}</p>

<p style="margin-top:24px;"><strong>Submitted by:</strong> {{sender_name}}, {{sender_title}}<br>
<strong>Date:</strong> {{submission_date}}</p>',
  '["school_name", "ico_registration", "dpo_name", "dpo_email", "dpo_phone", "breach_date", "discovery_date", "breach_type", "subjects_affected", "record_count", "breach_description", "data_categories", "consequences", "measures_taken", "subject_communication", "sender_name", "sender_title", "submission_date"]'::jsonb,
  true, NULL, '{compliance, gdpr, breach, ico, statutory}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'data-breach-notification-ico' AND is_system = true AND organization_id IS NULL);

-- Complaint Acknowledgement
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Complaint Acknowledgement',
  'complaint-acknowledgement',
  'Acknowledgement letter for a formal complaint received under the school complaints procedure',
  'compliance',
  'complaints',
  'letter',
  'Acknowledgement of Formal Complaint — Ref: {{reference}}',
  '<p>Dear {{complainant_name}},</p>

<p><strong>Acknowledgement of Formal Complaint</strong></p>
<p><strong>Reference:</strong> {{reference}}</p>

<p>Thank you for your formal complaint received on <strong>{{received_date}}</strong>. I am writing to confirm that your complaint has been logged and will be investigated in accordance with the school''s Complaints Procedure.</p>

<p>I understand your complaint concerns:</p>
<p>{{complaint_summary}}</p>

<p>Your complaint is being handled at <strong>{{complaint_stage}}</strong> of our procedure. The investigating officer is <strong>{{investigator_name}}</strong>, {{investigator_title}}.</p>

<p>Under our complaints procedure, you can expect:</p>
<ul>
  <li>An initial response within <strong>{{response_timeline}}</strong></li>
  <li>The opportunity to provide any additional information or evidence</li>
  <li>A written outcome once the investigation is complete</li>
  <li>Information about how to escalate if you remain dissatisfied</li>
</ul>

<p>If you have any additional information to support your complaint, please send it to {{contact_email}} quoting reference {{reference}}.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["complainant_name", "reference", "received_date", "complaint_summary", "complaint_stage", "investigator_name", "investigator_title", "response_timeline", "contact_email", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{compliance, complaints}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'complaint-acknowledgement' AND is_system = true AND organization_id IS NULL);

-- Complaint Outcome Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Complaint Outcome Letter',
  'complaint-outcome-letter',
  'Formal outcome letter following investigation of a complaint',
  'compliance',
  'complaints',
  'letter',
  'Complaint Outcome — Ref: {{reference}}',
  '<p>Dear {{complainant_name}},</p>

<p><strong>Outcome of Formal Complaint — Ref: {{reference}}</strong></p>

<p>Thank you for your patience while your complaint was investigated. I am now writing to inform you of the outcome.</p>

<p><strong>Your complaint:</strong></p>
<p>{{complaint_summary}}</p>

<p><strong>Investigation findings:</strong></p>
<p>{{investigation_findings}}</p>

<p><strong>Outcome:</strong></p>
<p>{{outcome}}</p>

<p><strong>Actions to be taken:</strong></p>
<ul>
  <li>{{actions}}</li>
</ul>

<p>If you are not satisfied with this outcome, you may escalate your complaint to {{escalation_body}}. {{escalation_detail}}</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["complainant_name", "reference", "complaint_summary", "investigation_findings", "outcome", "actions", "escalation_body", "escalation_detail", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{compliance, complaints, outcome}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'complaint-outcome-letter' AND is_system = true AND organization_id IS NULL);

-- Training Expiry Reminder
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Training Expiry Reminder',
  'training-expiry-reminder',
  'Reminder to staff that mandatory training certification is approaching expiry',
  'compliance',
  'training',
  'notice',
  'Training Renewal Required — {{course_name}}',
  '<p>Dear {{staff_name}},</p>

<p><strong>Mandatory Training Renewal Required</strong></p>

<p>Our records show that your certification for the following training is due to expire:</p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Course:</td><td>{{course_name}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date Completed:</td><td>{{completion_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Expiry Date:</td><td>{{expiry_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Days Remaining:</td><td>{{days_remaining}}</td></tr>
</table>

<p>This training is a <strong>{{requirement_level}}</strong> requirement. {{statutory_reference}}</p>

<p><strong>How to renew:</strong></p>
<p>{{renewal_instructions}}</p>

<p>Please ensure your training is renewed before the expiry date. Failure to maintain current training may affect your ability to carry out your role.</p>

<p>If you have already completed this training, please forward your certificate to {{contact_email}} so our records can be updated.</p>

<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["staff_name", "course_name", "completion_date", "expiry_date", "days_remaining", "requirement_level", "statutory_reference", "renewal_instructions", "contact_email", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{compliance, training, expiry, reminder}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'training-expiry-reminder' AND is_system = true AND organization_id IS NULL);

-- ============================================================
-- 11. Seed system templates — Teaching & Learning
-- ============================================================

-- Parent Newsletter Template
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Parent Newsletter',
  'parent-newsletter',
  'Termly or weekly parent newsletter template with school branding',
  'teaching_learning',
  'communications',
  'newsletter',
  '{{school_name}} Newsletter — {{newsletter_date}}',
  '<h2>{{school_name}} Newsletter</h2>
<p><em>{{newsletter_date}} | {{term_name}}</em></p>

<h3>Headteacher''s Message</h3>
<p>{{headteacher_message}}</p>

<h3>Key Dates</h3>
<ul>
  <li>{{key_dates}}</li>
</ul>

<h3>Celebrations</h3>
<p>{{celebrations}}</p>

<h3>Curriculum Update</h3>
<p>{{curriculum_update}}</p>

<h3>Safeguarding Corner</h3>
<p>{{safeguarding_message}}</p>

<h3>Community News</h3>
<p>{{community_news}}</p>

<h3>Reminders</h3>
<ul>
  <li>{{reminders}}</li>
</ul>

<p style="margin-top:24px; font-style:italic;">{{sign_off}}</p>
<p>{{headteacher_name}}<br>Headteacher<br>{{school_name}}</p>',
  '["school_name", "newsletter_date", "term_name", "headteacher_message", "key_dates", "celebrations", "curriculum_update", "safeguarding_message", "community_news", "reminders", "sign_off", "headteacher_name"]'::jsonb,
  true, NULL, '{teaching_learning, newsletter, parents}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'parent-newsletter' AND is_system = true AND organization_id IS NULL);

-- Parent Evening Invitation
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Parent Evening Invitation',
  'parent-evening-invitation',
  'Invitation letter to parents/carers for parents'' evening consultations',
  'teaching_learning',
  'events',
  'invitation',
  'Parents'' Evening — {{event_date}} — {{school_name}}',
  '<p>Dear Parent/Carer,</p>

<p><strong>Parents'' Evening Consultation — {{term_name}}</strong></p>

<p>We would like to invite you to our {{term_name}} Parents'' Evening, where you will have the opportunity to meet with your child''s class teacher to discuss their progress, attainment, and next steps.</p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date:</td><td>{{event_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Time:</td><td>{{event_time}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Venue:</td><td>{{venue}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Appointment Length:</td><td>{{appointment_length}}</td></tr>
</table>

<p><strong>How to book your appointment:</strong></p>
<p>{{booking_instructions}}</p>

<p>Please book by <strong>{{booking_deadline}}</strong>.</p>

<p>If you are unable to attend, please contact the school office to arrange an alternative time to speak with your child''s teacher.</p>

<p>We look forward to seeing you.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["school_name", "term_name", "event_date", "event_time", "venue", "appointment_length", "booking_instructions", "booking_deadline", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{teaching_learning, parents_evening, invitation}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'parent-evening-invitation' AND is_system = true AND organization_id IS NULL);

-- Class Trip Permission Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Class Trip Permission Letter',
  'class-trip-permission',
  'Letter seeking parental permission for an educational visit or school trip',
  'teaching_learning',
  'trips',
  'form',
  'Educational Visit — {{trip_destination}} — {{trip_date}}',
  '<p>Dear Parent/Carer of {{child_name}},</p>

<p><strong>Educational Visit — {{trip_destination}}</strong></p>

<p>We are pleased to inform you that {{class_name}} will be visiting <strong>{{trip_destination}}</strong> as part of our {{curriculum_link}} curriculum.</p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date:</td><td>{{trip_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Departure:</td><td>{{departure_time}} from school</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Return:</td><td>{{return_time}} (approx.)</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Transport:</td><td>{{transport_method}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Cost:</td><td>{{cost}} (voluntary contribution)</td></tr>
</table>

<p><strong>What to bring:</strong></p>
<ul>
  <li>{{what_to_bring}}</li>
</ul>

<p><strong>Packed lunch:</strong> {{lunch_arrangements}}</p>

<p>A full risk assessment has been completed for this visit. The adult-to-child ratio will be {{ratio}}. Staff attending: {{staff_attending}}.</p>

<p>Please complete and return the permission slip below by <strong>{{permission_deadline}}</strong>.</p>

<hr>

<p><strong>PERMISSION SLIP — {{trip_destination}} — {{trip_date}}</strong></p>
<p>Child''s name: _____________________________ Class: _______________</p>
<p>I give permission for my child to attend the visit to {{trip_destination}} on {{trip_date}}.</p>
<p>Emergency contact number on the day: _________________________________</p>
<p>Medical/dietary information: _________________________________________</p>
<p>Signed: _____________________________ Date: _______________</p>
<p>Print name: _____________________________</p>',
  '["child_name", "class_name", "trip_destination", "curriculum_link", "trip_date", "departure_time", "return_time", "transport_method", "cost", "what_to_bring", "lunch_arrangements", "ratio", "staff_attending", "permission_deadline"]'::jsonb,
  true, NULL, '{teaching_learning, trips, permission, parents}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'class-trip-permission' AND is_system = true AND organization_id IS NULL);

-- Progress Report Cover Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Progress Report Cover Letter',
  'progress-report-cover',
  'Cover letter accompanying termly pupil progress reports sent to parents',
  'teaching_learning',
  'reports',
  'letter',
  '{{term_name}} Progress Report — {{child_name}}',
  '<p>Dear Parent/Carer of {{child_name}},</p>

<p><strong>{{term_name}} Progress Report</strong></p>

<p>Please find enclosed your child''s progress report for {{term_name}} of the {{academic_year}} academic year.</p>

<p>This report provides information on {{child_name}}''s attainment, progress, and effort across the curriculum. {{report_context}}</p>

<p><strong>Key information about this report:</strong></p>
<ul>
  <li>{{assessment_explanation}}</li>
</ul>

<p>{{additional_context}}</p>

<p>If you would like to discuss any aspect of this report, please contact the school office to arrange a meeting with {{class_teacher}}.</p>

<p>We continue to work in partnership with you to ensure {{child_name}} achieves their very best.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["child_name", "term_name", "academic_year", "report_context", "assessment_explanation", "additional_context", "class_teacher", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{teaching_learning, reports, progress, parents}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'progress-report-cover' AND is_system = true AND organization_id IS NULL);

-- ============================================================
-- 12. Seed system templates — SEND
-- ============================================================

-- EHCP Annual Review Invitation
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'EHCP Annual Review Invitation',
  'ehcp-annual-review-invitation',
  'Invitation to attend an annual review of an Education, Health and Care Plan',
  'send',
  'ehcp',
  'invitation',
  'EHCP Annual Review — {{child_name}} — {{review_date}}',
  '<p>Dear {{parent_name}},</p>

<p><strong>Annual Review of Education, Health and Care Plan</strong></p>
<p><strong>Child:</strong> {{child_name}} | <strong>Date of Birth:</strong> {{dob}} | <strong>Year Group:</strong> {{year_group}}</p>

<p>As required by the Children and Families Act 2014 and the SEND Code of Practice (2015), I am writing to invite you to the annual review of {{child_name}}''s Education, Health and Care Plan (EHCP).</p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date:</td><td>{{review_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Time:</td><td>{{review_time}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Venue:</td><td>{{venue}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">SENCo:</td><td>{{senco_name}}</td></tr>
</table>

<p>The following professionals have also been invited:</p>
<ul>
  <li>{{invited_professionals}}</li>
</ul>

<p>Before the meeting, we will circulate reports and your child''s views. We would welcome your written contribution — please complete and return the enclosed parent/carer questionnaire by <strong>{{paperwork_deadline}}</strong>.</p>

<p>The review will consider:</p>
<ul>
  <li>Progress towards EHCP outcomes</li>
  <li>Whether the provision specified in the plan remains appropriate</li>
  <li>Any changes needed to outcomes, provision, or placement</li>
  <li>{{child_name}}''s views and aspirations</li>
</ul>

<p>If you are unable to attend, please let us know and we will ensure your views are represented. You are welcome to bring a friend, family member, or advocate.</p>

<p>Yours sincerely,</p>
<p>{{senco_name}}<br>Special Educational Needs Coordinator<br>{{school_name}}</p>',
  '["parent_name", "child_name", "dob", "year_group", "review_date", "review_time", "venue", "senco_name", "invited_professionals", "paperwork_deadline", "school_name"]'::jsonb,
  true, NULL, '{send, ehcp, annual_review, statutory}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'ehcp-annual-review-invitation' AND is_system = true AND organization_id IS NULL);

-- EHCP Annual Review Outcome
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'EHCP Annual Review Outcome',
  'ehcp-annual-review-outcome',
  'Letter to parents confirming the outcome and recommendations of an EHCP annual review',
  'send',
  'ehcp',
  'letter',
  'EHCP Annual Review Outcome — {{child_name}}',
  '<p>Dear {{parent_name}},</p>

<p><strong>Outcome of EHCP Annual Review — {{child_name}}</strong></p>

<p>Thank you for attending the annual review meeting held on <strong>{{review_date}}</strong>. I am writing to confirm the outcome and recommendations.</p>

<h3>Progress Against Outcomes</h3>
<p>{{progress_summary}}</p>

<h3>Recommendation</h3>
<p>Following the review, the school''s recommendation to the Local Authority is:</p>
<p><strong>{{recommendation}}</strong></p>

<p>{{recommendation_detail}}</p>

<h3>Amended Outcomes (if applicable)</h3>
<p>{{amended_outcomes}}</p>

<h3>Provision Changes (if applicable)</h3>
<p>{{provision_changes}}</p>

<h3>Next Steps</h3>
<ul>
  <li>{{next_steps}}</li>
</ul>

<p>The annual review report and recommendations will be submitted to {{la_name}} within two weeks of this meeting. The Local Authority must decide whether to maintain, amend, or cease the plan within four weeks of receiving the report.</p>

<p>If you have any questions or concerns, please do not hesitate to contact me.</p>

<p>Yours sincerely,</p>
<p>{{senco_name}}<br>Special Educational Needs Coordinator<br>{{school_name}}</p>',
  '["parent_name", "child_name", "review_date", "progress_summary", "recommendation", "recommendation_detail", "amended_outcomes", "provision_changes", "next_steps", "la_name", "senco_name", "school_name"]'::jsonb,
  true, NULL, '{send, ehcp, annual_review, outcome}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'ehcp-annual-review-outcome' AND is_system = true AND organization_id IS NULL);

-- Educational Psychologist Referral Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Educational Psychologist Referral',
  'ep-referral-letter',
  'Referral letter to an Educational Psychologist for assessment',
  'send',
  'referrals',
  'letter',
  'EP Referral — {{child_name}} — {{school_name}}',
  '<p>Dear {{ep_name}},</p>

<p><strong>Referral for Educational Psychology Assessment</strong></p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Child:</td><td>{{child_name}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date of Birth:</td><td>{{dob}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Year Group:</td><td>{{year_group}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">School:</td><td>{{school_name}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">SEN Status:</td><td>{{sen_status}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Ethnicity:</td><td>{{ethnicity}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">EAL:</td><td>{{eal_status}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Pupil Premium:</td><td>{{pp_status}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Looked After:</td><td>{{lac_status}}</td></tr>
</table>

<h3>Reason for Referral</h3>
<p>{{referral_reason}}</p>

<h3>Areas of Concern</h3>
<ul>
  <li>{{areas_of_concern}}</li>
</ul>

<h3>Current Attainment</h3>
<p>{{current_attainment}}</p>

<h3>Interventions Already Tried</h3>
<p>{{interventions}}</p>

<h3>Parental Consent</h3>
<p>Parental consent has been obtained on {{consent_date}}. Parents'' views: {{parent_views}}</p>

<h3>Child''s Views</h3>
<p>{{child_views}}</p>

<h3>What We Hope to Gain</h3>
<p>{{assessment_purpose}}</p>

<p>Yours sincerely,</p>
<p>{{senco_name}}<br>Special Educational Needs Coordinator<br>{{school_name}}<br>{{school_phone}} | {{senco_email}}</p>',
  '["ep_name", "child_name", "dob", "year_group", "school_name", "sen_status", "ethnicity", "eal_status", "pp_status", "lac_status", "referral_reason", "areas_of_concern", "current_attainment", "interventions", "consent_date", "parent_views", "child_views", "assessment_purpose", "senco_name", "school_phone", "senco_email"]'::jsonb,
  true, NULL, '{send, ep, referral}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'ep-referral-letter' AND is_system = true AND organization_id IS NULL);

-- SEN Support Plan Review Letter
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'SEN Support Plan Review Letter',
  'sen-support-plan-review',
  'Letter to parents following a review of their child''s SEN Support Plan',
  'send',
  'sen_support',
  'letter',
  'SEN Support Plan Review — {{child_name}}',
  '<p>Dear {{parent_name}},</p>

<p><strong>SEN Support Plan Review — {{child_name}}</strong></p>

<p>Thank you for meeting with us on <strong>{{review_date}}</strong> to review {{child_name}}''s SEN Support Plan. This letter confirms the key points discussed and agreed.</p>

<h3>Current SEN Category: {{sen_category}}</h3>
<p><strong>Primary Need:</strong> {{primary_need}}</p>

<h3>Progress Since Last Review</h3>
<p>{{progress_summary}}</p>

<h3>Updated Targets</h3>
<ol>
  <li>{{targets}}</li>
</ol>

<h3>Provision</h3>
<p>The following support will be in place for the next review period:</p>
<ul>
  <li>{{provision}}</li>
</ul>

<h3>Actions for Home</h3>
<ul>
  <li>{{home_actions}}</li>
</ul>

<h3>Next Review</h3>
<p>The next review is scheduled for <strong>{{next_review_date}}</strong>.</p>

<p>An updated copy of {{child_name}}''s SEN Support Plan is enclosed. If you have any questions or wish to discuss anything further, please contact me.</p>

<p>Yours sincerely,</p>
<p>{{senco_name}}<br>Special Educational Needs Coordinator<br>{{school_name}}</p>',
  '["parent_name", "child_name", "review_date", "sen_category", "primary_need", "progress_summary", "targets", "provision", "home_actions", "next_review_date", "senco_name", "school_name"]'::jsonb,
  true, NULL, '{send, sen_support, review}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'sen-support-plan-review' AND is_system = true AND organization_id IS NULL);

-- ============================================================
-- 13. Seed system templates — Finance
-- ============================================================

-- Purchase Order Confirmation
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Purchase Order Confirmation',
  'purchase-order-confirmation',
  'Confirmation letter accompanying a purchase order to a supplier',
  'finance',
  'procurement',
  'letter',
  'Purchase Order — {{po_number}} — {{school_name}}',
  '<p>Dear {{supplier_name}},</p>

<p><strong>Purchase Order — {{po_number}}</strong></p>

<p>Please find details of the following order placed by {{school_name}}:</p>

<table style="border-collapse:collapse; margin:16px 0;">
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">PO Number:</td><td>{{po_number}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Date:</td><td>{{order_date}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Requested By:</td><td>{{requested_by}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Authorised By:</td><td>{{authorised_by}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Budget Code:</td><td>{{budget_code}}</td></tr>
  <tr><td style="padding:4px 16px 4px 0; font-weight:bold;">Delivery Address:</td><td>{{delivery_address}}</td></tr>
</table>

<h3>Order Details</h3>
<p>{{order_items}}</p>

<p><strong>Total (excl. VAT):</strong> &pound;{{total_excl_vat}}<br>
<strong>VAT:</strong> &pound;{{vat_amount}}<br>
<strong>Total (incl. VAT):</strong> &pound;{{total_incl_vat}}</p>

<p><strong>Delivery required by:</strong> {{delivery_date}}</p>

<p><strong>Payment Terms:</strong> {{payment_terms}}</p>

<p>Please confirm receipt of this order and expected delivery date.</p>

<p>Yours sincerely,</p>
<p>{{sender_name}}<br>{{sender_title}}<br>{{school_name}}</p>',
  '["supplier_name", "po_number", "order_date", "requested_by", "authorised_by", "budget_code", "delivery_address", "order_items", "total_excl_vat", "vat_amount", "total_incl_vat", "delivery_date", "payment_terms", "sender_name", "sender_title", "school_name"]'::jsonb,
  true, NULL, '{finance, procurement, purchase_order}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'purchase-order-confirmation' AND is_system = true AND organization_id IS NULL);

-- Budget Variance Report Cover
INSERT INTO document_templates (name, slug, description, module, category, document_type, subject_template, body_template, available_placeholders, is_system, organization_id, tags)
SELECT
  'Budget Variance Report Cover',
  'budget-variance-report-cover',
  'Cover letter for the budget monitoring/variance report presented to governors',
  'finance',
  'reporting',
  'report',
  'Budget Monitoring Report — {{report_period}} — {{school_name}}',
  '<h2>{{school_name}} — Budget Monitoring Report</h2>
<p><strong>Period:</strong> {{report_period}} | <strong>Report Date:</strong> {{report_date}}</p>

<h3>Summary</h3>
<table style="border-collapse:collapse; margin:16px 0; width:100%;">
  <tr style="background:#f5f5f5;">
    <td style="padding:8px; font-weight:bold;">Category</td>
    <td style="padding:8px; font-weight:bold; text-align:right;">Budget</td>
    <td style="padding:8px; font-weight:bold; text-align:right;">Actual</td>
    <td style="padding:8px; font-weight:bold; text-align:right;">Variance</td>
  </tr>
  <tr>
    <td style="padding:8px;">Total Income</td>
    <td style="padding:8px; text-align:right;">&pound;{{income_budget}}</td>
    <td style="padding:8px; text-align:right;">&pound;{{income_actual}}</td>
    <td style="padding:8px; text-align:right;">{{income_variance}}</td>
  </tr>
  <tr>
    <td style="padding:8px;">Total Expenditure</td>
    <td style="padding:8px; text-align:right;">&pound;{{expenditure_budget}}</td>
    <td style="padding:8px; text-align:right;">&pound;{{expenditure_actual}}</td>
    <td style="padding:8px; text-align:right;">{{expenditure_variance}}</td>
  </tr>
  <tr style="font-weight:bold; border-top:2px solid #333;">
    <td style="padding:8px;">Net Position</td>
    <td style="padding:8px; text-align:right;">&pound;{{net_budget}}</td>
    <td style="padding:8px; text-align:right;">&pound;{{net_actual}}</td>
    <td style="padding:8px; text-align:right;">{{net_variance}}</td>
  </tr>
</table>

<h3>Key Variances</h3>
<p>{{key_variances}}</p>

<h3>Staffing Costs</h3>
<p>Staffing as percentage of total expenditure: <strong>{{staffing_percentage}}%</strong> (target: &le;78%)</p>
<p>{{staffing_commentary}}</p>

<h3>Risks and Pressures</h3>
<ul>
  <li>{{risks}}</li>
</ul>

<h3>Forecast Outturn</h3>
<p>{{forecast_commentary}}</p>

<p style="margin-top:24px;"><strong>Prepared by:</strong> {{sender_name}}, {{sender_title}}<br>
<strong>Date:</strong> {{report_date}}</p>',
  '["school_name", "report_period", "report_date", "income_budget", "income_actual", "income_variance", "expenditure_budget", "expenditure_actual", "expenditure_variance", "net_budget", "net_actual", "net_variance", "key_variances", "staffing_percentage", "staffing_commentary", "risks", "forecast_commentary", "sender_name", "sender_title"]'::jsonb,
  true, NULL, '{finance, budget, variance, governors}'
WHERE NOT EXISTS (SELECT 1 FROM document_templates WHERE slug = 'budget-variance-report-cover' AND is_system = true AND organization_id IS NULL);

-- ============================================================
-- 14. Row Level Security
-- ============================================================

-- document_templates
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_templates_select') THEN
    CREATE POLICY "document_templates_select" ON document_templates
      FOR SELECT USING (
        organization_id IS NULL
        OR organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_templates_insert') THEN
    CREATE POLICY "document_templates_insert" ON document_templates
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_templates_update') THEN
    CREATE POLICY "document_templates_update" ON document_templates
      FOR UPDATE USING (
        is_system = false
        AND organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_templates_delete') THEN
    CREATE POLICY "document_templates_delete" ON document_templates
      FOR DELETE USING (
        is_system = false
        AND organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

-- generated_documents
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'generated_documents_select') THEN
    CREATE POLICY "generated_documents_select" ON generated_documents
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'generated_documents_insert') THEN
    CREATE POLICY "generated_documents_insert" ON generated_documents
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'generated_documents_update') THEN
    CREATE POLICY "generated_documents_update" ON generated_documents
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'generated_documents_delete') THEN
    CREATE POLICY "generated_documents_delete" ON generated_documents
      FOR DELETE USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

-- document_delivery_log
ALTER TABLE document_delivery_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_delivery_log_select') THEN
    CREATE POLICY "document_delivery_log_select" ON document_delivery_log
      FOR SELECT USING (
        document_id IN (
          SELECT id FROM generated_documents WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_delivery_log_insert') THEN
    CREATE POLICY "document_delivery_log_insert" ON document_delivery_log
      FOR INSERT WITH CHECK (
        document_id IN (
          SELECT id FROM generated_documents WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_delivery_log_update') THEN
    CREATE POLICY "document_delivery_log_update" ON document_delivery_log
      FOR UPDATE USING (
        document_id IN (
          SELECT id FROM generated_documents WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_delivery_log_delete') THEN
    CREATE POLICY "document_delivery_log_delete" ON document_delivery_log
      FOR DELETE USING (
        document_id IN (
          SELECT id FROM generated_documents WHERE organization_id IN (
            SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
          )
        )
      );
  END IF;
END $$;

-- document_trigger_rules
ALTER TABLE document_trigger_rules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_trigger_rules_select') THEN
    CREATE POLICY "document_trigger_rules_select" ON document_trigger_rules
      FOR SELECT USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_trigger_rules_insert') THEN
    CREATE POLICY "document_trigger_rules_insert" ON document_trigger_rules
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_trigger_rules_update') THEN
    CREATE POLICY "document_trigger_rules_update" ON document_trigger_rules
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'document_trigger_rules_delete') THEN
    CREATE POLICY "document_trigger_rules_delete" ON document_trigger_rules
      FOR DELETE USING (
        organization_id IN (
          SELECT organization_id FROM organization_members WHERE user_id = (auth.uid())::text
        )
      );
  END IF;
END $$;
