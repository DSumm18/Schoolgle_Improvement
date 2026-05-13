import {
  MAINTAINED_PRIMARY_POLICY_REQUIREMENTS,
  type PolicyRequirement,
} from "../policy-catalogue";
import type {
  PolicyQualitySource,
  PolicySourceAuthority,
} from "../policy-quality-analyser";

export type StarterPolicyDraftMode = "missing_policy" | "improve_existing";

export type StarterPolicyDraftInput = {
  requirementId: string;
  mode: StarterPolicyDraftMode;
  schoolName: string;
  schoolLogoUrl?: string;
  primaryColor?: string;
  approvalBody?: string;
  reviewCycle?: string;
  nextReviewDate?: string;
  existingFileName?: string;
  weakAreas?: string[];
};

export type StarterPolicyDraft = {
  title: string;
  markdown: string;
  formattedHtml: string;
  downloadFileName: string;
  sources: PolicyQualitySource[];
  assumptions: string[];
};

export type StarterPolicyDraftPreview = {
  title: string;
  summary: string;
  draft: StarterPolicyDraft;
};

type StarterPolicyBlueprint = {
  purpose: string;
  localQuestions: string[];
  operatingControls: string[];
  sopRows: [procedure: string, owner: string, setupPrompt: string][];
};

const LAST_CHECKED = "2026-05-01";

const SOURCE_LIBRARY: Record<
  string,
  Omit<PolicyQualitySource, "id" | "lastChecked">
> = {
  "DfE Keeping children safe in education": {
    title: "Keeping children safe in education",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/keeping-children-safe-in-education--2",
  },
  "Working together to safeguard children": {
    title: "Working together to safeguard children",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/working-together-to-safeguard-children--2",
  },
  "DfE behaviour in schools": {
    title: "Behaviour in schools: advice for headteachers and school staff",
    authority: "dfe_advice",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/behaviour-in-schools--2",
  },
  "Maintained schools governance guide": {
    title: "Maintained schools governance guide",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/maintained-schools-governance-guide/maintained-schools-governance-guide",
  },
  "DfE preventing and tackling bullying": {
    title: "Preventing and tackling bullying",
    authority: "dfe_advice",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/preventing-and-tackling-bullying",
  },
  "Working together to improve school attendance": {
    title: "Working together to improve school attendance",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/working-together-to-improve-school-attendance",
  },
  "SEND code of practice": {
    title: "SEND code of practice: 0 to 25 years",
    authority: "statutory_guidance",
    publisher: "Department for Education / Department of Health",
    url: "https://www.gov.uk/government/publications/send-code-of-practice-0-to-25",
  },
  "Children and Families Act duties": {
    title: "Children and Families Act 2014",
    authority: "legislation",
    publisher: "UK Government",
    url: "https://www.legislation.gov.uk/ukpga/2014/6/contents",
  },
  "DfE supporting pupils with medical conditions at school": {
    title: "Supporting pupils at school with medical conditions",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/supporting-pupils-at-school-with-medical-conditions--3",
  },
  "DfE relationships, sex and health education statutory guidance": {
    title: "Relationships education, relationships and sex education and health education",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/relationships-education-relationships-and-sex-education-rse-and-health-education",
  },
  "National curriculum in England": {
    title: "National curriculum in England",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/collections/national-curriculum",
  },
  "DfE school complaints procedures guidance": {
    title: "Best practice guidance for school complaints procedures",
    authority: "dfe_advice",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/school-complaints-procedures",
  },
  "Education Act charging duties": {
    title: "Education Act 1996",
    authority: "legislation",
    publisher: "UK Government",
    url: "https://www.legislation.gov.uk/ukpga/1996/56/contents",
  },
  "DfE data protection in schools": {
    title: "Data protection in schools",
    authority: "govuk_advice",
    publisher: "Department for Education",
    url: "https://www.gov.uk/guidance/data-protection-in-schools",
  },
  "UK GDPR": {
    title: "UK GDPR guidance and resources",
    authority: "sector_good_practice",
    publisher: "Information Commissioner's Office",
    url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/",
  },
  "Data Protection Act 2018": {
    title: "Data Protection Act 2018",
    authority: "legislation",
    publisher: "UK Government",
    url: "https://www.legislation.gov.uk/ukpga/2018/12/contents",
  },
  "ICO accountability guidance": {
    title: "Accountability and governance",
    authority: "sector_good_practice",
    publisher: "Information Commissioner's Office",
    url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/",
  },
  "ICO model publication scheme": {
    title: "Model publication scheme",
    authority: "sector_good_practice",
    publisher: "Information Commissioner's Office",
    url: "https://ico.org.uk/for-organisations/foi/freedom-of-information-and-environmental-information-regulations/model-publication-scheme/",
  },
  "Health and Safety at Work etc. Act": {
    title: "Health and Safety at Work etc. Act 1974",
    authority: "legislation",
    publisher: "UK Government",
    url: "https://www.legislation.gov.uk/ukpga/1974/37/contents",
  },
  "Equality Act 2010": {
    title: "Equality Act 2010",
    authority: "legislation",
    publisher: "UK Government",
    url: "https://www.legislation.gov.uk/ukpga/2010/15/contents",
  },
  "Public Sector Equality Duty": {
    title: "Public sector equality duty",
    authority: "govuk_advice",
    publisher: "GOV.UK",
    url: "https://www.gov.uk/government/publications/public-sector-equality-duty",
  },
  "School admissions code": {
    title: "School admissions code",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/school-admissions-code--2",
  },
  "School admission appeals code": {
    title: "School admission appeals code",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/school-admissions-appeals-code",
  },
  "School teachers' pay and conditions": {
    title: "School teachers' pay and conditions",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/school-teachers-pay-and-conditions",
  },
  "Employment law duties": {
    title: "Disciplinary and grievance procedures",
    authority: "sector_good_practice",
    publisher: "Acas",
    url: "https://www.acas.org.uk/disciplinary-and-grievance-procedures",
  },
  "Good governance practice": {
    title: "Maintained schools governance guide",
    authority: "statutory_guidance",
    publisher: "Department for Education",
    url: "https://www.gov.uk/government/publications/maintained-schools-governance-guide/maintained-schools-governance-guide",
  },
};

