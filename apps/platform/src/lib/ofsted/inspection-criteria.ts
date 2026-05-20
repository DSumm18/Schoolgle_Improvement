// =====================================================
// Ofsted AI Inspector — Deep Inspection Knowledge Base
// Aligned to EIF 2025 Framework, UK Legislation & DfE Guidance
// =====================================================
//
// This file contains the expert knowledge an AI inspector needs
// to assess every evidence item in the framework to a standard
// that matches or exceeds a real Ofsted inspector's scrutiny.
//
// For each subcategory we define:
//   - The statutory/regulatory basis (what legislation applies)
//   - Rating descriptors aligned to the Ofsted 5-point scale
//   - Per-evidence-item inspection criteria (what to check)
//   - Red flags that would concern an inspector
//   - What "exceptional" looks like vs "needs attention"
// =====================================================

import type { OfstedSubCategoryId } from "./types";

/**
 * Ofsted 5-point rating scale with descriptions aligned to EIF 2025.
 * This replaces the old 4-point scale (Outstanding/Good/RI/Inadequate).
 */
export const RATING_DESCRIPTORS = {
  exceptional: {
    label: "Exceptional",
    score: 5,
    description:
      "Practice is exemplary and could be a model for other schools. Goes significantly beyond statutory requirements with demonstrable impact.",
    colour: "emerald",
  },
  strong_standard: {
    label: "Strong Standard",
    score: 4,
    description:
      "Meets all statutory requirements confidently. Evidence is thorough, current, and shows clear impact on outcomes.",
    colour: "green",
  },
  expected_standard: {
    label: "Expected Standard",
    score: 3,
    description:
      "Meets the majority of requirements. Some minor gaps or areas for development but no significant concerns.",
    colour: "amber",
  },
  needs_attention: {
    label: "Needs Attention",
    score: 2,
    description:
      "Significant gaps in compliance or quality. Missing key statutory references, out of date, or lacks evidence of impact.",
    colour: "orange",
  },
  urgent_improvement: {
    label: "Urgent Improvement",
    score: 1,
    description:
      "Fails to meet statutory requirements. Would likely result in an action point or negative judgement at inspection.",
    colour: "red",
  },
} as const;

/**
 * Per-evidence-item inspection rules.
 * Each rule tells the AI exactly what to look for and how to rate it.
 */
export interface EvidenceInspectionRule {
  /** Evidence item ID from framework-data.ts (e.g. "send-1") */
  evidenceId: string;
  /** Human name */
  name: string;
  /** Legislation and guidance that applies */
  legislation: string[];
  /** What the AI must check in the document content */
  checkpoints: string[];
  /** Red flags that would lower the rating */
  redFlags: string[];
  /** What exceptional practice looks like */
  exceptionalIndicators: string[];
  /** What would make this "urgent improvement" */
  failureCriteria: string[];
}

/**
 * Per-subcategory inspection knowledge.
 */
export interface SubcategoryInspectionKnowledge {
  subcategoryId: OfstedSubCategoryId;
  /** The overarching inspection question (what Ofsted asks) */
  coreQuestion: string;
  /** Statutory basis */
  legislation: string[];
  /** What exceptional looks like for this whole area */
  exceptionalDescriptor: string;
  /** What strong standard looks like */
  strongDescriptor: string;
  /** What expected standard looks like */
  expectedDescriptor: string;
  /** What needs attention looks like */
  needsAttentionDescriptor: string;
  /** What urgent improvement looks like */
  urgentDescriptor: string;
  /** Per-evidence inspection rules */
  evidenceRules: EvidenceInspectionRule[];
}

// =====================================================
// FULL INSPECTION KNOWLEDGE BASE
// =====================================================

