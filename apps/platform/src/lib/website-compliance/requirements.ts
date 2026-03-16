/**
 * UK School Website Statutory Requirements
 *
 * Complete checklist of what schools MUST publish on their websites,
 * based on:
 * - School Information (England) Regulations 2008 (as amended 2012, 2016, 2018, 2020, 2025)
 * - Academy Trust Handbook 2025
 * - Children and Families Act 2014
 * - Equality Act 2010
 * - Keeping Children Safe in Education (current edition)
 * - Education Act 1996, 2002
 * - Education and Inspections Act 2006
 * - SEND Code of Practice 2015
 * - School Admissions Code
 * - Relationships Education, RSE and Health Education Regulations 2019
 *
 * Each requirement has:
 * - Unique key for database storage
 * - Legislation reference
 * - What to look for on the website (keywords, page patterns)
 * - Whether it applies to maintained schools, academies, or both
 * - Review/update frequency requirement
 * - How to assess quality (not just presence)
 */

// ─── Types ────────────────────────────────────────────────────────

export type SchoolType = "maintained" | "academy" | "both";
export type SchoolPhase = "primary" | "secondary" | "all_through" | "all";
export type RequirementSeverity = "statutory" | "recommended" | "good_practice";
export type UpdateFrequency =
  | "as_needed"
  | "annually"
  | "by_date"
  | "every_4_years";

export interface ComplianceRequirement {
  /** Unique requirement key */
  key: string;
  /** Short name for display */
  name: string;
  /** Detailed description of what must be published */
  description: string;
  /** Ofsted category this maps to (if applicable) */
  ofstedCategory?: string;
  /** Ofsted subcategory this maps to (if applicable) */
  ofstedSubcategory?: string;
  /** Which school types this applies to */
  appliesTo: SchoolType;
  /** Severity level */
  severity: RequirementSeverity;
  /** Primary legislation/guidance */
  legislation: string[];
  /** How often this must be updated */
  updateFrequency: UpdateFrequency;
  /** Specific deadline (e.g. "31 December") */
  deadline?: string;
  /** Keywords to search for on website pages */
  searchKeywords: string[];
  /** URL path patterns that likely contain this content */
  urlPatterns: string[];
  /** Document types to look for (PDF titles, page headings) */
  documentPatterns: string[];
  /** What makes this compliant (for AI assessment) */
  complianceCriteria: string[];
  /** What makes this high quality (beyond just being present) */
  qualityCriteria: string[];
  /** Red flags that indicate problems */
  redFlags: string[];
  /** Sub-items that must be included within this requirement */
  subItems?: string[];
  /** For academies: this requirement is typically published on the trust website, not the school site */
  typicallyTrustLevel?: boolean;
  /** Only applies to church schools (VA/VC/C of E/Catholic) — detected by SIAMS signals */
  churchOnly?: boolean;
  /** School phase this applies to (default: "all") */
  phase?: SchoolPhase;
  /** Category for grouping in UI */
  category: RequirementCategory;
}

export type RequirementCategory =
  | "identity"
  | "admissions"
  | "curriculum"
  | "send"
  | "pupil_premium"
  | "pe_sport_premium"
  | "governance"
  | "safeguarding"
  | "online_safety"
  | "policies"
  | "performance_data"
  | "financial"
  | "equality"
  | "ofsted"
  | "careers"
  | "accessibility"
  | "siams";

export const REQUIREMENT_CATEGORY_LABELS: Record<RequirementCategory, string> =
  {
    identity: "School Identity & Contact",
    admissions: "Admissions",
    curriculum: "Curriculum",
    send: "SEND",
    pupil_premium: "Pupil Premium",
    pe_sport_premium: "PE & Sport Premium",
    governance: "Governance",
    safeguarding: "Safeguarding",
    online_safety: "Online Safety",
    policies: "Policies",
    performance_data: "Performance Data",
    financial: "Financial Information",
    equality: "Equality & Diversity",
    ofsted: "Ofsted",
    careers: "Careers (Secondary)",
    accessibility: "Accessibility",
    siams: "Church School (SIAMS)",
  };

// ─── Requirements ─────────────────────────────────────────────────