const DEFAULT_SOURCE = {
  title: "Maintained schools governance guide",
  authority: "statutory_guidance" as PolicySourceAuthority,
  publisher: "Department for Education",
  url: "https://www.gov.uk/government/publications/maintained-schools-governance-guide/maintained-schools-governance-guide",
};

const BLUEPRINTS: Record<string, StarterPolicyBlueprint> = {
  "child-protection-safeguarding": {
    purpose:
      "sets out how the school keeps children safe, identifies and responds to safeguarding concerns, and works with statutory partners.",
    localQuestions: [
      "Who are the DSL, deputy DSLs and safeguarding governor?",
      "Which local safeguarding partnership procedures does the school follow?",
      "How are low-level concerns, online safety and filtering/monitoring recorded?",
    ],
    operatingControls: [
      "Name the DSL team, safeguarding governor and escalation routes.",
      "Describe how staff recognise, record and report concerns, including low-level concerns and allegations.",
      "Explain safer recruitment, child-on-child abuse, online safety, attendance links and vulnerable pupil monitoring.",
      "Set out how the school uses local authority, police, health and social care thresholds.",
    ],
    sopRows: [
      ["Record a child protection concern", "DSL / all staff", "Confirm system, urgency route and who checks actions daily."],
      ["Manage an allegation or low-level concern", "Headteacher / chair of governors", "Confirm LADO route and confidential record location."],
      ["Review filtering and monitoring", "DSL / IT lead", "Confirm frequency, report owner and governor oversight."],
    ],
  },
  "behaviour-policy": {
    purpose:
      "creates a calm, safe and purposeful environment by making behaviour expectations, rewards, sanctions and support clear.",
    localQuestions: [
      "What are the school rules, rewards and graduated consequences?",
      "Who leads reintegration after suspension or serious incidents?",
      "How are reasonable adjustments recorded for pupils with SEND or disability?",
    ],
    operatingControls: [
      "Define expected conduct, school routines, rewards and proportionate sanctions.",
      "Explain bullying, online behaviour, off-site conduct, removal, detention and escalation routes.",
      "Show how SEND, disability, safeguarding and equality duties shape behaviour responses.",
      "Link serious or persistent breaches to suspension/permanent exclusion procedures.",
    ],
    sopRows: [
      ["Record a behaviour incident", "Class teacher / SLT", "Confirm the behaviour system and parent contact triggers."],
      ["Respond to bullying concerns", "DSL / behaviour lead", "Confirm investigation, support and communication process."],
      ["Reintegrate after suspension", "Headteacher / pastoral lead", "Confirm meeting format, plan owner and monitoring period."],
    ],
  },
  "anti-bullying-policy": {
    purpose:
      "prevents bullying, makes reporting easy, and ensures pupils affected by bullying receive prompt support.",
    localQuestions: [
      "How do pupils report bullying safely and confidentially?",
      "How are protected-characteristic, online and repeated incidents tracked?",
      "Which curriculum routes teach anti-bullying and respectful relationships?",
    ],
    operatingControls: [
      "Define bullying, including prejudice-related and cyberbullying.",
      "Set prevention work through curriculum, supervision, pupil voice and culture.",
      "Describe investigation, recording, parent contact, support and follow-up.",
      "Explain links to safeguarding, behaviour, SEND and equality duties.",
    ],
    sopRows: [
      ["Triage a bullying report", "Class teacher / pastoral lead", "Confirm timescale for initial contact and risk check."],
      ["Investigate and record", "Behaviour lead / DSL", "Confirm evidence, pupil voice and outcome logging route."],
      ["Monitor after resolution", "Pastoral lead", "Confirm follow-up dates and wellbeing check owner."],
    ],
  },
  "attendance-policy": {
    purpose:
      "sets high expectations for attendance and explains how the school works with families to reduce absence.",
    localQuestions: [
      "Who checks attendance daily and who escalates persistent absence?",
      "What are the first-day calling, CME and safeguarding escalation routes?",
      "How are support plans agreed before legal intervention is considered?",
    ],
    operatingControls: [
      "Explain attendance expectations, registers, absence coding and punctuality.",
      "Describe daily absence checks, safeguarding escalation and children missing education links.",
      "Set out staged support for persistent/severe absence and barriers to attendance.",
      "Clarify parent responsibilities, school duties, local authority work and legal routes.",
    ],
    sopRows: [
      ["Complete first-day absence checks", "Attendance officer", "Confirm call times, unanswered route and DSL escalation."],
      ["Review persistent absence", "Attendance lead", "Confirm meeting triggers and support plan template."],
      ["Escalate safeguarding absence concerns", "DSL", "Confirm thresholds for home visit, LA contact or police welfare check."],
    ],
  },
  "send-policy": {
    purpose:
      "explains how the school identifies, assesses and supports pupils with special educational needs and disabilities.",
    localQuestions: [
      "Who is the SENCO and SEN governor?",
      "How is the graduated approach recorded and reviewed?",
      "How are parents, pupils and external professionals involved?",
    ],
    operatingControls: [
      "Set out identification, assessment, planning, provision and review arrangements.",
      "Explain the graduated approach and how provision is monitored for impact.",
      "Describe EHCP, transition, accessibility and staff training arrangements.",
      "Clarify parent/pupil voice, complaints, local offer and governor oversight.",
    ],
    sopRows: [
      ["Add pupil to SEN support", "SENCO", "Confirm evidence threshold and parent discussion route."],
      ["Review APDR cycle", "SENCO / class teacher", "Confirm review frequency and impact evidence."],
      ["Prepare EHCP evidence", "SENCO", "Confirm document bundle and professional input checklist."],
    ],
  },
  "supporting-pupils-medical-conditions": {
    purpose:
      "ensures pupils with medical conditions are supported safely and can access education as fully as possible.",
    localQuestions: [
      "Who approves individual healthcare plans?",
      "Where are medicines stored and who is trained to administer them?",
      "How are trips, emergencies and staff cover managed?",
    ],
    operatingControls: [
      "Describe individual healthcare plans, medicine storage, consent and administration.",
      "Explain staff training, emergency procedures and risk assessment for activities/trips.",
      "Clarify unacceptable practice, confidentiality, attendance and equal access expectations.",
      "Set out parent, pupil, health professional and school responsibilities.",
    ],
    sopRows: [
      ["Create or review an IHP", "Medical needs lead / SENCO", "Confirm template, health input and review cycle."],
      ["Administer medicine", "Trained staff", "Confirm consent, storage, witness and record process."],
      ["Manage a medical emergency", "First aider / DSL", "Confirm emergency contacts and ambulance route."],
    ],
  },
  "relationships-health-education": {
    purpose:
      "sets out how relationships and health education are planned, consulted on, taught and reviewed.",
    localQuestions: [
      "Which scheme of work is used and how is it adapted for the school context?",
      "How are parents consulted and informed?",
      "How are SEND, faith, age and maturity considered?",
    ],
    operatingControls: [
      "Define curriculum intent, statutory content and age-appropriate sequencing.",
      "Explain consultation, parental information, sensitive questions and safeguarding links.",
      "Describe inclusive teaching, SEND adaptations and respect for protected characteristics.",
      "Clarify monitoring, resources, staff training and governor oversight.",
    ],
    sopRows: [
      ["Publish curriculum overview", "PSHE/RHE lead", "Confirm website location and annual update owner."],
      ["Handle parent queries", "Headteacher / RHE lead", "Confirm response route and consultation evidence."],
      ["Review resources", "RHE lead / DSL", "Confirm safeguarding and age-appropriateness check."],
    ],
  },
  "curriculum-policy": {
    purpose:
      "explains the school curriculum intent, implementation and impact, including access to the national curriculum.",
    localQuestions: [
      "What are the curriculum drivers and school-specific priorities?",
      "How are subjects sequenced and monitored?",
      "How are disadvantaged, SEND and high-attaining pupils supported?",
    ],
    operatingControls: [
      "Describe curriculum intent, breadth, balance and statutory curriculum coverage.",
      "Explain sequencing, assessment, subject leadership and quality assurance.",
      "Show adaptations for SEND, disadvantaged pupils, EAL and more able pupils.",
      "Clarify enrichment, personal development links and governor monitoring.",
    ],
    sopRows: [
      ["Review subject plans", "Subject leaders", "Confirm annual cycle and evidence expected."],
      ["Analyse curriculum access", "SLT / SENCO", "Confirm vulnerable-group review route."],
      ["Report curriculum impact", "Headteacher / governors", "Confirm dashboard and meeting cycle."],
    ],
  },
  "complaints-procedure": {
    purpose:
      "provides a clear, fair route for concerns and complaints to be resolved at the right level.",
    localQuestions: [
      "Who receives formal complaints and who administers panels?",
      "What are the published timescales?",
      "How are serial, unreasonable or vexatious complaints managed?",
    ],
    operatingControls: [
      "Set out informal resolution, formal complaint stages and panel arrangements.",
      "Clarify timescales, records, confidentiality, independence and escalation.",
      "Explain exclusions from the complaints process and regulator/local authority routes.",
      "Describe how serial or unreasonable complaints are handled fairly.",
    ],
    sopRows: [
      ["Log a formal complaint", "Headteacher / clerk", "Confirm register fields and acknowledgement template."],
      ["Arrange panel hearing", "Clerk to governors", "Confirm membership, papers and decision letter route."],
      ["Close and learn from complaint", "SLT / governors", "Confirm lessons learned review and action tracking."],
    ],
  },
  "charging-remissions": {
    purpose:
      "explains when charges, voluntary contributions and remissions may apply for school activities.",
    localQuestions: [
      "Which activities are charged, subsidised or remission-eligible?",
      "Who approves charges before communication to parents?",
      "How are voluntary contributions worded to avoid pressure?",
    ],
    operatingControls: [
      "Define education, optional extras, board/lodging, music tuition and materials charging.",
      "Explain voluntary contributions and when activities may be cancelled.",
      "Set out remission arrangements and support for eligible families.",
      "Clarify approval, records, refunds and financial oversight.",
    ],
    sopRows: [
      ["Approve a trip charge", "Headteacher / finance officer", "Confirm costing, remission and communication checks."],
      ["Process remission request", "Finance officer", "Confirm evidence, confidentiality and decision route."],
      ["Review annual charges", "Governors / SBM", "Confirm annual policy and budget review cycle."],
    ],
  },
  "data-protection-policy": {
    purpose:
      "sets out how personal data is handled lawfully, securely and transparently across the school.",
    localQuestions: [
      "Who is the DPO and how are data incidents reported?",
      "Where are retention schedules, asset records and DPIAs held?",
      "How are subject access requests and data sharing requests managed?",
    ],
    operatingControls: [
      "Explain data protection principles, lawful bases and special category data.",
      "Set out roles, DPO contact, records of processing, retention and security controls.",
      "Describe data subject rights, SARs, breaches, DPIAs and data sharing.",
      "Clarify training, contractor controls, cloud systems and monitoring.",
    ],
    sopRows: [
      ["Handle a data breach", "DPO / headteacher", "Confirm triage, ICO assessment and notification process."],
      ["Respond to a SAR", "DPO / admin lead", "Confirm identity checks, deadline and redaction route."],
      ["Approve data sharing", "DPO / system owner", "Confirm lawful basis and agreement checklist."],
    ],
  },
  "privacy-notices": {
    purpose:
      "explains what personal data the school collects, why it is used, who it is shared with and what rights people have.",
    localQuestions: [
      "Which notices are needed for pupils, parents, staff, governors and visitors?",
      "How are notices published and issued at data collection points?",
      "Who checks third-party sharing and retention details?",
    ],
    operatingControls: [
      "Describe data categories, purposes, lawful bases and retention.",
      "Explain recipients, statutory returns, processors and international transfer checks.",
      "Set out individual rights, DPO contact details and complaint routes.",
      "Clarify publication, accessibility and annual review controls.",
    ],
    sopRows: [
      ["Issue privacy notice", "Admin lead", "Confirm enrolment, recruitment and website publication route."],
      ["Review data sharing list", "DPO / SBM", "Confirm processor register and statutory returns list."],
      ["Update contact details", "DPO", "Confirm website and document version update process."],
    ],
  },
  "foi-publication-scheme": {
    purpose:
      "sets out the information the school routinely makes available and how people can request information.",
    localQuestions: [
      "Where is the publication scheme and guide to information published?",
      "Who handles FOI requests and logs deadlines?",
      "Which information is free and which may incur a charge?",
    ],
    operatingControls: [
      "Adopt the ICO model publication scheme and publish a guide to information.",
      "Explain classes of information, formats, charges and request process.",
      "Clarify FOI/EIR handling, exemptions, timescales and review routes.",
      "Set out ownership, website checks and governance review.",
    ],
    sopRows: [
      ["Log an FOI request", "FOI lead / DPO", "Confirm deadline tracker and acknowledgement template."],
      ["Review publication scheme", "Clerk / SBM", "Confirm annual website evidence check."],
      ["Apply exemption review", "DPO / headteacher", "Confirm senior review and response wording route."],
    ],
  },
  "health-safety-policy": {
    purpose:
      "sets out responsibilities and arrangements for managing health and safety risks across the school.",
    localQuestions: [
      "Who is the competent health and safety adviser?",
      "Where are risk assessments, inspections and accident records stored?",
      "Which estates checks are delegated to contractors or the local authority?",
    ],
    operatingControls: [
      "Define employer, governing body, headteacher, staff, visitor and contractor responsibilities.",
      "Set arrangements for risk assessments, accident reporting, premises checks and emergency planning.",
      "Explain training, supervision, safe systems of work and statutory inspection records.",
      "Clarify monitoring, audits, governor reporting and escalation of hazards.",
    ],
    sopRows: [
      ["Report an accident or near miss", "All staff / first aid lead", "Confirm form, RIDDOR triage and review owner."],
      ["Complete site inspection", "Site manager / SBM", "Confirm frequency and action tracker."],
      ["Approve risk assessment", "Headteacher / competent person", "Confirm template and review trigger."],
    ],
  },
  "accessibility-plan": {
    purpose:
      "plans how the school improves access to the curriculum, physical environment and information for disabled pupils.",
    localQuestions: [
      "What barriers have been identified from pupil, parent and staff voice?",
      "Which physical access improvements are planned and funded?",
      "How is accessible information provided?",
    ],
    operatingControls: [
      "Set objectives for curriculum access, premises access and accessible information.",
      "Explain consultation, equality analysis, SEND links and reasonable adjustments.",
      "Describe timescales, responsible owners, resources and success measures.",
      "Clarify publication, review and governor monitoring over a three-year cycle.",
    ],
    sopRows: [
      ["Review accessibility barriers", "SENCO / site manager", "Confirm pupil/parent voice and premises evidence."],
      ["Update action plan", "Headteacher / governors", "Confirm owners, dates and budget route."],
      ["Publish accessible information", "Office / SENCO", "Confirm alternative formats and website route."],
    ],
  },
  "equality-information-objectives": {
    purpose:
      "publishes equality information and objectives showing how the school meets the public sector equality duty.",
    localQuestions: [
      "Which equality objectives are current and measurable?",
      "What pupil/staff/community data informs the objectives?",
      "How are objectives monitored by governors?",
    ],
    operatingControls: [
      "Explain the public sector equality duty and protected characteristics.",
      "Publish relevant equality information and measurable objectives.",
      "Describe curriculum, behaviour, recruitment and accessibility links.",
      "Clarify consultation, publication, monitoring and review arrangements.",
    ],
    sopRows: [
      ["Refresh equality data", "Headteacher / DPO", "Confirm anonymisation and publication checks."],
      ["Review objectives", "Governors / SLT", "Confirm success measures and update cycle."],
      ["Investigate equality concern", "Headteacher / DSL", "Confirm record route and follow-up action."],
    ],
  },
  "admissions-arrangements": {
    purpose:
      "sets out how admission applications are handled fairly, transparently and in line with the admissions code.",
    localQuestions: [
      "Who is the admission authority for this school?",
      "What are the oversubscription criteria and published admission number?",
      "How are in-year applications and appeals handled?",
    ],
    operatingControls: [
      "Define admission authority, PAN, oversubscription criteria and consultation/publication duties.",
      "Explain normal round, in-year admissions, waiting lists and appeals.",
      "Clarify fair access, looked-after children and priority arrangements.",
      "Set out record keeping, website publication and annual determination.",
    ],
    sopRows: [
      ["Determine arrangements", "Admission authority / governors", "Confirm consultation and publication deadlines."],
      ["Process in-year application", "Admissions officer", "Confirm LA coordination and response timescale."],
      ["Prepare appeal papers", "Admissions officer / clerk", "Confirm evidence pack and panel route."],
    ],
  },
  "pay-policy": {
    purpose:
      "sets out how teachers' pay decisions are made fairly, consistently and in line with the current pay framework.",
    localQuestions: [
      "Which committee makes pay decisions and hears appeals?",
      "How are appraisal outcomes and pay progression linked?",
      "Which local authority or trust model clauses should be retained?",
    ],
    operatingControls: [
      "Define pay ranges, allowances, leadership pay and part-time/supply considerations.",
      "Explain annual pay review, progression evidence, appraisal links and appeals.",
      "Set out equalities, confidentiality, records and governor decision-making.",
      "Clarify consultation, union engagement and annual STPCD updates.",
    ],
    sopRows: [
      ["Prepare annual pay review", "Headteacher / SBM", "Confirm data, deadlines and committee papers."],
      ["Record pay decision", "Pay committee / clerk", "Confirm minutes, letters and payroll instruction."],
      ["Handle pay appeal", "Appeals committee", "Confirm independence and evidence bundle."],
    ],
  },
  "staff-discipline-conduct": {
    purpose:
      "sets expectations for staff conduct and provides fair disciplinary and grievance procedures.",
    localQuestions: [
      "Which local authority model procedure applies?",
      "Who investigates, chairs hearings and hears appeals?",
      "How are safeguarding allegations routed separately when needed?",
    ],
    operatingControls: [
      "Set standards of professional conduct, confidentiality, relationships and use of technology.",
      "Explain informal resolution, investigation, suspension, hearings, outcomes and appeals.",
      "Describe grievance stages, mediation, records and support for staff.",
      "Clarify safeguarding allegation links, union representation and confidentiality.",
    ],
    sopRows: [
      ["Triage staff conduct concern", "Headteacher / HR adviser", "Confirm safeguarding/LADO decision point."],
      ["Run disciplinary investigation", "Investigating officer", "Confirm terms of reference and evidence bundle."],
      ["Hear grievance", "Headteacher / governors", "Confirm stages, meeting notes and outcome letter."],
    ],
  },
  "whistleblowing-policy": {
    purpose:
      "gives staff and others a safe route to raise serious concerns in the public interest.",
    localQuestions: [
      "Who is the nominated whistleblowing contact and governor contact?",
      "How can concerns be raised outside line management?",
      "How are confidentiality, protection and feedback handled?",
    ],
    operatingControls: [
      "Define qualifying whistleblowing concerns and distinguish grievances/complaints.",
      "Explain internal reporting routes, external prescribed persons and emergency routes.",
      "Set out confidentiality, protection from detriment, investigation and feedback.",
      "Clarify records, governor oversight and links to safeguarding or fraud routes.",
    ],
    sopRows: [
      ["Receive whistleblowing concern", "Headteacher / chair of governors", "Confirm confidential log and conflict route."],
      ["Investigate concern", "Nominated investigator", "Confirm scope, evidence and protection checks."],
      ["Close and report learning", "Governors / SLT", "Confirm anonymised governance reporting."],
    ],
  },
};

