// =====================================================
// Ofsted Framework Data
// EIF 2025 - 6 Judgement Areas with Evidence Requirements
// =====================================================

import type { OfstedCategoryId, OfstedSubCategoryId } from "./types";

export interface EvidenceItem {
  id: string;
  name: string;
  description: string;
}

export interface SubCategory {
  id: OfstedSubCategoryId;
  name: string;
  description: string;
  evidenceRequired: EvidenceItem[];
  keyIndicators: string[];
  inspectionFocus: string[];
}

export interface Category {
  id: OfstedCategoryId;
  name: string;
  shortName: string;
  description: string;
  color: string;
  subcategories: SubCategory[];
}

// =====================================================
// OFSTED FRAMEWORK - EIF 2025 (6 Judgement Areas)
// =====================================================

export const OFSTED_FRAMEWORK_DATA: Category[] = [
  // 1. Inclusion
  {
    id: "inclusion",
    name: "Inclusion",
    shortName: "Inclusion",
    description:
      "How well the school ensures all pupils, including those with SEND and disadvantaged pupils, receive the support they need",
    color: "teal",
    subcategories: [
      {
        id: "inclusion-send",
        name: "SEND Provision",
        description:
          "Support for pupils with special educational needs and disabilities",
        evidenceRequired: [
          {
            id: "send-1",
            name: "SEND Policy",
            description: "Current SEND policy and information report",
          },
          {
            id: "send-2",
            name: "Graduated Approach",
            description: "Evidence of assess, plan, do, review cycle",
          },
          {
            id: "send-3",
            name: "Provision Map",
            description: "Mapping of interventions and support",
          },
          {
            id: "send-4",
            name: "EHCP Reviews",
            description: "Annual review documentation",
          },
          {
            id: "send-5",
            name: "SENCO Role",
            description: "Evidence of SENCO leadership and impact",
          },
        ],
        keyIndicators: [
          "Pupils with SEND achieve well from their starting points",
          "Early identification of needs is effective",
          "High-quality targeted support is in place",
          "Staff have appropriate training for SEND",
          "Parents are engaged as partners",
        ],
        inspectionFocus: [
          "How quickly are needs identified?",
          "Is the graduated approach implemented effectively?",
          "Do pupils with SEND access the full curriculum?",
          "What is the impact of interventions?",
        ],
      },
      {
        id: "inclusion-disadvantaged",
        name: "Disadvantaged Pupils",
        description: "Support and outcomes for disadvantaged pupils",
        evidenceRequired: [
          {
            id: "pp-1",
            name: "Pupil Premium Strategy",
            description: "Current PP strategy statement",
          },
          {
            id: "pp-2",
            name: "PP Outcomes",
            description: "Progress and attainment data for PP pupils",
          },
          {
            id: "pp-3",
            name: "Intervention Impact",
            description: "Evidence of impact of PP spending",
          },
          {
            id: "pp-4",
            name: "Attendance Data",
            description: "Attendance comparison for PP pupils",
          },
        ],
        keyIndicators: [
          "Disadvantaged pupils achieve as well as others nationally",
          "Gaps are closing over time",
          "PP strategy is evidence-based (EEF)",
          "Barriers to learning are addressed effectively",
        ],
        inspectionFocus: [
          "What are the barriers for disadvantaged pupils?",
          "How is PP funding used to address barriers?",
          "What is the impact on outcomes?",
        ],
      },
      {
        id: "inclusion-mental-health",
        name: "Mental Health Support",
        description: "Promotion of wellbeing and mental health support",
        evidenceRequired: [
          {
            id: "mh-1",
            name: "Mental Health Lead",
            description: "Trained senior mental health lead",
          },
          {
            id: "mh-2",
            name: "Wellbeing Curriculum",
            description: "How wellbeing is taught",
          },
          {
            id: "mh-3",
            name: "Support Systems",
            description: "Referral pathways and support available",
          },
        ],
        keyIndicators: [
          "Mental health needs identified early",
          "Effective support systems in place",
          "Whole-school approach to wellbeing",
        ],
        inspectionFocus: [
          "How are mental health needs identified?",
          "What support is available?",
        ],
      },
    ],
  },
  // 2. Curriculum and Teaching
  {
    id: "curriculum-teaching",
    name: "Curriculum and Teaching",
    shortName: "Education",
    description:
      "The quality, breadth and ambition of the curriculum and how effectively it is taught",
    color: "rose",
    subcategories: [
      {
        id: "curriculum-intent",
        name: "Curriculum Design",
        description: "The design and ambition of the curriculum",
        evidenceRequired: [
          {
            id: "intent-1",
            name: "Curriculum Overview",
            description: "Whole-school curriculum map",
          },
          {
            id: "intent-2",
            name: "Subject Policies",
            description: "Intent statements for each subject",
          },
          {
            id: "intent-3",
            name: "Progression Maps",
            description: "How knowledge builds over time",
          },
        ],
        keyIndicators: [
          "Curriculum is ambitious for all pupils",
          "Clear progression of knowledge and skills",
          "National Curriculum coverage is secure",
        ],
        inspectionFocus: [
          "What is the curriculum intent?",
          "How is the curriculum sequenced?",
        ],
      },
      {
        id: "curriculum-implementation",
        name: "Teaching Quality",
        description: "How effectively the curriculum is taught",
        evidenceRequired: [
          {
            id: "teach-1",
            name: "Lesson Observations",
            description: "Recent observation evidence",
          },
          {
            id: "teach-2",
            name: "Work Scrutiny",
            description: "Analysis of pupil work over time",
          },
          {
            id: "teach-3",
            name: "Assessment Policy",
            description: "How assessment informs teaching",
          },
        ],
        keyIndicators: [
          "Teachers have strong subject knowledge",
          "Effective pedagogical approaches are used",
          "Assessment is used to adapt teaching",
        ],
        inspectionFocus: [
          "How is the curriculum taught?",
          "How is assessment used?",
        ],
      },
      {
        id: "curriculum-reading",
        name: "Reading and Literacy",
        description: "The teaching of reading including phonics",
        evidenceRequired: [
          {
            id: "read-1",
            name: "Phonics Programme",
            description: "DfE validated SSP programme",
          },
          {
            id: "read-2",
            name: "Reading Curriculum",
            description: "Approach to reading across school",
          },
        ],
        keyIndicators: [
          "Validated SSP programme implemented with fidelity",
          "Books matched to phonics knowledge",
          "Reading for pleasure promoted",
        ],
        inspectionFocus: [
          "What phonics programme is used?",
          "Are books decodable and matched?",
        ],
      },
    ],
  },
  // 3. Achievement
  {
    id: "achievement",
    name: "Achievement",
    shortName: "Achievement",
    description: "The outcomes pupils achieve and the progress they make",
    color: "blue",
    subcategories: [
      {
        id: "achievement-outcomes",
        name: "Academic Outcomes",
        description: "Attainment and progress in national assessments",
        evidenceRequired: [
          {
            id: "out-1",
            name: "KS2 Results",
            description: "End of KS2 outcomes",
          },
          {
            id: "out-2",
            name: "Phonics Results",
            description: "Year 1 phonics outcomes",
          },
          {
            id: "out-3",
            name: "EYFS Outcomes",
            description: "GLD and prime area data",
          },
        ],
        keyIndicators: [
          "Outcomes in line with national",
          "Progress is strong from starting points",
          "All groups achieve well",
        ],
        inspectionFocus: [
          "What are outcomes in national tests?",
          "What is the trend over time?",
        ],
      },
      {
        id: "achievement-progress",
        name: "Progress",
        description:
          "How well pupils progress relative to their starting points",
        evidenceRequired: [
          {
            id: "prog-1",
            name: "Baseline Data",
            description: "Starting point assessments",
          },
          {
            id: "prog-2",
            name: "Progress Measures",
            description: "How progress is tracked",
          },
        ],
        keyIndicators: [
          "Pupils make strong progress from starting points",
          "Progress is consistent across curriculum",
        ],
        inspectionFocus: [
          "What progress do pupils make?",
          "How is progress measured?",
        ],
      },
      {
        id: "achievement-destinations",
        name: "Preparation for Next Stage",
        description:
          "How well pupils are prepared for the next stage of education",
        evidenceRequired: [
          {
            id: "dest-1",
            name: "Transition Data",
            description: "Outcomes at transition points",
          },
          {
            id: "dest-2",
            name: "Secondary Ready",
            description: "Preparation for secondary school",
          },
        ],
        keyIndicators: [
          "Pupils well-prepared for next stage",
          "Transition arrangements effective",
        ],
        inspectionFocus: ["Are pupils ready for next stage?"],
      },
    ],
  },
  // 4. Attendance and Behaviour
  {
    id: "attendance-behaviour",
    name: "Attendance and Behaviour",
    shortName: "Behaviour",
    description:
      "Pupils attendance, behaviour, attitudes to learning and conduct",
    color: "orange",
    subcategories: [
      {
        id: "attendance-overall",
        name: "Attendance",
        description: "Overall attendance and persistent absence rates",
        evidenceRequired: [
          {
            id: "att-1",
            name: "Attendance Data",
            description: "Current attendance rates",
          },
          {
            id: "att-2",
            name: "PA Data",
            description: "Persistent absence rates",
          },
          {
            id: "att-3",
            name: "Attendance Policy",
            description: "School attendance policy",
          },
        ],
        keyIndicators: [
          "Attendance in line with national (96%+)",
          "Persistent absence reducing",
          "Strong attendance culture",
        ],
        inspectionFocus: [
          "What is overall attendance?",
          "What is the PA rate?",
        ],
      },
      {
        id: "behaviour-conduct",
        name: "Conduct",
        description: "Behaviour in lessons and around school",
        evidenceRequired: [
          {
            id: "beh-1",
            name: "Behaviour Policy",
            description: "Behaviour and relationships policy",
          },
          {
            id: "beh-2",
            name: "Exclusion Data",
            description: "Exclusion rates and trends",
          },
        ],
        keyIndicators: [
          "High expectations consistently applied",
          "Behaviour at least good",
          "Bullying is rare and dealt with",
        ],
        inspectionFocus: [
          "What is behaviour like?",
          "Are expectations consistent?",
        ],
      },
      {
        id: "behaviour-attitudes",
        name: "Attitudes to Learning",
        description: "Pupils engagement and attitudes in lessons",
        evidenceRequired: [
          {
            id: "atl-1",
            name: "Pupil Voice",
            description: "What pupils say about learning",
          },
          {
            id: "atl-2",
            name: "Lesson Observations",
            description: "Evidence of engagement",
          },
        ],
        keyIndicators: [
          "Pupils engaged and focused",
          "Positive attitudes to learning",
        ],
        inspectionFocus: [
          "Are pupils engaged?",
          "How do pupils respond to challenge?",
        ],
      },
    ],
  },
  // 5. Personal Development
  {
    id: "personal-development",
    name: "Personal Development and Well-being",
    shortName: "Personal Dev",
    description:
      "The broader development of pupils as individuals and citizens",
    color: "violet",
    subcategories: [
      {
        id: "pd-character",
        name: "Character and Resilience",
        description: "Development of character, confidence and resilience",
        evidenceRequired: [
          {
            id: "char-1",
            name: "Character Education",
            description: "How character is developed",
          },
          {
            id: "char-2",
            name: "PSHE Curriculum",
            description: "Personal development curriculum",
          },
        ],
        keyIndicators: [
          "Character explicitly developed",
          "Pupils show resilience",
          "Confidence is built",
        ],
        inspectionFocus: ["How is character developed?"],
      },
      {
        id: "pd-citizenship",
        name: "Citizenship and British Values",
        description: "Preparation for life in modern Britain",
        evidenceRequired: [
          {
            id: "bv-1",
            name: "British Values Mapping",
            description: "How BV are taught",
          },
          {
            id: "bv-2",
            name: "Democracy",
            description: "Understanding of democracy",
          },
        ],
        keyIndicators: [
          "British Values embedded",
          "Respect for diversity",
          "Prepared for life in modern Britain",
        ],
        inspectionFocus: ["How are British Values taught?"],
      },
      {
        id: "pd-enrichment",
        name: "Enrichment",
        description: "Extra-curricular and enrichment provision",
        evidenceRequired: [
          {
            id: "enrich-1",
            name: "Enrichment Offer",
            description: "Clubs, trips, experiences",
          },
          {
            id: "enrich-2",
            name: "Participation Data",
            description: "Who accesses enrichment",
          },
        ],
        keyIndicators: [
          "Rich enrichment offer",
          "All pupils can access",
          "Builds cultural capital",
        ],
        inspectionFocus: ["What enrichment is offered?"],
      },
      {
        id: "pd-rse",
        name: "RSE",
        description: "Relationships, sex and health education",
        evidenceRequired: [
          {
            id: "rse-1",
            name: "RSE Policy",
            description: "Current RSE policy",
          },
          {
            id: "rse-2",
            name: "RSE Curriculum",
            description: "Coverage and progression",
          },
        ],
        keyIndicators: [
          "Statutory RSE delivered",
          "Parents consulted",
          "Pupils understand healthy relationships",
        ],
        inspectionFocus: ["Is RSE delivered effectively?"],
      },
    ],
  },
  // 6. Leadership and Governance
  {
    id: "leadership-governance",
    name: "Leadership and Governance",
    shortName: "Leadership",
    description:
      "The effectiveness of leadership at all levels including governance",
    color: "slate",
    subcategories: [
      {
        id: "leadership-vision",
        name: "Vision and Strategy",
        description: "Clarity and ambition of school vision",
        evidenceRequired: [
          {
            id: "vis-1",
            name: "Vision Statement",
            description: "School vision and values",
          },
          {
            id: "vis-2",
            name: "Development Plan",
            description: "Strategic improvement priorities",
          },
        ],
        keyIndicators: [
          "Clear and ambitious vision",
          "Accurate self-evaluation",
          "Strategic priorities are right",
        ],
        inspectionFocus: [
          "What is the school vision?",
          "Is self-evaluation accurate?",
        ],
      },
      {
        id: "leadership-governance",
        name: "Governance",
        description: "Effectiveness of governance and oversight",
        evidenceRequired: [
          {
            id: "gov-1",
            name: "Governor Minutes",
            description: "Evidence of challenge",
          },
          {
            id: "gov-2",
            name: "Governor Training",
            description: "Training and development",
          },
        ],
        keyIndicators: [
          "Governors know school well",
          "Effective support and challenge",
          "Statutory duties fulfilled",
        ],
        inspectionFocus: [
          "Do governors challenge effectively?",
          "Are statutory duties met?",
        ],
      },
      {
        id: "leadership-staff",
        name: "Staff Development",
        description: "How leaders develop staff and manage workload",
        evidenceRequired: [
          {
            id: "staff-1",
            name: "CPD Programme",
            description: "Staff development offer",
          },
          {
            id: "staff-2",
            name: "Workload Policy",
            description: "How workload is managed",
          },
        ],
        keyIndicators: [
          "Effective professional development",
          "Workload manageable",
          "Staff wellbeing prioritised",
        ],
        inspectionFocus: [
          "Is workload reasonable?",
          "How is staff wellbeing supported?",
        ],
      },
    ],
  },
];

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getCategory(
  categoryId: OfstedCategoryId,
): Category | undefined {
  return OFSTED_FRAMEWORK_DATA.find((c) => c.id === categoryId);
}

