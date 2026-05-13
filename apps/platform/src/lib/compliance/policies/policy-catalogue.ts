export type SchoolPolicyContext =
  | "maintained_primary"
  | "maintained_secondary"
  | "academy_primary"
  | "academy_secondary"
  | "trust";

export type PolicyRequirementLevel =
  | "statutory"
  | "recommended"
  | "trust_required"
  | "school_custom";

export type PolicyReviewCycle = "annual" | "two_yearly" | "three_yearly" | "on_change";

export type PolicyRequirement = {
  id: string;
  canonicalName: string;
  level: PolicyRequirementLevel;
  domain:
    | "safeguarding"
    | "behaviour_attendance"
    | "send_inclusion"
    | "curriculum"
    | "governance"
    | "hr"
    | "data_protection"
    | "health_safety"
    | "finance"
    | "admissions";
  appliesTo: SchoolPolicyContext[];
  aliases: string[];
  reviewCycle: PolicyReviewCycle;
  approvalHint: string;
  sourceRefs: string[];
};

export const MAINTAINED_PRIMARY_POLICY_REQUIREMENTS: PolicyRequirement[] = [
  {
    id: "child-protection-safeguarding",
    canonicalName: "Child Protection and Safeguarding Policy",
    level: "statutory",
    domain: "safeguarding",
    appliesTo: ["maintained_primary"],
    aliases: ["safeguarding", "child protection", "kcsie", "keeping children safe"],
    reviewCycle: "annual",
    approvalHint: "Governing body / safeguarding governor",
    sourceRefs: ["DfE Keeping children safe in education", "Working together to safeguard children"],
  },
  {
    id: "behaviour-policy",
    canonicalName: "Behaviour Policy",
    level: "statutory",
    domain: "behaviour_attendance",
    appliesTo: ["maintained_primary"],
    aliases: ["behaviour", "positive behaviour", "discipline", "relationships policy"],
    reviewCycle: "annual",
    approvalHint: "Governing body",
    sourceRefs: ["DfE behaviour in schools", "Maintained schools governance guide"],
  },
  {
    id: "anti-bullying-policy",
    canonicalName: "Anti-bullying Policy",
    level: "recommended",
    domain: "behaviour_attendance",
    appliesTo: ["maintained_primary"],
    aliases: ["anti bullying", "bullying prevention", "bullying"],
    reviewCycle: "annual",
    approvalHint: "Headteacher / governing body",
    sourceRefs: ["DfE preventing and tackling bullying"],
  },
  {
    id: "attendance-policy",
    canonicalName: "Attendance Policy",
    level: "recommended",
    domain: "behaviour_attendance",
    appliesTo: ["maintained_primary"],
    aliases: ["attendance", "absence", "persistent absence"],
    reviewCycle: "annual",
    approvalHint: "Headteacher / governing body",
    sourceRefs: ["Working together to improve school attendance"],
  },
  {
    id: "send-policy",
    canonicalName: "SEND Policy",
    level: "statutory",
    domain: "send_inclusion",
    appliesTo: ["maintained_primary"],
    aliases: ["send", "sen", "special educational needs", "senco", "inclusion"],
    reviewCycle: "annual",
    approvalHint: "Governing body / SEN governor",
    sourceRefs: ["SEND code of practice", "Children and Families Act duties"],
  },
  {
    id: "supporting-pupils-medical-conditions",
    canonicalName: "Supporting Pupils with Medical Conditions Policy",
    level: "statutory",
    domain: "health_safety",
    appliesTo: ["maintained_primary"],
    aliases: ["medical conditions", "medical needs", "medicines", "administering medicines", "health care plan"],
    reviewCycle: "annual",
    approvalHint: "Governing body",
    sourceRefs: ["DfE supporting pupils with medical conditions at school"],
  },
  {
    id: "relationships-health-education",
    canonicalName: "Relationships and Health Education Policy",
    level: "statutory",
    domain: "curriculum",
    appliesTo: ["maintained_primary"],
    aliases: ["rhe", "rshe", "relationships education", "health education", "rse"],
    reviewCycle: "annual",
    approvalHint: "Governing body after consultation",
    sourceRefs: ["DfE relationships, sex and health education statutory guidance"],
  },
  {
    id: "curriculum-policy",
    canonicalName: "Curriculum Policy",
    level: "recommended",
    domain: "curriculum",
    appliesTo: ["maintained_primary"],
    aliases: ["curriculum", "teaching and learning", "curriculum intent"],
    reviewCycle: "annual",
    approvalHint: "Headteacher / governing body",
    sourceRefs: ["National curriculum in England", "Maintained schools governance guide"],
  },
  {
    id: "complaints-procedure",
    canonicalName: "Complaints Procedure",
    level: "statutory",
    domain: "governance",
    appliesTo: ["maintained_primary"],
    aliases: ["complaints", "complaints policy", "complaints procedure", "serial complaints"],
    reviewCycle: "on_change",
    approvalHint: "Governing body",
    sourceRefs: ["Maintained schools governance guide", "DfE school complaints procedures guidance"],
  },
  {
    id: "charging-remissions",
    canonicalName: "Charging and Remissions Policy",
    level: "statutory",
    domain: "finance",
    appliesTo: ["maintained_primary"],
    aliases: ["charging", "remissions", "charging and remissions", "school trips charging"],
    reviewCycle: "annual",
    approvalHint: "Governing body",
    sourceRefs: ["Education Act charging duties", "Maintained schools governance guide"],
  },
  {
    id: "data-protection-policy",
    canonicalName: "Data Protection Policy",
    level: "statutory",
    domain: "data_protection",
    appliesTo: ["maintained_primary"],
    aliases: ["data protection", "gdpr", "uk gdpr", "privacy", "information governance"],
    reviewCycle: "annual",
    approvalHint: "Headteacher / governing body / DPO",
    sourceRefs: ["DfE data protection in schools", "UK GDPR", "Data Protection Act 2018"],
  },
  {
    id: "privacy-notices",
    canonicalName: "Privacy Notices",
    level: "statutory",
    domain: "data_protection",
    appliesTo: ["maintained_primary"],
    aliases: ["privacy notice", "privacy notices", "pupil privacy", "workforce privacy", "parent privacy"],
    reviewCycle: "annual",
    approvalHint: "DPO / school leadership",
    sourceRefs: ["DfE data protection in schools", "ICO accountability guidance"],
  },
  {
    id: "foi-publication-scheme",
    canonicalName: "Freedom of Information Publication Scheme",
    level: "statutory",
    domain: "data_protection",
    appliesTo: ["maintained_primary"],
    aliases: ["freedom of information", "foi", "publication scheme", "guide to information"],
    reviewCycle: "on_change",
    approvalHint: "Governing body / school leadership",
    sourceRefs: ["ICO model publication scheme"],
  },
  {
    id: "health-safety-policy",
    canonicalName: "Health and Safety Policy",
    level: "statutory",
    domain: "health_safety",
    appliesTo: ["maintained_primary"],
    aliases: ["health and safety", "h&s", "safety policy"],
    reviewCycle: "annual",
    approvalHint: "Governing body",
    sourceRefs: ["Health and Safety at Work etc. Act", "Maintained schools governance guide"],
  },
  {
    id: "accessibility-plan",
    canonicalName: "Accessibility Plan",
    level: "statutory",
    domain: "send_inclusion",
    appliesTo: ["maintained_primary"],
    aliases: ["accessibility", "accessibility plan", "disability access"],
    reviewCycle: "three_yearly",
    approvalHint: "Governing body",
    sourceRefs: ["Equality Act 2010", "Maintained schools governance guide"],
  },
  {
    id: "equality-information-objectives",
    canonicalName: "Equality Information and Objectives",
    level: "statutory",
    domain: "governance",
    appliesTo: ["maintained_primary"],
    aliases: ["equality objectives", "equality information", "public sector equality duty", "equality policy"],
    reviewCycle: "annual",
    approvalHint: "Governing body",
    sourceRefs: ["Equality Act 2010", "Public Sector Equality Duty"],
  },
  {
    id: "admissions-arrangements",
    canonicalName: "Admissions Arrangements",
    level: "statutory",
    domain: "admissions",
    appliesTo: ["maintained_primary"],
    aliases: ["admissions", "admission arrangements", "school admissions"],
    reviewCycle: "annual",
    approvalHint: "Admission authority / governing body as applicable",
    sourceRefs: ["School admissions code", "School admission appeals code"],
  },
  {
    id: "pay-policy",
    canonicalName: "Teachers' Pay Policy",
    level: "statutory",
    domain: "hr",
    appliesTo: ["maintained_primary"],
    aliases: ["pay policy", "teachers pay", "stpcd", "school teachers pay"],
    reviewCycle: "annual",
    approvalHint: "Governing body / pay committee",
    sourceRefs: ["School teachers' pay and conditions"],
  },
  {
    id: "staff-discipline-conduct",
    canonicalName: "Staff Discipline, Conduct and Grievance Procedures",
    level: "statutory",
    domain: "hr",
    appliesTo: ["maintained_primary"],
    aliases: ["staff discipline", "staff conduct", "grievance", "disciplinary", "code of conduct"],
    reviewCycle: "annual",
    approvalHint: "Governing body",
    sourceRefs: ["Maintained schools governance guide", "Employment law duties"],
  },
  {
    id: "whistleblowing-policy",
    canonicalName: "Whistleblowing Policy",
    level: "recommended",
    domain: "governance",
    appliesTo: ["maintained_primary"],
    aliases: ["whistleblowing", "speak up", "confidential reporting"],
    reviewCycle: "annual",
    approvalHint: "Governing body",
    sourceRefs: ["Maintained schools governance guide", "Good governance practice"],
  },
];

export function getPolicyRequirementsForContext(
  context: SchoolPolicyContext,
): PolicyRequirement[] {
  return MAINTAINED_PRIMARY_POLICY_REQUIREMENTS.filter((requirement) =>
    requirement.appliesTo.includes(context),
  );
}