export function listStarterPolicyPacks(): PolicyRequirement[] {
  return MAINTAINED_PRIMARY_POLICY_REQUIREMENTS;
}

export function getStarterPolicyRequirement(
  requirementId: string,
): PolicyRequirement | null {
  return (
    MAINTAINED_PRIMARY_POLICY_REQUIREMENTS.find(
      (requirement) => requirement.id === requirementId,
    ) || null
  );
}

export function getStarterPolicySources(
  requirementOrId: PolicyRequirement | string,
): PolicyQualitySource[] {
  const requirement =
    typeof requirementOrId === "string"
      ? getStarterPolicyRequirement(requirementOrId)
      : requirementOrId;

  return (
    requirement?.sourceRefs.map((sourceRef) => {
      const source = SOURCE_LIBRARY[sourceRef] || DEFAULT_SOURCE;
      return {
        ...source,
        id: slugify(`${sourceRef}-${source.publisher}`),
        lastChecked: LAST_CHECKED,
      };
    }) || []
  );
}

export function buildStarterPolicyDraftPreview({
  requirementId,
  mode,
  schoolName,
  schoolLogoUrl,
  primaryColor,
  approvalBody,
  reviewCycle,
  nextReviewDate,
  existingFileName,
  weakAreas = [],
}: StarterPolicyDraftInput): StarterPolicyDraftPreview | null {
  const requirement = getStarterPolicyRequirement(requirementId);
  if (!requirement) return null;

  const draft = buildStarterPolicyDraft({
    requirement,
    schoolName,
    schoolLogoUrl,
    primaryColor,
    approvalBody,
    reviewCycle,
    nextReviewDate,
    weakAreas,
  });

  const title =
    mode === "missing_policy"
      ? `New ${requirement.canonicalName} draft`
      : `Enhanced ${requirement.canonicalName} draft`;
  const summary =
    mode === "missing_policy"
      ? `Schoolgle has generated a source-backed starter ${requirement.canonicalName} because no current policy was matched in the connected Policies folder.`
      : `Schoolgle has generated a source-backed enhanced draft for ${existingFileName || `the current ${requirement.canonicalName}`}${weakAreas.length ? `, focused on: ${weakAreas.join(", ")}.` : "."}`;

  return { title, summary, draft };
}