export function getSubcategory(
  subcategoryId: OfstedSubCategoryId,
): SubCategory | undefined {
  for (const category of OFSTED_FRAMEWORK_DATA) {
    const found = category.subcategories.find((s) => s.id === subcategoryId);
    if (found) return found;
  }
  return undefined;
}

// =====================================================
// SAFEGUARDING REQUIREMENTS (Assessed separately as Met/Not Met)
// =====================================================

export const SAFEGUARDING_REQUIREMENTS = [
  {
    id: "sg-policy",
    name: "Safeguarding Policy",
    description: "Current safeguarding policy referencing KCSIE 2024",
    priority: "required" as const,
  },
  {
    id: "sg-scr",
    name: "Single Central Record",
    description: "SCR present with all required fields for every staff member",
    priority: "required" as const,
  },
  {
    id: "sg-dbs",
    name: "DBS Checks",
    description: "All DBS check dates current and not expired",
    priority: "required" as const,
  },
  {
    id: "sg-dsl",
    name: "DSL Training",
    description: "Designated Safeguarding Lead training within 2 years",
    priority: "required" as const,
  },
  {
    id: "sg-online",
    name: "Online Safety Policy",
    description: "Online safety policy present and current",
    priority: "required" as const,
  },
  {
    id: "sg-training",
    name: "Staff Safeguarding Training",
    description: "Annual KCSIE Part 1 sign-off for all staff",
    priority: "required" as const,
  },
  {
    id: "sg-whistle",
    name: "Whistleblowing Policy",
    description: "Whistleblowing policy present and accessible",
    priority: "required" as const,
  },
  {
    id: "sg-recruit",
    name: "Safer Recruitment",
    description: "Safer recruitment procedures documented and followed",
    priority: "required" as const,
  },
  {
    id: "sg-referral",
    name: "Referral Procedures",
    description: "Clear procedures for making referrals to MASH/LADO",
    priority: "required" as const,
  },
  {
    id: "sg-culture",
    name: "Safeguarding Culture",
    description: "Evidence of whole-school safeguarding culture and awareness",
    priority: "recommended" as const,
  },
];

// =====================================================
// ADDITIONAL HELPER FUNCTIONS
// =====================================================

export function getSubcategories(categoryId: OfstedCategoryId): SubCategory[] {
  const category = OFSTED_FRAMEWORK_DATA.find((c) => c.id === categoryId);
  return category?.subcategories || [];
}

export function getCategoryEvidenceRequirements(
  categoryId: OfstedCategoryId,
): EvidenceItem[] {
  const category = OFSTED_FRAMEWORK_DATA.find((c) => c.id === categoryId);
  if (!category) return [];
  return category.subcategories.flatMap((sub) => sub.evidenceRequired);
}

export default OFSTED_FRAMEWORK_DATA;