export const INSPECTION_KNOWLEDGE: SubcategoryInspectionKnowledge[] = [
  // ===================================================
  // 1. INCLUSION
  // ===================================================
  {
    subcategoryId: "inclusion-send",
    coreQuestion:
      "How effectively does the school identify and support pupils with SEND so they achieve the best possible outcomes?",
    legislation: [
      "Children and Families Act 2014",
      "SEND Code of Practice 2015 (0-25)",
      "Equality Act 2010",
      "KCSIE 2024/2025",
      "National Award for SEN Coordination regulations",
    ],
    exceptionalDescriptor:
      "SEND provision is exemplary. The graduated approach is embedded with clear evidence of impact. The SENCO is a qualified leader who drives whole-school SEND strategy. Outcomes for SEND pupils are strong and gaps are closing. Parents are genuine partners. External agencies are engaged proactively.",
    strongDescriptor:
      "All statutory requirements are met. The SEND policy is current and comprehensive. The graduated approach is clearly implemented. The SENCO holds or is working towards the National Award. Provision mapping shows targeted support with evidence of impact.",
    expectedDescriptor:
      "Most requirements are met. The policy references correct legislation but may lack specificity in some areas. The graduated approach is described but evidence of consistent implementation is limited. Some gaps in transition or parental engagement sections.",
    needsAttentionDescriptor:
      "Significant gaps in the SEND policy. Missing references to key legislation. No evidence of the graduated approach. SENCO qualifications not mentioned. Limited evidence of how different need types are addressed.",
    urgentDescriptor:
      "The SEND policy is absent, severely out of date, or fails to meet statutory requirements. No evidence of the graduated approach. SENCO arrangements unclear. Would likely result in a negative judgement at inspection.",
    evidenceRules: [
      {
        evidenceId: "send-1",
        name: "SEND Policy",
        legislation: [
          "Children and Families Act 2014 Part 3",
          "SEND Code of Practice 2015 Chapter 6",
          "Equality Act 2010 Sections 20, 21, 149",
          "KCSIE 2024/2025",
        ],
        checkpoints: [
          "References Children and Families Act 2014",
          "References SEND Code of Practice 2015 (0-25 years)",
          "References Equality Act 2010",
          "References current KCSIE edition (2024 or 2025)",
          "Names the SENCO with qualifications (National Award for SEN Coordination or working towards)",
          "Describes the graduated approach: Assess, Plan, Do, Review cycle explicitly",
          "Covers all four areas of need: Communication & Interaction, Cognition & Learning, SEMH, Sensory/Physical",
          "Describes how SEND is identified and assessed (screening, referrals, diagnostic tools)",
          "Describes how the school works with parents/carers as partners in SEND",
          "Covers transition arrangements (between key stages, to/from the school, post-16 where relevant)",
          "Includes a review date within the current academic year (Sept 2025 - Aug 2026)",
          "Describes how effectiveness of SEND provision is monitored and evaluated",
          "Mentions the Local Offer and how parents can access it",
          "Describes how EHCPs are reviewed annually",
          "Mentions reasonable adjustments under the Equality Act",
        ],
        redFlags: [
          "Review date is more than 12 months old",
          "References outdated legislation (e.g. 2001 SEN Code of Practice, old KCSIE editions)",
          "Does not name the SENCO",
          "No mention of the graduated approach",
          "Missing areas of need",
          "No mention of parental engagement",
          "No mention of transition",
        ],
        exceptionalIndicators: [
          "Includes outcome data showing SEND pupil progress",
          "References specific evidence-based interventions",
          "Shows how the SENCO works strategically with SLT",
          "Includes a clear complaints procedure specific to SEND provision",
          "References the school's accessibility plan",
        ],
        failureCriteria: [
          "No SEND policy exists",
          "Policy predates 2014 Children and Families Act",
          "No SENCO identified",
          "No mention of graduated approach",
          "Review date more than 2 years old",
        ],
      },
      {
        evidenceId: "send-2",
        name: "Graduated Approach",
        legislation: ["SEND Code of Practice 2015 Chapter 6.44-6.56"],
        checkpoints: [
          "Clear description of the Assess stage (how needs are identified and assessed)",
          "Clear description of the Plan stage (how support is planned with parents and pupil)",
          "Clear description of the Do stage (how interventions are implemented)",
          "Clear description of the Review stage (how impact is measured and next steps agreed)",
          "Evidence the cycle repeats and is documented",
          "Shows how external agencies are involved when school support is insufficient",
          "Evidence of individual support plans or provision maps",
        ],
        redFlags: [
          "Generic description without specifics",
          "No evidence the cycle is actually used",
          "No mention of parental involvement in planning",
        ],
        exceptionalIndicators: [
          "Includes anonymised case studies showing the cycle in action",
          "Shows measurable outcomes from interventions",
          "Evidence of staff training on the graduated approach",
        ],
        failureCriteria: [
          "No evidence of the graduated approach at all",
          "Support appears reactive rather than planned",
        ],
      },
      {
        evidenceId: "send-3",
        name: "Provision Map",
        legislation: ["SEND Code of Practice 2015 Chapter 6.72-6.74"],
        checkpoints: [
          "Maps interventions to individual or groups of pupils",
          "Shows the type of support (in-class, withdrawal, 1:1, group)",
          "Includes frequency and duration of interventions",
          "Shows who delivers each intervention",
          "Includes entry and exit criteria for interventions",
          "Shows impact/progress data from interventions",
        ],
        redFlags: [
          "Provision map is just a list with no impact data",
          "Same interventions for all pupils regardless of need",
          "No review dates on the provision map",
        ],
        exceptionalIndicators: [
          "Cost-per-pupil analysis of interventions",
          "Links to EEF evidence base for chosen interventions",
          "Clear entry/exit criteria with outcome tracking",
        ],
        failureCriteria: [
          "No provision mapping exists",
          "No evidence of targeted support",
        ],
      },
      {
        evidenceId: "send-4",
        name: "EHCP Reviews",
        legislation: [
          "SEND Code of Practice 2015 Chapter 9.166-9.169",
          "Children and Families Act 2014 Section 44",
        ],
        checkpoints: [
          "Annual reviews are held within 12 months of last review",
          "Parents/carers are invited and involved",
          "The pupil's views are sought and recorded",
          "Professionals are invited as appropriate",
          "Outcomes from the EHCP are reviewed for progress",
          "Recommendations for changes to the plan are documented",
        ],
        redFlags: [
          "Reviews overdue (more than 12 months since last)",
          "No evidence of pupil voice",
          "No evidence of parental involvement",
        ],
        exceptionalIndicators: [
          "Person-centred review approach with the pupil leading where possible",
          "Multi-agency contributions are thorough",
          "Clear progress against EHCP outcomes with data",
        ],
        failureCriteria: [
          "Annual reviews are not being held",
          "No documentation of reviews",
        ],
      },
      {
        evidenceId: "send-5",
        name: "SENCO Role",
        legislation: [
          "SEND Code of Practice 2015 Chapter 6.84-6.94",
          "Children and Families Act 2014 Section 67",
          "The Education (Special Educational Needs Co-ordinators) (England) Regulations 2014",
        ],
        checkpoints: [
          "SENCO is named and contactable",
          "SENCO holds the National Award for SEN Coordination (or is working towards it within 3 years of appointment)",
          "SENCO is a qualified teacher",
          "SENCO has dedicated time for the role",
          "Evidence of SENCO's strategic involvement with SLT",
          "Evidence of SENCO leading staff CPD on SEND",
        ],
        redFlags: [
          "SENCO does not have the National Award and has been in post more than 3 years",
          "SENCO has no dedicated time for the role",
          "SENCO is not a qualified teacher",
        ],
        exceptionalIndicators: [
          "SENCO is on the senior leadership team",
          "SENCO leads whole-school SEND improvement",
          "Evidence of SENCO networking with other schools/MAT",
        ],
        failureCriteria: [
          "No SENCO appointed",
          "SENCO is not a qualified teacher",
          "No evidence of SENCO leadership",
        ],
      },
    ],
  },

  {
    subcategoryId: "inclusion-disadvantaged",
    coreQuestion:
      "How effectively does the school use Pupil Premium funding to improve outcomes for disadvantaged pupils?",
    legislation: [
      "Pupil Premium Conditions of Grant (DfE, annually)",
      "Pupil Premium Strategy Statement requirement (DfE)",
      "EEF Teaching and Learning Toolkit",
    ],
    exceptionalDescriptor:
      "PP strategy is evidence-based (EEF Toolkit), outcomes for PP pupils are at or above national for non-PP, attendance gaps are closing, and the strategy is reviewed termly with clear impact data.",
    strongDescriptor:
      "PP strategy is published on the website as required. Spending is linked to identified barriers. Outcomes show PP pupils making good progress. Attendance data is disaggregated.",
    expectedDescriptor:
      "PP strategy exists and references some barriers. Spending is broadly appropriate but impact evidence is limited. Some gaps remain in outcomes.",
    needsAttentionDescriptor:
      "PP strategy is generic or out of date. Spending is not clearly linked to barriers. Gaps in outcomes are persistent or widening.",
    urgentDescriptor:
      "No PP strategy published. Funding not accounted for. Significant gaps in outcomes with no plan to address them.",
    evidenceRules: [
      {
        evidenceId: "pp-1",
        name: "Pupil Premium Strategy",
        legislation: [
          "Pupil Premium Conditions of Grant (annual DfE guidance)",
          "DfE Pupil Premium Strategy Statement template",
        ],
        checkpoints: [
          "Published on the school website (statutory requirement)",
          "Uses the DfE recommended template or equivalent",
          "Identifies specific barriers to learning for disadvantaged pupils",
          "Links spending to identified barriers",
          "References the EEF Teaching and Learning Toolkit or other evidence base",
          "Includes measurable intended outcomes",
          "Shows the total PP allocation and how it is spent",
          "Includes review date and evidence of annual review",
          "Shows 3-year plan (DfE recommended since 2021)",
        ],
        redFlags: [
          "Not published on school website",
          "No barriers identified — just a list of spending",
          "Spending on generic items not linked to disadvantaged pupils",
          "No reference to evidence base",
          "Out of date (previous academic year)",
        ],
        exceptionalIndicators: [
          "Termly review with impact data",
          "External review conducted (EEF/LA)",
          "Links to school improvement plan priorities",
          "Includes qualitative outcomes (pupil voice, attendance, behaviour)",
        ],
        failureCriteria: [
          "No PP strategy exists",
          "PP funding not accounted for",
          "Strategy is more than 2 years old",
        ],
      },
      {
        evidenceId: "pp-2",
        name: "PP Outcomes",
        legislation: ["Education Act 2002 Section 29 (school performance)"],
        checkpoints: [
          "Attainment data for PP vs non-PP (school and national)",
          "Progress data for PP vs non-PP",
          "Trends over at least 2 years",
          "Data broken down by key stage",
          "Gaps identified and tracked",
        ],
        redFlags: [
          "No disaggregated data",
          "Gaps widening with no explanation",
          "Data only shows attainment, not progress",
        ],
        exceptionalIndicators: [
          "Gaps are closing over time with clear evidence",
          "PP outcomes at or above national non-PP",
          "In-year tracking shows rapid improvement",
        ],
        failureCriteria: [
          "No outcome data for PP pupils",
          "Significant gaps with no strategy to address",
        ],
      },
      {
        evidenceId: "pp-3",
        name: "Intervention Impact",
        legislation: ["EEF Teaching and Learning Toolkit"],
        checkpoints: [
          "Each intervention has a clear rationale",
          "Impact is measured with pre/post data",
          "Cost per pupil is considered",
          "Interventions are evidence-based (EEF rated)",
          "Interventions that don't work are stopped",
        ],
        redFlags: [
          "Interventions run without impact data",
          "Same interventions year after year with no review",
          "Very expensive interventions with low impact",
        ],
        exceptionalIndicators: [
          "Cost-benefit analysis for each intervention",
          "Evidence of adapting interventions based on data",
          "Published impact reports",
        ],
        failureCriteria: [
          "No evidence of any targeted interventions",
          "PP funding used for whole-school resources with no PP focus",
        ],
      },
      {
        evidenceId: "pp-4",
        name: "Attendance Data",
        legislation: [
          "Working Together to Improve School Attendance (DfE 2024)",
        ],
        checkpoints: [
          "Attendance data disaggregated for PP vs non-PP",
          "Persistent absence rates for PP pupils",
          "Comparison with national rates",
          "Actions being taken to close attendance gaps",
        ],
        redFlags: [
          "PP attendance significantly below national",
          "No attendance strategies targeting PP pupils",
          "PA rate for PP above 20%",
        ],
        exceptionalIndicators: [
          "PP attendance in line with or above whole-school",
          "Named attendance champion for PP pupils",
          "Home-school attendance partnership visible",
        ],
        failureCriteria: [
          "No attendance data for PP pupils",
          "PA rate for PP above 30% with no action",
        ],
      },
    ],
  },

  {
    subcategoryId: "inclusion-mental-health",
    coreQuestion:
      "How effectively does the school promote positive mental health and support pupils who need it?",
    legislation: [
      "DfE Mental Health and Behaviour in Schools guidance (2018)",
      "Senior Mental Health Lead training grant (DfE)",
      "KCSIE 2024/2025 — mental health sections",
      "Children Act 2004",
    ],
    exceptionalDescriptor:
      "Whole-school approach to mental health with trained senior MH lead. Clear referral pathways. Universal, targeted and specialist provision. Staff trained in mental health first aid. Pupil and parent voice informs provision.",
    strongDescriptor:
      "Senior MH lead is trained (DfE funded). Wellbeing is embedded in the curriculum. Referral pathways are clear. Staff know how to identify and escalate concerns.",
    expectedDescriptor:
      "Some provision exists but may lack a strategic whole-school approach. Staff awareness is variable. Referral pathways exist but may not be widely known.",
    needsAttentionDescriptor:
      "No designated MH lead. Limited provision beyond reactive support. Staff lack training in recognising mental health needs.",
    urgentDescriptor:
      "No mental health provision. Staff unaware of how to identify or respond to mental health concerns. No referral pathways.",
    evidenceRules: [
      {
        evidenceId: "mh-1",
        name: "Mental Health Lead",
        legislation: [
          "DfE Senior Mental Health Lead training programme",
          "KCSIE 2024/2025",
        ],
        checkpoints: [
          "A senior leader is designated as the Mental Health Lead",
          "The MH Lead has completed DfE-funded training (or equivalent)",
          "The MH Lead's role and responsibilities are defined",
          "The MH Lead has dedicated time for the role",
        ],
        redFlags: [
          "No designated MH lead",
          "MH lead has no relevant training",
          "Role is nominal with no dedicated time",
        ],
        exceptionalIndicators: [
          "MH lead is on SLT and drives strategic approach",
          "MH lead has additional qualifications (ELSA trainer, CBT, etc.)",
          "MH lead leads school-wide training programme",
        ],
        failureCriteria: [
          "No one is responsible for mental health in the school",
          "No awareness of the DfE MH lead programme",
        ],
      },
      {
        evidenceId: "mh-2",
        name: "Wellbeing Curriculum",
        legislation: [
          "DfE Relationships, RSE and Health Education (2019)",
          "DfE Mental Health and Behaviour guidance",
        ],
        checkpoints: [
          "Wellbeing/mental health is explicitly taught (not just PSHE)",
          "Content is age-appropriate across all year groups",
          "Covers emotional regulation, resilience, and coping strategies",
          "Links to wider PSHE/RSE curriculum",
        ],
        redFlags: [
          "No explicit teaching of mental health/wellbeing",
          "Only reactive support, no preventive education",
        ],
        exceptionalIndicators: [
          "Evidence-based programmes used (e.g., Zones of Regulation, Thrive)",
          "Pupil voice shapes the wellbeing curriculum",
          "Impact data on pupil wellbeing over time",
        ],
        failureCriteria: [
          "No wellbeing content in the curriculum",
          "Wellbeing is entirely outsourced with no school ownership",
        ],
      },
      {
        evidenceId: "mh-3",
        name: "Support Systems",
        legislation: ["KCSIE 2024/2025", "Children Act 2004"],
        checkpoints: [
          "Clear referral pathway from identification to support",
          "Tiered support model (universal, targeted, specialist)",
          "Links to external services (CAMHS, counselling, EPs)",
          "System for recording and tracking MH concerns",
          "Crisis support procedures in place",
        ],
        redFlags: [
          "No referral pathway documented",
          "Long waits with no interim support",
          "Staff don't know how to refer",
        ],
        exceptionalIndicators: [
          "In-house counselling or therapeutic provision",
          "Same-day referral for urgent concerns",
          "Multi-agency working is routine",
        ],
        failureCriteria: [
          "No support systems in place",
          "Children with mental health needs go unsupported",
        ],
      },
    ],
  },

  // ===================================================
  // 2. CURRICULUM AND TEACHING
  // ===================================================
  {
    subcategoryId: "curriculum-intent",
    coreQuestion:
      "Is the curriculum ambitious for all pupils, coherently planned and sequenced towards clearly defined end points?",
    legislation: [
      "National Curriculum in England: framework document (DfE 2014)",
      "Education Act 2002 Section 78-80",
      "Ofsted EIF 2025 — Quality of Education",
    ],
    exceptionalDescriptor:
      "The curriculum is exceptionally well-designed with clear rationale. Every subject has a defined intent with knowledge and skills progression mapped from EYFS to Year 6/KS3+. The curriculum reflects the school's context and is ambitious for all pupils including SEND.",
    strongDescriptor:
      "Curriculum is well-structured with clear intent. Subjects are sequenced logically. National Curriculum is fully covered. The curriculum is adapted for the school's context.",
    expectedDescriptor:
      "Curriculum overview exists and covers the National Curriculum. Some subjects may lack detailed progression. Intent is broadly clear but implementation may be inconsistent.",
    needsAttentionDescriptor:
      "Curriculum lacks coherent design. Some subjects are underdeveloped. Progression is unclear. Limited adaptation for school context.",
    urgentDescriptor:
      "No coherent curriculum. National Curriculum not fully covered. Curriculum is narrow or lacks ambition.",
    evidenceRules: [
      {
        evidenceId: "intent-1",
        name: "Curriculum Overview",
        legislation: [
          "National Curriculum framework (DfE 2014)",
          "Education Act 2002 Section 78",
        ],
        checkpoints: [
          "Whole-school curriculum map covering all year groups",
          "All National Curriculum subjects are included",
          "Coverage of statutory RE requirements",
          "Clear time allocation for each subject",
          "Shows how subjects connect and build on each other",
          "Reflects the school's context and pupil needs",
        ],
        redFlags: [
          "Missing subjects from the National Curriculum",
          "Disproportionate time on core at expense of foundation subjects",
          "No consideration of school context",
        ],
        exceptionalIndicators: [
          "Cross-curricular links explicitly mapped",
          "Cultural capital explicitly built into the curriculum",
          "Curriculum reviewed and updated based on pupil outcomes",
        ],
        failureCriteria: [
          "No curriculum overview exists",
          "National Curriculum not fully covered",
          "Curriculum is significantly narrowed",
        ],
      },
      {
        evidenceId: "intent-2",
        name: "Subject Policies",
        legislation: ["National Curriculum subject programmes of study"],
        checkpoints: [
          "Each subject has a clear intent statement",
          "Intent explains what pupils will know and be able to do",
          "Approach to teaching the subject is defined",
          "Assessment approach for the subject is described",
        ],
        redFlags: [
          "Generic intent statements copied from other schools",
          "No subject-specific rationale",
          "Intent doesn't match what is actually taught",
        ],
        exceptionalIndicators: [
          "Intent written by subject leaders with deep knowledge",
          "References current research in subject pedagogy",
          "Shows how the subject contributes to the wider school vision",
        ],
        failureCriteria: [
          "No subject policies exist",
          "Subjects taught without clear purpose",
        ],
      },
      {
        evidenceId: "intent-3",
        name: "Progression Maps",
        legislation: ["National Curriculum programmes of study"],
        checkpoints: [
          "Shows how knowledge builds from year to year",
          "Identifies the key knowledge and skills for each year group",
          "Shows prior learning that pupils build on",
          "Includes vocabulary progression",
        ],
        redFlags: [
          "No progression visible — topics repeated without building",
          "Gaps in coverage between year groups",
          "Knowledge and skills not distinguished",
        ],
        exceptionalIndicators: [
          "Spaced retrieval and interleaving built into the sequence",
          "Links to cognitive science research on memory and learning",
          "Regularly reviewed based on pupil outcomes",
        ],
        failureCriteria: [
          "No progression planning exists",
          "Teachers plan in isolation with no sequence",
        ],
      },
    ],
  },

  {
    subcategoryId: "curriculum-implementation",
    coreQuestion:
      "Do teachers have good subject knowledge and use effective pedagogical approaches to help pupils learn and remember the curriculum?",
    legislation: [
      "Teachers' Standards (DfE 2011, updated 2021)",
      "ECF (Early Career Framework, DfE 2019)",
      "Ofsted EIF 2025",
    ],
    exceptionalDescriptor:
      "Teaching is consistently excellent. Teachers demonstrate deep subject knowledge. Pedagogy is research-informed. Assessment is used diagnostically to adapt teaching in real time. CPD is sustained and impactful.",
    strongDescriptor:
      "Teaching is effective across the school. Teachers have secure subject knowledge. Assessment identifies gaps and informs teaching. Good CPD programme in place.",
    expectedDescriptor:
      "Teaching is broadly effective but inconsistent. Some teachers lack confidence in subject knowledge. Assessment is used but not always to adapt teaching.",
    needsAttentionDescriptor:
      "Teaching quality is variable. Assessment is not used effectively. Limited CPD. Some teachers lack subject knowledge.",
    urgentDescriptor:
      "Teaching is weak. Pupils are not learning the curriculum. Assessment is poor or non-existent. No professional development.",
    evidenceRules: [
      {
        evidenceId: "teach-1",
        name: "Lesson Observations",
        legislation: ["Teachers' Standards (DfE 2011, updated 2021)"],
        checkpoints: [
          "Observations cover a range of subjects and year groups",
          "Focus is on pupil learning, not just teacher performance",
          "Evidence of adaptive teaching (responding to misconceptions)",
          "Feedback given to teachers with development points",
          "Follow-up shows improvement over time",
        ],
        redFlags: [
          "Observations are tick-box exercises",
          "No follow-up or development from observations",
          "Only core subjects observed",
          "Grading of individual lessons (Ofsted stopped this in 2014)",
        ],
        exceptionalIndicators: [
          "Peer observation culture embedded",
          "Focus on pupil outcomes not teacher performance",
          "Links to CPD programme and Teachers' Standards",
        ],
        failureCriteria: [
          "No lesson observations conducted",
          "Teaching quality unknown to leaders",
        ],
      },
      {
        evidenceId: "teach-2",
        name: "Work Scrutiny",
        legislation: ["Ofsted EIF 2025 — curriculum implementation"],
        checkpoints: [
          "Work scrutiny covers multiple subjects and year groups",
          "Shows progression over time (not just snapshots)",
          "Evidence of feedback and pupil response",
          "Shows how well the curriculum is being taught (curriculum fidelity)",
          "SEND pupils' work shows appropriate support and challenge",
        ],
        redFlags: [
          "Work scrutiny only done for Ofsted preparation",
          "No evidence of progression over time",
          "Presentation valued over learning",
        ],
        exceptionalIndicators: [
          "Moderated within and across schools",
          "Clear link between curriculum intent and what pupils produce",
          "Shows deep learning and retrieval over time",
        ],
        failureCriteria: [
          "No work scrutiny conducted",
          "Leaders cannot evidence curriculum delivery",
        ],
      },
      {
        evidenceId: "teach-3",
        name: "Assessment Policy",
        legislation: [
          "Commission on Assessment Without Levels (DfE 2015)",
          "Primary Assessment Reforms (DfE)",
        ],
        checkpoints: [
          "Clear assessment policy in place",
          "Formative and summative assessment described",
          "Assessment is used to identify gaps and inform teaching",
          "Reporting to parents is described",
          "Moderation procedures in place",
        ],
        redFlags: [
          "Assessment driven by data collection not teaching",
          "Over-testing of pupils",
          "Assessment system not understood by all staff",
        ],
        exceptionalIndicators: [
          "Assessment is integral to teaching (assessment FOR learning)",
          "Moderation is regular and collaborative",
          "Parents receive clear, useful reports",
        ],
        failureCriteria: [
          "No assessment policy",
          "Assessment is ad hoc with no school-wide approach",
        ],
      },
    ],
  },

  {
    subcategoryId: "curriculum-reading",
    coreQuestion:
      "Does the school teach reading effectively, including through a systematic synthetic phonics programme?",
    legislation: [
      "DfE validated SSP programmes list",
      "National Curriculum English programme of study",
      "Ofsted Bold Beginnings (2017)",
      "Ofsted Reading Framework (2022)",
    ],
    exceptionalDescriptor:
      "Reading is at the heart of the curriculum. A validated SSP is implemented with complete fidelity. Every child who falls behind gets immediate, effective support. Reading for pleasure is embedded. Staff expertise is outstanding.",
    strongDescriptor:
      "A DfE-validated SSP is used consistently. Books are matched to phonics knowledge. Staff are well-trained. Children who fall behind are identified quickly and supported.",
    expectedDescriptor:
      "An SSP is in use and broadly implemented. Most books are matched. Some inconsistency in implementation across classes.",
    needsAttentionDescriptor:
      "Phonics programme is not DfE validated or implementation is inconsistent. Books are not well-matched. Some children fall behind without timely support.",
    urgentDescriptor:
      "No systematic phonics programme. Children are not learning to read effectively. No strategy for children who fall behind.",
    evidenceRules: [
      {
        evidenceId: "read-1",
        name: "Phonics Programme",
        legislation: [
          "DfE validated SSP programmes list (2021+)",
          "National Curriculum Key Stage 1 English",
        ],
        checkpoints: [
          "Programme is on the DfE validated list (e.g., Little Wandle, Read Write Inc, Floppy's Phonics)",
          "Implemented with fidelity (not mixed with other approaches)",
          "Daily phonics sessions for EYFS and KS1",
          "Staff are trained in the specific programme",
          "Keep-up and catch-up procedures for children who fall behind",
          "Books are fully decodable and matched to phonics stage",
        ],
        redFlags: [
          "Programme not on DfE validated list",
          "Mixed methods approach (multi-cueing)",
          "Books not matched to phonics knowledge",
          "Infrequent phonics sessions",
        ],
        exceptionalIndicators: [
          "Phonics results consistently above national",
          "100% of staff trained and confident",
          "Rapid intervention for children who fall behind",
          "Lower KS2 catch-up programme for older struggling readers",
        ],
        failureCriteria: [
          "No systematic phonics teaching",
          "Multi-cueing strategies used instead of phonics",
          "Children left to struggle without intervention",
        ],
      },
      {
        evidenceId: "read-2",
        name: "Reading Curriculum",
        legislation: [
          "National Curriculum English programme of study",
          "Ofsted Reading Framework (2022)",
        ],
        checkpoints: [
          "Reading curriculum extends beyond phonics into KS2",
          "Approach to comprehension and fluency is defined",
          "Reading for pleasure is promoted and embedded",
          "A range of high-quality texts is used across the school",
          "Reading is taught across the curriculum, not just in English",
        ],
        redFlags: [
          "Reading stops at phonics — no comprehension strategy",
          "Limited range of texts",
          "Reading for pleasure is not prioritised",
        ],
        exceptionalIndicators: [
          "Rich reading culture with author visits, book fairs, library",
          "Reading stamina explicitly built",
          "Data shows strong reading outcomes across all groups",
        ],
        failureCriteria: [
          "No reading curriculum beyond phonics",
          "Children not reading regularly",
        ],
      },
    ],
  },

  // ===================================================
  // 3. ACHIEVEMENT
  // ===================================================
  {
    subcategoryId: "achievement-outcomes",
    coreQuestion:
      "What do pupils achieve in national assessments and how does this compare to national expectations?",
    legislation: [
      "Education Act 2002",
      "Standards and Testing Agency framework",
    ],
    exceptionalDescriptor:
      "Outcomes are consistently above national. All groups achieve well. Trends show sustained improvement. The school has strong value-added.",
    strongDescriptor:
      "Outcomes are at or above national. Most groups achieve well. Positive trends over time.",
    expectedDescriptor:
      "Outcomes are broadly in line with national. Some groups may underperform. Trends are stable.",
    needsAttentionDescriptor:
      "Outcomes are below national in key areas. Gaps between groups are significant. Trends are flat or declining.",
    urgentDescriptor:
      "Outcomes are significantly below national. Multiple groups underperforming. Declining trends.",
    evidenceRules: [
      {
        evidenceId: "out-1",
        name: "KS2 Results",
        legislation: ["Standards and Testing Agency KS2 framework"],
        checkpoints: [
          "Combined RWM results compared to national",
          "Individual subject results (reading, writing, maths, GPS)",
          "Progress scores in reading, writing, maths",
          "Trends over at least 3 years",
          "Disadvantaged and SEND pupil outcomes",
          "Greater depth/higher standard attainment",
        ],
        redFlags: [
          "Below national in combined RWM",
          "Negative progress scores",
          "Declining trends",
          "Significant gaps for disadvantaged",
        ],
        exceptionalIndicators: [
          "Above national in all areas",
          "Positive progress scores",
          "Gaps closing",
          "High proportion at greater depth",
        ],
        failureCriteria: [
          "Significantly below national",
          "Persistent negative progress scores",
        ],
      },
      {
        evidenceId: "out-2",
        name: "Phonics Results",
        legislation: ["DfE Phonics Screening Check"],
        checkpoints: [
          "Year 1 phonics pass rate compared to national (typically 79-82%)",
          "Year 2 retake results",
          "Disadvantaged and SEND pupil results",
          "Trends over time",
        ],
        redFlags: [
          "Below national pass rate",
          "Low retake pass rate",
          "Significant PP gap",
        ],
        exceptionalIndicators: [
          "Above national",
          "Near 100% by end of Year 2",
          "PP gap closed",
        ],
        failureCriteria: [
          "Significantly below national",
          "Many children failing to pass by Year 2",
        ],
      },
      {
        evidenceId: "out-3",
        name: "EYFS Outcomes",
        legislation: ["EYFS Statutory Framework (DfE 2024)", "EYFS Profile"],
        checkpoints: [
          "GLD (Good Level of Development) percentage vs national",
          "Prime areas outcomes",
          "Specific areas outcomes",
          "Disadvantaged and SEND outcomes",
          "Communication and Language outcomes",
        ],
        redFlags: [
          "GLD below national",
          "Significant gaps in prime areas",
          "Boys significantly behind girls",
        ],
        exceptionalIndicators: [
          "GLD above national",
          "Strong prime area outcomes",
          "Gaps closing",
        ],
        failureCriteria: [
          "GLD significantly below national",
          "Poor prime area outcomes",
        ],
      },
    ],
  },

  {
    subcategoryId: "achievement-progress",
    coreQuestion:
      "How well do all pupils, including those with SEND and disadvantaged pupils, progress from their starting points?",
    legislation: ["Ofsted EIF 2025", "DfE Progress Measures"],
    exceptionalDescriptor:
      "All groups make strong progress from their starting points. In-school tracking shows accelerated progress for those who started behind. Value-added is consistently positive.",
    strongDescriptor:
      "Most pupils make good progress. Tracking shows positive trends. Groups that started behind are catching up.",
    expectedDescriptor:
      "Progress is broadly in line with expectations. Some variation between groups.",
    needsAttentionDescriptor:
      "Progress is inconsistent. Some groups are not making enough progress. Tracking systems may be unreliable.",
    urgentDescriptor:
      "Progress is weak across the school. Pupils are not learning enough. No reliable tracking.",
    evidenceRules: [
      {
        evidenceId: "prog-1",
        name: "Baseline Data",
        legislation: [
          "EYFS Statutory Framework",
          "Reception Baseline Assessment (DfE)",
        ],
        checkpoints: [
          "Reception Baseline Assessment completed",
          "Starting points for all year groups established",
          "Baseline is reliable and moderated",
          "Used to set ambitious targets",
        ],
        redFlags: [
          "No baseline data",
          "Baseline not used to inform teaching",
          "Targets not set from baseline",
        ],
        exceptionalIndicators: [
          "Multiple data points create rich picture of starting points",
          "Baseline used to identify early intervention needs",
        ],
        failureCriteria: [
          "No baseline assessment",
          "No knowledge of pupils' starting points",
        ],
      },
      {
        evidenceId: "prog-2",
        name: "Progress Measures",
        legislation: ["DfE Progress Measures", "Ofsted EIF 2025"],
        checkpoints: [
          "Clear system for tracking progress against curriculum expectations",
          "Data analysed by group (PP, SEND, gender, ethnicity)",
          "Pupil progress meetings held regularly",
          "Actions taken when progress stalls",
        ],
        redFlags: [
          "Tracking is infrequent",
          "No group analysis",
          "No action when progress stalls",
          "Over-reliance on a single tracking system",
        ],
        exceptionalIndicators: [
          "Termly pupil progress meetings with clear actions",
          "Rapid intervention when progress stalls",
          "Data is accurate and moderated",
        ],
        failureCriteria: [
          "No progress tracking",
          "Leaders don't know how well pupils are doing",
        ],
      },
    ],
  },

  {
    subcategoryId: "achievement-destinations",
    coreQuestion:
      "How well does the school prepare pupils for the next stage of their education?",
    legislation: ["Education Act 2002", "EYFS Statutory Framework"],
    exceptionalDescriptor:
      "Pupils are exceptionally well-prepared for the next stage. Transition is managed collaboratively with receiving schools. Pupils have the knowledge, skills and confidence to thrive.",
    strongDescriptor:
      "Good transition arrangements. Pupils are well-prepared. Information is shared effectively with receiving schools.",
    expectedDescriptor:
      "Transition arrangements exist but may be limited. Some preparation for next stage.",
    needsAttentionDescriptor:
      "Limited transition arrangements. Pupils may not be well-prepared for the next stage.",
    urgentDescriptor:
      "No transition planning. Pupils arrive at the next stage unprepared.",
    evidenceRules: [
      {
        evidenceId: "dest-1",
        name: "Transition Data",
        legislation: [
          "EYFS Statutory Framework",
          "SEND Code of Practice (transition)",
        ],
        checkpoints: [
          "Transition information shared with receiving schools",
          "SEND pupils have enhanced transition plans",
          "Data on how pupils perform after transition",
          "Feedback from receiving schools",
        ],
        redFlags: [
          "No transition data collected",
          "SEND pupils have no enhanced transition",
          "No communication with receiving schools",
        ],
        exceptionalIndicators: [
          "Formal feedback loop with secondary schools",
          "Transition support extends into the first term at new school",
          "Data shows pupils thrive after transition",
        ],
        failureCriteria: [
          "No transition arrangements",
          "Pupils are not prepared for the next stage",
        ],
      },
      {
        evidenceId: "dest-2",
        name: "Secondary Ready",
        legislation: ["National Curriculum expectations at end of KS2"],
        checkpoints: [
          "Pupils meet age-related expectations in core subjects",
          "Pupils have the personal skills for secondary (independence, organisation)",
          "Cultural capital is built to prepare for wider world",
          "Life skills are explicitly taught",
        ],
        redFlags: [
          "Many pupils below age-related expectations at transition",
          "No focus on personal readiness beyond academics",
        ],
        exceptionalIndicators: [
          "Almost all pupils meet or exceed expectations",
          "Pupils are confident, articulate and independent",
          "School actively builds cultural capital",
        ],
        failureCriteria: [
          "Majority of pupils not meeting expected standard",
          "No preparation for secondary beyond academics",
        ],
      },
    ],
  },

  // ===================================================
  // 4. ATTENDANCE AND BEHAVIOUR
  // ===================================================
  {
    subcategoryId: "attendance-overall",
    coreQuestion: "Is attendance high for all groups of pupils?",
    legislation: [
      "Working Together to Improve School Attendance (DfE 2024)",
      "Education Act 1996 Sections 444, 444A, 444ZA",
      "School Attendance (Pupil Registration) Regulations 2024",
    ],
    exceptionalDescriptor:
      "Attendance is above national (96%+). PA is below national. All groups attend well. Strong attendance culture with early intervention. Attendance team is proactive.",
    strongDescriptor:
      "Attendance is in line with or above national. PA is managed effectively. Good first-day response. Data analysed by group.",
    expectedDescriptor:
      "Attendance is broadly in line with national. Some groups may have lower attendance. PA is monitored.",
    needsAttentionDescriptor:
      "Attendance is below national. PA is above national. Limited strategies to improve. Some groups are significantly lower.",
    urgentDescriptor:
      "Attendance is significantly below national. PA is high. No effective strategies. Would be a serious concern at inspection.",
    evidenceRules: [
      {
        evidenceId: "att-1",
        name: "Attendance Data",
        legislation: [
          "Working Together to Improve School Attendance (DfE 2024)",
        ],
        checkpoints: [
          "Overall attendance rate compared to national",
          "Attendance by group (PP, SEND, gender, ethnicity)",
          "Trends over at least 2 years",
          "Term-by-term data available",
          "Comparison with similar schools",
        ],
        redFlags: [
          "Below national average",
          "Declining trend",
          "Significant group gaps",
          "No data analysis by group",
        ],
        exceptionalIndicators: [
          "Above 97%",
          "All groups above 95%",
          "Upward trend",
          "PA below 10%",
        ],
        failureCriteria: [
          "Below 93%",
          "No attendance data available",
          "PA above 20%",
        ],
      },
      {
        evidenceId: "att-2",
        name: "PA Data",
        legislation: [
          "Working Together to Improve School Attendance (DfE 2024)",
        ],
        checkpoints: [
          "Persistent absence rate (below 90%) compared to national",
          "Severe absence rate (below 50%)",
          "PA broken down by group",
          "Actions taken for persistently absent pupils",
          "Trend data",
        ],
        redFlags: [
          "PA above national",
          "Severe absence present",
          "PA for disadvantaged significantly higher",
          "No targeted support for PA pupils",
        ],
        exceptionalIndicators: [
          "PA well below national",
          "Rapid reduction in PA",
          "Named staff tracking PA pupils",
          "Family support in place",
        ],
        failureCriteria: [
          "PA above 20%",
          "No monitoring of PA",
          "No intervention for PA pupils",
        ],
      },
      {
        evidenceId: "att-3",
        name: "Attendance Policy",
        legislation: [
          "Working Together to Improve School Attendance (DfE 2024)",
          "Education Act 1996",
        ],
        checkpoints: [
          "References 'Working Together to Improve School Attendance' (DfE 2024)",
          "First-day absence response procedures",
          "Persistent absence definition and procedures",
          "Leave of absence / term-time holiday procedures",
          "CME (children missing education) procedures",
          "Describes monitoring and reporting to governors",
          "Current review date",
        ],
        redFlags: [
          "Does not reference current DfE guidance",
          "No first-day response",
          "No PA procedures",
          "Out of date",
        ],
        exceptionalIndicators: [
          "Includes attendance rewards/incentives",
          "Named attendance champion",
          "Multi-agency working described",
          "Data-driven approach",
        ],
        failureCriteria: [
          "No attendance policy",
          "Policy does not reference any DfE guidance",
          "No procedures described",
        ],
      },
    ],
  },

  {
    subcategoryId: "behaviour-conduct",
    coreQuestion:
      "Do leaders and staff create a calm, orderly environment where expectations are consistently high?",
    legislation: [
      "Behaviour in Schools guidance (DfE 2022)",
      "Suspension and Permanent Exclusion guidance (DfE 2023)",
      "Equality Act 2010",
    ],
    exceptionalDescriptor:
      "Behaviour is exemplary. A strong culture of mutual respect. Very low exclusion rates with clear alternatives. Bullying is rare and dealt with swiftly. Staff are confident and consistent.",
    strongDescriptor:
      "Behaviour is consistently good. Clear expectations understood by all. Exclusion rates are low. Anti-bullying policy is effective.",
    expectedDescriptor:
      "Behaviour is generally good. Some inconsistency between classes. Exclusions are at or below national.",
    needsAttentionDescriptor:
      "Behaviour is inconsistent. High exclusion rates. Bullying is not always dealt with effectively. Staff confidence in managing behaviour varies.",
    urgentDescriptor:
      "Behaviour is poor. High exclusion rates. Bullying is prevalent. Staff struggle to maintain order.",
    evidenceRules: [
      {
        evidenceId: "beh-1",
        name: "Behaviour Policy",
        legislation: [
          "Behaviour in Schools guidance (DfE 2022)",
          "Equality Act 2010",
          "KCSIE 2024/2025",
        ],
        checkpoints: [
          "Clear expectations and rules",
          "Rewards and sanctions system described",
          "References positive behaviour approaches",
          "Covers exclusion procedures (suspension and permanent exclusion)",
          "Anti-bullying procedures included",
          "Reasonable adjustments for SEND pupils",
          "Covers searching, screening and confiscation if applicable",
          "Covers use of reasonable force / positive handling",
          "Peer-on-peer abuse procedures (as per KCSIE)",
          "Current review date",
        ],
        redFlags: [
          "No mention of positive behaviour approaches",
          "No SEND adjustments",
          "No anti-bullying section",
          "Punitive-only approach",
          "Out of date",
        ],
        exceptionalIndicators: [
          "Restorative approaches embedded",
          "Trauma-informed practice",
          "Pupil voice in policy development",
          "Very low exclusion rates",
        ],
        failureCriteria: [
          "No behaviour policy",
          "Policy is punitive with no positive strategies",
          "No anti-bullying procedures",
        ],
      },
      {
        evidenceId: "beh-2",
        name: "Exclusion Data",
        legislation: ["Suspension and Permanent Exclusion guidance (DfE 2023)"],
        checkpoints: [
          "Suspension rates compared to national",
          "Permanent exclusion rates",
          "Data by group (SEND, PP, ethnicity, gender)",
          "Trends over time",
          "Alternatives to exclusion used (managed moves, part-time timetables)",
        ],
        redFlags: [
          "Above national exclusion rates",
          "Disproportionate exclusion of SEND or disadvantaged pupils",
          "Rising trend",
          "Illegal off-rolling suspected",
        ],
        exceptionalIndicators: [
          "Very low or zero exclusions",
          "Strong alternatives in place",
          "No disproportionality",
          "Data shows improvements over time",
        ],
        failureCriteria: [
          "Very high exclusion rates",
          "Disproportionate exclusion of vulnerable groups",
          "Suspected off-rolling",
        ],
      },
    ],
  },

  {
    subcategoryId: "behaviour-attitudes",
    coreQuestion:
      "Do pupils have positive attitudes to their learning and take pride in their work?",
    legislation: ["Ofsted EIF 2025"],
    exceptionalDescriptor:
      "Pupils are highly engaged, articulate about their learning, and take pride in their work. They show resilience when challenged and support each other.",
    strongDescriptor:
      "Pupils are engaged and show positive attitudes. They respond well to challenge. Learning behaviours are good.",
    expectedDescriptor:
      "Most pupils are engaged most of the time. Some variation in attitudes across classes or subjects.",
    needsAttentionDescriptor:
      "Engagement is inconsistent. Some pupils are disengaged. Learning behaviours are variable.",
    urgentDescriptor:
      "Low engagement. Pupils are frequently off-task. Poor learning behaviours across the school.",
    evidenceRules: [
      {
        evidenceId: "atl-1",
        name: "Pupil Voice",
        legislation: [
          "UNCRC Article 12 (right to be heard)",
          "Ofsted EIF 2025",
        ],
        checkpoints: [
          "Pupils are asked about their learning experiences",
          "Feedback is collected systematically (surveys, interviews)",
          "Pupil views are acted upon",
          "Evidence of impact from pupil voice",
        ],
        redFlags: [
          "Pupil voice is tokenistic",
          "Same pupils always asked",
          "No action taken on feedback",
        ],
        exceptionalIndicators: [
          "Student council with real influence",
          "Pupil-led improvement projects",
          "All pupils have a voice including SEND and younger children",
        ],
        failureCriteria: [
          "No pupil voice activity",
          "Pupils not asked about their experiences",
        ],
      },
      {
        evidenceId: "atl-2",
        name: "Lesson Observations",
        legislation: ["Ofsted EIF 2025"],
        checkpoints: [
          "Observations note pupil engagement levels",
          "Evidence of pupils responding to challenge",
          "Learning behaviours are observed and recorded",
          "Range of classes and subjects observed",
        ],
        redFlags: [
          "Observations don't focus on pupils",
          "Low engagement noted but not addressed",
        ],
        exceptionalIndicators: [
          "Pupils articulate their learning confidently",
          "High levels of engagement across all observations",
          "Pupils show resilience and self-regulation",
        ],
        failureCriteria: [
          "No observation evidence",
          "Consistent low engagement",
        ],
      },
    ],
  },

  // ===================================================
  // 5. PERSONAL DEVELOPMENT
  // ===================================================
  {
    subcategoryId: "pd-character",
    coreQuestion:
      "Does the school develop pupils' character, including their resilience, confidence and independence?",
    legislation: [
      "DfE Character Education Framework (2019)",
      "Ofsted EIF 2025",
    ],
    exceptionalDescriptor:
      "Character education is explicitly planned and taught. Pupils demonstrate resilience, confidence and strong moral values. The school's ethos actively builds character.",
    strongDescriptor:
      "Character development is valued and planned. Pupils show resilience and confidence. The school promotes positive values.",
    expectedDescriptor:
      "Some character education exists but may not be systematic. Pupils generally show positive character traits.",
    needsAttentionDescriptor:
      "Character development is incidental. Limited planning or strategy. Some pupils lack confidence or resilience.",
    urgentDescriptor:
      "No deliberate character education. Pupils lack resilience and confidence.",
    evidenceRules: [
      {
        evidenceId: "char-1",
        name: "Character Education",
        legislation: ["DfE Character Education Framework (2019)"],
        checkpoints: [
          "Character education is explicitly planned",
          "Values are defined and promoted",
          "Resilience and perseverance are taught",
          "Pupils can articulate the school's values",
        ],
        redFlags: [
          "No character education planning",
          "Values are displayed but not taught",
          "Character development is left to chance",
        ],
        exceptionalIndicators: [
          "Whole-school character framework",
          "Links to curriculum subjects",
          "Pupil-led character initiatives",
          "Impact evidence (pupil surveys)",
        ],
        failureCriteria: ["No character education", "School values are absent"],
      },
      {
        evidenceId: "char-2",
        name: "PSHE Curriculum",
        legislation: [
          "DfE PSHE non-statutory guidance",
          "Relationships Education, RSE and Health Education (2019)",
        ],
        checkpoints: [
          "PSHE is timetabled and taught regularly",
          "Coverage includes all DfE recommended areas",
          "Age-appropriate content across year groups",
          "Links to RSE statutory content",
        ],
        redFlags: [
          "PSHE not timetabled",
          "Patchy coverage",
          "Relied on external providers only",
        ],
        exceptionalIndicators: [
          "Evidence-based programme used",
          "Pupil assessments in PSHE",
          "PSHE linked to whole-school priorities",
        ],
        failureCriteria: [
          "No PSHE teaching",
          "Personal development left to chance",
        ],
      },
    ],
  },

  {
    subcategoryId: "pd-citizenship",
    coreQuestion:
      "Are pupils prepared for life in modern Britain with an understanding of democracy, the rule of law, individual liberty, and mutual respect?",
    legislation: [
      "Prevent Duty Guidance (2023)",
      "Counter-Terrorism and Security Act 2015 Section 26",
      "Ofsted EIF 2025",
      "Equality Act 2010",
    ],
    exceptionalDescriptor:
      "British Values are deeply embedded in the school's ethos and curriculum. Pupils understand and articulate democratic values. Respect for diversity is exemplary. Prevent duty is fully met.",
    strongDescriptor:
      "British Values are taught and promoted. Pupils understand the key concepts. The school promotes respect and tolerance.",
    expectedDescriptor:
      "British Values are addressed but may be limited to specific events or assemblies rather than embedded.",
    needsAttentionDescriptor:
      "British Values are not systematically taught. Pupils have limited understanding. Prevent duty may not be fully met.",
    urgentDescriptor:
      "No evidence of British Values promotion. Prevent duty not met. Pupils are not prepared for life in modern Britain.",
    evidenceRules: [
      {
        evidenceId: "bv-1",
        name: "British Values Mapping",
        legislation: [
          "Prevent Duty Guidance (2023)",
          "Counter-Terrorism and Security Act 2015",
        ],
        checkpoints: [
          "All four BV are explicitly mapped across the curriculum",
          "Democracy, rule of law, individual liberty, mutual respect and tolerance",
          "Taught through subjects, assemblies, and school culture",
          "Prevent duty requirements met",
          "Age-appropriate understanding expected",
        ],
        redFlags: [
          "British Values not mentioned",
          "Only covered in one-off events",
          "No curriculum mapping",
          "Prevent duty not addressed",
        ],
        exceptionalIndicators: [
          "BV embedded in every subject",
          "Pupils lead on BV activities",
          "Links to current affairs and real-world context",
          "Community engagement around BV",
        ],
        failureCriteria: [
          "No British Values promotion",
          "Prevent duty not met",
          "Counter-extremism risk not addressed",
        ],
      },
      {
        evidenceId: "bv-2",
        name: "Democracy",
        legislation: ["Ofsted EIF 2025", "National Curriculum Citizenship"],
        checkpoints: [
          "Pupils understand what democracy means",
          "Democratic processes in school (school council, voting)",
          "Links to wider democratic structures (parliament, local government)",
          "Age-appropriate understanding across year groups",
        ],
        redFlags: [
          "No democratic processes in school",
          "School council is tokenistic",
          "Pupils cannot explain democracy",
        ],
        exceptionalIndicators: [
          "Active school council with real decision-making power",
          "Visits to Parliament or local council",
          "Mock elections and democratic debates",
        ],
        failureCriteria: [
          "No teaching about democracy",
          "No democratic processes",
        ],
      },
    ],
  },

  {
    subcategoryId: "pd-enrichment",
    coreQuestion:
      "Does the school provide a wide range of enrichment opportunities that develop pupils' talents and interests?",
    legislation: [
      "Ofsted EIF 2025",
      "PE and Sport Premium conditions (primary)",
    ],
    exceptionalDescriptor:
      "Rich and diverse enrichment programme accessible to all. Builds cultural capital deliberately. High participation rates including disadvantaged and SEND. Sports premium used effectively.",
    strongDescriptor:
      "Good range of enrichment. Most pupils can access it. Clubs, trips and experiences are well-planned.",
    expectedDescriptor:
      "Some enrichment exists but may be limited. Participation data may not be tracked. Some groups may not access opportunities.",
    needsAttentionDescriptor:
      "Limited enrichment offer. Some pupils have no access to wider opportunities. Sports premium impact unclear.",
    urgentDescriptor:
      "No enrichment beyond the curriculum. Pupils miss out on wider development opportunities.",
    evidenceRules: [
      {
        evidenceId: "enrich-1",
        name: "Enrichment Offer",
        legislation: ["Ofsted EIF 2025", "PE and Sport Premium (primary)"],
        checkpoints: [
          "Range of clubs, trips and experiences offered",
          "Enrichment is accessible to all pupils including disadvantaged and SEND",
          "Cultural capital is explicitly built",
          "Residential experiences or visits",
          "Sports premium spending and impact (primary)",
        ],
        redFlags: [
          "Limited enrichment offer",
          "Only available to those who can pay",
          "No trips or visits",
          "SEND pupils excluded",
        ],
        exceptionalIndicators: [
          "Wide range accessible to all",
          "Bursary for disadvantaged pupils",
          "Enrichment linked to curriculum",
          "Pupil voice shapes the offer",
        ],
        failureCriteria: [
          "No enrichment programme",
          "Pupils have no access to wider experiences",
        ],
      },
      {
        evidenceId: "enrich-2",
        name: "Participation Data",
        legislation: ["Ofsted EIF 2025"],
        checkpoints: [
          "Participation tracked by group (PP, SEND, gender)",
          "All groups have equitable access",
          "Barriers to participation addressed",
          "Impact of enrichment on wider outcomes",
        ],
        redFlags: [
          "No tracking of participation",
          "Disadvantaged pupils under-represented",
          "Barriers not addressed",
        ],
        exceptionalIndicators: [
          "Near 100% participation across all groups",
          "Disadvantaged pupils prioritised",
          "Impact data shows wider benefits",
        ],
        failureCriteria: [
          "No participation data",
          "Enrichment only accessible to a few",
        ],
      },
    ],
  },

  {
    subcategoryId: "pd-rse",
    coreQuestion:
      "Does the school deliver high-quality RSE that is age-appropriate and prepares pupils for life?",
    legislation: [
      "Relationships Education, RSE and Health Education (DfE 2019, statutory from Sept 2020)",
      "Children and Social Work Act 2017",
    ],
    exceptionalDescriptor:
      "RSE is excellently delivered with age-appropriate, progressive content. Parents are consulted. Staff are well-trained and confident. Content is inclusive and covers healthy relationships, consent, and online safety.",
    strongDescriptor:
      "Statutory RSE is delivered well. Policy is published. Parents are consulted. Content is age-appropriate and inclusive.",
    expectedDescriptor:
      "RSE is delivered but may have gaps in coverage or consistency. Policy exists but parent consultation may be limited.",
    needsAttentionDescriptor:
      "RSE delivery is patchy. Policy may not meet statutory requirements. Staff lack confidence. Content gaps.",
    urgentDescriptor:
      "RSE not delivered as statutory. No policy. No parent consultation. Pupils are not prepared.",
    evidenceRules: [
      {
        evidenceId: "rse-1",
        name: "RSE Policy",
        legislation: [
          "Relationships Education, RSE and Health Education (DfE 2019)",
          "Children and Social Work Act 2017",
        ],
        checkpoints: [
          "Policy references DfE statutory guidance (2019)",
          "Published on school website",
          "Parent consultation process described",
          "Right to withdraw explained (sex education only, not relationships education)",
          "Content is age-appropriate",
          "Inclusive (SEND, different family structures, LGBTQ+ where appropriate)",
          "Current review date",
        ],
        redFlags: [
          "Not published on website",
          "No parent consultation",
          "Right to withdraw incorrectly described",
          "Not inclusive",
          "Out of date",
        ],
        exceptionalIndicators: [
          "Thorough parent consultation with evidence",
          "Staff confidence surveys",
          "Links to wider safeguarding and online safety",
          "Impact evidence",
        ],
        failureCriteria: [
          "No RSE policy",
          "RSE not being delivered",
          "Statutory guidance not referenced",
        ],
      },
      {
        evidenceId: "rse-2",
        name: "RSE Curriculum",
        legislation: [
          "Relationships Education, RSE and Health Education (DfE 2019)",
        ],
        checkpoints: [
          "Coverage mapped across all year groups",
          "Age-appropriate progression",
          "Covers mandatory content: families and relationships, respectful relationships, online relationships, being safe",
          "Health education content included",
          "Delivered by trained staff",
        ],
        redFlags: [
          "Gaps in mandatory content",
          "Not age-appropriate",
          "Only delivered in one year group",
          "Staff not trained",
        ],
        exceptionalIndicators: [
          "Progressive scheme from EYFS to Year 6",
          "Specialist-delivered content",
          "Pupil voice shapes content",
          "Links to PSHE and safeguarding",
        ],
        failureCriteria: [
          "No RSE curriculum",
          "Mandatory content not covered",
          "Not taught at all",
        ],
      },
    ],
  },

  // ===================================================
  // 6. LEADERSHIP AND GOVERNANCE
  // ===================================================
  {
    subcategoryId: "leadership-vision",
    coreQuestion:
      "Do leaders have a clear and ambitious vision, and is their self-evaluation accurate?",
    legislation: [
      "Education Act 2002",
      "Ofsted EIF 2025",
      "Academies Act 2010 (if applicable)",
    ],
    exceptionalDescriptor:
      "Visionary leadership with a clear, ambitious strategy that drives improvement. Self-evaluation is brutally honest and accurate. The SDP is focused on the right priorities with measurable impact.",
    strongDescriptor:
      "Clear vision understood by all stakeholders. Self-evaluation is honest and matches external evidence. SDP has the right priorities.",
    expectedDescriptor:
      "Vision exists but may not be widely understood. Self-evaluation is broadly accurate. SDP covers key areas.",
    needsAttentionDescriptor:
      "Vision is unclear or generic. Self-evaluation may be over-generous. SDP lacks focus or ambition.",
    urgentDescriptor:
      "No clear vision. Self-evaluation is inaccurate. No coherent improvement strategy.",
    evidenceRules: [
      {
        evidenceId: "vis-1",
        name: "Vision Statement",
        legislation: ["Education Act 2002"],
        checkpoints: [
          "Clear vision and values articulated",
          "Understood by staff, pupils, parents and governors",
          "Reflects the school's context and community",
          "Ambitious for all pupils",
          "Informs decision-making",
        ],
        redFlags: [
          "Generic vision not specific to the school",
          "Vision not known by stakeholders",
          "Vision doesn't match reality",
        ],
        exceptionalIndicators: [
          "Vision drives everything the school does",
          "All stakeholders can articulate it",
          "Regularly reviewed and refreshed",
        ],
        failureCriteria: [
          "No vision statement",
          "Vision is meaningless or ignored",
        ],
      },
      {
        evidenceId: "vis-2",
        name: "Development Plan",
        legislation: ["Ofsted EIF 2025"],
        checkpoints: [
          "Focused on the right priorities based on self-evaluation",
          "Measurable success criteria",
          "Named leads for each priority",
          "Timelines and milestones",
          "Resource allocation",
          "Links to monitoring and evaluation",
        ],
        redFlags: [
          "Too many priorities (more than 5-6)",
          "No success criteria",
          "No named leads",
          "Not linked to self-evaluation",
          "No monitoring schedule",
        ],
        exceptionalIndicators: [
          "Evidence-based priorities",
          "Links to EEF research",
          "Regular review with impact data",
          "Shared with all stakeholders",
        ],
        failureCriteria: [
          "No development plan",
          "Plan exists but is not implemented",
        ],
      },
    ],
  },

  {
    subcategoryId: "leadership-governance",
    coreQuestion:
      "Do governors/trustees fulfil their statutory duties and provide effective support and challenge?",
    legislation: [
      "Governance Handbook (DfE 2024)",
      "Academies Act 2010",
      "Education Act 2002 Section 21",
      "Competency Framework for Governance (DfE)",
    ],
    exceptionalDescriptor:
      "Governance is exemplary. Governors are skilled, trained and provide effective challenge. Statutory duties are fully met. Governors know the school well from first-hand evidence.",
    strongDescriptor:
      "Governors fulfil statutory duties. Regular meetings with good attendance. Governors challenge leaders on outcomes, finance and safeguarding.",
    expectedDescriptor:
      "Governance is in place and statutory duties are mostly met. Challenge may be limited in some areas.",
    needsAttentionDescriptor:
      "Governance is weak. Limited challenge. Statutory duties may not all be met. Governor training is lacking.",
    urgentDescriptor:
      "Governance is ineffective. Statutory duties not met. No challenge to leaders. Serious concern.",
    evidenceRules: [
      {
        evidenceId: "gov-1",
        name: "Governor Minutes",
        legislation: ["Governance Handbook (DfE 2024)"],
        checkpoints: [
          "Regular meetings held (at least termly)",
          "Good attendance at meetings",
          "Evidence of challenge to school leaders",
          "Strategic oversight of performance data",
          "Safeguarding is a standing agenda item",
          "Financial oversight and scrutiny",
          "Governor visits to school documented",
        ],
        redFlags: [
          "Infrequent meetings",
          "Poor attendance",
          "No evidence of challenge (minutes are just information-sharing)",
          "Safeguarding not discussed",
          "Financial oversight weak",
        ],
        exceptionalIndicators: [
          "Governors ask probing questions evidenced in minutes",
          "Governor visit reports with actions",
          "Governors hold leaders to account on disadvantaged outcomes",
        ],
        failureCriteria: [
          "No governor meetings held",
          "No minutes available",
          "Governors do not challenge",
        ],
      },
      {
        evidenceId: "gov-2",
        name: "Governor Training",
        legislation: [
          "Governance Handbook (DfE 2024)",
          "Competency Framework for Governance",
        ],
        checkpoints: [
          "All governors have completed induction training",
          "Ongoing training programme in place",
          "Safeguarding training completed by all",
          "Skills audit conducted",
          "Chair and vice-chair have appropriate training",
        ],
        redFlags: [
          "No training records",
          "Some governors have had no training",
          "No safeguarding training",
          "No skills audit",
        ],
        exceptionalIndicators: [
          "Annual skills audit",
          "Training linked to school priorities",
          "External governance review completed",
          "NGA membership or equivalent",
        ],
        failureCriteria: [
          "No governor training",
          "Governors lack basic understanding of their role",
        ],
      },
    ],
  },

  {
    subcategoryId: "leadership-staff",
    coreQuestion:
      "Do leaders develop staff effectively and manage workload so that staff can focus on teaching?",
    legislation: [
      "Teachers' Standards (DfE 2011, updated 2021)",
      "Early Career Framework (DfE 2019)",
      "DfE Workload Reduction Toolkit",
    ],
    exceptionalDescriptor:
      "CPD is sustained, evidence-based and has clear impact on teaching quality. Workload is actively managed. Staff wellbeing is prioritised. ECTs are exceptionally well-supported.",
    strongDescriptor:
      "Good CPD programme linked to school priorities. Workload is reasonable. ECTs well-supported with mentors. Staff feel valued.",
    expectedDescriptor:
      "Some CPD in place but may not be sustained or evidence-based. Workload is managed but some concerns. ECT support meets statutory requirements.",
    needsAttentionDescriptor:
      "CPD is limited or one-off. Workload is a concern. ECT support may be inadequate. Staff morale issues.",
    urgentDescriptor:
      "No professional development. Excessive workload. ECTs unsupported. High staff turnover. Serious concern.",
    evidenceRules: [
      {
        evidenceId: "staff-1",
        name: "CPD Programme",
        legislation: [
          "Teachers' Standards (DfE 2011)",
          "Early Career Framework (DfE 2019)",
        ],
        checkpoints: [
          "CPD programme is planned and linked to school priorities",
          "Mix of internal and external training",
          "Follow-up and impact monitoring",
          "ECTs have appropriate mentor support and training",
          "Support staff included in CPD",
        ],
        redFlags: [
          "Ad hoc CPD with no plan",
          "No follow-up after training",
          "ECTs not receiving entitlement",
          "Support staff excluded",
        ],
        exceptionalIndicators: [
          "Evidence-based CPD (e.g., EEF, Rosenshine)",
          "Coaching and mentoring culture",
          "Staff choose CPD linked to career development",
          "Impact of CPD on pupil outcomes evidenced",
        ],
        failureCriteria: [
          "No CPD programme",
          "ECTs not supported as required",
          "No staff development",
        ],
      },
      {
        evidenceId: "staff-2",
        name: "Workload Policy",
        legislation: [
          "DfE Workload Reduction Toolkit (2018)",
          "DfE Teacher Wellbeing Charter",
        ],
        checkpoints: [
          "Workload is actively considered and managed",
          "Marking/feedback policy is proportionate",
          "Unnecessary tasks eliminated",
          "Staff wellbeing is monitored (surveys, exit interviews)",
          "Flexible working considered",
        ],
        redFlags: [
          "No workload consideration",
          "Excessive marking expectations",
          "High staff turnover",
          "No wellbeing monitoring",
        ],
        exceptionalIndicators: [
          "Staff wellbeing surveys with action taken",
          "Flexible working available",
          "Low turnover and high retention",
          "Staff wellbeing charter adopted",
        ],
        failureCriteria: [
          "Excessive workload with no action",
          "High turnover with no strategy",
          "Staff wellbeing ignored",
        ],
      },
    ],
  },

  // leadership-engagement is in the types but not in framework-data.ts subcategories
  // We'll skip it as it's not in the evidence requirements
];