function buildStarterPolicyDraft({
  requirement,
  schoolName,
  schoolLogoUrl,
  primaryColor = "#7c3aed",
  approvalBody,
  reviewCycle,
  nextReviewDate = "1 September 2026",
  weakAreas = [],
}: {
  requirement: PolicyRequirement;
  schoolName: string;
  schoolLogoUrl?: string;
  primaryColor?: string;
  approvalBody?: string;
  reviewCycle?: string;
  nextReviewDate?: string;
  weakAreas?: string[];
}): StarterPolicyDraft {
  const blueprint = BLUEPRINTS[requirement.id];
  const sources = getStarterPolicySources(requirement);
  const approval = approvalBody || requirement.approvalHint;
  const review = reviewCycle || formatReviewCycle(requirement.reviewCycle);
  const sections = buildPolicySections({
    blueprint,
    requirement,
    schoolName,
    approval,
    review,
    nextReviewDate,
    sources,
    weakAreas,
  });
  const markdown = buildMarkdown({
    approval,
    nextReviewDate,
    requirement,
    review,
    schoolName,
    sections,
    sources,
  });

  return {
    title: requirement.canonicalName,
    markdown,
    formattedHtml: buildFormattedPolicyHtml({
      approval,
      blueprint,
      nextReviewDate,
      primaryColor,
      requirement,
      review,
      schoolLogoUrl,
      schoolName,
      sections,
      sources,
    }),
    downloadFileName: `${slugify(schoolName)}-${slugify(requirement.canonicalName)}-draft.doc`,
    sources,
    assumptions: [
      "This is a source-backed school-review starter draft, not legal advice.",
      "School leaders must check local authority, trust, diocese, union and local safeguarding requirements before approval.",
      "The connected Drive/SharePoint source file remains the approved evidence until leaders approve and publish a Schoolgle-managed version.",
      "Named roles, local systems, dates, committee routes and contact details should be confirmed before publication.",
    ],
  };
}

