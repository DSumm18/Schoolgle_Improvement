import type { SopCategory, SopFrequency, SopStep, SopTemplate } from "./sop-engine";

export type SopSourceRef = {
  title: string;
  publisher: string;
  url: string;
  authority: "legislation" | "statutory_guidance" | "regulator_guidance" | "sector_good_practice";
  lastChecked: string;
};

export type SopSetupQuestion = {
  id: string;
  question: string;
  why: string;
  fieldHint: string;
};

export type SopFlowStep = {
  label: string;
  detail: string;
};

export type SopDocumentResource = {
  title: string;
  type: "form" | "template" | "policy" | "guidance" | "register" | "system";
  description: string;
  action: string;
  locationHint: string;
};

export type BuiltInSopTemplate = SopTemplate & {
  source: "schoolgle_builtin" | "database";
  linked_policy_requirement_ids: string[];
  recommended_modules: string[];
  setup_questions: SopSetupQuestion[];
  source_refs: SopSourceRef[];
  visual_flow: SopFlowStep[];
  document_resources: SopDocumentResource[];
  ed_prompt: string;
};

const LAST_CHECKED = "2026-05-02";

const SOURCES = {
  hseLegionella: {
    title: "Legionnaires' disease: Technical guidance HSG274",
    publisher: "Health and Safety Executive",
    url: "https://www.hse.gov.uk/pubns/books/hsg274.htm",
    authority: "regulator_guidance",
    lastChecked: LAST_CHECKED,
  },
  hseRiddor: {
    title: "RIDDOR: when do I need to report an incident?",
    publisher: "Health and Safety Executive",
    url: "https://www.hse.gov.uk/riddor/when-do-i-report.htm",
    authority: "regulator_guidance",
    lastChecked: LAST_CHECKED,
  },
  hseFireEducation: {
    title: "Fire safety risk assessment: educational premises",
    publisher: "UK Government / Home Office",
    url: "https://www.gov.uk/government/publications/fire-safety-risk-assessment-educational-premises",
    authority: "regulator_guidance",
    lastChecked: LAST_CHECKED,
  },
  hseAsbestos: {
    title: "Managing asbestos in buildings",
    publisher: "Health and Safety Executive",
    url: "https://www.hse.gov.uk/asbestos/managing/index.htm",
    authority: "regulator_guidance",
    lastChecked: LAST_CHECKED,
  },
  kcsie: {
    title: "Keeping children safe in education",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/keeping-children-safe-in-education--2",
    authority: "statutory_guidance",
    lastChecked: LAST_CHECKED,
  },
  medicalConditions: {
    title: "Supporting pupils at school with medical conditions",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/supporting-pupils-at-school-with-medical-conditions--3",
    authority: "statutory_guidance",
    lastChecked: LAST_CHECKED,
  },
  icoBreach: {
    title: "Personal data breaches: a guide",
    publisher: "Information Commissioner's Office",
    url: "https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/personal-data-breaches-a-guide/",
    authority: "regulator_guidance",
    lastChecked: LAST_CHECKED,
  },
  complaints: {
    title: "Best practice guidance for school complaints procedures",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/school-complaints-procedures",
    authority: "sector_good_practice",
    lastChecked: LAST_CHECKED,
  },
  healthSafetyAct: {
    title: "Health and Safety at Work etc. Act 1974",
    publisher: "UK Government",
    url: "https://www.legislation.gov.uk/ukpga/1974/37/contents",
    authority: "legislation",
    lastChecked: LAST_CHECKED,
  },
  behaviourSchools: {
    title: "Behaviour in schools: advice for headteachers and school staff",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/behaviour-in-schools--2",
    authority: "statutory_guidance",
    lastChecked: LAST_CHECKED,
  },
  bullying: {
    title: "Preventing and tackling bullying",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/preventing-and-tackling-bullying",
    authority: "sector_good_practice",
    lastChecked: LAST_CHECKED,
  },
  attendance: {
    title: "Working together to improve school attendance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/working-together-to-improve-school-attendance",
    authority: "statutory_guidance",
    lastChecked: LAST_CHECKED,
  },
  sendCode: {
    title: "SEND code of practice: 0 to 25 years",
    publisher: "Department for Education / Department of Health",
    url: "https://www.gov.uk/government/publications/send-code-of-practice-0-to-25",
    authority: "statutory_guidance",
    lastChecked: LAST_CHECKED,
  },
  chargingActivities: {
    title: "Charging for school activities",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/charging-for-school-activities",
    authority: "statutory_guidance",
    lastChecked: LAST_CHECKED,
  },
  teachersPay: {
    title: "School teachers' pay and conditions",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/school-teachers-pay-and-conditions-2014",
    authority: "statutory_guidance",
    lastChecked: LAST_CHECKED,
  },
} satisfies Record<string, SopSourceRef>;

function step(
  stepId: string,
  order: number,
  title: string,
  instruction: string,
  evidenceRequired = false,
  evidenceTypes: string[] = ["note"],
  evidenceGuidance = "Record notes or evidence if relevant.",
  linkedModule?: string,
): SopStep {
  return {
    step_id: stepId,
    order,
    title,
    instruction,
    evidence_required: evidenceRequired,
    evidence_types: evidenceTypes,
    evidence_guidance: evidenceGuidance,
    linked_module: linkedModule,
    ai_assist:
      "Ask Ed to explain the step, draft a note, or show the approved school-specific wording once this SOP is approved.",
  };
}

function question(
  id: string,
  questionText: string,
  why: string,
  fieldHint: string,
): SopSetupQuestion {
  return { id, question: questionText, why, fieldHint };
}

function flow(label: string, detail: string): SopFlowStep {
  return { label, detail };
}

function resource(
  title: string,
  type: SopDocumentResource["type"],
  description: string,
  action: string,
  locationHint: string,
): SopDocumentResource {
  return { title, type, description, action, locationHint };
}

function template(input: {
  template_id: string;
  name: string;
  description: string;
  category: SopCategory;
  frequency: SopFrequency;
  estimated_time_minutes: number;
  owner_role: string;
  linkedPolicies: string[];
  modules: string[];
  setupQuestions: SopSetupQuestion[];
  sourceRefs: SopSourceRef[];
  visualFlow: SopFlowStep[];
  documentResources?: SopDocumentResource[];
  steps: SopStep[];
  edPrompt: string;
}): BuiltInSopTemplate {
  return {
    id: `builtin:${input.template_id}`,
    template_id: input.template_id,
    name: input.name,
    description: input.description,
    category: input.category,
    frequency: input.frequency,
    estimated_time_minutes: input.estimated_time_minutes,
    owner_role: input.owner_role,
    steps: input.steps,
    is_active: true,
    source: "schoolgle_builtin",
    linked_policy_requirement_ids: input.linkedPolicies,
    recommended_modules: input.modules,
    setup_questions: input.setupQuestions,
    source_refs: input.sourceRefs,
    visual_flow: input.visualFlow,
    document_resources: input.documentResources || [],
    ed_prompt: input.edPrompt,
  };
}

