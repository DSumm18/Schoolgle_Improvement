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
    title:
      "80% of Software Features in Schools Are Never Used — Here's What That Costs You",
    excerpt:
      "UK schools spend £900m a year on edtech, but research shows most features gather digital dust. We break down the real cost and what Ed does about it.",
    date: "2026-03-05",
    status: "published",
    featured: true,
    category: "research",
    module: "finance",
    tags: ["edtech", "roi", "software", "budgets"],
    source: "Pendo / DfE EdTech Survey",
    sourceUrl:
      "https://www.pendo.io/resources/the-2019-feature-adoption-report/",
    readTime: "5 min",
    relatedApp: "Ed for Staff",
  },
  {
    slug: "hse-school-compliance-gap",
    title:
      "The HSE Compliance Gap: Why Schools Are Failing Statutory Checks They Don't Know About",
    excerpt:
      "From legionella testing to fire door inspections, many schools are unknowingly non-compliant. We map the gaps and what best practice looks like.",
    date: "2026-02-28",
    status: "published",
    featured: false,
    category: "research",
    module: "estates",
    tags: ["hse", "compliance", "legionella", "fire-safety", "statutory"],
    source: "HSE / DfE Good Estate Management",
    sourceUrl: "https://www.gov.uk/guidance/good-estate-management-for-schools",
    readTime: "8 min",
    relatedApp: "Estates & Compliance",
  },
  {
    slug: "school-building-condition-crisis",
    title:
      "The School Building Condition Crisis: What the DfE's Own Data Shows",
    excerpt:
      "Over 700,000 pupils learn in buildings rated 'poor' or 'bad'. We analyse the Condition Data Collection and what it means for estates management.",
    date: "2026-02-20",
    status: "published",
    category: "research",
    module: "estates",
    tags: ["buildings", "condition", "dfe", "maintenance", "raac"],
    source: "DfE Condition Data Collection 2024",
    sourceUrl:
      "https://www.gov.uk/government/publications/condition-of-school-buildings-survey",
    readTime: "7 min",
    relatedApp: "Estates & Compliance",
  },

  // ── TEACHING & LEARNING (EEF focus) ───────────────────────
  {
    slug: "eef-teaching-learning-toolkit-guide",
    title:
      "The EEF Teaching & Learning Toolkit: A School Leader's Practical Guide",
    excerpt:
      "The EEF toolkit is the single best evidence base for what works in classrooms. Here's how to actually use it to drive improvement, not just tick a box.",
    date: "2026-03-01",
    status: "published",
    featured: true,
    category: "guide",
    module: "teaching",
    tags: ["eef", "evidence-based", "teaching", "toolkit", "research"],
    source: "Education Endowment Foundation",
    sourceUrl:
      "https://educationendowmentfoundation.org.uk/education-evidence/teaching-learning-toolkit",
    readTime: "10 min",
    relatedApp: "Teaching & Learning",
  },
  {
    slug: "metacognition-self-regulation-schools",
    title:
      "Metacognition and Self-Regulation: The Highest Impact Strategy Schools Aren't Using Enough",
    excerpt:
      "EEF research shows +7 months progress for very low cost. Why aren't more schools embedding it — and how Schoolgle helps track it.",
    date: "2026-02-15",
    status: "published",
    category: "research",
    module: "teaching",
    tags: ["metacognition", "eef", "self-regulation", "evidence"],
    source: "EEF Metacognition Guidance Report",
    sourceUrl:
      "https://educationendowmentfoundation.org.uk/education-evidence/guidance-reports/metacognition",
    readTime: "8 min",
    relatedApp: "Teaching & Learning",
  },

  // ── SCHOOL IMPROVEMENT / OFSTED ───────────────────────────
  {
    slug: "preparing-for-ofsted-2025",
    title: "Preparing for Ofsted 2025: What Primary Schools Need to Know",
    excerpt:
      "The updated framework brings subtle but important changes. Here's what Headteachers and School Business Managers should focus on.",
    date: "2024-11-15",
    status: "published",
    featured: true,
    category: "guide",
    module: "improvement",
    tags: ["ofsted", "inspection", "preparation"],
    readTime: "8 min",
    relatedApp: "School Improvement",
  },
  {
    slug: "evidence-organisation-before-inspection",
    title: "Why Evidence Organisation Should Start Long Before Inspection",
    excerpt:
      "Schools that organise evidence as they go spend less time preparing and more time improving. Here's how to build that habit.",
    date: "2024-10-28",
    status: "published",
    category: "guide",
    module: "improvement",
    tags: ["evidence", "ofsted", "organisation"],
    readTime: "6 min",
    relatedApp: "School Improvement",
  },
  {
    slug: "self-evaluation-that-works",
    title: "Self-Evaluation That Actually Works",
    excerpt:
      "Most SEFs are written in a panic. Here's how to make self-evaluation an ongoing process that supports improvement, not just compliance.",
    date: "2024-09-22",
    status: "published",
    category: "opinion",
    module: "improvement",
    tags: ["sef", "self-evaluation", "improvement"],
    readTime: "5 min",
    relatedApp: "School Improvement",
  },
  {
    slug: "action-plans-that-stay-current",
    title: "Action Plans That Stay Current",
    excerpt:
      "Why school improvement plans go out of date, and how to keep them visible and actionable throughout the year.",
    date: "2024-09-05",
    status: "published",
    category: "guide",
    module: "improvement",
    tags: ["action-plans", "improvement", "planning"],
    readTime: "4 min",
    relatedApp: "School Improvement",
  },
  {
    slug: "siams-inspection-readiness",
    title: "SIAMS Inspection Readiness: A Practical Guide for Church Schools",
    excerpt:
      "What makes SIAMS different from Ofsted, and how to prepare evidence that demonstrates your school's distinctiveness effectively.",
    date: "2024-10-10",
    status: "published",
    category: "guide",
    module: "improvement",
    tags: ["siams", "church-schools", "inspection"],
    readTime: "7 min",
    relatedApp: "School Improvement",
  },

  // ── HR & PEOPLE ───────────────────────────────────────────
  {
    slug: "teacher-workload-technology-gap",
    title:
      "Only 30% of Teachers Say Tech Reduced Their Workload — What's Going Wrong?",
    excerpt:
      "The DfE's own research paints a bleak picture of edtech ROI. We dig into why schools aren't seeing the benefit and what needs to change.",
    date: "2026-02-20",
    status: "published",
    category: "research",
    module: "hr",
    tags: ["workload", "teachers", "edtech", "research"],
    source: "DfE EdTech Survey 2022-23",
    sourceUrl:
      "https://assets.publishing.service.gov.uk/media/621ce8ec8fa8f54915f43838/Education_Technology_EdTech_Survey.pdf",
    readTime: "7 min",
    relatedApp: "HR & People",
  },
  {
    slug: "teacher-retention-crisis-2026",
    title:
      "Teacher Retention in 2026: What the Data Says and What Schools Can Do",
    excerpt:
      "Retention rates are at their lowest in a decade. We analyse the School Workforce Census data and practical strategies that work.",
    date: "2026-02-10",
    status: "published",
    category: "research",
    module: "hr",
    tags: ["retention", "recruitment", "workforce", "census"],
    source: "DfE School Workforce Census",
    readTime: "9 min",
    relatedApp: "HR & People",
  },

  // ── SEND & INCLUSION ──────────────────────────────────────
  {
    slug: "send-code-practice-reform",
    title: "SEND Code of Practice Reform: What Schools Need to Prepare For",
    excerpt:
      "The government's SEND review promises big changes. Here's what's coming, what stays, and how to get ahead of it.",
    date: "2026-01-25",
    status: "published",
    category: "news",
    module: "send",
    tags: ["send", "code-of-practice", "reform", "ehcp"],
    source: "DfE SEND Review",
    readTime: "8 min",
    relatedApp: "SEND & Inclusion",
  },

  // ── GOVERNANCE ────────────────────────────────────────────
  {
    slug: "governance-handbook-changes-2026",
    title: "Governance Handbook 2026: Key Changes Governors Need to Know",
    excerpt:
      "Updated guidance on financial oversight, safeguarding duties, and MAT governance structures. A summary for busy governors.",
    date: "2026-01-15",
    status: "published",
    category: "guide",
    module: "governance",
    tags: ["governance", "handbook", "mat", "trustees"],
    source: "DfE Governance Handbook",
    readTime: "6 min",
    relatedApp: "Governance & Trust",
  },

  // ── FINANCE ───────────────────────────────────────────────
  {
    slug: "school-budget-benchmarking-2026",
    title:
      "School Budget Benchmarking: Are You Spending More Than Similar Schools?",
    excerpt:
      "Using DfE's benchmarking data to spot overspend, justify costs, and make the case for additional funding.",
    date: "2026-01-05",
    status: "published",
    category: "guide",
    module: "finance",
    tags: ["budget", "benchmarking", "funding", "spending"],
    source: "DfE Schools Financial Benchmarking",
    sourceUrl: "https://schools-financial-benchmarking.service.gov.uk/",
    readTime: "6 min",
    relatedApp: "Finance & Business",
  },

  // ── AI & GENERAL ──────────────────────────────────────────
  {
    slug: "ai-expert-work-schools",
    title:
      "When AI Starts Replacing Expert Work (and Why Schools Should Pay Attention)",
    excerpt:
      "Recent AI updates are quietly shifting expert work. What this means for schools — and why people still matter.",
    date: "2024-12-13",
    status: "published",
    featured: true,
    heroImage: "/insights/ai-expert-work-schools/hero.png",
    category: "research",
    tags: ["ai", "future", "leadership"],
    readTime: "10 min",
  },
  {
    slug: "intelligence-not-software",
    title: "Why School Operations Need Intelligence, Not Just Software",
    excerpt:
      "Most school systems store data. Very few help you make better decisions with it.",
    date: "2025-01-20",
    status: "published",
    category: "opinion",
    tags: ["ai", "operations", "data"],
    readTime: "6 min",
  },

  // ── COMING SOON ───────────────────────────────────────────
  {
    slug: "gdpr-ai-chatbots-schools",
    title: "GDPR, AI Chatbots and Schools: What You Need to Know",
    excerpt:
      "As AI assistants enter schools, data protection questions multiply. A practical guide to staying compliant while using AI tools.",
    date: "2026-03-15",
    status: "coming_soon",
    category: "guide",
    module: "compliance",
    tags: ["gdpr", "ai", "compliance", "data-protection"],
    readTime: "8 min",
    relatedApp: "Ed for Staff",
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
  return insights.filter(
    (i) => i.status === "published" || i.status === "coming_soon",
  );
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
