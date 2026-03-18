-- ============================================================================
-- Link Incidents to SOPs + Add H&S SOP Templates
-- Adds 'h_and_s' category, links incident_reports to SOP runs,
-- and seeds 6 new H&S-specific SOP templates
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add 'h_and_s' to sop_templates category constraint
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- Drop the existing constraint and re-add with 'h_and_s'
  ALTER TABLE public.sop_templates DROP CONSTRAINT IF EXISTS sop_templates_category_check;
  ALTER TABLE public.sop_templates ADD CONSTRAINT sop_templates_category_check
    CHECK (category IN ('estates', 'safeguarding', 'compliance', 'governance', 'finance', 'hr', 'h_and_s'));
END $$;

-- ---------------------------------------------------------------------------
-- 2. Add SOP linkage columns to incident_reports
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'incident_reports' AND column_name = 'linked_sop_run_id'
  ) THEN
    ALTER TABLE incident_reports ADD COLUMN linked_sop_run_id UUID;
    ALTER TABLE incident_reports ADD COLUMN linked_sop_template_id TEXT;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Add linked_incident_id to sop_runs for reverse lookup
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sop_runs' AND column_name = 'linked_incident_id'
  ) THEN
    ALTER TABLE sop_runs ADD COLUMN linked_incident_id UUID;
    ALTER TABLE sop_runs ADD COLUMN linked_module TEXT;  -- 'incidents', 'estates', 'compliance', etc.
    ALTER TABLE sop_runs ADD COLUMN linked_entity_id UUID;  -- generic link to any module record
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4. Seed H&S-specific SOP templates
-- ---------------------------------------------------------------------------

-- Update existing incident_response to h_and_s category and enhance
INSERT INTO public.sop_templates (template_id, name, description, category, frequency, steps, estimated_time_minutes, owner_role, is_active)
VALUES
-- RIDDOR Assessment & Reporting SOP
(
  'riddor_assessment',
  'RIDDOR Assessment & Reporting',
  'Step-by-step guide for determining RIDDOR reportability and filing with HSE. Auto-triggered when system detects potential RIDDOR incident.',
  'h_and_s',
  'ad_hoc',
  '[
    {
      "step_id": "review_detection",
      "order": 1,
      "title": "Review Auto-Detection Result",
      "instruction": "Review the system RIDDOR auto-detection. Check: Is the category correct? Does the reason match what happened? If detection says NOT reportable, still review the criteria manually.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record whether you agree with the auto-detection",
      "linked_module": "incidents",
      "ai_assist": true
    },
    {
      "step_id": "verify_injury_details",
      "order": 2,
      "title": "Verify Injury Classification",
      "instruction": "Confirm injury type matches RIDDOR categories: (1) Death (2) Specified injuries (fractures excl. fingers/toes, amputations, loss of sight, crush, scalping, burns causing hospitalisation, loss of consciousness) (3) >7 consecutive days off work (4) Non-worker taken to hospital as in-patient (5) Dangerous occurrence (6) Occupational disease. NOTE: A&E visit WITHOUT admission is NOT RIDDOR for non-workers.",
      "evidence_required": true,
      "evidence_types": ["note", "file"],
      "evidence_guidance": "Medical documentation or hospital discharge letter if available"
    },
    {
      "step_id": "calculate_deadline",
      "order": 3,
      "title": "Confirm Reporting Deadline",
      "instruction": "Death/specified injury: notify HSE immediately by phone (0345 300 9923), then file F2508 within 10 working days. >7-day injury: file within 15 days of incident. Dangerous occurrence: notify immediately, file within 10 working days. Check the auto-calculated deadline matches.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record confirmed deadline date"
    },
    {
      "step_id": "review_f2508",
      "order": 4,
      "title": "Review Pre-filled F2508 Form",
      "instruction": "Ed has pre-filled the F2508 form data from the incident record. Review EVERY field for accuracy: reporter details, injured person details, location, injury description, RIDDOR category. Correct any errors before submission.",
      "evidence_required": true,
      "evidence_types": ["file"],
      "evidence_guidance": "Download the pre-filled F2508 and mark any corrections needed",
      "ai_assist": true
    },
    {
      "step_id": "file_with_hse",
      "order": 5,
      "title": "File Report with HSE",
      "instruction": "Submit the report via the HSE online portal: https://www.hse.gov.uk/riddor/report.htm. Record the HSE reference number. If telephone notification was required (death/specified injury), confirm this was also done.",
      "evidence_required": true,
      "evidence_types": ["file", "note"],
      "evidence_guidance": "Screenshot of HSE confirmation or reference number"
    },
    {
      "step_id": "update_records",
      "order": 6,
      "title": "Update Incident Record",
      "instruction": "Update the incident record with: HSE reference number, date filed, filed by name. Mark RIDDOR status as reported. The system will update automatically when you enter the reference number.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Confirm reference number entered in incident record",
      "linked_module": "incidents",
      "ai_assist": true
    },
    {
      "step_id": "notify_stakeholders",
      "order": 7,
      "title": "Notify Relevant Parties",
      "instruction": "Notify: (1) Headteacher if not already aware (2) Chair of Governors for death/specified injury (3) Local Authority if maintained school (4) Trust H&S lead if academy (5) Insurance provider. Record all notifications.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "List who was notified, when, and method"
    }
  ]'::jsonb,
  45,
  'headteacher',
  true
),