export const BUILT_IN_SOP_TEMPLATES: BuiltInSopTemplate[] = [
  template({
    template_id: "opening_school",
    name: "Opening School",
    description:
      "Daily opening routine for unlocking, first visual checks, alarms, hazards and readiness before pupils arrive.",
    category: "estates",
    frequency: "daily",
    estimated_time_minutes: 20,
    owner_role: "site manager",
    linkedPolicies: ["health-safety-policy", "child-protection-safeguarding"],
    modules: ["estates", "safeguarding", "tasks"],
    sourceRefs: [SOURCES.healthSafetyAct],
    setupQuestions: [
      question("opening_time", "What time is the site normally opened?", "Ed uses this for daily task timing and rota prompts.", "e.g. 06:30"),
      question("alarm_owner", "Who is allowed to unset the alarm and who is the fallback?", "This defines the safe escalation route if the opener is absent.", "Role/name, not just a person if possible"),
      question("hazard_route", "Where are opening hazards recorded?", "The SOP should create evidence in the right system.", "Estates helpdesk, site diary or Schoolgle tasks"),
    ],
    visualFlow: [
      flow("Unlock", "Enter through agreed entrance and unset alarms."),
      flow("Check", "Walk critical areas and identify hazards."),
      flow("Record", "Log defects, hazards or blocked access."),
      flow("Open", "Confirm the site is safe for staff and pupils."),
    ],
    steps: [
      step("enter_site", 1, "Enter site and unset alarm", "Use the agreed entrance, unset alarms and confirm no unexpected signs of entry or damage.", true, ["note"], "Record any alarm issue or security concern.", "estates"),
      step("external_check", 2, "Complete external safety check", "Check gates, paths, playgrounds, car park, bins, external doors and obvious hazards before pupil arrival.", true, ["photo", "note"], "Photograph hazards and create a linked estates task."),
      step("internal_check", 3, "Complete internal readiness check", "Check heating, lighting, toilets, corridors, halls and known risk areas. Escalate anything that affects safe opening.", false),
      step("handover", 4, "Confirm school is ready to open", "Tell office/SLT the site is open or explain any restriction, action or area closure.", true, ["note"], "Record readiness note and any restrictions."),
    ],
    edPrompt:
      "Interview the school about opening times, alarm ownership, hazard recording and escalation routes. Produce a daily opening SOP and recurring task schedule.",
  }),
  template({
    template_id: "closing_school",
    name: "Closing School",
    description:
      "Daily locking routine covering building sweep, visitors/contractors, fire doors, windows, alarms and handover.",
    category: "estates",
    frequency: "daily",
    estimated_time_minutes: 25,
    owner_role: "site manager",
    linkedPolicies: ["health-safety-policy", "child-protection-safeguarding"],
    modules: ["estates", "safeguarding", "tasks"],
    sourceRefs: [SOURCES.healthSafetyAct],
    setupQuestions: [
      question("closing_time", "What time should the site be fully closed on normal days?", "This sets task timing and out-of-hours exceptions.", "e.g. 18:00"),
      question("lettings", "Are lettings, clubs or contractors ever on site after normal closing?", "The SOP needs a different lock-up branch when others remain on site.", "Yes/no plus owner"),
      question("keyholding", "Who are the keyholders and emergency contacts?", "Ed needs approved escalation contacts, not guesses.", "Role/name/contact source"),
    ],
    visualFlow: [
      flow("Sweep", "Check people, rooms and activities."),
      flow("Secure", "Close windows, doors and restricted areas."),
      flow("Set", "Set alarms and confirm keyholder status."),
      flow("Escalate", "Report anything preventing full closure."),
    ],
    steps: [
      step("people_sweep", 1, "Confirm everyone has left or is authorised", "Check clubs, lettings, contractors, visitors and vulnerable areas before lock-up.", true, ["note"], "Record exceptions and named responsible adult."),
      step("building_secure", 2, "Secure internal and external areas", "Check doors, windows, fire doors, toilets, halls, plant rooms and external gates.", true, ["note", "photo"], "Record any area that could not be secured."),
      step("systems_off", 3, "Check services and alarms", "Confirm agreed lights, appliances, heating controls and alarms are set according to local routine.", false),
      step("final_handover", 4, "Complete closing handover", "Record that the school is closed, or escalate to the keyholder/headteacher if it cannot be fully secured.", true, ["note"], "Closing confirmation or escalation note."),
    ],
    edPrompt:
      "Ask about closing times, lettings, keyholders, alarm routes and exceptions. Produce a branch-aware closing SOP.",
  }),
  template({
    template_id: "legionella_monitoring",
    name: "Legionella Monitoring",
    description:
      "Routine water hygiene monitoring aligned to the school's risk assessment, including sentinel temperatures, flushing and escalation.",
    category: "estates",
    frequency: "weekly",
    estimated_time_minutes: 35,
    owner_role: "site manager",
    linkedPolicies: ["health-safety-policy"],
    modules: ["estates", "compliance", "tasks", "evidence"],
    sourceRefs: [SOURCES.hseLegionella, SOURCES.healthSafetyAct],
    setupQuestions: [
      question("risk_assessment", "Where is the current legionella risk assessment stored?", "The SOP must follow the actual risk assessment, not generic checks.", "Drive path, contractor portal or Schoolgle evidence"),
      question("sentinel_points", "Which outlets are sentinel points and who checks them?", "Monitoring tasks need named locations.", "List hot/cold outlet locations"),
      question("contractor", "Who is the water hygiene contractor and what do they do?", "The SOP should separate internal checks from contractor checks.", "Contractor name, visit frequency, report location"),
      question("temperature_thresholds", "What thresholds trigger escalation in your risk assessment?", "Ed must not invent thresholds where a risk assessment says otherwise.", "Hot/cold thresholds from risk assessment"),
    ],
    visualFlow: [
      flow("Plan", "Use risk assessment and outlet list."),
      flow("Test", "Record temperatures or flushing evidence."),
      flow("Escalate", "Flag out-of-range readings."),
      flow("Evidence", "Store readings and contractor reports."),
    ],
    steps: [
      step("check_scope", 1, "Check monitoring scope", "Open the current legionella risk assessment and confirm today's outlets/tasks.", true, ["file", "note"], "Link the current risk assessment or outlet schedule.", "estates"),
      step("complete_checks", 2, "Complete outlet checks", "Take temperatures, flush little-used outlets or complete checks exactly as listed in the risk assessment.", true, ["photo", "note"], "Record readings, locations and time."),
      step("review_exceptions", 3, "Review exceptions", "Identify out-of-range readings, missed outlets, access issues or signs of system change.", true, ["note"], "Record exceptions and immediate action."),
      step("raise_actions", 4, "Create corrective actions", "Create tasks for retests, contractor call-out, access issues or risk assessment updates.", false, ["note"], "Link task IDs where created.", "tasks"),
      step("file_evidence", 5, "File evidence", "Store readings and contractor reports in the evidence vault/estates compliance record.", true, ["file"], "Attach readings sheet or photo evidence.", "evidence"),
    ],
    edPrompt:
      "Ask for the water risk assessment, sentinel points, contractor role and escalation thresholds. Produce the school-specific legionella SOP and recurring tasks.",
  }),
  template({
    template_id: "weekly_fire_safety_check",
    name: "Weekly Fire Safety Check",
    description:
      "Weekly check of fire alarm test, escape routes, fire doors, call points, extinguishers and action recording.",
    category: "estates",
    frequency: "weekly",
    estimated_time_minutes: 30,
    owner_role: "site manager",
    linkedPolicies: ["health-safety-policy"],
    modules: ["estates", "compliance", "tasks", "evidence"],
    sourceRefs: [SOURCES.hseFireEducation, SOURCES.healthSafetyAct],
    setupQuestions: [
      question("fire_log", "Where is the fire logbook or digital record kept?", "Evidence needs to be stored in the right place.", "Location/system"),
      question("test_day", "When is the weekly alarm test normally completed?", "This creates recurrence and avoids disruption.", "Day/time"),
      question("responsible_person", "Who is the responsible person/fire safety lead?", "The SOP needs the correct escalation owner.", "Role/name"),
    ],
    visualFlow: [
      flow("Test", "Complete alarm/call point test."),
      flow("Inspect", "Check routes, doors and equipment."),
      flow("Record", "Update fire log."),
      flow("Fix", "Raise urgent defects."),
    ],
    steps: [
      step("alarm_test", 1, "Complete weekly alarm test", "Test the agreed call point and confirm alarm audibility/monitoring response as applicable.", true, ["note"], "Record call point, time and result."),
      step("escape_routes", 2, "Check escape routes and fire doors", "Check routes are clear, final exits open, fire doors close and signage is visible.", true, ["photo", "note"], "Photograph defects or blocked routes."),
      step("equipment_visual", 3, "Visual check fire equipment", "Check extinguishers/call points/emergency lighting indicators for obvious issues within the local checklist.", false),
      step("raise_defects", 4, "Record defects and urgent actions", "Raise tasks for blocked exits, faulty equipment, door defects or missing signage.", true, ["note"], "Link task/evidence record.", "tasks"),
    ],
    edPrompt:
      "Ask for fire log location, weekly test timing, responsible person and contractor arrangements. Produce a weekly fire safety SOP.",
  }),
  template({
    template_id: "pupil_accident_response",
    name: "Pupil Accident Response",
    description:
      "Immediate response, first aid, parent contact, recording and escalation after a pupil accident.",
    category: "h_and_s",
    frequency: "ad_hoc",
    estimated_time_minutes: 20,
    owner_role: "first aider",
    linkedPolicies: ["health-safety-policy", "supporting-pupils-medical-conditions", "child-protection-safeguarding"],
    modules: ["incidents", "safeguarding", "tasks"],
    sourceRefs: [SOURCES.hseRiddor, SOURCES.medicalConditions, SOURCES.kcsie],
    setupQuestions: [
      question("first_aid_location", "Where are first aid supplies and accident forms kept?", "Staff need fast, local instructions.", "Room/system"),
      question("parent_contact", "Who contacts parents and how is this logged?", "The SOP needs a clear communication owner.", "Office/first aider/class teacher"),
      question("hospital_route", "What is the escalation route if hospital treatment is needed?", "This affects safeguarding, RIDDOR triage and parent communication.", "Call sequence and transport rules"),
    ],
    visualFlow: [
      flow("Make safe", "Protect pupil and scene."),
      flow("Treat", "First aid and emergency services if needed."),
      flow("Tell", "Parents/SLT/DSL where required."),
      flow("Record", "Accident record and follow-up tasks."),
    ],
    documentResources: [
      resource(
        "Pupil Accident Report Form",
        "form",
        "The main record of the accident, injury, treatment, witnesses and follow-up action.",
        "Complete before the end of the school day and submit to the office or Schoolgle incident record.",
        "Policies / Health and Safety / Forms / Accident report form",
      ),
      resource(
        "Body Map / Injury Diagram",
        "form",
        "Used where the location of injury needs to be recorded clearly and objectively.",
        "Attach to the accident form when bruising, head injury, multiple injuries or safeguarding context is relevant.",
        "Policies / Health and Safety / Forms / Body map",
      ),
      resource(
        "Witness Statement Template",
        "template",
        "Captures factual accounts from staff or pupils who saw the incident.",
        "Use for significant accidents, disputed accounts, supervision concerns or where an investigation is required.",
        "Policies / Health and Safety / Forms / Witness statement",
      ),
      resource(
        "Parent/Carer Notification Template",
        "template",
        "Standard wording for confirming what happened, treatment given and any follow-up advice.",
        "Use when parents are contacted by phone, email or collection note and record the contact method.",
        "Documents / Communications / Accident notification",
      ),
      resource(
        "RIDDOR Decision Guide",
        "guidance",
        "School-facing guide for checking whether the accident may be reportable to HSE.",
        "Use after immediate response where the injury, absence, hospital treatment or incident type may meet reporting criteria.",
        "Policies / Health and Safety / Guidance / RIDDOR triage",
      ),
      resource(
        "Accident Investigation Form",
        "form",
        "Structured follow-up record for root cause, actions, owners and completion evidence.",
        "Start when the accident is serious, repeated, linked to premises/equipment, or raises supervision concerns.",
        "Policies / Health and Safety / Forms / Accident investigation",
      ),
    ],
    steps: [
      step("make_safe", 1, "Make pupil and area safe", "Stop the activity if needed. Protect the pupil, call a first aider, remove immediate danger if safe to do so, and preserve the scene if the accident may need investigation.", false),
      step("first_aid", 2, "Provide first aid and decide escalation", "Give first aid within competence. Call emergency services immediately if there is serious injury, breathing difficulty, loss of consciousness, suspected fracture, seizure, severe bleeding, head injury concern or any other urgent risk. Follow the pupil's medical plan where one exists.", true, ["note"], "Record treatment, first aider, time and escalation decision."),
      step("notify", 3, "Notify parent/carer and relevant leaders", "Notify parent/carer according to injury severity and school arrangements. Notify SLT and DSL where there is safeguarding context, supervision concern, repeated incident, serious injury, hospital treatment or uncertainty.", true, ["note"], "Record who was told, when, by whom and what advice was given."),
      step("record", 4, "Complete accident report form", "Complete the accident report form with date, time, location, activity, factual description, injury, first aid given, witnesses, parent contact, and immediate controls. Attach a body map or witness statement if required.", true, ["file", "note"], "Attach accident form, body map, witness statement or incident ID.", "incidents"),
      step("riddor_triage", 5, "Check RIDDOR, investigation and safeguarding triggers", "Use the RIDDOR decision guide and school thresholds to decide whether HSE reporting, formal investigation, premises action, behaviour/SEND review or safeguarding follow-up is needed. Record the decision even when no report is required.", true, ["note"], "Record reportable/not reportable decision, investigation need and next owner.", "tasks"),
    ],
    edPrompt:
      "Ask about first aid locations, parent contact, accident system, hospital escalation and RIDDOR decision ownership.",
  }),
  template({
    template_id: "staff_accident_riddor_triage",
    name: "Staff Accident and RIDDOR Triage",
    description:
      "Staff accident recording, immediate support, RIDDOR triage, investigation and absence follow-up.",
    category: "h_and_s",
    frequency: "ad_hoc",
    estimated_time_minutes: 30,
    owner_role: "headteacher",
    linkedPolicies: ["health-safety-policy", "staff-discipline-conduct"],
    modules: ["incidents", "hr", "tasks"],
    sourceRefs: [SOURCES.hseRiddor, SOURCES.healthSafetyAct],
    setupQuestions: [
      question("riddor_owner", "Who decides and submits RIDDOR reports?", "Ed needs the approved responsible person.", "Role/name"),
      question("absence_link", "How does accident follow-up link to HR absence?", "The SOP should trigger HR support where relevant.", "HR system/process"),
      question("investigation_threshold", "What incidents require formal investigation?", "This controls automatic SOP/task triggers.", "Severity/absence/near miss threshold"),
    ],
    visualFlow: [
      flow("Support", "Immediate first aid/welfare."),
      flow("Record", "Accident details and witnesses."),
      flow("Assess", "RIDDOR and investigation need."),
      flow("Follow up", "Actions, HR and prevention."),
    ],
    steps: [
      step("support_staff", 1, "Support injured staff member", "Provide first aid, emergency response and welfare support. Protect the scene if investigation may be needed.", true, ["note"], "Record immediate support and condition."),
      step("record_accident", 2, "Record accident facts", "Record date, time, location, activity, witnesses, injury and immediate cause.", true, ["file", "note"], "Attach accident report.", "incidents"),
      step("riddor_check", 3, "Complete RIDDOR triage", "Check specified injury, over-seven-day absence, dangerous occurrence or occupational disease criteria.", true, ["note"], "Record reportable/not reportable decision and reason."),
      step("trigger_followup", 4, "Trigger investigation and HR follow-up", "Start investigation and HR absence/support process if thresholds are met.", false, ["note"], "Link investigation/HR task IDs.", "tasks"),
    ],
    edPrompt:
      "Ask about RIDDOR owner, HR absence link, investigation thresholds and accident recording system.",
  }),
  template({
    template_id: "contractor_site_induction",
    name: "Contractor Site Induction",
    description:
      "Site induction for contractors covering safeguarding, signing in, permits, hazards, asbestos and fire arrangements.",
    category: "estates",
    frequency: "ad_hoc",
    estimated_time_minutes: 20,
    owner_role: "site manager",
    linkedPolicies: ["health-safety-policy", "child-protection-safeguarding"],
    modules: ["estates", "safeguarding", "contractors"],
    sourceRefs: [SOURCES.healthSafetyAct, SOURCES.kcsie, SOURCES.hseAsbestos],
    setupQuestions: [
      question("sign_in", "Where do contractors sign in and receive ID?", "Safeguarding/site control starts at entry.", "Reception/system"),
      question("permit_work", "Which works require permit-to-work approval?", "Hot works, roof works, intrusive works and isolation need explicit control.", "List permit types"),
      question("asbestos_register", "Where is the asbestos register and who shares it?", "Contractors must not disturb unknown materials.", "Location/owner"),
    ],
    visualFlow: [
      flow("Sign in", "Identity, DBS/supervision and visitor badge."),
      flow("Brief", "Safeguarding, fire, hazards and welfare."),
      flow("Permit", "Confirm RAMS/permits/asbestos before work."),
      flow("Sign out", "Check work area and close permit."),
    ],
    steps: [
      step("identity", 1, "Check identity and sign-in", "Confirm contractor identity, company, visitor badge, supervision level and safeguarding expectations.", true, ["note"], "Record contractor names and supervising contact."),
      step("briefing", 2, "Complete site briefing", "Explain fire alarm, evacuation, welfare, restricted areas, pupil safeguarding and emergency contacts.", false),
      step("work_controls", 3, "Confirm RAMS, permits and asbestos controls", "Check RAMS, permits, isolation, asbestos register and work boundaries before work starts.", true, ["file", "note"], "Attach RAMS/permit or record register check.", "estates"),
      step("close_out", 4, "Close out work and sign out", "Check area is safe, waste removed, services restored, permit closed and contractor signed out.", true, ["note", "photo"], "Record completion and defects."),
    ],
    edPrompt:
      "Ask about sign-in system, supervision, permit types, asbestos register and contractor evidence storage.",
  }),
  template({
    template_id: "asbestos_disturbance_response",
    name: "Suspected Asbestos Disturbance Response",
    description:
      "Emergency response when asbestos-containing material may have been disturbed.",
    category: "estates",
    frequency: "ad_hoc",
    estimated_time_minutes: 25,
    owner_role: "headteacher",
    linkedPolicies: ["health-safety-policy"],
    modules: ["estates", "incidents", "tasks"],
    sourceRefs: [SOURCES.hseAsbestos, SOURCES.healthSafetyAct],
    setupQuestions: [
      question("asbestos_register", "Where is the current asbestos register?", "The first check depends on current known material locations.", "Drive/system/location"),
      question("competent_contact", "Who is the competent asbestos adviser/contractor?", "Emergency escalation must be immediate and approved.", "Name/company/contact source"),
      question("isolation_authority", "Who can isolate rooms or areas?", "Staff need authority to secure an area quickly.", "Role/name"),
    ],
    visualFlow: [
      flow("Stop", "Stop work and leave material alone."),
      flow("Isolate", "Clear and secure area."),
      flow("Check", "Consult register and competent person."),
      flow("Record", "Incident, advice and remedial action."),
    ],
    steps: [
      step("stop_work", 1, "Stop work and prevent further disturbance", "Stop activity immediately. Do not sweep, vacuum, collect samples or move debris.", false),
      step("isolate_area", 2, "Isolate area", "Move people away, close doors if safe, prevent access and display temporary warning.", true, ["photo", "note"], "Photograph access control, not disturbed material close-up."),
      step("check_register", 3, "Check asbestos register and competent advice", "Check the register and contact the competent adviser/contractor before re-entry or clean-up.", true, ["file", "note"], "Record register finding and advice."),
      step("record_actions", 4, "Record incident and actions", "Record affected area, people potentially exposed, advice received, remedial action and reopening decision.", true, ["file", "note"], "Attach incident/task IDs.", "incidents"),
    ],
    edPrompt:
      "Ask where the asbestos register is, who the competent contact is, and who can isolate areas.",
  }),
  template({
    template_id: "safeguarding_concern_reporting",
    name: "Safeguarding Concern Reporting",
    description:
      "How staff record and escalate safeguarding concerns to the DSL team using the school's approved system.",
    category: "safeguarding",
    frequency: "ad_hoc",
    estimated_time_minutes: 15,
    owner_role: "DSL",
    linkedPolicies: ["child-protection-safeguarding", "behaviour-policy", "attendance-policy"],
    modules: ["safeguarding", "tasks", "ed"],
    sourceRefs: [SOURCES.kcsie],
    setupQuestions: [
      question("dsl_team", "Who are the DSL and deputy DSLs?", "Ed must route urgent concerns to approved roles.", "Roles/names"),
      question("recording_system", "Which safeguarding recording system is used?", "Staff need exact local instructions.", "CPOMS/MyConcern/other"),
      question("urgent_route", "What is the urgent route if a child may be at immediate risk?", "The SOP must distinguish recording from urgent action.", "Call/room/radio/phone route"),
    ],
    visualFlow: [
      flow("Notice", "Concern, disclosure or pattern."),
      flow("Record", "Use the safeguarding system."),
      flow("Escalate", "Tell DSL urgently where risk requires."),
      flow("Follow", "DSL decision and actions."),
    ],
    steps: [
      step("make_safe", 1, "Make the child safe if immediate risk exists", "If there is immediate risk, contact DSL/emergency services according to local procedure before administrative recording.", false, ["note"], "Record urgent action once safe."),
      step("record_concern", 2, "Record concern factually", "Use the approved safeguarding system. Record facts, words used, body map if required, date/time and witnesses.", true, ["note"], "Reference the concern record ID.", "safeguarding"),
      step("tell_dsl", 3, "Tell DSL team", "Make sure the DSL/deputy DSL has seen urgent concerns and knows if the child is still on site.", true, ["note"], "Record DSL notified and time."),
      step("follow_instruction", 4, "Follow DSL instructions", "Complete any immediate actions given by DSL and do not investigate beyond your role.", false),
    ],
    edPrompt:
      "Ask for DSL team, recording system, urgent contact route and out-of-hours arrangements.",
  }),
  template({
    template_id: "missing_child_response",
    name: "Missing Child Response",
    description:
      "Immediate response when a pupil is missing from expected location, including search, escalation and parent/police contact.",
    category: "safeguarding",
    frequency: "ad_hoc",
    estimated_time_minutes: 20,
    owner_role: "headteacher",
    linkedPolicies: ["child-protection-safeguarding", "attendance-policy", "behaviour-policy"],
    modules: ["safeguarding", "attendance", "incidents"],
    sourceRefs: [SOURCES.kcsie],
    setupQuestions: [
      question("search_zones", "What are the agreed search zones?", "The SOP should produce a visual school-specific search map/checklist.", "Internal/external zones"),
      question("lockdown_threshold", "When is SLT/police escalation triggered?", "Time and risk thresholds must be clear.", "Immediate/5 min/10 min etc."),
      question("parent_contact", "Who contacts parents/carers and when?", "Avoid duplicate or delayed communication.", "Role and threshold"),
    ],
    visualFlow: [
      flow("Confirm", "Check register/location."),
      flow("Search", "Immediate controlled search."),
      flow("Escalate", "SLT/DSL/police/parents."),
      flow("Record", "Timeline and learning."),
    ],
    steps: [
      step("confirm_missing", 1, "Confirm pupil is missing", "Check register, known movement, toilets, medical, office and expected adult before declaring missing.", false),
      step("controlled_search", 2, "Start controlled search", "Allocate staff to agreed zones while maintaining supervision of other pupils.", true, ["note"], "Record search zones and staff allocated."),
      step("escalate", 3, "Escalate according to risk threshold", "Notify SLT/DSL. Contact police/parents according to local threshold and risk.", true, ["note"], "Record exact timeline and contacts."),
      step("close_review", 4, "Close and review", "When found, check welfare, record incident, inform relevant parties and review controls.", true, ["note"], "Record outcome and follow-up actions.", "incidents"),
    ],
    edPrompt:
      "Ask for search zones, escalation thresholds, parent contact owner and school site-specific risks.",
  }),
  template({
    template_id: "behaviour_incident_response",
    name: "Behaviour Incident Response",
    description:
      "How staff respond to, record and review behaviour incidents while checking safeguarding, SEND and equality factors.",
    category: "safeguarding",
    frequency: "ad_hoc",
    estimated_time_minutes: 20,
    owner_role: "behaviour lead",
    linkedPolicies: ["behaviour-policy", "anti-bullying-policy", "send-policy"],
    modules: ["behaviour", "safeguarding", "send", "tasks"],
    sourceRefs: [SOURCES.behaviourSchools, SOURCES.kcsie],
    setupQuestions: [
      question("behaviour_system", "Where are behaviour incidents recorded?", "The SOP must put evidence in the school's live system.", "CPOMS/SIMS/Arbor/Schoolgle"),
      question("removal_space", "What is the agreed supervised removal/reflection space?", "Staff need safe, local directions.", "Room/name/supervision"),
      question("send_check_owner", "Who checks SEND/reasonable adjustment implications?", "Behaviour responses must consider pupil need and context.", "SENCO/SLT role"),
    ],
    visualFlow: [
      flow("Stabilise", "Make the situation safe."),
      flow("Record", "Log facts and impact."),
      flow("Review", "Check patterns, SEND, safeguarding."),
      flow("Repair", "Agree follow-up and communication."),
    ],
    steps: [
      step("make_safe", 1, "Make the situation safe", "Use agreed de-escalation and supervision. If harm/risk is present, escalate to SLT/DSL according to local threshold.", true, ["note"], "Record immediate safety actions.", "behaviour"),
      step("record_facts", 2, "Record the incident factually", "Record date/time, location, pupils/staff involved, behaviour, impact, witnesses and immediate response.", true, ["note"], "Link to the behaviour record ID.", "behaviour"),
      step("review_context", 3, "Review safeguarding/SEND/equality context", "Check whether the incident links to bullying, safeguarding, SEND needs, reasonable adjustments or repeated patterns.", true, ["note"], "Record any onward referral or adjustment review."),
      step("follow_up", 4, "Complete follow-up and communication", "Apply agreed consequence/restorative action, inform parents where required and create actions for unmet need or repeated concerns.", true, ["note"], "Record follow-up actions and owner.", "tasks"),
    ],
    edPrompt:
      "Ask for the behaviour recording system, removal spaces, SLT/DSL thresholds and SENCO review route, then generate the local incident SOP.",
  }),
  template({
    template_id: "bullying_report_response",
    name: "Bullying Report Response",
    description:
      "How the school receives, investigates, supports and monitors bullying or suspected bullying reports.",
    category: "safeguarding",
    frequency: "ad_hoc",
    estimated_time_minutes: 30,
    owner_role: "pastoral lead",
    linkedPolicies: ["anti-bullying-policy", "behaviour-policy", "child-protection-safeguarding"],
    modules: ["behaviour", "safeguarding", "parent-comms"],
    sourceRefs: [SOURCES.bullying, SOURCES.behaviourSchools],
    setupQuestions: [
      question("report_routes", "How can pupils, parents and staff report bullying?", "The SOP should match the school's actual routes.", "Office/email/form/pupil voice"),
      question("investigation_owner", "Who leads bullying investigations?", "Avoids drift or duplicate ownership.", "Pastoral/SLT/phase lead"),
      question("monitoring_period", "How long is follow-up monitoring after a bullying finding?", "Prevents one-off closure without checking impact.", "2/4/6 weeks"),
    ],
    visualFlow: [
      flow("Receive", "Listen and capture allegation."),
      flow("Investigate", "Gather accounts and evidence."),
      flow("Support", "Protect and support pupils."),
      flow("Monitor", "Check recurrence and learning."),
    ],
    steps: [
      step("receive_report", 1, "Receive and acknowledge report", "Take the report seriously, capture the concern, and explain next steps to the reporting person.", true, ["note"], "Record report route and initial response."),
      step("investigate", 2, "Investigate promptly", "Gather pupil accounts, staff observations, digital evidence if relevant, and check whether the definition/threshold is met.", true, ["note", "file"], "Record evidence considered."),
      step("support_plan", 3, "Put support and controls in place", "Agree immediate protection/support for targeted pupil and proportionate response for other pupils involved.", true, ["note"], "Record support actions."),
      step("monitor_review", 4, "Monitor and review", "Schedule follow-up checks, update parents where required and review wider prevention actions.", true, ["note"], "Record follow-up dates and outcome.", "tasks"),
    ],
    edPrompt:
      "Ask for reporting routes, investigation ownership, parent communication expectations and monitoring period.",
  }),
  template({
    template_id: "attendance_concern_support",
    name: "Attendance Concern Support",
    description:
      "Support-first attendance response for pupils at risk of persistent or severe absence, with escalation only after support is reviewed.",
    category: "safeguarding",
    frequency: "weekly",
    estimated_time_minutes: 25,
    owner_role: "attendance lead",
    linkedPolicies: ["attendance-policy", "child-protection-safeguarding", "send-policy"],
    modules: ["attendance", "safeguarding", "tasks"],
    sourceRefs: [SOURCES.attendance, SOURCES.kcsie],
    setupQuestions: [
      question("attendance_thresholds", "What thresholds trigger attendance review?", "Ed needs thresholds for alerts and tasks.", "90%, 92%, 95%, sessions missed"),
      question("attendance_meeting_owner", "Who leads attendance support meetings?", "Defines ownership and handover.", "Attendance lead/DSL/SLT"),
      question("la_route", "What is the local authority attendance escalation route?", "Legal escalation varies by LA process.", "Named officer/email/process"),
    ],
    visualFlow: [
      flow("Identify", "Use data threshold/pattern."),
      flow("Understand", "Talk to family and pupil."),
      flow("Support", "Agree barriers and plan."),
      flow("Escalate", "Review and use formal routes if needed."),
    ],
    steps: [
      step("identify", 1, "Identify attendance concern", "Review attendance data, patterns, punctuality, safeguarding flags and contextual factors.", true, ["note"], "Record trigger and data snapshot.", "attendance"),
      step("contact_family", 2, "Understand barriers", "Contact family/pupil to understand barriers and check whether SEND, medical, bullying or safeguarding factors are involved.", true, ["note"], "Record discussion and barriers."),
      step("support_plan", 3, "Agree support plan", "Agree practical support, expectations, review date and named owner before formal escalation unless risk requires immediate action.", true, ["note"], "Create linked support tasks.", "tasks"),
      step("review_escalate", 4, "Review and escalate if support is not working", "Review impact and escalate through school/LA route where appropriate and evidenced.", true, ["note"], "Record decision and next step."),
    ],
    edPrompt:
      "Ask for attendance thresholds, meeting owner, support menu, LA route and communication templates.",
  }),
  template({
    template_id: "send_graduated_response_review",
    name: "SEND Graduated Response Review",
    description:
      "Assess-plan-do-review cycle for pupils needing SEND support, including parent/pupil voice and provision impact.",
    category: "safeguarding",
    frequency: "termly",
    estimated_time_minutes: 45,
    owner_role: "SENCO",
    linkedPolicies: ["send-policy", "accessibility-plan", "supporting-pupils-medical-conditions"],
    modules: ["send", "teaching-learning", "tasks"],
    sourceRefs: [SOURCES.sendCode],
    setupQuestions: [
      question("send_register_system", "Where is the SEN register/provision map held?", "The SOP must update the right record.", "Schoolgle/SIMS/Arbor/spreadsheet"),
      question("review_cycle", "When are APDR reviews completed?", "Creates the recurring cycle.", "Termly dates/process"),
      question("parent_voice_route", "How is parent and pupil voice captured?", "Required for meaningful review and evidence trail.", "Meeting/form/template"),
    ],
    visualFlow: [
      flow("Assess", "Needs, barriers and evidence."),
      flow("Plan", "Provision and outcomes."),
      flow("Do", "Deliver and monitor."),
      flow("Review", "Impact, voice and next step."),
    ],
    steps: [
      step("assess", 1, "Assess needs and evidence", "Review teacher evidence, assessment data, attendance/behaviour patterns and parent/pupil voice.", true, ["file", "note"], "Attach supporting evidence.", "send"),
      step("plan", 2, "Plan provision and outcomes", "Set outcomes, provision, responsible adults, review date and reasonable adjustments.", true, ["note"], "Record provision plan."),
      step("do_monitor", 3, "Deliver and monitor provision", "Confirm provision is happening and collect brief implementation/impact notes.", true, ["note"], "Record delivery checks.", "tasks"),
      step("review", 4, "Review impact and next step", "Review progress, parent/pupil voice, and decide continue/change/escalate for specialist advice or EHCP pathway.", true, ["note"], "Record review outcome."),
    ],
    edPrompt:
      "Ask for SEN register location, APDR timetable, provision map fields and parent/pupil voice route.",
  }),
  template({
    template_id: "trip_charging_approval",
    name: "Trip Charging and Remissions Approval",
    description:
      "Checks whether a visit/activity charge, voluntary contribution or remission is allowed before letters are issued.",
    category: "finance",
    frequency: "ad_hoc",
    estimated_time_minutes: 20,
    owner_role: "school business manager",
    linkedPolicies: ["charging-remissions", "curriculum-policy"],
    modules: ["finance", "trips", "parent-comms"],
    sourceRefs: [SOURCES.chargingActivities],
    setupQuestions: [
      question("trip_approval_owner", "Who approves charges before parent letters go out?", "Prevents inconsistent charging practice.", "SBM/headteacher/governor"),
      question("remission_criteria", "What remissions or subsidies does the school apply?", "The SOP must reflect local policy.", "FSM/PP/hardship/trust fund"),
      question("letter_template", "Which parent letter/template is used?", "Schoolgle can draft from the approved wording.", "Template name/location"),
    ],
    visualFlow: [
      flow("Classify", "Curriculum, optional or residential."),
      flow("Check", "Charge/remission rules."),
      flow("Approve", "Senior finance sign-off."),
      flow("Communicate", "Clear parent wording."),
    ],
    steps: [
      step("classify_activity", 1, "Classify the activity", "Confirm whether the activity is during school time, curriculum-related, optional extra or residential.", true, ["note"], "Record classification and rationale."),
      step("check_charge", 2, "Check charge/remission rules", "Check voluntary contribution wording, permitted charges and remission/subsidy criteria.", true, ["note"], "Record charge/remission decision."),
      step("approve", 3, "Approve before communication", "Get approval from the agreed finance/SLT owner before parent communications are issued.", true, ["note"], "Record approver and date."),
      step("communicate", 4, "Issue parent communication", "Use approved wording that avoids implying voluntary contributions are compulsory.", true, ["file"], "Attach/link final letter.", "parent-comms"),
    ],
    edPrompt:
      "Ask for charge approver, remission criteria, hardship route and approved trip-letter template.",
  }),
  template({
    template_id: "pay_decision_cycle",
    name: "Pay Decision Cycle",
    description:
      "Annual teacher pay decision workflow covering evidence, recommendations, committee approval, letters and appeal route.",
    category: "hr",
    frequency: "annual",
    estimated_time_minutes: 60,
    owner_role: "headteacher",
    linkedPolicies: ["pay-policy", "staff-discipline-conduct"],
    modules: ["hr", "governance", "tasks"],
    sourceRefs: [SOURCES.teachersPay],
    setupQuestions: [
      question("pay_committee", "Which committee/person approves pay decisions?", "The approval route must match governance delegation.", "Pay committee/governors/trust"),
      question("evidence_pack", "Where are appraisal/pay evidence packs stored?", "Sensitive HR evidence needs controlled handling.", "HR folder/system"),
      question("appeal_route", "What is the local appeal route and timescale?", "Letters and tasks need the correct next step.", "Policy wording/timescale"),
    ],
    visualFlow: [
      flow("Prepare", "Evidence and recommendations."),
      flow("Approve", "Delegated decision."),
      flow("Notify", "Letters and payroll."),
      flow("Appeal", "Route if challenged."),
    ],
    steps: [
      step("prepare_evidence", 1, "Prepare evidence and recommendation", "Gather relevant appraisal/pay evidence and draft recommendation according to policy.", true, ["file", "note"], "Link evidence pack location.", "hr"),
      step("committee_decision", 2, "Record delegated decision", "Record committee/headteacher decision, conflicts and rationale.", true, ["note"], "Record decision date and approver.", "governance"),
      step("notify_payroll_staff", 3, "Notify staff and payroll", "Issue decision letters and payroll instruction using approved templates and access controls.", true, ["file"], "Attach/link final letters."),
      step("handle_appeal", 4, "Handle appeal if submitted", "Follow appeal route, panel membership and evidence deadlines if a challenge is received.", false, ["note"], "Record appeal task if needed.", "tasks"),
    ],
    edPrompt:
      "Ask for pay committee, delegation, appraisal evidence location, payroll route and appeal timescales.",
  }),
  template({
    template_id: "medicine_administration",
    name: "Medicine Administration",
    description:
      "Administering medicine safely, with consent, records, storage checks and emergency escalation.",
    category: "h_and_s",
    frequency: "ad_hoc",
    estimated_time_minutes: 10,
    owner_role: "trained first aider",
    linkedPolicies: ["supporting-pupils-medical-conditions", "health-safety-policy"],
    modules: ["safeguarding", "send", "evidence"],
    sourceRefs: [SOURCES.medicalConditions],
    setupQuestions: [
      question("medicine_storage", "Where are medicines stored and who has access?", "Staff need precise local instructions.", "Location/access"),
      question("consent_records", "Where are parental consent and IHP records held?", "Administration must be linked to consent/IHP.", "System/folder"),
      question("emergency_meds", "Which emergency medicines are held and where?", "Emergency steps must be immediate and clear.", "Asthma, EpiPen, etc."),
    ],
    visualFlow: [
      flow("Check", "Consent/IHP/medicine label."),
      flow("Administer", "Right pupil, medicine, dose, time."),
      flow("Record", "Administration record."),
      flow("Escalate", "Error, refusal or emergency."),
    ],
    steps: [
      step("check_authority", 1, "Check consent and instructions", "Check written consent/IHP, medicine label, dose, timing, expiry and pupil identity.", true, ["note"], "Record checks completed."),
      step("administer", 2, "Administer medicine", "Administer according to instructions by trained/authorised staff. Do not administer if checks fail.", false),
      step("record", 3, "Record administration", "Record pupil, medicine, dose, time, staff member and any issue/refusal.", true, ["file", "note"], "Attach/log medicine record."),
      step("escalate_issue", 4, "Escalate error, refusal or emergency", "Follow emergency/IHP route and notify parent/SLT/health services as required.", false),
    ],
    edPrompt:
      "Ask where medicines, consent records, IHPs and emergency medicines are kept and who may administer them.",
  }),
  template({
    template_id: "data_breach_triage",
    name: "Data Breach Triage",
    description:
      "Initial response to a suspected personal data breach, including containment, DPO notification and ICO deadline triage.",
    category: "compliance",
    frequency: "ad_hoc",
    estimated_time_minutes: 30,
    owner_role: "DPO",
    linkedPolicies: ["data-protection-policy", "privacy-notices"],
    modules: ["compliance", "gdpr", "tasks"],
    sourceRefs: [SOURCES.icoBreach],
    setupQuestions: [
      question("dpo_contact", "Who is the DPO/contact for data incidents?", "The 72-hour assessment clock needs a clear owner.", "DPO details/source"),
      question("breach_log", "Where is the breach log held?", "The SOP must record evidence in the right register.", "Schoolgle/GDPR folder/system"),
      question("senior_owner", "Who signs off ICO and affected-person notifications?", "Escalation and communications need approval.", "Headteacher/SBM/DPO/governor"),
    ],
    visualFlow: [
      flow("Contain", "Stop further data exposure."),
      flow("Assess", "Risk to people and data categories."),
      flow("Notify", "DPO/ICO/affected people if needed."),
      flow("Learn", "Actions and prevention."),
    ],
    steps: [
      step("contain", 1, "Contain the breach", "Stop further disclosure or access. Preserve evidence and do not delete audit trails.", true, ["note"], "Record containment action and time."),
      step("assess", 2, "Assess risk and data involved", "Identify data, people affected, sensitivity, volume, cause and risk of harm.", true, ["note"], "Record initial assessment."),
      step("notify_dpo", 3, "Notify DPO/senior owner", "Notify DPO or approved senior owner immediately and agree whether ICO/individual notification is required.", true, ["note"], "Record decision owner and time."),
      step("actions", 4, "Create corrective actions", "Create actions for recovery, communication, training, system change or processor follow-up.", false, ["note"], "Link task IDs.", "tasks"),
    ],
    edPrompt:
      "Ask for DPO contact, breach register, senior sign-off and normal parent/staff communication routes.",
  }),
  template({
    template_id: "complaint_intake",
    name: "Complaint Intake and Stage Triage",
    description:
      "How office/headteacher/governance staff receive, classify and route a complaint.",
    category: "governance",
    frequency: "ad_hoc",
    estimated_time_minutes: 20,
    owner_role: "headteacher",
    linkedPolicies: ["complaints-procedure"],
    modules: ["governance", "compliance", "tasks"],
    sourceRefs: [SOURCES.complaints],
    setupQuestions: [
      question("complaints_owner", "Who logs formal complaints?", "The SOP needs one owner for deadlines and records.", "Role/name"),
      question("stages", "What are the school's complaint stages and timescales?", "Deadlines differ by local procedure.", "Stage names/days"),
      question("excluded_routes", "Which issues use another procedure?", "Safeguarding, exclusions, SEND and staff matters may be excluded.", "List local exclusions"),
    ],
    visualFlow: [
      flow("Receive", "Concern or formal complaint."),
      flow("Classify", "Right procedure and stage."),
      flow("Acknowledge", "Timescale and owner."),
      flow("Track", "Actions, response and learning."),
    ],
    steps: [
      step("receive", 1, "Receive and acknowledge", "Record complainant, pupil/context, issue, date received and requested outcome.", true, ["note"], "Create complaint record.", "compliance"),
      step("classify", 2, "Classify route and stage", "Check whether this is informal, formal, panel, or excluded because another statutory process applies.", true, ["note"], "Record route and reason."),
      step("assign", 3, "Assign owner and deadline", "Assign complaint owner, response deadline and next contact date.", false, ["note"], "Link task or deadline.", "tasks"),
      step("capture_learning", 4, "Capture learning and closure evidence", "When closed, record outcome, action, learning and whether governors need anonymised reporting.", false),
    ],
    edPrompt:
      "Ask for complaint stages, timescales, owner, excluded routes and governance reporting arrangements.",
  }),
  template({
    template_id: "policy_review_and_publication",
    name: "Policy Review and Website Publication",
    description:
      "Review, approve, version and publish a policy without losing the source evidence trail.",
    category: "compliance",
    frequency: "annual",
    estimated_time_minutes: 40,
    owner_role: "school business manager",
    linkedPolicies: ["complaints-procedure", "health-safety-policy", "data-protection-policy"],
    modules: ["compliance", "policy-manager", "website", "governance"],
    sourceRefs: [SOURCES.complaints],
    setupQuestions: [
      question("approval_route", "Which committee/body approves each policy category?", "Policy Manager needs the right approval path.", "FGB/committee/headteacher/trust"),
      question("website_owner", "Who publishes policies to the website?", "Publication cannot be assumed from approval.", "Role/name"),
      question("version_format", "What version/date format does the school use?", "The generated front page and audit trail should match school convention.", "e.g. v1.0, approved date, review date"),
    ],
    visualFlow: [
      flow("Check", "Source and legal references."),
      flow("Draft", "Create Schoolgle managed version."),
      flow("Approve", "Record approver/minute/date."),
      flow("Publish", "Website/export and monitor."),
    ],
    steps: [
      step("source_check", 1, "Check source file and official references", "Confirm the connected source policy, source-backed pack and any local authority/trust model wording.", true, ["file", "note"], "Record source file and references.", "policy-manager"),
      step("draft_review", 2, "Review Schoolgle draft", "Check local names, roles, dates, linked SOPs and local variations before approval.", true, ["note"], "Record review notes."),
      step("approval", 3, "Record approval", "Record approver, role/body, approval date, minute/reference and review date.", true, ["note"], "Approval evidence.", "governance"),
      step("publish", 4, "Publish/export current version", "Publish HTML/website/PDF/Word version as required and confirm website matches approved version.", true, ["file", "note"], "Website URL/export evidence.", "website"),
    ],
    edPrompt:
      "Ask for approval routes, website owner, version format and publication checks. Produce a repeatable policy review SOP.",
  }),
];

