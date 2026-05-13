import { SEED_TEMPLATES } from "./seed-templates";
import type { SeedTemplate } from "./seed-templates";
import type { ComplianceItem, TemplateCategory } from "./types";

function items(phrases: string[], category = "Assurance"): ComplianceItem[] {
  return phrases.map((phrase, orderIndex) => ({
    phrase,
    category,
    is_critical: true,
    order_index: orderIndex,
  }));
}

function template(
  name: string,
  category: TemplateCategory,
  description: string,
  checklist: string[],
  policyRefs: string[],
): SeedTemplate {
  return {
    name,
    category,
    description,
    opening_script: [
      "Thank you for joining. The purpose of this meeting is to confirm the key assurance points, capture evidence, and agree actions.",
    ],
    closing_script: [
      "Before we close, can we confirm what has been agreed, who owns each action, the due dates, and any evidence still needed?",
    ],
    compliance_items: items(checklist),
    preparation_guide: {
      context_prompts: [
        "Review the current record, risk register, open actions, and any relevant local policy before the meeting.",
        "Identify the named responsible person or appointed competent expert who can give assurance.",
      ],
      documents_needed: [
        "Current policy or procedure",
        "Latest risk assessment or review record",
        "Open action log",
        "Relevant evidence documents",
      ],
      key_phrases: checklist,
      policy_refs: policyRefs,
    },
  };
}

