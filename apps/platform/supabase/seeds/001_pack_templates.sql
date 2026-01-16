-- ============================================================
-- GOVERNOR PACK TEMPLATES
-- ============================================================

INSERT INTO public.pack_templates (template_id, name, description, pack_type, sections, estimated_time_minutes, is_active)
VALUES 
(
  'headteacher_report',
  'Headteacher''s Report',
  'Standard termly report covering key school metrics and updates for governors',
  'governor',
  '[
    {
      "section_id": "executive_summary",
      "title": "Executive Summary",
      "description": "Key headlines and priorities this term",
      "evidence_categories": [],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "attendance",
      "title": "Attendance",
      "description": "Current attendance data, trends, and actions taken",
      "evidence_categories": ["attendance"],
      "word_guide": {"min": 150, "max": 300},
      "required": true
    },
    {
      "section_id": "behaviour_safety",
      "title": "Behaviour & Safety",
      "description": "Behaviour metrics, exclusions, safeguarding updates",
      "evidence_categories": ["safeguarding", "behaviour"],
      "word_guide": {"min": 150, "max": 300},
      "required": true
    },
    {
      "section_id": "quality_of_education",
      "title": "Quality of Education",
      "description": "Teaching quality, curriculum updates, assessment data",
      "evidence_categories": ["teaching", "curriculum", "assessment"],
      "word_guide": {"min": 200, "max": 400},
      "required": true
    },
    {
      "section_id": "staffing",
      "title": "Staffing Update",
      "description": "Staff changes, recruitment, CPD, wellbeing",
      "evidence_categories": ["staffing", "cpd"],
      "word_guide": {"min": 100, "max": 200},
      "required": false
    },
    {
      "section_id": "priorities",
      "title": "Key Priorities & Next Steps",
      "description": "Focus areas and actions for next term",
      "evidence_categories": [],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    }
  ]'::jsonb,
  60
),
(
  'finance_variance',
  'Finance Variance Report',
  'Budget monitoring report with variance analysis and year-end forecast',
  'governor',
  '[
    {
      "section_id": "financial_summary",
      "title": "Financial Summary",
      "description": "High-level budget position and key figures",
      "evidence_categories": ["finance"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "income_analysis",
      "title": "Income Analysis",
      "description": "Funding received vs expected, grant status",
      "evidence_categories": ["finance"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "expenditure_analysis",
      "title": "Expenditure Analysis",
      "description": "Spending by category with variances explained",
      "evidence_categories": ["finance"],
      "word_guide": {"min": 150, "max": 300},
      "required": true
    },
    {
      "section_id": "significant_variances",
      "title": "Significant Variances",
      "description": "Detailed explanation of major budget differences",
      "evidence_categories": ["finance"],
      "word_guide": {"min": 150, "max": 300},
      "required": true
    },
    {
      "section_id": "year_end_forecast",
      "title": "Year-End Forecast",
      "description": "Projected outturn and reserve position",
      "evidence_categories": ["finance"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "financial_risks",
      "title": "Financial Risks",
      "description": "Key risks and mitigation strategies",
      "evidence_categories": ["finance"],
      "word_guide": {"min": 100, "max": 200},
      "required": false
    }
  ]'::jsonb,
  45
),
(
  'safeguarding_update',
  'Safeguarding Update',
  'Termly safeguarding report for governors with anonymised data',
  'governor',
  '[
    {
      "section_id": "safeguarding_overview",
      "title": "Safeguarding Overview",
      "description": "Summary of safeguarding activity this term",
      "evidence_categories": ["safeguarding"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "training_compliance",
      "title": "Training & Compliance",
      "description": "Staff training status, SCR checks, policy reviews",
      "evidence_categories": ["safeguarding", "cpd", "compliance"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "referrals_summary",
      "title": "Referrals Summary",
      "description": "Anonymised summary of concerns and referrals (numbers only)",
      "evidence_categories": ["safeguarding"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "policy_updates",
      "title": "Policy Updates",
      "description": "Any safeguarding policy changes or reviews due",
      "evidence_categories": ["safeguarding", "compliance"],
      "word_guide": {"min": 50, "max": 150},
      "required": false
    },
    {
      "section_id": "safeguarding_priorities",
      "title": "Priorities",
      "description": "Focus areas for safeguarding improvement",
      "evidence_categories": [],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    }
  ]'::jsonb,
  30
),
(
  'premises_update',
  'Premises & Health and Safety',
  'Termly premises compliance and H&S report for governors',
  'governor',
  '[
    {
      "section_id": "compliance_status",
      "title": "Compliance Status",
      "description": "Status of statutory checks and inspections",
      "evidence_categories": ["estates", "compliance"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "maintenance_summary",
      "title": "Maintenance Summary",
      "description": "Completed and outstanding maintenance works",
      "evidence_categories": ["estates"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "incidents_accidents",
      "title": "Incidents & Accidents",
      "description": "Summary of reportable incidents and actions taken",
      "evidence_categories": ["estates", "safeguarding"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    },
    {
      "section_id": "capital_projects",
      "title": "Capital Projects",
      "description": "Update on any major works or planned projects",
      "evidence_categories": ["estates"],
      "word_guide": {"min": 100, "max": 200},
      "required": false
    },
    {
      "section_id": "premises_risks",
      "title": "Risk Register",
      "description": "Key premises risks and mitigation actions",
      "evidence_categories": ["estates"],
      "word_guide": {"min": 100, "max": 200},
      "required": true
    }
  ]'::jsonb,
  30
),
(
  'full_board_pack',
  'Full Board Pack',
  'Complete governance pack combining all standard reports for board meetings',
  'governor',
  '[
    {
      "section_id": "agenda",
      "title": "Agenda",
      "description": "Meeting agenda and order of business",
      "evidence_categories": ["governance"],
      "word_guide": {"min": 50, "max": 150},
      "required": true
    },
    {
      "section_id": "previous_minutes",
      "title": "Previous Minutes & Actions",
      "description": "Minutes from last meeting and action tracking",
      "evidence_categories": ["governance"],
      "word_guide": {"min": 100, "max": 300},
      "required": true
    },
    {
      "section_id": "headteacher_report",
      "title": "Headteacher''s Report",
      "description": "Full headteacher report covering all key areas",
      "evidence_categories": ["attendance", "safeguarding", "teaching"],
      "word_guide": {"min": 400, "max": 800},
      "required": true
    },
    {
      "section_id": "finance_report",
      "title": "Finance Report",
      "description": "Budget monitoring and financial position",
      "evidence_categories": ["finance"],
      "word_guide": {"min": 200, "max": 400},
      "required": true
    },
    {
      "section_id": "safeguarding_report",
      "title": "Safeguarding Report",
      "description": "Safeguarding update and compliance status",
      "evidence_categories": ["safeguarding"],
      "word_guide": {"min": 150, "max": 300},
      "required": true
    },
    {
      "section_id": "premises_report",
      "title": "Premises Report",
      "description": "Premises, H&S, and estates update",
      "evidence_categories": ["estates"],
      "word_guide": {"min": 150, "max": 300},
      "required": true
    },
    {
      "section_id": "policies_approval",
      "title": "Policies for Approval",
      "description": "List of policies requiring governor approval",
      "evidence_categories": ["compliance"],
      "word_guide": {"min": 50, "max": 150},
      "required": false
    },
    {
      "section_id": "aob",
      "title": "Any Other Business",
      "description": "Additional items for discussion",
      "evidence_categories": [],
      "word_guide": {"min": 50, "max": 100},
      "required": false
    }
  ]'::jsonb,
  120
)
ON CONFLICT (template_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sections = EXCLUDED.sections,
  estimated_time_minutes = EXCLUDED.estimated_time_minutes,
  updated_at = NOW();
