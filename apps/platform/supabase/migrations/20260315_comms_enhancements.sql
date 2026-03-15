-- ════════════════════════════════════════════════════════════════════
-- COMMS ENHANCEMENTS: Analytics, Templates, Calendar, Scheduling, Drills
-- ════════════════════════════════════════════════════════════════════

-- ─── Notice Templates ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  notice_type TEXT NOT NULL DEFAULT 'announcement',
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  default_audience TEXT NOT NULL DEFAULT 'all',
  default_priority TEXT NOT NULL DEFAULT 'normal',
  default_display_style TEXT NOT NULL DEFAULT 'card',
  default_show_on_display BOOLEAN DEFAULT true,
  default_show_on_dashboard BOOLEAN DEFAULT true,
  icon TEXT,
  color TEXT,
  is_system BOOLEAN DEFAULT false,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Scheduled Notices ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scheduled_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  notice_data JSONB NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  recurrence TEXT, -- 'none', 'daily', 'weekly', 'monthly', 'term_start', 'term_end'
  recurrence_end TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, cancelled, failed
  created_by UUID NOT NULL,
  created_by_name TEXT,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Communication Analytics ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS comms_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- notice_created, notice_viewed, notice_acknowledged, broadcast_triggered, broadcast_resolved, quick_message_sent, pa_announcement, video_room_created, assembly_started
  event_data JSONB DEFAULT '{}',
  actor_id UUID,
  actor_name TEXT,
  channel TEXT, -- display, dashboard, email, push, sms, pa
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comms_analytics_org ON comms_analytics(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comms_analytics_type ON comms_analytics(organization_id, event_type);

-- ─── Emergency Drill Schedule ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_drill_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  drill_type TEXT NOT NULL, -- fire, lockdown, shelter_in_place, evacuation, bomb_threat, invacuation
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INT DEFAULT 15,
  lead_person TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, overdue
  completed_at TIMESTAMPTZ,
  broadcast_id UUID REFERENCES emergency_broadcasts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Drill Reports ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_drill_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  drill_schedule_id UUID REFERENCES emergency_drill_schedule(id),
  broadcast_id UUID REFERENCES emergency_broadcasts(id),
  drill_type TEXT NOT NULL,
  drill_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  evacuation_time_seconds INT,
  total_acknowledged INT DEFAULT 0,
  total_headcount INT,
  zones_covered TEXT[] DEFAULT '{}',
  issues_found TEXT,
  actions_required TEXT,
  weather_conditions TEXT,
  was_announced BOOLEAN DEFAULT true, -- announced vs unannounced
  assessor_name TEXT,
  assessor_notes TEXT,
  compliance_rating TEXT, -- excellent, good, satisfactory, inadequate
  report_pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── School Calendar Events ────────────────────────────────────────
-- (extends the existing events with comms-specific fields)
CREATE TABLE IF NOT EXISTS school_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'general', -- general, meeting, training, assembly, trip, deadline, holiday, inspection, parents_evening, sport, performance, pta, worship
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  is_all_day BOOLEAN DEFAULT false,
  audience TEXT DEFAULT 'all',
  color TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_rule TEXT, -- RRULE format
  notify_parents BOOLEAN DEFAULT false,
  notify_staff BOOLEAN DEFAULT false,
  show_on_display BOOLEAN DEFAULT false,
  show_countdown BOOLEAN DEFAULT false,
  created_by UUID,
  created_by_name TEXT,
  academic_year TEXT,
  term TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON school_calendar_events(organization_id, start_date);

-- ─── Seed Notice Templates ─────────────────────────────────────────
INSERT INTO notice_templates (organization_id, template_name, category, notice_type, title_template, body_template, default_audience, default_priority, default_display_style, is_system, icon, color)
SELECT
  id,
  t.template_name,
  t.category,
  t.notice_type,
  t.title_template,
  t.body_template,
  t.default_audience,
  t.default_priority,
  t.default_display_style,
  true,
  t.icon,
  t.color
FROM organizations o
CROSS JOIN (VALUES
  ('Sports Day', 'events', 'event', 'Sports Day — {{date}}', E'It''s Sports Day! Please ensure your child comes to school in their house colour PE kit. The event runs from {{start_time}} to {{end_time}} on the school field.\n\nParents and family members are warmly invited to come and support the children. Gates open at {{gate_time}}.\n\nPlease bring sun cream, hats, and water bottles.', 'all', 'high', 'hero', 'trophy', 'amber'),
  ('Parents Evening', 'events', 'event', E'Parents'' Evening — {{date}}', E'Parents'' Evening appointments are now available to book.\n\nDate: {{date}}\nTime: {{start_time}} — {{end_time}}\n\nPlease book your slot via the school app or contact the office. Each appointment is {{slot_duration}} minutes.', 'parents', 'high', 'card', 'users', 'indigo'),
  ('School Closure', 'urgent', 'announcement', 'School Closed — {{date}}', 'Due to {{reason}}, school will be CLOSED on {{date}}.\n\nAll after-school clubs and activities are also cancelled. Please check for updates on our website and app.\n\nWe apologise for any inconvenience and will reopen as soon as it is safe to do so.', 'all', 'urgent', 'banner', 'alert-triangle', 'red'),
  ('Wet Play', 'daily', 'reminder', 'Wet Play Today', 'Due to the weather, break times will be indoors today. Children should bring a book or quiet activity. Lunchtime clubs will run as normal.', 'all_staff', 'normal', 'ticker', 'cloud-rain', 'blue'),
  ('Assembly Reminder', 'daily', 'reminder', '{{assembly_type}} Assembly — {{time}}', '{{assembly_name}} assembly today at {{time}} in {{location}}.\n\n{{additional_info}}', 'all_staff', 'normal', 'card', 'users', 'purple'),
  ('Fundraiser', 'pta', 'announcement', '{{event_name}} — {{date}}', 'The PTA/Friends of {{school_name}} are organising {{event_name}} on {{date}}.\n\n{{details}}\n\nAll proceeds go towards {{cause}}. We hope to see you there!', 'all', 'normal', 'celebration', 'heart', 'pink'),
  ('Achievement Celebration', 'celebration', 'celebration', '{{child_name}} — {{achievement}}!', E'A huge well done to {{child_name}} for {{achievement}}!\n\nWe''re so proud of this fantastic accomplishment. Keep up the brilliant work!', 'all', 'normal', 'celebration', 'star', 'amber'),
  ('End of Term', 'term', 'announcement', 'End of {{term}} Term — {{date}}', 'The last day of {{term}} term is {{date}}. School finishes at {{finish_time}}.\n\nTerm resumes on {{return_date}} at the normal time.\n\nWishing all our families a wonderful {{holiday_name}}!', 'all', 'high', 'hero', 'calendar', 'green'),
  ('School Trip', 'events', 'event', '{{trip_name}} — {{date}}', 'Reminder: {{year_group}} are going on a trip to {{destination}} on {{date}}.\n\nDeparture: {{depart_time}} (please arrive by {{arrive_time}})\nReturn: approximately {{return_time}}\n\nChildren need: {{kit_list}}\n\nPlease ensure consent forms are returned.', 'parents', 'high', 'card', 'map-pin', 'green'),
  ('Staff Meeting', 'staff', 'reminder', 'Staff Meeting — {{date}} at {{time}}', 'Reminder: Staff meeting on {{date}} at {{time}} in {{location}}.\n\nAgenda:\n{{agenda}}\n\nPlease bring: {{bring_items}}', 'all_staff', 'normal', 'card', 'clipboard', 'slate'),
  ('INSET Day', 'term', 'announcement', 'INSET Day — {{date}}', 'Please note that {{date}} is an INSET (training) day. School will be CLOSED to pupils.\n\nStaff should report at {{time}} for {{training_focus}}.\n\nNormal school resumes on {{next_open}}.', 'all', 'high', 'banner', 'book-open', 'violet'),
  ('Lunch Menu Change', 'daily', 'menu', 'Menu Change — {{date}}', E'Please note a change to today''s lunch menu:\n\n{{menu_details}}\n\nIf your child has any dietary requirements, please contact the office.', 'all', 'normal', 'ticker', 'utensils', 'orange')
) AS t(template_name, category, notice_type, title_template, body_template, default_audience, default_priority, default_display_style, icon, color)
WHERE o.name = 'Arrival Primary';