-- Post-Incident Investigation SOP
(
  'incident_investigation',
  'Post-Incident Investigation',
  'Structured investigation process for incidents requiring root cause analysis. Follows HSE guidance HSG245.',
  'h_and_s',
  'ad_hoc',
  '[
    {
      "step_id": "assign_investigator",
      "order": 1,
      "title": "Assign Investigation Lead",
      "instruction": "Appoint investigation lead (should not be the person involved in the incident). For serious incidents, consider external H&S consultant. Record investigator name and confirm they have appropriate training.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record investigator name and qualifications"
    },
    {
      "step_id": "gather_evidence",
      "order": 2,
      "title": "Gather Physical Evidence",
      "instruction": "Before cleaning/repairing: photograph scene from multiple angles, collect any damaged equipment/materials, measure distances/heights, check CCTV footage. Preserve everything.",
      "evidence_required": true,
      "evidence_types": ["photo", "file"],
      "evidence_guidance": "Multiple photos of scene, damaged items, relevant measurements"
    },
    {
      "step_id": "interview_witnesses",
      "order": 3,
      "title": "Interview Witnesses",
      "instruction": "Interview separately within 24 hours while memory is fresh. For pupils: must have appropriate adult present, age-appropriate questions. Record statements, don''t lead witnesses. Note discrepancies between accounts.",
      "evidence_required": true,
      "evidence_types": ["file", "note"],
      "evidence_guidance": "Written witness statements (signed if staff/adult)"
    },
    {
      "step_id": "review_documentation",
      "order": 4,
      "title": "Review Existing Documentation",
      "instruction": "Check: previous risk assessments for this area/activity, maintenance records, inspection reports, training records for staff involved, any previous similar incidents.",
      "evidence_required": true,
      "evidence_types": ["file", "note"],
      "evidence_guidance": "Copies of relevant risk assessments, maintenance logs, training records"
    },
    {
      "step_id": "root_cause_analysis",
      "order": 5,
      "title": "Root Cause Analysis",
      "instruction": "Use the 5 Whys technique or bow-tie analysis. Identify: (1) Immediate cause (what happened) (2) Underlying cause (why it happened) (3) Root cause (systemic failure). Categories: equipment failure, inadequate training, poor supervision, environmental conditions, human error, procedural gap.",
      "evidence_required": true,
      "evidence_types": ["note"],
      "evidence_guidance": "Documented root cause analysis with evidence trail"
    },
    {
      "step_id": "corrective_actions",
      "order": 6,
      "title": "Define Corrective Actions",
      "instruction": "For each root cause, define specific corrective actions with: description, assigned owner, deadline, expected outcome. Use hierarchy of controls: eliminate → substitute → engineering → admin → PPE.",
      "evidence_required": true,
      "evidence_types": ["note"],
      "evidence_guidance": "Action plan with owners and deadlines",
      "linked_module": "incidents",
      "ai_assist": true
    },
    {
      "step_id": "update_risk_assessment",
      "order": 7,
      "title": "Update Risk Assessment",
      "instruction": "Review and update the relevant risk assessment to reflect lessons learned. If no risk assessment exists for this activity/area, create one. Update risk register score if applicable.",
      "evidence_required": true,
      "evidence_types": ["file"],
      "evidence_guidance": "Updated risk assessment document",
      "linked_module": "risk_register"
    },
    {
      "step_id": "write_report",
      "order": 8,
      "title": "Write Investigation Report",
      "instruction": "Compile investigation findings into formal report: summary, timeline, evidence, root cause, corrective actions, recommendations. Submit to headteacher for review.",
      "evidence_required": true,
      "evidence_types": ["file"],
      "evidence_guidance": "Completed investigation report (PDF)"
    },
    {
      "step_id": "close_investigation",
      "order": 9,
      "title": "Close Investigation",
      "instruction": "Headteacher reviews and signs off investigation. Confirm: all corrective actions logged and assigned, risk assessments updated, staff briefed on changes, incident record updated with investigation findings.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Headteacher sign-off confirmation"
    }
  ]'::jsonb,
  120,
  'headteacher',
  true
),