export const CROSS_DEPARTMENT_MEETING_TEMPLATES: SeedTemplate[] = [
  template(
    "Disciplinary Investigation Meeting",
    "hr",
    "Structured HR meeting to establish facts, evidence, support needs, and next steps before any formal decision is made.",
    [
      "Confirm the purpose of the investigation meeting and that no decision has been made yet.",
      "Confirm the employee understands the allegation or concern being discussed.",
      "Ask the employee for their account and any evidence or witnesses they want considered.",
      "Confirm whether any support, representation, or reasonable adjustment is needed.",
      "Explain the next steps, expected timescale, and how notes will be shared.",
    ],
    ["ACAS Code of Practice on disciplinary and grievance procedures"],
  ),
  template(
    "Flexible Working Request Meeting",
    "hr",
    "Meeting to discuss a statutory flexible working request, explore impact, alternatives, and record a fair decision trail.",
    [
      "Confirm the flexible working request being considered and the employee's desired start date.",
      "Discuss how the proposed arrangement could work in practice.",
      "Explore impact on pupils, colleagues, timetable, safeguarding, and service delivery.",
      "Consider alternatives if the original request cannot be agreed in full.",
      "Confirm decision route, appeal rights, and response timescale.",
    ],
    ["Employment Relations (Flexible Working) Act 2023", "ACAS flexible working Code of Practice"],
  ),
  template(
    "Safeguarding Case Strategy Review",
    "safeguarding",
    "DSL-led meeting to confirm risk, chronology, referrals, information sharing, immediate protection actions, and review dates.",
    [
      "Confirm the safeguarding concern, chronology, and current level of risk.",
      "Confirm whether children's social care, police, or other agencies have been contacted.",
      "Record the rationale for information shared or withheld.",
      "Agree immediate protective actions and who is responsible.",
      "Set the review date and escalation trigger if risk changes.",
    ],
    ["Keeping children safe in education", "Working Together to Safeguard Children", "UK GDPR / Data Protection Act 2018"],
  ),
  template(
    "SEND EHCP Annual Review",
    "send",
    "Annual review meeting to gather views, review outcomes, evidence progress, and agree amendments or next steps.",
    [
      "Confirm pupil, parent/carer, school, and professional views have been gathered.",
      "Review progress against each EHCP outcome and supporting evidence.",
      "Confirm whether provision remains suitable, specific, and quantified.",
      "Agree recommended amendments, cease, maintain, or reassessment next steps.",
      "Confirm actions, owners, deadlines, and evidence to send to the local authority.",
    ],
    ["SEND Code of Practice 0 to 25 years", "Children and Families Act 2014", "Equality Act 2010"],
  ),
  template(
    "Full Governing Board Assurance Meeting",
    "governance",
    "Governance meeting focused on statutory oversight, challenge, decisions, conflicts, and evidence of board assurance.",
    [
      "Confirm quorum, apologies, declarations of interest, and any conflicts.",
      "Record key challenge questions asked by governors and responses from leaders.",
      "Confirm safeguarding, finance, curriculum, SEND, attendance, and risk assurance updates.",
      "Record decisions, approvals, delegated actions, and voting outcomes where needed.",
      "Confirm confidential items, publication status, and follow-up evidence required.",
    ],
    ["DfE Governance Handbook", "Academy Trust Handbook", "Keeping children safe in education"],
  ),
  template(
    "Estates Contractor Pre-start Assurance",
    "operational",
    "Pre-start meeting for works on site, helping non-specialist school leaders ask appointed experts the right assurance questions.",
    [
      "Confirm scope of works, working area, dates, site access, supervision, and school contact.",
      "Confirm contractor competence, insurance, DBS/safeguarding arrangements, and site induction.",
      "Confirm asbestos register has been reviewed for the work area before work starts.",
      "Confirm CDM roles, risk assessments, method statements, permits, and isolation requirements.",
      "Confirm fire, water, emergency, waste, noise, and pupil segregation controls.",
    ],
    ["Construction (Design and Management) Regulations 2015", "Control of Asbestos Regulations 2012", "HSE Managing contractors guidance"],
  ),
  template(
    "Water Safety Review",
    "operational",
    "Assurance meeting with the competent person or local authority lead to review legionella controls, testing, actions, and evidence.",
    [
      "Confirm the water risk assessment is current and still reflects the site.",
      "Confirm monitoring, flushing, temperature checks, and remedial actions are up to date.",
      "Confirm who is the responsible person and competent support for water safety.",
      "Confirm any non-compliance, risk rating, interim controls, and completion dates.",
      "Confirm evidence that should be uploaded against the compliance task.",
    ],
    ["HSE Approved Code of Practice L8", "HSG274 Legionnaires' disease technical guidance"],
  ),
  template(
    "Fire Risk Action Review",
    "operational",
    "Meeting to review the fire risk assessment action plan, statutory duties, responsible people, and evidence of completion.",
    [
      "Confirm the latest fire risk assessment date, assessor, and scope.",
      "Confirm all high and medium risk actions, owners, due dates, and current status.",
      "Confirm fire alarm, emergency lighting, evacuation, training, and drill evidence is current.",
      "Confirm any temporary controls needed while actions remain open.",
      "Confirm what evidence will be uploaded to close each compliance action.",
    ],
    ["Regulatory Reform (Fire Safety) Order 2005", "Fire Safety Act 2021"],
  ),
  template(
    "Project Handover and Asset Acceptance",
    "operational",
    "Practical completion handover to capture O&M manuals, certificates, warranties, commissioning, training, snags, and inspection schedules.",
    [
      "Confirm practical completion status, outstanding snags, defects period, and retention position.",
      "Confirm O&M manuals, warranties, commissioning certificates, and statutory certificates have been received.",
      "Confirm training has been completed for relevant site staff.",
      "Confirm new assets have been added to the asset register and inspection schedules.",
      "Agree owners and dates for unresolved defects, documentation gaps, and follow-up review.",
    ],
    ["CDM 2015 health and safety file duties", "School asset management good practice"],
  ),
  template(
    "Finance Budget Monitoring Review",
    "operational",
    "Budget monitoring meeting to review variance, forecast, risks, decisions, delegated approvals, and follow-up actions.",
    [
      "Confirm latest budget position, forecast outturn, and key variances.",
      "Confirm assumptions for staffing, grants, contracts, utilities, and pupil number changes.",
      "Agree corrective actions, budget virements, and approval route if needed.",
      "Confirm risks to reserves, deficit recovery, and value-for-money evidence.",
      "Record decisions, owners, due dates, and governor or trust reporting requirements.",
    ],
    ["Schools Financial Value Standard", "Academy Trust Handbook", "DfE Schools Resource Management guidance"],
  ),
  template(
    "Teaching and Learning Review",
    "teaching_learning",
    "Curriculum or phase review meeting to capture evidence, strengths, barriers, pupil impact, and improvement actions.",
    [
      "Confirm the focus area, evidence reviewed, and pupils or cohorts considered.",
      "Identify strengths and what evidence supports them.",
      "Identify barriers, gaps, or inconsistent practice.",
      "Agree improvement actions, owners, timescales, and success measures.",
      "Confirm what evidence will be reviewed at the next checkpoint.",
    ],
    ["Ofsted education inspection framework", "EEF implementation guidance"],
  ),
  template(
    "Parent Concern Resolution Meeting",
    "parents",
    "Structured parent meeting to clarify concerns, record the school's response, agree actions, and prevent drift into complaint escalation.",
    [
      "Confirm the concern being discussed and what outcome the parent is seeking.",
      "Give the parent/carer opportunity to explain their concern fully.",
      "Confirm the school's current understanding, evidence, and any limits on what can be shared.",
      "Agree practical actions, owners, communication route, and review date.",
      "Confirm complaint route if the parent remains dissatisfied.",
    ],
    ["School complaints policy", "DfE school complaints guidance"],
  ),
];

export const DEFAULT_MEETING_TEMPLATES: SeedTemplate[] = [
  ...SEED_TEMPLATES,
  ...CROSS_DEPARTMENT_MEETING_TEMPLATES,
];