export const WEBSITE_COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  // ═══════════════════════════════════════════════════
  // SCHOOL IDENTITY & CONTACT
  // ═══════════════════════════════════════════════════
  {
    key: "contact_details",
    name: "Contact Details",
    description:
      "School name, postal address, telephone number, and name of staff member to handle enquiries.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Information (England) Regulations 2008"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "contact",
      "address",
      "telephone",
      "phone",
      "email",
      "enquiries",
      "office",
      "tel",
    ],
    urlPatterns: ["/contact", "/about", "/about-us", "/school-information"],
    documentPatterns: [],
    complianceCriteria: [
      "Full school name is displayed",
      "Postal address is complete with postcode",
      "Telephone number is present",
      "Contact name or role for enquiries is given",
    ],
    qualityCriteria: [
      "Email address provided",
      "Opening hours shown",
      "Map or directions available",
      "Different contacts for different departments",
    ],
    redFlags: ["No phone number", "Incomplete address", "No postcode"],
    category: "identity",
  },

  {
    key: "headteacher_name",
    name: "Headteacher Name",
    description: "Name of the headteacher (or principal/head of school).",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Information (England) Regulations 2008"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "headteacher",
      "head teacher",
      "principal",
      "head of school",
      "executive head",
    ],
    urlPatterns: [
      "/about",
      "/about-us",
      "/staff",
      "/leadership",
      "/our-team",
      "/senior-leadership",
    ],
    documentPatterns: [],
    complianceCriteria: [
      "Headteacher name is clearly stated",
      "Role/title is identified",
    ],
    qualityCriteria: [
      "Photo of headteacher",
      "Brief biography or welcome message",
      "Direct contact information",
    ],
    redFlags: ["No headteacher named anywhere on site"],
    category: "identity",
  },

  {
    key: "senco_details",
    name: "SENCO Name & Contact",
    description:
      "Name and contact details of the Special Educational Needs Coordinator (mainstream schools only).",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["SEN and Disability Regulations 2014"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "SENCO",
      "SEN coordinator",
      "special educational needs coordinator",
      "SEN contact",
      "inclusion lead",
    ],
    urlPatterns: [
      "/send",
      "/sen",
      "/special-educational-needs",
      "/inclusion",
      "/about/staff",
    ],
    documentPatterns: ["SEND Information Report", "SEN Policy"],
    complianceCriteria: [
      "SENCO is named",
      "Contact method is provided (email or phone)",
    ],
    qualityCriteria: [
      "SENCO qualifications mentioned",
      "How to make initial contact described",
      "Availability/appointment information",
    ],
    redFlags: ["No SENCO named", "Generic email only with no name"],
    category: "send",
  },

  // ═══════════════════════════════════════════════════
  // ADMISSIONS
  // ═══════════════════════════════════════════════════
  {
    key: "admission_arrangements",
    name: "Admission Arrangements",
    description:
      "Full admission arrangements for foundation/VA schools; link to LA page for community/VC schools.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Admissions Code 2021"],
    updateFrequency: "by_date",
    deadline: "15 March",
    searchKeywords: [
      "admissions",
      "admission arrangements",
      "admission policy",
      "oversubscription",
      "PAN",
      "published admission number",
      "apply for a place",
    ],
    urlPatterns: [
      "/admissions",
      "/admission",
      "/join-us",
      "/apply",
      "/parents/admissions",
    ],
    documentPatterns: [
      "Admission Policy",
      "Admissions Policy",
      "Admission Arrangements",
    ],
    complianceCriteria: [
      "Admission arrangements are published (or link to LA provided)",
      "Published Admission Number (PAN) is stated",
      "Oversubscription criteria are listed",
      "Current academic year arrangements shown",
    ],
    qualityCriteria: [
      "Clear step-by-step application process",
      "Key dates and deadlines shown",
      "In-year admission process explained",
      "Appeals information included",
      "Contact for admissions queries named",
    ],
    redFlags: [
      "No admissions information found",
      "Arrangements are for a previous academic year",
      "No oversubscription criteria listed",
    ],
    subItems: [
      "Published Admission Number (PAN)",
      "Oversubscription criteria",
      "Application process and dates",
    ],
    category: "admissions",
  },

  {
    key: "appeals_timetable",
    name: "Appeals Timetable",
    description: "Timetable for admission appeals.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Admission Appeals Code"],
    updateFrequency: "by_date",
    deadline: "28 February",
    searchKeywords: [
      "appeal",
      "appeals",
      "admission appeal",
      "appeal timetable",
      "appeal process",
    ],
    urlPatterns: ["/admissions", "/appeals", "/parents/admissions"],
    documentPatterns: ["Appeals Timetable", "Admission Appeals"],
    complianceCriteria: [
      "Appeals timetable is published",
      "Process for making an appeal is described",
    ],
    qualityCriteria: [
      "Specific dates given",
      "Step-by-step appeals process",
      "Contact details for appeals",
    ],
    redFlags: ["No appeals information", "Previous year timetable only"],
    category: "admissions",
  },

  {
    key: "in_year_admissions",
    name: "In-Year Admissions",
    description: "Information about in-year admissions process.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Admissions Code 2021"],
    updateFrequency: "by_date",
    deadline: "31 August",
    searchKeywords: [
      "in-year",
      "in year admission",
      "mid-year",
      "transfer",
      "moving schools",
    ],
    urlPatterns: ["/admissions", "/in-year-admissions", "/join-us"],
    documentPatterns: [],
    complianceCriteria: [
      "In-year admission process is described",
      "How to apply in-year is explained",
    ],
    qualityCriteria: [
      "Application form available or linked",
      "Waiting list information",
      "Timeline for processing applications",
    ],
    redFlags: ["No in-year admission information"],
    category: "admissions",
  },

  // ═══════════════════════════════════════════════════
  // CURRICULUM
  // ═══════════════════════════════════════════════════
  {
    key: "curriculum_content",
    name: "Curriculum Content",
    description:
      "Content of the curriculum in each academic year for every subject.",
    ofstedCategory: "quality-of-education",
    ofstedSubcategory: "education-curriculum",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Information (England) Regulations 2008"],
    updateFrequency: "annually",
    searchKeywords: [
      "curriculum",
      "subject",
      "year group",
      "what we teach",
      "learning",
      "topics",
      "curriculum overview",
      "long-term plan",
    ],
    urlPatterns: [
      "/curriculum",
      "/learning",
      "/subjects",
      "/teaching-and-learning",
      "/parents/curriculum",
    ],
    documentPatterns: [
      "Curriculum Overview",
      "Long Term Plan",
      "Curriculum Map",
    ],
    complianceCriteria: [
      "Curriculum content is published for each year group",
      "Subject-by-subject or topic-based breakdown is available",
      "Current academic year content is shown",
    ],
    qualityCriteria: [
      "Curriculum intent/vision explained",
      "Subject pages with detailed content",
      "Progression between year groups visible",
      "Cross-curricular links identified",
      "Assessment approach described per subject",
    ],
    redFlags: [
      "No curriculum information found",
      "Only a list of subjects with no content detail",
      "Content is for a previous academic year",
    ],
    subItems: ["Subject content per year group", "Curriculum overview or map"],
    category: "curriculum",
  },

  {
    key: "phonics_reading",
    name: "Phonics & Reading Schemes",
    description: "KS1 schools: list of phonics and reading schemes used.",
    ofstedCategory: "quality-of-education",
    ofstedSubcategory: "education-reading",
    appliesTo: "both",
    phase: "primary",
    severity: "statutory",
    legislation: ["School Information (England) Regulations 2008"],
    updateFrequency: "annually",
    searchKeywords: [
      "phonics",
      "reading scheme",
      "systematic synthetic phonics",
      "SSP",
      "reading programme",
      "book band",
      "decodable readers",
      "Little Wandle",
      "Read Write Inc",
      "Jolly Phonics",
      "Bug Club",
    ],
    urlPatterns: [
      "/curriculum/phonics",
      "/curriculum/reading",
      "/reading",
      "/english",
      "/curriculum/english",
    ],
    documentPatterns: ["Reading Policy", "Phonics Policy"],
    complianceCriteria: [
      "Phonics scheme is named",
      "Reading scheme or approach is described",
    ],
    qualityCriteria: [
      "DfE-validated SSP programme named",
      "How parents can support reading at home",
      "Reading for pleasure strategy described",
      "Assessment approach for phonics/reading",
    ],
    redFlags: [
      "No phonics scheme named",
      "Non-validated phonics programme used",
    ],
    category: "curriculum",
  },

  {
    key: "re_withdrawal",
    name: "RE Withdrawal Rights",
    description:
      "Information about parents' right to withdraw children from Religious Education.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Information (England) Regulations 2008"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "religious education",
      "right to withdraw",
      "collective worship",
      "withdraw from re",
      "withdrawal from re",
    ],
    urlPatterns: [
      "/curriculum/re",
      "/religious-education",
      "/curriculum",
      "/policies",
    ],
    documentPatterns: [
      "RE Policy",
      "Religious Education Policy",
      "Collective Worship Policy",
    ],
    complianceCriteria: ["Parents' right to withdraw from RE is mentioned"],
    qualityCriteria: [
      "Process for requesting withdrawal is described",
      "Alternative provision explained",
    ],
    redFlags: ["No mention of RE withdrawal rights"],
    category: "curriculum",
  },

  {
    key: "rse_policy",
    name: "Relationships & Sex Education (RSE) Policy",
    description:
      "Published RSE policy showing content and right of withdrawal.",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Relationships Education, RSE and Health Education Regulations 2019",
    ],
    updateFrequency: "as_needed",
    searchKeywords: [
      "relationships education",
      "RSE",
      "RSHE",
      "sex education",
      "relationships and sex",
      "PSHE",
    ],
    urlPatterns: [
      "/policies",
      "/curriculum/rshe",
      "/curriculum/rse",
      "/curriculum/pshe",
      "/parents/policies",
    ],
    documentPatterns: [
      "RSE Policy",
      "RSHE Policy",
      "Relationships Education Policy",
      "Sex Education Policy",
    ],
    complianceCriteria: [
      "RSE/RSHE policy is published",
      "Content taught at each stage is described",
      "Parents' right to withdraw (from sex education, not relationships) is stated",
      "Policy states it was developed in consultation with parents",
    ],
    qualityCriteria: [
      "Age-appropriate content clearly outlined",
      "Consultation process described",
      "Review date shown",
      "Link to statutory guidance",
    ],
    redFlags: [
      "No RSE policy found",
      "Policy predates September 2020 (when statutory RSE became mandatory)",
      "No mention of parental consultation",
    ],
    category: "policies",
  },

  // ═══════════════════════════════════════════════════
  // SEND
  // ═══════════════════════════════════════════════════
  {
    key: "send_information_report",
    name: "SEN Information Report",
    description:
      "Detailed report per Schedule 1 of the SEN and Disability Regulations 2014, covering 13 mandatory items.",
    ofstedCategory: "inclusion",
    ofstedSubcategory: "inclusion-send",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Children and Families Act 2014 s.69",
      "SEN and Disability Regulations 2014 Schedule 1",
      "SEND Code of Practice 2015",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "SEN information report",
      "SEND report",
      "SEND information report",
      "special educational needs",
      "SEN offer",
      "local offer",
    ],
    urlPatterns: [
      "/send",
      "/sen",
      "/special-educational-needs",
      "/inclusion",
      "/parents/send",
    ],
    documentPatterns: [
      "SEN Information Report",
      "SEND Information Report",
      "SEND Report",
      "SEN Report",
    ],
    complianceCriteria: [
      "Report is published and accessible",
      "Covers all 13 Schedule 1 items",
      "SENCO is named with contact details",
      "Graduated approach (assess, plan, do, review) described",
      "Link to local authority local offer provided",
      "Updated within current or previous academic year",
    ],
    qualityCriteria: [
      "Written in clear, parent-friendly language",
      "Specific examples of how needs are met",
      "Transition arrangements detailed",
      "External agency partnerships described",
      "Parent/pupil voice referenced",
    ],
    redFlags: [
      "No SEN information report found",
      "Report is more than 2 years old",
      "Missing SENCO details",
      "No link to local offer",
      "Graduated approach not described",
    ],
    subItems: [
      "Kinds of SEN provision made",
      "Identification and assessment policies",
      "Evaluating effectiveness of provision",
      "Assessing and reviewing progress",
      "Approach to teaching pupils with SEN",
      "Curriculum and environment adaptations",
      "Additional learning support",
      "Inclusion in activities",
      "Emotional, mental, social development support",
      "Staff expertise and training",
      "Equipment and facilities",
      "Parent consultation arrangements",
      "Young person consultation arrangements",
      "SEN complaints procedure",
      "External body engagement",
      "Parent support services contact",
      "Transition arrangements",
      "Local offer link",
    ],
    category: "send",
  },

  {
    key: "accessibility_plan",
    name: "Accessibility Plan",
    description:
      "Plan for increasing disabled pupil participation in curriculum, improving physical environment, and improving information accessibility.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["Equality Act 2010 Schedule 10 para 3"],
    updateFrequency: "annually",
    searchKeywords: [
      "accessibility plan",
      "accessibility",
      "disabled pupils",
      "access plan",
      "disability access",
    ],
    urlPatterns: ["/send", "/accessibility", "/policies", "/equality"],
    documentPatterns: [
      "Accessibility Plan",
      "Access Plan",
      "Disability Access Plan",
    ],
    complianceCriteria: [
      "Accessibility plan is published",
      "Covers curriculum participation",
      "Covers physical environment improvements",
      "Covers information accessibility",
    ],
    qualityCriteria: [
      "Specific actions with timescales",
      "Review of progress against previous plan",
      "Resource allocation identified",
    ],
    redFlags: ["No accessibility plan found", "Plan older than 3 years"],
    subItems: [
      "Increasing disabled pupil participation in curriculum",
      "Improving physical environment",
      "Improving accessibility of information",
    ],
    category: "send",
  },

  // ═══════════════════════════════════════════════════
  // PUPIL PREMIUM
  // ═══════════════════════════════════════════════════
  {
    key: "pupil_premium_strategy",
    name: "Pupil Premium Strategy Statement",
    description:
      "Strategy statement using the DfE template showing funding allocation, spending plan, and impact review.",
    ofstedCategory: "leadership-management",
    ofstedSubcategory: "leadership-pupil-premium",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "School Information (England) Regulations 2008",
      "Pupil Premium Conditions of Grant",
    ],
    updateFrequency: "by_date",
    deadline: "31 December",
    searchKeywords: [
      "pupil premium",
      "PP strategy",
      "pupil premium strategy",
      "disadvantaged",
      "pupil premium statement",
      "PP statement",
      "ever 6",
    ],
    urlPatterns: [
      "/pupil-premium",
      "/parents/pupil-premium",
      "/about/pupil-premium",
      "/key-information/pupil-premium",
    ],
    documentPatterns: [
      "Pupil Premium Strategy",
      "Pupil Premium Statement",
      "PP Strategy",
    ],
    complianceCriteria: [
      "Pupil premium strategy is published",
      "Uses DfE template (or equivalent structure)",
      "Funding amount is stated",
      "Spending breakdown by category (teaching, targeted academic support, wider strategies)",
      "Previous year impact review included",
      "Current academic year plan shown",
    ],
    qualityCriteria: [
      "Evidence-based interventions cited (EEF references)",
      "3-year strategic plan",
      "Clear success criteria and monitoring approach",
      "Data on attainment gap between PP and non-PP pupils",
    ],
    redFlags: [
      "No pupil premium information found",
      "Strategy is for previous academic year only",
      "No funding amount stated",
      "No impact review of previous year spending",
      "Generic strategy with no school-specific data",
    ],
    subItems: [
      "School overview and PP pupil numbers",
      "Funding allocation",
      "Spending plan by EEF tier",
      "Previous year review and impact",
      "Externally provided programmes",
    ],
    category: "pupil_premium",
  },

  // ═══════════════════════════════════════════════════
  // PE & SPORT PREMIUM
  // ═══════════════════════════════════════════════════
  {
    key: "pe_sport_premium",
    name: "PE & Sport Premium",
    description:
      "How PE and sport premium funding is spent and its impact on pupils' PE and sport participation.",
    ofstedCategory: "personal-development",
    appliesTo: "both",
    phase: "primary",
    severity: "statutory",
    legislation: ["PE and Sport Premium Conditions of Grant"],
    updateFrequency: "by_date",
    deadline: "31 July",
    searchKeywords: [
      "PE premium",
      "sport premium",
      "PE and sport premium",
      "sports funding",
      "primary PE",
      "swimming",
      "sports grant",
      "PE sports grant",
      "sport grant",
    ],
    urlPatterns: [
      "/pe-sport-premium",
      "/pe-sports-premium",
      "/sport-premium",
      "/pe-premium",
      "/sports-premium",
      "/current-year-pe-sports-premium",
      "/curriculum/pe",
      "/physical-education",
      "/pe-and-sport-premium",
    ],
    documentPatterns: [
      "PE Sport Premium",
      "Sports Premium Report",
      "PE Premium Report",
      "Sports Grant Report",
      "PE Sports Grant",
      "Sport Grant Report",
    ],
    complianceCriteria: [
      "PE and sport premium report is published",
      "Funding amount stated",
      "How money is spent is detailed",
      "Impact on pupils described",
      "Sustainability of improvements discussed",
      "Year 6 swimming data included (primary schools)",
    ],
    qualityCriteria: [
      "Specific activities and programmes named",
      "Participation data (before/after)",
      "Competition results or participation rates",
      "Staff CPD in PE",
      "Published as HTML (not just PDF) as per DfE guidance",
    ],
    redFlags: [
      "No PE sport premium information found",
      "Previous year report only",
      "No impact data",
      "No swimming data (primary schools)",
    ],
    subItems: [
      "Total funding received",
      "How funding is being spent",
      "Impact on pupil PE and sport",
      "Sustainability plan",
      "Year 6 swimming data (primary only)",
    ],
    category: "pe_sport_premium",
  },

  // ═══════════════════════════════════════════════════
  // GOVERNANCE
  // ═══════════════════════════════════════════════════
  {
    key: "governance_information",
    name: "Governance Information",
    description:
      "Details of the governing body structure, members, and how the constitution is met.",
    ofstedCategory: "leadership-management",
    ofstedSubcategory: "leadership-governance",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "School Information (England) Regulations 2008",
      "Academy Trust Handbook 2025 para 1.49",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "governor",
      "governance",
      "governing body",
      "trustee",
      "board of trustees",
      "local governing body",
      "LGB",
      "governing board",
    ],
    urlPatterns: [
      "/governance",
      "/governors",
      "/about/governors",
      "/about/governance",
      "/our-governors",
      "/trustees",
    ],
    documentPatterns: ["Governance Information", "Governor Details"],
    complianceCriteria: [
      "Governing body structure described",
      "Names of governors/trustees listed",
      "Committee structure shown",
    ],
    qualityCriteria: [
      "Appointment dates and terms of office shown",
      "Appointing body identified",
      "Meeting attendance records published",
      "Business/financial interests declared",
      "Photos of governors",
      "Roles and responsibilities explained",
    ],
    redFlags: [
      "No governance information found",
      "Governors not named",
      "Outdated list (leavers still listed)",
    ],
    subItems: [
      "Governor/trustee names",
      "Committee structure",
      "Terms of office and appointment dates",
      "Attendance records",
      "Register of interests",
    ],
    category: "governance",
  },

  {
    key: "academy_trust_info",
    name: "Academy Trust Information",
    description:
      "Academy-specific: trust name, website, memorandum/articles of association, funding agreement.",
    typicallyTrustLevel: true,
    appliesTo: "academy",
    severity: "statutory",
    legislation: ["Academy Trust Handbook 2025"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "academy trust",
      "multi-academy trust",
      "articles of association",
      "memorandum of association",
      "funding agreement",
      "trust board",
      "trust website",
    ],
    urlPatterns: [
      "/about/trust",
      "/trust",
      "/about/academy-trust",
      "/governance",
    ],
    documentPatterns: [
      "Articles of Association",
      "Memorandum of Association",
      "Funding Agreement",
    ],
    complianceCriteria: [
      "Trust name and website linked",
      "Articles of association available",
      "Memorandum of association available",
      "Funding agreement available",
    ],
    qualityCriteria: [
      "Clear explanation of trust structure",
      "Scheme of delegation published",
      "Trust vision and values described",
    ],
    redFlags: [
      "No trust information for academy school",
      "Missing core legal documents",
    ],
    category: "governance",
  },

  {
    key: "whistleblowing",
    name: "Whistleblowing Procedure",
    description: "Academy-specific: Published whistleblowing procedure.",
    typicallyTrustLevel: true,
    appliesTo: "academy",
    severity: "statutory",
    legislation: ["Academy Trust Handbook 2025 para 2.40"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "whistleblowing",
      "whistle blowing",
      "whistleblower",
      "whistle-blowing",
      "raising concerns",
      "public interest disclosure",
    ],
    urlPatterns: ["/policies", "/governance", "/whistleblowing"],
    documentPatterns: [
      "Whistleblowing Policy",
      "Whistleblowing Procedure",
      "Whistle Blowing Policy",
    ],
    complianceCriteria: ["Whistleblowing procedure is published"],
    qualityCriteria: [
      "Clear process for raising concerns",
      "Named contact or role",
      "Protection for whistleblowers described",
    ],
    redFlags: ["No whistleblowing procedure for academy"],
    category: "policies",
  },

  // ═══════════════════════════════════════════════════
  // SAFEGUARDING
  // ═══════════════════════════════════════════════════
  {
    key: "safeguarding_policy",
    name: "Safeguarding / Child Protection Policy",
    description:
      "Current safeguarding and child protection policy referencing KCSIE.",
    ofstedCategory: "safeguarding",
    ofstedSubcategory: "safeguarding-policy",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Keeping Children Safe in Education (current edition)",
      "Working Together to Safeguard Children",
      "Children Act 2004",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "safeguarding",
      "child protection",
      "safeguarding policy",
      "DSL",
      "designated safeguarding lead",
      "KCSIE",
      "keeping children safe",
    ],
    urlPatterns: [
      "/safeguarding",
      "/child-protection",
      "/policies/safeguarding",
      "/parents/safeguarding",
      "/key-information/safeguarding",
      "/send",
      "/about",
      "/our-team",
      "/staff",
    ],
    documentPatterns: [
      "Safeguarding Policy",
      "Child Protection Policy",
      "Safeguarding and Child Protection Policy",
    ],
    complianceCriteria: [
      "Safeguarding policy is published",
      "References current KCSIE edition",
      "Designated Safeguarding Lead (DSL) is named",
      "Deputy DSL(s) named",
      "Policy is dated within current academic year",
    ],
    qualityCriteria: [
      "Clear reporting procedures for staff, parents, and pupils",
      "Contextual safeguarding addressed",
      "Online safety covered",
      "Peer-on-peer abuse addressed",
      "Governor with safeguarding responsibility named",
      "Training programme described",
    ],
    redFlags: [
      "No safeguarding policy found",
      "Policy references outdated KCSIE edition",
      "DSL not named",
      "Policy older than 1 year",
      "No reference to current legislation",
    ],
    subItems: [
      "DSL name and contact",
      "Deputy DSL(s)",
      "Current KCSIE reference",
      "Reporting procedure",
      "Online safety",
      "Peer-on-peer abuse",
    ],
    category: "safeguarding",
  },

  // ═══════════════════════════════════════════════════
  // POLICIES
  // ═══════════════════════════════════════════════════
  {
    key: "behaviour_policy",
    name: "Behaviour Policy",
    description:
      "Written statement of school behaviour policy including anti-bullying measures.",
    ofstedCategory: "behaviour-attitudes",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["Education and Inspections Act 2006 s.89"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "behaviour",
      "behavior",
      "behaviour policy",
      "anti-bullying",
      "discipline",
      "sanctions",
      "rewards",
      "positive behaviour",
    ],
    urlPatterns: ["/policies", "/behaviour", "/parents/policies"],
    documentPatterns: [
      "Behaviour Policy",
      "Behaviour for Learning Policy",
      "Anti-Bullying Policy",
    ],
    complianceCriteria: [
      "Behaviour policy is published",
      "Includes anti-bullying measures",
    ],
    qualityCriteria: [
      "Clear expectations for pupils",
      "Rewards and sanctions described",
      "Anti-bullying strategy detailed",
      "Exclusion process referenced",
      "Reasonable adjustments for SEND pupils",
    ],
    redFlags: ["No behaviour policy found", "No anti-bullying content"],
    category: "policies",
  },

  {
    key: "complaints_procedure",
    name: "Complaints Procedure",
    description: "Published complaints procedure.",
    typicallyTrustLevel: true,
    appliesTo: "both",
    severity: "statutory",
    legislation: ["Education Act 2002 s.29"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "complaints",
      "complaints procedure",
      "complaint",
      "how to complain",
      "make a complaint",
      "formal complaint",
    ],
    urlPatterns: ["/complaints", "/policies/complaints", "/parents/complaints"],
    documentPatterns: ["Complaints Policy", "Complaints Procedure"],
    complianceCriteria: [
      "Complaints procedure is published",
      "Multi-stage process described (informal → formal → panel)",
    ],
    qualityCriteria: [
      "Clear timescales for each stage",
      "Named contact or role",
      "Escalation to governors described",
      "Right to complain to DfE/Ofsted mentioned",
    ],
    redFlags: ["No complaints procedure found"],
    category: "policies",
  },

  {
    key: "charging_remissions",
    name: "Charging & Remissions Policy",
    description:
      "Policy on what the school charges for and remissions available.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["Education Act 1996 ss.449-462"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "charging",
      "remissions",
      "charges",
      "school charges",
      "voluntary contributions",
      "trips cost",
    ],
    urlPatterns: ["/policies", "/charges", "/parents/policies"],
    documentPatterns: ["Charging and Remissions Policy", "Charging Policy"],
    complianceCriteria: ["Charging and remissions policy is published"],
    qualityCriteria: [
      "What is charged for is clear",
      "Remissions/exemptions described",
      "Voluntary contributions policy stated",
    ],
    redFlags: ["No charging and remissions policy found"],
    category: "policies",
  },

  {
    key: "uniform_policy",
    name: "School Uniform Policy",
    description:
      "Uniform policy including cost considerations. Must have regard to DfE cost of school uniforms statutory guidance.",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Education (Guidance about Costs of School Uniforms) Act 2021",
      "Cost of School Uniforms (statutory guidance 2021)",
    ],
    updateFrequency: "as_needed",
    searchKeywords: [
      "uniform",
      "school uniform",
      "dress code",
      "PE kit",
      "branded items",
    ],
    urlPatterns: [
      "/uniform",
      "/parents/uniform",
      "/school-information",
      "/policies",
    ],
    documentPatterns: ["Uniform Policy", "School Uniform"],
    complianceCriteria: ["Uniform information is published"],
    qualityCriteria: [
      "Branded vs generic items clearly distinguished",
      "Cost kept to minimum per DfE guidance",
      "Second-hand options mentioned",
      "Single supplier avoided where possible",
    ],
    redFlags: ["All items branded with no alternatives"],
    category: "policies",
  },

  // ═══════════════════════════════════════════════════
  // PERFORMANCE DATA
  // ═══════════════════════════════════════════════════
  {
    key: "ks2_results",
    name: "KS2 Results (Primary)",
    description:
      "Most recent KS2 results: % expected standard (RWM combined), % higher standard, average scaled scores.",
    ofstedCategory: "quality-of-education",
    ofstedSubcategory: "education-outcomes",
    appliesTo: "both",
    phase: "primary",
    severity: "statutory",
    legislation: ["School Information (England) Regulations 2008"],
    updateFrequency: "annually",
    searchKeywords: [
      "KS2",
      "key stage 2",
      "SATs",
      "results",
      "attainment",
      "expected standard",
      "greater depth",
      "scaled score",
      "reading writing maths",
    ],
    urlPatterns: [
      "/results",
      "/performance",
      "/data",
      "/key-information/results",
      "/parents/results",
    ],
    documentPatterns: ["KS2 Results", "SATs Results", "Performance Data"],
    complianceCriteria: [
      "KS2 results are published",
      "% achieving expected standard in RWM combined",
      "% achieving higher standard",
      "Average scaled scores (reading, maths)",
      "Most recent available data used",
    ],
    qualityCriteria: [
      "Comparison to national averages",
      "Trend data over 3+ years",
      "Progress data as well as attainment",
      "Context provided for results",
    ],
    redFlags: [
      "No results data found (primary school)",
      "Data is more than 1 year out of date",
      "Only partial data published",
    ],
    category: "performance_data",
  },

  {
    key: "school_performance_link",
    name: "Link to Compare School Performance",
    description:
      "Link to the DfE Compare School Performance (formerly School Performance Tables) service.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Information (England) Regulations 2008"],
    updateFrequency: "annually",
    searchKeywords: [
      "compare school performance",
      "school performance tables",
      "find and compare",
      "DfE performance",
      "performance tables",
    ],
    urlPatterns: ["/results", "/performance", "/data", "/ks2-results"],
    documentPatterns: [],
    complianceCriteria: [
      "Link to Compare School Performance service is present",
      "Link works and goes to correct school page",
    ],
    qualityCriteria: ["School-specific link (not just generic site)"],
    redFlags: ["No link to performance data service", "Broken link"],
    category: "performance_data",
  },

  // ═══════════════════════════════════════════════════
  // FINANCIAL
  // ═══════════════════════════════════════════════════
  {
    key: "high_pay_disclosure",
    name: "Staff Pay Over £100k",
    description: "Number of employees earning over £100,000 in £10k bandings.",
    typicallyTrustLevel: true,
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "School Information (England) Regulations 2008 (as amended 2020)",
      "Academy Trust Handbook 2025 para 2.29",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "£100,000",
      "100k",
      "pay banding",
      "executive pay",
      "remuneration",
      "staff earning",
      "salary banding",
    ],
    urlPatterns: [
      "/finance",
      "/financial-information",
      "/governance",
      "/about/finance",
    ],
    documentPatterns: [
      "Financial Information",
      "Pay Disclosure",
      "Executive Pay",
    ],
    complianceCriteria: [
      "Pay information over £100k is disclosed",
      "Shown in £10,000 bandings",
    ],
    qualityCriteria: [
      "Clear and easy to find",
      "Context provided for pay decisions",
    ],
    redFlags: [
      "No pay disclosure found",
      'Statement says "none" but school size suggests otherwise',
    ],
    category: "financial",
  },

  {
    key: "financial_benchmarking_link",
    name: "Financial Benchmarking Link",
    description:
      "Link to DfE Financial Benchmarking and Insights Tool (FBIT). Replaced the old Schools Financial Benchmarking service from 2024.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Information (England) (Amendment) Regulations 2025"],
    updateFrequency: "annually",
    searchKeywords: [
      "financial benchmarking",
      "benchmarking tool",
      "schools financial benchmarking",
      "FBIT",
      "financial benchmarking and insights",
      "DfE benchmarking",
    ],
    urlPatterns: ["/finance", "/financial-information", "/benchmarking"],
    documentPatterns: [],
    complianceCriteria: [
      "Link to Financial Benchmarking and Insights Tool (FBIT) is present",
      "Link goes to the correct DfE service (not the old Schools Financial Benchmarking site)",
    ],
    qualityCriteria: ["Direct link to school-specific page"],
    redFlags: [
      "No benchmarking link",
      "Link to old Schools Financial Benchmarking service instead of FBIT",
    ],
    category: "financial",
  },

  {
    key: "academy_accounts",
    name: "Annual Accounts (Academies)",
    description:
      "Academy-specific: Published audited annual report and accounts.",
    typicallyTrustLevel: true,
    appliesTo: "academy",
    severity: "statutory",
    legislation: ["Academy Trust Handbook 2025", "Funding agreement"],
    updateFrequency: "by_date",
    deadline: "31 January",
    searchKeywords: [
      "annual report",
      "annual accounts",
      "financial statements",
      "audited accounts",
      "annual report and accounts",
    ],
    urlPatterns: [
      "/finance",
      "/governance",
      "/about/finance",
      "/trust/finance",
    ],
    documentPatterns: [
      "Annual Report",
      "Annual Accounts",
      "Financial Statements",
    ],
    complianceCriteria: [
      "Annual report and accounts published",
      "Most recent audited accounts available",
    ],
    qualityCriteria: ["Easy to find", "Multiple years available"],
    redFlags: [
      "No accounts found for academy trust",
      "Accounts more than 1 year old",
    ],
    category: "financial",
  },

  // ═══════════════════════════════════════════════════
  // EQUALITY
  // ═══════════════════════════════════════════════════
  {
    key: "equality_objectives",
    name: "Equality Objectives",
    description:
      "Published equality objectives as required by the Public Sector Equality Duty.",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Equality Act 2010 s.149",
      "Equality Act 2010 (Specific Duties) Regulations 2017",
    ],
    updateFrequency: "every_4_years",
    searchKeywords: [
      "equality objectives",
      "equality duty",
      "public sector equality duty",
      "PSED",
      "protected characteristics",
    ],
    urlPatterns: [
      "/equality",
      "/policies/equality",
      "/about/equality",
      "/equality-objectives",
    ],
    documentPatterns: [
      "Equality Objectives",
      "Equality Policy",
      "Equality Information",
    ],
    complianceCriteria: [
      "Equality objectives are published",
      "Objectives are specific and measurable",
      "Published within last 4 years",
    ],
    qualityCriteria: [
      "Protected characteristics addressed",
      "Evidence of impact monitoring",
      "Links to school development priorities",
    ],
    redFlags: ["No equality objectives found", "Objectives older than 4 years"],
    category: "equality",
  },

  {
    key: "gender_pay_gap",
    name: "Gender Pay Gap Report",
    description:
      "Gender pay gap information (schools/trusts with 250+ employees only).",
    typicallyTrustLevel: true,
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Equality Act 2010 (Gender Pay Gap Information) Regulations 2017",
    ],
    updateFrequency: "annually",
    searchKeywords: ["gender pay gap", "pay gap", "gender pay"],
    urlPatterns: ["/gender-pay-gap", "/equality", "/pay-gap"],
    documentPatterns: ["Gender Pay Gap Report", "Gender Pay Gap"],
    complianceCriteria: ["Gender pay gap report published (if 250+ employees)"],
    qualityCriteria: [
      "Narrative explaining any gap",
      "Action plan to address gaps",
    ],
    redFlags: ["Large trust with no gender pay gap report"],
    category: "equality",
  },

  // ═══════════════════════════════════════════════════
  // OFSTED
  // ═══════════════════════════════════════════════════
  {
    key: "ofsted_report",
    name: "Ofsted Report",
    description: "Copy of or link to the most recent Ofsted inspection report.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["School Information (England) Regulations 2008"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "Ofsted",
      "inspection",
      "Ofsted report",
      "inspection report",
      "Ofsted rating",
      "outstanding",
      "good",
      "requires improvement",
    ],
    urlPatterns: [
      "/ofsted",
      "/about/ofsted",
      "/key-information/ofsted",
      "/parents/ofsted",
    ],
    documentPatterns: ["Ofsted Report", "Inspection Report"],
    complianceCriteria: [
      "Ofsted report is accessible (link or embedded)",
      "Most recent report is shown",
    ],
    qualityCriteria: [
      "Direct link to Ofsted reports page for the school",
      "School response to report published",
      "Current rating clearly displayed",
    ],
    redFlags: [
      "No Ofsted report found",
      "Old report with newer inspection available",
    ],
    category: "ofsted",
  },

  // ═══════════════════════════════════════════════════
  // CAREERS (Secondary Only)
  // ═══════════════════════════════════════════════════
  {
    key: "careers_programme",
    name: "Careers Programme (Secondary)",
    description:
      "Secondary schools: careers programme lead, summary, impact methodology, and review date.",
    appliesTo: "both",
    phase: "secondary",
    severity: "statutory",
    legislation: ["Education Act 1997 s.42B"],
    updateFrequency: "annually",
    searchKeywords: [
      "careers",
      "careers programme",
      "careers education",
      "CEIAG",
      "Gatsby benchmarks",
      "work experience",
      "career guidance",
    ],
    urlPatterns: [
      "/careers",
      "/careers-programme",
      "/sixth-form/careers",
      "/students/careers",
    ],
    documentPatterns: ["Careers Programme", "CEIAG Policy", "Careers Policy"],
    complianceCriteria: [
      "Careers programme lead named",
      "Programme summary published",
      "Impact methodology described",
      "Review date stated",
    ],
    qualityCriteria: [
      "Gatsby benchmarks referenced",
      "Provider access statement published (Baker Clause)",
      "Employer encounters and work experience described",
      "Destination data published",
    ],
    redFlags: ["No careers information (secondary school)", "No named lead"],
    category: "careers",
  },

  {
    key: "provider_access",
    name: "Provider Access Policy (Baker Clause)",
    description:
      "Secondary schools: policy on access for technical education/apprenticeship providers to Y7-13 (strengthened from Y8-13 in Skills and Post-16 Education Act 2022).",
    appliesTo: "both",
    phase: "secondary",
    severity: "statutory",
    legislation: [
      "Skills and Post-16 Education Act 2022",
      "Education Act 1997 s.42B (as amended)",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "provider access",
      "Baker clause",
      "technical education",
      "apprenticeship providers",
      "provider access statement",
    ],
    urlPatterns: ["/careers", "/provider-access", "/policies", "/sixth-form"],
    documentPatterns: ["Provider Access Policy", "Provider Access Statement"],
    complianceCriteria: [
      "Provider access policy/statement published",
      "Describes how providers can request access to pupils",
    ],
    qualityCriteria: [
      "Specific opportunities for each year group (Y8-13)",
      "Named contact for provider requests",
      "Premises and facilities offered",
    ],
    redFlags: ["No provider access statement (secondary school)"],
    category: "careers",
  },

  // ═══════════════════════════════════════════════════
  // ACCESSIBILITY
  // ═══════════════════════════════════════════════════
  {
    key: "website_accessibility",
    name: "Website Accessibility Statement",
    description:
      "Accessibility statement for the school website (WCAG 2.2 AA compliance).",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Public Sector Bodies (Websites and Mobile Applications) (No. 2) Accessibility Regulations 2018",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "accessibility statement",
      "WCAG",
      "WCAG 2",
      "screen reader",
      "assistive technology",
      "web content accessibility",
    ],
    urlPatterns: [
      "/accessibility",
      "/accessibility-statement",
      "/website-accessibility",
    ],
    documentPatterns: ["Accessibility Statement"],
    complianceCriteria: [
      "Accessibility statement is published",
      "States level of WCAG compliance",
      "Lists known accessibility issues",
      "Provides contact for accessibility problems",
    ],
    qualityCriteria: [
      "Tested with assistive technologies",
      "Action plan for fixing issues",
      "Last review date shown",
      "Alternative formats offered",
    ],
    redFlags: ["No accessibility statement", "Statement does not mention WCAG"],
    category: "accessibility",
  },

  // ═══════════════════════════════════════════════════
  // PERFORMANCE DATA (Secondary/Post-16)
  // ═══════════════════════════════════════════════════
  {
    key: "ks4_results",
    name: "KS4 / GCSE Results (Secondary)",
    description:
      "Most recent KS4 results: Progress 8, Attainment 8, % Grade 5+ in English & Maths, EBacc entry and achievement.",
    ofstedCategory: "quality-of-education",
    ofstedSubcategory: "education-outcomes",
    appliesTo: "both",
    phase: "secondary",
    severity: "statutory",
    legislation: [
      "School Information (England) Regulations 2008",
      "School Information (England) (Amendment) Regulations 2025",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "GCSE",
      "KS4",
      "key stage 4",
      "results",
      "Progress 8",
      "Attainment 8",
      "EBacc",
      "English Baccalaureate",
      "grade 5",
      "grade 4",
      "GCSE results",
    ],
    urlPatterns: [
      "/results",
      "/performance",
      "/data",
      "/exam-results",
      "/gcse-results",
    ],
    documentPatterns: ["GCSE Results", "KS4 Results", "Exam Results"],
    complianceCriteria: [
      "KS4/GCSE results are published",
      "Progress 8 score shown",
      "Attainment 8 score shown",
      "% achieving Grade 5+ in English and Maths",
      "EBacc entry and achievement rates",
      "Most recent available data used",
    ],
    qualityCriteria: [
      "Comparison to national averages",
      "Trend data over multiple years",
      "Breakdown by subject",
      "Disadvantaged pupil data shown",
    ],
    redFlags: [
      "No results data found (secondary school)",
      "Data is more than 1 year out of date",
      "Only partial data published",
    ],
    category: "performance_data",
  },

  {
    key: "ks5_results",
    name: "KS5 / A-Level Results (Post-16)",
    description:
      "Post-16 results: progress scores, average grades, retention rates, and destination data.",
    ofstedCategory: "quality-of-education",
    ofstedSubcategory: "education-outcomes",
    appliesTo: "both",
    phase: "secondary",
    severity: "statutory",
    legislation: [
      "School Information (England) Regulations 2008",
      "16-19 Accountability measures guidance",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "A level",
      "A-level",
      "KS5",
      "key stage 5",
      "sixth form",
      "post-16",
      "level 3",
      "BTEC",
      "applied general",
      "tech level",
    ],
    urlPatterns: [
      "/results",
      "/performance",
      "/sixth-form/results",
      "/exam-results",
      "/a-level-results",
    ],
    documentPatterns: ["A Level Results", "KS5 Results", "Sixth Form Results"],
    complianceCriteria: [
      "KS5 results are published (if school has sixth form/post-16)",
      "Progress score shown",
      "Average grade shown",
      "Most recent available data used",
    ],
    qualityCriteria: [
      "Comparison to national averages",
      "Destination data (university/employment)",
      "Subject-level breakdown",
      "Retention rates",
    ],
    redFlags: [
      "No results data found (school with sixth form)",
      "Data is more than 1 year out of date",
    ],
    category: "performance_data",
  },

  // ═══════════════════════════════════════════════════
  // ONLINE SAFETY
  // ═══════════════════════════════════════════════════
  {
    key: "online_safety_policy",
    name: "Online Safety Policy",
    description:
      "Published online safety / e-safety / digital safety policy covering pupils and staff use of technology.",
    ofstedCategory: "safeguarding",
    ofstedSubcategory: "safeguarding-policy",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Keeping Children Safe in Education 2025 Part 2",
      "Filtering and Monitoring Standards DfE 2024",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "online safety",
      "e-safety",
      "internet safety",
      "cyber safety",
      "digital safety",
      "acceptable use",
      "AUP",
      "online",
      "filtering",
      "monitoring",
    ],
    urlPatterns: [
      "/online-safety",
      "/e-safety",
      "/policies",
      "/safeguarding",
      "/computing",
      "/parents/online-safety",
    ],
    documentPatterns: [
      "Online Safety Policy",
      "E-Safety Policy",
      "Internet Safety Policy",
      "Acceptable Use Policy",
      "Digital Safety Policy",
    ],
    complianceCriteria: [
      "Online safety policy is published",
      "Covers pupil and staff use of technology",
      "Acceptable use policy included or linked",
      "References KCSIE guidance on online safety",
    ],
    qualityCriteria: [
      "Social media guidance included",
      "Cyberbullying procedures",
      "Sexting/youth-produced imagery procedures",
      "Staff use of personal devices addressed",
      "Parent guidance on online safety provided",
    ],
    redFlags: [
      "No online safety policy found",
      "Policy does not reference KCSIE",
      "Policy predates 2023",
    ],
    category: "online_safety",
  },

  {
    key: "filtering_monitoring",
    name: "Filtering & Monitoring Standards",
    description:
      "Information about the school's approach to filtering and monitoring of internet access, as required by KCSIE 2025 and DfE filtering and monitoring standards.",
    ofstedCategory: "safeguarding",
    ofstedSubcategory: "safeguarding-policy",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Keeping Children Safe in Education 2025",
      "DfE Filtering and Monitoring Standards for Schools and Colleges 2024",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "filtering and monitoring",
      "internet filter",
      "web filter",
      "content filter",
      "web filtering",
      "SWGFL",
      "internet watch foundation",
      "filtering standard",
      "monitoring standard",
    ],
    urlPatterns: [
      "/online-safety",
      "/e-safety",
      "/safeguarding",
      "/policies",
      "/computing",
      "/it-policy",
    ],
    documentPatterns: [
      "Filtering and Monitoring",
      "Internet Filtering Policy",
      "Web Filtering",
    ],
    complianceCriteria: [
      "School states it meets DfE filtering and monitoring standards",
      "Named person responsible for filtering and monitoring identified",
      "Approach to filtering described",
      "Approach to monitoring described",
    ],
    qualityCriteria: [
      "Filtering provider/system named",
      "How overblocking is managed",
      "How staff report filtering concerns",
      "Regular review cycle described",
    ],
    redFlags: [
      "No mention of filtering or monitoring",
      "No named person responsible",
    ],
    category: "online_safety",
  },

  // ═══════════════════════════════════════════════════
  // EQUALITY (Annual Information)
  // ═══════════════════════════════════════════════════
  {
    key: "equality_information",
    name: "Equality Information (Annual)",
    description:
      "Annual publication of information demonstrating compliance with the Public Sector Equality Duty — separate from the 4-yearly equality objectives.",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "Equality Act 2010 s.149",
      "Equality Act 2010 (Specific Duties) Regulations 2011 reg 2",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "equality information",
      "equality data",
      "equality duty",
      "protected characteristics",
      "equality annual",
      "workforce diversity",
    ],
    urlPatterns: [
      "/equality",
      "/policies/equality",
      "/about/equality",
      "/equality-information",
    ],
    documentPatterns: [
      "Equality Information",
      "Equality Report",
      "Equality Annual Report",
    ],
    complianceCriteria: [
      "Annual equality information is published (separate from 4-yearly objectives)",
      "Shows how the school has due regard to the equality duty",
      "Information relates to pupils and/or workforce",
    ],
    qualityCriteria: [
      "Demographic data included (anonymised)",
      "Actions taken to address inequalities described",
      "Links to equality objectives",
    ],
    redFlags: [
      "No equality information published",
      "Only equality objectives present with no supporting data",
      "Information older than 1 year",
    ],
    category: "equality",
  },

  // ═══════════════════════════════════════════════════
  // FINANCIAL (Academy-Specific)
  // ═══════════════════════════════════════════════════
  {
    key: "off_payroll_disclosure",
    name: "Off-Payroll Arrangements Disclosure",
    description:
      "Academy trusts must disclose any off-payroll arrangements for staff earning over £245 per day equivalent.",
    typicallyTrustLevel: true,
    appliesTo: "academy",
    severity: "statutory",
    legislation: [
      "Academy Trust Handbook 2025 para 2.30",
      "HM Treasury Managing Public Money",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "off-payroll",
      "off payroll",
      "consultancy",
      "contractor",
      "agency staff",
      "IR35",
      "personal service company",
    ],
    urlPatterns: [
      "/finance",
      "/financial-information",
      "/governance",
      "/trust/finance",
    ],
    documentPatterns: [
      "Off-Payroll Disclosure",
      "Financial Information",
      "Annual Report",
    ],
    complianceCriteria: [
      "Off-payroll arrangements are disclosed (or stated as none)",
      "Covers arrangements exceeding £245/day",
    ],
    qualityCriteria: [
      "Clear explanation of any arrangements",
      "Assurance of tax compliance",
    ],
    redFlags: [
      "No mention of off-payroll arrangements for academy trust",
      "Large trust with no disclosure",
    ],
    category: "financial",
  },

  {
    key: "family_relationships_register",
    name: "Related Party Transactions / Family Relationships Register",
    description:
      "Academy trusts must publish their register of interests including any business/financial interests and family relationships with trust staff/governors.",
    typicallyTrustLevel: true,
    appliesTo: "academy",
    severity: "statutory",
    legislation: ["Academy Trust Handbook 2025 para 5.50-5.52"],
    updateFrequency: "annually",
    searchKeywords: [
      "register of interests",
      "related party",
      "family relationships",
      "business interests",
      "pecuniary interests",
      "pecuniary interest",
      "personal interests",
      "conflicts of interest",
      "declarations of interest",
    ],
    urlPatterns: [
      "/governance",
      "/governors",
      "/trustees",
      "/about/governance",
      "/trust/governance",
    ],
    documentPatterns: [
      "Register of Interests",
      "Register of Pecuniary",
      "Declarations of Interest",
      "Related Party Transactions",
    ],
    complianceCriteria: [
      "Register of business interests is published for governors/trustees",
      "Covers relevant business and pecuniary interests",
      "Family relationships with staff/governors disclosed",
    ],
    qualityCriteria: [
      "Regularly updated",
      "Includes nil returns",
      "Related party transaction policy described",
    ],
    redFlags: [
      "No register of interests for academy trust",
      "Register appears incomplete or outdated",
    ],
    category: "governance",
  },

  // ═══════════════════════════════════════════════════
  // CHURCH SCHOOL / SIAMS (VA, VC, C of E, Catholic)
  // ═══════════════════════════════════════════════════
  {
    key: "collective_worship",
    name: "Collective Worship Policy",
    description:
      "Church schools must publish their collective worship policy, explaining how daily collective worship is provided in accordance with the school's trust deed or religious designation.",
    ofstedCategory: "personal_development",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "School Standards and Framework Act 1998 s70",
      "SIAMS Evaluation Schedule 2023",
    ],
    updateFrequency: "annually",
    searchKeywords: [
      "collective worship",
      "worship",
      "assembly",
      "daily worship",
      "christian worship",
      "prayer",
      "reflection",
      "church school",
    ],
    urlPatterns: [
      "/worship",
      "/collective-worship",
      "/policies",
      "/christian-life",
      "/church-school",
    ],
    documentPatterns: [
      "Collective Worship Policy",
      "Worship Policy",
      "Daily Worship",
    ],
    complianceCriteria: [
      "Collective worship policy is published",
      "States how daily worship is provided",
      "Reflects the school's Christian/religious character",
      "Right of withdrawal for parents is mentioned",
    ],
    qualityCriteria: [
      "Describes how worship is planned and led",
      "Includes examples of worship themes or patterns",
      "References school's Christian vision/values",
      "Mentions monitoring and evaluation of worship",
    ],
    redFlags: [
      "No collective worship policy for a church school",
      "Policy does not reflect Christian/religious character",
    ],
    churchOnly: true,
    category: "siams",
  },

  {
    key: "christian_vision",
    name: "Christian Vision & Values",
    description:
      "Church of England and Catholic schools should publish their Christian vision and values, showing how these drive the school's work and are rooted in theological understanding.",
    ofstedCategory: "leadership_management",
    appliesTo: "both",
    severity: "statutory",
    legislation: [
      "SIAMS Evaluation Schedule 2023",
      "Church of England Vision for Education 2016",
    ],
    updateFrequency: "as_needed",
    searchKeywords: [
      "christian vision",
      "christian values",
      "school vision",
      "christian distinctiveness",
      "church school",
      "diocese",
      "diocesan",
      "christian ethos",
      "biblical",
      "theological",
      "faith",
      "spirituality",
    ],
    urlPatterns: [
      "/vision",
      "/values",
      "/christian-vision",
      "/ethos",
      "/about",
      "/church-school",
      "/our-school",
    ],
    documentPatterns: [
      "Christian Vision",
      "School Vision",
      "Our Values",
      "Christian Distinctiveness",
    ],
    complianceCriteria: [
      "School's Christian vision is clearly stated",
      "Vision is rooted in Christian narrative/theology",
      "Core values are articulated",
      "Connection between vision and school life is explained",
    ],
    qualityCriteria: [
      "Vision includes a biblical or theological underpinning",
      "Shows how vision impacts curriculum, behaviour, community",
      "Accessible and meaningful to the school community",
      "Reviewed and owned by the whole school community",
    ],
    redFlags: [
      "Church school with no stated Christian vision",
      "Generic values with no Christian distinctiveness",
    ],
    churchOnly: true,
    category: "siams",
  },

  {
    key: "siams_report",
    name: "SIAMS Inspection Report",
    description:
      "Church schools must publish their most recent SIAMS (Statutory Inspection of Anglican and Methodist Schools) or Section 48 (Catholic) inspection report.",
    appliesTo: "both",
    severity: "statutory",
    legislation: ["Education Act 2005 s48", "SIAMS Evaluation Schedule 2023"],
    updateFrequency: "as_needed",
    searchKeywords: [
      "siams",
      "section 48",
      "church school inspection",
      "siams report",
      "siams inspection",
      "denominational inspection",
      "diocesan inspection",
    ],
    urlPatterns: [
      "/siams",
      "/church-inspection",
      "/ofsted-siams",
      "/inspection",
      "/reports",
    ],
    documentPatterns: [
      "SIAMS Report",
      "SIAMS Inspection",
      "Section 48 Report",
      "Church School Inspection",
    ],
    complianceCriteria: [
      "Most recent SIAMS/Section 48 report is published or linked",
      "Report is accessible (not behind login)",
    ],
    qualityCriteria: [
      "Date of inspection is clear",
      "Overall judgement is visible",
      "Link to diocesan education team provided",
    ],
    redFlags: [
      "Church school with no SIAMS/Section 48 report",
      "Report is more than 5 years old without explanation",
    ],
    churchOnly: true,
    category: "siams",
  },

  {
    key: "diocesan_link",
    name: "Diocesan Board of Education Link",
    description:
      "Church schools should publish a link to their Diocesan Board of Education and demonstrate their relationship with the diocese.",
    appliesTo: "both",
    severity: "recommended",
    legislation: [
      "SIAMS Evaluation Schedule 2023",
      "Diocesan Board of Education Measure 2021",
    ],
    updateFrequency: "as_needed",
    searchKeywords: [
      "diocese",
      "diocesan",
      "diocesan board",
      "dbe",
      "diocesan education",
      "bishop",
      "archdeacon",
      "church of england",
      "catholic diocese",
    ],
    urlPatterns: [
      "/diocese",
      "/links",
      "/partners",
      "/about",
      "/church-school",
    ],
    documentPatterns: ["Diocese", "Diocesan Board", "DBE"],
    complianceCriteria: [
      "Link to diocesan board of education website is present",
      "Diocese/deanery is named",
    ],
    qualityCriteria: [
      "Describes relationship with diocese",
      "Names foundation governors appointed by diocese",
      "Links to diocesan resources or support",
    ],
    redFlags: ["Church school with no mention of diocese"],
    churchOnly: true,
    category: "siams",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Get requirements filtered by school type and phase
 * @param schoolType - maintained or academy
 * @param isChurchSchool - if true, includes SIAMS/church-specific requirements
 * @param phase - school phase: primary, secondary, all_through (default: all)
 */
export function getRequirementsForSchoolType(
  schoolType: "maintained" | "academy",
  isChurchSchool = false,
  phase: SchoolPhase = "all",
): ComplianceRequirement[] {
  return WEBSITE_COMPLIANCE_REQUIREMENTS.filter((r) => {
    // Filter by school type
    if (r.appliesTo !== "both" && r.appliesTo !== schoolType) return false;
    // Church-only requirements only apply to church schools
    if (r.churchOnly && !isChurchSchool) return false;
    // Filter by phase — skip requirements that don't apply to this school's phase
    if (r.phase && phase !== "all" && phase !== "all_through") {
      if (r.phase !== phase) return false;
    }
    return true;
  });
}

/**
 * Get requirements by category
 */
export function getRequirementsByCategory(): Record<
  RequirementCategory,
  ComplianceRequirement[]
> {
  const grouped = {} as Record<RequirementCategory, ComplianceRequirement[]>;
  for (const req of WEBSITE_COMPLIANCE_REQUIREMENTS) {
    if (!grouped[req.category]) grouped[req.category] = [];
    grouped[req.category].push(req);
  }
  return grouped;
}

/**
 * Get all statutory requirements (excludes recommended/good practice)
 */
export function getStatutoryRequirements(): ComplianceRequirement[] {
  return WEBSITE_COMPLIANCE_REQUIREMENTS.filter(
    (r) => r.severity === "statutory",
  );
}

/**
 * Total count of requirements
 */
export const TOTAL_REQUIREMENTS = WEBSITE_COMPLIANCE_REQUIREMENTS.length;
export const TOTAL_STATUTORY = WEBSITE_COMPLIANCE_REQUIREMENTS.filter(
  (r) => r.severity === "statutory",
).length;
