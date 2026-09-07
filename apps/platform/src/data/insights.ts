export interface Insight {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  status: "draft" | "coming_soon" | "published";
  readingModes?: boolean;
  featured?: boolean;
  content?: string;
  heroImage?: string;
  category?: "research" | "guide" | "opinion" | "news" | "case-study";
  /** Which Schoolgle module this relates to — matches planet colours */
  module?:
    | "hr"
    | "finance"
    | "estates"
    | "compliance"
    | "teaching"
    | "send"
    | "governance"
    | "improvement";
  tags?: string[];
  source?: string;
  sourceUrl?: string;
  readTime?: string;
  format?: "briefing";
  summary?: string[];
  /** Soft CTA — which Schoolgle feature/app this article relates to */
  relatedApp?: string;
}

/** Planet colours from the animated logo — used to colour-code research by module */
export const MODULE_COLORS: Record<string, { color: string; label: string }> = {
  hr: { color: "#ADD8E6", label: "HR & People" },
  finance: { color: "#FFAA4C", label: "Finance" },
  estates: { color: "#00D4D4", label: "Estates" },
  compliance: { color: "#E6C3FF", label: "Compliance" },
  teaching: { color: "#FFB6C1", label: "Teaching & Learning" },
  send: { color: "#98FF98", label: "SEND & Inclusion" },
  governance: { color: "#FFD700", label: "Governance" },
  improvement: { color: "#0ea5e9", label: "School Improvement" },
};