-- Near-Miss Recording & Escalation SOP
(
  'near_miss_recording',
  'Near-Miss Recording & Escalation',
  'Quick-capture process for near-miss incidents to maintain safety culture and prevent future accidents.',
  'h_and_s',
  'ad_hoc',
  '[
    {
      "step_id": "quick_capture",
      "order": 1,
      "title": "Quick Capture",
      "instruction": "Record: What nearly happened? Where? When? Who was in the area? What prevented it from being worse? Take a photo if the hazard is still visible.",
      "evidence_required": true,
      "evidence_types": ["photo", "note"],
      "evidence_guidance": "Photo of hazard/location and brief description"
    },
    {
      "step_id": "immediate_mitigation",
      "order": 2,
      "title": "Immediate Mitigation",
      "instruction": "Can the hazard be removed or made safe right now? If yes, do it. If not, restrict access to the area. Log a helpdesk ticket if maintenance is needed.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "What immediate action was taken"
    },
    {
      "step_id": "assess_severity",
      "order": 3,
      "title": "Assess Potential Severity",
      "instruction": "Ask: If this HAD resulted in an injury, how bad could it have been? Minor (first aid only), Moderate (hospital visit), Major (fracture/hospitalisation), Critical (life-threatening). This determines follow-up urgency.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record assessed potential severity and reasoning"
    },
    {
      "step_id": "escalation_check",
      "order": 4,
      "title": "Escalation Decision",
      "instruction": "If potential severity was Major or Critical: notify headteacher immediately, create risk register entry, schedule full investigation. If Moderate: notify site manager, review within 48 hours. If Minor: log and review at next H&S committee.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record escalation decision and who was notified"
    },
    {
      "step_id": "trend_check",
      "order": 5,
      "title": "Check for Patterns",
      "instruction": "Review: Has this type of near-miss happened before? Same location? Same equipment? If this is the 2nd+ occurrence, escalate to investigation regardless of severity.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Reference any previous similar incidents",
      "ai_assist": true,
      "linked_module": "intelligence"
    }
  ]'::jsonb,
  15,
  'caretaker',
  true
),

-- Workplace Violence Response SOP (for schools - pupil on staff, parent aggression, etc.)
(
  'violence_response',
  'Workplace Violence Response',
  'Response protocol for violence/aggression incidents involving staff, covering pupil behaviour escalation and adult aggression.',
  'h_and_s',
  'ad_hoc',
  '[
    {
      "step_id": "immediate_safety",
      "order": 1,
      "title": "Ensure Immediate Safety",
      "instruction": "Remove the injured person from the situation. If pupil: request Team Teach trained staff to manage. If adult aggressor: call police if needed (999). Never restrain unless Positive Handling trained and child at risk of harm.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record who intervened and what de-escalation was used"
    },
    {
      "step_id": "medical_attention",
      "order": 2,
      "title": "Medical Attention",
      "instruction": "Administer first aid. Document all injuries with body map if possible. If staff member: they may need time off — this counts toward the >7-day RIDDOR trigger for workers.",
      "evidence_required": true,
      "evidence_types": ["photo", "note"],
      "evidence_guidance": "Photos of injuries (with consent), body map documentation"
    },
    {
      "step_id": "safeguarding_check",
      "order": 3,
      "title": "Safeguarding Assessment",
      "instruction": "If perpetrator is a pupil: is this behaviour consistent with safeguarding concerns? Discuss with DSL. Check CPOMS for patterns. If adult: record on safeguarding system if child was at risk.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "DSL consultation outcome",
      "linked_module": "safeguarding"
    },
    {
      "step_id": "support_staff",
      "order": 4,
      "title": "Staff Wellbeing Support",
      "instruction": "Check on injured staff member. Offer: time out of class, counselling referral (EAP), union rep contact. They have the right to press charges — support this if requested but don''t discourage.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record support offered and staff response"
    },
    {
      "step_id": "formal_recording",
      "order": 5,
      "title": "Formal Recording",
      "instruction": "Complete incident form with full details. Record in both H&S incident log AND behaviour system if pupil. For adult aggressor: record in safeguarding system and consider banning from premises.",
      "evidence_required": true,
      "evidence_types": ["file"],
      "evidence_guidance": "Completed incident form",
      "linked_module": "incidents"
    },
    {
      "step_id": "review_plan",
      "order": 6,
      "title": "Review Behaviour/Risk Plan",
      "instruction": "If pupil: review and update positive handling plan, risk assessment, EHCP provision if applicable. If repeat: consider managed move or alternative provision. If adult: review visitor policy, consider barring.",
      "evidence_required": true,
      "evidence_types": ["file", "note"],
      "evidence_guidance": "Updated behaviour plan or risk assessment"
    }
  ]'::jsonb,
  30,
  'headteacher',
  true
),

