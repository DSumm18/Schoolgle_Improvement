export interface NewsletterEdition {
  week: number;
  slug: string;
  date: string;
  title: string;
  lead: string;
  /** Module tags this edition covers — maps to planet colours */
  modules: string[];
  /** Related research article slugs from insights.ts */
  relatedResearch?: string[];
  /** The interactive tool embedded in this edition (matches tools.json id) */
  toolId?: string;
  toolName?: string;
}

export const editions: NewsletterEdition[] = [
  {
    week: 13,
    slug: "week-13",
    date: "2026-03-17",
    title: "The Schoolgle Signal — Week 13",
    lead: "Did you know? Your procurement evidence is probably non-compliant",
    modules: ["finance", "compliance"],
    relatedResearch: ["school-budget-benchmarking-2026"],
    toolId: "deal-finder",
    toolName: "Deal Finder",
  },
  {
    week: 12,
    slug: "week-12",
    date: "2026-03-10",
    title: "The Schoolgle Signal — Week 12",
    lead: "The attendance data just dropped — and the gaps are widening",
    modules: ["compliance", "send"],
    relatedResearch: [],
    toolId: "ofsted-explorer",
    toolName: "Ofsted Inspection Explorer",
  },
  {
    week: 11,
    slug: "week-11",
    date: "2026-03-03",
    title: "The Schoolgle Signal — Week 11",
    lead: "The pay reality: 2.7% headroom, 6.5% ambition",
    modules: ["finance", "compliance"],
    relatedResearch: ["school-budget-benchmarking-2026"],
    toolId: "ehcp-readiness-snapshot",
    toolName: "EHCP Readiness Snapshot",
  },
  {
    week: 10,
    slug: "week-10",
    date: "2026-02-24",
    title: "The Schoolgle Signal — Week 10",
    lead: "Breakfast clubs — the national rollout starts April",
    modules: ["compliance"],
    relatedResearch: [],
    toolId: "workforce-calculator",
    toolName: "School Workforce Calculator",
  },
  {
    week: 9,
    slug: "week-09",
    date: "2026-02-17",
    title: "The Schoolgle Signal — Week 9",
    lead: "SEND — the pressure point nobody can ignore",
    modules: ["send", "compliance"],
    relatedResearch: ["send-code-practice-reform"],
    toolId: "send-funding-explorer",
    toolName: "SEND Funding Explorer",
  },
  {
    week: 8,
    slug: "week-08",
    date: "2026-02-10",
    title: "The Schoolgle Signal — Week 8",
    lead: "The budget squeeze: three pressures converging",
    modules: ["finance", "compliance", "teaching"],
    relatedResearch: [
      "school-budget-benchmarking-2026",
      "teacher-retention-crisis-2026",
    ],
    toolId: "budget-impact-calculator",
    toolName: "Budget Impact Calculator",
  },
  {
    week: 7,
    slug: "week-07",
    date: "2026-02-03",
    title: "The Schoolgle Signal — Week 7",
    lead: "Breakfast clubs — the national rollout starts April",
    modules: ["compliance", "teaching"],
    relatedResearch: [],
    toolId: "kcsie-safeguarding-checker",
    toolName: "KCSIE Safeguarding Checker",
  },
  {
    week: 6,
    slug: "week-06",
    date: "2026-01-27",
    title: "The Schoolgle Signal — Week 6",
    lead: "Census submissions — the errors that cost you money",
    modules: ["compliance", "finance", "hr"],
    relatedResearch: ["80-percent-software-features-unused"],
    toolId: "ni-cost-calculator",
    toolName: "NI Cost Calculator",
  },
  {
    week: 5,
    slug: "week-05",
    date: "2026-01-20",
    title: "The Schoolgle Signal — Week 5",
    lead: "Bett 2026: what actually mattered",
    modules: ["finance", "hr", "compliance"],
    relatedResearch: [
      "80-percent-software-features-unused",
      "teacher-workload-technology-gap",
    ],
    toolId: "breakfast-club-calculator",
    toolName: "Breakfast Club Calculator",
  },
  {
    week: 4,
    slug: "week-04",
    date: "2026-01-13",
    title: "The Schoolgle Signal — Week 4",
    lead: "£200 million for SEND training — the reality maths",
    modules: ["send", "compliance", "finance"],
    relatedResearch: ["send-code-practice-reform"],
    toolId: "send-placement-explorer",
    toolName: "SEND Placement Explorer",
  },
  {
    week: 3,
    slug: "week-03",
    date: "2026-01-06",
    title: "The Schoolgle Signal — Week 3",
    lead: "Spring Census — nine days to get it right",
    modules: ["compliance"],
    relatedResearch: [],
    toolId: "census-checker",
    toolName: "Spring Census Checker",
  },
  {
    week: 2,
    slug: "week-02",
    date: "2025-12-16",
    title: "The Schoolgle Signal — Week 2",
    lead: "The NI rise nobody's budgeted for",
    modules: ["finance", "compliance"],
    relatedResearch: ["school-budget-benchmarking-2026"],
    toolId: "send-funding-explorer",
    toolName: "SEND Funding Explorer",
  },
  {
    week: 1,
    slug: "week-01",
    date: "2025-12-09",
    title: "The Schoolgle Signal — Week 1",
    lead: "Ofsted's report cards — what the first wave tells us",
    modules: ["compliance"],
    relatedResearch: ["preparing-for-ofsted-2025"],
    toolId: "ofsted-explorer",
    toolName: "Ofsted Report Card Explorer",
  },
];

export function getEditionBySlug(slug: string): NewsletterEdition | undefined {
  return editions.find((e) => e.slug === slug);
}

export function getLatestEditions(count: number = 5): NewsletterEdition[] {
  return editions.slice(0, count);
}

export function getAllEditions(): NewsletterEdition[] {
  return editions;
}