function buildPolicySections({
  blueprint,
  requirement,
  schoolName,
  approval,
  review,
  nextReviewDate,
  sources,
  weakAreas,
}: {
  blueprint: StarterPolicyBlueprint;
  requirement: PolicyRequirement;
  schoolName: string;
  approval: string;
  review: string;
  nextReviewDate: string;
  sources: PolicyQualitySource[];
  weakAreas: string[];
}) {
  return [
    {
      heading: "Purpose and scope",
      body: `${schoolName} uses this ${requirement.canonicalName} to ${blueprint.purpose} It applies to staff, governors, pupils, parents, visitors and relevant contractors where their work connects to the school.`,
    },
    {
      heading: "Sources checked",
      body: `This starter draft has been prepared against ${sources.map((source) => source.title).join(", ")}. It should be checked against any local authority, trust, diocesan, union or service-level model wording before approval.`,
    },
    {
      heading: "Roles and responsibilities",
      body: `The headteacher is responsible for day-to-day implementation. Staff follow the procedures in this policy and report concerns through the agreed route. Governors approve or monitor the policy through ${approval}. Leaders should confirm named owners before this draft is adopted.`,
    },
    {
      heading: "Core operating controls",
      body: blueprint.operatingControls.map((control) => `• ${control}`).join("\n"),
    },
    {
      heading: "Local adaptation questions",
      body: blueprint.localQuestions.map((question) => `• ${question}`).join("\n"),
    },
    {
      heading: "Schoolgle enhancement focus",
      body: weakAreas.length
        ? weakAreas.map((area) => `• Strengthen: ${area}`).join("\n")
        : "• Confirm local names, systems, forms, dates and governor committee routes.\n• Check website publication requirements and evidence links.\n• Link this policy to related Schoolgle policies so missing dependencies are visible.",
    },
    {
      heading: "Records, publication and evidence",
      body: "The school should keep a controlled copy, approval record, review history, related minutes and evidence of implementation. Where the policy must be published, leaders should confirm the website version matches the approved version.",
    },
    {
      heading: "Approval and review",
      body: `This draft is prepared for ${approval}. The review cycle is ${review}. The next review date is ${nextReviewDate}, or earlier if statutory guidance, local arrangements or school risk changes.`,
    },
  ];
}

