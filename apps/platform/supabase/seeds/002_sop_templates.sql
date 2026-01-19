-- ============================================================
-- SOP TEMPLATES
-- ============================================================

INSERT INTO public.sop_templates (template_id, name, description, category, frequency, steps, estimated_time_minutes, owner_role, is_active)
VALUES
(
  'fire_door_check',
  'Fire Door Monthly Check',
  'Monthly inspection of all fire doors for compliance with fire safety regulations',
  'estates',
  'monthly',
  '[
    {
      "step_id": "preparation",
      "order": 1,
      "title": "Preparation",
      "instruction": "Gather clipboard, camera/phone, and fire door schedule. Ensure you have access keys to all areas.",
      "evidence_required": false,
      "evidence_types": [],
      "evidence_guidance": ""
    },
    {
      "step_id": "main_entrance",
      "order": 2,
      "title": "Main Entrance Fire Door",
      "instruction": "Check: door closes fully under its own weight, intumescent strips intact and not painted over, smoke seals present and undamaged, signage visible and correct, no obstructions or wedges.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Take photo showing full door including seal, signage, and closure mechanism"
    },
    {
      "step_id": "hall_fire_door",
      "order": 3,
      "title": "Hall Fire Door",
      "instruction": "Check: door closes fully under its own weight, intumescent strips intact, smoke seals present, signage visible, no obstructions. Test hold-open device if fitted.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photo of door showing seal condition and any hold-open device"
    },
    {
      "step_id": "kitchen_fire_door",
      "order": 4,
      "title": "Kitchen Fire Door",
      "instruction": "Check: door closes fully, seals intact (critical for kitchen due to fire risk), self-closer working, no propping with bins/trolleys.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photo of kitchen fire door and closer mechanism"
    },
    {
      "step_id": "corridor_doors",
      "order": 5,
      "title": "Corridor Fire Doors",
      "instruction": "Walk all corridors. Check each fire door set: closing mechanism works, seals intact, glazing undamaged, signage visible, no propping.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Take photos of each corridor fire door or representative sample"
    },
    {
      "step_id": "log_issues",
      "order": 6,
      "title": "Log Any Issues Found",
      "instruction": "Record any doors requiring maintenance: note location, issue type (seal/closer/damage), and priority (urgent/routine).",
      "evidence_required": false,
      "evidence_types": ["photo", "note"],
      "evidence_guidance": "Photo and description of any defects found"
    },
    {
      "step_id": "completion",
      "order": 7,
      "title": "Completion",
      "instruction": "Confirm all fire doors checked. Record completion in premises log book. Report urgent issues to SBM immediately.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": ""
    }
  ]'::jsonb,
  30,
  'caretaker'
),
(
  'website_compliance',
  'Website Statutory Compliance Audit',
  'Termly audit of school website against DfE statutory publication requirements',
  'compliance',
  'termly',
  '[
    {
      "step_id": "contact_info",
      "order": 1,
      "title": "Contact Information",
      "instruction": "Verify: school name, postal address, telephone number, and email address are displayed and correct.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot of contact page or footer showing all contact details"
    },
    {
      "step_id": "governance_info",
      "order": 2,
      "title": "Governance Information",
      "instruction": "Check: headteacher name, chair of governors name, full list of governors with categories, governance structure details.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot of governance/about us page"
    },
    {
      "step_id": "admissions",
      "order": 3,
      "title": "Admissions Information",
      "instruction": "Verify: current admissions policy published, PAN stated, application process clear, catchment/oversubscription criteria if applicable.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot of admissions page showing policy link and key information"
    },
    {
      "step_id": "ofsted_reports",
      "order": 4,
      "title": "Ofsted Reports",
      "instruction": "Check: link to most recent Ofsted report works, any post-inspection letters published if applicable.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot showing Ofsted report link"
    },
    {
      "step_id": "performance_data",
      "order": 5,
      "title": "Performance Data",
      "instruction": "Verify: latest KS2 results (primary) or Progress 8/Attainment 8 (secondary), link to DfE school performance tables.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot of results/performance page"
    },
    {
      "step_id": "curriculum",
      "order": 6,
      "title": "Curriculum Information",
      "instruction": "Check: curriculum intent statement, subject content by year group, how to find out more. Primary: PE & sport premium report.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot of curriculum page overview"
    },
    {
      "step_id": "pupil_premium",
      "order": 7,
      "title": "Pupil Premium Strategy",
      "instruction": "Verify: pupil premium strategy statement published, includes objectives, how money spent, impact measurement. Must be dated current academic year.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot showing PP strategy with date visible"
    },
    {
      "step_id": "send_report",
      "order": 8,
      "title": "SEND Information Report",
      "instruction": "Check: SEND information report/local offer published, reviewed within last 12 months, contains required content.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot of SEND report showing review date"
    },
    {
      "step_id": "statutory_policies",
      "order": 9,
      "title": "Statutory Policies",
      "instruction": "Verify these policies published: Behaviour, Safeguarding/Child Protection, Complaints procedure, SEND policy, Accessibility plan.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot of policies page showing required policies listed"
    },
    {
      "step_id": "charging_policy",
      "order": 10,
      "title": "Charging & Remissions",
      "instruction": "Check: charging and remissions policy is published and accessible.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot showing charging policy"
    },
    {
      "step_id": "equality_info",
      "order": 11,
      "title": "Equality Information",
      "instruction": "Verify: equality objectives published (updated every 4 years), accessibility plan available.",
      "evidence_required": true,
      "evidence_types": ["screenshot"],
      "evidence_guidance": "Screenshot of equality information page"
    },
    {
      "step_id": "summary_actions",
      "order": 12,
      "title": "Summary & Actions",
      "instruction": "Review all findings. List any missing, outdated, or non-compliant items. Assign actions with deadlines.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record list of compliance gaps and actions needed"
    }
  ]'::jsonb,
  45,
  'sbm'
),
(
  'premises_monthly',
  'Monthly Premises & Safety Check',
  'General monthly inspection of premises, safety equipment, and facilities',
  'estates',
  'monthly',
  '[
    {
      "step_id": "external_areas",
      "order": 1,
      "title": "External Areas",
      "instruction": "Walk perimeter: check boundary fencing secure, gates close and lock properly, playground surface safe, car park markings visible, external lighting working.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photos of any issues found or general condition shots"
    },
    {
      "step_id": "entrances",
      "order": 2,
      "title": "Main Entrances & Security",
      "instruction": "Check: entry system/buzzer working, safeguarding signage visible, reception area secure, visitor sign-in system available.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photo of entrance showing security features"
    },
    {
      "step_id": "fire_equipment",
      "order": 3,
      "title": "Fire Safety Equipment",
      "instruction": "Visual check: all extinguishers in place and in service date, break glass points unobstructed, fire blankets accessible in kitchen.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photos showing fire equipment locations and service dates"
    },
    {
      "step_id": "emergency_lighting",
      "order": 4,
      "title": "Emergency Lighting",
      "instruction": "Check all emergency lighting units show green indicator light and are undamaged.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photos of emergency light indicators"
    },
    {
      "step_id": "first_aid",
      "order": 5,
      "title": "First Aid Stations",
      "instruction": "Check: first aid boxes stocked and sealed, contents in date, AED charged if applicable, eyewash stations in date.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photos of first aid box contents and AED display"
    },
    {
      "step_id": "toilets_hygiene",
      "order": 6,
      "title": "Toilets & Hygiene Facilities",
      "instruction": "Check all toilet areas: flushing, soap dispensers filled, hand drying available, sanitary bins not overflowing, general cleanliness.",
      "evidence_required": false,
      "evidence_types": ["photo", "note"],
      "evidence_guidance": "Only photo if issues found"
    },
    {
      "step_id": "heating_ventilation",
      "order": 7,
      "title": "Heating & Ventilation",
      "instruction": "Check heating operational in all areas, thermostats accessible, windows open/close properly, ventilation adequate.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Note any temperature issues or thermostat readings"
    },
    {
      "step_id": "issues_log",
      "order": 8,
      "title": "Issues Log & Reporting",
      "instruction": "Record all issues found with location, description, and priority (urgent/routine/monitor). Report urgent items to SBM.",
      "evidence_required": false,
      "evidence_types": ["photo", "note"],
      "evidence_guidance": "Photos and notes of all issues for maintenance log"
    }
  ]'::jsonb,
  45,
  'caretaker'
),
(
  'incident_response',
  'Incident Response & Recording',
  'Ad-hoc checklist for responding to and documenting incidents/accidents',
  'safeguarding',
  'ad_hoc',
  '[
    {
      "step_id": "immediate_response",
      "order": 1,
      "title": "Immediate Response",
      "instruction": "Ensure area is safe for yourself and others. Administer first aid if trained and needed. Call emergency services (999) if serious injury or danger.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record time and immediate actions taken"
    },
    {
      "step_id": "secure_scene",
      "order": 2,
      "title": "Secure the Scene",
      "instruction": "If needed, secure the area to prevent further incidents. Preserve any evidence. Do not clean up until fully documented.",
      "evidence_required": true,
      "evidence_types": ["photo"],
      "evidence_guidance": "Photos of scene before any cleanup or changes"
    },
    {
      "step_id": "witness_details",
      "order": 3,
      "title": "Gather Witness Details",
      "instruction": "Record names and roles of all witnesses. Do not formally interview children without appropriate adult present. Note what was seen/heard.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "List of witness names, roles, and brief notes"
    },
    {
      "step_id": "notifications",
      "order": 4,
      "title": "Required Notifications",
      "instruction": "Notify as required: Headteacher (always), Parents/carers (if pupil involved), HSE (if RIDDOR reportable), LA (if serious).",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record who was notified, when, and by what method"
    },
    {
      "step_id": "accident_form",
      "order": 5,
      "title": "Complete Accident Form",
      "instruction": "Complete school accident/incident form fully: date, time, location, persons involved, description, injuries, treatment given, witnesses.",
      "evidence_required": true,
      "evidence_types": ["file", "photo"],
      "evidence_guidance": "Upload completed accident form (scan or photo)"
    },
    {
      "step_id": "followup_actions",
      "order": 6,
      "title": "Follow-up Actions",
      "instruction": "Determine and record follow-up: repairs needed, risk assessment updates, staff briefing required, parent meeting, counselling support.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "List actions with assigned person and deadline"
    },
    {
      "step_id": "close_out",
      "order": 7,
      "title": "Close Out",
      "instruction": "Confirm all immediate actions complete. File documentation securely. Update risk register if needed. Schedule any review meetings.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Confirmation that incident properly closed and filed"
    }
  ]'::jsonb,
  20,
  'headteacher'
),
(
  'governor_pack_prep',
  'Governor Meeting Preparation',
  'Termly workflow for preparing and distributing governance pack',
  'governance',
  'termly',
  '[
    {
      "step_id": "confirm_meeting",
      "order": 1,
      "title": "Confirm Meeting Date",
      "instruction": "Confirm date, time, and venue for governors meeting. Check quorum will be met (contact governors for availability).",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record confirmed date and expected attendees"
    },
    {
      "step_id": "draft_agenda",
      "order": 2,
      "title": "Draft Agenda",
      "instruction": "Create meeting agenda including: apologies, declaration of interests, minutes approval, standing items, reports, policies for approval, AOB, next meeting date.",
      "evidence_required": true,
      "evidence_types": ["file"],
      "evidence_guidance": "Upload draft agenda document"
    },
    {
      "step_id": "request_ht_report",
      "order": 3,
      "title": "Request Headteacher Report",
      "instruction": "Send reminder to Headteacher for their report. Set deadline of 7 working days before meeting.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record date reminder sent and deadline given"
    },
    {
      "step_id": "prepare_finance",
      "order": 4,
      "title": "Prepare Finance Report",
      "instruction": "Generate or request budget monitoring report showing year-to-date spend, variances, and forecast outturn.",
      "evidence_required": true,
      "evidence_types": ["file"],
      "evidence_guidance": "Upload finance report or budget monitoring"
    },
    {
      "step_id": "identify_policies",
      "order": 5,
      "title": "Identify Policies for Review",
      "instruction": "Check policy review schedule. List all policies due for approval at this meeting. Ensure latest versions ready.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "List of policies requiring approval"
    },
    {
      "step_id": "collate_pack",
      "order": 6,
      "title": "Collate All Papers",
      "instruction": "Gather all papers: agenda, previous minutes, HT report, finance report, other reports, policies. Check nothing missing.",
      "evidence_required": true,
      "evidence_types": ["file"],
      "evidence_guidance": "Upload complete pack or confirm all documents ready"
    },
    {
      "step_id": "distribute",
      "order": 7,
      "title": "Distribute to Governors",
      "instruction": "Send complete pack to all governors at least 7 days before meeting. Use agreed method (email, portal, post).",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Record distribution date, method, and recipient list"
    },
    {
      "step_id": "final_confirmation",
      "order": 8,
      "title": "Final Confirmation",
      "instruction": "Confirm all governors have received and can access pack. Note any apologies or reading requests received.",
      "evidence_required": false,
      "evidence_types": ["note"],
      "evidence_guidance": "Final attendance/apologies confirmation"
    }
  ]'::jsonb,
  120,
  'sbm'
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