-- Dangerous Occurrence Response SOP
(
  'dangerous_occurrence',
  'Dangerous Occurrence Response',
  'Response protocol for dangerous occurrences (gas leaks, structural issues, electrical faults, substance release). These are ALWAYS RIDDOR reportable.',
  'h_and_s',
  'ad_hoc',
  '[
    {
      "step_id": "evacuate_if_needed",
      "order": 1,
      "title": "Evacuate if Necessary",
      "instruction": "Gas leak/fire/structural: evacuate immediately using fire evacuation procedure. Electrical: isolate circuit if safe. Chemical: evacuate area, check COSHH data sheet. Account for all pupils and staff.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record evacuation time and headcount"
    },
    {
      "step_id": "emergency_services",
      "order": 2,
      "title": "Contact Emergency Services",
      "instruction": "Gas: National Grid 0800 111 999. Fire: 999. Structural: if immediate danger 999, otherwise LA emergency team. Electrical: isolate and call qualified electrician. Chemical: if toxic exposure 999 + Poison Centre 0344 892 0111.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record service called, time, reference number"
    },
    {
      "step_id": "secure_and_document",
      "order": 3,
      "title": "Secure Area & Document",
      "instruction": "Cordon off affected area. DO NOT re-enter until declared safe by qualified person. Photograph from safe distance. Note any damage or changes to structure/equipment.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photos of affected area from safe distance"
    },
    {
      "step_id": "riddor_notification",
      "order": 4,
      "title": "Immediate RIDDOR Notification",
      "instruction": "ALL dangerous occurrences are RIDDOR reportable. Call HSE immediately: 0345 300 9923. Then file online F2508 within 10 working days. This is a LEGAL REQUIREMENT.",
      "evidence_required": true,
      "evidence_types": ["note"],
      "evidence_guidance": "HSE notification reference number and time of call"
    },
    {
      "step_id": "communication",
      "order": 5,
      "title": "Communications",
      "instruction": "Notify: parents (if school affected), governors, LA/trust, insurance provider. Do NOT speculate about cause in communications. Factual statement only: what happened, what''s being done, when school will reopen.",
      "evidence_required": false,
      "evidence_types": ["note", "file"],
      "evidence_guidance": "Copy of any communications sent"
    },
    {
      "step_id": "remediation",
      "order": 6,
      "title": "Remediation & Sign-Off",
      "instruction": "Qualified contractor must repair. Obtain written confirmation area is safe to reoccupy. Headteacher must sign off before pupils return to area. Update asset register with work done.",
      "evidence_required": true,
      "evidence_types": ["file"],
      "evidence_guidance": "Contractor safety certificate or written confirmation"
    }
  ]'::jsonb,
  60,
  'headteacher',
  true
),

-- Twice-Daily Safety Check (for active incidents with cordoned areas)
(
  'active_incident_check',
  'Active Incident Area Safety Check',
  'Recurring twice-daily check for areas with active safety incidents (cordoned equipment, restricted areas). Non-completion auto-escalates risk score.',
  'h_and_s',
  'daily',
  '[
    {
      "step_id": "verify_cordon",
      "order": 1,
      "title": "Verify Barriers/Cordon",
      "instruction": "Check all barriers, tape, and signage are still in place and haven''t been moved or damaged. Take photo as proof of check.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photo showing cordon intact with timestamp visible"
    },
    {
      "step_id": "check_area",
      "order": 2,
      "title": "Inspect Restricted Area",
      "instruction": "Visual inspection from outside the cordon: has the situation changed? Any new damage, movement, or deterioration? Any signs of unauthorised access?",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Note any changes since last check"
    },
    {
      "step_id": "sign_off",
      "order": 3,
      "title": "Sign Off Check",
      "instruction": "Record: check completed, time, any issues noted. If issues found: notify headteacher and update risk register immediately.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Time and signature of person completing check"
    }
  ]'::jsonb,
  10,
  'caretaker',
  true
)
ON CONFLICT (template_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  frequency = EXCLUDED.frequency,
  steps = EXCLUDED.steps,
  estimated_time_minutes = EXCLUDED.estimated_time_minutes,
  owner_role = EXCLUDED.owner_role,
  updated_at = NOW();

-- Update existing incident_response to h_and_s category
UPDATE public.sop_templates SET category = 'h_and_s' WHERE template_id = 'incident_response';