export function listBuiltInSopTemplates(): BuiltInSopTemplate[] {
  return BUILT_IN_SOP_TEMPLATES;
}

export function getBuiltInSopTemplate(templateId: string): BuiltInSopTemplate | null {
  return BUILT_IN_SOP_TEMPLATES.find((templateItem) => templateItem.template_id === templateId) || null;
}

export function getRecommendedSopsForPolicy(
  policyRequirementId: string,
): BuiltInSopTemplate[] {
  return BUILT_IN_SOP_TEMPLATES.filter((templateItem) =>
    templateItem.linked_policy_requirement_ids.includes(policyRequirementId),
  );
}

export function mergeBuiltInSopTemplates(
  databaseTemplates: SopTemplate[],
): BuiltInSopTemplate[] {
  const byTemplateId = new Map<string, SopTemplate>(
    databaseTemplates.map((templateItem) => [templateItem.template_id, templateItem]),
  );

  const builtInTemplates: BuiltInSopTemplate[] = BUILT_IN_SOP_TEMPLATES.map((builtIn) => ({
    ...builtIn,
    ...(byTemplateId.get(builtIn.template_id) || {}),
    source: "schoolgle_builtin" as const,
    linked_policy_requirement_ids: builtIn.linked_policy_requirement_ids,
    recommended_modules: builtIn.recommended_modules,
    setup_questions: builtIn.setup_questions,
    source_refs: builtIn.source_refs,
    visual_flow: builtIn.visual_flow,
    document_resources: builtIn.document_resources,
    ed_prompt: builtIn.ed_prompt,
  }));

  const databaseOnlyTemplates: BuiltInSopTemplate[] = databaseTemplates
    .filter((templateItem) => !BUILT_IN_SOP_TEMPLATES.some((builtIn) => builtIn.template_id === templateItem.template_id))
    .map((templateItem) => ({
      ...templateItem,
      source: "database" as const,
      linked_policy_requirement_ids: [],
      recommended_modules: [],
      setup_questions: [],
      source_refs: [],
      visual_flow: [],
      document_resources: [],
      ed_prompt: "Ask Ed to help localise this SOP for the school.",
    }));

  return [...builtInTemplates, ...databaseOnlyTemplates];
}

export function toSopTemplateSeed(templateItem: BuiltInSopTemplate) {
  return {
    template_id: templateItem.template_id,
    name: templateItem.name,
    description: templateItem.description,
    category: templateItem.category,
    frequency: templateItem.frequency,
    steps: templateItem.steps,
    estimated_time_minutes: templateItem.estimated_time_minutes,
    owner_role: templateItem.owner_role,
    is_active: true,
  };
}
