/**
 * DfE Data Sources — registry of all datasets, their status, and refresh schedule.
 *
 * This is the single source of truth for what data we have, where it comes from,
 * and when the next update is due.
 */

export interface DataSource {
  id: string;
  name: string;
  description: string;
  /** GOV.UK Explore Education Statistics URL */
  govUrl: string;
  /** Where the data lives in our system */
  storage: "supabase" | "csv" | "both";
  /** Supabase table name (if applicable) */
  table?: string;
  /** Data granularity */
  level: "school" | "la" | "national" | "school+la";
  /** Latest academic year we have */
  latestYear: string;
  /** Date we last ingested this data */
  lastIngested: string;
  /** Total records in our system */
  recordCount: number;
  /** Data quality: populated = has actual values, skeleton = rows but null values */
  quality: "good" | "partial" | "skeleton" | "empty";
  /** Typical DfE publication schedule */
  releaseSchedule: string;
  /** Estimated next release date */
  nextRelease: string;
  /** Whether we need to update this */
  needsUpdate: boolean;
  /** What's missing or broken */
  notes: string;
  /** Category for grouping */
  category:
    | "performance"
    | "attendance"
    | "workforce"
    | "finance"
    | "send"
    | "ofsted"
    | "demographics";
}

export const DFE_DATA_SOURCES: DataSource[] = [
  // ── GOOD DATA (populated, recent) ──
  {
    id: "schools",
    name: "School Directory (GIAS)",
    description:
      "All schools in England — URN, name, LA, phase, type, postcode, head teacher, FSM%, capacity",
    govUrl: "https://get-information-schools.service.gov.uk/Downloads",
    storage: "supabase",
    table: "schools",
    level: "school",
    latestYear: "2025-26",
    lastIngested: "2025-12-03",
    recordCount: 52152,
    quality: "good",
    releaseSchedule: "Updated daily by DfE (GIAS extract)",
    nextRelease: "Always current",
    needsUpdate: true,
    notes:
      "27,731 have FSM%. Head teacher data partially populated. Should re-extract quarterly.",
    category: "demographics",
  },
  {
    id: "attendance",
    name: "Pupil Attendance",
    description:
      "School-level attendance rates, persistent absence, authorised/unauthorised absence",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/pupil-absence-in-schools-in-england",
    storage: "supabase",
    table: "attendance",
    level: "school",
    latestYear: "2024-25",
    lastIngested: "2025-12-04",
    recordCount: 184605,
    quality: "good",
    releaseSchedule:
      "Termly (autumn, spring, full year). Full year ~March, autumn term ~October",
    nextRelease: "March 2026 (full year 2024-25, due 26 March 2026)",
    needsUpdate: false,
    notes:
      "Strong coverage 2013-2025. Missing 2019-20 (COVID). Weekly attendance dashboard also available.",
    category: "attendance",
  },
  {
    id: "census",
    name: "School Census",
    description:
      "Number on roll, FSM%, EAL%, SEN%. Collected termly via school census",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/school-pupils-and-their-characteristics",
    storage: "supabase",
    table: "census",
    level: "school",
    latestYear: "2024-25",
    lastIngested: "2025-12-03",
    recordCount: 146600,
    quality: "good",
    releaseSchedule: "Annually in June (based on January census)",
    nextRelease: "June 2026 (2025-26 data)",
    needsUpdate: false,
    notes:
      "Good coverage 2019-2025. ~24k schools/year. SEN% mostly null — may need separate SEND dataset.",
    category: "demographics",
  },
  {
    id: "exclusions",
    name: "Suspensions & Permanent Exclusions",
    description:
      "Fixed-period exclusions, permanent exclusions, reasons for exclusion",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/suspensions-and-permanent-exclusions-in-england",
    storage: "supabase",
    table: "exclusions",
    level: "school",
    latestYear: "2024-25",
    lastIngested: "2025-12-03",
    recordCount: 1104751,
    quality: "partial",
    releaseSchedule:
      "Termly releases + annual. Autumn ~November, spring ~April, full year ~July",
    nextRelease: "April 2026 (spring term 2024-25)",
    needsUpdate: false,
    notes:
      "Large dataset. Some years fully populated, others partial. permanent_exclusions_count often null in recent data.",
    category: "attendance",
  },

  // ── SKELETON DATA (rows exist but values mostly null) ──
  {
    id: "ks2",
    name: "KS2 Results (Primary Attainment)",
    description:
      "Expected standard %, higher standard %, progress scores in reading, writing, maths",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-2-attainment/2024-25-revised",
    storage: "supabase",
    table: "ks2_results",
    level: "school",
    latestYear: "2023-24",
    lastIngested: "2025-12-03",
    recordCount: 1048375,
    quality: "skeleton",
    releaseSchedule:
      "Provisional in September, revised (with school-level) in December",
    nextRelease: "Already available (2024-25 revised published Dec 2025)",
    needsUpdate: true,
    notes:
      "1M+ rows but expected_standard_pct is NULL for all records. Needs re-import with actual values from EES download. 2024-25 revised now available on GOV.UK.",
    category: "performance",
  },
  {
    id: "ks4",
    name: "KS4 Results (GCSE / Secondary)",
    description:
      "Attainment 8, Progress 8, % grade 5+ in English & maths, EBacc",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/key-stage-4-performance/2024-25",
    storage: "supabase",
    table: "ks4_results",
    level: "school",
    latestYear: "N/A",
    lastIngested: "N/A",
    recordCount: 0,
    quality: "empty",
    releaseSchedule:
      "Published annually in October; school-level tables updated in February",
    nextRelease:
      "Already available (2024-25 published Oct 2025, revised Feb 2026)",
    needsUpdate: true,
    notes:
      "Table exists but is empty. 2024-25 data available on EES. Needs full import.",
    category: "performance",
  },
  {
    id: "workforce",
    name: "School Workforce",
    description:
      "FTE teachers, TAs, support staff, pupil:teacher ratio, vacancies, teacher pay",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/school-workforce-in-england/2024",
    storage: "supabase",
    table: "workforce",
    level: "school",
    latestYear: "2022-23",
    lastIngested: "2025-12-03",
    recordCount: 164090,
    quality: "skeleton",
    releaseSchedule: "Annually in June (based on November census)",
    nextRelease: "June 2026 (2025/26 data)",
    needsUpdate: true,
    notes:
      "164k rows but fte_teachers, pupil_teacher_ratio etc. all NULL. 2024 data (Nov 2024 census) published June 2025 on EES. Needs re-import with actual values.",
    category: "workforce",
  },

  // ── CSV-ONLY DATA ──
  {
    id: "ofsted-five-year",
    name: "Five-Year Ofsted Inspection Data",
    description:
      "Overall effectiveness, sub-grades, safeguarding, deprivation band for all inspections 2019-2024",
    govUrl:
      "https://www.gov.uk/government/publications/five-year-ofsted-inspection-data",
    storage: "csv",
    level: "school",
    latestYear: "2024 (Dec)",
    lastIngested: "2025-12-01",
    recordCount: 129540,
    quality: "good",
    releaseSchedule:
      "Previously termly. Publication postponed while dataset is revised for new framework.",
    nextRelease: "Uncertain — dataset under review by DfE",
    needsUpdate: false,
    notes:
      "This is the LAST complete graded dataset. From Sep 2024, Ofsted removed overall effectiveness grade. Powers our five-year trend analysis.",
    category: "ofsted",
  },
  {
    id: "ofsted-latest",
    name: "Ofsted: Most Recent Per School (Aug 2025)",
    description:
      "Current inspection status of every school — grade, sub-grades, safeguarding, previous inspection",
    govUrl:
      "https://www.gov.uk/government/statistics/state-funded-schools-inspections-and-outcomes-as-at-31-august-2025",
    storage: "csv",
    level: "school",
    latestYear: "2025 (Aug)",
    lastIngested: "2026-03-01",
    recordCount: 22005,
    quality: "good",
    releaseSchedule:
      "Official statistics published annually (~November). Monthly management info also available.",
    nextRelease: "November 2026 (as at 31 Aug 2026)",
    needsUpdate: false,
    notes:
      "22,005 schools, 18,618 graded (93.1% Good+), 3,269 not judged (post Sep 2024). Powers the Current Snapshot on the Ofsted Explorer.",
    category: "ofsted",
  },

  // ── NOT YET IMPORTED ──
  {
    id: "ehcp",
    name: "EHCP / SEND Statistics",
    description:
      "EHC plans issued, active plans, assessments, timeliness, placements by LA",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/education-health-and-care-plans/2025",
    storage: "supabase",
    table: "N/A",
    level: "la",
    latestYear: "N/A",
    lastIngested: "N/A",
    recordCount: 0,
    quality: "empty",
    releaseSchedule:
      "Annually in June (based on January SEN2 return + calendar year activity)",
    nextRelease: "June 2026 (reporting year 2026)",
    needsUpdate: true,
    notes:
      "2025 data (Jan 2025 + CY 2024) published June 2025 on EES. Not yet imported. Key for SEND tools — EHCP volumes, waiting times, placement types by LA.",
    category: "send",
  },
  {
    id: "sen-school",
    name: "SEN in Schools",
    description:
      "SEN support and EHCP counts at school level, by primary need type",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/special-educational-needs-in-england/2024-25",
    storage: "supabase",
    table: "N/A",
    level: "school",
    latestYear: "N/A",
    lastIngested: "N/A",
    recordCount: 0,
    quality: "empty",
    releaseSchedule: "Annually in June",
    nextRelease: "June 2026 (2025-26 data)",
    needsUpdate: true,
    notes:
      "2024-25 data available. Not imported. Would power SEND Funding Explorer with school-level SEN data.",
    category: "send",
  },
  {
    id: "finance",
    name: "School Financial Data (CFR)",
    description:
      "Income, expenditure, per-pupil spend, staff costs from Consistent Financial Reporting",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/la-and-school-expenditure/2024-25",
    storage: "supabase",
    table: "N/A",
    level: "school",
    latestYear: "N/A",
    lastIngested: "N/A",
    recordCount: 0,
    quality: "empty",
    releaseSchedule: "Annually in December (LA & school expenditure)",
    nextRelease: "December 2026 (2025-26 data)",
    needsUpdate: true,
    notes:
      "2024-25 data published Dec 2025 on EES. Not imported. FBIT also has school-level CFR data. Would power budget tools with real comparisons.",
    category: "finance",
  },
  {
    id: "funding",
    name: "School Funding Allocations",
    description:
      "Core budget allocations, pupil premium, PE & sport premium per school",
    govUrl:
      "https://explore-education-statistics.service.gov.uk/find-statistics/school-funding-statistics/2024-25",
    storage: "supabase",
    table: "N/A",
    level: "school",
    latestYear: "N/A",
    lastIngested: "N/A",
    recordCount: 0,
    quality: "empty",
    releaseSchedule: "Annually in March/April",
    nextRelease: "March 2026 (2025-26 allocations)",
    needsUpdate: true,
    notes:
      "Available on EES. Not imported. Useful for budget calculator benchmarking.",
    category: "finance",
  },
];

/** Get all sources that need updating */
export function getSourcesNeedingUpdate(): DataSource[] {
  return DFE_DATA_SOURCES.filter((s) => s.needsUpdate);
}

/** Get sources by category */
export function getSourcesByCategory(
  category: DataSource["category"],
): DataSource[] {
  return DFE_DATA_SOURCES.filter((s) => s.category === category);
}

/** Get upcoming data releases (next 3 months) */
export function getUpcomingReleases(): DataSource[] {
  return DFE_DATA_SOURCES.filter(
    (s) =>
      s.nextRelease.includes("2026") && !s.nextRelease.includes("Uncertain"),
  ).sort((a, b) => a.nextRelease.localeCompare(b.nextRelease));
}

/** Summary stats */
export function getDataSummary() {
  const total = DFE_DATA_SOURCES.length;
  const good = DFE_DATA_SOURCES.filter((s) => s.quality === "good").length;
  const needsUpdate = DFE_DATA_SOURCES.filter((s) => s.needsUpdate).length;
  const totalRecords = DFE_DATA_SOURCES.reduce(
    (sum, s) => sum + s.recordCount,
    0,
  );
  return { total, good, needsUpdate, totalRecords };
}