function buildMarkdown({
  approval,
  nextReviewDate,
  requirement,
  review,
  schoolName,
  sections,
  sources,
}: {
  approval: string;
  nextReviewDate: string;
  requirement: PolicyRequirement;
  review: string;
  schoolName: string;
  sections: { heading: string; body: string }[];
  sources: PolicyQualitySource[];
}) {
  return `
# ${requirement.canonicalName}

**School:** ${schoolName}
**Approval route:** ${approval}
**Review cycle:** ${review}
**Next review:** ${nextReviewDate}

${sections
  .map((section, index) => `## ${index + 1}. ${section.heading}\n\n${section.body}`)
  .join("\n\n")}

## Source references

${sources.map((source) => `- ${source.title} — ${source.publisher} (${source.url})`).join("\n")}
`.trim();
}

function buildFormattedPolicyHtml({
  approval,
  blueprint,
  nextReviewDate,
  primaryColor,
  requirement,
  review,
  schoolLogoUrl,
  schoolName,
  sections,
  sources,
}: {
  approval: string;
  blueprint: StarterPolicyBlueprint;
  nextReviewDate: string;
  primaryColor: string;
  requirement: PolicyRequirement;
  review: string;
  schoolLogoUrl?: string;
  schoolName: string;
  sections: { heading: string; body: string }[];
  sources: PolicyQualitySource[];
}) {
  const escapedSchool = escapeHtml(schoolName);
  const escapedTitle = escapeHtml(requirement.canonicalName);
  const escapedColor = escapeHtml(primaryColor);
  const generatedDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapedSchool} ${escapedTitle}</title>
  <style>
    @page { margin: 18mm 16mm 20mm; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #eef2ff; color: #172033; font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.55; }
    .page { width: 210mm; min-height: 297mm; margin: 18px auto; background: #fff; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14); overflow: hidden; }
    .cover { min-height: 297mm; display: flex; flex-direction: column; justify-content: space-between; padding: 28mm 24mm; background: radial-gradient(circle at 85% 18%, rgba(124, 58, 237, 0.15), transparent 30%), linear-gradient(135deg, #ffffff 0%, #f8fafc 65%, #f3e8ff 100%); border-top: 9mm solid ${escapedColor}; }
    .logo { max-width: 34mm; max-height: 28mm; object-fit: contain; margin-bottom: 12mm; }
    .eyebrow { color: ${escapedColor}; font-size: 10pt; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; }
    h1 { margin: 8mm 0 3mm; color: #0f172a; font-size: 33pt; line-height: 1.05; letter-spacing: -0.04em; }
    .subtitle { max-width: 150mm; color: #475569; font-size: 13pt; }
    .card { border: 1px solid #e2e8f0; border-radius: 14px; background: rgba(255,255,255,0.88); padding: 8mm; }
    .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 4mm; margin-top: 10mm; }
    .meta-label { color: #64748b; display: block; font-size: 8pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
    .meta-value { color: #0f172a; display: block; font-size: 11pt; font-weight: 700; margin-top: 1mm; }
    .body { padding: 18mm 20mm 20mm; }
    .section { break-inside: avoid; margin-bottom: 8mm; }
    h2 { border-bottom: 2px solid #e2e8f0; color: #0f172a; font-size: 17pt; margin: 0 0 5mm; padding-bottom: 2mm; }
    .contents ol { columns: 2; column-gap: 12mm; margin: 0; padding-left: 6mm; }
    .contents li { margin-bottom: 2mm; }
    .body-text { white-space: pre-line; }
    table { border-collapse: collapse; margin: 4mm 0 7mm; width: 100%; }
    th, td { border: 1px solid #dbe4ef; padding: 3mm; text-align: left; vertical-align: top; }
    th { background: #f8fafc; color: #334155; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em; }
    .source-list li { margin-bottom: 2.5mm; }
    .source-list a { color: ${escapedColor}; overflow-wrap: anywhere; }
    .note { background: #f8fafc; border-left: 4px solid ${escapedColor}; padding: 4mm; color: #475569; }
    .footer { border-top: 1px solid #e2e8f0; color: #64748b; font-size: 9pt; margin-top: 8mm; padding-top: 4mm; }
    @media print { body { background: #fff; } .page { box-shadow: none; margin: 0; width: auto; } }
  </style>
</head>
<body>
  <article class="page">
    <section class="cover schoolgle-policy-cover">
      <div>
        ${schoolLogoUrl ? `<img class="logo" src="${escapeHtml(schoolLogoUrl)}" alt="${escapedSchool} logo" />` : ""}
        <div class="eyebrow">Schoolgle Managed Policy Draft</div>
        <h1>${escapedTitle}</h1>
        <p class="subtitle">${escapedSchool} starter policy prepared from official-source references for school review, adaptation and approval.</p>
        <div class="meta-grid">
          <div class="card"><span class="meta-label">School</span><span class="meta-value">${escapedSchool}</span></div>
          <div class="card"><span class="meta-label">Approval Route</span><span class="meta-value">${escapeHtml(approval)}</span></div>
          <div class="card"><span class="meta-label">Review Cycle</span><span class="meta-value">${escapeHtml(review)}</span></div>
          <div class="card"><span class="meta-label">Next Review</span><span class="meta-value">${escapeHtml(nextReviewDate)}</span></div>
        </div>
      </div>
      <div class="card">
        <span class="meta-label">Generated</span>
        <span class="meta-value">${generatedDate}</span>
        <p>This document is a starter draft. It must be checked by school leaders before approval and publication.</p>
      </div>
    </section>
    <section class="body">
      <div class="section contents">
        <h2>Contents</h2>
        <ol>
          ${sections.map((section) => `<li>${escapeHtml(section.heading)}</li>`).join("")}
          <li>Standard operating procedures</li>
          <li>Source references</li>
        </ol>
      </div>
      ${sections
        .map(
          (section) => `<div class="section">
        <h2>${escapeHtml(section.heading)}</h2>
        <p class="body-text">${escapeHtml(section.body)}</p>
      </div>`,
        )
        .join("")}
      <div class="section">
        <h2>Standard operating procedures</h2>
        <table>
          <thead><tr><th>Procedure</th><th>Owner</th><th>Set-up prompt</th></tr></thead>
          <tbody>
            ${blueprint.sopRows
              .map(
                ([procedure, owner, setupPrompt]) =>
                  `<tr><td>${escapeHtml(procedure)}</td><td>${escapeHtml(owner)}</td><td>${escapeHtml(setupPrompt)}</td></tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="section">
        <h2>Source references</h2>
        <ul class="source-list">
          ${sources
            .map(
              (source) =>
                `<li><strong>${escapeHtml(source.title)}</strong> — ${escapeHtml(source.publisher)}. <a href="${escapeHtml(source.url)}">${escapeHtml(source.url)}</a></li>`,
            )
            .join("")}
        </ul>
        <p class="note">Schoolgle uses these sources to create a review-ready starter draft. Approval remains a school governance decision.</p>
      </div>
      <div class="footer">${escapedSchool} · ${escapedTitle} · Schoolgle managed policy draft</div>
    </section>
  </article>
</body>
</html>`;
}

function formatReviewCycle(reviewCycle: PolicyRequirement["reviewCycle"]) {
  switch (reviewCycle) {
    case "two_yearly":
      return "Two-yearly";
    case "three_yearly":
      return "Three-yearly";
    case "on_change":
      return "On statutory or local change";
    case "annual":
    default:
      return "Annual";
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