// =====================================================
// SAFEGUARDING INSPECTION KNOWLEDGE
// (Assessed as Met/Not Met, separate from the 5-point scale)
// =====================================================

export const SAFEGUARDING_INSPECTION_KNOWLEDGE = {
  coreQuestion:
    "Is the school's safeguarding effective? Do leaders take appropriate action to identify pupils who may need early help or who are at risk of neglect, abuse, grooming, or exploitation?",
  legislation: [
    "Keeping Children Safe in Education (KCSIE) 2024/2025",
    "Working Together to Safeguard Children (2023)",
    "Children Act 1989 and 2004",
    "Counter-Terrorism and Security Act 2015 (Prevent)",
    "Voyeurism (Offences) Act 2019",
    "Domestic Abuse Act 2021",
    "Online Safety Act 2023",
  ],
  metDescriptor:
    "All statutory safeguarding requirements are met. There is a strong safeguarding culture. Staff are trained and vigilant. DSL is experienced and effective. SCR is compliant. Referral pathways are clear and used.",
  notMetDescriptor:
    "Statutory requirements are not met. Any one of: SCR is not compliant, DSL is not trained, staff have not read KCSIE Part 1, referral procedures are unclear, safeguarding culture is weak.",
  criticalFailures: [
    "SCR has gaps (missing DBS checks, missing dates, missing staff)",
    "DSL training is out of date (more than 2 years)",
    "Staff have not signed to confirm reading KCSIE Part 1",
    "No safeguarding policy or policy does not reference current KCSIE",
    "DBS checks missing or expired for any staff member",
    "No evidence of safer recruitment procedures",
    "Referral procedures unclear or not followed",
    "Allegations against staff not handled via LADO",
  ],
};

