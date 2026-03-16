/**
 * Legislation Registry
 *
 * Single source of truth for current UK education legislation and guidance.
 * When legislation is updated (e.g. KCSIE 2026 replaces KCSIE 2025),
 * update THIS file. The rubrics reference legislation by key, so they
 * automatically pick up the current version.
 *
 * Update cycle:
 * - KCSIE: September each year
 * - Academy Trust Handbook: September each year
 * - Working Together: irregular (last updated 2023)
 * - School Information Regs: amended periodically
 * - SEND Code of Practice: 2015, awaiting replacement
 */

export interface LegislationEntry {
  /** Short key for referencing */
  key: string;
  /** Full official title */
  title: string;
  /** Current version/year */
  currentVersion: string;
  /** Previous versions that indicate outdated content */
  supersededVersions: string[];
  /** When the current version was published */
  publishedDate: string;
  /** When to expect the next update */
  nextUpdateExpected?: string;
  /** Which requirement categories this legislation applies to */
  categories: string[];
  /** Notes for assessors */
  notes?: string;
}

export const LEGISLATION_REGISTRY: LegislationEntry[] = [
  // ─── Safeguarding ────────────────────────────────────────────────
  {
    key: "kcsie",
    title: "Keeping Children Safe in Education",
    currentVersion: "2025",
    supersededVersions: [
      "2024",
      "2023",
      "2022",
      "2021",
      "2020",
      "2019",
      "2018",
      "2016",
    ],
    publishedDate: "2025-09-01",
    nextUpdateExpected: "September 2026",
    categories: ["safeguarding", "online_safety", "policies"],
    notes:
      "Published annually each September. All staff must read Part 1 (or Annex A). " +
      "Key changes in 2025: strengthened filtering/monitoring requirements, " +
      "updated child-on-child abuse terminology.",
  },
  {
    key: "working_together",
    title: "Working Together to Safeguard Children",
    currentVersion: "2023",
    supersededVersions: ["2018", "2015", "2013", "2010", "2006"],
    publishedDate: "2023-12-01",
    categories: ["safeguarding"],
    notes:
      "Major revision in 2023 replacing the 2018 version. " +
      "Key changes: multi-agency safeguarding arrangements, " +
      "information sharing, contextual safeguarding.",
  },

  // ─── School Information ──────────────────────────────────────────
  {
    key: "school_info_regs",
    title: "School Information (England) Regulations",
    currentVersion: "2008 (as amended 2012, 2016, 2019, 2025)",
    supersededVersions: [],
    publishedDate: "2008-09-01",
    categories: [
      "identity",
      "admissions",
      "curriculum",
      "send",
      "pupil_premium",
      "pe_sport_premium",
      "governance",
      "policies",
      "performance_data",
      "financial",
      "equality",
      "ofsted",
      "accessibility",
    ],
    notes:
      "The base regulations from 2008, amended multiple times. " +
      "Schedule 4 lists what must be published on school websites. " +
      "Most recently amended in 2025 (financial benchmarking link requirement).",
  },

  // ─── Academy Trust Governance ────────────────────────────────────
  {
    key: "academy_trust_handbook",
    title: "Academy Trust Handbook",
    currentVersion: "2025",
    supersededVersions: ["2024", "2023", "2022", "2021"],
    publishedDate: "2025-09-01",
    nextUpdateExpected: "September 2026",
    categories: ["governance", "financial"],
    notes:
      "Previously called the Academies Financial Handbook. " +
      "Renamed to Academy Trust Handbook from 2022. " +
      "Applies to all academy trusts. Sets out financial and governance requirements.",
  },

  // ─── SEND ────────────────────────────────────────────────────────
  {
    key: "send_code_of_practice",
    title: "SEND Code of Practice: 0 to 25 years",
    currentVersion: "2015",
    supersededVersions: ["2001"],
    publishedDate: "2015-01-01",
    categories: ["send"],
    notes:
      "Still the current statutory guidance despite its age. " +
      "The SEND and AP Improvement Plan (March 2023) signalled reforms " +
      "but has not yet replaced the 2015 Code. Chapter 6, Section 6.79 " +
      "specifies the 14 areas schools must cover in their SEN Information Report.",
  },
  {
    key: "send_regulations",
    title: "Special Educational Needs and Disability Regulations",
    currentVersion: "2014",
    supersededVersions: [],
    publishedDate: "2014-09-01",
    categories: ["send"],
    notes: "Regulation 51 requires SENCO name and contact details on website.",
  },

  // ─── Equality ────────────────────────────────────────────────────
  {
    key: "equality_act",
    title: "Equality Act",
    currentVersion: "2010",
    supersededVersions: [],
    publishedDate: "2010-10-01",
    categories: ["equality", "send", "policies"],
    notes:
      "Requires schools to publish equality objectives (at least every 4 years) " +
      "and annual equality information. Specific duties under the Public Sector " +
      "Equality Duty (PSED).",
  },

  // ─── Admissions ──────────────────────────────────────────────────
  {
    key: "school_admissions_code",
    title: "School Admissions Code",
    currentVersion: "2021",
    supersededVersions: ["2014", "2012"],
    publishedDate: "2021-09-01",
    categories: ["admissions"],
    notes:
      "Sets out mandatory requirements for admission authorities. " +
      "Schools must publish admission arrangements annually by 28 February " +
      "for the following September intake.",
  },

  // ─── Behaviour ───────────────────────────────────────────────────
  {
    key: "behaviour_in_schools",
    title: "Behaviour in Schools guidance",
    currentVersion: "September 2022",
    supersededVersions: ["2016"],
    publishedDate: "2022-09-01",
    categories: ["policies"],
    notes:
      "Non-statutory guidance but Ofsted inspectors use it as a benchmark. " +
      "Schools should show awareness of this document in their behaviour policy.",
  },

  // ─── RSE ─────────────────────────────────────────────────────────
  {
    key: "rse_guidance",
    title:
      "Relationships Education, Relationships and Sex Education (RSE) and Health Education",
    currentVersion: "2019 (updated 2024)",
    supersededVersions: [],
    publishedDate: "2019-09-01",
    categories: ["policies", "curriculum"],
    notes:
      "Statutory guidance for RSE. Updated in 2024 to include guidance on " +
      "gender identity. Schools must consult parents on RSE policy. " +
      "Parents have a right to withdraw from sex education (not relationships education).",
  },

  // ─── Financial ───────────────────────────────────────────────────
  {
    key: "financial_reporting",
    title: "School Information (England) (Amendment) Regulations",
    currentVersion: "2025",
    supersededVersions: [],
    publishedDate: "2025-01-01",
    categories: ["financial"],
    notes:
      "Requires academies to publish a link to the DfE financial benchmarking " +
      "service (Schools Financial Benchmarking). Also requires disclosure of " +
      "staff earning over £100k in £10k bands.",
  },

  // ─── PE & Sport Premium ──────────────────────────────────────────
  {
    key: "pe_sport_premium",
    title: "PE and Sport Premium Conditions of Grant",
    currentVersion: "2025-26",
    supersededVersions: ["2024-25", "2023-24"],
    publishedDate: "2025-09-01",
    nextUpdateExpected: "September 2026",
    categories: ["pe_sport_premium"],
    notes:
      "Published annually. Schools must publish by 31 July each year. " +
      "Allocation: £16,000 lump sum + £10 per pupil in Years 1-6. " +
      "Must include swimming data for primary schools with Y6.",
  },

  // ─── Accessibility ───────────────────────────────────────────────
  {
    key: "accessibility_regulations",
    title:
      "Public Sector Bodies (Websites and Mobile Applications) Accessibility Regulations",
    currentVersion: "2018 (No. 2)",
    supersededVersions: [],
    publishedDate: "2018-09-23",
    categories: ["accessibility"],
    notes:
      "Requires all public sector websites (including schools) to meet " +
      "WCAG 2.1 AA standard and publish an accessibility statement. " +
      "Schools must publish a statement even if their site is not fully compliant — " +
      "the statement should describe known issues and a plan to fix them.",
  },

  // ─── Pupil Premium ──────────────────────────────────────────────
  {
    key: "pupil_premium_conditions",
    title: "Pupil Premium Conditions of Grant",
    currentVersion: "2025-26",
    supersededVersions: ["2024-25", "2023-24"],
    publishedDate: "2025-09-01",
    nextUpdateExpected: "September 2026",
    categories: ["pupil_premium"],
    notes:
      "Published annually. Per-pupil rates 2025-26: " +
      "Primary FSM Ever 6 = £1,455, Secondary FSM Ever 6 = £1,035, " +
      "LAC/Previously LAC = £2,530, Service children = £340. " +
      "DfE recommends the 3-year strategy template with annual review.",
  },

  // ─── Online Safety ──────────────────────────────────────────────
  {
    key: "filtering_monitoring",
    title: "Meeting digital and technology standards in schools and colleges",
    currentVersion: "2023 (updated 2024)",
    supersededVersions: [],
    publishedDate: "2023-03-01",
    categories: ["online_safety"],
    notes:
      "DfE standards for filtering and monitoring. Schools must meet these " +
      "standards and report compliance. KCSIE 2025 Part 2 reinforces " +
      "the requirement for appropriate filtering and monitoring.",
  },
];

