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
    title: "School buildings: turn the condition report into a practical plan",
    excerpt:
      "Use condition information to prioritise work and keep decisions visible.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE: commissioning condition surveys",
    sourceUrl:
      "https://www.gov.uk/government/publications/commissioning-a-condition-survey-for-school-and-college-buildings",
    readTime: "2 min",
    featured: false,
    module: "estates",
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
    title: "Metacognition: make the thinking visible in the lesson",
    excerpt: "Move from a promising research headline to classroom practice.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "EEF: metacognition and self-regulation",
    sourceUrl:
      "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit/metacognition-and-self-regulation",
    readTime: "2 min",
    featured: false,
    module: "teaching",
  },

  // ── SCHOOL IMPROVEMENT / OFSTED ───────────────────────────
  {
    slug: "preparing-for-ofsted-2025",
    title:
      "Ofsted in September 2026: prepare the conversation, not another folder",
    excerpt:
      "Use the right inspection materials and connect evidence to what leaders are doing.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "Ofsted inspection materials",
    sourceUrl:
      "https://www.gov.uk/government/publications/school-inspection-toolkit-operating-guide-and-information",
    readTime: "2 min",
    featured: true,
    module: "improvement",
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
    title: "Teacher retention: start with the conditions you can change",
    excerpt:
      "Use national evidence carefully and listen to what makes the local working day harder.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE: School workforce in England 2025",
    sourceUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/school-workforce-in-england/2025",
    readTime: "2 min",
    featured: false,
    module: "hr",
  },

  // ── SEND & INCLUSION ──────────────────────────────────────
  {
    slug: "send-code-practice-reform",
    title:
      "SEND reform: keep today's support separate from tomorrow's proposals",
    excerpt:
      "A practical way to track change without losing sight of the pupil in front of you.",
    date: "2026-09-05",
    status: "published",
    category: "news",
    source: "DfE: SEND code of practice",
    sourceUrl:
      "https://www.gov.uk/government/publications/send-code-of-practice-0-to-25",
    readTime: "2 min",
    featured: false,
    module: "send",
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
      "School budget benchmarking: use the difference to ask a better question",
    excerpt:
      "Compare carefully, investigate the context and record a decision you can explain.",
    date: "2026-09-05",
    status: "published",
    category: "guide",
    source: "DfE Financial Benchmarking and Insights Tool",
    sourceUrl:
      "https://financial-benchmarking-and-insights-tool.education.gov.uk/",
    readTime: "2 min",
    featured: false,
    module: "finance",
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
  return insights.filter((i) => i.status === "published");
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
  return insights.filter((i) => i.featured && i.status === "published");
}

export function getInsightsByCategory(
  category: Insight["category"],
): Insight[] {
  return getPublishedInsights().filter((i) => i.category === category);
}

export function getInsightsByModule(module: string): Insight[] {
  return getPublishedInsights().filter((i) => i.module === module);
}