export const insights: Insight[] = [
  // ── ESTATES & COMPLIANCE ──────────────────────────────────
  {
    slug: "80-percent-software-features-unused",
    title: "Before the next software renewal, ask what staff actually use",
    excerpt:
      "A practical review of licences, duplicated work and the support that would help.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE workload resources",
    sourceUrl:
      "https://www.gov.uk/government/collections/reducing-school-workload",
    readTime: "2 min",
    featured: false,
    module: "finance",
  },
  {
    slug: "hse-school-compliance-gap",
    title: "School compliance: close the gap between a check and the follow-up",
    excerpt:
      "A completed form is only useful if someone acts on what it found.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE: Good estate management",
    sourceUrl: "https://www.gov.uk/guidance/good-estate-management-for-schools",
    readTime: "2 min",
    featured: false,
    module: "estates",
  },
  {
    slug: "school-building-condition-crisis",
    title: "School estates in autumn 2026: what the new return changes",
    excerpt:
      "The first estates standards return is approaching. Who submits it, what condition surveys establish, and how schools can turn records into a practical action programme.",
    date: "2026-09-07",
    status: "published",
    category: "guide",
    source: "Department for Education",
    sourceUrl:
      "https://www.gov.uk/guidance/school-estate-management-standards-annual-return",
    readTime: "4 min",
    featured: true,
    module: "estates",
    format: "briefing",
    summary: [
      "Confirm your responsible body and the route for school input before the autumn return.",
      "Record survey scope and unresolved questions alongside the action programme.",
      "Use consistent, dated building records to prepare for the planned data changes.",
    ],
  },

  // ── TEACHING & LEARNING (EEF focus) ───────────────────────
  {
    slug: "eef-teaching-learning-toolkit-guide",
    title: "Using the EEF Toolkit without turning it into a shopping list",
    excerpt:
      "Start with a pupil need, examine the evidence and plan a manageable change.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "Education Endowment Foundation",
    sourceUrl:
      "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit",
    readTime: "2 min",
    featured: true,
    module: "teaching",
  },
  {
    slug: "metacognition-self-regulation-schools",
    title:
      "Metacognition in practice: what the updated EEF guidance means for teaching",
    excerpt:
      "Go beyond a reflection box: examine the evidence, teach a purposeful strategy and check what pupils can do when the support changes.",
    date: "2026-09-07",
    status: "published",
    category: "research",
    source: "EEF: metacognition, Toolkit, feedback and implementation guidance",
    sourceUrl:
      "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition",
    readTime: "4 min",
    featured: true,
    module: "teaching",
    format: "briefing",
    summary: [
      "The verified guidance is the second edition published in November 2025.",
      "The Toolkit’s average impact is not a promise for a programme or pupil.",
      "Examine a new task, the support used and the pupil’s explanation before claiming independence.",
    ],
  },

  // ── SCHOOL IMPROVEMENT / OFSTED ───────────────────────────
  {
    slug: "preparing-for-ofsted-2025",
    title:
      "Ofsted in September 2026: update the right things, avoid extra paperwork",
    excerpt:
      "What the current inspection materials change, what they do not require, and a focused way for leaders to review their school’s next steps.",
    date: "2026-09-07",
    status: "published",
    category: "news",
    source:
      "Ofsted: current toolkit, change summary and inspection information",
    sourceUrl:
      "https://www.gov.uk/government/publications/school-inspection-toolkit-operating-guide-and-information",
    readTime: "4 min",
    featured: true,
    module: "improvement",
    format: "briefing",
    summary: [
      "Use the toolkit version for inspections from 7 September 2026.",
      "Do not create written evidence against every standard or an inspection-only SEF.",
      "Review the relevant changes through existing school processes and retain the decisions.",
    ],
  },
  {
    slug: "evidence-organisation-before-inspection",
    title: "Evidence organisation: make the useful document easy to find",
    excerpt: "Keep sources, owners and review decisions connected.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "Schoolgle practical guide; Ofsted materials",
    sourceUrl:
      "https://www.gov.uk/government/publications/school-inspection-toolkit-operating-guide-and-information",
    readTime: "2 min",
    featured: false,
    module: "improvement",
  },
  {
    slug: "self-evaluation-that-works",
    title: "Self-evaluation that helps leaders decide what to do next",
    excerpt:
      "Keep judgement, evidence and uncertainty close enough to discuss honestly.",
    date: "2026-09-05",
    status: "published",
    category: "opinion",
    source: "Schoolgle editorial perspective",
    sourceUrl:
      "https://www.gov.uk/government/publications/school-inspection-toolkit-operating-guide-and-information",
    readTime: "2 min",
    featured: false,
    module: "improvement",
  },
  {
    slug: "action-plans-that-stay-current",
    title: "Action plans that survive the first half-term",
    excerpt:
      "A named owner, a sensible review and a clear reason to keep going.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "EEF implementation guidance",
    sourceUrl:
      "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/implementation/process",
    readTime: "2 min",
    featured: false,
    module: "improvement",
  },
  {
    slug: "siams-inspection-readiness",
    title: "SIAMS: connect your school's vision to lived experience",
    excerpt:
      "Use the current framework and look for the explanation behind the evidence.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "National Society for Education: SIAMS",
    sourceUrl:
      "https://www.nse.org.uk/statutory-inspection-of-anglican-methodist-schools/inspections",
    readTime: "2 min",
    featured: false,
    module: "improvement",
  },

  // ── HR & PEOPLE ───────────────────────────────────────────
  {
    slug: "teacher-workload-technology-gap",
    title: "When technology adds work: start with the duplicate task",
    excerpt:
      "A small, staff-led approach to finding out what a new system should remove.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE workload resources",
    sourceUrl:
      "https://www.gov.uk/government/collections/reducing-school-workload",
    readTime: "2 min",
    featured: false,
    module: "hr",
  },
  {
    slug: "teacher-retention-crisis-2026",
    title:
      "Teacher retention in 2026: fewer departures, but a smaller FTE workforce",
    excerpt:
      "The June workforce release shows falling departures alongside a lower teacher FTE total. What the different measures mean for staffing decisions this autumn.",
    date: "2026-09-07",
    status: "published",
    category: "research",
    source:
      "Schoolgle briefing · Department for Education workforce and research releases",
    sourceUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/school-workforce-in-england/2025",
    readTime: "4 min",
    featured: true,
    module: "hr",
    format: "briefing",
    summary: [
      "Teacher FTE and departure measures cover different populations; read their definitions before comparing them.",
      "Qualifying-cohort retention is different from staying at the same school.",
      "Use national evidence to frame a focused local investigation of capacity and workload.",
    ],
  },

  // ── SEND & INCLUSION ──────────────────────────────────────
  {
    slug: "send-code-practice-reform",
    title:
      "SEND reform this autumn: what is starting, what remains proposed and what schools must still do",
    excerpt:
      "Experts at Hand starts its phased rollout, while wider SEND changes remain proposals. A dated briefing on the consultation position and present responsibilities.",
    date: "2026-09-07",
    status: "published",
    category: "news",
    source:
      "Schoolgle briefing · Department for Education SEND guidance and consultations",
    sourceUrl:
      "https://www.gov.uk/government/consultations/send-reform-putting-children-and-young-people-first",
    readTime: "4 min",
    featured: true,
    module: "send",
    format: "briefing",
    summary: [
      "Keep the current Code and existing provision separate from proposed structural reform.",
      "Confirm the local Experts at Hand offer; it must add to EHC-plan provision.",
      "The separate EOTAS consultation closes on 18 September 2026.",
    ],
  },

  // ── GOVERNANCE ────────────────────────────────────────────
  {
    slug: "governance-handbook-changes-2026",
    title: "Governance in 2026: use the right guide and ask sharper questions",
    excerpt:
      "A practical briefing for maintained-school governors and academy trustees.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE: maintained schools governance guide",
    sourceUrl:
      "https://www.gov.uk/government/publications/maintained-schools-governance-guide",
    readTime: "2 min",
    featured: false,
    module: "governance",
  },

  // ── FINANCE ───────────────────────────────────────────────
  {
    slug: "school-budget-benchmarking-2026",
    title:
      "School budget benchmarking in 2026: turn comparisons into better decisions",
    excerpt:
      "IFS, DfE and NFER describe different parts of the financial picture. A practical briefing on dated forecasts, meaningful comparators and school-level decisions.",
    date: "2026-09-07",
    status: "published",
    category: "research",
    source: "IFS, Department for Education and NFER",
    sourceUrl:
      "https://ifs.org.uk/publications/annual-report-education-spending-england-2025-26",
    readTime: "4 min",
    featured: true,
    module: "finance",
    format: "briefing",
    summary: [
      "National funding and cost models do not establish a particular school’s spending capacity.",
      "Check the reporting period, unit and comparator group before interpreting a difference.",
      "Connect each proposed financial action to provision, evidence and an explicit review point.",
    ],
  },

  // ── AI & GENERAL ──────────────────────────────────────────
  {
    slug: "ai-expert-work-schools",
    title: "AI and expert work: keep the review where it matters",
    excerpt:
      "Where an assistant can help, and why responsibility still needs a person.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE: generative AI in education",
    sourceUrl:
      "https://www.gov.uk/government/publications/generative-artificial-intelligence-in-education",
    readTime: "2 min",
    featured: false,
  },
  {
    slug: "intelligence-not-software",
    title: "When a dashboard should lead to a decision",
    excerpt:
      "The useful step between seeing a number and knowing what to investigate.",
    date: "2026-09-05",
    status: "published",
    category: "opinion",
    source: "Schoolgle editorial perspective; EEF implementation",
    sourceUrl:
      "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/implementation/process",
    readTime: "2 min",
    featured: false,
  },

  // ── COMING SOON ───────────────────────────────────────────
  {
    slug: "gdpr-ai-chatbots-schools",
    title: "AI in school: the questions to ask before anyone pastes pupil data",
    excerpt:
      "A practical starting point for heads, business managers and DPOs reviewing an AI tool.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE: AI and data protection",
    sourceUrl:
      "https://www.gov.uk/guidance/data-protection-in-schools/generative-artificial-intelligence-ai-and-data-protection-in-schools",
    readTime: "2 min",
    featured: true,
    module: "compliance",
  },
];

// ── Helper functions ────────────────────────────────────────

export function getPublishedInsights(): Insight[] {
  return insights
    .filter((i) => i.status === "published")
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getComingSoonInsights(): Insight[] {
  return insights.filter((i) => i.status === "coming_soon");
}

export function getPublicInsights(): Insight[] {
  return getPublishedInsights();
}

export function getInsightBySlug(slug: string): Insight | undefined {
  return insights.find((i) => i.slug === slug);
}

export function getLatestPublicInsights(count: number = 3): Insight[] {
  return getPublicInsights()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, count);
}

export function getFeaturedInsights(): Insight[] {
  return getPublishedInsights().filter((i) => i.featured);
}

export function getInsightsByCategory(
  category: Insight["category"],
): Insight[] {
  return getPublishedInsights().filter((i) => i.category === category);
}

export function getInsightsByModule(module: string): Insight[] {
  return getPublishedInsights().filter((i) => i.module === module);
}