/**
 * Look up current legislation by key
 */
export function getLegislation(key: string): LegislationEntry | undefined {
  return LEGISLATION_REGISTRY.find((l) => l.key === key);
}

/**
 * Get all legislation relevant to a requirement category
 */
export function getLegislationForCategory(
  category: string,
): LegislationEntry[] {
  return LEGISLATION_REGISTRY.filter((l) => l.categories.includes(category));
}

/**
 * Check if a legislation reference in a document is current or superseded
 * Returns: 'current' | 'outdated' | 'unknown'
 */
export function checkLegislationCurrency(
  documentText: string,
  legislationKey: string,
): "current" | "outdated" | "unknown" {
  const entry = getLegislation(legislationKey);
  if (!entry) return "unknown";

  const textLower = documentText.toLowerCase();
  const titleLower = entry.title.toLowerCase();

  // Check if the current version is referenced
  const currentRef = `${titleLower} ${entry.currentVersion}`.toLowerCase();
  const currentRefShort = `${entry.currentVersion}`;
  const hasCurrent =
    textLower.includes(currentRef) ||
    (textLower.includes(titleLower) && textLower.includes(currentRefShort));

  if (hasCurrent) return "current";

  // Check if any superseded version is referenced
  for (const superseded of entry.supersededVersions) {
    const oldRef = `${superseded}`;
    if (textLower.includes(titleLower) && textLower.includes(oldRef)) {
      return "outdated";
    }
  }

  return "unknown";
}

/**
 * Check all relevant legislation for a requirement category
 * Returns a summary of currency for each applicable legislation
 */
export function checkAllLegislationCurrency(
  documentText: string,
  category: string,
): Array<{
  key: string;
  title: string;
  currentVersion: string;
  status: "current" | "outdated" | "unknown";
}> {
  const legislation = getLegislationForCategory(category);
  return legislation.map((entry) => ({
    key: entry.key,
    title: entry.title,
    currentVersion: entry.currentVersion,
    status: checkLegislationCurrency(documentText, entry.key),
  }));
}