// =====================================================
// HELPER: Get inspection knowledge for a subcategory
// =====================================================

export function getInspectionKnowledge(
  subcategoryId: OfstedSubCategoryId,
): SubcategoryInspectionKnowledge | undefined {
  return INSPECTION_KNOWLEDGE.find((k) => k.subcategoryId === subcategoryId);
}

export function getEvidenceRule(
  evidenceId: string,
): EvidenceInspectionRule | undefined {
  for (const knowledge of INSPECTION_KNOWLEDGE) {
    const rule = knowledge.evidenceRules.find(
      (r) => r.evidenceId === evidenceId,
    );
    if (rule) return rule;
  }
  return undefined;
}

/**
 * Build a comprehensive AI inspection prompt for a specific evidence item.
 * This gives the AI inspector all the context it needs to assess a document
 * like an expert Ofsted inspector would.
 */
export function buildInspectionPrompt(
  evidenceId: string,
  subcategoryId: OfstedSubCategoryId,
): { systemPrompt: string; inspectionCriteria: string } | null {
  const knowledge = getInspectionKnowledge(subcategoryId);
  if (!knowledge) return null;

  const rule = knowledge.evidenceRules.find((r) => r.evidenceId === evidenceId);
  if (!rule) return null;

  const systemPrompt = `You are an expert UK school inspector with deep knowledge of the Ofsted Education Inspection Framework (EIF) 2025, all relevant UK education legislation, and statutory guidance. You are conducting a document review as part of an Ofsted readiness assessment.

Your task is to inspect a document against specific framework requirements and provide a professional judgement using the Ofsted 5-point rating scale.

RATING SCALE (use exactly these values):
- "exceptional" (5): ${RATING_DESCRIPTORS.exceptional.description}
- "strong_standard" (4): ${RATING_DESCRIPTORS.strong_standard.description}
- "expected_standard" (3): ${RATING_DESCRIPTORS.expected_standard.description}
- "needs_attention" (2): ${RATING_DESCRIPTORS.needs_attention.description}
- "urgent_improvement" (1): ${RATING_DESCRIPTORS.urgent_improvement.description}

Use school-friendly wording. The headline should help leaders quickly see whether the evidence is compliant, needs attention, or is a serious risk. Reserve "urgent_improvement" for a clear statutory failure, safeguarding risk, or listed automatic failure criterion; if evidence is simply thin, incomplete, or too brief, use "needs_attention".

FRAMEWORK CONTEXT:
- Subcategory: ${knowledge.subcategoryId}
- Core inspection question: ${knowledge.coreQuestion}
- Applicable legislation: ${knowledge.legislation.join("; ")}

RATING DESCRIPTORS FOR THIS AREA:
- Exceptional: ${knowledge.exceptionalDescriptor}
- Strong Standard: ${knowledge.strongDescriptor}
- Expected Standard: ${knowledge.expectedDescriptor}
- Needs Attention: ${knowledge.needsAttentionDescriptor}
- Urgent Improvement: ${knowledge.urgentDescriptor}

You MUST respond in JSON format with this exact structure:
{
  "rating": "exceptional" | "strong_standard" | "expected_standard" | "needs_attention" | "urgent_improvement",
  "confidence": "high" | "medium" | "low",
  "summary": "One clear sentence explaining the overall judgement",
  "date_check": {
    "review_date_found": true/false,
    "is_current": true/false,
    "date_found": "the date string or null",
    "note": "explanation"
  },
  "legislation_check": {
    "references_current": true/false,
    "legislation_found": ["list of legislation referenced in the document"],
    "missing_references": ["list of key legislation NOT referenced that should be"]
  },
  "checkpoint_results": [
    {
      "checkpoint": "What was checked",
      "met": true/false,
      "evidence": "Quote or specific explanation of how it was met or what's missing",
      "severity": "critical" | "important" | "minor"
    }
  ],
  "red_flags": ["Any red flags found from the document"],
  "strengths": ["Specific strengths identified"],
  "actions_required": [
    {
      "action": "Specific action the school must take",
      "priority": "urgent" | "high" | "medium" | "low",
      "rationale": "Why this action is needed — reference legislation or framework requirement",
      "sef_impact": "How fixing this feeds into the SEF self-evaluation"
    }
  ],
  "sef_contribution": "How this document and its quality contributes to the school's Self-Evaluation Form for this area"
}`;

  const inspectionCriteria = `DOCUMENT BEING INSPECTED: ${rule.name}
EVIDENCE ID: ${rule.evidenceId}

APPLICABLE LEGISLATION FOR THIS DOCUMENT:
${rule.legislation.map((l) => `- ${l}`).join("\n")}

CHECKPOINTS — You MUST assess each of these:
${rule.checkpoints.map((c, i) => `${i + 1}. ${c}`).join("\n")}

RED FLAGS — Report if any of these are present:
${rule.redFlags.map((r) => `⚠️ ${r}`).join("\n")}

EXCEPTIONAL PRACTICE — Note if any of these are evident:
${rule.exceptionalIndicators.map((e) => `✨ ${e}`).join("\n")}

AUTOMATIC FAILURE CRITERIA — If ANY of these apply, rating MUST be "urgent_improvement":
${rule.failureCriteria.map((f) => `🚫 ${f}`).join("\n")}

IMPORTANT INSTRUCTIONS:
1. Assess EVERY checkpoint and report whether it is met or not with specific evidence
2. If the document text was not fully extracted, rate confidence as "low" and note this
3. Be specific — quote from the document where possible
4. If a checkpoint is partially met, explain what is present and what is missing
5. Actions should be specific enough for the school to act on immediately
6. Link actions to how they would improve the school's SEF position
7. Current academic year is 2025-2026. Review dates should be within this period.
8. Keep the summary concise and non-alarmist unless there is a genuine urgent risk.`;

  return { systemPrompt, inspectionCriteria };
}
