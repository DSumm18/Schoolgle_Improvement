"use client";

import * as XLSX from "xlsx";
import { useState, useRef, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lock,
  TrendingUp,
  FileSpreadsheet,
  School,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
  Cloud,
  Database,
  UserCheck,
  Trophy,
  XCircle,
  BarChart3,
  Layers,
  Target,
  FileText,
  X,
  Download,
  Building2,
} from "lucide-react";
import { DriveFilePicker } from "@/components/canvas/DriveFilePicker";
import { CohortPassport } from "@/components/trust-assessor/CohortPassport";
import type { CohortPassportData } from "@/components/trust-assessor/CohortPassport";
import { PupilCardGrid } from "@/components/trust-assessor/PupilCardGrid";
import { SchoolTabTabs } from "@/components/trust-assessor/SchoolTabTabs";
import type { SchoolTabId } from "@/components/trust-assessor/SchoolTabTabs";
import { EditModeProvider, EditableText } from "@/components/trust-assessor/EditableText";
import { HideableCard } from "@/components/trust-assessor/HideableCard";
import { useAuth } from "@/context/SupabaseAuthContext";
import { useGoogleDriveAccess } from "@/hooks/useGoogleDriveAccess";
import type { KS2Result, CensusRecord, NationalPercentile, ThreeYearAverage } from "@/lib/trust-analysis/types";
import type { UnifiedEvidenceTimeline, PupilEvidenceTimeline, EvidencePoint } from "@/lib/assessment-intelligence/evidence-timeline";
import type { CohortGapComparison, CohortGapLens, CohortGapSubject } from "@/lib/trust-assessor/cohort-gap-lens";
import {
  demographicExpectation,
  classifyAttainment,
  getEalTrajectory,
  computeForensicVerdict,
  type YearGroupShort,
} from "@/lib/trust-analysis/demographic-expectations";
import {
  RESEARCH_CITATIONS,
  citationShort,
  citationFull,
  evaluateResearchKpis,
} from "@/lib/trust-analysis/research-citations";
import { abbreviateSchoolName, buildAbbrevLookup, resolveSchoolByName } from '@/lib/trust-analysis/scoped-schools';
import { emitTrustAssessorEvents } from "@/lib/school-events/emit-trust-assessor";
import { Timeline } from "@/components/school-events/Timeline";
import type { SchoolEvent } from "@/lib/school-events/types";
import { KpiDashboard } from "@/components/intelligence";
import type { LaBenchmarkData, DemographicCohort, SchoolKpiData } from "@/components/intelligence";
import type { UrnValidationResult } from "@/lib/dfe-urn-validation";
import { CapturesPanel } from "@/components/school-assessment/CapturesPanel";
import {
  computeStaffingRatios,
  assessStaffing,
  NATIONAL_P_T_RATIO,
} from "@/lib/trust-analysis/staffing-ratios";

// ─── Constants ───────────────────────────────────────────────────────────────

// Context for the abbrev → school lookup. Provided by TrustAssessorPage and
// consumed by sub-components (TrafficLightGrid, SchoolTab, etc.) that were
// previously reading the hardcoded TRUST_SCHOOLS module constant.
type AbbrevLookup = Record<string, { id?: string; name: string; urn: number | null; nurseryPupils?: number; logo_url?: string | null }>;
const AbbrevLookupContext = createContext<AbbrevLookup>({});

const YEAR_GROUPS = ["EYFS", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"] as const;
type YearGroup = (typeof YEAR_GROUPS)[number];

const HEATMAP_YEAR_GROUPS: YearGroup[] = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];
type HeatmapSubject = "combined" | "reading" | "writing" | "maths";

// ─── Reliability Tier System ─────────────────────────────────────────────────

export type ReliabilityTier = 'external' | 'derived' | 'self_reported';

const TIER_CONFIG: Record<ReliabilityTier, { label: string; pill: string; dot: string; border: string }> = {
  external:      { label: 'External',      pill: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', dot: 'bg-emerald-500', border: 'border-l-emerald-500' },
  derived:       { label: 'Derived',       pill: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30',  dot: 'bg-amber-400',  border: 'border-l-amber-400'  },
  self_reported: { label: 'Self-reported', pill: 'bg-muted/30 text-muted-foreground border-border',   dot: 'bg-current',   border: 'border-l-muted'   },
};

function TierPill({ tier, size = 'xs' }: { tier: ReliabilityTier; size?: 'xs' | 'sm' }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${size === 'xs' ? 'text-[9px]' : 'text-xs'} ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function TierLegendBar() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex-wrap">
      <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider">Data tiers:</span>
      {(Object.keys(TIER_CONFIG) as ReliabilityTier[]).map(t => (
        <TierPill key={t} tier={t} size="xs" />
      ))}
      <span className="text-[10px] text-muted-foreground/60 ml-1">Every number is labelled — external = DfE validated, derived = computed from validated inputs, self-reported = school/organisation data</span>
    </div>
  );
}

// ─── Intra-Year Progression Types ────────────────────────────────────────────

interface TermSubjectScores {
  reading?: number | null;
  writing?: number | null;
  maths?: number | null;
  combined?: number | null;
  reading_gd?: number | null;
  writing_gd?: number | null;
  maths_gd?: number | null;
  combined_gd?: number | null;
  phonics?: number | null;
  mtc?: number | null;
  gld?: number | null;
}

interface TermData {
  term: 'eoy_prev' | 'autumn' | 'mid_year' | 'eoy_target' | 'eoy_current';
  label: string;
  cohortSize?: number | null;
  allPupils: TermSubjectScores;
  fsm6: TermSubjectScores;
  nonFsm6: TermSubjectScores;
  tier: ReliabilityTier;
}

interface Ks1Baseline {
  year: string;
  reading: number | null;
  writing: number | null;
  maths: number | null;
  combined: number | null;
  tier: ReliabilityTier;
}

interface YearGroupProgression {
  yearGroup: string; // 'Y1' through 'Y6' or 'EYFS'
  terms: TermData[];
  ks1Baseline?: Ks1Baseline;
}

interface SchoolDataSummary {
  schoolAbbrev: string;
  fileName: string;
  yearGroupProgressions: YearGroupProgression[];
}

// ─── AppConnector type ────────────────────────────────────────────────────────

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubjectScores {
  r_are: number | null;
  r_gd: number | null;
  w_are: number | null;
  w_gd: number | null;
  m_are: number | null;
  m_gd: number | null;
  c_are: number | null;
  c_gd: number | null;
  phonics?: number | null;
  mtc?: number | null;
  gld?: number | null;
}

function getSubjectARE(scores: Partial<SubjectScores>, subject: HeatmapSubject): number | null {
  if (subject === "combined") return scores.c_are ?? null;
  if (subject === "reading") return scores.r_are ?? null;
  if (subject === "writing") return scores.w_are ?? null;
  return scores.m_are ?? null;
}

interface SchoolYearData {
  cohort: {
    number_in_cohort: number | null;
    number_send: number | null;
    ehcp: number | null;
    number_fsm: number | null;
  };
  all_pupils: Partial<SubjectScores>;
  fsm6: Partial<SubjectScores>;
  not_fsm6: Partial<SubjectScores>;
}

interface ParsedSpreadsheet {
  schools: string[];
  yearGroups: string[];
  data: Record<string, Record<string, SchoolYearData>>;
  totalDataPoints: number;
  qualityFlags: QualityFlag[];
}

interface QualityFlag {
  school: string;
  yearGroup: string;
  field: string;
  issue: string;
  severity: "warning" | "error";
}

interface DfEData {
  ks2Results: KS2Result[];
  census: CensusRecord[];
  nationalPercentiles?: Record<number, NationalPercentile>;
  threeYearAverages?: Record<number, ThreeYearAverage>;
}

function countSpreadsheetDataPoints(data: Record<string, Record<string, SchoolYearData>>): number {
  let total = 0;
  for (const schoolData of Object.values(data)) {
    for (const yearData of Object.values(schoolData)) {
      for (const value of Object.values(yearData.cohort)) {
        if (value !== null && value !== undefined) total += 1;
      }
      for (const section of [yearData.all_pupils, yearData.fsm6, yearData.not_fsm6]) {
        for (const value of Object.values(section)) {
          if (value !== null && value !== undefined) total += 1;
        }
      }
    }
  }
  return total;
}

function scopeParsedSpreadsheet(
  parsed: ParsedSpreadsheet,
  allowedSchools: string[],
): ParsedSpreadsheet {
  const allowed = new Set(allowedSchools);
  const schools = parsed.schools.filter((school) => allowed.has(school));

  if (
    schools.length === parsed.schools.length &&
    schools.every((school, index) => school === parsed.schools[index])
  ) {
    return parsed;
  }

  const data: ParsedSpreadsheet["data"] = {};
  for (const school of schools) {
    if (parsed.data[school]) data[school] = parsed.data[school];
  }

  return {
    ...parsed,
    schools,
    yearGroups: parsed.yearGroups.filter((yearGroup) =>
      schools.some((school) => Boolean(data[school]?.[yearGroup])),
    ),
    data,
    totalDataPoints: countSpreadsheetDataPoints(data),
    qualityFlags: parsed.qualityFlags.filter((flag) => allowed.has(flag.school)),
  };
}

function formatShortDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getSubmittedYearGroups(parsed: ParsedSpreadsheet): YearGroup[] {
  return YEAR_GROUPS.filter((yearGroup) =>
    parsed.schools.some((school) => {
      const cohortSize = parsed.data[school]?.[yearGroup]?.cohort.number_in_cohort;
      const hasAssessment = parsed.data[school]?.[yearGroup] && countSpreadsheetDataPoints({ [school]: { [yearGroup]: parsed.data[school][yearGroup] } }) > 0;
      return (typeof cohortSize === "number" && cohortSize > 0) || Boolean(hasAssessment);
    }),
  );
}

// ─── XLSX Parsing Logic ───────────────────────────────────────────────────────

const SHEET_PROFILES: Record<
  string,
  Array<{ section: "all_pupils" | "fsm6" | "not_fsm6"; start: number; metrics: string[] }>
> = {
  EYFS: [
    { section: "all_pupils", start: 8, metrics: ["gld"] },
    { section: "fsm6", start: 16, metrics: ["gld"] },
    { section: "not_fsm6", start: 24, metrics: ["gld"] },
  ],
  "Year 1": [
    { section: "all_pupils", start: 5, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"] },
    { section: "fsm6", start: 14, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"] },
    { section: "not_fsm6", start: 23, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"] },
  ],
  "Year 2": [
    { section: "all_pupils", start: 5, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"] },
    { section: "fsm6", start: 14, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"] },
    { section: "not_fsm6", start: 23, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "phonics"] },
  ],
  "Year 3": [
    { section: "all_pupils", start: 5, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
    { section: "fsm6", start: 13, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
    { section: "not_fsm6", start: 21, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
  ],
  "Year 4": [
    { section: "all_pupils", start: 5, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "mtc"] },
    { section: "fsm6", start: 14, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "mtc"] },
    { section: "not_fsm6", start: 23, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd", "mtc"] },
  ],
  "Year 5": [
    { section: "all_pupils", start: 5, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
    { section: "fsm6", start: 13, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
    { section: "not_fsm6", start: 21, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
  ],
  "Year 6": [
    { section: "all_pupils", start: 5, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
    { section: "fsm6", start: 13, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
    { section: "not_fsm6", start: 21, metrics: ["r_are", "r_gd", "w_are", "w_gd", "m_are", "m_gd", "c_are", "c_gd"] },
  ],
};

function extractNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const matches = raw.match(/-?\d+(?:\.\d+)?/g);
  if (!matches?.length) return null;
  const parsed = Number(matches[matches.length - 1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseCell(metricKey: string, value: unknown): number | null {
  const isCount = ["number_in_cohort", "number_send", "ehcp", "number_fsm"].includes(metricKey);
  if (isCount) {
    const n = extractNumber(value);
    if (n === null) return null;
    // Counts must be whole numbers ≥ 0. If someone has entered a fractional value
    // (e.g. 0.14 in the FSM column meaning 14%), reject it — otherwise it pollutes
    // trust-wide totals ("803.14 FSM pupils"). Fractional > 1 likely a typo: round.
    if (n > 0 && n < 1) return null;
    return Math.round(n);
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    if (value >= 0 && value <= 1) return Math.round(value * 10000) / 100;
    return Math.round(value * 100) / 100;
  }

  const parsed = extractNumber(value);
  if (parsed === null) return null;
  const raw = String(value).trim();
  if (raw.includes("%") || raw.includes("(")) return Math.round(parsed * 100) / 100;
  if (parsed >= 0 && parsed <= 1) return Math.round(parsed * 10000) / 100;
  return Math.round(parsed * 100) / 100;
}

function parseSpreadsheet(workbook: XLSX.WorkBook): ParsedSpreadsheet {
  const schools = new Set<string>();
  const yearGroupsFound = new Set<string>();
  const data: Record<string, Record<string, SchoolYearData>> = {};
  const qualityFlags: QualityFlag[] = [];
  let totalDataPoints = 0;

  for (const sheetName of workbook.SheetNames) {
    const profile = SHEET_PROFILES[sheetName];
    if (!profile) continue;

    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as unknown[][];

    // Detect school-code column: some exports have a blank leading column A,
    // so everything is shifted right by 1. Count /^[A-Z]{2,6}$/ matches in col 0 vs col 1.
    const countCodeMatches = (col: number) => rows.reduce((n, r) => {
      const v = String((r ?? [])[col] ?? "").trim().toUpperCase();
      return n + (/^[A-Z]{2,6}$/.test(v) && v !== "TRUST" ? 1 : 0);
    }, 0);
    const codeCol = countCodeMatches(1) > countCodeMatches(0) ? 1 : 0;
    const colShift = codeCol;

    const headerRowIndex = rows.findIndex((row) =>
      row.some((cell) => String(cell ?? "").toLowerCase().includes("number in cohort"))
    );
    const trustRowIndex = rows.findIndex(
      (row, idx) => idx > Math.max(0, headerRowIndex) && String(row[codeCol] ?? "").trim().toUpperCase() === "TRUST"
    );
    const schoolRowsStart = trustRowIndex >= 0 ? trustRowIndex + 1 : headerRowIndex + 1;

    for (let r = schoolRowsStart; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const schoolRaw = String(row[codeCol] ?? "").trim().toUpperCase();
      if (!schoolRaw || schoolRaw === "TRUST" || schoolRaw.startsWith("NATIONAL") || !/^[A-Z]{2,6}$/.test(schoolRaw)) continue;

      schools.add(schoolRaw);
      yearGroupsFound.add(sheetName);

      if (!data[schoolRaw]) data[schoolRaw] = {};

      const cohort = {
        number_in_cohort: parseCell("number_in_cohort", row[1 + colShift]),
        number_send: parseCell("number_send", row[2 + colShift]),
        ehcp: parseCell("ehcp", row[3 + colShift]),
        number_fsm: parseCell("number_fsm", row[4 + colShift]),
      };

      const all_pupils: Partial<SubjectScores> = {};
      const fsm6: Partial<SubjectScores> = {};
      const not_fsm6: Partial<SubjectScores> = {};

      for (const sectionProfile of profile) {
        const target = sectionProfile.section === "all_pupils" ? all_pupils : sectionProfile.section === "fsm6" ? fsm6 : not_fsm6;
        sectionProfile.metrics.forEach((metric, idx) => {
          const raw = row[sectionProfile.start + idx + colShift];
          const parsed = parseCell(metric, raw);
          if (parsed !== null) {
            (target as Record<string, number | null>)[metric] = parsed;
            totalDataPoints++;
          }

          // Quality checks
          if (parsed === null && raw !== "" && raw !== null && raw !== undefined) {
            qualityFlags.push({ school: schoolRaw, yearGroup: sheetName, field: metric, issue: `Non-numeric value: "${raw}"`, severity: "error" });
          }
          if (parsed !== null && !["number_in_cohort", "number_send", "ehcp", "number_fsm"].includes(metric)) {
            if (parsed > 100) qualityFlags.push({ school: schoolRaw, yearGroup: sheetName, field: metric, issue: `Value exceeds 100%: ${parsed}`, severity: "error" });
            if (parsed > 0 && parsed < 1) qualityFlags.push({ school: schoolRaw, yearGroup: sheetName, field: metric, issue: `Possible decimal: ${parsed} (should this be ${Math.round(parsed * 100)}%?)`, severity: "warning" });
          }
        });
      }

      data[schoolRaw][sheetName] = { cohort, all_pupils, fsm6, not_fsm6 };
    }
  }

  return {
    schools: Array.from(schools).sort(),
    yearGroups: Array.from(yearGroupsFound),
    data,
    totalDataPoints,
    qualityFlags,
  };
}

// ─── Helper calculations ──────────────────────────────────────────────────────

function getCombinedARE(data: Partial<SubjectScores>): number | null {
  return data.c_are ?? null;
}

function getHeatmapColor(pct: number | null): string {
  if (pct === null) return "bg-gray-100 text-gray-400";
  if (pct >= 70) return "bg-emerald-100 text-emerald-800";
  if (pct >= 50) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function getKs2CombinedForUrn(ks2Results: KS2Result[], urn: number, year: number): number | null {
  const row = ks2Results.find(
    (r) => r.urn === urn && r.academicYearEnd === year && r.subject === "Reading, writing and maths" && r.breakdownTopic === "All pupils"
  );
  return row?.expectedStandardPct ?? null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ number, title, subtitle, complete }: { number: number; title: string; subtitle: string; complete?: boolean }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
        {complete ? <CheckCircle2 size={18} /> : number}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function SchoolLogoMark({
  school,
  info,
  size = "md",
}: {
  school: string;
  info?: { name?: string; logo_url?: string | null } | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-8 w-8 text-[10px]",
    md: "h-11 w-11 text-xs",
    lg: "h-14 w-14 text-sm",
  };
  const initials = school.replace(/[^A-Z0-9]/gi, "").slice(0, 4).toUpperCase() || "SCH";
  const label = info?.name ?? school;

  return (
      <span
        className={`${sizes[size]} inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-white/80`}
        title={label}
      >
        {info?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
        <img src={info.logo_url} alt={`${label} logo`} className="h-full w-full object-contain p-0.5" />
      ) : (
        <span className="font-bold text-slate-500">{initials}</span>
      )}
    </span>
  );
}

type StatSource = 'mid_year' | 'autumn' | 'dfe_ks2' | 'dfe_ks4' | 'dfe_census' | 'dfe_workforce' | 'mixed' | 'trust_spreadsheet';

function SourcePill({ source, labelOverride }: { source: StatSource; labelOverride?: string }) {
  const config: Record<StatSource, { label: string; cls: string }> = {
    mid_year:          { label: 'Mid-Year self-report',  cls: 'bg-muted/30 text-muted-foreground border-border' },
    autumn:            { label: 'Autumn self-report',     cls: 'bg-muted/30 text-muted-foreground border-border' },
    dfe_ks2:           { label: 'DfE KS2',                cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' },
    dfe_ks4:           { label: 'DfE KS4',                cls: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30' },
    dfe_census:        { label: 'DfE Census',             cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' },
    dfe_workforce:     { label: 'DfE Workforce',          cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30' },
    mixed:             { label: 'Mixed sources',          cls: 'bg-muted/30 text-muted-foreground border-border' },
    trust_spreadsheet: { label: 'Trust spreadsheet',      cls: 'bg-muted/30 text-muted-foreground border-border' },
  };
  const c = config[source];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border font-medium uppercase tracking-wide ${c.cls}`}>
      <span className="w-1 h-1 rounded-full bg-current opacity-60" />
      {labelOverride ?? c.label}
    </span>
  );
}

function StatCard({ label, value, sub, source, sourceLabel, priorValue, priorLabel }: {
  label: string;
  value: string | number;
  sub?: string;
  source?: StatSource;
  sourceLabel?: string;
  priorValue?: string | number | null;
  priorLabel?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-sm font-medium text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>}
      {priorValue !== undefined && priorValue !== null && priorValue !== '' && (
        <div className="text-[10px] text-muted-foreground/70 mt-0.5 italic">
          {priorLabel ?? 'Prior capture'}: {priorValue}
        </div>
      )}
      {source && <div className="mt-2"><SourcePill source={source} labelOverride={sourceLabel} /></div>}
    </div>
  );
}

// ─── Traffic Light Summary Grid ──────────────────────────────────────────────

type OverviewAudience = "trust" | "local_authority";

function TrustExecutiveOverview({ parsed, audience = "trust", sourceMode = "submission", parentBranding = null }: {
  parsed: ParsedSpreadsheet;
  audience?: OverviewAudience;
  sourceMode?: "submission" | "dfe";
  parentBranding?: { name: string; logo_url?: string | null } | null;
}) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const groupLabel = audience === "local_authority" ? "local authority" : "trust";
  const groupLabelTitle = audience === "local_authority" ? "Local authority" : "Trust";
  const y6Rows = parsed.schools
    .map((school) => {
      const y6 = parsed.data[school]?.["Year 6"];
      const combined = y6?.all_pupils.c_are ?? null;
      const y6Pupils = y6?.cohort.number_in_cohort ?? 0;
      return { school, combined, y6Pupils };
    })
    .filter((row) => row.combined !== null);

  const weakestY6 = [...y6Rows].sort((a, b) => (a.combined ?? 0) - (b.combined ?? 0))[0] ?? null;
  const strongestY6 = [...y6Rows].sort((a, b) => (b.combined ?? 0) - (a.combined ?? 0))[0] ?? null;
  const attentionSchools = y6Rows.filter((row) => (row.combined ?? 0) < 55);
  const gdWritingZeros = parsed.schools
    .map((school) => ({
      school,
      zeros: HEATMAP_YEAR_GROUPS.filter((yg) => parsed.data[school]?.[yg]?.all_pupils.w_gd === 0).length,
    }))
    .filter((row) => row.zeros >= 3)
    .sort((a, b) => b.zeros - a.zeros);
  const eyfsComplete = parsed.schools.filter((school) => {
    const eyfs = parsed.data[school]?.EYFS;
    return Boolean(eyfs?.cohort.number_in_cohort && eyfs?.all_pupils.gld !== null && eyfs?.all_pupils.gld !== undefined);
  }).length;
  const y6CombinedAverage = y6Rows.length > 0
    ? Math.round((y6Rows.reduce((sum, row) => sum + (row.combined ?? 0), 0) / y6Rows.length) * 10) / 10
    : null;

  const schoolName = (school: string) => abbrevLookup[school]?.name ?? school;
  const displaySchool = (school: string) => sourceMode === "dfe" ? schoolName(school) : school;
  const shortSchool = (school: string) => sourceMode === "dfe" ? schoolName(school) : abbreviateSchoolName(schoolName(school));
  const labels = audience === "local_authority"
    ? {
        eyebrow: "Local Authority Briefing",
        subtitle: "Latest validated public data, summarised for school improvement oversight and challenge.",
        practice: "The school improvement team may want to explore transferable practice.",
        confidence: sourceMode === "dfe"
          ? "DfE public data is externally validated; school assessment captures add EYFS–Y5 and in-year detail."
          : "All figures are from the selected local authority submission unless labelled otherwise.",
        findings: "Key findings for school improvement",
        rankingMissing: "Y6 combined data is not complete enough for an LA-wide ranking.",
        challenge: "Ask leaders what support is targeted at the lowest Y6 combined outcomes, and where stronger schools can share practice across the local authority.",
      }
    : {
        eyebrow: "Trustee Briefing",
        subtitle: "Latest trust capture, summarised for trustee-level oversight and challenge.",
        practice: "Trustees may want to explore transferable practice.",
        confidence: sourceMode === "dfe"
          ? "DfE public data is externally validated; school assessment captures add EYFS–Y5 and in-year detail."
          : "All figures are from the selected trust submission unless labelled otherwise.",
        findings: "Key findings for trustees",
        rankingMissing: "Y6 combined data is not complete enough for a trust-wide ranking.",
        challenge: "Ask leaders what support is targeted at the lowest Y6 combined outcomes, and where stronger schools can share practice across the trust.",
      };
  const featuredSchools = [strongestY6?.school, weakestY6?.school, ...attentionSchools.map((row) => row.school)]
    .filter((school, index, list): school is string => Boolean(school) && list.indexOf(school) === index)
    .slice(0, 7);
  const parentLogoUrl = parentBranding?.logo_url ?? null;
  const parentLogoAlt = parentBranding?.name ? `${parentBranding.name} logo` : `${groupLabelTitle} logo`;

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-indigo-50/70 shadow-sm">
      <div className="flex flex-col gap-5 border-b border-sky-100/80 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-16 items-center justify-center overflow-hidden rounded-2xl border border-white bg-white shadow-sm ${parentLogoUrl ? "w-48 p-2" : "w-16"}`}>
            {parentLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={parentLogoUrl} alt={parentLogoAlt} className="h-full w-full object-contain" />
            ) : (
              <School className="h-8 w-8 text-sky-600" />
            )}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-700">{labels.eyebrow}</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">School Improvement Overview</h2>
            <p className="mt-1 text-sm text-slate-600">{labels.subtitle}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/80 px-4 py-3 text-sm shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Y6 combined average</div>
          <div className="mt-1 text-2xl font-bold text-slate-950">{y6CombinedAverage !== null ? `${y6CombinedAverage}%` : "—"}</div>
          <div className="text-xs text-slate-500">Across {y6Rows.length} schools with Y6 data</div>
          {featuredSchools.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {featuredSchools.map((school) => (
                <SchoolLogoMark key={school} school={school} info={abbrevLookup[school]} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 p-5 md:grid-cols-4">
        <div className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-rose-600">Schools needing attention</div>
          <div className="mt-2 text-3xl font-bold text-slate-950">{attentionSchools.length}</div>
          <p className="mt-1 text-sm text-slate-600">Y6 combined below 55%.</p>
          <p className="mt-2 text-xs text-slate-500">
            {attentionSchools.length > 0
              ? attentionSchools.slice(0, 8).map((row) => `${displaySchool(row.school)} ${row.combined}%`).join(", ") + (attentionSchools.length > 8 ? `, +${attentionSchools.length - 8} more` : "")
              : "No schools below this threshold."}
          </p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-emerald-600">Notable strength</div>
          <div className="mt-2 flex items-center gap-2">
            {strongestY6 && <SchoolLogoMark school={strongestY6.school} info={abbrevLookup[strongestY6.school]} size="sm" />}
            <div className="text-xl font-bold text-slate-950">{strongestY6 ? shortSchool(strongestY6.school) : "—"}</div>
          </div>
          <p className="mt-1 text-sm text-slate-600">{strongestY6 ? `Y6 combined at ${strongestY6.combined}%.` : "No Y6 combined data available."}</p>
          <p className="mt-2 text-xs text-slate-500">{labels.practice}</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-amber-600">Key challenge</div>
          <div className="mt-2 flex items-center gap-2">
            {weakestY6 && <SchoolLogoMark school={weakestY6.school} info={abbrevLookup[weakestY6.school]} size="sm" />}
            <div className="text-xl font-bold text-slate-950">{weakestY6 ? shortSchool(weakestY6.school) : "—"}</div>
          </div>
          <p className="mt-1 text-sm text-slate-600">{weakestY6 ? `Y6 combined at ${weakestY6.combined}%.` : "No Y6 combined data available."}</p>
          <p className="mt-2 text-xs text-slate-500">Use the school tab to inspect subject and cohort gaps.</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wide text-sky-600">Data confidence</div>
          <div className="mt-2 text-xl font-bold text-slate-950">{eyfsComplete}/{parsed.schools.length} EYFS complete</div>
          <p className="mt-1 text-sm text-slate-600">{parsed.qualityFlags.length === 0 ? "No parser quality flags." : `${parsed.qualityFlags.length} quality flags to review.`}</p>
          <p className="mt-2 text-xs text-slate-500">{labels.confidence}</p>
        </div>
      </div>

      <div className="border-t border-sky-100/80 bg-white/60 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">{labels.findings}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">Attainment lens: </span>
            {weakestY6 && strongestY6
              ? `${displaySchool(strongestY6.school)} is strongest on Y6 combined (${strongestY6.combined}%), while ${displaySchool(weakestY6.school)} is the clearest immediate challenge (${weakestY6.combined}%).`
              : labels.rankingMissing}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">Greater depth writing: </span>
            {gdWritingZeros.length > 0
              ? `${displaySchool(gdWritingZeros[0].school)} has ${gdWritingZeros[0].zeros} year groups reporting 0% GD writing; triangulate before drawing conclusions.`
              : "No repeated 0% GD writing pattern is currently flagged."}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-950">Governance challenge: </span>
            {labels.challenge}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrafficLightGrid({ parsed, onSchoolClick, sourceMode = "submission" }: {
  parsed: ParsedSpreadsheet;
  onSchoolClick: (school: string) => void;
  sourceMode?: "submission" | "dfe";
}) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const getY6Pupils = (school: string): number => {
    const n = parsed.data[school]?.["Year 6"]?.cohort.number_in_cohort;
    return n ?? 0;
  };

  const sortedSchools = [...parsed.schools].sort((a, b) => {
    if (sourceMode === "dfe") {
      const aCombined = parsed.data[a]?.["Year 6"]?.all_pupils.c_are ?? 101;
      const bCombined = parsed.data[b]?.["Year 6"]?.all_pupils.c_are ?? 101;
      return aCombined - bCombined;
    }
    return getY6Pupils(b) - getY6Pupils(a);
  });

  const getCircleColor = (pct: number | null, thresholdGreen = 70, thresholdAmber = 50): string => {
    if (pct === null) return "bg-gray-200";
    if (pct >= thresholdGreen) return "bg-emerald-500";
    if (pct >= thresholdAmber) return "bg-amber-400";
    return "bg-red-500";
  };

  const getGdWritingColor = (school: string): string => {
    const zeroCount = HEATMAP_YEAR_GROUPS.filter((yg) => parsed.data[school]?.[yg]?.all_pupils.w_gd === 0).length;
    if (zeroCount >= 3) return "bg-red-500";
    if (zeroCount >= 1) return "bg-amber-400";
    return "bg-emerald-500";
  };

  const hasConsistencyWarning = (school: string): boolean => {
    for (let i = 1; i < HEATMAP_YEAR_GROUPS.length; i++) {
      const prev = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i - 1]]?.all_pupils.c_are ?? null;
      const curr = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i]]?.all_pupils.c_are ?? null;
      if (prev !== null && curr !== null && Math.abs(curr - prev) > 15) return true;
    }
    return false;
  };

  const cols = [
    { label: "Y6 Reading", key: "r_are" as keyof SubjectScores },
    { label: "Y6 Writing", key: "w_are" as keyof SubjectScores },
    { label: "Y6 Maths", key: "m_are" as keyof SubjectScores },
    { label: "Y6 Combined RWM+", key: "c_are" as keyof SubjectScores },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-3 pr-4 text-sm font-semibold text-gray-700 min-w-[120px]">School</th>
            {sourceMode !== "dfe" && (
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Y6 pupils</th>
            )}
            {cols.map((c) => (
              <th key={c.key} className="text-center py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{c.label}</th>
            ))}
            {sourceMode !== "dfe" && (
              <>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">GD Writing</th>
                <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap" title="Consistency: flags any adjacent year group jump >15pp - may indicate data entry errors or genuine curriculum concern">
                  Consistency <span className="text-gray-400 font-normal">(info)</span>
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedSchools.map((school) => {
            const y6 = parsed.data[school]?.["Year 6"]?.all_pupils ?? {};
            const y6Pupils = getY6Pupils(school);
            const isSmall = y6Pupils > 0 && y6Pupils < 100;
            const hasWarning = hasConsistencyWarning(school);
            return (
              <tr key={school} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <SchoolLogoMark school={school} info={abbrevLookup[school]} size="sm" />
                    <div>
                      <button
                        onClick={() => onSchoolClick(school)}
                        className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {sourceMode === "dfe" ? (abbrevLookup[school]?.name ?? school) : school}
                      </button>
                      {abbrevLookup[school] && (
                        <div className="text-xs text-gray-400 leading-tight">
                          {sourceMode === "dfe" ? `URN ${abbrevLookup[school].urn ?? "not linked"}` : abbrevLookup[school].name.split(" ").slice(0, 3).join(" ")}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                {sourceMode !== "dfe" && (
                  <td className="text-center py-3 px-3">
                    {y6Pupils > 0 ? (
                      <span className={`text-xs font-medium ${isSmall ? "italic text-gray-400" : "text-gray-700"}`}>
                        {isSmall ? `${y6Pupils}*` : y6Pupils}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">-</span>
                    )}
                  </td>
                )}
                {cols.map((c) => {
                  const pct = (y6[c.key] as number | null | undefined) ?? null;
                  return (
                    <td key={c.key} className="text-center py-3 px-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full ${getCircleColor(pct)} flex items-center justify-center`} title={pct !== null ? `${pct}%` : "No data"} />
                        <span className="text-xs font-semibold text-gray-700">{pct !== null ? `${pct}%` : "-"}</span>
                      </div>
                    </td>
                  );
                })}
                {sourceMode !== "dfe" && (
                  <>
                    <td className="text-center py-3 px-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full ${getGdWritingColor(school)}`} />
                        <span className="text-xs text-gray-500">
                          {HEATMAP_YEAR_GROUPS.filter((yg) => parsed.data[school]?.[yg]?.all_pupils.w_gd === 0).length} zeros
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-3">
                      {hasWarning ? (
                        <span title="One or more adjacent year groups differ by >15pp - check data or curriculum consistency">
                          <AlertTriangle size={16} className="text-amber-500 mx-auto" />
                        </span>
                      ) : (
                        <span className="text-gray-200 text-xs">-</span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="font-medium">Key:</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block" /> 70%+ (Green)</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block" /> 50-69% (Amber)</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block" /> Below 50% (Red)</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-gray-200 inline-block" /> No data</span>
        <span className="text-gray-400 ml-2">
          {sourceMode === "dfe"
            ? "These colours are a rear-view triage of published Y6 KS2 expected-standard outcomes, not current in-year assessment. Sorted by lowest Y6 combined RWM+ first."
            : "Sorted by Year 6 cohort size (largest first). * = under 100 Year 6 pupils - interpret percentages with caution. Click school name to drill down."}
        </span>
      </div>
    </div>
  );
}

function SubjectHeatmap({ parsed, onSchoolClick }: { parsed: ParsedSpreadsheet; onSchoolClick: (school: string) => void }) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const [subject, setSubject] = useState<HeatmapSubject>("combined");

  const tabs: { key: HeatmapSubject; label: string }[] = [
    { key: "combined", label: "Combined RWM+" },
    { key: "reading",  label: "Reading" },
    { key: "writing",  label: "Writing" },
    { key: "maths",    label: "Maths" },
  ];

  const allYearGroups: YearGroup[] = ["EYFS", ...HEATMAP_YEAR_GROUPS];
  const subjectDescription =
    subject === "combined"
      ? "Combined RWM+ is pupils meeting expected+ in Reading, Writing and Maths together — not an average of the three subject percentages."
      : `${subject.charAt(0).toUpperCase() + subject.slice(1)} shows the percentage meeting expected+ in that single subject.`;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubject(t.key)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${subject === t.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mb-3 text-xs text-gray-500">
        {subjectDescription}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 text-gray-500 font-medium w-24">School</th>
              {allYearGroups.map((yg) => (
                <th key={yg} className="p-2 text-center text-gray-500 font-medium text-xs whitespace-nowrap">
                  {yg === "EYFS" ? "EYFS" : yg.replace("Year ", "Y")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.schools.map((school) => (
              <tr key={school} className="border-t border-gray-100">
                <td className="p-2">
                  <button
                    onClick={() => onSchoolClick(school)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:underline"
                  >
                    <SchoolLogoMark school={school} info={abbrevLookup[school]} size="sm" />
                    <span>{school}</span>
                  </button>
                </td>
                {allYearGroups.map((yg) => {
                  const yearData = parsed.data[school]?.[yg];
                  let pct: number | null = null;
                  if (yearData) {
                    if (yg === "EYFS") {
                      pct = yearData.all_pupils.gld ?? null;
                    } else {
                      pct = getSubjectARE(yearData.all_pupils, subject);
                    }
                  }
                  const cohort = yearData?.cohort.number_in_cohort ?? null;
                  const small = cohort !== null && cohort < 15;
                  const colorClass = getHeatmapColor(pct);
                  const titleParts = [
                    cohort !== null ? `Cohort: ${cohort}` : null,
                    subject === "combined" && yearData && yg !== "EYFS"
                      ? `Combined RWM+: ${pct ?? "No data"}%; Reading: ${yearData.all_pupils.r_are ?? "No data"}%; Writing: ${yearData.all_pupils.w_are ?? "No data"}%; Maths: ${yearData.all_pupils.m_are ?? "No data"}%`
                      : null,
                    small ? "Small cohort — treat with caution" : null,
                  ].filter(Boolean).join(" | ");
                  return (
                    <td key={yg} className={`p-1 text-center ${small ? "opacity-60" : ""}`}>
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${colorClass} min-w-[42px]`}
                        title={titleParts || undefined}
                      >
                        {pct !== null ? `${pct}%` : "—"}
                        {small && pct !== null ? "*" : ""}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
        <span>{subject === "combined" ? "Combined RWM+ %" : `${subject.charAt(0).toUpperCase() + subject.slice(1)} ARE %`}  (EYFS = GLD %):</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 inline-block" /> 70%+</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> 50–69%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Below 50%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block" /> No data</span>
        <span className="text-gray-400">* Cohort &lt;15 — treat with caution</span>
      </div>
    </div>
  );
}

// ─── Phase 1: Per-School Detail Card ─────────────────────────────────────────

function FsmGapSnapshot({ parsed, school }: { parsed: ParsedSpreadsheet; school: string }) {
  const schoolData = parsed.data[school] ?? {};
  const rows = HEATMAP_YEAR_GROUPS.map((yearGroup) => {
    const data = schoolData[yearGroup];
    const fsm = data?.fsm6.c_are ?? null;
    const nonFsm = data?.not_fsm6.c_are ?? null;
    return {
      label: yearGroup.replace("Year ", "Y"),
      fsm,
      nonFsm,
      gap: fsm !== null && nonFsm !== null ? Math.round(nonFsm - fsm) : null,
    };
  }).filter((row) => row.fsm !== null || row.nonFsm !== null);

  if (rows.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex flex-col gap-1 mb-5">
        <h3 className="text-base font-semibold text-foreground">FSM6 gap snapshot</h3>
        <p className="text-xs text-muted-foreground">
          Combined ARE % for FSM6 and non-FSM pupils in the latest submission. The line between dots shows the attainment gap.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const fsm = row.fsm;
          const nonFsm = row.nonFsm;
          const left = Math.min(fsm ?? 100, nonFsm ?? 100);
          const right = Math.max(fsm ?? 0, nonFsm ?? 0);
          const gapWidth = Math.max(0, right - left);
          const gapTone = row.gap === null ? "text-muted-foreground" : row.gap > 20 ? "text-red-600 dark:text-red-300" : row.gap > 10 ? "text-amber-600 dark:text-amber-300" : "text-emerald-600 dark:text-emerald-300";

          return (
            <div key={row.label} className="grid grid-cols-[42px_1fr_78px] items-center gap-3">
              <div className="text-sm font-semibold text-foreground">{row.label}</div>
              <div className="relative h-8 rounded-full bg-muted/40 border border-border overflow-hidden">
                <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-border" />
                {fsm !== null && nonFsm !== null && gapWidth > 0 && (
                  <div
                    className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-400/80"
                    style={{ left: `${left}%`, width: `${gapWidth}%` }}
                  />
                )}
                {fsm !== null && (
                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-red-500 border-2 border-card shadow-sm"
                    style={{ left: `calc(${fsm}% - 8px)` }}
                    title={`FSM6: ${fsm}%`}
                  />
                )}
                {nonFsm !== null && (
                  <div
                    className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-sky-500 border-2 border-card shadow-sm"
                    style={{ left: `calc(${nonFsm}% - 8px)` }}
                    title={`Non-FSM: ${nonFsm}%`}
                  />
                )}
              </div>
              <div className={`text-right text-xs font-semibold ${gapTone}`}>
                {row.gap !== null ? `${row.gap > 0 ? "+" : ""}${row.gap}pp` : "partial"}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> FSM6</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500" /> Non-FSM</span>
        <span>Positive gap means non-FSM pupils are ahead.</span>
      </div>
    </div>
  );
}

function SchoolDetailCard({ school, parsed }: { school: string; parsed: ParsedSpreadsheet }) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const [open, setOpen] = useState(false);
  const [barChartSubject, setBarChartSubject] = useState<"combined" | "reading" | "writing" | "maths">("combined");

  const schoolData = parsed.data[school] ?? {};
  const info = abbrevLookup[school];

  // Compute totals across all year groups
  let totalPupils = 0;
  let totalFsm = 0;
  let totalSend = 0;
  let totalEhcp = 0;
  let cohortCount = 0;
  for (const yg of YEAR_GROUPS) {
    const d = schoolData[yg];
    if (!d) continue;
    if (d.cohort.number_in_cohort !== null) { totalPupils += d.cohort.number_in_cohort; cohortCount++; }
    if (d.cohort.number_fsm !== null) totalFsm += d.cohort.number_fsm;
    if (d.cohort.number_send !== null) totalSend += d.cohort.number_send;
    if (d.cohort.ehcp !== null) totalEhcp += d.cohort.ehcp;
  }

  const fsmPct = totalPupils > 0 ? Math.round((totalFsm / totalPupils) * 1000) / 10 : null;
  const sendPct = totalPupils > 0 ? Math.round((totalSend / totalPupils) * 1000) / 10 : null;

  // Bar chart: Combined ARE by year group (Y1–Y6)
  const barData = HEATMAP_YEAR_GROUPS.map((yg) => {
    const d = schoolData[yg];
    return {
      yg: yg.replace("Year ", "Y"),
      combined: d?.all_pupils.c_are ?? null,
      reading:  d?.all_pupils.r_are ?? null,
      writing:  d?.all_pupils.w_are ?? null,
      maths:    d?.all_pupils.m_are ?? null,
    };
  }).filter((d) => d.combined !== null || d.reading !== null);

  // Pipeline jump flags
  const pipelineJumps: string[] = [];
  for (let i = 1; i < HEATMAP_YEAR_GROUPS.length; i++) {
    const prev = schoolData[HEATMAP_YEAR_GROUPS[i - 1]]?.all_pupils.c_are ?? null;
    const curr = schoolData[HEATMAP_YEAR_GROUPS[i]]?.all_pupils.c_are ?? null;
    if (prev !== null && curr !== null && Math.abs(curr - prev) > 15) {
      pipelineJumps.push(`${HEATMAP_YEAR_GROUPS[i - 1].replace("Year ", "Y")} → ${HEATMAP_YEAR_GROUPS[i].replace("Year ", "Y")}: ${prev}% → ${curr}% (${curr > prev ? "+" : ""}${Math.round(curr - prev)}pp)`);
    }
  }

  // Subject table rows
  const subjectRows = YEAR_GROUPS.map((yg) => {
    const d = schoolData[yg];
    if (!d) return null;
    const ap = d.all_pupils;
    const hasSomething = Object.values(ap).some((v) => v !== null && v !== undefined);
    if (!hasSomething) return null;
    return { yg, d, ap };
  }).filter(Boolean) as { yg: string; d: SchoolYearData; ap: Partial<SubjectScores> }[];

  return (
    <div id={`school-card-${school}`} className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <SchoolLogoMark school={school} info={info} />
          <div className="text-left">
            <div className="font-semibold text-gray-900">{school}</div>
            {info && <div className="text-xs text-gray-400">{info.name}</div>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            {totalPupils > 0 && (
              <span className="font-medium text-gray-700">
                {totalPupils + (info?.nurseryPupils ?? 0)} pupils
                {info?.nurseryPupils && info.nurseryPupils > 0 && (
                  <span className="text-gray-400 font-normal"> ({info.nurseryPupils} nursery)</span>
                )}
              </span>
            )}
            {fsmPct !== null && <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">FSM {fsmPct}%</span>}
            {sendPct !== null && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">SEND {sendPct}%</span>}
            {pipelineJumps.length > 0 && (
              <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle size={10} /> {pipelineJumps.length} jump{pipelineJumps.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 bg-gray-50 border-t border-gray-100 space-y-5">

              {/* Quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {totalPupils > 0 ? totalPupils + (info?.nurseryPupils ?? 0) : "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Total Pupils</div>
                  <div className="text-xs text-gray-400">
                    {cohortCount} year groups
                    {info?.nurseryPupils && info.nurseryPupils > 0 && (
                      <span className="text-blue-600"> + {info.nurseryPupils} nursery</span>
                    )}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-rose-600">{fsmPct !== null ? `${Math.round(fsmPct)}%` : "—"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">FSM %</div>
                  <div className="text-xs text-gray-400">{totalFsm > 0 ? `${Math.round(totalFsm)} pupils` : ""}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">{sendPct !== null ? `${Math.round(sendPct)}%` : "—"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">SEND %</div>
                  <div className="text-xs text-gray-400">{totalSend > 0 ? `${Math.round(totalSend)} pupils` : ""}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-indigo-600">{totalEhcp > 0 ? totalEhcp : "—"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">EHCPs</div>
                </div>
              </div>

              {/* Pipeline jump alerts */}
              {pipelineJumps.length > 0 && (
                <div className="space-y-1">
                  {pipelineJumps.map((j, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      <span><span className="font-semibold">Pipeline jump:</span> {j}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Bar chart */}
              {barData.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-700">
                      {barChartSubject === "combined" ? "Combined ARE" :
                       barChartSubject === "reading" ? "Reading ARE" :
                       barChartSubject === "writing" ? "Writing ARE" : "Maths ARE"} % by Year Group
                    </div>
                    {/* Subject filter buttons */}
                    <div className="flex items-center gap-1">
                      {(["combined", "reading", "writing", "maths"] as const).map((subj) => (
                        <button
                          key={subj}
                          onClick={() => setBarChartSubject(subj)}
                          className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                            barChartSubject === subj
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {subj === "combined" ? "Combined" :
                           subj.charAt(0).toUpperCase() + subj.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="yg" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val) => [`${val}%`, ""]} contentStyle={{ fontSize: "13px" }} />
                      <Bar
                        dataKey={barChartSubject}
                        name={barChartSubject === "combined" ? "Combined" :
                              barChartSubject === "reading" ? "Reading" :
                              barChartSubject === "writing" ? "Writing" : "Maths"}
                        fill={barChartSubject === "combined" ? "#3B82F6" :
                              barChartSubject === "reading" ? "#10B981" :
                              barChartSubject === "writing" ? "#F59E0B" : "#8B5CF6"}
                        radius={[3, 3, 0, 0]}
                      />
                      <ReferenceLine y={65} stroke="#9CA3AF" strokeDasharray="4 4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Subject detail table */}
              {subjectRows.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-600 mb-2">Subject Detail (ARE %)</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-2 text-gray-500 font-medium">Year</th>
                          <th className="text-center p-2 text-gray-500 font-medium">Cohort</th>
                          <th className="text-center p-2 text-gray-500 font-medium">Reading</th>
                          <th className="text-center p-2 text-gray-500 font-medium">Writing</th>
                          <th className="text-center p-2 text-gray-500 font-medium">Maths</th>
                          <th className="text-center p-2 text-gray-500 font-medium">Combined</th>
                          <th className="text-center p-2 text-gray-500 font-medium">GD R</th>
                          <th className="text-center p-2 text-gray-500 font-medium">GD W</th>
                          <th className="text-center p-2 text-gray-500 font-medium">GD M</th>
                          <th className="text-center p-2 text-gray-500 font-medium">Extra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjectRows.map(({ yg, d, ap }) => {
                          const extra =
                            yg === "EYFS" ? (ap.gld !== null && ap.gld !== undefined ? `GLD ${ap.gld}%` : null) :
                            (yg === "Year 1" || yg === "Year 2") && ap.phonics !== null && ap.phonics !== undefined ? `Ph ${ap.phonics}%` :
                            yg === "Year 4" && ap.mtc !== null && ap.mtc !== undefined ? `MTC ${ap.mtc}%` : null;
                          const small = d.cohort.number_in_cohort !== null && d.cohort.number_in_cohort < 15;
                          return (
                            <tr key={yg} className={`border-t border-gray-100 ${small ? "opacity-70" : ""}`}>
                              <td className="p-2 font-medium text-gray-700">{yg.replace("Year ", "Y")}{small ? "*" : ""}</td>
                              <td className="p-2 text-center text-gray-500">{d.cohort.number_in_cohort ?? "—"}</td>
                              <td className={`p-2 text-center font-medium ${ap.r_are !== null && ap.r_are !== undefined && ap.r_are < 50 ? "text-red-600" : "text-gray-700"}`}>{ap.r_are !== null && ap.r_are !== undefined ? `${ap.r_are}%` : "—"}</td>
                              <td className={`p-2 text-center font-medium ${ap.w_are !== null && ap.w_are !== undefined && ap.w_are < 50 ? "text-red-600" : "text-gray-700"}`}>{ap.w_are !== null && ap.w_are !== undefined ? `${ap.w_are}%` : "—"}</td>
                              <td className={`p-2 text-center font-medium ${ap.m_are !== null && ap.m_are !== undefined && ap.m_are < 50 ? "text-red-600" : "text-gray-700"}`}>{ap.m_are !== null && ap.m_are !== undefined ? `${ap.m_are}%` : "—"}</td>
                              <td className={`p-2 text-center font-semibold ${ap.c_are !== null && ap.c_are !== undefined ? getHeatmapColor(ap.c_are).split(" ")[0] + " rounded" : ""}`}>{ap.c_are !== null && ap.c_are !== undefined ? `${ap.c_are}%` : "—"}</td>
                              <td className="p-2 text-center text-gray-500">{ap.r_gd !== null && ap.r_gd !== undefined ? `${ap.r_gd}%` : "—"}</td>
                              <td className={`p-2 text-center ${ap.w_gd !== null && ap.w_gd !== undefined && ap.w_gd === 0 ? "text-red-600 font-semibold" : "text-gray-500"}`}>{ap.w_gd !== null && ap.w_gd !== undefined ? `${ap.w_gd}%` : "—"}</td>
                              <td className="p-2 text-center text-gray-500">{ap.m_gd !== null && ap.m_gd !== undefined ? `${ap.m_gd}%` : "—"}</td>
                              <td className="p-2 text-center text-gray-400">{extra ?? "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* FSM vs non-FSM comparison */}
                  {(() => {
                    const y6 = schoolData["Year 6"];
                    if (!y6) return null;
                    const fsmY6 = y6.fsm6.c_are ?? null;
                    const notFsmY6 = y6.not_fsm6.c_are ?? null;
                    if (fsmY6 === null && notFsmY6 === null) return null;
                    const gap = fsmY6 !== null && notFsmY6 !== null ? Math.round(notFsmY6 - fsmY6) : null;
                    return (
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                        <span className="font-semibold text-gray-700">Y6 FSM gap:</span>
                        {fsmY6 !== null && <span>FSM6 <span className="font-medium text-rose-600">{fsmY6}%</span></span>}
                        {notFsmY6 !== null && <span>Non-FSM <span className="font-medium text-emerald-600">{notFsmY6}%</span></span>}
                        {gap !== null && (
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${gap > 20 ? "bg-red-50 text-red-700" : gap > 10 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {gap}pp gap
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Phase 1: School Tab ──────────────────────────────────────────────────────

const SUBJECT_COLORS = {
  reading: "#3B82F6",
  writing: "#EF4444",
  maths: "#10B981",
  combined: "#8B5CF6",
};

const FIELD_LABELS: Record<string, string> = {
  r_are: "Reading %",
  r_gd: "Reading GD",
  w_are: "Writing %",
  w_gd: "Writing GD",
  m_are: "Maths %",
  m_gd: "Maths GD",
  c_are: "Combined %",
  c_gd: "Combined GD",
};

// ─── Statistical Impossibility Detection ─────────────────────────────────────

interface StatAlert {
  severity: "low" | "medium" | "high";
  title: string;
  explanation: string;
  probability: string;
}

function detectStatisticalImpossibilities(school: string, schoolData: Record<string, SchoolYearData>): StatAlert[] {
  const alerts: StatAlert[] = [];

  // Rule 1: 0% GD with high ARE
  const zeroGdHighAre: { yg: string; subject: "reading" | "writing" | "maths"; are: number }[] = [];
  for (const yg of HEATMAP_YEAR_GROUPS) {
    const d = schoolData[yg];
    if (!d) continue;
    const ap = d.all_pupils;
    if (ap.r_are !== null && ap.r_are !== undefined && ap.r_are >= 60 && ap.r_gd === 0) {
      zeroGdHighAre.push({ yg: yg.replace("Year ", "Y"), subject: "reading", are: ap.r_are });
    }
    if (ap.w_are !== null && ap.w_are !== undefined && ap.w_are >= 60 && ap.w_gd === 0) {
      zeroGdHighAre.push({ yg: yg.replace("Year ", "Y"), subject: "writing", are: ap.w_are });
    }
    if (ap.m_are !== null && ap.m_are !== undefined && ap.m_are >= 60 && ap.m_gd === 0) {
      zeroGdHighAre.push({ yg: yg.replace("Year ", "Y"), subject: "maths", are: ap.m_are });
    }
  }
  if (zeroGdHighAre.length >= 3) {
    const bySubject: Record<string, string[]> = {};
    for (const item of zeroGdHighAre) {
      if (!bySubject[item.subject]) bySubject[item.subject] = [];
      bySubject[item.subject].push(`${item.yg} (${item.are}% ARE)`);
    }
    const subjectSummary = Object.entries(bySubject)
      .map(([sub, ygs]) => `${sub}: ${ygs.join(", ")}`)
      .join("; ");
    alerts.push({
      severity: zeroGdHighAre.length >= 5 ? "high" : zeroGdHighAre.length >= 3 ? "medium" : "low",
      title: `0% Greater Depth reported with 60%+ ARE across ${zeroGdHighAre.length} year group/subject combinations`,
      explanation: `${subjectSummary}. With 60%+ reaching Expected Standard, the statistically expected GD rate is 8–15%. 0% across multiple year groups suggests systemic moderation bias, over-cautious teacher assessment, or data entry error.`,
      probability: zeroGdHighAre.length >= 5 ? "This pattern occurs in <0.1% of UK primary schools." : "This pattern occurs in <2% of UK primary schools.",
    });
  } else if (zeroGdHighAre.length > 0) {
    alerts.push({
      severity: "low",
      title: `0% Greater Depth reported with 60%+ ARE in ${zeroGdHighAre.length} year group/subject combination${zeroGdHighAre.length > 1 ? "s" : ""}`,
      explanation: `${zeroGdHighAre.map(item => `${item.yg} ${item.subject}: ${item.are}% ARE`).join(", ")}. With high ARE, some GD is typically expected.`,
      probability: "Can occur naturally in smaller cohorts but warrants review.",
    });
  }

  // Rule 2: Impossible cohort deltas (>30pp swing in Combined between adjacent year groups)
  const bigSwings: { from: string; to: string; fromPct: number; toPct: number; delta: number }[] = [];
  for (let i = 1; i < HEATMAP_YEAR_GROUPS.length; i++) {
    const prevYg = HEATMAP_YEAR_GROUPS[i - 1];
    const currYg = HEATMAP_YEAR_GROUPS[i];
    const prev = schoolData[prevYg]?.all_pupils.c_are ?? null;
    const curr = schoolData[currYg]?.all_pupils.c_are ?? null;
    if (prev !== null && curr !== null && Math.abs(curr - prev) >= 30) {
      bigSwings.push({
        from: prevYg.replace("Year ", "Y"),
        to: currYg.replace("Year ", "Y"),
        fromPct: prev,
        toPct: curr,
        delta: Math.round(curr - prev),
      });
    }
  }
  if (bigSwings.length > 0) {
    alerts.push({
      severity: "high",
      title: `Extreme year group delta (30pp+): ${bigSwings.map(s => `${s.from}→${s.to}: ${s.fromPct}%→${s.toPct}%`).join(", ")}`,
      explanation: "A 30+ percentage point swing between adjacent year groups is extremely rare. Different cohorts will have different compositions, but swings of this magnitude almost always indicate data entry errors, moderation inconsistency, or an unusual cohort event.",
      probability: "This pattern occurs in <2% of UK primary schools.",
    });
  }

  // Rule 3: Exact 100% or 0% in cohorts >10
  const suspectExtremes: string[] = [];
  for (const yg of HEATMAP_YEAR_GROUPS) {
    const d = schoolData[yg];
    if (!d) continue;
    const cohort = d.cohort.number_in_cohort;
    if (cohort === null || cohort < 10) continue;
    const ap = d.all_pupils;
    const checks: [string, number | null | undefined][] = [
      [`${yg.replace("Year ", "Y")} Reading ARE`, ap.r_are],
      [`${yg.replace("Year ", "Y")} Writing ARE`, ap.w_are],
      [`${yg.replace("Year ", "Y")} Maths ARE`, ap.m_are],
      [`${yg.replace("Year ", "Y")} Combined ARE`, ap.c_are],
    ];
    for (const [label, val] of checks) {
      if (val === 100 || val === 0) {
        suspectExtremes.push(`${label} = ${val}% (cohort: ${cohort})`);
      }
    }
  }
  if (suspectExtremes.length >= 3) {
    alerts.push({
      severity: "medium",
      title: `Multiple exact 0% or 100% values across cohorts of 10+ pupils`,
      explanation: `${suspectExtremes.slice(0, 5).join("; ")}${suspectExtremes.length > 5 ? ` and ${suspectExtremes.length - 5} more` : ""}. Exact extremes in larger cohorts are statistically unusual and may indicate rounding from a very small numerator, data copy errors, or moderation shortcuts.`,
      probability: "Exact extremes in cohorts >10 occur in <5% of year groups nationally.",
    });
  }

  // Rule 4: Writing dramatically lower than Reading in Y6 (>25pp gap)
  const y6 = schoolData["Year 6"];
  if (y6) {
    const r = y6.all_pupils.r_are;
    const w = y6.all_pupils.w_are;
    if (r !== null && r !== undefined && w !== null && w !== undefined && r - w > 25) {
      alerts.push({
        severity: "medium",
        title: `Y6 Writing (${w}%) is ${Math.round(r - w)}pp below Y6 Reading (${r}%)`,
        explanation: "A gap of >25pp between Reading and Writing in Y6 is unusual. National data shows an average gap of ~8pp. This could reflect genuine cohort weakness in writing, inconsistent moderation of writing vs reading, or a curriculum imbalance. Worth investigating whether teacher moderation of writing meets national standards.",
        probability: "A Reading-Writing gap >25pp in Y6 occurs in <10% of UK primary schools.",
      });
    }
  }

  // Rule 5: Missing FSM data when school-level FSM appears high (computed from spreadsheet)
  {
    let totalP = 0, totalF = 0;
    for (const yg of YEAR_GROUPS) {
      const d = schoolData[yg];
      if (!d) continue;
      if (d.cohort.number_in_cohort !== null) totalP += d.cohort.number_in_cohort;
      if (d.cohort.number_fsm !== null) totalF += d.cohort.number_fsm;
    }
    const derivedFsmPct = totalP > 0 ? (totalF / totalP) * 100 : null;
    if (derivedFsmPct !== null && derivedFsmPct >= 30) {
      const missingFsmYgs = HEATMAP_YEAR_GROUPS.filter(yg => {
        const d = schoolData[yg];
        return d && d.cohort.number_fsm === null && d.cohort.number_in_cohort !== null && d.cohort.number_in_cohort > 5;
      });
      if (missingFsmYgs.length >= 3) {
        alerts.push({
          severity: "low",
          title: `FSM pupil counts missing in ${missingFsmYgs.length} year groups despite ~${Math.round(derivedFsmPct)}% school-level FSM`,
          explanation: `${missingFsmYgs.map(yg => yg.replace("Year ", "Y")).join(", ")} have no FSM pupil count in the spreadsheet. With ~${Math.round(derivedFsmPct)}% FSM eligibility, most year groups should show FSM pupils. This may be a data submission gap.`,
          probability: "Not statistically impossible but suggests incomplete data submission.",
        });
      }
    }
  }

  return alerts;
}

// ── BUILD 2: Weakest subject helper ──────────────────────────────────────────

function weakestSubject(journey: { subject: string; level: string }[]): { subject: string; avgLevel: number } | null {
  const levelValue = (l: string) => l === 'GDS' ? 3 : l === 'EXS' || l === '2' ? 2 : l === 'WTS' || l === 'WT' || l === '1' ? 1 : 0;
  const subjects = [...new Set(journey.map(j => j.subject).filter(s => ['reading', 'writing', 'maths'].includes(s)))];
  if (subjects.length === 0) return null;
  const scored = subjects.map(s => {
    const levels = journey.filter(j => j.subject === s).map(j => levelValue(j.level));
    const avg = levels.length > 0 ? levels.reduce<number>((a, b) => a + b, 0) / levels.length : 0;
    return { subject: s, avgLevel: avg };
  });
  scored.sort((a, b) => a.avgLevel - b.avgLevel);
  return scored[0];
}

type StaffingByUrn = Record<number, {
  urn: number;
  numberOfPupils: number | null;
  fteTeachers: number | null;
  fteTA: number | null;
  fteSupport: number | null;
  fteTotal: number | null;
  year: number;
  pupilTeacherRatio: number | null;
  pupilAdultRatio: number | null;
}>;

type CaptureSnapshot = {
  parsed_data: ParsedSpreadsheet;
  file_name?: string;
  capture_name?: string;
  created_at?: string;
};

type AssessmentIntelligenceSummary = {
  source: string;
  caveat: string;
  batchCount: number;
  eventCount: number;
  pupilCount: number;
  latestSourceLabel: string | null;
  latestSnapshot: {
    className: string | null;
    subject: string | null;
    assessmentPeriod: string;
    eventCount: number;
    atExpectedPct: number | null;
    greaterDepthPct: number | null;
    needsModerationCount: number;
    levelBreakdown: Record<string, number>;
  } | null;
};

type PupilCharacteristicGroup = {
  count: number;
  combinedAtExpected: number;
  combinedPct: number | null;
};

type CharacteristicDisaggregation = {
  source: string;
  caveat: string;
  groups: Record<string, PupilCharacteristicGroup>;
};

const COHORT_GAP_SUBJECTS: Array<{
  key: CohortGapSubject;
  label: string;
}> = [
  { key: "combinedRwm", label: "Combined RWM+" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "maths", label: "Maths" },
];

function formatCohortPct(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function formatCohortGap(value: number | null | undefined): string {
  if (value === null || value === undefined) return "No complete comparison";
  if (Math.abs(value) < 0.1) return "No material gap";
  return `${value > 0 ? "+" : ""}${value}pp`;
}

function cohortGapTone(comparison: CohortGapComparison): {
  label: string;
  className: string;
} {
  const gap = comparison.combinedGapPp;
  if (comparison.confidence === "unavailable" || gap === null) {
    return {
      label: "Data incomplete",
      className: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    };
  }
  if (comparison.confidence === "limited") {
    return {
      label: "Small cohort",
      className: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
    };
  }
  if (gap >= 12) {
    return {
      label: "Evidence priority",
      className: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100",
    };
  }
  if (gap <= -8) {
    return {
      label: "Cohort strength",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
    };
  }
  return {
    label: "Monitor",
    className: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100",
  };
}

function CohortGapLensPanel({
  lens,
  school,
}: {
  lens?: CohortGapLens | null;
  school: string;
}) {
  if (!lens || lens.comparisons.length === 0) return null;

  const readinessUrl = `/dashboard/ofsted-readiness?school=${encodeURIComponent(school)}&source=trust-assessor&focus=cohort-gaps`;

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/50 p-6 shadow-sm dark:border-blue-500/30 dark:from-card dark:via-blue-950/10 dark:to-indigo-950/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
            <Target size={13} />
            Cohort Gap Lens
          </div>
          <h3 className="mt-3 text-xl font-semibold text-foreground">What explains the headline?</h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Direct pupil-level comparisons show whether FSM, SEND or EAL context is shaping Reading, Writing and Maths outcomes. This is evidence for the conversation, not a judgement about children.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-blue-200 bg-white/80 px-3 py-1 font-semibold text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
              {lens.yearGroupLabel}
              {lens.assessmentPeriod ? ` · ${lens.assessmentPeriod}` : ""}
              {lens.latestYear ? ` · ${lens.latestYear}/${String(lens.latestYear + 1).slice(-2)}` : ""}
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
              {lens.rwmEligiblePupilCount} pupils with complete Reading, Writing and Maths
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 dark:border-slate-700 dark:bg-slate-900/60">
              {lens.assessedPupilCount} pupils in selected cohort import
            </span>
          </div>
        </div>
        <a
          href={readinessUrl}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          <FileText size={15} />
          Send to Ofsted Readiness
        </a>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {lens.comparisons.map((comparison) => {
          const tone = cohortGapTone(comparison);
          const maxWidthPct = Math.max(
            ...COHORT_GAP_SUBJECTS.flatMap((subject) => [
              comparison.groupAttainment[subject.key].pct ?? 0,
              comparison.comparatorAttainment[subject.key].pct ?? 0,
            ]),
            1,
          );

          return (
            <div key={comparison.key} className="rounded-xl border border-border bg-background/90 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-foreground">
                    {comparison.groupLabel} vs {comparison.comparatorLabel}
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {comparison.groupAttainment.combinedRwm.total} complete RWM pupils vs {comparison.comparatorAttainment.combinedRwm.total} complete RWM pupils · {comparison.ofstedArea}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tone.className}`}>
                  {tone.label}
                </span>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">Combined gap</span>
                  <span className={`font-bold ${
                    (comparison.combinedGapPp ?? 0) >= 12
                      ? "text-rose-700 dark:text-rose-300"
                      : (comparison.combinedGapPp ?? 0) <= -8
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground"
                  }`}>
                    {formatCohortGap(comparison.combinedGapPp)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {comparison.narrative}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                  Greater depth across all three subjects:{" "}
                  {formatCohortPct(comparison.groupAttainment.combinedRwm.greaterDepthPct)} /{" "}
                  {formatCohortPct(comparison.comparatorAttainment.combinedRwm.greaterDepthPct)}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {COHORT_GAP_SUBJECTS.map((subject) => {
                  const groupPct = comparison.groupAttainment[subject.key].pct;
                  const comparatorPct = comparison.comparatorAttainment[subject.key].pct;
                  return (
                    <div key={subject.key}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">{subject.label}</span>
                        <span className="text-muted-foreground">
                          {formatCohortPct(groupPct)} / {formatCohortPct(comparatorPct)}
                        </span>
                      </div>
                      <div className="mb-1 text-[10px] text-muted-foreground">
                        n={comparison.groupAttainment[subject.key].total} / n={comparison.comparatorAttainment[subject.key].total}
                        {subject.key !== "combinedRwm" && (
                          <>
                            {" · GD "}
                            {formatCohortPct(comparison.groupAttainment[subject.key].greaterDepthPct)} / {formatCohortPct(comparison.comparatorAttainment[subject.key].greaterDepthPct)}
                          </>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-rose-400"
                            style={{ width: groupPct === null ? "0%" : `${Math.max(4, (groupPct / maxWidthPct) * 100)}%` }}
                            title={`${comparison.groupLabel}: ${formatCohortPct(groupPct)}`}
                          />
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-sky-500"
                            style={{ width: comparatorPct === null ? "0%" : `${Math.max(4, (comparatorPct / maxWidthPct) * 100)}%` }}
                            title={`${comparison.comparatorLabel}: ${formatCohortPct(comparatorPct)}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> {comparison.groupLabel}</span>
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> {comparison.comparatorLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-border bg-background/80 px-4 py-3 text-xs text-muted-foreground">
        <div><span className="font-semibold text-foreground">Source:</span> {lens.source}</div>
        <div className="mt-1"><span className="font-semibold text-foreground">Caveat:</span> {lens.caveat}</div>
      </div>
    </div>
  );
}

function EvidenceLevelBadge({ point }: { point: EvidencePoint }) {
  const colour =
    point.canonicalLevel === "greater_depth" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200" :
    point.canonicalLevel === "expected" ? "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-200" :
    point.canonicalLevel === "working_towards" ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200" :
    "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${colour}`}
      title={`${point.sourceLabel} | ${point.sourceTable}`}
    >
      {point.yearGroupLabel} {point.subject.slice(0, 1).toUpperCase()}: {point.levelLabel}
    </span>
  );
}

function buildCharacteristicRisks(disaggregation: CharacteristicDisaggregation | null | undefined) {
  const groups = disaggregation?.groups;
  const all = groups?.all;
  if (!groups || !all || all.combinedPct === null) return [];

  const rows: Array<{
    key: string;
    label: string;
    group: PupilCharacteristicGroup;
    gap: number | null;
    severity: "high" | "medium" | "low" | "positive";
    evidenceId: keyof typeof RESEARCH_CITATIONS;
    action: string;
    ofstedQuestion: string;
  }> = [];

  const candidates = [
    {
      key: "eal",
      label: "EAL",
      evidenceId: "strand-demie-2018" as const,
      action: "Check language-stage data, vocabulary teaching, oral rehearsal and reading access across the cohort.",
      ofstedQuestion: "How do leaders know EAL pupils are accessing the curriculum and catching up over time?",
    },
    {
      key: "send",
      label: "SEND / EHCP",
      evidenceId: "eef-send-2020" as const,
      action: "Review adaptive teaching, targeted intervention, TA deployment and evidence of small-step progress.",
      ofstedQuestion: "How do leaders know SEND provision is ambitious, effective and not masking weak curriculum access?",
    },
    {
      key: "pp",
      label: "Disadvantaged / FSM",
      evidenceId: "eef-pupil-premium-2024" as const,
      action: "Check the Pupil Premium strategy against diagnosed barriers, intervention attendance and impact evidence.",
      ofstedQuestion: "What are leaders doing to close the disadvantaged gap, and how do they know it is working?",
    },
  ];

  for (const candidate of candidates) {
    const group = groups[candidate.key];
    if (!group || group.count === 0 || group.combinedPct === null) continue;
    const gap = Math.round((group.combinedPct - all.combinedPct) * 10) / 10;
    rows.push({
      ...candidate,
      group,
      gap,
      severity: gap <= -15 ? "high" : gap <= -8 ? "medium" : gap >= 8 ? "positive" : "low",
    });
  }

  return rows.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2, positive: 3 };
    return order[a.severity] - order[b.severity];
  });
}

function PrimaryOfstedBridgeCard({
  school,
  disaggregation,
  timeline,
  assessmentIntelligence,
}: {
  school: string;
  disaggregation?: CharacteristicDisaggregation | null;
  timeline?: UnifiedEvidenceTimeline | null;
  assessmentIntelligence?: AssessmentIntelligenceSummary | null;
}) {
  const risks = buildCharacteristicRisks(disaggregation);
  const all = disaggregation?.groups?.all;
  const hasPupilLayer = Boolean(disaggregation?.groups || timeline?.evidencePoints || assessmentIntelligence?.eventCount);
  const urgentCount = risks.filter((risk) => risk.severity === "high").length + (timeline?.priorityPupilCount ?? timeline?.priorityPupils.length ?? 0);
  const sourceSummary = [
    disaggregation?.groups ? "pupil profile groups" : null,
    timeline?.evidencePoints ? `${timeline.evidencePoints} evidence points` : null,
    assessmentIntelligence?.eventCount ? `${assessmentIntelligence.eventCount} teacher-locked judgements` : null,
  ].filter(Boolean).join(" · ");

  const readinessUrl = `/dashboard/ofsted-readiness?school=${encodeURIComponent(school)}&source=trust-assessor`;
  const tasksUrl = `/dashboard/tasks?school=${encodeURIComponent(school)}&source=trust-assessor`;

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-6 dark:border-indigo-500/30 dark:from-indigo-950/20 dark:via-card dark:to-sky-950/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200">
            <Target size={13} />
            Primary cohort → Ofsted readiness
          </div>
          <h3 className="mt-3 text-xl font-semibold text-foreground">What this pupil data means for inspection readiness</h3>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Trust Assessor identifies the cohort pattern; Ofsted Readiness should hold the evidence, actions and follow-up trail.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-border bg-background/80 px-3 py-2">
            <div className="text-lg font-bold text-foreground">{all?.count ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground">profile pupils</div>
          </div>
          <div className="rounded-xl border border-border bg-background/80 px-3 py-2">
            <div className="text-lg font-bold text-foreground">{all?.combinedPct !== null && all?.combinedPct !== undefined ? `${all.combinedPct}%` : "—"}</div>
            <div className="text-[10px] text-muted-foreground">combined RWM+</div>
          </div>
          <div className="rounded-xl border border-border bg-background/80 px-3 py-2">
            <div className={`text-lg font-bold ${urgentCount > 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"}`}>{urgentCount}</div>
            <div className="text-[10px] text-muted-foreground">review signals</div>
          </div>
        </div>
      </div>

      {!hasPupilLayer ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Connect CTF/MIS pupil records or teacher-locked assessment snapshots to unlock SEND/FSM/EAL cohort analysis, evidence trails and Ofsted-ready actions.
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {risks.length > 0 ? risks.map((risk) => {
              const citation = RESEARCH_CITATIONS[risk.evidenceId];
              return (
                <div key={risk.key} className="rounded-xl border border-border bg-background/85 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{risk.label} cohort</div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {risk.group.count} pupils · {risk.group.combinedPct}% combined RWM+
                        {risk.gap !== null ? ` · ${risk.gap > 0 ? "+" : ""}${risk.gap}pp vs all pupils` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      risk.severity === "high" ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200" :
                      risk.severity === "medium" ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200" :
                      risk.severity === "positive" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200" :
                      "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    }`}>
                      {risk.severity === "high" ? "Priority" : risk.severity === "medium" ? "Probe" : risk.severity === "positive" ? "Strength" : "Monitor"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-2">
                    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Ofsted question:</span> {risk.ofstedQuestion}
                    </div>
                    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Suggested action:</span> {risk.action}
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                    <span className="font-semibold">Research basis:</span> {citation.authors} ({citation.year}) — {citation.keyFinding}
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-xl border border-border bg-background/85 p-4 text-sm text-muted-foreground">
                Pupil group data is connected. No material SEND/FSM/EAL combined RWM+ gap is currently flagged, but leaders should still evidence how they check access, attendance and intervention impact.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-background/85 p-4">
            <h4 className="text-sm font-semibold text-foreground">Bridge workflow</h4>
            <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">1</span>
                <span>Use this panel to identify which cohort/group needs probing.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">2</span>
                <span>Open Ofsted Readiness to attach evidence: books, policy, intervention plan, pupil voice and monitoring notes.</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white">3</span>
                <span>Create a task for the owner and check the next assessment snapshot for impact.</span>
              </li>
            </ol>
            <div className="mt-4 flex flex-col gap-2">
              <a href={readinessUrl} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">
                <FileText size={15} />
                Open Ofsted Readiness
              </a>
              <a href={tasksUrl} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent">
                <CheckCircle2 size={15} />
                Create / view actions
              </a>
            </div>
            {sourceSummary && (
              <div className="mt-4 rounded-lg border border-border bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Using:</span> {sourceSummary}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EvidencePriorityPupilRow({ pupil }: { pupil: PupilEvidenceTimeline }) {
  const flags = [
    pupil.demographics.isSend && "SEND",
    pupil.demographics.isFsm && "FSM",
    pupil.demographics.isEal && "EAL",
  ].filter(Boolean) as string[];
  const latestPoints = [...pupil.points].slice(-6);
  const statusClass = pupil.latestStatus === "urgent"
    ? "bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-200"
    : "bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-200";

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">{pupil.pupilId}</h4>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusClass}`}>
              {pupil.latestStatus === "urgent" ? "Urgent review" : "Watch"}
            </span>
            {flags.map((flag) => (
              <span key={flag} className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {flag}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Trend: {pupil.trend}. Evidence points: {pupil.points.length}. Demographic source: {pupil.demographics.source ?? "joined evidence sources"}.
          </p>
        </div>
        <span className="rounded-full border border-border bg-muted/20 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          Priority score {pupil.priorityScore}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {latestPoints.map((point) => <EvidenceLevelBadge key={point.id} point={point} />)}
      </div>
      <div className="mt-3 space-y-1.5">
        {pupil.supportSignals.slice(0, 3).map((signal, index) => (
          <div key={`${pupil.pupilId}-signal-${index}`} className="flex gap-2 text-xs text-muted-foreground">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>{signal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvidenceTimelineCard({ timeline }: { timeline: UnifiedEvidenceTimeline | null }) {
  if (!timeline || timeline.evidencePoints === 0) return null;

  const chartRows = timeline.aggregateSeries.map((row) => ({
    ...row,
    label: row.label.replace("Imported assessment ", ""),
  }));

  return (
    <HideableCard componentId="unified-evidence-timeline">
      <div className="mt-6 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-200 mb-3">
              <Layers size={13} />
              Unified evidence spine
            </div>
            <h3 className="text-xl font-semibold text-foreground">Pupil evidence timeline</h3>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              A joined view of CTF/imported pupil evidence and teacher-locked Schoolgle snapshots. Every level below carries its date, source and validation tier.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
              <div className="text-lg font-bold text-foreground">{timeline.pupilsAnalysed}</div>
              <div className="text-[10px] text-muted-foreground">core evidence pupils</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
              <div className="text-lg font-bold text-foreground">{timeline.evidencePoints}</div>
              <div className="text-[10px] text-muted-foreground">evidence points</div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
              <div className="text-lg font-bold text-foreground">{timeline.priorityPupilCount ?? timeline.priorityPupils.length}</div>
              <div className="text-[10px] text-muted-foreground">flagged pupils</div>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <div><span className="font-semibold text-foreground">Source:</span> {timeline.source}</div>
          <div className="mt-1"><span className="font-semibold text-foreground">Caveat:</span> {timeline.caveat}</div>
          <div className="mt-1"><span className="font-semibold text-foreground">Priority logic:</span> deterministic score from latest below-expected results, drops over time, teacher moderation flags and contextual FSM/SEND indicators. No AI is used to calculate these pupil flags.</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(timeline.sourceCounts).map(([source, count]) => (
              <span key={source} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {source.replace("_", " ")}: {count}
              </span>
            ))}
          </div>
        </div>

        {chartRows.length > 0 && (
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-foreground">Assessment levels over time</h4>
              <p className="text-xs text-muted-foreground">
                Percentage at expected+ by source/date. Hover each point to see the quoted source label.
              </p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartRows} margin={{ top: 10, right: 24, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} interval={0} angle={-12} textAnchor="end" height={56} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value, name) => [value === null ? "No data" : `${value}%`, name]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload;
                    return row ? `${row.label} | ${row.sourceLabel}` : "";
                  }}
                  contentStyle={{ fontSize: "12px", borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="reading" name="Reading expected+" stroke={SUBJECT_COLORS.reading} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="writing" name="Writing expected+" stroke={SUBJECT_COLORS.writing} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="maths" name="Maths expected+" stroke={SUBJECT_COLORS.maths} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <h4 className="mb-1 text-sm font-semibold text-foreground">Why these pupils are shown</h4>
            <p className="mb-3 text-xs text-muted-foreground">
              Showing the top {Math.min(timeline.priorityPupils.length, 6)} of {timeline.priorityPupilCount ?? timeline.priorityPupils.length} flagged pupils. The full pseudonymised register remains available below.
            </p>
            {timeline.priorityPupils.length > 0 ? (
              <div className="space-y-3">
                {timeline.priorityPupils.slice(0, 6).map((pupil) => <EvidencePriorityPupilRow key={pupil.pupilId} pupil={pupil} />)}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                No declining, below-expected or teacher-flagged pupils found in the joined evidence spine.
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <h4 className="text-sm font-semibold text-foreground">Evidence-based next questions</h4>
            <div className="mt-3 space-y-3">
              {timeline.researchNotes.map((note) => (
                <div key={note.label} className="rounded-xl border border-border bg-background p-3">
                  <div className="text-xs font-semibold text-foreground">{note.label}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{note.note}</p>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">{note.source}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </HideableCard>
  );
}

function SchoolTab({ school, parsed, dfeData, staffingSnapshots, summaryData, authToken, organizationId, capturesByPeriod, urnToOrgId, showCapturesPanel = true, pupilRecords = [], spotlightPupilId = null, defendNumbersData = null, currentProfileDisaggregation = null, assessmentIntelligence = null, unifiedEvidenceTimeline = null, kpiLoading, kpiError, laBenchmarks, demographicCohort, schoolKpiData, urnValidation, kpiSchoolName, audience = "trust" }: { school: string; parsed: ParsedSpreadsheet; dfeData?: DfEData | null; staffingSnapshots?: StaffingByUrn | null; summaryData?: SchoolDataSummary | null; authToken?: string; organizationId?: string; capturesByPeriod?: Partial<Record<'autumn_term' | 'mid_year', CaptureSnapshot | null>>; urnToOrgId?: Record<number, string>; showCapturesPanel?: boolean; pupilRecords?: { pupilId: string; demographics: { isFsm: boolean; isSend: boolean; isEal: boolean; gender: string }; journey: { year: number; yearGroup: number; subject: string; level: string }[] }[]; spotlightPupilId?: string | null; defendNumbersData?: Record<string, any> | null; currentProfileDisaggregation?: { source: string; caveat: string; groups: Record<string, { count: number; combinedAtExpected: number; combinedPct: number | null }> } | null; assessmentIntelligence?: AssessmentIntelligenceSummary | null; unifiedEvidenceTimeline?: UnifiedEvidenceTimeline | null; kpiLoading?: boolean; kpiError?: string | null; laBenchmarks?: LaBenchmarkData | null; demographicCohort?: DemographicCohort | null; schoolKpiData?: SchoolKpiData | null; urnValidation?: UrnValidationResult | null; kpiSchoolName?: string | null; audience?: OverviewAudience }) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const schoolData = parsed.data[school] ?? {};
  const info = abbrevLookup[school];
  const selfReportLabels: SelfReportLabels = {
    autumn_term: capturesByPeriod?.autumn_term?.capture_name ?? capturesByPeriod?.autumn_term?.file_name ?? 'Autumn self-report',
    mid_year: capturesByPeriod?.mid_year?.capture_name ?? capturesByPeriod?.mid_year?.file_name ?? 'Mid-Year self-report',
  };
  const groupLabel = audience === "local_authority" ? "local authority" : "trust";
  const groupLabelTitle = audience === "local_authority" ? "Local authority" : "Trust";

  // ── Section A: Profile stats ──
  let totalPupils = 0;
  let totalFsm = 0;
  let totalSend = 0;
  let totalEhcp = 0;
  for (const yg of YEAR_GROUPS) {
    const d = schoolData[yg];
    if (!d) continue;
    if (d.cohort.number_in_cohort !== null) totalPupils += d.cohort.number_in_cohort;
    if (d.cohort.number_fsm !== null) totalFsm += d.cohort.number_fsm;
    if (d.cohort.number_send !== null) totalSend += d.cohort.number_send;
    if (d.cohort.ehcp !== null) totalEhcp += d.cohort.ehcp;
  }
  const fsmPct = totalPupils > 0 ? Math.round((totalFsm / totalPupils) * 1000) / 10 : null;
  const sendPct = totalPupils > 0 ? Math.round((totalSend / totalPupils) * 1000) / 10 : null;

  // Trust averages for comparison
  let trustTotalPupils = 0;
  let trustTotalFsm = 0;
  let trustTotalSend = 0;
  for (const s of parsed.schools) {
    for (const yg of YEAR_GROUPS) {
      const d = parsed.data[s]?.[yg];
      if (!d) continue;
      if (d.cohort.number_in_cohort !== null) trustTotalPupils += d.cohort.number_in_cohort;
      if (d.cohort.number_fsm !== null) trustTotalFsm += d.cohort.number_fsm;
      if (d.cohort.number_send !== null) trustTotalSend += d.cohort.number_send;
    }
  }
  const trustFsmPct = trustTotalPupils > 0 ? (trustTotalFsm / trustTotalPupils) * 100 : null;
  const trustSendPct = trustTotalPupils > 0 ? (trustTotalSend / trustTotalPupils) * 100 : null;

  // ── Insight computations ──
  const schoolUrn = abbrevLookup[school]?.urn ?? null;
  const latestDfeCensus = schoolUrn !== null
    ? [...(dfeData?.census ?? [])]
        .filter((row) => row.urn === schoolUrn)
        .sort((a, b) => b.academicYearEnd - a.academicYearEnd)[0] ?? null
    : null;
  const dfeFsmPct = latestDfeCensus?.fsmPct ?? null;
  const dfeSendPct = latestDfeCensus?.senPct ?? null;
  const dfeEalPct = latestDfeCensus?.ealPct ?? null;
  const schoolDemographicContext = {
    fsmPct: fsmPct ?? dfeFsmPct ?? 0,
    sendPct: sendPct ?? dfeSendPct ?? 0,
    ealPct: dfeEalPct ?? 0,
  };
  const nationalPercentile = schoolUrn !== null ? (dfeData?.nationalPercentiles?.[schoolUrn] ?? null) : null;
  const threeYearAvg = schoolUrn !== null ? (dfeData?.threeYearAverages?.[schoolUrn] ?? null) : null;
  const y6Combined = schoolData["Year 6"]?.all_pupils.c_are ?? null;
  const latestDfeKs2Combined = schoolUrn !== null
    ? [...(dfeData?.ks2Results ?? [])]
        .filter((row) =>
          row.urn === schoolUrn &&
          row.subject === "Reading, writing and maths" &&
          row.breakdownTopic === "All pupils" &&
          row.breakdown === "Total" &&
          row.expectedStandardPct !== null,
        )
        .sort((a, b) => b.academicYearEnd - a.academicYearEnd)[0] ?? null
    : null;
  const statAlerts = detectStatisticalImpossibilities(school, schoolData);

  // ── Subject filter state for bar charts ──
  const [barChartSubject, setBarChartSubject] = useState<"combined" | "reading" | "writing" | "maths">("combined");

  // ── Staffing ratio computations ──
  const staffingRow = schoolUrn !== null ? (staffingSnapshots?.[schoolUrn] ?? null) : null;
  const staffingRatios = staffingRow
    ? computeStaffingRatios({
        numberOfPupils: staffingRow.numberOfPupils,
        fteTeachers: staffingRow.fteTeachers,
        fteTotal: staffingRow.fteTotal,
        fteTeachingAssistants: staffingRow.fteTA,
      })
    : null;
  // Trust average P/T ratio across all schools that have staffing data
  const trustPtrValues = staffingSnapshots
    ? Object.values(staffingSnapshots)
        .map((s) => s.pupilTeacherRatio)
        .filter((v): v is number => v !== null)
    : [];
  const trustAvgPtr =
    trustPtrValues.length > 0
      ? Math.round((trustPtrValues.reduce((a, b) => a + b, 0) / trustPtrValues.length) * 10) / 10
      : null;
  const staffingVerdict = assessStaffing(
    staffingRatios?.pupilTeacherRatio ?? null,
    'primary',
    threeYearAvg?.averagePct ?? null,
  );

  // Ordinal suffix helper
  const ordinal = (n: number): string => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // ── Section B: Radar chart (Y6 data) ──
  const y6 = schoolData["Year 6"];
  const radarData = y6
    ? [
        { subject: "Reading", school: y6.all_pupils.r_are ?? 0, trust: 0 },
        { subject: "Writing", school: y6.all_pupils.w_are ?? 0, trust: 0 },
        { subject: "Maths", school: y6.all_pupils.m_are ?? 0, trust: 0 },
        { subject: "Combined", school: y6.all_pupils.c_are ?? 0, trust: 0 },
      ]
    : [];

  // Compute trust averages for radar
  if (radarData.length > 0) {
    const sums = { r: 0, w: 0, m: 0, c: 0 };
    let counts = { r: 0, w: 0, m: 0, c: 0 };
    for (const s of parsed.schools) {
      const sy6 = parsed.data[s]?.["Year 6"];
      if (!sy6) continue;
      if (sy6.all_pupils.r_are !== null && sy6.all_pupils.r_are !== undefined) { sums.r += sy6.all_pupils.r_are; counts.r++; }
      if (sy6.all_pupils.w_are !== null && sy6.all_pupils.w_are !== undefined) { sums.w += sy6.all_pupils.w_are; counts.w++; }
      if (sy6.all_pupils.m_are !== null && sy6.all_pupils.m_are !== undefined) { sums.m += sy6.all_pupils.m_are; counts.m++; }
      if (sy6.all_pupils.c_are !== null && sy6.all_pupils.c_are !== undefined) { sums.c += sy6.all_pupils.c_are; counts.c++; }
    }
    radarData[0].trust = counts.r > 0 ? Math.round(sums.r / counts.r) : 0;
    radarData[1].trust = counts.w > 0 ? Math.round(sums.w / counts.w) : 0;
    radarData[2].trust = counts.m > 0 ? Math.round(sums.m / counts.m) : 0;
    radarData[3].trust = counts.c > 0 ? Math.round(sums.c / counts.c) : 0;
  }

  // ── Section C: Year-group progression area chart ──
  const progressionData = HEATMAP_YEAR_GROUPS.map((yg) => {
    const d = schoolData[yg];
    return {
      yg: yg.replace("Year ", "Y"),
      reading: d?.all_pupils.r_are ?? null,
      writing: d?.all_pupils.w_are ?? null,
      maths: d?.all_pupils.m_are ?? null,
      combined: d?.all_pupils.c_are ?? null,
    };
  });

  // Pipeline jump alerts
  const pipelineAlerts: string[] = [];
  for (let i = 1; i < HEATMAP_YEAR_GROUPS.length; i++) {
    const prev = schoolData[HEATMAP_YEAR_GROUPS[i - 1]]?.all_pupils.c_are ?? null;
    const curr = schoolData[HEATMAP_YEAR_GROUPS[i]]?.all_pupils.c_are ?? null;
    if (prev !== null && curr !== null && Math.abs(curr - prev) > 15) {
      const direction = curr > prev ? 'rises' : 'falls';
      const change = Math.abs(Math.round(curr - prev));
      pipelineAlerts.push(
        `${HEATMAP_YEAR_GROUPS[i - 1].replace("Year ", "Y")} → ${HEATMAP_YEAR_GROUPS[i].replace("Year ", "Y")}: Combined ${direction} from ${prev}% to ${curr}% (${curr > prev ? "+" : "-"}${change}pp)`
      );
    }
  }

  // ── Section D: Greater Depth bar chart ──
  const gdData = HEATMAP_YEAR_GROUPS.map((yg) => {
    const d = schoolData[yg];
    return {
      yg: yg.replace("Year ", "Y"),
      "Reading GD": d?.all_pupils.r_gd ?? null,
      "Writing GD": d?.all_pupils.w_gd ?? null,
      "Maths GD": d?.all_pupils.m_gd ?? null,
    };
  });

  const zeroGdWritingYgs = HEATMAP_YEAR_GROUPS.filter((yg) => {
    const d = schoolData[yg];
    return d && d.all_pupils.w_gd === 0;
  });

  // ── Section E: FSM gap grouped bar chart ──
  const hasFsmData = HEATMAP_YEAR_GROUPS.some((yg) => {
    const d = schoolData[yg];
    return d && (Object.values(d.fsm6).some((v) => v !== null) || Object.values(d.not_fsm6).some((v) => v !== null));
  });

  const fsmGapData = HEATMAP_YEAR_GROUPS.map((yg) => {
    const d = schoolData[yg];
    return {
      yg: yg.replace("Year ", "Y"),
      "FSM6 Combined": d?.fsm6.c_are ?? null,
      "Non-FSM Combined": d?.not_fsm6.c_are ?? null,
      gap: d?.fsm6.c_are !== null && d?.fsm6.c_are !== undefined && d?.not_fsm6.c_are !== null && d?.not_fsm6.c_are !== undefined
        ? Math.round((d.not_fsm6.c_are as number) - (d.fsm6.c_are as number))
        : null,
    };
  });

  // ── Section F: School-specific quality flags ──
  const schoolFlags = parsed.qualityFlags.filter((f) => f.school === school);
  // Missing year groups
  const missingYgs = YEAR_GROUPS.filter((yg) => !schoolData[yg]);
  // Zero GD across multiple year groups
  const zeroGdW = HEATMAP_YEAR_GROUPS.filter((yg) => schoolData[yg]?.all_pupils.w_gd === 0);

  // ── Section G: Key questions ──
  const questions: { q: string; level: "red" | "amber" | "blue" }[] = [];

  if (y6 && y6.all_pupils.c_are !== null && y6.all_pupils.c_are !== undefined && y6.all_pupils.c_are < 50) {
    questions.push({ q: `Y6 Combined at ${y6.all_pupils.c_are}% — what interventions are in place for this year group?`, level: "red" });
  }
  if (zeroGdWritingYgs.length >= 3) {
    questions.push({ q: `Zero Greater Depth in Writing across ${zeroGdWritingYgs.length} year groups — is challenge sufficient for higher-attaining pupils?`, level: "red" });
  } else if (zeroGdWritingYgs.length >= 1) {
    questions.push({ q: `Zero Greater Depth in Writing in ${zeroGdWritingYgs.map((yg) => yg.replace("Year ", "Y")).join(", ")} — what does writing moderation show?`, level: "amber" });
  }
  for (const alert of pipelineAlerts) {
    questions.push({ q: `${alert} — what explains this shift between year groups?`, level: "amber" });
  }
  if (fsmPct !== null && trustFsmPct !== null && fsmPct > trustFsmPct + 5) {
    questions.push({ q: `FSM at ${fsmPct}% (${groupLabel} average ${Math.round(trustFsmPct)}%) — how is Pupil Premium funding targeted?`, level: "amber" });
  }
  const y1 = schoolData["Year 1"];
  if (y1 && y1.all_pupils.phonics !== null && y1.all_pupils.phonics !== undefined && y1.all_pupils.phonics < 70) {
    questions.push({ q: `Y1 Phonics at ${y1.all_pupils.phonics}% — below national average (79%). What phonics programme is in use?`, level: "red" });
  }
  if (questions.length === 0) {
    questions.push({ q: "No specific concerns flagged for this school based on the submitted data.", level: "blue" });
  }

  // ── Generate Report Modal ──
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIncludeAppendix, setReportIncludeAppendix] = useState(false);
  const [reportConfidential, setReportConfidential] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportShareToken, setReportShareToken] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    setReportGenerating(true);
    setReportError(null);
    setReportShareToken(null);

    // Build context data for the AI
    let trustTotalP = 0, trustTotalF = 0;
    for (const s of parsed.schools) {
      for (const yg of YEAR_GROUPS) {
        const d = parsed.data[s]?.[yg];
        if (!d) continue;
        if (d.cohort.number_in_cohort !== null) trustTotalP += d.cohort.number_in_cohort;
        if (d.cohort.number_fsm !== null) trustTotalF += d.cohort.number_fsm;
      }
    }
    const trustFsmPctForReport = trustTotalP > 0 ? Math.round((trustTotalF / trustTotalP) * 1000) / 10 : null;

    const reportPayload = {
      schoolAbbrev: school,
      schoolData: {
        schoolName: abbrevLookup[school]?.name ?? school,
        y6Combined: schoolData["Year 6"]?.all_pupils.c_are ?? null,
        nationalPercentile: null,
        nationalRank: null,
        threeYearAverage: null,
        fsmPct,
        sendPct,
        trustFsmPct: trustFsmPctForReport,
        totalPupils,
        dataQualityAlerts: statAlerts.map((a) => ({
          severity: a.severity,
          title: a.title,
          explanation: a.explanation,
        })),
        academicYear: "2025/26",
        // Include year-group-level summary for AI context
        yearGroups: Object.fromEntries(
          YEAR_GROUPS.map((yg) => {
            const d = schoolData[yg];
            if (!d) return [yg, null];
            return [yg, {
              cohort: d.cohort.number_in_cohort,
              fsm: d.cohort.number_fsm,
              send: d.cohort.number_send,
              reading: d.all_pupils.r_are,
              writing: d.all_pupils.w_are,
              maths: d.all_pupils.m_are,
              combined: d.all_pupils.c_are,
              gd_reading: d.all_pupils.r_gd,
              gd_writing: d.all_pupils.w_gd,
              gd_maths: d.all_pupils.m_gd,
            }];
          }).filter(([, v]) => v !== null)
        ),
      },
      format: 'html',
      options: {
        includeDataAppendix: reportIncludeAppendix,
        confidential: reportConfidential,
      },
    };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch('/api/trust-assessor/generate-report', {
        method: 'POST',
        headers,
        body: JSON.stringify(reportPayload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? `Server error ${res.status}`);
      }

      const html: string = json.html ?? json.data?.html;
      const token: string = json.shareToken ?? json.data?.shareToken;

      if (!html) throw new Error('No HTML returned from server');

      setReportShareToken(token ?? null);

      // Open in new tab
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Also set up download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${school}-governor-report-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      setShowReportModal(false);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Unknown error generating report');
    } finally {
      setReportGenerating(false);
    }
  };

  // ── AI Narrative ──
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const narrativeRequestedRef = useRef(false);

  // ── Cohort Passport state ──
  const [cohortPassport, setCohortPassport] = useState<CohortPassportData | null>(null);
  const [cohortPassportLoading, setCohortPassportLoading] = useState(false);
  const cohortPassportFetchedRef = useRef(false);

  useEffect(() => {
    if (cohortPassportFetchedRef.current || !info?.urn) return;
    cohortPassportFetchedRef.current = true;
    setCohortPassportLoading(true);
    fetch(
      `/api/trust-analysis/cohort-passport?urn=${info.urn}`,
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cohorts) setCohortPassport(data as CohortPassportData);
      })
      .catch(() => {})
      .finally(() => setCohortPassportLoading(false));
  }, [info?.urn, authToken]);

  // ── Timeline state ──
  const [timelineEvents, setTimelineEvents] = useState<SchoolEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const eventsEmittedRef = useRef(false);

  // Emit Trust Assessor events and fetch timeline on mount
  useEffect(() => {
    if (eventsEmittedRef.current || !school || !info) return;
    eventsEmittedRef.current = true;

    const run = async () => {
      // Compute forensic verdict for event emission
      const ygMap: Record<string, YearGroupShort> = {
        'Year 1': 'Y1', 'Year 2': 'Y2', 'Year 3': 'Y3',
        'Year 4': 'Y4', 'Year 5': 'Y5', 'Year 6': 'Y6',
      };
      const yearAnalysisForEmit = HEATMAP_YEAR_GROUPS.map((yg) => {
        const reported = schoolData[yg]?.all_pupils.c_are ?? null;
        const ygShort = ygMap[yg];
        if (!ygShort) return null;
        const expected = demographicExpectation(schoolDemographicContext, ygShort, 'combined');
        const classification = classifyAttainment(reported, expected);
        return { classification };
      }).filter(Boolean) as { classification: { verdict: 'accurate' | 'over-reported' | 'under-reported' | 'no-data'; severity: 'low' | 'medium' | 'high'; gap: number } }[];

      const rawVerdict = computeForensicVerdict(yearAnalysisForEmit.map((y) => y.classification));
      const severityFromColor: Record<string, 'strong' | 'secure' | 'attention' | 'urgent'> = {
        green: 'strong', blue: 'secure', amber: 'attention', red: 'urgent',
      };

      // Compute KPIs for emit
      const kpiYearDataLocal: Record<string, { r?: number; w?: number; m?: number; c?: number } | undefined> = {};
      for (const yg of YEAR_GROUPS) {
        const d = schoolData[yg]?.all_pupils;
        if (d) {
          kpiYearDataLocal[yg] = {
            r: d.r_are ?? undefined,
            w: d.w_are ?? undefined,
            m: d.m_are ?? undefined,
            c: d.c_are ?? undefined,
          };
        }
      }
      const kpisForEmit = evaluateResearchKpis(schoolDemographicContext, kpiYearDataLocal);

      // EAL trajectory concern — only when DfE census has an EAL percentage.
      const ealConcern = (dfeEalPct ?? 0) > 30 && (() => {
        const trajectory = getEalTrajectory(
          schoolDemographicContext.ealPct,
          schoolDemographicContext.fsmPct,
          schoolDemographicContext.sendPct,
          'combined',
        );
        const y1Rep = schoolData['Year 1']?.all_pupils.c_are ?? null;
        const y6Rep = schoolData['Year 6']?.all_pupils.c_are ?? null;
        const slope = y6Rep !== null && y1Rep !== null ? y6Rep - y1Rep : null;
        return slope !== null && slope < -5;
      })();

      // Cohort mismatch: check for large jumps in cohort sizes
      const cohortSizes = HEATMAP_YEAR_GROUPS.map((yg) => schoolData[yg]?.cohort.number_in_cohort ?? null).filter((v): v is number => v !== null);
      const cohortMismatch = cohortSizes.length >= 3 && cohortSizes.some((v, i) => {
        if (i === 0) return false;
        const prev = cohortSizes[i - 1];
        return Math.abs(v - prev) > 10;
      });

      if (!organizationId || info.urn === null) return; // Can't emit without org scope or a validated URN
      await emitTrustAssessorEvents({
        organizationId,
        school,
        schoolName: info.name,
        schoolUrn: info.urn,
        nationalPercentile: nationalPercentile
          ? { pct: nationalPercentile.pct, percentile: nationalPercentile.percentile, rank: nationalPercentile.rank, totalSchools: nationalPercentile.totalSchools }
          : null,
        threeYearAverage: threeYearAvg
          ? { averagePct: threeYearAvg.averagePct, yearsUsed: threeYearAvg.yearsUsed }
          : null,
        y6Combined: y6Combined,
        statAlerts,
        forensicVerdict: { severity: severityFromColor[rawVerdict.color] ?? 'secure', summary: rawVerdict.interpretation },
        researchKpis: kpisForEmit.map((k) => ({
          id: k.id,
          name: k.name,
          passed: k.passed,
          actual: k.actual,
          target: k.target,
          explanation: k.explanation,
          citationId: k.citationId,
        })),
        ealTrajectoryConcern: ealConcern,
        cohortMismatchDetected: cohortMismatch,
        authToken,
      });

      // Fetch timeline events for this school
      setTimelineLoading(true);
      try {
        // Fetch both trust-assessor (forensic findings) and system (DfE history) events
        const res = await fetch(
          `/api/events?organizationId=${organizationId}&school_urn=${info.urn}&limit=30`,
          authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}
        );
        if (res.ok) {
          const data = await res.json();
          setTimelineEvents(data.events ?? []);
        }
      } catch {
        // non-fatal
      } finally {
        setTimelineLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school]);

  // Generate AI narrative when the data payload is fully loaded.
  // We key off a signature derived from the current + autumn payloads, so if
  // captures load async *after* this component mounts, we regenerate instead
  // of locking in a stale narrative built from the Mid-Year data alone.
  // Cache in sessionStorage keyed by that same signature so repeat visits
  // (hard refresh, school switch, tab re-open) skip the LLM call entirely.
  useEffect(() => {
    if (!school) return;
    const hasAutumn = !!capturesByPeriod?.autumn_term?.parsed_data?.data?.[school];
    const hasMidYear = !!capturesByPeriod?.mid_year?.parsed_data?.data?.[school];
    // Wait for at least ONE capture to be confirmed loaded before firing the
    // narrative — otherwise we cache a version that's missing the delta story.
    if (!hasAutumn && !hasMidYear) return;

    // Build Autumn comparison payload if both captures exist.
    const autumnYearGroups: Record<string, unknown> = {};
    if (capturesByPeriod?.autumn_term?.parsed_data?.data?.[school]) {
      const autumnSchool = capturesByPeriod.autumn_term.parsed_data.data[school];
      for (const yg of YEAR_GROUPS) {
        const d = autumnSchool[yg];
        if (!d) continue;
        autumnYearGroups[yg] = {
          cohort: d.cohort.number_in_cohort,
          fsm: d.cohort.number_fsm,
          reading: d.all_pupils.r_are,
          writing: d.all_pupils.w_are,
          maths: d.all_pupils.m_are,
          combined: d.all_pupils.c_are,
          gd_writing: d.all_pupils.w_gd,
        };
      }
    }

    // Compute per-year-group deltas between Autumn and current (Mid-Year).
    const midVsAutumnDeltas: Array<{ yg: string; autumn: number; midYear: number; delta: number; subject: string }> = [];
    if (Object.keys(autumnYearGroups).length > 0) {
      for (const yg of YEAR_GROUPS) {
        const mid = schoolData[yg];
        const aut = autumnYearGroups[yg] as { combined?: number | null } | undefined;
        if (!mid || !aut) continue;
        const midC = mid.all_pupils.c_are ?? null;
        const autC = aut.combined ?? null;
        if (midC !== null && autC !== null && Math.abs(midC - autC) >= 5) {
          midVsAutumnDeltas.push({ yg, autumn: autC, midYear: midC, delta: Math.round((midC - autC) * 10) / 10, subject: 'Combined' });
        }
      }
    }

    const schoolMetrics: Record<string, unknown> = {
      school,
      totalPupils,
      fsmPct,
      sendPct,
      ehcpCount: totalEhcp,
      trustFsmAvg: trustFsmPct ? Math.round(trustFsmPct) : null,
      yearGroups: {} as Record<string, unknown>,
      // NEW: both captures + movement signal for the AI narrative.
      autumnSelfReport: Object.keys(autumnYearGroups).length > 0 ? autumnYearGroups : null,
      midYearSelfReport: true, // the yearGroups field above is always mid-year (latest capture)
      captureDeltas: midVsAutumnDeltas,
      captureDeltaSummary: midVsAutumnDeltas.length > 0
        ? `Between Autumn 2025/26 and Mid-Year 2025/26 self-reports, ${midVsAutumnDeltas.length} year group(s) moved ≥5pp. ${midVsAutumnDeltas.map(d => `${d.yg} Combined ${d.autumn}% → ${d.midYear}% (${d.delta >= 0 ? '+' : ''}${d.delta}pp)`).join('; ')}. These are both school self-reports, not DfE-validated — the narrative should call out any jump >10pp and ask the head to explain what changed in teaching, assessment, or cohort.`
        : null,
    };

    for (const yg of YEAR_GROUPS) {
      const d = schoolData[yg];
      if (!d) continue;
      (schoolMetrics.yearGroups as Record<string, unknown>)[yg] = {
        cohort: d.cohort.number_in_cohort,
        fsm: d.cohort.number_fsm,
        send: d.cohort.number_send,
        reading: d.all_pupils.r_are,
        writing: d.all_pupils.w_are,
        maths: d.all_pupils.m_are,
        combined: d.all_pupils.c_are,
        gd_reading: d.all_pupils.r_gd,
        gd_writing: d.all_pupils.w_gd,
        gd_maths: d.all_pupils.m_gd,
        phonics: d.all_pupils.phonics,
        mtc: d.all_pupils.mtc,
        gld: d.all_pupils.gld,
      };
    }

    // Build a stable signature of the payload — if this hasn't changed since last
    // generation, serve the cached narrative and skip the LLM call entirely.
    const cacheSignature = JSON.stringify([
      school,
      schoolMetrics.yearGroups,
      schoolMetrics.autumnSelfReport,
      totalPupils,
      fsmPct,
      sendPct,
    ]);
    const cacheKey = `trust-assessor:narrative:${school}`;

    const generateNarrative = async () => {
      setNarrativeLoading(true);
      try {
        // Cache hit?
        if (typeof window !== 'undefined') {
          const cached = window.sessionStorage.getItem(cacheKey);
          if (cached) {
            try {
              const parsed = JSON.parse(cached) as { signature: string; narrative: string };
              if (parsed.signature === cacheSignature && parsed.narrative) {
                setAiNarrative(parsed.narrative);
                setNarrativeLoading(false);
                return;
              }
            } catch { /* ignore corrupt cache */ }
          }
        }

        const res = await fetch('/api/trust-assessor/narrative', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
          body: JSON.stringify({
            type: 'school',
            schoolAbbrev: school,
            data: schoolMetrics,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.narrative ?? json.data?.narrative;
          if (text) {
            setAiNarrative(text);
            if (typeof window !== 'undefined') {
              try {
                window.sessionStorage.setItem(cacheKey, JSON.stringify({ signature: cacheSignature, narrative: text }));
              } catch { /* quota exceeded — ignore */ }
            }
          }
        }
      } catch {
        // Non-fatal — fall back to deterministic narrative
      } finally {
        setNarrativeLoading(false);
      }
    };

    generateNarrative();
    // When captures load or change, the cacheSignature changes too — if we
    // already have a matching cached narrative, we'll serve it instantly;
    // if not, we regenerate with the proper Autumn + Mid-Year comparison.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school, capturesByPeriod?.autumn_term?.file_name, capturesByPeriod?.mid_year?.file_name]);

  // ── Deterministic narrative fallback ──
  const narrativePoints: string[] = [];

  // Autumn vs Mid-Year self-report movement (the forensic signal).
  // This is a pure guard that also supplies the prose if the AI narrative fails.
  if (capturesByPeriod?.autumn_term?.parsed_data?.data?.[school] && y6) {
    const autumnY6 = capturesByPeriod.autumn_term.parsed_data.data[school]["Year 6"];
    const autumnC = autumnY6?.all_pupils?.c_are ?? null;
    const midC = y6.all_pupils.c_are ?? null;
    if (autumnC !== null && midC !== null) {
      const delta = Math.round((midC - autumnC) * 10) / 10;
      if (Math.abs(delta) >= 15) {
        narrativePoints.push(`Y6 Combined moved ${delta > 0 ? '+' : ''}${delta}pp between Autumn (${autumnC}%) and Mid-Year (${midC}%) self-reports. This is a very large single-term movement — both figures are teacher-assessed and not DfE-moderated. Ask the head to explain what has changed in teaching, intervention, or assessment standard between the two captures before accepting the Mid-Year figure at face value.`);
      } else if (Math.abs(delta) >= 10) {
        narrativePoints.push(`Y6 Combined moved ${delta > 0 ? '+' : ''}${delta}pp between Autumn (${autumnC}%) and Mid-Year (${midC}%) self-reports — a notable shift worth probing. Both captures are school self-reported, so the trajectory is the useful signal. What interventions or re-assessments drove this movement?`);
      } else if (Math.abs(delta) >= 5) {
        narrativePoints.push(`Y6 Combined moved ${delta > 0 ? '+' : ''}${delta}pp between Autumn (${autumnC}%) and Mid-Year (${midC}%) self-reports. Plausible as a term's progress, but validate with a moderated writing sample or a reading-comprehension check.`);
      }
    }
  }

  // FSM context
  if (fsmPct !== null && trustFsmPct !== null) {
    if (fsmPct > trustFsmPct + 10) {
      narrativePoints.push(`${school} has significantly higher disadvantage than the ${groupLabel} average (${fsmPct}% FSM vs ${Math.round(trustFsmPct)}% ${groupLabel} average). This context is critical — national data shows a strong correlation between FSM% and attainment. Any comparison with lower-FSM schools must account for this.`);
    } else if (fsmPct < trustFsmPct - 10) {
      narrativePoints.push(`${school} has lower disadvantage than the ${groupLabel} average (${fsmPct}% FSM vs ${Math.round(trustFsmPct)}% ${groupLabel} average). This school should be expected to perform above the ${groupLabel} average given its more favourable intake.`);
    }
  }

  // Y6 performance
  if (y6) {
    const c = y6.all_pupils.c_are;
    const r = y6.all_pupils.r_are;
    const w = y6.all_pupils.w_are;
    const m = y6.all_pupils.m_are;
    if (c !== null && c !== undefined) {
      if (c >= 70) {
        narrativePoints.push(`Y6 Combined at ${c}% is strong. ${fsmPct !== null && fsmPct > 30 ? `This is particularly notable given ${fsmPct}% of pupils are FSM-eligible — the school appears to be closing the disadvantage gap effectively.` : 'This is above the national average of ~61%.'}`);
      } else if (c >= 50) {
        narrativePoints.push(`Y6 Combined at ${c}% is broadly in line with expectations but below the national average (~61%). ${w !== null && w !== undefined && w < (r ?? 100) - 15 ? `Writing at ${w}% is significantly below Reading (${r}%) — this subject gap is dragging Combined down.` : ''}`);
      } else {
        narrativePoints.push(`Y6 Combined at ${c}% is well below the national average (~61%). This cohort is at serious risk of underperforming at KS2 SATs. ${w !== null && w !== undefined && m !== null && m !== undefined ? `The weakest subject is ${w < m ? `Writing (${w}%)` : `Maths (${m}%)`}.` : ''} Immediate intervention is needed.`);
      }
    }
  }

  // GD Writing
  if (zeroGdWritingYgs.length >= 3) {
    narrativePoints.push(`Greater Depth in Writing is reported as 0% across ${zeroGdWritingYgs.length} year groups. This is unusual and raises questions about either the challenge provided to higher-attaining pupils or the consistency of teacher assessment. If no pupils across multiple year groups are reaching Greater Depth, the school should review its writing curriculum and moderation practices.`);
  }

  // Pipeline — with actual cohort demographic analysis
  if (pipelineAlerts.length > 0) {
    // For each pipeline alert, check if cohort demographics explain the jump
    const alertsWithContext: string[] = [];
    for (const yg of YEAR_GROUPS) {
      const ygIdx = YEAR_GROUPS.indexOf(yg);
      if (ygIdx <= 0) continue;
      const prevYg = YEAR_GROUPS[ygIdx - 1];
      const curr = schoolData[yg];
      const prev = schoolData[prevYg];
      if (!curr || !prev) continue;
      const currC = curr.all_pupils.c_are;
      const prevC = prev.all_pupils.c_are;
      if (currC == null || prevC == null) continue;
      const jump = currC - prevC;
      if (Math.abs(jump) < 15) continue;

      // Check cohort demographics
      const currFsm = curr.cohort.number_fsm;
      const currN = curr.cohort.number_in_cohort;
      const prevFsm = prev.cohort.number_fsm;
      const prevN = prev.cohort.number_in_cohort;
      const currSend = curr.cohort.number_send;
      const prevSend = prev.cohort.number_send;

      const currFsmPctYg = currN && currFsm ? Math.round(100 * currFsm / currN) : null;
      const prevFsmPctYg = prevN && prevFsm ? Math.round(100 * prevFsm / prevN) : null;
      const currSendPctYg = currN && currSend ? Math.round(100 * currSend / currN) : null;
      const prevSendPctYg = prevN && prevSend ? Math.round(100 * prevSend / prevN) : null;

      let explanation = `${prevYg.replace("Year ", "Y")} → ${yg.replace("Year ", "Y")}: Combined ${jump > 0 ? 'rises' : 'drops'} from ${prevC}% to ${currC}% (${jump > 0 ? '+' : ''}${jump}pp). `;

      // Check if FSM difference explains it
      if (currFsmPctYg !== null && prevFsmPctYg !== null) {
        const fsmDiff = currFsmPctYg - prevFsmPctYg;
        if (Math.abs(fsmDiff) > 10) {
          explanation += `FSM changes significantly: ${prevYg.replace("Year ", "Y")} has ${prevFsmPctYg}% FSM vs ${yg.replace("Year ", "Y")} has ${currFsmPctYg}% FSM — this ${fsmDiff > 0 ? 'higher disadvantage' : 'lower disadvantage'} ${jump < 0 ? 'may partly explain the drop' : 'makes the improvement more significant'}. `;
        } else {
          explanation += `FSM is similar (${prevFsmPctYg}% vs ${currFsmPctYg}%) — disadvantage does not explain this shift. `;
        }
      }

      // Check if SEND difference explains it
      if (currSendPctYg !== null && prevSendPctYg !== null) {
        const sendDiff = currSendPctYg - prevSendPctYg;
        if (Math.abs(sendDiff) > 10) {
          explanation += `SEND: ${yg.replace("Year ", "Y")} has ${currSendPctYg}% SEND vs ${prevSendPctYg}% in ${prevYg.replace("Year ", "Y")} — this ${sendDiff > 0 ? 'higher SEND proportion may explain weaker outcomes' : 'lower SEND proportion should support better outcomes'}. `;
        } else {
          explanation += `SEND is similar (${prevSendPctYg}% vs ${currSendPctYg}%). `;
        }
      }

      // If neither explains it
      if (currFsmPctYg !== null && prevFsmPctYg !== null && currSendPctYg !== null && prevSendPctYg !== null) {
        const fsmDiff = Math.abs(currFsmPctYg - prevFsmPctYg);
        const sendDiff = Math.abs(currSendPctYg - prevSendPctYg);
        if (fsmDiff <= 10 && sendDiff <= 10) {
          explanation += `Neither FSM nor SEND composition explains this shift — assessment consistency between year groups should be reviewed.`;
        }
      }

      alertsWithContext.push(explanation);
    }

    if (alertsWithContext.length > 0) {
      narrativePoints.push(...alertsWithContext);
    }
  }

  // Small cohort
  if (totalPupils < 100) {
    narrativePoints.push(`With only ${totalPupils} pupils across all year groups, percentage figures are statistically volatile. Each pupil represents approximately ${(100 / Math.max(totalPupils / 7, 1)).toFixed(0)}pp per year group. Small swings in individual pupil performance will cause large percentage movements — interpret with caution.`);
  }

  // High SEND
  if (sendPct !== null && sendPct > 20) {
    narrativePoints.push(`${sendPct}% of pupils have identified SEND needs. This is above the national average (~12.6%). Attainment data should be interpreted in this context — a school with high SEND may legitimately have lower headline percentages while still providing effective provision for its cohort.`);
  }

  // FSM high but performing well
  if (fsmPct !== null && fsmPct > 35 && y6 && y6.all_pupils.c_are !== null && y6.all_pupils.c_are !== undefined && y6.all_pupils.c_are >= 60) {
    narrativePoints.push(`Despite ${fsmPct}% FSM eligibility, Y6 Combined is at ${y6.all_pupils.c_are}%. This is a positive indicator that the school's Pupil Premium strategy may be effective. This is worth investigating further — what is this school doing that others in the ${groupLabel} could learn from?`);
  }

  // ── BUILD 1: At-a-glance summary computations ──
  const severityVerdict: 'strong' | 'secure' | 'attention' | 'urgent' =
    statAlerts.length > 0 || (y6Combined !== null && y6Combined < 50) ? 'urgent'
      : y6Combined !== null && y6Combined < 61 ? 'attention'
        : y6Combined !== null && y6Combined >= 70 ? 'strong'
          : nationalPercentile
            ? nationalPercentile.percentile > 75 ? 'strong'
              : nationalPercentile.percentile > 50 ? 'secure'
                : nationalPercentile.percentile > 25 ? 'attention'
                  : 'urgent'
            : 'secure';

  const topFindings: { text: string; severity: 'high' | 'medium' | 'low' }[] = [];
  const addTopFinding = (finding: { text: string; severity: 'high' | 'medium' | 'low' }) => {
    if (!topFindings.some((item) => item.text === finding.text)) topFindings.push(finding);
  };

  if (y6Combined !== null) {
    addTopFinding({
      text: y6Combined < 50
        ? `Y6 Combined is ${y6Combined}% in the selected mid-year 2025/26 capture, so governors should ask which pupils are at risk of not securing Reading, Writing and Maths together.`
        : y6Combined < 61
          ? `Y6 Combined is ${y6Combined}% in the selected mid-year 2025/26 capture, below the current national reference point used in this product, so the school needs a clear acceleration plan.`
          : `Y6 Combined is ${y6Combined}% in the selected mid-year 2025/26 capture; governors should check whether this is supported by moderation evidence.`,
      severity: y6Combined < 50 ? 'high' : y6Combined < 61 ? 'medium' : 'low',
    });
  }

  if (y6?.all_pupils) {
    const subjectRows = [
      { label: "Reading", value: y6.all_pupils.r_are },
      { label: "Writing", value: y6.all_pupils.w_are },
      { label: "Maths", value: y6.all_pupils.m_are },
    ].filter((row): row is { label: string; value: number } => row.value !== null && row.value !== undefined);
    if (subjectRows.length > 0) {
      const weakest = [...subjectRows].sort((a, b) => a.value - b.value)[0];
      const strongest = [...subjectRows].sort((a, b) => b.value - a.value)[0];
      addTopFinding({
        text: `${weakest.label} is the weakest Y6 subject at ${weakest.value}%${strongest.value - weakest.value >= 10 ? `, ${strongest.value - weakest.value}pp behind ${strongest.label}` : ""}. This is the first subject line to test with books, moderation and pupil-level evidence.`,
        severity: weakest.value < 50 ? 'high' : weakest.value < 60 ? 'medium' : 'low',
      });
    }
  }

  if (nationalPercentile) {
    if (nationalPercentile.percentile < 25) {
      addTopFinding({
        text: `Ranked ${ordinal(nationalPercentile.percentile)} nationally - below ${100 - nationalPercentile.percentile}% of England schools.`,
        severity: 'high',
      });
    } else if (nationalPercentile.percentile > 75) {
      addTopFinding({
        text: `Ranked ${ordinal(nationalPercentile.percentile)} nationally - above ${nationalPercentile.percentile}% of England schools.`,
        severity: 'low',
      });
    }
  }
  if (statAlerts.length > 0) {
    addTopFinding({
      text: `${statAlerts.length} data quality alert${statAlerts.length === 1 ? '' : 's'} detected: ${statAlerts[0].title}.`,
      severity: 'high',
    });
  }
  if (threeYearAvg && y6Combined !== null && y6Combined !== undefined) {
    const gap = y6Combined - threeYearAvg.averagePct;
    if (Math.abs(gap) > 10) {
      addTopFinding({
        text: `Y6 mid-year prediction is ${gap > 0 ? '+' : ''}${gap}pp vs 3-year DfE average - ${gap > 0 ? 'optimistic, needs moderation evidence' : 'pessimistic, possibly conservative assessment'}.`,
        severity: 'medium',
      });
    }
  }
  if (fsmPct !== null && fsmPct > 40) {
    addTopFinding({
      text: `High disadvantage cohort (${fsmPct}% FSM) - context must be factored into all attainment comparisons.`,
      severity: 'low',
    });
  }
  if (sendPct !== null && sendPct > 20) {
    addTopFinding({
      text: `SEND context is high at ${sendPct}% across submitted cohorts; attainment needs to be read alongside provision quality, access arrangements and pupil-level progress.`,
      severity: 'low',
    });
  }
  if (pipelineAlerts.length > 0) {
    addTopFinding({
      text: `There are ${pipelineAlerts.length} year-group transition concern${pipelineAlerts.length === 1 ? "" : "s"} where adjacent cohorts show a large combined-outcome shift; governors should ask what explains the movement.`,
      severity: 'medium',
    });
  }
  if (!nationalPercentile) {
    addTopFinding({
      text: 'National percentile is not available for this URN in the loaded DfE comparator table yet; this is a data coverage gap, not a school judgement.',
      severity: 'medium',
    });
  }
  if (!threeYearAvg) {
    addTopFinding({
      text: 'Three-year DfE KS2 average is not available for this URN yet, so the overview is relying on the submitted mid-year capture and in-school forensic checks.',
      severity: 'medium',
    });
  }
  while (topFindings.length < 3) {
    addTopFinding({
      text: 'Use the FSM6 gap snapshot and cohort charts below to test whether the headline result is driven by disadvantage, SEND, EAL, assessment accuracy or a whole-cohort curriculum issue.',
      severity: 'low',
    });
  }

  const whatToDoNext = severityVerdict === 'urgent'
    ? 'Review the DfE Review, Cohort & Gaps and Pupil Data tabs with leaders. Check moderation evidence for the low subject lines, then create actions for the risks everyone agrees are real.'
    : severityVerdict === 'attention'
    ? 'Walk through the findings with your leadership team. Target the specific year groups flagged. Use Schoolgle continuous assessment to prevent drift.'
    : severityVerdict === 'secure'
    ? 'Sustain current practice. Use the pupil-level data to identify pupils still below expected standard and deploy targeted support.'
    : `Share the findings as good practice across the ${groupLabel}. Investigate what this school is doing differently that others can learn from.`;

  // ── URN for edit storage ──
  const editStorageUrn = info?.urn ?? school;

  // ── Forensic verdict render helper ──
  const renderForensicVerdict = () => {
    const ygMap: Record<string, YearGroupShort> = {
      'Year 1': 'Y1', 'Year 2': 'Y2', 'Year 3': 'Y3',
      'Year 4': 'Y4', 'Year 5': 'Y5', 'Year 6': 'Y6',
    };

    const yearAnalysis = HEATMAP_YEAR_GROUPS.map((yg) => {
      const reported = schoolData[yg]?.all_pupils.c_are ?? null;
      const ygShort = ygMap[yg];
      if (!ygShort) return null;
      const expected = demographicExpectation(schoolDemographicContext, ygShort, 'combined');
      const classification = classifyAttainment(reported, expected);
      return { yearGroup: yg, ygShort, reported, expected, classification };
    }).filter(Boolean) as {
      yearGroup: string;
      ygShort: YearGroupShort;
      reported: number | null;
      expected: { expected: number; low: number; high: number; baseline: number; adjustments: { factor: string; pp: number }[] };
      classification: { verdict: 'accurate' | 'over-reported' | 'under-reported' | 'no-data'; severity: 'low' | 'medium' | 'high'; gap: number };
    }[];

    const verdict = computeForensicVerdict(yearAnalysis.map((y) => y.classification));
    const verdictBorderCls = verdict.color === 'red' ? 'border-l-red-500' : verdict.color === 'amber' ? 'border-l-amber-500' : verdict.color === 'green' ? 'border-l-emerald-500' : 'border-l-sky-500';
    const verdictBgCls = verdict.color === 'red' ? 'bg-red-50/50' : verdict.color === 'amber' ? 'bg-amber-50/50' : verdict.color === 'green' ? 'bg-emerald-50/50' : 'bg-sky-50/50';
    const verdictTextCls = verdict.color === 'red' ? 'text-red-800' : verdict.color === 'amber' ? 'text-amber-800' : verdict.color === 'green' ? 'text-emerald-800' : 'text-sky-800';
    const verdictBadgeCls = verdict.color === 'red' ? 'bg-red-100 text-red-700 border-red-300' : verdict.color === 'amber' ? 'bg-amber-100 text-amber-700 border-amber-300' : verdict.color === 'green' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-sky-100 text-sky-700 border-sky-300';

    const gapBadgeCls = (gap: number, v: string) => {
      if (v === 'accurate') return 'bg-emerald-100 text-emerald-700';
      if (v === 'over-reported') return gap > 10 ? 'bg-red-200 text-red-800 font-bold' : 'bg-amber-100 text-amber-700';
      if (v === 'under-reported') return gap < -10 ? 'bg-red-200 text-red-800 font-bold' : 'bg-sky-100 text-sky-700';
      return 'bg-muted text-muted-foreground';
    };

    const gapIcon = (v: string) => v === 'accurate' ? '✓' : v === 'over-reported' ? '↑' : v === 'under-reported' ? '↓' : '—';

    const y6Pred = demographicExpectation(schoolDemographicContext, 'Y6', 'combined');
    const y6Reported = schoolData['Year 6']?.all_pupils.c_are ?? null;
    let demographicSentence = `Given this school's ${schoolDemographicContext.ealPct.toFixed(0)}% EAL, ${schoolDemographicContext.fsmPct.toFixed(0)}% FSM, ${schoolDemographicContext.sendPct.toFixed(0)}% SEND profile, national data predicts Y6 Combined around ${y6Pred.low}–${y6Pred.high}%.`;
    if (y6Reported !== null) {
      if (y6Reported > y6Pred.high + 10) demographicSentence += ` The school reports ${y6Reported}% — significantly above prediction, suggesting possible over-assessment.`;
      else if (y6Reported < y6Pred.low - 10) demographicSentence += ` The school reports ${y6Reported}% — dramatically below prediction, possibly indicating genuine struggle beyond demographics.`;
      else if (y6Reported >= y6Pred.low && y6Reported <= y6Pred.high) demographicSentence += ` The school reports ${y6Reported}% — within the expected range. Assessment appears proportionate.`;
      else if (y6Reported > y6Pred.high) demographicSentence += ` The school reports ${y6Reported}% — slightly above prediction, consistent with mild over-reporting or genuine improvement.`;
      else demographicSentence += ` The school reports ${y6Reported}% — slightly below prediction, consistent with cautious assessment.`;
    }

    return (
      <div className={`bg-card border border-border rounded-2xl p-8 border-l-4 ${verdictBorderCls}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${verdictBadgeCls}`}>{verdict.label}</span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Demographic forensic verdict</span>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Forensic review</h3>
        <p className={`text-sm leading-relaxed mb-6 ${verdictTextCls}`}>{verdict.interpretation}</p>
        {yearAnalysis.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
            {yearAnalysis.map((ya) => (
              <div key={ya.yearGroup} className={`rounded-xl border p-3 text-center ${verdictBgCls}`}>
                <div className="text-[10px] font-bold text-muted-foreground mb-1">{ya.ygShort}</div>
                <div className="text-sm font-bold text-foreground">{ya.reported !== null ? `${ya.reported}%` : '—'}</div>
                <div className="text-[9px] text-muted-foreground/60 mb-1">exp {ya.expected.low}–{ya.expected.high}%</div>
                <div className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${gapBadgeCls(ya.classification.gap, ya.classification.verdict)}`}>
                  {gapIcon(ya.classification.verdict)}{' '}
                  {ya.classification.verdict !== 'no-data' ? `${ya.classification.gap > 0 ? '+' : ''}${Math.round(ya.classification.gap)}pp` : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className={`text-sm p-4 rounded-xl border leading-relaxed ${verdictBgCls} ${verdictTextCls}`}>{demographicSentence}</div>
        <p className="mt-3 text-xs text-muted-foreground/60">Expected range based on DfE 2022/23 national statistics + EEF disadvantage gap data. ±5pp confidence band. ↑ = over-reported. ↓ = under-reported. ✓ = within expected range.</p>
      </div>
    );
  };

  // ── Research KPIs render helper ──
  const renderResearchKpis = () => {
    const kpiYearData: Record<string, { r?: number; w?: number; m?: number; c?: number } | undefined> = {};
    for (const yg of YEAR_GROUPS) {
      const d = schoolData[yg]?.all_pupils;
      if (d) kpiYearData[yg] = { r: d.r_are ?? undefined, w: d.w_are ?? undefined, m: d.m_are ?? undefined, c: d.c_are ?? undefined };
    }
    const kpis = evaluateResearchKpis(schoolDemographicContext, kpiYearData);

    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-foreground mb-1">Research-backed KPIs</h3>
        <p className="text-sm text-muted-foreground mb-6">Expectations published in peer-reviewed research and official DfE/EEF statistics — not our opinion.</p>
        {kpis.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Insufficient data. Year 5/6 Combined data required.</p>
        ) : (
          <div className="space-y-3">
            {kpis.map((kpi) => (
              <div key={kpi.id} className={`rounded-xl border-l-4 p-4 ${kpi.passed === true ? 'border-l-emerald-500 bg-emerald-50/40' : kpi.passed === false ? 'border-l-red-500 bg-red-50/40' : 'border-l-border bg-muted/20'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-foreground">{kpi.name}</span>
                      {kpi.passed === true && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-600 text-white font-semibold">PASS</span>}
                      {kpi.passed === false && <span className="text-xs px-2 py-0.5 rounded-full bg-red-600 text-white font-semibold">FAIL</span>}
                      {kpi.passed === null && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">NO DATA</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                      <div><span className="text-muted-foreground">Research target:</span><span className="ml-1 font-medium text-foreground">{kpi.target}</span></div>
                      <div><span className="text-muted-foreground">School actual:</span><span className="ml-1 font-semibold text-foreground">{kpi.actual ?? '—'}</span></div>
                    </div>
                    <div className="text-xs text-foreground/70">{kpi.explanation}</div>
                    <div className="mt-1.5 text-[10px] text-muted-foreground/60 italic" title={citationFull(kpi.citationId)}>{citationFull(kpi.citationId)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Research factors render helper ──
  const renderResearchFactors = () => {
    const latestCombinedKs2 = schoolUrn !== null
      ? [...(dfeData?.ks2Results ?? [])]
          .filter((row) =>
            row.urn === schoolUrn &&
            row.subject === "Reading, writing and maths" &&
            row.breakdownTopic === "All pupils" &&
            row.expectedStandardPct !== null,
          )
          .sort((a, b) => b.academicYearEnd - a.academicYearEnd)[0] ?? null
      : null;
    const latestKs2 = latestCombinedKs2?.expectedStandardPct ?? y6Combined;
    const ks2SourceLabel = latestCombinedKs2
      ? `DfE KS2 ${latestCombinedKs2.academicYearEnd - 1}/${String(latestCombinedKs2.academicYearEnd).slice(-2)}`
      : "submitted mid-year capture";

    interface ResearchFactor { id: string; name: string; finding: string; citation: string; status: 'ok' | 'concern' | 'pending'; statusLabel: string }
    const factors: ResearchFactor[] = [];

    factors.push({
      id: 'fsm-gap',
      name: 'FSM attainment context',
      finding: `${school} has ${schoolDemographicContext.fsmPct.toFixed(0)}% FSM in the selected context (${fsmPct !== null ? "school-submitted capture" : "DfE census"}). ${latestKs2 !== null ? `${ks2SourceLabel} combined RWM+ is ${latestKs2}%.` : "No combined attainment figure is available yet."} Use this to ask whether pupil-premium activity is linked to the specific gaps shown elsewhere in this report.`,
      citation: 'EEF Pupil Premium Guide',
      status: latestKs2 === null ? 'pending' : schoolDemographicContext.fsmPct >= 35 ? 'concern' : 'ok',
      statusLabel: latestKs2 === null ? 'Pending attainment' : schoolDemographicContext.fsmPct >= 35 ? 'High context' : 'Context checked',
    });
    factors.push({
      id: 'send-gap',
      name: 'SEND attainment context',
      finding: `${school} has ${schoolDemographicContext.sendPct.toFixed(0)}% SEND in the selected context (${sendPct !== null ? "school-submitted capture" : "DfE census"}). This should trigger a provision-quality and individual-progress conversation, not a blanket excuse for weak outcomes.`,
      citation: 'EEF Special Educational Needs in Mainstream Schools',
      status: schoolDemographicContext.sendPct >= 18 ? 'concern' : 'ok',
      statusLabel: schoolDemographicContext.sendPct >= 18 ? 'High context' : 'Context checked',
    });

    if (dfeEalPct !== null && dfeEalPct > 30) {
      const y1c = schoolData['Year 1']?.all_pupils.c_are ?? null;
      const y6c = schoolData['Year 6']?.all_pupils.c_are ?? null;
      const gain = y6c !== null && y1c !== null ? y6c - y1c : null;
      factors.push({
        id: 'eal-trajectory',
        name: 'EAL context',
        finding: gain !== null ? `DfE census records ${dfeEalPct.toFixed(0)}% EAL. The submitted all-pupil combined line changes ${gain >= 0 ? '+' : ''}${gain}pp from Y1 to Y6; this is a cohort comparison, not the same pupils followed over time. Use pupil-level MIS/CTF data before making an EAL attainment claim.` : `DfE census records ${dfeEalPct.toFixed(0)}% EAL. This is context only; the trust spreadsheet does not contain EAL/non-EAL attainment splits.`,
        citation: 'DfE census; EAL evidence should be validated through pupil-level MIS/CTF where available',
        status: 'pending',
        statusLabel: 'Needs pupil-level validation',
      });
    }

    const statusConfig = { ok: { dot: 'bg-emerald-500', label: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, concern: { dot: 'bg-amber-500', label: 'bg-amber-50 text-amber-700 border-amber-200' }, pending: { dot: 'bg-muted-foreground/30', label: 'bg-muted text-muted-foreground border-border' } };

    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-foreground mb-1">Research factors checked</h3>
        <p className="text-sm text-muted-foreground mb-6">Each factor uses labelled Schoolgle data sources. Context explains pressure; it does not replace evidence of impact.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {factors.map((factor) => {
            const cfg = statusConfig[factor.status];
            return (
              <div key={factor.id} className={`rounded-xl border p-4 ${factor.status === 'concern' ? 'bg-amber-50/30 border-amber-200' : factor.status === 'pending' ? 'bg-muted/20 border-border' : 'bg-emerald-50/30 border-emerald-200'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${cfg.dot}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{factor.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${cfg.label}`}>{factor.statusLabel}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{factor.finding}</p>
                    <p className="mt-1.5 text-[10px] text-muted-foreground/60 italic">Source: {factor.citation}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── EAL Trajectory render helper ──
  const renderEalTrajectory = () => {
    if (dfeEalPct === null || dfeEalPct <= 30) return null;

    const trajectory = getEalTrajectory(dfeEalPct, schoolDemographicContext.fsmPct, schoolDemographicContext.sendPct, 'combined');
    const chartData = trajectory.map((t, idx) => {
      const spreadsheetYg = HEATMAP_YEAR_GROUPS[idx];
      const reported = spreadsheetYg ? (schoolData[spreadsheetYg]?.all_pupils.c_are ?? null) : null;
      return { yearGroup: t.yearGroup, expected: t.expected, expectedLow: t.low, expectedHigh: t.high, reported };
    });

    const reportedValues = chartData.map((d) => d.reported).filter((v): v is number => v !== null);
    const y1Rep = chartData[0]?.reported;
    const y6Rep = chartData[5]?.reported;
    let diagnostic = '';
    let diagnosticCls = 'border-l-sky-400 bg-sky-50/40 text-sky-800';

    if (reportedValues.length >= 4) {
      const slope = y6Rep !== null && y1Rep !== null ? y6Rep - y1Rep : null;
      if (slope !== null && slope < -5) { diagnostic = 'Significant concern: Attainment is falling across year groups in a high-EAL school. This is opposite to the expected pattern — suggests over-assessment at Y1 OR cumulative curriculum gaps.'; diagnosticCls = 'border-l-red-500 bg-red-50/40 text-red-800'; }
      else if (slope !== null && Math.abs(slope) <= 5) { diagnostic = 'Warning: Attainment is not rising despite high EAL. Either language support is insufficient OR assessment is not recognising improving proficiency.'; diagnosticCls = 'border-l-amber-500 bg-amber-50/40 text-amber-800'; }
      else { diagnostic = "This school's cohorts are tracking to the expected EAL language development curve — a sign of effective EAL support."; diagnosticCls = 'border-l-sky-400 bg-sky-50/40 text-sky-800'; }
    } else {
      diagnostic = 'Not enough year group data to determine EAL trajectory pattern. Upload a complete spreadsheet for full analysis.';
      diagnosticCls = 'border-l-border bg-muted/20 text-muted-foreground';
    }

    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-foreground mb-1">EAL context check — {dfeEalPct.toFixed(0)}% EAL</h3>
        <p className="text-sm text-muted-foreground mb-6">DfE census gives the school-level EAL context. The plotted submitted line is all pupils by year group, so treat it as a prompt for questions, not an EAL attainment gap. Pupil-level MIS/CTF data is required for a true EAL vs non-EAL analysis.</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="yearGroup" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(val, name) => [`${val}%`, name === 'expected' ? 'Expected (demographic)' : 'Reported']} contentStyle={{ fontSize: '12px', borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', padding: '8px 12px' }} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} formatter={(value) => value === 'expected' ? 'Expected (demographic model)' : 'Reported (mid-year)'} />
            <Line type="monotone" dataKey="expected" name="expected" stroke="#0891b2" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#0891b2', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} />
            <Line type="monotone" dataKey="reported" name="reported" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }} connectNulls />
            <ReferenceLine y={65} stroke="#D1D5DB" strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
        <div className={`mt-4 border-l-4 px-4 py-3 rounded-r-xl text-sm ${diagnosticCls}`}>{diagnostic}</div>
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Research basis:</span>
          {(['strand-demie-2018', 'naldic-2020', 'demie-2023'] as const).map((id) => (
            <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-medium cursor-help" title={citationFull(id)}>{citationShort(id)}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <EditModeProvider orgId={organizationId ?? "local"} urn={editStorageUrn}>
      {/* Generate Governor Report Modal — rendered at top level so it's always accessible */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Generate Governor Report</h3>
                  <p className="text-xs text-gray-500">{school} &mdash; {abbrevLookup[school]?.name ?? school}</p>
                </div>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="report-template">Template</label>
                <select id="report-template" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" defaultValue="governor-board">
                  <option value="governor-board">Governor Board Report</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">4-page A4 report with executive summary, cohort chart, recommendations, and governor questions.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="report-appendix" checked={reportIncludeAppendix} onChange={(e) => setReportIncludeAppendix(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="report-appendix" className="text-sm text-gray-700">Include data appendix</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="report-confidential" checked={reportConfidential} onChange={(e) => setReportConfidential(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="report-confidential" className="text-sm text-gray-700">Add confidentiality watermark</label>
                </div>
              </div>
            </div>
            {reportError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-xs text-red-700">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{reportError}</span>
              </div>
            )}
            {reportShareToken && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4 text-xs text-emerald-700">
                <CheckCircle2 size={14} />
                <span>Report generated. Share token: <span className="font-mono font-semibold">{reportShareToken}</span></span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" disabled={reportGenerating}>Cancel</button>
              <button onClick={handleGenerateReport} disabled={reportGenerating} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {reportGenerating ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-white animate-spin" />Generating... (~15s)</>
                ) : (
                  <><Download size={16} />Generate Report</>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 text-center">Report opens in a new tab and downloads as an HTML file. Print to PDF from your browser.</p>
          </div>
        </div>
      )}

      {/* Captures for THIS school — each school sees its own list only. */}
      {showCapturesPanel && (
        <SchoolCapturesPanelSlot
          school={school}
          urnToOrgId={urnToOrgId}
          authToken={authToken}
        />
      )}

      <SchoolTabTabs school={school}>
        {(activeTab: SchoolTabId) => (
          <div className="px-0">

            {/* ─────────────────────────────────────────────────────────────────────
                TAB 1: OVERVIEW — governor-ready, minimal, one dominant visual
            ───────────────────────────────────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div className="space-y-10 py-8 px-6">

                {/* Hero row: school identity + verdict + 3 KPIs + Generate Report */}
                <HideableCard componentId="overview-hero">
                  <div className="bg-card border border-border rounded-2xl p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                      <div className="flex items-start gap-4">
                        <SchoolLogoMark school={school} info={info} size="lg" />
                        <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase tracking-wider">{school}</span>
                          <span className="text-xs text-muted-foreground">
                            {totalPupils + (info?.nurseryPupils ?? 0)} pupils
                            {info?.nurseryPupils && info.nurseryPupils > 0 && (
                              <span className="text-blue-600"> ({info.nurseryPupils} nursery)</span>
                            )}
                            {' '}&middot; {fsmPct !== null ? `${fsmPct}%` : '—'} FSM &middot; {dfeEalPct !== null ? `${dfeEalPct}%` : '—'} EAL
                          </span>
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground">{abbrevLookup[school]?.name ?? school}</h2>
                        {info?.urn && <p className="text-sm text-muted-foreground mt-0.5">URN {info.urn}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border-l-4 ${
                          severityVerdict === 'strong' ? 'bg-emerald-50 text-emerald-800 border-l-emerald-500' :
                          severityVerdict === 'secure' ? 'bg-sky-50 text-sky-800 border-l-sky-500' :
                          severityVerdict === 'attention' ? 'bg-amber-50 text-amber-800 border-l-amber-500' :
                          'bg-red-50 text-red-800 border-l-red-500'
                        }`}>
                          {severityVerdict === 'strong' ? 'Strong' : severityVerdict === 'secure' ? 'Secure' : severityVerdict === 'attention' ? 'Needs attention' : 'Urgent review'}
                        </div>
                        <button
                          onClick={() => { setShowReportModal(true); setReportError(null); setReportShareToken(null); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors"
                        >
                          <FileText size={15} />
                          Generate Governor Report
                        </button>
                      </div>
                    </div>

                    {/* 3 KPIs */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground tabular-nums">{y6Combined !== null ? `${y6Combined}%` : '—'}</div>
                        <div className="text-sm text-muted-foreground mt-1">Y6 Combined</div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">mid-year 2025/26</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground tabular-nums">
                          {latestDfeKs2Combined?.expectedStandardPct !== null && latestDfeKs2Combined?.expectedStandardPct !== undefined ? `${latestDfeKs2Combined.expectedStandardPct}%` : '—'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Latest DfE KS2</div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">
                          {latestDfeKs2Combined ? `validated ${formatAcademicYearEnd(latestDfeKs2Combined.academicYearEnd)}` : 'not available for this URN'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground tabular-nums">{threeYearAvg?.averagePct !== undefined && threeYearAvg?.averagePct !== null ? `${threeYearAvg.averagePct}%` : '—'}</div>
                        <div className="text-sm text-muted-foreground mt-1">3-year average</div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">DfE KS2 track record</div>
                      </div>
                    </div>

                    {/* Key takeaways */}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Three things governors should know</div>
                      <ol className="space-y-2.5">
                        {topFindings.slice(0, 3).map((f, i) => (
                          <li key={i} className="flex gap-3 items-start">
                            <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              f.severity === 'high' ? 'bg-red-100 text-red-700' : f.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>{i + 1}</span>
                            <span className="text-sm text-foreground leading-relaxed pt-0.5">{f.text}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* What to do next */}
                    <div className={`mt-6 rounded-xl p-4 text-sm border-l-4 ${
                      severityVerdict === 'urgent' ? 'bg-red-50 border-l-red-500 text-red-900' :
                      severityVerdict === 'attention' ? 'bg-amber-50 border-l-amber-500 text-amber-900' :
                      'bg-emerald-50 border-l-emerald-500 text-emerald-900'
                    }`}>
                      <span className="font-semibold">Recommended next step: </span>
                      {whatToDoNext}
                    </div>
                  </div>
                </HideableCard>

                <HideableCard componentId="overview-fsm-gap-snapshot">
                  <FsmGapSnapshot parsed={parsed} school={school} />
                </HideableCard>

                <HideableCard componentId="overview-primary-ofsted-bridge">
                  <PrimaryOfstedBridgeCard
                    school={school}
                    disaggregation={currentProfileDisaggregation}
                    timeline={unifiedEvidenceTimeline}
                    assessmentIntelligence={assessmentIntelligence}
                  />
                </HideableCard>

                {/* Single dominant chart: cohort line chart Y1–Y6 */}
                {progressionData.some((d) => d.reading !== null || d.writing !== null || d.maths !== null) && (
                  <HideableCard componentId="overview-progression-chart">
                    <div className="bg-card border border-border rounded-2xl p-8">
                      <h3 className="text-xl font-semibold text-foreground mb-1">Attainment across the school</h3>
                      <p className="text-sm text-muted-foreground mb-6">Reading, Writing, and Maths ARE % from Y1 to Y6 — shows whether attainment is consistent or fluctuating as pupils progress</p>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={progressionData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="yg" tick={{ fontSize: 13, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <ReferenceLine y={65} stroke="#D1D5DB" strokeDasharray="4 4" label={{ value: "National 65%", fontSize: 11, fill: "#9CA3AF", position: "right" }} />
                          <Tooltip formatter={(val, name) => [`${val}%`, name]} contentStyle={{ fontSize: "13px", borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", padding: "8px 12px" }} />
                          <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }} />
                          <Line type="monotone" dataKey="reading" name="Reading" stroke={SUBJECT_COLORS.reading} strokeWidth={2.5} dot={{ r: 5, fill: SUBJECT_COLORS.reading, strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }} connectNulls />
                          <Line type="monotone" dataKey="writing" name="Writing" stroke={SUBJECT_COLORS.writing} strokeWidth={2.5} dot={{ r: 5, fill: SUBJECT_COLORS.writing, strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }} connectNulls />
                          <Line type="monotone" dataKey="maths" name="Maths" stroke={SUBJECT_COLORS.maths} strokeWidth={2.5} dot={{ r: 5, fill: SUBJECT_COLORS.maths, strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                      {pipelineAlerts.length > 0 && (
                        <div className="mt-4 space-y-1">
                          {pipelineAlerts.map((alert, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs border-l-4 border-l-amber-500 bg-amber-50/50 text-amber-800 px-3 py-2 rounded-r-lg">
                              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                              <span><span className="font-semibold">Pipeline alert:</span> {alert}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </HideableCard>
                )}

                {/* AI Narrative — collapsed by default, reveal via toggle */}
                <HideableCard componentId="overview-ai-narrative">
                  <OverviewNarrativeCard
                    school={school}
                    aiNarrative={aiNarrative}
                    narrativeLoading={narrativeLoading}
                    narrativePoints={narrativePoints}
                    audience={audience}
                  />
                </HideableCard>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────────
                TAB 2: FORENSIC REVIEW — research verdict + evidence cards
            ───────────────────────────────────────────────────────────────────── */}
            {activeTab === "forensic" && (
              <div className="space-y-10 py-8 px-6">

                {/* Always-visible Tier Legend */}
                <TierLegendBar />

                <UrnValidationWarning validation={urnValidation ?? null} />

                {/* KPI Dashboard — Real DfE-powered intelligence */}
                {kpiLoading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                      <p className="text-sm text-gray-500">Loading school intelligence data...</p>
                    </div>
                  </div>
                )}
                {kpiError && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800">{kpiError}</p>
                  </div>
                )}
                {!kpiLoading && !kpiError && (!laBenchmarks || !schoolKpiData) && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">School Intelligence Dashboard</h4>
                    <p className="text-xs text-slate-500">
                      {!laBenchmarks ? "Waiting for LA benchmark data to load..." : "Waiting for school KPI data to load..."}
                    </p>
                    <div className="mt-3 space-y-1 text-xs text-slate-400">
                      <div className={laBenchmarks ? "text-emerald-600" : "text-amber-600"}>
                        {laBenchmarks ? "✓ LA benchmarks loaded" : "○ LA benchmarks pending"}
                      </div>
                      <div className={schoolKpiData ? "text-emerald-600" : "text-amber-600"}>
                        {schoolKpiData ? "✓ School KPI data loaded" : "○ School KPI data pending"}
                      </div>
                      <div className={(dfeData?.ks2Results?.length ?? 0) > 0 ? "text-emerald-600" : "text-amber-600"}>
                        {(dfeData?.ks2Results?.length ?? 0) > 0 ? `DfE KS2 data loaded (${dfeData?.ks2Results?.length ?? 0} records)` : "DfE KS2 data pending"}
                      </div>
                    </div>
                  </div>
                )}
                {!kpiLoading && laBenchmarks && schoolKpiData && (
                  <KpiDashboard
                    laBenchmarks={laBenchmarks}
                    demographicCohort={demographicCohort}
                    schoolData={schoolKpiData}
                    selectedSchoolName={kpiSchoolName ?? school}
                  />
                )}

                {/* Forensic Verdict — hero of this tab */}
                <HideableCard componentId="forensic-verdict">
                  {renderForensicVerdict()}
                </HideableCard>

                {/* Validation & Credibility — accordion */}
                {(nationalPercentile !== null || threeYearAvg !== null || statAlerts.length > 0) && (
                  <HideableCard componentId="forensic-validation">
                    <ValidationCredibilityCard
                      nationalPercentile={nationalPercentile}
                      threeYearAvg={threeYearAvg}
                      y6Combined={y6Combined}
                      statAlerts={statAlerts}
                      ordinal={ordinal}
                    />
                  </HideableCard>
                )}

                {/* Intra-Year Progression — Autumn → Mid-year → Target */}
                <HideableCard componentId="forensic-intra-year">
                  <IntraYearProgressionSection summary={summaryData ?? null} />
                </HideableCard>

                {/* Pre-meeting verification checklist */}
                <HideableCard componentId="forensic-pre-meeting">
                  <PreMeetingVerification
                    school={school}
                    summary={summaryData ?? null}
                    dfeData={dfeData}
                    parsed={parsed}
                  />
                </HideableCard>

                {/* Research-Backed KPIs */}
                <HideableCard componentId="forensic-kpis">
                  {renderResearchKpis()}
                </HideableCard>

                {/* Staffing Context — pupil-teacher ratio vs national benchmark */}
                <HideableCard componentId="forensic-staffing">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 250 }}
                  >
                    <div className="bg-card border border-border rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 uppercase tracking-wider">Staffing Context</span>
                      </div>
                      <h4 className="text-base font-semibold text-foreground mb-3">Pupil-teacher ratio vs national benchmark</h4>

                      {staffingRatios?.pupilTeacherRatio != null ? (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                            <div className="bg-muted/40 rounded-xl p-4">
                              <div className="text-xs text-muted-foreground mb-1">This school</div>
                              <div className={`text-2xl font-bold ${
                                staffingRatios.pupilTeacherRatio > NATIONAL_P_T_RATIO.primary + 2 ? 'text-sky-600' :
                                staffingRatios.pupilTeacherRatio < NATIONAL_P_T_RATIO.primary - 2 ? 'text-amber-600' : 'text-foreground'
                              }`}>{staffingRatios.pupilTeacherRatio}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">pupils per teacher</div>
                            </div>
                            <div className="bg-muted/40 rounded-xl p-4">
                              <div className="text-xs text-muted-foreground mb-1">{groupLabelTitle} average</div>
                              <div className="text-2xl font-bold text-foreground">{trustAvgPtr ?? '—'}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">across {trustPtrValues.length} schools</div>
                            </div>
                            <div className="bg-muted/40 rounded-xl p-4">
                              <div className="text-xs text-muted-foreground mb-1">National (primary)</div>
                              <div className="text-2xl font-bold text-foreground">{NATIONAL_P_T_RATIO.primary}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">DfE 2024</div>
                            </div>
                          </div>

                          {staffingVerdict.severity !== 'no-data' && staffingVerdict.severity !== 'typical' && (
                            <div className={`rounded-lg border-l-4 p-3 text-sm mb-4 ${
                              staffingVerdict.severity === 'lean-high-performing' ? 'border-l-emerald-500 bg-emerald-500/5' :
                              staffingVerdict.severity === 'lean-underperforming' ? 'border-l-amber-500 bg-amber-500/5' :
                              staffingVerdict.severity === 'well-staffed-high-performing' ? 'border-l-sky-500 bg-sky-500/5' :
                              'border-l-orange-500 bg-orange-500/5'
                            }`}>
                              <div className="font-semibold text-foreground mb-1">{staffingVerdict.label}</div>
                              <div className="text-muted-foreground">{staffingVerdict.governorQuestion}</div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-4">Workforce data not available for this school.</p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="text-muted-foreground">Teachers: <span className="font-medium text-foreground">{staffingRow?.fteTeachers != null ? `${staffingRow.fteTeachers} FTE` : '—'}</span></div>
                        <div className="text-muted-foreground">TAs: <span className="font-medium text-foreground">{staffingRow?.fteTA != null ? `${staffingRow.fteTA} FTE` : '—'}</span></div>
                        <div className="text-muted-foreground">Support: <span className="font-medium text-foreground">{staffingRow?.fteSupport != null ? `${staffingRow.fteSupport} FTE` : '—'}</span></div>
                        <div className="text-muted-foreground">Total: <span className="font-medium text-foreground">{staffingRow?.fteTotal != null ? `${staffingRow.fteTotal} FTE` : '—'}</span></div>
                      </div>

                      <details className="mt-4 group">
                        <summary className="cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 list-none [&::-webkit-details-marker]:hidden">
                          <svg className="w-3 h-3 transition-transform group-open:rotate-90" viewBox="0 0 12 12" fill="currentColor">
                            <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          What this ratio doesn&apos;t tell you
                        </summary>
                        <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                          <p>
                            Pupil-teacher ratio shows <strong className="text-foreground">how many</strong> teachers, not <strong className="text-foreground">who</strong> they are or <strong className="text-foreground">what they cost</strong>.
                          </p>
                          <ul className="space-y-1.5 pl-4 list-disc">
                            <li>A school with a favourable ratio may be carrying long-serving teachers on top of the pay scale — expensive without being demonstrably more effective.</li>
                            <li>A school with a lean ratio may have a lower pay cost per teacher (ECT / early-career profile).</li>
                            <li>Cost-per-pupil and average teacher cost would complete this picture. Available via DfE&apos;s Schools Financial Benchmarking — queued as a Tier 2 enhancement.</li>
                            <li>A school&apos;s &quot;support staff&quot; headcount may include shared central services (HR, finance, SEND coordination) that don&apos;t reflect classroom delivery capacity.</li>
                          </ul>
                          <p className="pt-1 italic">
                            Schoolgle flags patterns — it does not judge teachers. This ratio is one signal of many. Read alongside attendance, workforce turnover, and outcomes.
                          </p>
                        </div>
                      </details>

                      <div className="mt-3 text-[10px] text-muted-foreground italic">
                        Source: DfE School Workforce Census {staffingRow?.year ?? ''}. National ratios from DfE School Workforce Statistics 2024. A MAT&apos;s central team (HR, finance, SEND coordination) may sit at central level and not appear in individual school staffing — actual delivery capacity may differ from headline figures.
                      </div>
                    </div>
                  </motion.div>
                </HideableCard>

                {/* Research Factors Checked */}
                <HideableCard componentId="forensic-research-factors">
                  {renderResearchFactors()}
                </HideableCard>

                {/* Key governor questions */}
                <HideableCard componentId="forensic-questions">
                  <div className="bg-card border border-border rounded-2xl p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-1">Governor questions</h3>
                    <p className="text-sm text-muted-foreground mb-6">Research-grounded questions for the governing board to explore at the next FGB meeting</p>
                    <ul className="space-y-3">
                      {questions.map((item, i) => (
                        <li key={i} className={`flex items-start gap-3 text-sm px-4 py-3 rounded-xl border-l-4 ${
                          item.level === "red" ? "bg-red-50/50 border-l-red-500 text-red-800" :
                          item.level === "amber" ? "bg-amber-50/50 border-l-amber-500 text-amber-800" :
                          "bg-sky-50/50 border-l-sky-400 text-sky-800"
                        }`}>
                          <span className="flex-shrink-0 font-bold text-xs mt-0.5 opacity-60">Q{i + 1}</span>
                          <span className="leading-relaxed">{item.q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </HideableCard>

                {/* Data quality flags */}
                {(schoolFlags.length > 0 || missingYgs.length > 0 || zeroGdW.length >= 2) && (
                  <HideableCard componentId="forensic-data-quality">
                    <div className="bg-card border border-border rounded-2xl p-8">
                      <h3 className="text-xl font-semibold text-foreground mb-6">Data quality flags</h3>
                      <div className="space-y-2">
                        {missingYgs.map((yg) => (
                          <div key={yg} className="flex items-start gap-2 text-sm border-l-4 border-l-amber-400 bg-amber-50/40 text-amber-800 px-4 py-2.5 rounded-r-xl">
                            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>No data submitted for {yg}</span>
                          </div>
                        ))}
                        {zeroGdW.length >= 2 && (
                          <div className="flex items-start gap-2 text-sm border-l-4 border-l-amber-400 bg-amber-50/40 text-amber-800 px-4 py-2.5 rounded-r-xl">
                            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                            <span>Zero GD in Writing across {zeroGdW.length} year groups — check moderation records</span>
                          </div>
                        )}
                        {schoolFlags.map((flag, i) => (
                          <div key={i} className={`flex items-start gap-2 text-sm rounded-r-xl px-4 py-2.5 border-l-4 ${flag.severity === "error" ? "bg-red-50/40 border-l-red-500 text-red-800" : "bg-amber-50/40 border-l-amber-400 text-amber-800"}`}>
                            {flag.severity === "error" ? <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />}
                            <span>
                              {flag.yearGroup && <span className="font-medium">{flag.yearGroup} / </span>}
                              {flag.field && <span className="font-medium">{FIELD_LABELS[flag.field] ?? flag.field}: </span>}
                              {flag.issue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </HideableCard>
                )}

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────────
                TAB 3: COHORT PATHWAY — passport + EAL + GD + FSM gap + pipeline
            ───────────────────────────────────────────────────────────────────── */}
            {activeTab === "cohort" && (
              <div className="space-y-10 py-8 px-6">

                {/* School profile header — compact */}
                <HideableCard componentId="cohort-profile">
                  <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <SchoolLogoMark school={school} info={info} />
                      <div>
                        <h3 className="font-semibold text-foreground">{school} — {info?.name ?? school}</h3>
                        {info?.urn && <p className="text-xs text-muted-foreground">URN {info.urn}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center p-3 rounded-xl border border-border bg-background">
                        <div className="text-2xl font-bold text-foreground">{totalPupils > 0 ? String(totalPupils) : '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">EYFS–Y6 in capture</div>
                      </div>
                      <div className="text-center p-3 rounded-xl border border-border bg-background">
                        <div className="text-2xl font-bold text-foreground">{fsmPct !== null ? `${Math.round(fsmPct)}%` : '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">FSM ({Math.round(totalFsm)})</div>
                        {trustFsmPct !== null && fsmPct !== null && <div className="text-xs text-muted-foreground/60 mt-0.5">{fsmPct > trustFsmPct ? `+${Math.round(fsmPct - trustFsmPct)}pp` : `${Math.round(trustFsmPct - fsmPct)}pp below`} {groupLabel}</div>}
                      </div>
                      <div className="text-center p-3 rounded-xl border border-border bg-background">
                        <div className="text-2xl font-bold text-foreground">{sendPct !== null ? `${Math.round(sendPct)}%` : '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">SEND ({Math.round(totalSend)})</div>
                      </div>
                      <div className="text-center p-3 rounded-xl border border-border bg-background">
                        <div className="text-2xl font-bold text-foreground">{totalEhcp > 0 ? String(totalEhcp) : '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">EHCPs</div>
                      </div>
                    </div>
                  </div>
                </HideableCard>

                {/* Y6 subject comparison */}
                {radarData.length > 0 && (
                  <HideableCard componentId="cohort-radar">
                    <div className="bg-card border border-border rounded-2xl p-8">
                      <h3 className="text-xl font-semibold text-foreground mb-1">Y6 subject profile vs {groupLabel} average</h3>
                      <p className="text-sm text-muted-foreground mb-5">How this school compares on every subject at Year 6. Bars use the same 0–100% scale so the shape is immediately readable.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                        {radarData.map((d) => {
                          const diff = d.school - d.trust;
                          return (
                            <div key={d.subject} className="rounded-xl border border-border bg-background px-3 py-2">
                              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d.subject}</div>
                              <div className="mt-1 flex items-baseline gap-1">
                                <span className="text-lg font-bold text-foreground">{d.school}%</span>
                                {d.trust > 0 && <span className={`text-xs font-medium ${diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>{diff >= 0 ? "+" : ""}{diff}pp</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="space-y-5">
                        {radarData.map((d) => {
                          const schoolWidth = Math.max(0, Math.min(100, d.school));
                          const trustWidth = Math.max(0, Math.min(100, d.trust));
                          const diff = d.school - d.trust;
                          return (
                            <div key={d.subject} className="space-y-2">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <span className="font-semibold text-foreground">{d.subject}</span>
                                <span className={`text-xs font-semibold ${diff >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                  {d.trust > 0 ? `${diff >= 0 ? "+" : ""}${diff}pp vs ${groupLabel}` : `No ${groupLabel} benchmark`}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-3">
                                  <span className="w-16 text-xs font-medium text-muted-foreground">School</span>
                                  <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-sky-500" style={{ width: `${schoolWidth}%` }} />
                                  </div>
                                  <span className="w-10 text-right text-xs font-semibold text-foreground">{d.school}%</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="w-16 text-xs font-medium text-muted-foreground">{groupLabelTitle}</span>
                                  <div className="h-3 flex-1 rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-slate-400" style={{ width: `${trustWidth}%` }} />
                                  </div>
                                  <span className="w-10 text-right text-xs font-semibold text-muted-foreground">{d.trust}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </HideableCard>
                )}

                {/* Cohort Passport */}
                <HideableCard componentId="cohort-passport">
                  <CohortPassport
                    cohorts={cohortPassport?.cohorts ?? []}
                    loading={cohortPassportLoading}
                    phonicsAvailable={cohortPassport?.phonicsAvailable ?? false}
                    mtcAvailable={cohortPassport?.mtcAvailable ?? false}
                    hasCTF={cohortPassport?.hasCTF ?? false}
                    schoolName={info?.name ?? school}
                  />
                </HideableCard>

                {/* EAL Trajectory — only for high-EAL schools */}
                <HideableCard componentId="cohort-eal">
                  {renderEalTrajectory()}
                </HideableCard>

                {/* Greater Depth table */}
                {gdData.some((d) => d["Reading GD"] !== null || d["Writing GD"] !== null || d["Maths GD"] !== null) && (
                  <HideableCard componentId="cohort-gd">
                    <div className="bg-card border border-border rounded-2xl p-8">
                      <h3 className="text-xl font-semibold text-foreground mb-1">Greater Depth (GD %) by year group</h3>
                      <p className="text-sm text-muted-foreground mb-6">Percentage of pupils exceeding age-related expectations. National: Reading 29%, Writing 13%, Maths 24%</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 pr-4 text-xs font-semibold text-muted-foreground">Year Group</th>
                              <th className="text-center py-2 px-4 text-xs font-semibold text-sky-600">Reading GD</th>
                              <th className="text-center py-2 px-4 text-xs font-semibold text-red-500">Writing GD</th>
                              <th className="text-center py-2 px-4 text-xs font-semibold text-emerald-600">Maths GD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {gdData.map((row) => (
                              <tr key={row.yg} className="border-t border-border/50">
                                <td className="py-2.5 pr-4 text-sm font-semibold text-foreground">{row.yg}</td>
                                {(["Reading GD", "Writing GD", "Maths GD"] as const).map((subject) => {
                                  const pct = row[subject] as number | null;
                                  const cellClass = pct === 0 ? "text-red-700 font-bold" : pct !== null && pct > 10 ? "text-emerald-700 font-semibold" : pct !== null && pct > 0 ? "text-amber-700 font-semibold" : "text-muted-foreground/40";
                                  return (
                                    <td key={subject} className="py-2.5 px-4 text-center">
                                      <span className={cellClass}>{pct !== null ? `${pct}%` : "—"}</span>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {zeroGdW.length >= 3 && (
                        <div className="mt-4 flex items-start gap-2 text-sm border-l-4 border-l-red-500 bg-red-50/40 text-red-800 px-4 py-2.5 rounded-r-xl">
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                          <span><span className="font-semibold">Writing Greater Depth is 0% across {zeroGdW.length} year groups</span> — requires immediate attention.</span>
                        </div>
                      )}
                    </div>
                  </HideableCard>
                )}

                {/* FSM Dumbbell chart */}
                <HideableCard componentId="cohort-fsm-gap">
                  <div className="bg-card border border-border rounded-2xl p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-1">Disadvantage gap (FSM6 vs non-FSM)</h3>
                    <p className="text-sm text-muted-foreground mb-6">Combined ARE % for FSM-eligible vs non-FSM pupils. Line length shows gap in percentage points.</p>
                    {hasFsmData ? (
                      <>
                        <div className="space-y-4 mt-2">
                          {fsmGapData.filter((d) => d["FSM6 Combined"] !== null || d["Non-FSM Combined"] !== null).map((d) => {
                            const fsm = d["FSM6 Combined"] as number | null;
                            const nonFsm = d["Non-FSM Combined"] as number | null;
                            const gap = d.gap as number | null;
                            const left = Math.min(fsm ?? 100, nonFsm ?? 100);
                            const right = Math.max(fsm ?? 0, nonFsm ?? 0);
                            const rangeWidth = right - left;
                            return (
                              <div key={d.yg} className="flex items-center gap-4">
                                <div className="w-8 text-sm font-semibold text-foreground shrink-0 text-right">{d.yg}</div>
                                <div className="flex-1 relative h-8 flex items-center">
                                  <div className="absolute inset-y-0 left-0 right-0 flex items-center"><div className="w-full h-px bg-border" /></div>
                                  {fsm !== null && nonFsm !== null && (
                                    <div className="absolute h-1.5 rounded-full" style={{ left: `${left}%`, width: `${rangeWidth}%`, backgroundColor: gap !== null && gap > 20 ? "#FCA5A5" : gap !== null && gap > 10 ? "#FCD34D" : "#6EE7B7" }} />
                                  )}
                                  {fsm !== null && <div className="absolute w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm" style={{ left: `calc(${fsm}% - 8px)` }} title={`FSM6: ${fsm}%`} />}
                                  {nonFsm !== null && <div className="absolute w-4 h-4 rounded-full bg-sky-500 border-2 border-white shadow-sm" style={{ left: `calc(${nonFsm}% - 8px)` }} title={`Non-FSM: ${nonFsm}%`} />}
                                </div>
                                <div className="w-20 shrink-0 flex items-center gap-1.5 text-xs">
                                  {fsm !== null && <span className="text-red-600 font-semibold">{fsm}%</span>}
                                  {nonFsm !== null && <span className="text-sky-600 font-semibold">{nonFsm}%</span>}
                                </div>
                                <div className="w-16 shrink-0">
                                  {gap !== null && (
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gap > 20 ? "bg-red-100 text-red-700" : gap > 10 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{gap}pp</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> FSM6</span>
                          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500 inline-block" /> Non-FSM</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start gap-2 text-sm border-l-4 border-l-amber-400 bg-amber-50/40 text-amber-800 px-4 py-3 rounded-r-xl">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        <span>FSM breakdown data was not submitted for this school.</span>
                      </div>
                    )}
                  </div>
                </HideableCard>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────────
                TAB 4: PUPIL LEVEL — pupil card grid (requires CTF connection)
            ───────────────────────────────────────────────────────────────────── */}
            {activeTab === "pupil" && (
              <div className="py-8 px-6">
                <EvidenceTimelineCard timeline={unifiedEvidenceTimeline} />
                {defendNumbersData?.cohortGapLens && (
                  <HideableCard componentId="pupil-cohort-gap-lens">
                    <div className="mt-6">
                      <CohortGapLensPanel
                        lens={defendNumbersData.cohortGapLens}
                        school={school}
                      />
                    </div>
                  </HideableCard>
                )}
                <HideableCard componentId="pupil-primary-ofsted-bridge">
                  <div className="mt-6">
                    <PrimaryOfstedBridgeCard
                      school={school}
                      disaggregation={currentProfileDisaggregation}
                      timeline={unifiedEvidenceTimeline}
                      assessmentIntelligence={assessmentIntelligence}
                    />
                  </div>
                </HideableCard>
                {pupilRecords.length > 0 ? (
                  <HideableCard componentId="pupil-grid">
                    <div className="bg-card border border-border rounded-2xl p-8">
                      <h3 className="text-xl font-semibold text-foreground mb-1">Pupil-level evidence register</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        {pupilRecords.length} pseudonymised pupils with any connected CTF/MIS assessment evidence across imported years, including historic cohorts where present. Names and raw identifiers are not shown; deterministic aliases are generated from secure hashes so cohort patterns, classes and pupil journeys can be reviewed safely.
                      </p>
                      <PupilCardGrid pupils={pupilRecords} spotlightPupilId={spotlightPupilId} />
                    </div>
                  </HideableCard>
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
                      <Lock size={20} className="text-sky-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Pupil-level evidence requires a CTF/MIS connection</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                      Connect this school&apos;s CTF or MIS assessment export to unlock per-pupil attainment tracking, SEND/FSM breakdown, and individual gap analysis.
                    </p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-sky-600 transition-colors">
                      <Database size={15} />
                      Connect CTF — Tier 3
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Pupil data is HMAC-SHA256 pseudonymised. No names are stored on Schoolgle servers.</p>
                  </div>
                )}
                {defendNumbersData && !defendNumbersData.cohortGapLens && (
                  <HideableCard componentId="pupil-defend-numbers">
                    <div className="mt-6 bg-card border border-border rounded-2xl p-8">
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-1">Defend your numbers</h3>
                          <p className="text-sm text-muted-foreground">
                            A concise demographic impact check from the CTF file — useful when explaining whether outcomes are being driven by FSM, SEND or EAL context.
                          </p>
                        </div>
                        <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs font-semibold text-muted-foreground">
                          Pupil-level evidence
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {[
                          { label: "All pupils analysed", value: defendNumbersData.all?.count ?? "—", sub: "baseline cohort" },
                          { label: "FSM removed", value: defendNumbersData.withoutFsm?.removed ?? "—", sub: `${defendNumbersData.withoutFsm?.remaining ?? "—"} remaining` },
                          { label: "SEND removed", value: defendNumbersData.withoutSend?.removed ?? "—", sub: `${defendNumbersData.withoutSend?.remaining ?? "—"} remaining` },
                          { label: "EAL removed", value: defendNumbersData.withoutEal?.removed ?? "—", sub: `${defendNumbersData.withoutEal?.remaining ?? "—"} remaining` },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl border border-border bg-muted/20 p-4">
                            <div className="text-2xl font-semibold text-foreground">{item.value}</div>
                            <div className="mt-1 text-sm font-medium text-muted-foreground">{item.label}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground/70">{item.sub}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                        Use this as a prompt for professional discussion, not as a conclusion: “If we remove specific contextual groups, does the headline attainment picture materially change?”
                      </div>
                    </div>
                  </HideableCard>
                )}
                {assessmentIntelligence?.latestSnapshot && (
                  <HideableCard componentId="assessment-intelligence-snapshot">
                    <div className="mt-6 bg-card border border-blue-200 rounded-2xl p-8">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-1">Teacher-locked assessment snapshot</h3>
                          <p className="text-sm text-muted-foreground">
                            Live Assessment Intelligence evidence from teacher judgement entry. This is the bridge between classroom assessment, Trust Assessor and Ofsted Readiness.
                          </p>
                        </div>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {assessmentIntelligence.latestSnapshot.subject ?? "assessment"} · {assessmentIntelligence.latestSnapshot.assessmentPeriod}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <div className="text-2xl font-semibold text-foreground">{assessmentIntelligence.latestSnapshot.eventCount}</div>
                          <div className="mt-1 text-sm font-medium text-muted-foreground">Pupil judgements</div>
                          <div className="mt-0.5 text-xs text-muted-foreground/70">{assessmentIntelligence.latestSnapshot.className ?? "Class snapshot"}</div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <div className="text-2xl font-semibold text-foreground">{assessmentIntelligence.latestSnapshot.atExpectedPct ?? "—"}%</div>
                          <div className="mt-1 text-sm font-medium text-muted-foreground">At expected+</div>
                          <div className="mt-0.5 text-xs text-muted-foreground/70">teacher locked</div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <div className="text-2xl font-semibold text-foreground">{assessmentIntelligence.latestSnapshot.greaterDepthPct ?? "—"}%</div>
                          <div className="mt-1 text-sm font-medium text-muted-foreground">Greater depth</div>
                          <div className="mt-0.5 text-xs text-muted-foreground/70">within this snapshot</div>
                        </div>
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <div className="text-2xl font-semibold text-foreground">{assessmentIntelligence.latestSnapshot.needsModerationCount}</div>
                          <div className="mt-1 text-sm font-medium text-muted-foreground">Needs moderation</div>
                          <div className="mt-0.5 text-xs text-muted-foreground/70">teacher flagged</div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                        <div><span className="font-semibold text-foreground">Source:</span> {assessmentIntelligence.latestSourceLabel}</div>
                        <div className="mt-1"><span className="font-semibold text-foreground">Tables:</span> {assessmentIntelligence.source}</div>
                        <div className="mt-1"><span className="font-semibold text-foreground">Caveat:</span> {assessmentIntelligence.caveat}</div>
                      </div>
                    </div>
                  </HideableCard>
                )}
                {currentProfileDisaggregation?.groups && (
                  <HideableCard componentId="pupil-characteristic-lens">
                    <div className="mt-6 bg-card border border-border rounded-2xl p-8">
                      <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-1">Pupil characteristic lens</h3>
                          <p className="text-sm text-muted-foreground">
                            Current Schoolgle pupil profile, split by SEND, EHCP, disadvantage and EAL, so leaders can test whether the headline percentage is hiding a subgroup issue.
                          </p>
                        </div>
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Source-labelled
                        </span>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Group</th>
                              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Pupils</th>
                              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Combined RWM+</th>
                              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">At expected+</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              ['all', 'All pupils'],
                              ['nonSend', 'Non-SEND'],
                              ['send', 'SEND / EHCP'],
                              ['senSupport', 'SEN support'],
                              ['ehcp', 'EHCP'],
                              ['pp', 'Disadvantaged / FSM'],
                              ['eal', 'EAL'],
                            ].map(([key, label]) => {
                              const group = currentProfileDisaggregation.groups[key];
                              if (!group) return null;
                              return (
                                <tr key={key} className="border-t border-border/60">
                                  <td className="px-4 py-3 font-medium text-foreground">{label}</td>
                                  <td className="px-4 py-3 text-right text-muted-foreground">{group.count}</td>
                                  <td className="px-4 py-3 text-right font-semibold text-foreground">{group.combinedPct !== null ? `${group.combinedPct}%` : "—"}</td>
                                  <td className="px-4 py-3 text-right text-muted-foreground">{group.combinedAtExpected}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 rounded-xl border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                        <div><span className="font-semibold text-foreground">Source:</span> {currentProfileDisaggregation.source}</div>
                        <div className="mt-1"><span className="font-semibold text-foreground">Caveat:</span> {currentProfileDisaggregation.caveat}</div>
                      </div>
                    </div>
                  </HideableCard>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────────────
                TAB 5: EVIDENCE — timeline + data sources
            ───────────────────────────────────────────────────────────────────── */}
            {activeTab === "evidence" && (
              <div className="space-y-10 py-8 px-6">

                {/* School Events Timeline */}
                <HideableCard componentId="evidence-timeline">
                  <div className="bg-card border border-border rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">Events timeline</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">DfE inspection history, attendance trends, workforce changes and forensic findings for {info?.name ?? school}</p>
                      </div>
                      <a href={`/timeline?school=${info?.urn ?? school}`} className="text-sm text-sky-500 hover:underline flex items-center gap-1">
                        View full timeline →
                      </a>
                    </div>
                    <Timeline events={timelineEvents} loading={timelineLoading} variant="embedded" />
                  </div>
                </HideableCard>

                {/* KS2 Track Record — 3-year DfE history */}
                {info?.urn && (
                  <HideableCard componentId="evidence-ks2-track">
                    <div className="bg-card border border-border rounded-2xl p-8">
                      <h3 className="text-xl font-semibold text-foreground mb-1">KS2 track record</h3>
                      <p className="text-sm text-muted-foreground mb-6">DfE validated KS2 (2023–2025) alongside this year&apos;s school self-report captures — Autumn Term and Mid-Year shown separately so movement between the two is visible.</p>
                      {(() => {
                        const autumnY6 = capturesByPeriod?.autumn_term?.parsed_data?.data?.[school]?.["Year 6"];
                        const midYearY6 = capturesByPeriod?.mid_year?.parsed_data?.data?.[school]?.["Year 6"];
                        // Fallback: if no captures map supplied, use the currently-loaded parsed as mid-year
                        const fallbackY6 = parsed.data[school]?.["Year 6"];
                        const selfReports = {
                          autumn_term: autumnY6 ? { combined: autumnY6.all_pupils.c_are ?? null } : null,
                          mid_year: midYearY6
                            ? { combined: midYearY6.all_pupils.c_are ?? null }
                            : (!autumnY6 && fallbackY6 ? { combined: fallbackY6.all_pupils.c_are ?? null } : null),
                        };
                        return (
                          <KS2TrackRecordChart
                            school={abbrevLookup[school]?.name ?? school}
                            abbrev={school}
                           ks2Results={dfeData?.ks2Results ?? []}
                           selfReports={selfReports}
                           selfReportLabels={selfReportLabels}
                         />
                        );
                      })()}
                    </div>
                  </HideableCard>
                )}

                {/* Research citations */}
                <HideableCard componentId="evidence-citations">
                  <div className="bg-card border border-border rounded-2xl p-8">
                    <h3 className="text-xl font-semibold text-foreground mb-6">Research citations</h3>
                    <div className="space-y-3">
                      {Object.values(RESEARCH_CITATIONS).map((citation) => (
                        <div key={citation.id} className="flex items-start gap-3 text-sm">
                          <span className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-foreground">{citation.authors} ({citation.year})</span>
                            <span className="text-muted-foreground ml-2 italic">{citation.title}</span>
                            <span className="text-muted-foreground/60 ml-2">— {citation.publisher}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-6">
                      All analysis cross-references official DfE statistics and peer-reviewed research. Mid-year data is self-reported by the school; findings are presented as context for professional discussion.
                    </p>
                  </div>
                </HideableCard>

              </div>
            )}

          </div>
        )}
      </SchoolTabTabs>
    </EditModeProvider>
  );
}

// ─── Sub-render helpers extracted from SchoolTab to keep function readable ────

function OverviewNarrativeCard({ school, aiNarrative, narrativeLoading, narrativePoints, audience = "trust" }: {
  school: string;
  aiNarrative: string | null;
  narrativeLoading: boolean;
  narrativePoints: string[];
  audience?: OverviewAudience;
}) {
  const sourceOwner = audience === "local_authority" ? "local authority/school" : "trust/school";
  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <div className="mb-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Assessment summary</h3>
          <p className="text-sm text-muted-foreground mt-0.5">AI-assisted narrative from the selected submitted assessment capture. Pupil totals in this section are submitted EYFS–Y6 cohort counts, not DfE roll or current MIS/profile roll.</p>
        </div>
      </div>
      <div className="mt-2">
          {narrativeLoading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-4 h-4 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
              <span className="text-sm text-muted-foreground">Generating analysis...</span>
            </div>
          ) : aiNarrative ? (
            <div className="space-y-3">
              {aiNarrative.replace(/^#{1,4}\s+/gm, '').replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1').replace(/_{1,2}([^_]+)_{1,2}/g, '$1').replace(/\bserves\s+(\d+)\s+pupils\b/gi, 'has $1 pupils in the submitted EYFS–Y6 capture').replace(/^[-•]\s+/gm, '').replace(/^\d+\.\s+/gm, '').replace(/\n{3,}/g, '\n\n').trim().split('\n\n').filter(p => p.trim().length > 0).map((para, i) => (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed">{para.replace(/\n/g, ' ').trim()}</p>
              ))}
            </div>
          ) : narrativePoints.length > 0 ? (
            <div className="space-y-3">
              {narrativePoints.map((point, i) => (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed">{point}</p>
              ))}
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground/60 mt-4">Source: Analysis based on {sourceOwner} mid-year spreadsheet data (self-reported). Submitted cohort totals may differ from DfE roll, nursery roll, current MIS/profile counts and historic CTF evidence because each layer has a different source/date/purpose. Not externally validated.{aiNarrative && ' Narrative generated by AI from the computed metrics.'}</p>
      </div>
    </div>
  );
}

// ─── Validation & Credibility card (used in Forensic tab) ────────────────────

function ValidationCredibilityCard({ nationalPercentile, threeYearAvg, y6Combined, statAlerts, ordinal }: {
  nationalPercentile: { pct: number; percentile: number; rank: number; totalSchools: number } | null;
  threeYearAvg: { averagePct: number; yearsUsed: number } | null;
  y6Combined: number | null;
  statAlerts: StatAlert[];
  ordinal: (n: number) => string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between"
      >
        <div className="text-left">
          <h3 className="text-xl font-semibold text-foreground">Validation &amp; credibility</h3>
          <p className="text-sm text-muted-foreground mt-0.5">DfE validated data vs self-reported figures</p>
        </div>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {nationalPercentile !== null && (
              <div className="bg-muted/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy size={15} className={nationalPercentile.percentile > 75 ? "text-emerald-500" : nationalPercentile.percentile > 50 ? "text-sky-500" : nationalPercentile.percentile > 25 ? "text-amber-500" : "text-red-500"} />
                  <span className="text-sm font-semibold text-foreground">National Percentile Rank</span>
                  <span className="text-xs text-muted-foreground ml-auto">KS2 2024</span>
                </div>
                <div className={`text-5xl font-extrabold mb-1 ${nationalPercentile.percentile > 75 ? "text-emerald-600" : nationalPercentile.percentile > 50 ? "text-sky-600" : nationalPercentile.percentile > 25 ? "text-amber-600" : "text-red-600"}`}>
                  {ordinal(nationalPercentile.percentile)}
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  {nationalPercentile.percentile > 50 ? `Better than ${nationalPercentile.percentile}% of England schools` : `Worse than ${100 - nationalPercentile.percentile}% of England schools`}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-card rounded-lg p-2 text-center"><div className="font-bold text-foreground text-base">{nationalPercentile.pct}%</div><div className="text-muted-foreground">KS2 Combined</div></div>
                  <div className="bg-card rounded-lg p-2 text-center"><div className="font-bold text-foreground text-base">{nationalPercentile.rank.toLocaleString()} / {nationalPercentile.totalSchools.toLocaleString()}</div><div className="text-muted-foreground">National rank</div></div>
                </div>
              </div>
            )}
            {threeYearAvg !== null && y6Combined !== null && (
              <div className="bg-muted/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={15} className="text-sky-500" />
                  <span className="text-sm font-semibold text-foreground">Predictive Accuracy</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div><div className="text-xs text-muted-foreground mb-1">Mid-year Y6</div><div className="text-2xl font-bold text-foreground">{y6Combined}%</div></div>
                  <div><div className="text-xs text-muted-foreground mb-1">3-yr DfE avg</div><div className="text-2xl font-bold text-foreground">{threeYearAvg.averagePct}%</div><div className="text-[10px] text-muted-foreground/60">{threeYearAvg.yearsUsed} yr avg</div></div>
                  <div><div className="text-xs text-muted-foreground mb-1">Gap</div><div className={`text-2xl font-bold ${Math.abs(y6Combined - threeYearAvg.averagePct) <= 5 ? "text-emerald-600" : Math.abs(y6Combined - threeYearAvg.averagePct) <= 10 ? "text-amber-600" : "text-red-600"}`}>{y6Combined > threeYearAvg.averagePct ? "+" : ""}{y6Combined - threeYearAvg.averagePct}pp</div></div>
                </div>
                <div className={`text-xs p-2.5 rounded-lg ${y6Combined > threeYearAvg.averagePct + 10 || y6Combined < threeYearAvg.averagePct - 10 ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>
                  {y6Combined > threeYearAvg.averagePct + 10 ? `Prediction is ${y6Combined - threeYearAvg.averagePct}pp above 3-year average — historically optimistic.` : y6Combined < threeYearAvg.averagePct - 10 ? `Prediction is ${threeYearAvg.averagePct - y6Combined}pp below 3-year average — possibly conservative.` : `Within normal range of the 3-year KS2 average.`}
                </div>
              </div>
            )}
          </div>
          {/* Stat alerts */}
          <div className="rounded-xl bg-muted/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Data quality alerts</span>
              <span className="text-xs text-muted-foreground ml-auto">statistical plausibility</span>
            </div>
            {statAlerts.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />No statistical impossibilities detected.</div>
            ) : (
              <div className="space-y-2">
                {statAlerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-xl border-l-4 text-sm ${alert.severity === "high" ? "bg-red-50/50 border-l-red-500 text-red-800" : alert.severity === "medium" ? "bg-amber-50/50 border-l-amber-500 text-amber-800" : "bg-muted/30 border-l-border text-foreground"}`}>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-xs mt-1 opacity-80">{alert.explanation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Count-up animation hook ──────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | undefined;
    let raf: number;
    const step = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// ─── Phase 1: Trust Insights (clean 3-zone layout) ───────────────────────────

function TrustInsights({ parsed, onSchoolClick, audience = "trust" }: { parsed: ParsedSpreadsheet; onSchoolClick?: (school: string) => void; audience?: OverviewAudience }) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const groupLabel = audience === "local_authority" ? "local authority" : "trust";
  const groupLabelTitle = audience === "local_authority" ? "Local authority" : "Trust";
  // ── Compute trust-wide metrics ──
  let totalTrustPupils = 0;
  let totalY6Combined = 0;
  let y6CombinedCount = 0;
  let weakestY6School = "";
  let weakestY6Pct: number | null = null;

  for (const school of parsed.schools) {
    for (const yg of YEAR_GROUPS) {
      const d = parsed.data[school]?.[yg];
      if (d?.cohort.number_in_cohort) totalTrustPupils += d.cohort.number_in_cohort;
    }
    const y6c = parsed.data[school]?.["Year 6"]?.all_pupils.c_are ?? null;
    if (y6c !== null) {
      totalY6Combined += y6c;
      y6CombinedCount++;
      if (weakestY6Pct === null || y6c < weakestY6Pct) { weakestY6Pct = y6c; weakestY6School = school; }
    }
  }
  const trustAvgY6Combined = y6CombinedCount > 0 ? Math.round(totalY6Combined / y6CombinedCount) : null;
  const schoolsNeedingAttention = parsed.schools.filter(s => {
    const pct = parsed.data[s]?.["Year 6"]?.all_pupils.c_are ?? null;
    return pct !== null && pct < 55;
  }).length;

  // ── Zero GD Writing for narrative ──
  const zeroGdWriting: { school: string; yg: string }[] = [];
  for (const school of parsed.schools) {
    for (const yg of HEATMAP_YEAR_GROUPS) {
      const d = parsed.data[school]?.[yg];
      if (d && d.all_pupils.w_gd === 0) zeroGdWriting.push({ school, yg });
    }
  }

  // ── Consistency jumps ──
  interface ConsistencyJump { school: string; from: string; to: string; fromPct: number; toPct: number; change: number; cohort: number | null; }
  const consistencyJumps: ConsistencyJump[] = [];
  for (const school of parsed.schools) {
    for (let i = 1; i < HEATMAP_YEAR_GROUPS.length; i++) {
      const prev = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i - 1]]?.all_pupils.c_are ?? null;
      const curr = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i]]?.all_pupils.c_are ?? null;
      if (prev !== null && curr !== null && Math.abs(curr - prev) > 15) {
        consistencyJumps.push({
          school,
          from: HEATMAP_YEAR_GROUPS[i - 1].replace("Year ", "Y"),
          to: HEATMAP_YEAR_GROUPS[i].replace("Year ", "Y"),
          fromPct: prev, toPct: curr,
          change: Math.round(curr - prev),
          cohort: parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i]]?.cohort.number_in_cohort ?? null,
        });
      }
    }
  }

  // ── AI narrative ──
  const subjectTotals: Record<"reading" | "writing" | "maths", { sum: number; count: number }> = {
    reading: { sum: 0, count: 0 }, writing: { sum: 0, count: 0 }, maths: { sum: 0, count: 0 },
  };
  for (const school of parsed.schools) {
    const y6 = parsed.data[school]?.["Year 6"];
    if (!y6) continue;
    const ap = y6.all_pupils;
    if (ap.r_are !== null && ap.r_are !== undefined) { subjectTotals.reading.sum += ap.r_are; subjectTotals.reading.count++; }
    if (ap.w_are !== null && ap.w_are !== undefined) { subjectTotals.writing.sum += ap.w_are; subjectTotals.writing.count++; }
    if (ap.m_are !== null && ap.m_are !== undefined) { subjectTotals.maths.sum += ap.m_are; subjectTotals.maths.count++; }
  }
  const avgR = subjectTotals.reading.count > 0 ? Math.round(subjectTotals.reading.sum / subjectTotals.reading.count) : null;
  const avgW = subjectTotals.writing.count > 0 ? Math.round(subjectTotals.writing.sum / subjectTotals.writing.count) : null;
  const avgM = subjectTotals.maths.count > 0 ? Math.round(subjectTotals.maths.sum / subjectTotals.maths.count) : null;
  const weakestSubjectLabel = avgR !== null && avgW !== null && avgM !== null
    ? (avgW <= avgR && avgW <= avgM ? `Writing (${avgW}%)` : avgR <= avgW && avgR <= avgM ? `Reading (${avgR}%)` : `Maths (${avgM}%)`)
    : null;

  // ── Build narrative text ──
  const narrativeParts: string[] = [];
  if (trustAvgY6Combined !== null) {
    const vs = trustAvgY6Combined - 61;
    narrativeParts.push(`${groupLabelTitle} Y6 Combined average is ${trustAvgY6Combined}% — ${Math.abs(vs)}pp ${vs >= 0 ? 'above' : 'below'} the national average of 61%.`);
  }
  if (weakestSubjectLabel) {
    narrativeParts.push(`${weakestSubjectLabel} is the weakest subject across this ${groupLabel}.`);
  }
  if (zeroGdWriting.length >= 3) {
    const schoolsAffected = [...new Set(zeroGdWriting.map(z => z.school))];
    narrativeParts.push(`Zero Greater Depth in Writing reported across ${zeroGdWriting.length} year groups in ${schoolsAffected.join(', ')} — this is a ${groupLabel}-wide concern requiring moderation review.`);
  }
  if (consistencyJumps.length > 0) {
    narrativeParts.push(`${consistencyJumps.length} year group consistency issue${consistencyJumps.length > 1 ? 's' : ''} detected (>15pp jump between adjacent year groups). School leaders should provide moderation evidence.`);
  }
  if (weakestY6School && weakestY6Pct !== null && weakestY6Pct < 55) {
    narrativeParts.push(`${weakestY6School} needs most urgent support with Y6 Combined at ${weakestY6Pct}%. Click the school tab for a full deep dive.`);
  }

  return (
    <div className="space-y-6">

      {/* Zone 1 — Hero Strip */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-5 text-center"
        >
          <div className="text-4xl font-extrabold text-gray-900">{totalTrustPupils > 0 ? totalTrustPupils.toLocaleString() : "—"}</div>
          <div className="text-sm font-medium text-gray-500 mt-1">Total pupils</div>
          <div className="text-xs text-gray-400 mt-0.5">{parsed.schools.length} schools</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={`rounded-xl p-5 text-center border ${
            trustAvgY6Combined !== null && trustAvgY6Combined >= 65 ? 'bg-emerald-50 border-emerald-200' :
            trustAvgY6Combined !== null && trustAvgY6Combined >= 50 ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}
        >
          <div className={`text-4xl font-extrabold ${
            trustAvgY6Combined !== null && trustAvgY6Combined >= 65 ? 'text-emerald-700' :
            trustAvgY6Combined !== null && trustAvgY6Combined >= 50 ? 'text-amber-700' :
            'text-red-700'
          }`}>
            {trustAvgY6Combined !== null ? `${trustAvgY6Combined}%` : "—"}
          </div>
          <div className="text-sm font-medium text-gray-600 mt-1">{groupLabelTitle} Y6 Combined</div>
          {trustAvgY6Combined !== null && (
            <div className={`text-xs font-semibold mt-0.5 flex items-center justify-center gap-1 ${trustAvgY6Combined >= 61 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trustAvgY6Combined >= 61 ? <TrendingUp size={11} /> : <AlertTriangle size={11} />}
              {trustAvgY6Combined >= 61 ? `+${trustAvgY6Combined - 61}pp` : `${trustAvgY6Combined - 61}pp`} vs national
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className={`rounded-xl p-5 text-center border ${schoolsNeedingAttention > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}
        >
          <motion.div
            animate={schoolsNeedingAttention > 0 ? { scale: [1, 1.04, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`text-4xl font-extrabold ${schoolsNeedingAttention > 0 ? 'text-red-700' : 'text-emerald-700'}`}
          >
            {schoolsNeedingAttention}
          </motion.div>
          <div className="text-sm font-medium text-gray-600 mt-1">Schools needing attention</div>
          <div className="text-xs text-gray-400 mt-0.5">Y6 Combined below 55%</div>
        </motion.div>
      </div>

      {/* Zone 2 — Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-white border border-gray-200 rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={15} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-800">{groupLabelTitle} Attainment Heatmap</span>
          <span className="text-xs text-gray-400 ml-1">click a school name to drill in</span>
        </div>
        <SubjectHeatmap parsed={parsed} onSchoolClick={onSchoolClick ?? (() => {})} />
      </motion.div>

      {/* Zone 3 — AI Callout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Info size={15} className="text-blue-500" />
          <span className="text-sm font-semibold text-blue-800">{groupLabelTitle} Overview</span>
        </div>
        <div className="space-y-2">
          {narrativeParts.map((p, i) => (
            <p key={i} className="text-sm text-blue-800 leading-relaxed">{p}</p>
          ))}
          {narrativeParts.length === 0 && (
            <p className="text-sm text-blue-700">Upload a spreadsheet to generate {groupLabel}-wide insights.</p>
          )}
        </div>
        {onSchoolClick && parsed.schools.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {parsed.schools.map(school => (
              <motion.button
                key={school}
                whileHover={{ scale: 1.04 }}
                onClick={() => onSchoolClick(school)}
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                <SchoolLogoMark school={school} info={abbrevLookup[school]} size="sm" />
                View {school}
              </motion.button>
            ))}
          </div>
        )}
        <p className="text-[10px] text-blue-400 mt-3">Source: {groupLabelTitle} mid-year data capture spreadsheet. Self-reported.</p>
      </motion.div>

    </div>
  );
}

// ─── Key Findings Banner ──────────────────────────────────────────────────────

function KeyFindingsBanner({ parsed, isTrustLevel, audience = "trust", sourceLabel = "from your mid-year data" }: { parsed: ParsedSpreadsheet; isTrustLevel: boolean; audience?: OverviewAudience; sourceLabel?: string }) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const isDfeSource = /dfe/i.test(sourceLabel);
  const groupLabel = audience === "local_authority" ? "LA" : "Trust";
  const schoolLabel = (school: string) => abbrevLookup[school]?.name ?? school;
  const schoolListLabel = (schools: string[]) => {
    const labels = schools.map(schoolLabel);
    if (labels.length <= 5) return labels.join(", ");
    return `${labels.slice(0, 5).join(", ")}, +${labels.length - 5} more`;
  };

  // Finding 1: How many schools have Y6 Combined below 50%
  const schoolsBelow50 = parsed.schools.filter((s) => {
    const pct = parsed.data[s]?.["Year 6"]?.all_pupils.c_are ?? null;
    return pct !== null && pct < 50;
  });

  // Finding 2: Schools with zero GD in Writing across 3+ year groups
  const schoolsZeroGdW3plus = parsed.schools.filter((s) => {
    const count = HEATMAP_YEAR_GROUPS.filter((yg) => parsed.data[s]?.[yg]?.all_pupils.w_gd === 0).length;
    return count >= 3;
  });

  // Finding 3: Strongest and weakest school by Y6 Combined
  let strongestSchool = "";
  let strongestPct: number | null = null;
  let weakestSchool = "";
  let weakestPct: number | null = null;
  for (const s of parsed.schools) {
    const pct = parsed.data[s]?.["Year 6"]?.all_pupils.c_are ?? null;
    if (pct === null) continue;
    if (strongestPct === null || pct > strongestPct) { strongestPct = pct; strongestSchool = s; }
    if (weakestPct === null || pct < weakestPct) { weakestPct = pct; weakestSchool = s; }
  }

  // Finding 4: Trust-wide Y6 Combined average
  let y6Sum = 0;
  let y6Count = 0;
  for (const s of parsed.schools) {
    const pct = parsed.data[s]?.["Year 6"]?.all_pupils.c_are ?? null;
    if (pct !== null) { y6Sum += pct; y6Count++; }
  }
  const trustAvg = y6Count > 0 ? Math.round(y6Sum / y6Count) : null;
  if (strongestSchool) strongestSchool = schoolLabel(strongestSchool);
  if (weakestSchool) weakestSchool = schoolLabel(weakestSchool);

  const findings: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    color: string;
  }[] = [];

  if (trustAvg !== null) {
    findings.push({
      icon: <BarChart3 size={18} />,
      label: isTrustLevel ? (isDfeSource || audience === "local_authority" ? "LA Y6 Combined" : "Trust Y6 Combined") : "Y6 Combined",
      value: `${trustAvg}%`,
      sub: isTrustLevel ? `${y6Count} ${y6Count === 1 ? "school" : "schools"} reporting` : "latest school submission",
      color: trustAvg >= 65 ? "text-emerald-700" : trustAvg >= 50 ? "text-amber-700" : "text-red-700",
    });
  }

  if (isTrustLevel && strongestSchool && strongestPct !== null) {
    findings.push({
      icon: <Trophy size={18} />,
      label: `Strongest school in ${groupLabel}`,
      value: `${strongestSchool} — ${strongestPct}%`,
      sub: "Highest Y6 Combined ARE",
      color: "text-emerald-700",
    });
  }

  if (isTrustLevel && weakestSchool && weakestPct !== null && weakestSchool !== strongestSchool) {
    findings.push({
      icon: <AlertCircle size={18} />,
      label: `Needs attention in ${groupLabel}`,
      value: `${weakestSchool} — ${weakestPct}%`,
      sub: "Lowest Y6 Combined ARE",
      color: weakestPct < 50 ? "text-red-700" : "text-amber-700",
    });
  }

  if (schoolsBelow50.length > 0) {
    findings.push({
      icon: <XCircle size={18} />,
      label: isTrustLevel ? "Below 50% Y6 Combined" : "Y6 below 50% combined",
      value: isTrustLevel ? `${schoolsBelow50.length} ${schoolsBelow50.length === 1 ? "school" : "schools"}` : `${parsed.data[parsed.schools[0]]?.["Year 6"]?.all_pupils.c_are ?? "—"}%`,
      sub: isTrustLevel ? schoolListLabel(schoolsBelow50) : "flagged from latest submission",
      color: "text-red-700",
    });
  }

  if (schoolsZeroGdW3plus.length > 0) {
    findings.push({
      icon: <AlertTriangle size={18} />,
      label: isTrustLevel ? "Zero GD Writing (3+ yr groups)" : "Zero GD Writing pattern",
      value: isTrustLevel ? `${schoolsZeroGdW3plus.length} ${schoolsZeroGdW3plus.length === 1 ? "school" : "schools"}` : "3+ year groups",
      sub: isTrustLevel ? schoolListLabel(schoolsZeroGdW3plus) : "review writing greater-depth evidence",
      color: "text-amber-700",
    });
  }

  if (findings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3">
        <Layers size={15} className="text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Key Findings</span>
        <span className="text-xs text-muted-foreground ml-1">{sourceLabel}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {findings.map((f, i) => {
          const severityDot = f.color.includes("red")
            ? "bg-red-500"
            : f.color.includes("amber")
              ? "bg-amber-400"
              : f.color.includes("emerald")
                ? "bg-emerald-500"
                : "bg-sky-500";
          const iconTone = f.color.includes("red")
            ? "text-red-500"
            : f.color.includes("amber")
              ? "text-amber-500"
              : f.color.includes("emerald")
                ? "text-emerald-500"
                : "text-sky-500";

          return (
            <div key={i} className="rounded-xl border border-border bg-card px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted/20">
                  <span className={iconTone}>{f.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${severityDot}`} />
                    <div className="text-base font-semibold text-foreground leading-tight">{f.value}</div>
                  </div>
                  <div className="text-xs font-medium mt-1 text-muted-foreground">{f.label}</div>
                  {f.sub && <div className="text-[10px] mt-0.5 text-muted-foreground/70 truncate">{f.sub}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Phase 2: KS2 Track Record Chart ─────────────────────────────────────────

function getKs2SubjectForUrn(ks2Results: KS2Result[], urn: number, year: number, subject: string): number | null {
  const r = ks2Results.find(
    (row) => row.urn === urn && row.academicYearEnd === year && row.breakdownTopic === "All pupils" && row.subject === subject && row.expectedStandardPct !== null,
  );
  return r?.expectedStandardPct ?? null;
}

type SelfReportLabels = {
  autumn_term?: string;
  mid_year?: string;
};

function captureDisplayName(period: keyof SelfReportLabels, labels?: SelfReportLabels): string {
  return labels?.[period] ?? (period === 'autumn_term' ? 'Autumn self-report' : 'Mid-Year self-report');
}

function UrnValidationWarning({ validation }: { validation: UrnValidationResult | null }) {
  if (!validation || validation.status === "valid") return null;

  const isBlocking = validation.status === "mismatch" || validation.status === "not_found";
  const tone = isBlocking
    ? "border-red-200 bg-red-50 text-red-900"
    : "border-amber-200 bg-amber-50 text-amber-900";
  const iconTone = isBlocking ? "text-red-600" : "text-amber-600";
  const candidate = validation.candidates?.[0];

  return (
    <div className={`mb-6 rounded-2xl border p-4 ${tone}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className={`${iconTone} mt-0.5 flex-shrink-0`} />
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            DfE data verification in progress
          </div>
          <p className="mt-1 text-sm leading-relaxed">
            We are checking this school's official DfE identity before displaying KPI data, so the report does not show the wrong establishment's results.
          </p>
          {process.env.NODE_ENV === "development" && validation.dfeSchool && (
            <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-xl bg-white/70 border border-white px-3 py-2">
                <div className="font-semibold">Stored organization</div>
                <div>{validation.organization.name}</div>
                <div>URN {validation.organization.urn ?? "—"} · {validation.organization.postcode ?? "postcode missing"}</div>
              </div>
              <div className="rounded-xl bg-white/70 border border-white px-3 py-2">
                <div className="font-semibold">DfE/GIAS match for stored URN</div>
                <div>{validation.dfeSchool.name}</div>
                <div>URN {validation.dfeSchool.urn} · {validation.dfeSchool.postcode ?? "postcode missing"}</div>
              </div>
            </div>
          )}
          {process.env.NODE_ENV === "development" && candidate && (
            <p className="mt-2 text-xs">
              Stronger candidate found: <strong>{candidate.name}</strong> — URN {candidate.urn}
              {candidate.postcode ? `, ${candidate.postcode}` : ""} ({candidate.match_reasons.join(", ")}).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function latestByYear<T extends { year: number }>(rows?: T[]) {
  if (!rows || rows.length === 0) return null;
  return [...rows].sort((a, b) => a.year - b.year)[rows.length - 1];
}

function formatSigned(value: number, suffix = "pp") {
  return `${value > 0 ? "+" : ""}${Math.round(value * 10) / 10}${suffix}`;
}

function DfeSchoolNarrativeCard({
  schoolName,
  schoolData,
  laBenchmarks,
  demographicCohort,
}: {
  schoolName: string;
  schoolData: SchoolKpiData | null;
  laBenchmarks: LaBenchmarkData | null;
  demographicCohort: DemographicCohort | null;
}) {
  if (!schoolData || !laBenchmarks) return null;

  const latestKs2 = latestByYear(schoolData.ks2_combined);
  const latestReading = latestByYear(schoolData.ks2_reading);
  const latestWriting = latestByYear(schoolData.ks2_writing);
  const latestMaths = latestByYear(schoolData.ks2_maths);
  const latestAttendance = latestByYear(schoolData.attendance);
  const latestPa = latestByYear(schoolData.persistent_absence);

  const laKs2 = latestKs2
    ? laBenchmarks.ks2_combined.find((row) => row.year === latestKs2.year)?.expected_standard_pct ?? null
    : null;
  const laAttendance = latestAttendance
    ? laBenchmarks.attendance.find((row) => row.year === latestAttendance.year)?.overall_pct ?? null
    : null;
  const laPa = latestPa
    ? laBenchmarks.persistent_absence.find((row) => row.year === latestPa.year)?.pct ?? null
    : null;

  const ks2Diff = latestKs2 && laKs2 !== null ? latestKs2.expected_standard_pct - laKs2 : null;
  const attendanceDiff = latestAttendance && laAttendance !== null ? latestAttendance.overall_pct - laAttendance : null;
  const paDiff = latestPa && laPa !== null ? latestPa.pct - laPa : null;

  const subjectRows = [
    latestReading ? { label: "Reading", value: latestReading.expected_standard_pct } : null,
    latestWriting ? { label: "Writing", value: latestWriting.expected_standard_pct } : null,
    latestMaths ? { label: "Maths", value: latestMaths.expected_standard_pct } : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;
  const strongest = subjectRows.length ? [...subjectRows].sort((a, b) => b.value - a.value)[0] : null;
  const weakest = subjectRows.length ? [...subjectRows].sort((a, b) => a.value - b.value)[0] : null;

  return (
    <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-indigo-600 p-2 text-white">
          <BarChart3 size={18} />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">DfE intelligence narrative — {schoolName}</h3>
          <p className="mt-1 text-sm text-gray-600">
            This is generated from validated DfE performance, attendance and census data only. Uploaded assessment captures add a second layer later; they are not required for this external view.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white bg-white/75 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Attainment lens</div>
          <p className="mt-1 text-sm text-gray-700">
            {latestKs2
              ? `Latest KS2 combined is ${latestKs2.expected_standard_pct}%${ks2Diff !== null ? ` (${formatSigned(ks2Diff)} vs ${laBenchmarks.la_name})` : ""}.`
              : "No recent KS2 combined result is available in the warehouse."}
          </p>
          {strongest && weakest && (
            <p className="mt-2 text-xs text-gray-500">
              Subject split: strongest {strongest.label} at {strongest.value}%; watch {weakest.label} at {weakest.value}%.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white bg-white/75 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">Attendance lens</div>
          <p className="mt-1 text-sm text-gray-700">
            {latestAttendance
              ? `Attendance is ${latestAttendance.overall_pct}%${attendanceDiff !== null ? ` (${formatSigned(attendanceDiff)} vs ${laBenchmarks.la_name})` : ""}.`
              : "No attendance trend is available yet."}
          </p>
          {latestPa && (
            <p className="mt-2 text-xs text-gray-500">
              Persistent absence is {latestPa.pct}%{paDiff !== null ? ` (${formatSigned(paDiff)} vs LA; lower is better)` : ""}.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-white bg-white/75 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">Comparison lens</div>
          <p className="mt-1 text-sm text-gray-700">
            Compared with {laBenchmarks.school_count} primary schools in {laBenchmarks.la_name}
            {demographicCohort ? ` and ${demographicCohort.school_count} open primary schools nationally with similar FSM/EAL${demographicCohort.sen_band !== "Unavailable" ? "/SEN" : ""} profiles.` : "."}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Provision-specific comparisons now use the DfE SEN school-level profile where available; named base/capacity details still need GIAS extended confirmation before we claim VI/HI/ASD capacity.
          </p>
        </div>
      </div>
    </div>
  );
}

type PublicDataSchoolReport = {
  id: string;
  name: string;
  urn: number | null;
  logo_url: string | null;
  website_url?: string | null;
  address?: string | null;
  contact?: {
    headteacher: string | null;
    email: string | null;
    telephone: string | null;
    website: string | null;
    address: string | null;
  };
  setup?: {
    marketing_priority: string | null;
    priority_reason: string | null;
    ofsted_result: string | null;
    ofsted_inspection_date: string | null;
    email_source: string | null;
    logo_review_status: string | null;
    data_enriched_at: string | null;
  };
  profile: {
    type_name: string | null;
    headteacher: string | null;
    telephone?: string | null;
    date_of_last_inspection: string | null;
  } | null;
  academy_history?: {
    predecessor_urn: number;
    predecessor_name: string | null;
    converted_date: string | null;
    confidence: string;
    match_reasons: string[];
  } | null;
  academy_impact?: {
    classification: "improved" | "declined" | "stable" | "too_soon" | "insufficient_data";
    conversion_date: string | null;
    predecessor_urn: number;
    predecessor_name: string | null;
    metrics: Record<string, {
      preAverage: number | null;
      postAverage: number | null;
      delta: number | null;
      preCount: number;
      postCount: number;
    }>;
    confidence: {
      cautions: string[];
      preYears: number[];
      postYears: number[];
    };
  } | null;
  latest: {
    census_year?: number | null;
    number_on_roll: number | null;
    fsm_pct: number | null;
    eal_pct: number | null;
    sen_pct: number | null;
    attendance_year?: number | null;
    attendance_pct: number | null;
    persistent_absence_pct: number | null;
    ks2_year?: number | null;
    ks2_combined_pct: number | null;
    reading_pct: number | null;
    writing_pct: number | null;
    maths_pct: number | null;
    ks4_year?: number | null;
    ks4_pupils?: number | null;
    attainment8?: number | null;
    progress8?: number | null;
    english_maths_4_plus_pct?: number | null;
    ebacc_entry_pct?: number | null;
    ebacc_aps?: number | null;
  };
  comparators: {
    similar_school_count: number;
    provision_specific: {
      sen_provision_type: string | null;
      resourced_provision_type: string | null;
      resourced_provision_on_roll: number | null;
      resourced_provision_capacity: number | null;
      sen_unit_on_roll: number | null;
      sen_unit_capacity: number | null;
      gias_last_confirmed: string | null;
      source_url: string | null;
      source_method: string | null;
      source_fetched_at: string | null;
      confidence_status: string | null;
      validation_notes: unknown[];
      sen_support?: number | null;
      ehc_plan?: number | null;
      sen_unit_flag?: number | null;
      resource_provision_flag?: number | null;
      provision_needs?: Array<{ code: string; label: string; count: number }>;
    } | null;
  };
  narrative: {
    headline: string;
    strengths: string[];
    watch: string[];
    questions: string[];
    priorityRationale?: string[];
    sourceNotes?: string[];
  };
};

type PublicDataReport = {
  parent: { id: string; name: string; logo_url: string | null };
  coverage: {
    scoped_school_count: number;
    report_school_count?: number;
    virtual_dfe_school_count?: number;
    urn_count: number;
    la_primary_count: number;
    la_maintained_primary_count: number;
    la_academy_primary_count: number;
    onboarded_maintained_coverage: string | null;
  };
  laBenchmarks: {
    la_name: string;
    primary_count: number;
    maintained_primary_count: number;
    academy_primary_count: number;
    ks2_combined_avg: number | null;
    reading_avg?: number | null;
    writing_avg?: number | null;
    maths_avg?: number | null;
    attendance_avg: number | null;
    persistent_absence_avg: number | null;
    fsm_avg: number | null;
    sen_avg: number | null;
    eal_avg: number | null;
  };
  nationalBenchmarks?: {
    academic_year_end: number | null;
    primary_count: number;
    ks2_combined_avg: number | null;
    reading_avg: number | null;
    writing_avg: number | null;
    maths_avg: number | null;
    attendance_avg: number | null;
    persistent_absence_avg: number | null;
    fsm_avg: number | null;
    sen_avg: number | null;
    eal_avg: number | null;
  };
  secondaryBenchmarks?: {
    secondary_count: number;
    ks4_year: number | null;
    attainment8_avg: number | null;
    progress8_avg: number | null;
    english_maths_4_plus_avg: number | null;
    ebacc_entry_avg: number | null;
    ebacc_aps_avg: number | null;
    attendance_avg: number | null;
    persistent_absence_avg: number | null;
  };
  phaseSummary?: {
    primary: number;
    secondary: number;
    special: number;
    other: number;
  };
  schools: PublicDataSchoolReport[];
  prioritySchools: PublicDataSchoolReport[];
  dataQuality: string[];
  yearSelection?: {
    selectedAcademicYearEnd: number | null;
    requestedAcademicYearEnd: number | null;
    availableAcademicYearEnds: number[];
  };
};

function buildDfeDerivedParsedSpreadsheet(report: PublicDataReport): ParsedSpreadsheet {
  const lookup = buildAbbrevLookup(report.schools.map((school) => ({
    id: school.id,
    name: school.name,
    urn: school.urn,
    logo_url: school.logo_url,
  })));
  const abbrevByName = new Map(Object.entries(lookup).map(([abbrev, school]) => [school.name, abbrev] as const));
  const data: ParsedSpreadsheet["data"] = {};
  const schools: string[] = [];

  for (const school of report.schools) {
    const abbrev = abbrevByName.get(school.name) ?? abbreviateSchoolName(school.name);
    schools.push(abbrev);
    data[abbrev] = {
      "Year 6": {
        cohort: {
          number_in_cohort: null,
          number_send: null,
          ehcp: null,
          number_fsm: null,
        },
        all_pupils: {
          r_are: school.latest.reading_pct,
          r_gd: null,
          w_are: school.latest.writing_pct,
          w_gd: null,
          m_are: school.latest.maths_pct,
          m_gd: null,
          c_are: school.latest.ks2_combined_pct,
          c_gd: null,
        },
        fsm6: {},
        not_fsm6: {},
      },
    };
  }

  return {
    schools,
    yearGroups: ["Year 6"],
    data,
    totalDataPoints: countSpreadsheetDataPoints(data),
    qualityFlags: report.schools
      .filter((school) => school.latest.ks2_combined_pct === null)
      .map((school) => ({
        school: abbrevByName.get(school.name) ?? abbreviateSchoolName(school.name),
        yearGroup: "Year 6",
        field: "c_are",
        issue: "No latest DfE KS2 combined RWM+ value found for this school.",
        severity: "warning" as const,
      })),
  };
}

function fmtPct(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function formatAcademicYearEnd(year: number | null | undefined) {
  if (!year) return "latest available year";
  return `${year - 1}/${String(year).slice(-2)}`;
}

function fmtNum(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toLocaleString();
}

function isSpecialPublicDataSchool(school: PublicDataSchoolReport) {
  const type = `${school.profile?.type_name ?? ""} ${school.profile?.phase_name ?? ""}`.toLowerCase();
  return type.includes("special") || ((school.latest.sen_pct ?? 0) >= 95 && type.includes("not applicable"));
}

function isSecondaryPublicDataSchool(school: PublicDataSchoolReport) {
  return school.profile?.phase_name === "Secondary" && !isSpecialPublicDataSchool(school);
}

function isPrimaryPublicDataSchool(school: PublicDataSchoolReport) {
  return school.profile?.phase_name === "Primary" && !isSpecialPublicDataSchool(school);
}

function publicDataPhaseGroups(report: PublicDataReport) {
  const primary = report.schools.filter(isPrimaryPublicDataSchool);
  const secondary = report.schools.filter(isSecondaryPublicDataSchool);
  const special = report.schools.filter(isSpecialPublicDataSchool);
  const grouped = new Set([...primary, ...secondary, ...special].map((school) => school.id));
  const other = report.schools.filter((school) => !grouped.has(school.id));
  return { primary, secondary, special, other };
}

function publicDataReportWithSchools(report: PublicDataReport, schools: PublicDataSchoolReport[]): PublicDataReport {
  return {
    ...report,
    coverage: {
      ...report.coverage,
      report_school_count: schools.length,
      scoped_school_count: schools.length,
    },
    schools,
    prioritySchools: report.prioritySchools.filter((school) => schools.some((item) => item.id === school.id)),
  };
}

function provisionSummary(school: PublicDataSchoolReport) {
  const provision = school.comparators.provision_specific;
  if (!provision) return null;
  const type = provision.resourced_provision_type ?? provision.sen_provision_type;
  if (!type) return null;
  const counts: string[] = [];
  if (provision.resource_provision_flag !== null && provision.resource_provision_flag !== undefined) {
    counts.push(`RP flag ${provision.resource_provision_flag > 0 ? "yes" : "no"}`);
  }
  if (provision.sen_unit_flag !== null && provision.sen_unit_flag !== undefined) {
    counts.push(`SEN unit flag ${provision.sen_unit_flag > 0 ? "yes" : "no"}`);
  }
  if (provision.ehc_plan !== null && provision.ehc_plan !== undefined) {
    counts.push(`${fmtNum(provision.ehc_plan)} EHCP`);
  }
  if (provision.resourced_provision_on_roll !== null || provision.resourced_provision_capacity !== null) {
    counts.push(`RP ${fmtNum(provision.resourced_provision_on_roll)}/${fmtNum(provision.resourced_provision_capacity)}`);
  }
  if (provision.sen_unit_on_roll !== null || provision.sen_unit_capacity !== null) {
    counts.push(`SEN unit ${fmtNum(provision.sen_unit_on_roll)}/${fmtNum(provision.sen_unit_capacity)}`);
  }
  return `${type}${counts.length > 0 ? ` · ${counts.join(" · ")}` : ""}`;
}

function provisionSourceLabel(school: PublicDataSchoolReport) {
  const provision = school.comparators.provision_specific;
  if (!provision) return null;
  if (provision.source_method === "bulk_export") {
    return "Source: DfE Special educational needs in England 2024/25 — school-level underlying data.";
  }
  if (provision.source_method === "gias_page_scrape") {
    return "Source: Get Information about Schools establishment profile.";
  }
  return provision.source_url ? `Source: ${provision.source_url}` : "Source-labelled SEN profile.";
}

function impactLabel(classification: NonNullable<PublicDataSchoolReport["academy_impact"]>["classification"]) {
  switch (classification) {
    case "improved":
      return "Improved after academisation";
    case "declined":
      return "Declined after academisation";
    case "stable":
      return "Broadly stable after academisation";
    case "too_soon":
      return "Too soon to judge impact";
    default:
      return "Insufficient data for impact claim";
  }
}

function impactTone(classification: NonNullable<PublicDataSchoolReport["academy_impact"]>["classification"]) {
  if (classification === "improved") return "border-emerald-100 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100";
  if (classification === "declined") return "border-red-100 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100";
  if (classification === "stable") return "border-slate-200 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100";
  return "border-amber-100 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100";
}

function SecondaryPhasePanel({
  report,
  schools,
  onSelectSchool,
}: {
  report: PublicDataReport;
  schools: PublicDataSchoolReport[];
  onSelectSchool: (schoolName: string) => void;
}) {
  const latestKs4Year = Math.max(0, ...schools.map((school) => school.latest.ks4_year ?? 0)) || report.secondaryBenchmarks?.ks4_year || null;
  const avgAtt8 = report.secondaryBenchmarks?.attainment8_avg ?? null;
  const avgEnglishMaths = report.secondaryBenchmarks?.english_maths_4_plus_avg ?? null;
  const avgEbacc = report.secondaryBenchmarks?.ebacc_entry_avg ?? null;
  const sorted = [...schools].sort((a, b) =>
    (a.latest.attainment8 ?? -1) === (b.latest.attainment8 ?? -1)
      ? a.name.localeCompare(b.name)
      : (b.latest.attainment8 ?? -1) - (a.latest.attainment8 ?? -1),
  );

  return (
    <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-sky-300">Secondary school view</div>
          <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">KS4 and attendance intelligence</h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Published DfE KS4 outcomes for {formatAcademicYearEnd(latestKs4Year)}. This is rear-view accountability data; termly assessment captures add the live current-grade view later.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <StatCard label="Secondaries" value={schools.length} source="dfe_ks4" />
          <StatCard label="Attainment 8 avg" value={avgAtt8 ?? "—"} source="dfe_ks4" />
          <StatCard label="Eng/maths 4+" value={fmtPct(avgEnglishMaths)} source="dfe_ks4" />
          <StatCard label="EBacc entry" value={fmtPct(avgEbacc)} source="dfe_ks4" />
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-950 dark:text-slate-300">
            <tr>
              <th className="w-[280px] px-3 py-3 text-left">School</th>
              <th className="px-3 py-3 text-center">KS4 pupils</th>
              <th className="px-3 py-3 text-center">Attainment 8</th>
              <th className="px-3 py-3 text-center">Progress 8</th>
              <th className="px-3 py-3 text-center">Eng/maths 4+</th>
              <th className="px-3 py-3 text-center">EBacc entry</th>
              <th className="px-3 py-3 text-center">Attendance</th>
              <th className="px-3 py-3 text-center">PA</th>
              <th className="px-3 py-3 text-left">So what?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((school) => (
              <tr key={school.id} className="bg-white dark:bg-slate-900/60">
                <td className="px-3 py-3">
                  <button type="button" onClick={() => onSelectSchool(school.name)} className="flex items-center gap-3 text-left">
                    {school.logo_url && (
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={school.logo_url} alt="" className="h-full w-full object-contain" />
                      </span>
                    )}
                    <span>
                      <span className="block font-semibold text-slate-950 hover:text-indigo-700 dark:text-white dark:hover:text-sky-300">{school.name}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">URN {school.urn ?? "—"} · NOR {fmtNum(school.latest.number_on_roll)}</span>
                    </span>
                  </button>
                </td>
                <td className="px-3 py-3 text-center font-semibold">{fmtNum(school.latest.ks4_pupils)}</td>
                <td className="px-3 py-3 text-center font-semibold">{school.latest.attainment8 ?? "—"}</td>
                <td className="px-3 py-3 text-center font-semibold">{school.latest.progress8 ?? "—"}</td>
                <td className="px-3 py-3 text-center font-semibold">{fmtPct(school.latest.english_maths_4_plus_pct)}</td>
                <td className="px-3 py-3 text-center font-semibold">{fmtPct(school.latest.ebacc_entry_pct)}</td>
                <td className="px-3 py-3 text-center font-semibold">{fmtPct(school.latest.attendance_pct)}</td>
                <td className="px-3 py-3 text-center font-semibold">{fmtPct(school.latest.persistent_absence_pct)}</td>
                <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {school.latest.attainment8 === null && school.latest.english_maths_4_plus_pct === null
                    ? "KS4 headline outcomes are not populated for this school in the current warehouse extract."
                    : "Compare headline KS4 outcomes with attendance, SEN/FSM/EAL context and school-submitted current grades before drawing conclusions."}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-100">
        Source: Schoolgle DfE warehouse `ks4_results`, `census` and `attendance`, latest available year shown. Progress 8 may remain blank if the latest DfE extract has not published or mapped that value yet.
      </div>
    </section>
  );
}

function SpecialPhasePanel({
  schools,
  onSelectSchool,
}: {
  schools: PublicDataSchoolReport[];
  onSelectSchool: (schoolName: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">Special school view</div>
        <h3 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">Context-first provision intelligence</h3>
        <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          Special schools should not be ranked against mainstream KS2/KS4 thresholds. This view starts with SEN/EHCP context, attendance, provision detail and evidence requirements.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {schools.map((school) => (
          <button
            key={school.id}
            type="button"
            onClick={() => onSelectSchool(school.name)}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-950/70 dark:hover:border-violet-500/40 dark:hover:bg-violet-950/20"
          >
            <div className="flex items-start gap-3">
              {school.logo_url && (
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={school.logo_url} alt="" className="h-full w-full object-contain" />
                </span>
              )}
              <div>
                <div className="font-semibold text-slate-950 dark:text-white">{school.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">URN {school.urn ?? "—"} · {school.profile?.type_name ?? "special school"}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <div className="rounded-lg bg-white p-2 dark:bg-slate-900"><div className="text-slate-400">NOR</div><div className="font-semibold">{fmtNum(school.latest.number_on_roll)}</div></div>
              <div className="rounded-lg bg-white p-2 dark:bg-slate-900"><div className="text-slate-400">SEN</div><div className="font-semibold">{fmtPct(school.latest.sen_pct)}</div></div>
              <div className="rounded-lg bg-white p-2 dark:bg-slate-900"><div className="text-slate-400">Attend.</div><div className="font-semibold">{fmtPct(school.latest.attendance_pct)}</div></div>
              <div className="rounded-lg bg-white p-2 dark:bg-slate-900"><div className="text-slate-400">PA</div><div className="font-semibold">{fmtPct(school.latest.persistent_absence_pct)}</div></div>
            </div>
            {provisionSummary(school) && (
              <div className="mt-3 rounded-lg border border-violet-100 bg-violet-50 p-2 text-xs text-violet-900 dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-100">
                <span className="font-semibold">Provision context: </span>{provisionSummary(school)}
                {provisionSourceLabel(school) && <div className="mt-1">{provisionSourceLabel(school)}</div>}
              </div>
            )}
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">
              Next product layer should ask for EHCP outcome progress, accredited pathways, destinations, behaviour/safeguarding trends and preparation-for-adulthood evidence.
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function PhaseAwareOverviewPanel({
  report,
  groups,
  onSelectSchool,
}: {
  report: PublicDataReport;
  groups: ReturnType<typeof publicDataPhaseGroups>;
  onSelectSchool: (schoolName: string) => void;
}) {
  const phaseCards = [
    {
      label: "Primary",
      count: groups.primary.length,
      source: "DfE KS2, census and attendance",
      description: "KS2 RWM+, reading, writing, maths, attendance, FSM/SEN/EAL context.",
    },
    {
      label: "Secondary",
      count: groups.secondary.length,
      source: "DfE KS4, census and attendance",
      description: "Attainment 8, Progress 8 where populated, English/maths threshold, EBacc and attendance.",
    },
    {
      label: "Special",
      count: groups.special.length,
      source: "DfE census, attendance and SEN provision profile",
      description: "Context-first view: SEN/EHCP, provision, attendance and evidence requirements.",
    },
  ].filter((card) => card.count > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
      <div className="flex items-start gap-4">
        {report.parent.logo_url && (
          <div className="flex h-16 w-32 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={report.parent.logo_url} alt={report.parent.name} className="h-full w-full object-contain" />
          </div>
        )}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-sky-300">Phase-aware overview</div>
          <h3 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{report.parent.name}</h3>
          <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
            Schoolgle has detected a mixed-phase organisation. Each phase uses a different accountability lens, so the product only shows relevant measures and avoids empty or misleading secondary/special panels for primary-only organisations.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {phaseCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/70">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</div>
            <div className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{card.count}</div>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{card.description}</p>
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-100">
              Source: {card.source}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {phaseCards.map((card) => {
          const schools =
            card.label === "Primary" ? groups.primary :
            card.label === "Secondary" ? groups.secondary :
            groups.special;
          return (
            <div key={`${card.label}-schools`} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <h4 className="text-sm font-semibold text-slate-950 dark:text-white">{card.label} schools</h4>
              <div className="mt-3 space-y-2">
                {schools.map((school) => (
                  <button key={school.id} type="button" onClick={() => onSelectSchool(school.name)} className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                    {school.logo_url && (
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-white p-0.5 dark:border-slate-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={school.logo_url} alt="" className="h-full w-full object-contain" />
                      </span>
                    )}
                    <span>
                      <span className="block font-medium text-slate-900 dark:text-slate-100">{school.name}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">URN {school.urn ?? "—"} · {school.profile?.type_name ?? "school"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PhaseAwarePublicDataSpine({
  report,
  onSelectSchool,
  activePhase: controlledActivePhase,
  onPhaseChange,
  selectedYear,
  onYearChange,
}: {
  report: PublicDataReport;
  onSelectSchool: (schoolName: string) => void;
  activePhase?: string;
  onPhaseChange?: (phase: string) => void;
  selectedYear?: number | null;
  onYearChange?: (year: number | null) => void;
}) {
  const groups = useMemo(() => publicDataPhaseGroups(report), [report]);
  const tabs = [
    { id: "overview", label: "Overview", count: report.schools.length },
    ...(groups.primary.length > 0 ? [{ id: "primary", label: "Primary", count: groups.primary.length }] : []),
    ...(groups.secondary.length > 0 ? [{ id: "secondary", label: "Secondary", count: groups.secondary.length }] : []),
    ...(groups.special.length > 0 ? [{ id: "special", label: "Special", count: groups.special.length }] : []),
  ];
  const hasPhaseSplit = groups.secondary.length > 0 || groups.special.length > 0;
  const [localActivePhase, setLocalActivePhase] = useState(tabs[0]?.id ?? "overview");
  const requestedActivePhase = controlledActivePhase ?? localActivePhase;
  const activePhase = tabs.some((tab) => tab.id === requestedActivePhase) ? requestedActivePhase : tabs[0]?.id ?? "overview";
  const primaryReport = publicDataReportWithSchools(report, groups.primary.length > 0 ? groups.primary : report.schools);
  const availableYears = report.yearSelection?.availableAcademicYearEnds ?? [];
  const effectiveSelectedYear = selectedYear ?? report.yearSelection?.selectedAcademicYearEnd ?? null;

  const selectPhase = (phase: string) => {
    if (controlledActivePhase === undefined) setLocalActivePhase(phase);
    onPhaseChange?.(phase);
  };

  if (!hasPhaseSplit) {
    return <DfeDerivedProductSpine report={primaryReport} onSelectSchool={onSelectSchool} />;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-700 dark:text-sky-300">Mixed-phase trust assessor</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{report.parent.name}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              This trust has more than one school phase, so Schoolgle separates the analysis rather than forcing secondary or special schools into a primary KS2 view.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <StatCard label="Primary" value={groups.primary.length} source="dfe_ks2" />
            <StatCard label="Secondary" value={groups.secondary.length} source="dfe_ks4" />
            <StatCard label="Special" value={groups.special.length} source="dfe_census" />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectPhase(tab.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  activePhase === tab.id
                    ? "border-indigo-200 bg-indigo-600 text-white dark:border-sky-500 dark:bg-sky-500"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label} <span className="ml-1 opacity-80">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold">DfE year</span>
            <select
              value={effectiveSelectedYear ?? ""}
              onChange={(event) => onYearChange?.(event.target.value ? Number(event.target.value) : null)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              disabled={!onYearChange || availableYears.length === 0}
              aria-label="Select DfE academic year"
            >
              {availableYears.length === 0 ? (
                <option value="">No DfE years found</option>
              ) : (
                availableYears.map((year) => (
                  <option key={year} value={year}>
                    {formatAcademicYearEnd(year)}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {activePhase === "overview" && <PhaseAwareOverviewPanel report={report} groups={groups} onSelectSchool={onSelectSchool} />}
      {activePhase === "primary" && <DfeDerivedProductSpine report={primaryReport} onSelectSchool={onSelectSchool} />}
      {activePhase === "secondary" && <SecondaryPhasePanel report={report} schools={groups.secondary} onSelectSchool={onSelectSchool} />}
      {activePhase === "special" && <SpecialPhasePanel schools={groups.special} onSelectSchool={onSelectSchool} />}
    </section>
  );
}

function DfeDerivedProductSpine({
  report,
  onSelectSchool,
}: {
  report: PublicDataReport;
  onSelectSchool: (schoolName: string) => void;
}) {
  const parsed = useMemo(() => buildDfeDerivedParsedSpreadsheet(report), [report]);
  const audience: OverviewAudience = /council|local authority|borough/i.test(report.parent.name) ? "local_authority" : "trust";
  const totalPupils = report.schools.reduce((sum, school) => sum + (school.latest.number_on_roll ?? 0), 0);
  const latestKs2Year = Math.max(0, ...report.schools.map((school) => school.latest.ks2_year ?? 0)) || null;
  const latestCensusYear = Math.max(0, ...report.schools.map((school) => school.latest.census_year ?? 0)) || null;
  const latestAttendanceYear = Math.max(0, ...report.schools.map((school) => school.latest.attendance_year ?? 0)) || null;
  const ks2YearLabel = formatAcademicYearEnd(latestKs2Year);
  const censusYearLabel = formatAcademicYearEnd(latestCensusYear);
  const attendanceYearLabel = formatAcademicYearEnd(latestAttendanceYear);
  const belowKs2 = report.schools.filter((school) =>
    school.latest.ks2_combined_pct !== null &&
    report.laBenchmarks.ks2_combined_avg !== null &&
    school.latest.ks2_combined_pct < report.laBenchmarks.ks2_combined_avg,
  ).length;

  return (
    <section className="bg-card border border-border rounded-2xl p-6 space-y-8">
      <SectionHeader
        number={1}
        title={audience === "local_authority" ? "Local Authority Data" : "Trust Data"}
        subtitle="Product view normalised from validated DfE data; school captures can overlay self-reported assessment later."
        complete
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-100">
        <div className="font-semibold">Validated public-data mode</div>
        <div className="mt-1">
          This first layer is rear-view public data from the Schoolgle DfE warehouse: KS2 published outcomes for {ks2YearLabel}, census context for {censusYearLabel}, and attendance/persistent absence for {attendanceYearLabel}. Uploaded assessment captures and CTF/MIS files add the current in-year view later.
        </div>
      </div>

      <TrustExecutiveOverview
        parsed={parsed}
        audience={audience}
        sourceMode="dfe"
        parentBranding={report.parent}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Schools" value={report.schools.length} sub={`${report.coverage.la_maintained_primary_count} LA maintained`} source="dfe_census" />
        <StatCard label="Year groups" value="1" sub="Y6 KS2 validated layer" source="dfe_ks2" />
        <StatCard label="Data points" value={parsed.totalDataPoints.toLocaleString()} source="dfe_ks2" />
        <StatCard label="Total pupils" value={totalPupils.toLocaleString()} sub="latest DfE NOR" source="dfe_census" />
        <StatCard label="KS2 average" value={fmtPct(report.laBenchmarks.ks2_combined_avg)} sub="LA primary comparator" source="dfe_ks2" />
        <StatCard label="Below LA KS2" value={belowKs2} sub="priority discussion" source="dfe_ks2" />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Y6 Summary - Traffic Light View</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Published DfE KS2 {ks2YearLabel} outcomes for Year 6 pupils: percentage reaching expected standard in Reading, Writing, Maths and Combined RWM+. This is a rear-view validated outcome measure, not current in-year assessment.</p>
          </div>
        </div>
        <TrafficLightGrid parsed={parsed} onSchoolClick={onSelectSchool} sourceMode="dfe" />
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Info size={10} />
          Source: DfE KS2 published results ({ks2YearLabel}). Census/NOR context elsewhere uses {censusYearLabel}; attendance uses {attendanceYearLabel}. Externally validated, not self-reported.
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/25 dark:text-amber-100">
        <div className="font-semibold">Full EYFS–Y6 heatmap needs school assessment data</div>
        <p className="mt-1">
          DfE public data gives the validated Y6 KS2 layer only. Schoolgle will not render EYFS, phonics, MTC or Y1–Y5 as blank tables because that creates noise and can imply missing performance where the data simply has not been supplied.
        </p>
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-100/75">
          Upload a school/local authority assessment capture, School Data Summary workbook, or CTF/MIS assessment export to unlock the full Schoolgle heatmap and pupil-level narrative.
        </p>
      </div>
    </section>
  );
}

function PublicDataTrustOverview({
  report,
  onSelectSchool,
  selectedYear,
  onYearChange,
}: {
  report: PublicDataReport;
  onSelectSchool: (schoolName: string) => void;
  selectedYear?: number | null;
  onYearChange?: (year: number | null) => void;
}) {
  const isLocalAuthorityReport = /council|local authority|borough/i.test(report.parent.name);
  const availableYears = report.yearSelection?.availableAcademicYearEnds ?? [];
  const effectiveSelectedYear = selectedYear ?? report.yearSelection?.selectedAcademicYearEnd ?? null;
  const ks2Distribution = [
    { band: "70%+", schools: report.schools.filter((school) => (school.latest.ks2_combined_pct ?? -1) >= 70).length },
    { band: "55–69%", schools: report.schools.filter((school) => (school.latest.ks2_combined_pct ?? -1) >= 55 && (school.latest.ks2_combined_pct ?? -1) < 70).length },
    { band: "<55%", schools: report.schools.filter((school) => school.latest.ks2_combined_pct !== null && (school.latest.ks2_combined_pct ?? 0) < 55).length },
    { band: "No KS2", schools: report.schools.filter((school) => school.latest.ks2_combined_pct === null).length },
  ];
  const belowLaKs2 = report.schools.filter((school) =>
    school.latest.ks2_combined_pct !== null &&
    report.laBenchmarks.ks2_combined_avg !== null &&
    school.latest.ks2_combined_pct < report.laBenchmarks.ks2_combined_avg,
  ).length;
  const belowLaAttendance = report.schools.filter((school) =>
    school.latest.attendance_pct !== null &&
    report.laBenchmarks.attendance_avg !== null &&
    school.latest.attendance_pct < report.laBenchmarks.attendance_avg,
  ).length;
  const highSend = report.schools.filter((school) => (school.latest.sen_pct ?? 0) >= 18).length;
  const highFsm = report.schools.filter((school) => (school.latest.fsm_pct ?? 0) >= 35).length;
  const heatmapRows = [...report.schools]
    .map((school) => {
      const riskScore =
        (school.latest.ks2_combined_pct !== null && report.laBenchmarks.ks2_combined_avg !== null && school.latest.ks2_combined_pct < report.laBenchmarks.ks2_combined_avg ? 3 : 0) +
        (school.latest.attendance_pct !== null && report.laBenchmarks.attendance_avg !== null && school.latest.attendance_pct < report.laBenchmarks.attendance_avg ? 2 : 0) +
        (school.latest.persistent_absence_pct !== null && report.laBenchmarks.persistent_absence_avg !== null && school.latest.persistent_absence_pct > report.laBenchmarks.persistent_absence_avg ? 2 : 0) +
        ((school.latest.fsm_pct ?? 0) >= 35 ? 1 : 0) +
        ((school.latest.sen_pct ?? 0) >= 18 ? 1 : 0);
      return { school, riskScore };
    })
    .sort((a, b) => b.riskScore - a.riskScore || (a.school.latest.ks2_combined_pct ?? 101) - (b.school.latest.ks2_combined_pct ?? 101) || a.school.name.localeCompare(b.school.name));

  const metricTone = (
    value: number | null,
    green: (value: number) => boolean,
    amber: (value: number) => boolean,
  ) => {
    if (value === null) return "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500";
    if (green(value)) return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100";
    if (amber(value)) return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100";
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100";
  };
  const metricChip = (value: number | null, tone: string) => (
    <span className={`inline-flex min-w-[58px] justify-center rounded-lg border px-2 py-1 text-xs font-semibold ${tone}`}>
      {fmtPct(value)}
    </span>
  );
  const benchmarkLabel = (laValue: number | null | undefined, nationalValue: number | null | undefined) => (
    <span className="mt-1 block text-[10px] normal-case leading-tight tracking-normal text-slate-500 dark:text-slate-400">
      LA {fmtPct(laValue ?? null)} · Nat {fmtPct(nationalValue ?? null)}
    </span>
  );

  return (
    <section className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/60 to-sky-50/70 p-5 shadow-sm dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:shadow-none">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-sm ${
            isLocalAuthorityReport
              ? "h-16 w-52 border-slate-900 bg-slate-950 p-3 dark:border-slate-700"
              : "h-14 w-28 border-white bg-white p-2 dark:border-slate-700"
          }`}>
            {report.parent.logo_url ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={report.parent.logo_url} alt={report.parent.name} className="h-full w-full object-contain" />
              </>
            ) : (
              <Building2 className="h-7 w-7 text-indigo-700 dark:text-sky-300" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-700 dark:text-sky-300">Public DfE Intelligence — Live</div>
            <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{report.parent.name}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                      This is generated from this organisation&apos;s child school URNs and the Schoolgle DfE warehouse. It does not use another organisation&apos;s data. Uploaded local authority/school captures and CTF files add extra layers, but this public-data report works out of the box.
            </p>
          </div>
        </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <StatCard label="Report schools" value={report.coverage.report_school_count ?? report.coverage.scoped_school_count} sub={`${report.coverage.scoped_school_count} onboarded · ${report.coverage.virtual_dfe_school_count ?? 0} DfE-only`} source="mixed" sourceLabel="Org + DfE" />
          <StatCard label="LA primaries" value={report.coverage.la_primary_count} sub={`${report.coverage.la_maintained_primary_count} LA maintained`} source="dfe_census" />
          <StatCard label="KS2 LA / national" value={`${fmtPct(report.laBenchmarks.ks2_combined_avg)} / ${fmtPct(report.nationalBenchmarks?.ks2_combined_avg ?? null)}`} sub="Combined RWM+" source="dfe_ks2" />
          <StatCard label="Attendance LA / national" value={`${fmtPct(report.laBenchmarks.attendance_avg)} / ${fmtPct(report.nationalBenchmarks?.attendance_avg ?? null)}`} sub="validated trend" source="dfe_census" />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-indigo-100 bg-white/75 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold text-slate-950 dark:text-white">DfE academic year</div>
          <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            KS2, attendance, PA, FSM, SEND and EAL are all read for this selected year where the warehouse has that source.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={effectiveSelectedYear ?? ""}
            onChange={(event) => onYearChange?.(event.target.value ? Number(event.target.value) : null)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            disabled={!onYearChange || availableYears.length === 0}
            aria-label="Select DfE academic year"
          >
            {availableYears.length === 0 ? (
              <option value="">No DfE years found</option>
            ) : (
              availableYears.map((year) => (
                <option key={year} value={year}>
                  {formatAcademicYearEnd(year)}
                </option>
              ))
            )}
          </select>
          {effectiveSelectedYear && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-500/30">
              Aligned to {formatAcademicYearEnd(effectiveSelectedYear)}
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-slate-900/80">
        <div className="text-sm font-semibold text-amber-950 dark:text-amber-100">Coverage and source note</div>
        <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">
          {report.laBenchmarks.la_name} has {report.coverage.la_primary_count} open primary schools in the warehouse, including {report.coverage.la_maintained_primary_count} LA-maintained primaries. This report includes {(report.coverage.report_school_count ?? report.coverage.scoped_school_count)} schools: {report.coverage.scoped_school_count} fully onboarded in Schoolgle and {report.coverage.virtual_dfe_school_count ?? 0} DfE-only schools pulled directly from the warehouse.
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
          {report.dataQuality.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-950 dark:text-white">{report.parent.name} public-data heatmap</h3>
            <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              This is the scalable version of the product view: one row per school, external DfE values only, sorted by combined risk rather than squeezed into unreadable bar charts.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:min-w-[520px]">
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-red-900 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
              <div className="text-2xl font-bold">{belowLaKs2}</div>
              <div>below LA KS2 avg</div>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="text-2xl font-bold">{belowLaAttendance}</div>
              <div>below LA attendance</div>
            </div>
            <div className="rounded-xl border border-violet-100 bg-violet-50 p-3 text-violet-900 dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-100">
              <div className="text-2xl font-bold">{highSend}</div>
              <div>SEND 18%+</div>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/30 dark:text-sky-100">
              <div className="text-2xl font-bold">{highFsm}</div>
              <div>FSM 35%+</div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {ks2Distribution.map((item) => (
            <div key={item.band} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-950/70">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">KS2 {item.band}</div>
              <div className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{item.schools}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="border-b border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Table colours compare against {report.laBenchmarks.la_name || "the local authority"} LA and national open-primary DfE benchmarks for {effectiveSelectedYear ? formatAcademicYearEnd(effectiveSelectedYear) : "the selected year"}.
          </div>
          <div className="max-h-[620px] overflow-auto">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-slate-100/95 text-xs uppercase tracking-wide text-slate-600 backdrop-blur dark:bg-slate-950/95 dark:text-slate-300">
                <tr>
                  <th className="w-[300px] px-3 py-3 text-left">School</th>
                  <th className="px-3 py-3 text-center">KS2 RWM+{benchmarkLabel(report.laBenchmarks.ks2_combined_avg, report.nationalBenchmarks?.ks2_combined_avg)}</th>
                  <th className="px-3 py-3 text-center">Reading{benchmarkLabel(report.laBenchmarks.reading_avg, report.nationalBenchmarks?.reading_avg)}</th>
                  <th className="px-3 py-3 text-center">Writing{benchmarkLabel(report.laBenchmarks.writing_avg, report.nationalBenchmarks?.writing_avg)}</th>
                  <th className="px-3 py-3 text-center">Maths{benchmarkLabel(report.laBenchmarks.maths_avg, report.nationalBenchmarks?.maths_avg)}</th>
                  <th className="px-3 py-3 text-center">Attend.{benchmarkLabel(report.laBenchmarks.attendance_avg, report.nationalBenchmarks?.attendance_avg)}</th>
                  <th className="px-3 py-3 text-center">PA{benchmarkLabel(report.laBenchmarks.persistent_absence_avg, report.nationalBenchmarks?.persistent_absence_avg)}</th>
                  <th className="px-3 py-3 text-center">FSM{benchmarkLabel(report.laBenchmarks.fsm_avg, report.nationalBenchmarks?.fsm_avg)}</th>
                  <th className="px-3 py-3 text-center">SEND{benchmarkLabel(report.laBenchmarks.sen_avg, report.nationalBenchmarks?.sen_avg)}</th>
                  <th className="px-3 py-3 text-left">Why it matters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {heatmapRows.map(({ school, riskScore }) => (
                  <tr key={school.id} className="bg-white transition hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/70">
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => onSelectSchool(school.name)} className="flex items-center gap-3 text-left">
                        {school.logo_url ? (
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={school.logo_url} alt="" className="h-full w-full object-contain" />
                          </span>
                        ) : (
                          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-950">
                            {school.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span>
                          <span className="block font-semibold text-slate-950 hover:text-indigo-700 dark:text-white dark:hover:text-sky-300">{school.name}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">
                            URN {school.urn ?? "—"} · NOR {fmtNum(school.latest.number_on_roll)} · {school.profile?.type_name ?? "school"}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-center">{metricChip(school.latest.ks2_combined_pct, metricTone(school.latest.ks2_combined_pct, (v) => v >= 70, (v) => v >= 55))}</td>
                    <td className="px-3 py-3 text-center">{metricChip(school.latest.reading_pct, metricTone(school.latest.reading_pct, (v) => v >= 75, (v) => v >= 60))}</td>
                    <td className="px-3 py-3 text-center">{metricChip(school.latest.writing_pct, metricTone(school.latest.writing_pct, (v) => v >= 70, (v) => v >= 55))}</td>
                    <td className="px-3 py-3 text-center">{metricChip(school.latest.maths_pct, metricTone(school.latest.maths_pct, (v) => v >= 75, (v) => v >= 60))}</td>
                    <td className="px-3 py-3 text-center">{metricChip(school.latest.attendance_pct, metricTone(school.latest.attendance_pct, (v) => v >= 95, (v) => v >= 94))}</td>
                    <td className="px-3 py-3 text-center">{metricChip(school.latest.persistent_absence_pct, metricTone(school.latest.persistent_absence_pct, (v) => v <= 15, (v) => v <= 22))}</td>
                    <td className="px-3 py-3 text-center">{metricChip(school.latest.fsm_pct, metricTone(school.latest.fsm_pct, (v) => v < 25, (v) => v < 35))}</td>
                    <td className="px-3 py-3 text-center">{metricChip(school.latest.sen_pct, metricTone(school.latest.sen_pct, (v) => v < 14, (v) => v < 22))}</td>
                    <td className="px-3 py-3">
                      <div className="max-w-[280px] text-xs text-slate-600 dark:text-slate-300">
                        {riskScore > 0 ? school.narrative.watch[0] ?? school.narrative.headline : "No major public-data red flag against these headline indicators."}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Key:</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-200 dark:bg-emerald-950 dark:ring-emerald-500/30" /> stronger / lower concern</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-amber-100 ring-1 ring-amber-200 dark:bg-amber-950 dark:ring-amber-500/30" /> watch</span>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-red-100 ring-1 ring-red-200 dark:bg-red-950 dark:ring-red-500/30" /> priority discussion</span>
          <span>Colours are a triage lens, not a judgement; context such as FSM/SEND can explain, not excuse, outcomes.</span>
        </div>
      </div>

      {report.prioritySchools.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Published DfE context flags</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Last published external outcomes only. This is where the school was in that DfE year, not a claim about the current submitted cohort.
              </p>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {report.prioritySchools.slice(0, 5).map((school, index) => (
              <button
                key={school.id}
                type="button"
                onClick={() => onSelectSchool(school.name)}
                className="rounded-xl border border-white bg-white/85 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/80 dark:shadow-none dark:hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                  {school.logo_url && (
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white p-1 dark:border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={school.logo_url} alt="" className="h-full w-full object-contain" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-950 dark:text-white">{school.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">URN {school.urn ?? "—"} · {school.profile?.type_name ?? "school"}</div>
                  </div>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-100 dark:bg-sky-950/40 dark:text-sky-200 dark:ring-sky-500/30">
                    #{index + 1}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                  Historic public-data lens: check whether current trust submissions show the newer cohort improving, holding or needing support.
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/80"><div className="text-slate-400 dark:text-slate-500">KS2 {formatAcademicYearEnd(school.latest.ks2_year)}</div><div className="font-semibold text-slate-900 dark:text-slate-100">{fmtPct(school.latest.ks2_combined_pct)}</div></div>
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/80"><div className="text-slate-400 dark:text-slate-500">Attend. {formatAcademicYearEnd(school.latest.attendance_year)}</div><div className="font-semibold text-slate-900 dark:text-slate-100">{fmtPct(school.latest.attendance_pct)}</div></div>
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/80"><div className="text-slate-400 dark:text-slate-500">Census {formatAcademicYearEnd(school.latest.census_year)}</div><div className="font-semibold text-slate-900 dark:text-slate-100">FSM {fmtPct(school.latest.fsm_pct)}</div></div>
                </div>
                <div className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-700 dark:text-sky-300">
                  Open school detail below →
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function DfeOnlySchoolTab({
  schoolKey,
  report,
}: {
  schoolKey: string;
  report: PublicDataReport | null;
}) {
  const schoolLookup = useMemo(
    () => buildAbbrevLookup((report?.schools ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      urn: item.urn,
      logo_url: item.logo_url,
    }))),
    [report?.schools],
  );
  const selectedInfo = schoolLookup[schoolKey];
  const school = report?.schools.find((item) =>
    item.name === schoolKey ||
    abbreviateSchoolName(item.name) === schoolKey ||
    item.id === selectedInfo?.id ||
    item.urn === selectedInfo?.urn,
  );

  if (!school) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        No public DfE school profile is available for {schoolKey}. Check the organisation URN and the DfE warehouse import.
      </div>
    );
  }

  const provision = provisionSummary(school);
  const isSecondary = isSecondaryPublicDataSchool(school);
  const isSpecial = isSpecialPublicDataSchool(school);
  const isPrimary = isPrimaryPublicDataSchool(school);
  const ks4YearLabel = formatAcademicYearEnd(school.latest.ks4_year);
  const ks2YearLabel = formatAcademicYearEnd(school.latest.ks2_year);
  const attendanceYearLabel = formatAcademicYearEnd(school.latest.attendance_year);
  const censusYearLabel = formatAcademicYearEnd(school.latest.census_year);
  const secondaryBenchmarks = report?.secondaryBenchmarks;
  const secondaryAttainmentGap = school.latest.attainment8 !== null && school.latest.attainment8 !== undefined && secondaryBenchmarks?.attainment8_avg !== null && secondaryBenchmarks?.attainment8_avg !== undefined
    ? Math.round((school.latest.attainment8 - secondaryBenchmarks.attainment8_avg) * 10) / 10
    : null;
  const secondaryEnglishMathsGap = school.latest.english_maths_4_plus_pct !== null && school.latest.english_maths_4_plus_pct !== undefined && secondaryBenchmarks?.english_maths_4_plus_avg !== null && secondaryBenchmarks?.english_maths_4_plus_avg !== undefined
    ? Math.round((school.latest.english_maths_4_plus_pct - secondaryBenchmarks.english_maths_4_plus_avg) * 10) / 10
    : null;
  const phaseDescription = isSecondary
    ? `Secondary view using DfE KS4 published outcomes for ${ks4YearLabel}, plus census context for ${censusYearLabel} and attendance/persistent absence for ${attendanceYearLabel}.`
    : isSpecial
      ? "Special school view using DfE census, SEN profile and attendance data. Mainstream KS2/KS4 thresholds are not used to rank this provision."
      : `Primary view using DfE KS2 combined RWM+ outcomes for ${ks2YearLabel}, plus census context for ${censusYearLabel} and attendance/persistent absence for ${attendanceYearLabel}.`;
  const phaseNarrative = isSecondary
    ? `${school.name} has Attainment 8 of ${fmtNum(school.latest.attainment8)}${secondaryAttainmentGap !== null ? ` (${formatSigned(secondaryAttainmentGap, " points")} vs trust secondary average)` : ""} and English/maths grade 4+ of ${fmtPct(school.latest.english_maths_4_plus_pct)}${secondaryEnglishMathsGap !== null ? ` (${formatSigned(secondaryEnglishMathsGap)} vs trust secondary average)` : ""}.`
    : isSpecial
      ? `${school.name} is treated as a context-first special school profile. The review should focus on provision type, EHCP/SEN context, attendance, persistent absence and safeguarding/evidence workflows rather than mainstream attainment ranking.`
      : school.narrative.headline;
  const phaseWatch = isSecondary
    ? [
        school.latest.progress8 === null || school.latest.progress8 === undefined ? "Progress 8 is not available yet in the connected public-data layer, so this view uses Attainment 8 and English/maths 4+ as the validated comparison until Progress 8 is added." : null,
        secondaryAttainmentGap !== null && secondaryAttainmentGap < -3 ? `Attainment 8 is ${Math.abs(secondaryAttainmentGap)} points below the trust secondary average.` : null,
        secondaryEnglishMathsGap !== null && secondaryEnglishMathsGap < -5 ? `English/maths grade 4+ is ${Math.abs(secondaryEnglishMathsGap)}pp below the trust secondary average.` : null,
        school.latest.persistent_absence_pct !== null && school.latest.persistent_absence_pct > 20 ? `Persistent absence is ${fmtPct(school.latest.persistent_absence_pct)}, so attendance strategy should be part of the improvement conversation.` : null,
      ].filter((item): item is string => Boolean(item))
    : isSpecial
      ? [
          school.latest.persistent_absence_pct !== null && school.latest.persistent_absence_pct > 25 ? `Persistent absence is ${fmtPct(school.latest.persistent_absence_pct)}; review provision-specific attendance barriers and support plans.` : null,
          provision ? `Provision context: ${provision}.` : "Provision context is not fully labelled yet; use SEN profile imports before making capacity or need-type claims.",
        ].filter((item): item is string => Boolean(item))
      : school.narrative.watch;
  const phaseQuestions = isSecondary
    ? [
        "Which subjects and pupil groups are driving the Attainment 8 and English/maths 4+ picture?",
        "How does current in-year teacher assessment compare with the rear-view DfE KS4 outcomes?",
        "What attendance, disadvantaged, SEND and EAL patterns explain the headline KS4 outcomes?",
      ]
    : isSpecial
      ? [
          "Are EHCP outcomes, attendance plans and provision pathways showing measurable improvement for pupils?",
          "Which needs groups require deeper review before comparing outcomes with other special schools?",
          "What evidence would leaders upload to show curriculum access, therapy/provision impact and safeguarding assurance?",
        ]
      : school.narrative.questions;
  const schoolStatCards = isSecondary
    ? [
        { label: "Attainment 8", value: fmtNum(school.latest.attainment8), sub: `Published KS4 ${ks4YearLabel}`, source: "dfe_ks4" as StatSource },
        { label: "English/maths 4+", value: fmtPct(school.latest.english_maths_4_plus_pct), sub: "Grade 4+ in English and maths", source: "dfe_ks4" as StatSource },
        { label: "Attendance", value: fmtPct(school.latest.attendance_pct), sub: `PA ${fmtPct(school.latest.persistent_absence_pct)} (${attendanceYearLabel})`, source: "dfe_census" as StatSource },
        { label: "Context", value: `FSM ${fmtPct(school.latest.fsm_pct)}`, sub: `SEND ${fmtPct(school.latest.sen_pct)} · EAL ${fmtPct(school.latest.eal_pct)}`, source: "dfe_census" as StatSource },
      ]
    : isSpecial
      ? [
          { label: "Roll", value: fmtNum(school.latest.number_on_roll), sub: school.profile?.type_name ?? "special school", source: "dfe_census" as StatSource },
          { label: "SEN profile", value: fmtPct(school.latest.sen_pct), sub: `EHCP ${fmtNum(school.comparators.provision_specific?.ehc_plan)}`, source: "dfe_census" as StatSource },
          { label: "Attendance", value: fmtPct(school.latest.attendance_pct), sub: `PA ${fmtPct(school.latest.persistent_absence_pct)} (${attendanceYearLabel})`, source: "dfe_census" as StatSource },
          { label: "Context", value: `FSM ${fmtPct(school.latest.fsm_pct)}`, sub: `EAL ${fmtPct(school.latest.eal_pct)} (${censusYearLabel})`, source: "dfe_census" as StatSource },
        ]
      : [
          { label: "KS2 combined", value: fmtPct(school.latest.ks2_combined_pct), sub: `Reading, writing & maths (${ks2YearLabel})`, source: "dfe_ks2" as StatSource },
          { label: "Attendance", value: fmtPct(school.latest.attendance_pct), sub: `PA ${fmtPct(school.latest.persistent_absence_pct)} (${attendanceYearLabel})`, source: "dfe_census" as StatSource },
          { label: "Context", value: `FSM ${fmtPct(school.latest.fsm_pct)}`, sub: `SEND ${fmtPct(school.latest.sen_pct)} · EAL ${fmtPct(school.latest.eal_pct)}`, source: "dfe_census" as StatSource },
          { label: "Roll", value: fmtNum(school.latest.number_on_roll), sub: school.profile?.type_name ?? "primary school", source: "dfe_census" as StatSource },
        ];
  const showPrimaryAcademyImpact = isPrimary && school.academy_impact;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50 p-5 shadow-sm dark:border-slate-700 dark:from-slate-950 dark:to-slate-900 dark:shadow-none">
        <div className="flex items-start gap-4">
          {school.logo_url && (
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white p-1.5 dark:border-slate-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={school.logo_url} alt="" className="h-full w-full object-contain" />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">DfE-backed school view</div>
            <h3 className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{school.name}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {phaseDescription} Uploads/CTF files can enrich this with the current in-year view later.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {schoolStatCards.map((card) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              sub={card.sub}
              source={card.source}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h4 className="text-base font-semibold text-foreground">DfE public-data narrative</h4>
          <p className="mt-1 text-xs text-muted-foreground">
            Rule-based summary from validated DfE rows for the selected year. Generated governor reports use the OpenRouter-backed product workflow separately.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{phaseNarrative}</p>
          {phaseWatch.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-amber-700 dark:text-amber-200">
              {phaseWatch.map((item) => <li key={item}>• {item}</li>)}
            </ul>
          )}
          {(school.narrative.priorityRationale?.length ?? 0) > 0 && (
            <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-500/30 dark:bg-sky-950/30 dark:text-sky-100">
              <div className="font-semibold">Why this school was flagged</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {school.narrative.priorityRationale?.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {phaseQuestions.length > 0 && (
              <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-100">
              <div className="font-semibold">Questions for a school improvement conversation</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {phaseQuestions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h4 className="text-base font-semibold text-foreground">Context guardrails</h4>
          {provision ? (
            <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 p-3 text-sm text-violet-950 dark:border-violet-500/30 dark:bg-violet-950/30 dark:text-violet-100">
              <div className="font-semibold">DfE SEN provision context</div>
              <div className="mt-1">{provision}</div>
              <div className="mt-2 text-xs text-violet-700 dark:text-violet-300">
                Confidence: {school.comparators.provision_specific?.confidence_status ?? "source-labelled"}
                {school.comparators.provision_specific?.gias_last_confirmed ? ` · confirmed ${school.comparators.provision_specific.gias_last_confirmed}` : ""}
              </div>
              {provisionSourceLabel(school) && (
                <div className="mt-1 text-xs text-violet-700 dark:text-violet-200">{provisionSourceLabel(school)}</div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              SEN school-level profile is imported, but this URN is not flagged as having specialist SEN unit/resource provision in the DfE 2024/25 SEN file.
            </p>
          )}
          {school.academy_history && !isSpecial && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
              <div className="font-semibold">Academy lineage</div>
              <div className="mt-1">
                Current URN {school.urn} links to predecessor URN {school.academy_history.predecessor_urn}
                {school.academy_history.predecessor_name ? ` (${school.academy_history.predecessor_name})` : ""}.
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Match: {school.academy_history.confidence}; conversion/open date {school.academy_history.converted_date ?? "not recorded"}.
              </div>
            </div>
          )}
          {showPrimaryAcademyImpact && (
            <div className={`mt-3 rounded-xl border p-3 text-sm ${impactTone(school.academy_impact.classification)}`}>
              <div className="font-semibold">{impactLabel(school.academy_impact.classification)}</div>
              <div className="mt-1">
                KS2 combined: pre {fmtPct(school.academy_impact.metrics.ks2CombinedExpectedPct?.preAverage ?? null)}
                {" "}→ post {fmtPct(school.academy_impact.metrics.ks2CombinedExpectedPct?.postAverage ?? null)}
                {school.academy_impact.metrics.ks2CombinedExpectedPct?.delta !== null && school.academy_impact.metrics.ks2CombinedExpectedPct?.delta !== undefined
                  ? ` (${school.academy_impact.metrics.ks2CombinedExpectedPct.delta >= 0 ? "+" : ""}${school.academy_impact.metrics.ks2CombinedExpectedPct.delta}pp)`
                  : ""}
              </div>
              {school.academy_impact.confidence.cautions.length > 0 && (
                <div className="mt-2 text-xs opacity-80">
                  Caution: {school.academy_impact.confidence.cautions.map((item) => item.replaceAll("_", " ")).join(", ")}.
                </div>
              )}
            </div>
          )}
          {(school.narrative.sourceNotes?.length ?? 0) > 0 && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100">
              <div className="font-semibold">Source-labelled evidence notes</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {school.narrative.sourceNotes?.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KS2TrackRecordChart({ school, abbrev, urn, ks2Results, selfReports, selfReportLabels }: {
  school: string;
  // abbrev is optional — previously the only URN resolution path was via
  // abbrevLookup[abbrev]. Now we accept urn directly so any school with a
  // valid URN can render this chart without being in the hardcoded list.
  abbrev?: string;
  urn?: number;
  ks2Results: KS2Result[];
  selfReports: {
    autumn_term?: { combined: number | null } | null;
    mid_year?: { combined: number | null } | null;
  } | null;
  selfReportLabels?: SelfReportLabels;
}) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  // Resolve URN: explicit prop takes precedence, fall back to abbrev lookup.
  const schoolUrn = urn ?? (abbrev ? abbrevLookup[abbrev]?.urn : undefined);
  if (!schoolUrn) return null;
  const info = { urn: schoolUrn };

  const ks2Years = [2023, 2024, 2025];

  const ks2Combined = ks2Years.map((year) => getKs2CombinedForUrn(ks2Results, info.urn, year)).filter((v): v is number => v !== null);
  const bestEverKs2 = ks2Combined.length > 0 ? Math.max(...ks2Combined) : null;

  const autumnCombined = selfReports?.autumn_term?.combined ?? null;
  const midYearCombined = selfReports?.mid_year?.combined ?? null;
  const hasAutumnSelfReport = autumnCombined !== null;
  const hasMidYearSelfReport = midYearCombined !== null;
  const autumnLabel = captureDisplayName('autumn_term', selfReportLabels);
  const midYearLabel = captureDisplayName('mid_year', selfReportLabels);

  // Flag when a self-report is more than 10pp above the best-ever DfE-validated KS2 result.
  const isAutumnSuspect = autumnCombined !== null && bestEverKs2 !== null && autumnCombined > bestEverKs2 + 10;
  const isMidYearSuspect = midYearCombined !== null && bestEverKs2 !== null && midYearCombined > bestEverKs2 + 10;

  // Movement between the two self-reports — the forensic signal David is looking for.
  const hasBothSelfReports = autumnCombined !== null && midYearCombined !== null;
  const selfReportDelta = hasBothSelfReports ? (midYearCombined as number) - (autumnCombined as number) : null;

  type BarKind = 'dfe' | 'autumn' | 'mid_year';
  const barData: Array<{ name: string; combined: number | null; kind: BarKind; suspect?: boolean }> = [
    ...ks2Years.map((year) => ({
      name: `KS2 ${year}`,
      combined: getKs2CombinedForUrn(ks2Results, info.urn, year),
      kind: 'dfe' as const,
    })),
    ...(hasAutumnSelfReport ? [{ name: autumnLabel, combined: autumnCombined, kind: 'autumn' as const, suspect: isAutumnSuspect }] : []),
    ...(hasMidYearSelfReport ? [{ name: midYearLabel, combined: midYearCombined, kind: 'mid_year' as const, suspect: isMidYearSuspect }] : []),
  ].reverse(); // Most recent at top

  const CustomBar = (props: {
    x?: number; y?: number; width?: number; height?: number;
    combined?: number | null; kind?: BarKind; suspect?: boolean;
  }) => {
    const { x = 0, y = 0, width = 0, height = 0, combined, kind, suspect } = props;
    if (combined === null || combined === undefined) return null;
    let fill = '#3B82F6'; // DfE blue
    if (kind === 'autumn') fill = suspect ? '#EF4444' : '#F59E0B'; // amber / red if suspect
    if (kind === 'mid_year') fill = suspect ? '#EF4444' : '#A855F7'; // purple / red if suspect
    return (
      <g>
        <rect x={x} y={y + height * 0.2} width={width} height={height * 0.6} fill={fill} rx={3} opacity={0.85} />
      </g>
    );
  };

  const headlinePct = midYearCombined ?? autumnCombined;
  const headlineLabel = midYearCombined !== null ? midYearLabel : autumnCombined !== null ? autumnLabel : null;
  const headlineSuspect = (midYearCombined !== null && isMidYearSuspect) || (midYearCombined === null && isAutumnSuspect);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/85">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{abbrev}</div>
          <div className="text-xs text-gray-500 dark:text-slate-300">{school}</div>
          <div className="text-[10px] text-gray-400 dark:text-slate-500">URN {info.urn}</div>
        </div>
        {headlinePct !== null && headlineLabel && (
          <div className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${headlineSuspect ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100' : headlineLabel === 'Mid-Year' ? 'border border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-950/30 dark:text-purple-100' : 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100'}`}>
            {headlineLabel}: {headlinePct}%
            {headlineSuspect && <span className="ml-1">⚠ above track record</span>}
          </div>
        )}
      </div>

      {isMidYearSuspect && (
        <div className="mb-2 flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
          <AlertTriangle size={10} />
          {midYearLabel} ({midYearCombined}%) exceeds best-ever KS2 ({bestEverKs2}%) by {midYearCombined !== null && bestEverKs2 !== null ? Math.round(midYearCombined - bestEverKs2) : 0}pp
        </div>
      )}
      {isAutumnSuspect && !isMidYearSuspect && (
        <div className="mb-2 flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100">
          <AlertTriangle size={10} />
          {autumnLabel} ({autumnCombined}%) exceeds best-ever KS2 ({bestEverKs2}%) by {autumnCombined !== null && bestEverKs2 !== null ? Math.round(autumnCombined - bestEverKs2) : 0}pp
        </div>
      )}
      {selfReportDelta !== null && Math.abs(selfReportDelta) >= 5 && (() => {
        // Colour by magnitude, not direction. A +22pp jump in one term should feel
        // suspect, not celebratory — even though it's technically "positive".
        const absDelta = Math.abs(selfReportDelta);
        const tone = selfReportDelta < 0
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100'      // any downward move — conversation needed
          : absDelta >= 15 ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-100'   // 15pp+ up — almost certainly not real in one term
          : absDelta >= 10 ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-100' // 10-15pp up — worth probing
          : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100';            // 5-10pp — plausible progression
        const prompt = selfReportDelta < 0
          ? 'Revised downward — worth a discussion with the Head about what changed.'
          : absDelta >= 15
            ? 'This is a very large single-term movement. Ask the head to explain what changed in teaching, intervention, or assessment standard before accepting the Mid-Year figure.'
            : absDelta >= 10
              ? 'Notable jump — probe what interventions or re-assessments drove it. Request a moderated writing sample.'
              : 'Plausible as a term\'s progress. Validate with a moderated sample.';
        return (
          <div className={`mb-2 flex items-start gap-1 text-xs rounded px-2 py-1 border ${tone}`}>
            <AlertTriangle size={10} className="mt-0.5 flex-shrink-0" />
            <span><strong>Self-report moved {selfReportDelta >= 0 ? '+' : ''}{selfReportDelta}pp</strong> between {autumnLabel} ({autumnCombined}%) and {midYearLabel} ({midYearCombined}%). {prompt}</span>
          </div>
        );
      })()}

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={true} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={110} axisLine={false} tickLine={false} />
          <ReferenceLine x={61} stroke="#9CA3AF" strokeDasharray="4 4" label={{ value: "Nat 61%", fontSize: 10, fill: "#9CA3AF", position: "right" }} />
          <Tooltip formatter={(val) => [`${val}%`, "Combined"]} contentStyle={{ fontSize: "12px", borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--foreground))" }} />
          <Bar dataKey="combined" shape={<CustomBar />} label={{ position: "right", fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-gray-400 dark:text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> DfE validated</span>
        {hasAutumnSelfReport && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> {autumnLabel}</span>}
        {hasMidYearSelfReport && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" /> {midYearLabel}</span>}
        {(isAutumnSuspect || isMidYearSuspect) && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Suspect (10pp+ above track record)</span>}
      </div>
    </div>
  );
}

// ─── Phase 2: FSM Trend Chart ────────────────────────────────────────────────

// Slot that mounts CapturesPanel for the active school. Extracted so we can
// useMemo the auth headers object — inlining it caused a new ref every render,
// which in turn caused CapturesPanel's useEffect to refetch on every render.
function SchoolCapturesPanelSlot({ school, urnToOrgId, authToken }: {
  school: string;
  urnToOrgId?: Record<number, string>;
  authToken?: string;
}) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const info = abbrevLookup[school];
  const schoolOrgId = info?.urn ? urnToOrgId?.[info.urn] : undefined;
  const authHeaders = useMemo<HeadersInit>(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authToken) h['Authorization'] = `Bearer ${authToken}`;
    return h;
  }, [authToken]);
  if (!schoolOrgId || !authToken) return null;
  return (
    <div className="mb-6">
      <CapturesPanel
        organizationId={schoolOrgId}
        schoolName={info?.name ?? school}
        authHeaders={authHeaders}
        emptyStateNote="This only lists captures created directly for this school. The report can still use the selected trust-wide spreadsheet shown above."
      />
    </div>
  );
}

// Demographic snapshot card — purely external (DfE Annual School Census).
// Renders for any school with a URN that has census data, no self-report required.
// Shows latest-year NOR, FSM%, EAL%, SEND% with 3-year change indicators.
//
// Why this card exists: on the no-spreadsheet path the report was sparse. The
// census table already has eal_pct / sen_pct / number_on_roll — showing them
// makes the report feel "wow, you already know all this about my school"
// without any data entry. External tier, always safe to render.
function DemographicSnapshotCard({ urn, label, census }: {
  urn: number;
  label: string;
  census: CensusRecord[];
}) {
  const schoolCensus = census
    .filter((c) => c.urn === urn)
    .sort((a, b) => a.academicYearEnd - b.academicYearEnd);
  if (schoolCensus.length === 0) return null;

  const latest = schoolCensus[schoolCensus.length - 1];
  const threeYearsAgo = schoolCensus[Math.max(0, schoolCensus.length - 4)];
  const yearsOfData = schoolCensus.length;

  // Change since earliest available year (capped at ~3 years back).
  const delta = (latestVal: number | null, baselineVal: number | null): number | null => {
    if (latestVal == null || baselineVal == null) return null;
    return Math.round((latestVal - baselineVal) * 10) / 10;
  };

  const norDelta = delta(latest.numberOnRoll, threeYearsAgo.numberOnRoll);
  const fsmDelta = delta(latest.fsmPct, threeYearsAgo.fsmPct);
  const ealDelta = delta(latest.ealPct, threeYearsAgo.ealPct);
  const senDelta = delta(latest.senPct, threeYearsAgo.senPct);

  const formatDelta = (d: number | null, suffix: string): string => {
    if (d === null) return '';
    if (d === 0) return 'no change';
    const sign = d > 0 ? '+' : '';
    return `${sign}${d}${suffix} over ${yearsOfData} yr`;
  };

  const deltaColor = (d: number | null, good: 'up' | 'down'): string => {
    if (d === null || d === 0) return 'text-gray-400';
    const isPositiveMove = good === 'up' ? d > 0 : d < 0;
    return isPositiveMove ? 'text-emerald-600' : 'text-rose-600';
  };

  type Metric = {
    label: string;
    value: string;
    deltaText: string;
    deltaClass: string;
    hint: string;
  };
  const metrics: Metric[] = [
    {
      label: 'Number on roll',
      value: latest.numberOnRoll != null ? String(latest.numberOnRoll) : '—',
      deltaText: formatDelta(norDelta, ''),
      deltaClass: deltaColor(norDelta, 'up'),
      hint: 'Pupils enrolled in the DfE January census',
    },
    {
      label: 'FSM (Ever-6)',
      value: latest.fsmPct != null ? `${Math.round(latest.fsmPct * 10) / 10}%` : '—',
      deltaText: formatDelta(fsmDelta, 'pp'),
      deltaClass: deltaColor(fsmDelta, 'down'),
      hint: 'Pupils eligible for free school meals in the last 6 years — proxy for deprivation',
    },
    {
      label: 'EAL',
      value: latest.ealPct != null ? `${Math.round(latest.ealPct * 10) / 10}%` : '—',
      deltaText: formatDelta(ealDelta, 'pp'),
      deltaClass: 'text-gray-500',
      hint: 'Pupils with English as an Additional Language',
    },
    {
      label: 'SEND',
      value: latest.senPct != null ? `${Math.round(latest.senPct * 10) / 10}%` : '—',
      deltaText: formatDelta(senDelta, 'pp'),
      deltaClass: 'text-gray-500',
      hint: 'Pupils with Special Educational Needs or Disabilities',
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800">{label}</h4>
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">
          {latest.academicYearEnd} census
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} title={m.hint}>
            <div className="text-[11px] text-gray-500">{m.label}</div>
            <div className="text-xl font-semibold text-gray-900 tabular-nums">{m.value}</div>
            {m.deltaText && (
              <div className={`text-[10px] ${m.deltaClass}`}>{m.deltaText}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FsmTrendChart({ abbrev, urn, label, census, selfReportFsmPcts, selfReportLabels }: {
  abbrev?: string;
  urn?: number;
  label?: string;
  census: CensusRecord[];
  selfReportFsmPcts?: { autumn_term: number | null; mid_year: number | null };
  selfReportLabels?: SelfReportLabels;
}) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const schoolUrn = urn ?? (abbrev ? abbrevLookup[abbrev]?.urn : undefined);
  if (!schoolUrn) return null;
  const display = label ?? abbrev ?? `URN ${schoolUrn}`;

  const schoolCensus = census
    .filter((c) => c.urn === schoolUrn && c.fsmPct !== null)
    .sort((a, b) => a.academicYearEnd - b.academicYearEnd);

  if (schoolCensus.length === 0) return null;

  // Build chart data with DfE-validated census as the base line.
  type Row = { year: string; fsm: number | null; autumnSelf?: number | null; midYearSelf?: number | null };
  const chartData: Row[] = schoolCensus.map((c) => ({
    year: String(c.academicYearEnd),
    fsm: c.fsmPct !== null ? Math.round(c.fsmPct * 10) / 10 : null,
  }));

  // Append Autumn + Mid-Year self-report points. Both are in academic year 2026
  // (this school year) but shown as separate x-axis categories so the eye sees
  // "DfE trajectory" vs "what the school is claiming now".
  const autumnFsm = selfReportFsmPcts?.autumn_term ?? null;
  const midYearFsm = selfReportFsmPcts?.mid_year ?? null;
  const hasAutumnSelfReport = autumnFsm !== null;
  const hasMidYearSelfReport = midYearFsm !== null;
  const autumnLabel = captureDisplayName('autumn_term', selfReportLabels);
  const midYearLabel = captureDisplayName('mid_year', selfReportLabels);
  if (hasAutumnSelfReport) chartData.push({ year: autumnLabel, fsm: null, autumnSelf: autumnFsm });
  if (hasMidYearSelfReport) chartData.push({ year: midYearLabel, fsm: null, midYearSelf: midYearFsm });

  const plottedValues = chartData.flatMap((row) =>
    [row.fsm, row.autumnSelf, row.midYearSelf].filter((value): value is number => typeof value === "number"),
  );
  const minValue = plottedValues.length ? Math.min(...plottedValues) : 0;
  const maxValue = plottedValues.length ? Math.max(...plottedValues) : 60;
  const padding = Math.max(2, (maxValue - minValue) * 0.35);
  const yMin = Math.max(0, Math.floor(minValue - padding));
  const yMax = Math.min(100, Math.ceil(maxValue + padding));
  const yDomain: [number, number] = yMax - yMin < 8
    ? [Math.max(0, Math.floor(minValue - 3)), Math.min(100, Math.ceil(maxValue + 3))]
    : [yMin, yMax];

  // Watch for divergence — if the latest DfE census is materially different from
  // the Mid-Year self-report, that's worth surfacing.
  const latestDfE = schoolCensus[schoolCensus.length - 1]?.fsmPct ?? null;
  const divergence = (latestDfE !== null && midYearFsm !== null) ? Math.round((midYearFsm - latestDfE) * 10) / 10 : null;
  const divergenceFlag = divergence !== null && Math.abs(divergence) >= 5;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-gray-800 text-sm">{display} — FSM % trend</div>
        {divergenceFlag && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
            Self-report {divergence! > 0 ? '+' : ''}{divergence}pp vs DfE
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis domain={yDomain} tick={{ fontSize: 9 }} allowDecimals />
          <Tooltip formatter={(val, name) => [`${val}%`, name === 'fsm' ? 'DfE FSM' : name === 'autumnSelf' ? autumnLabel : midYearLabel]} />
          <Line type="monotone" dataKey="fsm" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2.5, fill: '#3B82F6' }} connectNulls={false} />
          {hasAutumnSelfReport && <Line type="monotone" dataKey="autumnSelf" stroke="#F59E0B" strokeWidth={0} dot={{ r: 4, fill: '#F59E0B', stroke: '#F59E0B' }} />}
          {hasMidYearSelfReport && <Line type="monotone" dataKey="midYearSelf" stroke="#A855F7" strokeWidth={0} dot={{ r: 4, fill: '#A855F7', stroke: '#A855F7' }} />}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> DfE census</span>
        {hasAutumnSelfReport && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> {autumnLabel}</span>}
        {hasMidYearSelfReport && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> {midYearLabel}</span>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

// Connector stored in Supabase `app_connectors` table per organization.
// On page load, we fetch the connector config from the API, then fetch
// the file live from Google Drive. No file content stored anywhere.
// ─── School Data Summary Parser ──────────────────────────────────────────────
// Parses per-school files (LGPS / Grove House Data Summary style)
// Each sheet is a year group. Row structure per sheet (1-indexed):
//   Row 4: "End of previous year"
//   Row 5: "Autumn Term"
//   Row 6: "Mid year"
//   Row 7: "End of year"  (EOY current)
//   Row 8: "Target"
// For Y6 sheets, additional rows may include KS1 and EYFS baseline data.
//
// Columns split: All pupils | FSM6 | Not FSM6
// Subject order: R ARE, R GD, W ARE, W GD, M ARE, M GD, C ARE, C GD, [Phonics or MTC]

const DATA_SUMMARY_YEAR_GROUP_MAP: Record<string, string> = {
  'eyfs': 'EYFS', 'ey': 'EYFS', 'reception': 'EYFS',
  'year 1': 'Y1', 'y1': 'Y1', 'yr 1': 'Y1',
  'year 2': 'Y2', 'y2': 'Y2', 'yr 2': 'Y2',
  'year 3': 'Y3', 'y3': 'Y3', 'yr 3': 'Y3',
  'year 4': 'Y4', 'y4': 'Y4', 'yr 4': 'Y4',
  'year 5': 'Y5', 'y5': 'Y5', 'yr 5': 'Y5',
  'year 6': 'Y6', 'y6': 'Y6', 'yr 6': 'Y6',
};

function normaliseSheetName(name: string): string | null {
  const lower = name.trim().toLowerCase().replace(/[\s-]+/g, ' ');
  for (const [key, val] of Object.entries(DATA_SUMMARY_YEAR_GROUP_MAP)) {
    if (lower === key || lower.includes(key)) return val;
  }
  return null;
}

function extractTermScores(row: unknown[], startCol: number, hasPhonicsOrMtc: boolean): TermSubjectScores {
  const n = (idx: number) => {
    const v = row[startCol + idx];
    if (v === null || v === undefined || v === '') return null;
    const num = typeof v === 'number' ? v : Number(String(v).replace(/%/g, '').trim());
    if (!Number.isFinite(num)) return null;
    // If stored as decimal (0-1 range), convert to %
    if (num > 0 && num <= 1) return Math.round(num * 10000) / 100;
    return Math.round(num * 100) / 100;
  };
  const result: TermSubjectScores = {
    reading:    n(0),
    reading_gd: n(1),
    writing:    n(2),
    writing_gd: n(3),
    maths:      n(4),
    maths_gd:   n(5),
    combined:   n(6),
    combined_gd: n(7),
  };
  if (hasPhonicsOrMtc) {
    result.phonics = n(8);
    result.mtc     = n(8);
  }
  return result;
}

function parseSchoolDataSummary(workbook: XLSX.WorkBook, schoolAbbrev: string, fileName: string): SchoolDataSummary {
  const progressions: YearGroupProgression[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ygNorm = normaliseSheetName(sheetName);
    if (!ygNorm) continue;

    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as unknown[][];

    // Find the row offsets by scanning for keyword rows
    const ROW_KEYWORDS: { key: string; term: TermData['term']; label: string; tier: ReliabilityTier }[] = [
      { key: 'end of previous year', term: 'eoy_prev',     label: 'EOY (previous)',  tier: 'self_reported' },
      { key: 'autumn',               term: 'autumn',       label: 'Autumn Term',     tier: 'self_reported' },
      { key: 'mid year',             term: 'mid_year',     label: 'Mid-year',        tier: 'self_reported' },
      { key: 'end of year',          term: 'eoy_current',  label: 'EOY',             tier: 'self_reported' },
      { key: 'target',               term: 'eoy_target',   label: 'Target',          tier: 'self_reported' },
    ];

    // Determine column layout — look for a header row that has "r are", "reading" or similar
    // Default: All pupils from col 1, FSM6 from col 9 or 10, Not FSM6 further right
    // We'll detect by scanning the first 30 rows for a header
    let colOffsetAll = 1;
    let colOffsetFsm = 9;
    let colOffsetNotFsm = 17;
    let hasPhonicsOrMtc = ygNorm === 'Y1' || ygNorm === 'Y2' || ygNorm === 'Y4';

    for (let r = 0; r < Math.min(rows.length, 30); r++) {
      const row = rows[r] ?? [];
      const cells = row.map(c => String(c ?? '').toLowerCase());
      const rIdx = cells.findIndex(c => c.includes('r are') || (c.includes('reading') && cells.some(x => x.includes('are'))));
      if (rIdx > 0) {
        colOffsetAll = rIdx;
        // The FSM6 block should start ~9 or 10 columns later
        const fsm6Idx = cells.findIndex((c, i) => i > rIdx + 6 && (c.includes('r are') || c.includes('reading')));
        if (fsm6Idx > 0) {
          colOffsetFsm = fsm6Idx;
          const notFsmIdx = cells.findIndex((c, i) => i > fsm6Idx + 6 && (c.includes('r are') || c.includes('reading')));
          if (notFsmIdx > 0) colOffsetNotFsm = notFsmIdx;
        }
        break;
      }
    }

    const terms: TermData[] = [];
    let ks1Baseline: Ks1Baseline | undefined;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const label = String(row[0] ?? '').toLowerCase().trim();

      const termDef = ROW_KEYWORDS.find(k => label.includes(k.key));
      if (termDef) {
        const cohortSizeRaw = row[colOffsetAll - 1];
        const cohortSize = typeof cohortSizeRaw === 'number' ? cohortSizeRaw : (cohortSizeRaw ? Number(String(cohortSizeRaw).replace(/\D/g, '')) || null : null);
        terms.push({
          term: termDef.term,
          label: termDef.label,
          cohortSize,
          allPupils: extractTermScores(row, colOffsetAll, hasPhonicsOrMtc),
          fsm6:      extractTermScores(row, colOffsetFsm, hasPhonicsOrMtc),
          nonFsm6:   extractTermScores(row, colOffsetNotFsm, hasPhonicsOrMtc),
          tier: termDef.tier,
        });
        continue;
      }

      // For Y6 sheet: detect KS1 baseline row
      if (ygNorm === 'Y6' && !ks1Baseline) {
        if (label.includes('ks1') || label.includes('key stage 1') || label.includes('ks 1')) {
          const yearMatch = label.match(/(\d{4})[\/\-](\d{2,4})/);
          const yearStr = yearMatch ? `${yearMatch[1]}/${yearMatch[2].length === 2 ? yearMatch[2] : yearMatch[2].slice(2)}` : '2021/22';
          const s = extractTermScores(row, colOffsetAll, false);
          ks1Baseline = {
            year: yearStr,
            reading:  s.reading ?? null,
            writing:  s.writing ?? null,
            maths:    s.maths ?? null,
            combined: s.combined ?? null,
            tier: 'external', // KS1 2021/22 = last statutory moderated year
          };
        }
      }
    }

    if (terms.length > 0) {
      progressions.push({ yearGroup: ygNorm, terms, ks1Baseline });
    }
  }

  return { schoolAbbrev, fileName, yearGroupProgressions: progressions };
}

// ─── Intra-Year Progression Component ────────────────────────────────────────

const OUTLIER_THRESHOLDS = { amber: 5, red: 8 } as const;

function IntraYearProgressionSection({ summary }: { summary: SchoolDataSummary | null }) {
  if (!summary || summary.yearGroupProgressions.length === 0) {
    return (
      <div className="bg-muted/20 border border-dashed border-border rounded-2xl p-6 text-center">
        <div className="text-sm text-muted-foreground">No intra-year progression data available.</div>
        <div className="text-xs text-muted-foreground/60 mt-1">Connect a School Data Summary file in the connector strip above to unlock this section.</div>
      </div>
    );
  }

  const SUBJECTS = [
    { key: 'reading' as keyof TermSubjectScores,  label: 'Reading',  color: 'text-blue-700'  },
    { key: 'writing' as keyof TermSubjectScores,  label: 'Writing',  color: 'text-red-700'   },
    { key: 'maths'   as keyof TermSubjectScores,  label: 'Maths',    color: 'text-emerald-700'},
    { key: 'combined' as keyof TermSubjectScores, label: 'Combined', color: 'text-purple-700' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
    >
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase tracking-wider">Intra-Year Progression</span>
          <TierPill tier="self_reported" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-1">Autumn → Mid-year → Target</h3>
        <p className="text-sm text-muted-foreground mb-4">Term-on-term progression from the school&apos;s own Data Summary. Every number is self-reported. Typical Autumn → Mid-year gain is 3–5pp per subject.</p>

        <TierLegendBar />

        <div className="space-y-6 mt-6">
          {summary.yearGroupProgressions.map((yg) => {
            const autumn  = yg.terms.find(t => t.term === 'autumn');
            const midYear = yg.terms.find(t => t.term === 'mid_year');
            const target  = yg.terms.find(t => t.term === 'eoy_target');
            const eoyPrev = yg.terms.find(t => t.term === 'eoy_prev');

            // Calculate Autumn → Mid-year deltas per subject
            const deltas = SUBJECTS.map(subj => {
              const aVal = autumn?.allPupils[subj.key] ?? null;
              const mVal = midYear?.allPupils[subj.key] ?? null;
              const delta = aVal !== null && mVal !== null ? Math.round((mVal as number) - (aVal as number)) : null;
              const isOutlierRed    = delta !== null && Math.abs(delta) > OUTLIER_THRESHOLDS.red;
              const isOutlierAmber  = delta !== null && !isOutlierRed && Math.abs(delta) > OUTLIER_THRESHOLDS.amber;
              return { ...subj, aVal, mVal, delta, isOutlierRed, isOutlierAmber };
            });

            const hasAnyData = yg.terms.some(t => Object.values(t.allPupils).some(v => v !== null));
            if (!hasAnyData) return null;

            return (
              <div key={yg.yearGroup} className="border border-border rounded-xl overflow-hidden">
                {/* Year group header */}
                <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{yg.yearGroup}</span>
                    {autumn?.cohortSize && (
                      <span className="text-xs text-muted-foreground">({autumn.cohortSize} pupils)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {deltas.some(d => d.isOutlierRed) && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 uppercase tracking-wider">Significant outlier</span>
                    )}
                    {!deltas.some(d => d.isOutlierRed) && deltas.some(d => d.isOutlierAmber) && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-300 uppercase tracking-wider">Outlier — check</span>
                    )}
                  </div>
                </div>

                {/* KS1 baseline anchor for Y6 */}
                {yg.ks1Baseline && yg.yearGroup === 'Y6' && (
                  <div className="px-5 py-3 bg-emerald-50/40 border-b border-emerald-200/60">
                    <div className="flex items-center gap-2 mb-1">
                      <TierPill tier="external" />
                      <span className="text-xs font-semibold text-emerald-800">KS1 {yg.ks1Baseline.year} — externally moderated anchor (last statutory year)</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      {[
                        { l: 'Reading',  v: yg.ks1Baseline.reading,  mid: midYear?.allPupils.reading ?? null  },
                        { l: 'Writing',  v: yg.ks1Baseline.writing,  mid: midYear?.allPupils.writing ?? null  },
                        { l: 'Maths',    v: yg.ks1Baseline.maths,    mid: midYear?.allPupils.maths   ?? null  },
                        { l: 'Combined', v: yg.ks1Baseline.combined, mid: midYear?.allPupils.combined ?? null },
                      ].map(({ l, v, mid }) => {
                        const gap = v !== null && mid !== null ? Math.round((mid as number) - (v as number)) : null;
                        return (
                          <div key={l} className="bg-white rounded-lg border border-emerald-200 p-2.5">
                            <div className="text-muted-foreground text-[10px] font-medium mb-1">{l}</div>
                            <div className="font-bold text-emerald-700">{v !== null ? `${v}%` : '—'}</div>
                            {gap !== null && (
                              <div className={`text-[10px] mt-0.5 font-medium ${gap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                vs mid-year: {gap >= 0 ? '+' : ''}{gap}pp
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {midYear?.allPupils.combined !== null && yg.ks1Baseline.combined !== null && (() => {
                      const gap = Math.round((midYear!.allPupils.combined as number) - yg.ks1Baseline.combined!);
                      return (
                        <div className="mt-2 text-xs text-emerald-800 bg-white border border-emerald-200 rounded-lg px-3 py-2">
                          KS1 {yg.ks1Baseline.year} Combined: <span className="font-semibold">{yg.ks1Baseline.combined}%</span> (external, last statutory year)
                          {' '}→ Y6 mid-year {new Date().getFullYear()}: <span className="font-semibold">{midYear?.allPupils.combined}%</span> (self-reported)
                          {' '}= <span className={`font-bold ${gap >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{gap >= 0 ? '+' : ''}{gap}pp vs external baseline</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Term-by-term data table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20">
                        <th className="text-left p-3 text-muted-foreground font-medium w-32">Checkpoint</th>
                        <th className="text-center p-3 text-muted-foreground font-medium">Cohort</th>
                        {SUBJECTS.map(s => (
                          <th key={s.key} className="text-center p-3 text-muted-foreground font-medium">{s.label}</th>
                        ))}
                        <th className="text-left p-3 text-muted-foreground font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yg.terms.map((term) => {
                        const isTarget = term.term === 'eoy_target';
                        return (
                          <tr key={term.term} className={`border-b border-border/50 ${isTarget ? 'opacity-70 italic' : ''} ${term.term === 'mid_year' ? 'bg-amber-50/30 font-medium' : ''}`}>
                            <td className="p-3 font-medium text-foreground">{term.label}</td>
                            <td className="p-3 text-center text-muted-foreground">{term.cohortSize ?? '—'}</td>
                            {SUBJECTS.map(subj => {
                              const val = term.allPupils[subj.key] ?? null;
                              return (
                                <td key={subj.key} className={`p-3 text-center font-semibold ${val !== null ? subj.color : 'text-muted-foreground'}`}>
                                  {val !== null ? `${val}%` : '—'}
                                </td>
                              );
                            })}
                            <td className="p-3"><TierPill tier={term.tier} /></td>
                          </tr>
                        );
                      })}

                      {/* Delta row: Autumn → Mid-year */}
                      {autumn && midYear && (
                        <tr className="border-t-2 border-border bg-muted/30">
                          <td className="p-3 font-bold text-foreground text-[11px]">Autumn → Mid Î”</td>
                          <td className="p-3 text-center text-muted-foreground/60">—</td>
                          {deltas.map(d => (
                            <td key={d.key} className="p-3 text-center">
                              {d.delta !== null ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full ${
                                    d.isOutlierRed   ? 'bg-red-100 text-red-700 border border-red-300' :
                                    d.isOutlierAmber ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                                    d.delta >= 0     ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-rose-100 text-rose-700'
                                  }`}>
                                    {d.delta >= 0 ? '+' : ''}{d.delta}pp
                                  </span>
                                  {d.isOutlierRed   && <span className="text-[9px] text-red-600 font-medium">Outlier &gt;8pp</span>}
                                  {d.isOutlierAmber && <span className="text-[9px] text-amber-600 font-medium">Outlier &gt;5pp</span>}
                                </div>
                              ) : <span className="text-muted-foreground/40">—</span>}
                            </td>
                          ))}
                          <td className="p-3">
                            <TierPill tier="derived" />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* FSM subgroup delta if available */}
                {autumn?.fsm6.combined !== null && midYear?.fsm6.combined !== null && autumn?.nonFsm6.combined !== null && midYear?.nonFsm6.combined !== null && (() => {
                  const fsmDelta    = Math.round((midYear!.fsm6.combined as number)    - (autumn!.fsm6.combined as number));
                  const nonFsmDelta = Math.round((midYear!.nonFsm6.combined as number) - (autumn!.nonFsm6.combined as number));
                  const isUnusual   = nonFsmDelta > fsmDelta + 5;
                  return (
                    <div className={`px-5 py-3 border-t border-border/50 text-xs ${isUnusual ? 'bg-amber-50/40' : 'bg-muted/10'}`}>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-semibold text-foreground">Subgroup Î” (Autumn → Mid):</span>
                        <span>FSM6: <span className={`font-bold ${fsmDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fsmDelta >= 0 ? '+' : ''}{fsmDelta}pp</span></span>
                        <span>Non-FSM6: <span className={`font-bold ${nonFsmDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{nonFsmDelta >= 0 ? '+' : ''}{nonFsmDelta}pp</span></span>
                        {isUnusual && (
                          <span className="text-amber-700 font-medium">Non-FSM gaining faster than FSM — unusual. Typically PP spend drives larger FSM lift.</span>
                        )}
                        <TierPill tier="derived" />
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[10px] text-muted-foreground/60">Outlier thresholds: amber = Combined Autumn → Mid-year &gt;5pp, red = &gt;8pp. Typical range: 3–5pp. Writing is the subject most vulnerable to teacher-assessment drift between checkpoints.</p>
      </div>
    </motion.div>
  );
}

// ─── Pre-meeting Verification Checklist ──────────────────────────────────────

interface VerificationItem {
  label: string;
  value: string;
  source: string;
  tier: ReliabilityTier;
}

function PreMeetingVerification({ school, summary, dfeData, parsed }: {
  school: string;
  summary: SchoolDataSummary | null;
  dfeData?: DfEData | null;
  parsed: ParsedSpreadsheet;
}) {
  const abbrevLookup = useContext(AbbrevLookupContext);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const schoolInfo = abbrevLookup[school];
  const schoolData = parsed.data[school] ?? {};
  const y6 = schoolData['Year 6'];

  const items: VerificationItem[] = [];

  // Roll
  const nor = schoolInfo ? undefined : null; // NOR from spreadsheet
  let totalPupilsFromSpreadsheet = 0;
  for (const yg of YEAR_GROUPS) {
    const n = schoolData[yg]?.cohort.number_in_cohort;
    if (n) totalPupilsFromSpreadsheet += n;
  }
  if (totalPupilsFromSpreadsheet > 0) {
    items.push({ label: 'Number on roll (spreadsheet total)', value: `${totalPupilsFromSpreadsheet}`, source: 'Trust spreadsheet', tier: 'self_reported' });
  }

  // Y6 mid-year from main spreadsheet
  if (y6) {
    const c = y6.all_pupils.c_are;
    const r = y6.all_pupils.r_are;
    const w = y6.all_pupils.w_are;
    const m = y6.all_pupils.m_are;
    if (c !== null && c !== undefined) {
      items.push({ label: 'Y6 Mid-year Combined', value: `${c}%${r !== null && r !== undefined ? ` (R ${r}%, W ${w ?? '—'}%, M ${m ?? '—'}%)` : ''}`, source: 'Trust mid-year spreadsheet', tier: 'self_reported' });
    }
  }

  // From Data Summary: Autumn, Target, KS1 baseline
  if (summary) {
    const y6Prog = summary.yearGroupProgressions.find(p => p.yearGroup === 'Y6');
    if (y6Prog) {
      const autumn = y6Prog.terms.find(t => t.term === 'autumn');
      if (autumn?.allPupils.combined !== null && autumn?.allPupils.combined !== undefined) {
        items.push({ label: 'Y6 Autumn Term T1 Combined', value: `${autumn.allPupils.combined}%${autumn.allPupils.reading !== null ? ` (R ${autumn.allPupils.reading}%, W ${autumn.allPupils.writing ?? '—'}%, M ${autumn.allPupils.maths ?? '—'}%)` : ''}`, source: 'School Data Summary', tier: 'self_reported' });
      }
      const target = y6Prog.terms.find(t => t.term === 'eoy_target');
      if (target?.allPupils.combined !== null && target?.allPupils.combined !== undefined) {
        items.push({ label: 'Y6 EOY Target Combined', value: `${target.allPupils.combined}%`, source: 'School target', tier: 'self_reported' });
      }
      if (y6Prog.ks1Baseline) {
        const b = y6Prog.ks1Baseline;
        items.push({ label: `KS1 ${b.year} Combined (this cohort's baseline)`, value: `${b.combined ?? '—'}%${b.reading !== null ? ` (R ${b.reading}%, W ${b.writing ?? '—'}%, M ${b.maths ?? '—'}%)` : ''}`, source: `School Data Summary — ${b.year} externally moderated`, tier: 'external' });
      }
    }
  }

  // DfE KS2 history
  if (dfeData && schoolInfo?.urn) {
    const schoolUrn = schoolInfo.urn;
    const ks2Years = [2023, 2024, 2025];
    const ks2Vals = ks2Years.map(yr => ({ yr, pct: getKs2CombinedForUrn(dfeData.ks2Results, schoolUrn, yr) })).filter(x => x.pct !== null);
    if (ks2Vals.length > 0) {
      items.push({ label: 'KS2 history (DfE validated)', value: ks2Vals.map(x => `${x.yr - 1}/${String(x.yr).slice(2)}: ${x.pct}%`).join(' · '), source: 'DfE KS2 Published Results', tier: 'external' });
    }
  }

  const toggle = (i: number) => setChecked(prev => {
    const next = new Set(prev);
    next.has(i) ? next.delete(i) : next.add(i);
    return next;
  });

  const allChecked = items.length > 0 && checked.size === items.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
    >
      <div className="bg-card border border-border rounded-2xl p-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 uppercase tracking-wider">Pre-meeting</span>
            <h3 className="text-xl font-semibold text-foreground">Verification checklist</h3>
          </div>
          {allChecked && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 size={12} /> Ready
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-5">Cross-check these numbers against your own records before the meeting. Tick each one you&apos;ve verified.</p>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Connect the mid-year spreadsheet and optionally a School Data Summary to populate this checklist.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={i}
                onClick={() => toggle(i)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  checked.has(i) ? 'bg-emerald-50/60 border-emerald-200' : 'bg-muted/20 border-border hover:bg-muted/40'
                }`}
              >
                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                  checked.has(i) ? 'bg-emerald-600 border-emerald-600' : 'border-muted-foreground/40'
                }`}>
                  {checked.has(i) && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{item.label}:</span>
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                    <TierPill tier={item.tier} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">Source: {item.source}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-[10px] text-muted-foreground/60 italic">
          If any number doesn&apos;t match your records, the analysis needs to be re-run with corrected data before the meeting.
        </div>
      </div>
    </motion.div>
  );
}

interface AppConnector {
  id: string;
  source_file_id: string;
  source_file_name: string;
  source_path?: string;
  status: string;
  last_sync_at?: string;
}

export default function TrustAssessorPage() {
  const { organizationId, session, organization } = useAuth();
  const accessToken = session?.access_token;
  const authHeaders = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) h['Authorization'] = `Bearer ${accessToken}`;
    return h;
  }, [accessToken]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  // Full capture map so the KS2 chart can plot Autumn + Mid-Year side-by-side.
  // Key = capture_period ('autumn_term' | 'mid_year' | 'end_of_year' | 'summer_term').
  type CapturePeriod = 'autumn_term' | 'mid_year' | 'end_of_year' | 'summer_term';
  const [capturesByPeriod, setCapturesByPeriod] = useState<Partial<Record<CapturePeriod, CaptureSnapshot | null>>>({});
  const [currentCapturePeriod, setCurrentCapturePeriod] = useState<CapturePeriod | null>(null);
  const selfReportLabels: SelfReportLabels = useMemo(() => ({
    autumn_term: capturesByPeriod.autumn_term?.capture_name
      ?? capturesByPeriod.autumn_term?.file_name
      ?? 'Autumn self-report',
    mid_year: capturesByPeriod.mid_year?.capture_name
      ?? capturesByPeriod.mid_year?.file_name
      ?? 'Mid-Year self-report',
  }), [
    capturesByPeriod.autumn_term?.capture_name,
    capturesByPeriod.autumn_term?.file_name,
    capturesByPeriod.mid_year?.capture_name,
    capturesByPeriod.mid_year?.file_name,
  ]);
  // URN → child-org-id lookup so each school tab can query its OWN captures.
  // Populated by /api/organizations/children on mount for trust-level users.
  const [urnToOrgId, setUrnToOrgId] = useState<Record<number, string>>({});
  // Schools in the current user's scope — trust-level: all children; school-
  // level (leaf): the current org itself. Drives the DfE KS2 comparison block
  // so any valid URN auto-populates without a hardcoded school registry.
  const [scopedSchools, setScopedSchools] = useState<Array<{
    id: string;
    name: string;
    urn: number | null;
    organization_type?: string | null;
    parent_organization_id?: string | null;
    logo_url?: string | null;
  }>>([]);

  // Derived lookup: abbrev → { id, name, urn } for the schools in this user's scope.
  // Replaces the old hardcoded TRUST_SCHOOLS constant. Trust users get all children;
  // school-level users get just themselves.
  const abbrevLookup = useMemo(() => buildAbbrevLookup(scopedSchools), [scopedSchools]);

  const isTrustLevel = organization?.organization_type === 'trust';

  const [dfeData, setDfeData] = useState<DfEData | null>(null);
  const [dfeLoading, setDfeLoading] = useState(false);
  const [dfeError, setDfeError] = useState<string | null>(null);
  const dfeLoadedForOrgRef = useRef<string | null>(null);
  const [publicDataReport, setPublicDataReport] = useState<PublicDataReport | null>(null);
  const [publicDataReportError, setPublicDataReportError] = useState<string | null>(null);
  const [selectedPublicDataYear, setSelectedPublicDataYear] = useState<number | null>(null);
  useEffect(() => {
    setSelectedPublicDataYear(null);
  }, [organizationId]);
  const isLocalAuthorityLevel = /council|local authority|borough/i.test(`${organization?.name ?? ''} ${publicDataReport?.parent.name ?? ''}`);
  const isSingleSchoolPublicDataReport =
    !isTrustLevel &&
    !isLocalAuthorityLevel &&
    (publicDataReport?.schools.length ?? 0) === 1;
  const publicDataPrimaryReport = useMemo(() => {
    if (!publicDataReport) return null;
    const groups = publicDataPhaseGroups(publicDataReport);
    return publicDataReportWithSchools(publicDataReport, groups.primary.length > 0 ? groups.primary : publicDataReport.schools);
  }, [publicDataReport]);
  const [activePublicDataPhase, setActivePublicDataPhase] = useState<string>("overview");
  const publicDataPhaseGroupsForTabs = useMemo(
    () => (publicDataReport ? publicDataPhaseGroups(publicDataReport) : null),
    [publicDataReport],
  );
  const phaseFilteredPublicDataSchools = useMemo(() => {
    if (!publicDataReport) return [];
    if (activePublicDataPhase === "primary") return publicDataPhaseGroupsForTabs?.primary ?? [];
    if (activePublicDataPhase === "secondary") return publicDataPhaseGroupsForTabs?.secondary ?? [];
    if (activePublicDataPhase === "special") return publicDataPhaseGroupsForTabs?.special ?? [];
    return publicDataReport.schools;
  }, [activePublicDataPhase, publicDataPhaseGroupsForTabs, publicDataReport]);
  const activePublicDataPhaseLabel =
    activePublicDataPhase === "primary" ? "primary schools" :
    activePublicDataPhase === "secondary" ? "secondary schools" :
    activePublicDataPhase === "special" ? "special schools" :
    "every school in scope";
  const audience: OverviewAudience = isLocalAuthorityLevel ? "local_authority" : "trust";
  const organisationLabel = isLocalAuthorityLevel ? "local authority" : "trust";
  const organisationLabelTitle = isLocalAuthorityLevel ? "Local Authority" : "Trust";

  const publicDataSchoolLookup = useMemo(() => {
    const schools = phaseFilteredPublicDataSchools.map((school) => ({
      id: school.id,
      name: school.name,
      urn: school.urn,
      logo_url: school.logo_url,
    }));
    return buildAbbrevLookup(schools);
  }, [phaseFilteredPublicDataSchools]);
  const allPublicDataSchoolLookup = useMemo(() => {
    const schools = (publicDataReport?.schools ?? []).map((school) => ({
      id: school.id,
      name: school.name,
      urn: school.urn,
      logo_url: school.logo_url,
    }));
    return buildAbbrevLookup(schools);
  }, [publicDataReport?.schools]);

  const tabSchoolLookup = useMemo(
    () => ({ ...publicDataSchoolLookup, ...abbrevLookup }),
    [abbrevLookup, publicDataSchoolLookup],
  );

  // Which schools should show as tabs. Public DfE report schools are now first-
  // class, so LA DfE-only schools can render DfE-backed tabs before a capture
  // spreadsheet exists. Uploaded spreadsheets remain optional overlays.
  const visibleSchoolAbbrevs = useMemo(() => {
    const scopedAbbrevs = new Set(
      publicDataReport ? Object.keys(publicDataSchoolLookup) : Object.keys(tabSchoolLookup),
    );
    if (!parsed) return Array.from(scopedAbbrevs);
    const parsedTabs = parsed.schools.filter((s: string) => scopedAbbrevs.has(s));
    const dfeOnlyTabs = Array.from(scopedAbbrevs).filter((school) => !parsed.schools.includes(school));
    return [...parsedTabs, ...dfeOnlyTabs];
  }, [parsed, publicDataReport, publicDataSchoolLookup, tabSchoolLookup]);

  // KPI Dashboard / Intelligence data
  const [laBenchmarks, setLaBenchmarks] = useState<LaBenchmarkData | null>(null);
  const [demographicCohort, setDemographicCohort] = useState<DemographicCohort | null>(null);
  const [schoolKpiData, setSchoolKpiData] = useState<SchoolKpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(false);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [urnValidation, setUrnValidation] = useState<UrnValidationResult | null>(null);
  const [urnValidationLoading, setUrnValidationLoading] = useState(false);
  const [urnValidationChecked, setUrnValidationChecked] = useState(false);

  const [staffingSnapshots, setStaffingSnapshots] = useState<Record<number, {
    urn: number;
    numberOfPupils: number | null;
    fteTeachers: number | null;
    fteTA: number | null;
    fteSupport: number | null;
    fteTotal: number | null;
    year: number;
    pupilTeacherRatio: number | null;
    pupilAdultRatio: number | null;
  }> | null>(null);
  const [showAllFlags, setShowAllFlags] = useState(false);
  const [showFullHeatmap, setShowFullHeatmap] = useState(false);
  const [activeSchoolTab, setActiveSchoolTab] = useState<string>("overview");
  const activeOrganizationRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeSchoolTab === "overview") return;
    if (!visibleSchoolAbbrevs.includes(activeSchoolTab)) {
      setActiveSchoolTab("overview");
    }
  }, [activeSchoolTab, visibleSchoolAbbrevs]);

  const activePublicDataSchoolKey = useMemo(() => {
    if (!publicDataReport || activeSchoolTab !== "overview") return activeSchoolTab;
    const onlySchool = publicDataReport.schools[0];
    return onlySchool ? abbreviateSchoolName(onlySchool.name) : activeSchoolTab;
  }, [activeSchoolTab, publicDataReport]);

  useEffect(() => {
    if (!organizationId || activeOrganizationRef.current === organizationId) return;
    activeOrganizationRef.current = organizationId;
    setActiveSchoolTab("overview");
    setDfeData(null);
    setDfeError(null);
    setPublicDataReport(null);
    setPublicDataReportError(null);
    setPerPupilStats(null);
    setPerPupilData(null);
    setStaffingSnapshots(null);
    setLaBenchmarks(null);
    setDemographicCohort(null);
    setSchoolKpiData(null);
    setKpiError(null);
    setUrnValidation(null);
    setUrnValidationChecked(false);
  }, [organizationId]);
  const selectedKpiSchool = useMemo(() => {
    if (scopedSchools.length === 0) return null;
    if (isTrustLevel && activeSchoolTab === "overview") return null;

    if (activeSchoolTab !== "overview") {
      const selectedFromLookup = tabSchoolLookup[activeSchoolTab] ?? allPublicDataSchoolLookup[activeSchoolTab];
      const selectedSchool = [...scopedSchools, ...Object.values(allPublicDataSchoolLookup)].find((school) =>
        school.id === selectedFromLookup?.id ||
        school.name === activeSchoolTab ||
        abbreviateSchoolName(school.name) === activeSchoolTab,
      );

      if (selectedSchool) return selectedSchool;
    }

    return scopedSchools[0];
  }, [activeSchoolTab, allPublicDataSchoolLookup, isTrustLevel, scopedSchools, tabSchoolLookup]);
  const selectedPupilDataOrgId = selectedKpiSchool?.id ?? (!isTrustLevel ? organizationId : null);
  const [perPupilStats, setPerPupilStats] = useState<{ totalPupils: number; trackablePupils: number } | null>(null);
  const [perPupilData, setPerPupilData] = useState<{
    summary: { totalPupils: number; totalRecords: number; yearsSpan: number[]; trackablePupils: number };
    eyfsGld: { year: number; pupils: number; gldCount: number; gldPct: number }[];
    ks1Data: { year: number; pupils: number; subjects: Record<string, { total: number; wts: number; exs: number; gds: number }> }[];
    phonicsData: { year: number; pupils: number; total: number; passed: number; passPct: number }[];
    spreadsheetComparison: {
      latestYear: number;
      rows: { yearGroup: string; ctf: Record<string, number | null>; spreadsheet: Record<string, number> }[];
    };
    cohortJourneys: {
      pupilId: string;
      demographics: { isFsm: boolean; isSend: boolean; isEal: boolean; gender: string };
      journey: { year: number; yearGroup: number; subject: string; level: string }[];
    }[];
    spotlightPupil: {
      pupilId: string;
      demographics: { isFsm: boolean; isSend: boolean; isEal: boolean; gender: string };
      journey: { year: number; yearGroup: number; subject: string; level: string; scaledScore?: number }[];
    } | null;
    cohortTracking: {
      cohortLabel: string;
      startYear: number;
      startYearGroup: number;
      dataPoints: { yearGroup: number; year: number; reading: number | null; writing: number | null; maths: number | null; pupils: number }[];
    }[];
    cohortMilestones: {
      cohortLabel: string;
      startYear: number;
      currentYearGroup: number;
      milestones: {
        label: string;
        yearGroup: number;
        academicYear: number;
        percentAt: number | null;
        pupilCount: number;
        nationalBenchmark: number | null;
      }[];
    }[];
    demographicDisaggregation: {
      source?: string;
      enrichmentCoverage?: { assessmentPupils: number; matchedToCurrentProfile: number };
      cohortGapLens?: CohortGapLens;
      all: { count: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      withoutFsm: { removed: number; remaining: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      withoutSend: { removed: number; remaining: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      withoutEal: { removed: number; remaining: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      fsmOnly: { count: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      sendOnly: { count: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      ealOnly: { count: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
    } | null;
    currentProfileDisaggregation: {
      source: string;
      caveat: string;
      groups: Record<string, { count: number; combinedAtExpected: number; combinedPct: number | null }>;
    } | null;
    assessmentIntelligence: AssessmentIntelligenceSummary | null;
    unifiedEvidenceTimeline: UnifiedEvidenceTimeline | null;
  } | null>(null);
  const [showDrivePicker, setShowDrivePicker] = useState(false);
  const [connector, setConnector] = useState<AppConnector | null>(null);
  const [connectorLoading, setConnectorLoading] = useState(true);
  const [connectorError, setConnectorError] = useState<string | null>(null);

  // School Data Summary connector (per-school detail file: LGPS / Grove House style)
  const [summaryData, setSummaryData] = useState<SchoolDataSummary | null>(null);
  const [summaryFileName, setSummaryFileName] = useState<string | null>(null);
  const [summaryParseError, setSummaryParseError] = useState<string | null>(null);
  const [showSummaryPicker, setShowSummaryPicker] = useState(false);
  const summaryFileInputRef = useRef<HTMLInputElement>(null);

  // Which school the summary belongs to (inferred from filename or set explicitly)
  const [summarySchoolAbbrev, setSummarySchoolAbbrev] = useState<string>('LGPS');

  const { isConnected: driveConnected, accessToken: driveToken } = useGoogleDriveAccess();

  // On mount: fetch saved connector from Supabase (not localStorage)
  useEffect(() => {
    if (!organizationId) return;
    (async () => {
      try {
        const res = await fetch(`/api/app-connectors?app_id=trust-assessor&organizationId=${organizationId}`, { headers: authHeaders });
        const json = await res.json();
        console.log('[Trust Assessor] Connector load:', res.status, json);
        if (!res.ok) { setConnectorLoading(false); return; }
        const connectors = Array.isArray(json) ? json : json.data ?? json;
        const active = Array.isArray(connectors) ? connectors.find((c: AppConnector) => c.status === 'active' && c.source_file_id) : null;
        if (active) {
          console.log('[Trust Assessor] Found saved connector:', active.source_file_name);
          setConnector(active);
          setFileName(active.source_file_name);
        } else {
          console.log('[Trust Assessor] No saved connector found');
        }
      } catch {
        // Non-fatal — connector just won't auto-load
      } finally {
        setConnectorLoading(false);
      }
    })();
  }, [organizationId]);

  // When we have a saved connector, fetch the file via server-side route
  // (uses Google API key, not browser token — works across sessions)
  useEffect(() => {
    if (!connector || parsed) return;

    const fetchViaServer = async () => {
      setConnectorLoading(true);
      setConnectorError(null);
      try {
        const res = await fetch(
          `/api/app-connectors/fetch-file?connector_id=${connector.id}&organizationId=${organizationId}`,
          { headers: authHeaders },
        );
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          setConnectorError(errJson.error || `Could not fetch spreadsheet (${res.status}). Please reconnect.`);
          return;
        }
        const blob = await res.blob();
        const buffer = await blob.arrayBuffer();
        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: "array" });
        const result = parseSpreadsheet(workbook);
        if (result.schools.length === 0) {
          setConnectorError("Spreadsheet was fetched but no school data found. Check the file format.");
          return;
        }
        setParsed(result);
        setFileName(connector.source_file_name);
      } catch (err) {
        setConnectorError(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setConnectorLoading(false);
      }
    };

    fetchViaServer();
  }, [connector, parsed, organizationId, authHeaders]);

  // Fetch this org + its children. Trust-level users get all schools in scope;
  // standalone / leaf schools get themselves. Drives the KS2 comparison and
  // the per-school capture queries.
  useEffect(() => {
    if (!organizationId || !accessToken) return;
    (async () => {
      const res = await fetch(`/api/organizations/children?parentId=${organizationId}`, { headers: authHeaders });
      if (!res.ok) return;
      const body = await res.json() as {
        children?: Array<{
          id: string;
          name: string;
          urn: string | number | null;
          organization_type?: string | null;
          parent_organization_id?: string | null;
          settings?: { logo_url?: string | null; trust_logo_url?: string | null } | null;
        }>;
        self?: {
          id: string;
          name: string;
          urn: string | number | null;
          organization_type?: string | null;
          parent_organization_id?: string | null;
          settings?: { logo_url?: string | null; trust_logo_url?: string | null } | null;
        } | null;
      };
      const children = body.children ?? [];
      const self = body.self ?? null;

      const normUrn = (u: string | number | null | undefined): number | null => {
        if (u === null || u === undefined) return null;
        const n = typeof u === 'string' ? parseInt(u, 10) : u;
        return Number.isFinite(n) ? n : null;
      };

      // URN → orgId map for per-school capture fetches
      const map: Record<number, string> = {};
      for (const c of children) {
        const urn = normUrn(c.urn);
        if (urn) map[urn] = c.id;
      }
      if (self && normUrn(self.urn)) map[normUrn(self.urn)!] = self.id;
      setUrnToOrgId(map);

      // Scoped schools: children if this org is a trust; self if it's a leaf.
      const scoped = children.length > 0
        ? children.map(c => ({
          id: c.id,
          name: c.name,
          urn: normUrn(c.urn),
          organization_type: c.organization_type,
          parent_organization_id: c.parent_organization_id,
          logo_url: c.settings?.logo_url ?? null,
        }))
        : (self ? [{
          id: self.id,
          name: self.name,
          urn: normUrn(self.urn),
          organization_type: self.organization_type,
          parent_organization_id: self.parent_organization_id,
          logo_url: self.settings?.logo_url ?? null,
        }] : []);
      setScopedSchools(scoped);
    })();
  }, [organizationId, accessToken, authHeaders]);

  // For school-level users, auto-select their single school tab once scopedSchools loads.
  useEffect(() => {
    if (isTrustLevel) return;
    if (scopedSchools.length === 1 && activeSchoolTab === "overview") {
      const onlyAbbrev = abbreviateSchoolName(scopedSchools[0].name);
      setActiveSchoolTab(onlyAbbrev);
    }
  }, [isTrustLevel, scopedSchools, activeSchoolTab]);

  useEffect(() => {
    if (!isTrustLevel || activeSchoolTab !== "overview") return;
    if (parsed?.schools.length === 1) setActiveSchoolTab(parsed.schools[0]);
  }, [isTrustLevel, activeSchoolTab, parsed]);

  // School-level orgs must never render trust-wide spreadsheet rows, even if a
  // connector or legacy saved capture contains multiple schools. Trust orgs keep
  // the full spreadsheet; school orgs get only their own abbreviation.
  useEffect(() => {
    if (isTrustLevel || scopedSchools.length === 0) return;
    const allowedSchools = Object.keys(abbrevLookup);
    if (allowedSchools.length === 0) return;

    if (parsed) {
      const scopedParsed = scopeParsedSpreadsheet(parsed, allowedSchools);
      if (scopedParsed !== parsed) setParsed(scopedParsed);
    }

    setCapturesByPeriod((previous) => {
      let changed = false;
      const next: Partial<Record<CapturePeriod, CaptureSnapshot | null>> = {};

      for (const [period, snapshot] of Object.entries(previous) as Array<[CapturePeriod, CaptureSnapshot | null]>) {
        if (!snapshot?.parsed_data) {
          next[period] = snapshot;
          continue;
        }

        const scopedSnapshotParsed = scopeParsedSpreadsheet(snapshot.parsed_data, allowedSchools);
        changed = changed || scopedSnapshotParsed !== snapshot.parsed_data;
        next[period] = scopedSnapshotParsed === snapshot.parsed_data
          ? snapshot
          : { ...snapshot, parsed_data: scopedSnapshotParsed };
      }

      return changed ? next : previous;
    });
  }, [isTrustLevel, scopedSchools, abbrevLookup, parsed]);

  // Belt-and-braces validation: before showing DfE KPIs, ensure the stored
  // organization URN resolves back to the same school identity in our GIAS
  // warehouse. This catches copy/paste/import mistakes like a correct school
  // name paired with another school's URN.
  useEffect(() => {
    if (!accessToken || !selectedKpiSchool) return;

    if (!selectedKpiSchool.id) return;

    (async () => {
      setUrnValidationLoading(true);
      setUrnValidationChecked(false);
      try {
        const res = await fetch(
          `/api/intelligence/urn-validation?organizationId=${selectedKpiSchool.id}`,
          { headers: authHeaders },
        );
        const json = await res.json();
        setUrnValidation(res.ok ? json : null);
      } catch (error) {
        console.error("[Trust Assessor] URN validation failed", error);
        setUrnValidation(null);
      } finally {
        setUrnValidationChecked(true);
        setUrnValidationLoading(false);
      }
    })();
  }, [accessToken, selectedKpiSchool, authHeaders]);

  // Fetch DfE data once per organization.
  useEffect(() => {
    if (!accessToken || !organizationId) return;
    if (dfeLoadedForOrgRef.current === organizationId) return;
    dfeLoadedForOrgRef.current = organizationId;

    (async () => {
      setDfeLoading(true);
      setDfeError(null);
      try {
        const res = await fetch(`/api/trust-analysis${organizationId ? `?organizationId=${organizationId}` : ''}`, { headers: authHeaders });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch DfE data");
        const payload = json.data ?? json;
        setDfeData({
          ks2Results: payload.ks2Results ?? [],
          census: payload.census ?? [],
          nationalPercentiles: payload.nationalPercentiles ?? {},
          threeYearAverages: payload.threeYearAverages ?? {},
        });
      } catch (e) {
        setDfeError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setDfeLoading(false);
      }
    })();

    // Also fetch staffing ratios (non-fatal)
    (async () => {
      try {
        const res = await fetch(`/api/trust-analysis/staffing${organizationId ? `?organizationId=${organizationId}` : ''}`, { headers: authHeaders });
        const json = await res.json();
        const payload = json.data ?? json;
        if (res.ok && payload.staffing) {
          setStaffingSnapshots(payload.staffing);
        }
      } catch {
        // non-fatal — staffing card just won't render
      }
    })();
  }, [accessToken, organizationId, authHeaders]);

  // Fetch pupil / teacher-locked assessment data for the selected school org.
  // Trust-level spreadsheets live on the parent org, but CTF/MIS and class
  // snapshots are stored against the child school org, so this must follow the
  // active school tab rather than the trust parent.
  useEffect(() => {
    if (!accessToken || !selectedPupilDataOrgId) {
      setPerPupilStats(null);
      setPerPupilData(null);
      return;
    }

    (async () => {
      setPerPupilStats(null);
      setPerPupilData(null);
      try {
        const res = await fetch(
          `/api/trust-analysis/grove-house?organizationId=${selectedPupilDataOrgId}`,
          { headers: authHeaders },
        );
        const json = await res.json();
        const payload = json.data ?? json;
        const summary = payload.summary;
        if (res.ok && summary && summary.totalPupils > 0) {
          setPerPupilStats({
            totalPupils: summary.totalPupils,
            trackablePupils: summary.trackablePupils,
          });
          setPerPupilData({
            summary,
            eyfsGld: payload.eyfsGld ?? [],
            ks1Data: payload.ks1Data ?? [],
            phonicsData: payload.phonicsData ?? [],
            spreadsheetComparison: payload.spreadsheetComparison ?? { latestYear: 0, rows: [] },
            cohortJourneys: payload.cohortJourneys ?? [],
            spotlightPupil: payload.spotlightPupil ?? null,
            cohortTracking: payload.cohortTracking ?? [],
            cohortMilestones: payload.cohortMilestones ?? [],
            demographicDisaggregation: payload.demographicDisaggregation ?? null,
            currentProfileDisaggregation: payload.currentProfileDisaggregation ?? null,
            assessmentIntelligence: payload.assessmentIntelligence ?? null,
            unifiedEvidenceTimeline: payload.unifiedEvidenceTimeline ?? null,
          });
        } else {
          setPerPupilStats(null);
          setPerPupilData(null);
        }
      } catch {
        setPerPupilStats(null);
        setPerPupilData(null);
      }
    })();
  }, [accessToken, selectedPupilDataOrgId, authHeaders]);

  // Fetch the generic public-data report for the selected trust / LA / school.
  // This is the productised out-of-the-box path: org tree -> URNs -> DfE warehouse
                // -> narrative, without relying on another organisation's spreadsheets.
  useEffect(() => {
    if (!accessToken || !organizationId) return;

    (async () => {
      setPublicDataReportError(null);
      try {
        const params = new URLSearchParams({ organizationId });
        if (selectedPublicDataYear) params.set("academicYearEnd", String(selectedPublicDataYear));
        const res = await fetch(`/api/trust-analysis/public-data-report?${params.toString()}`, {
          headers: authHeaders,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch public DfE report');
        setPublicDataReport(json.data ?? json);
      } catch (error) {
        setPublicDataReport(null);
        setPublicDataReportError(error instanceof Error ? error.message : 'Failed to fetch public DfE report');
      }
    })();
  }, [accessToken, organizationId, selectedPublicDataYear, authHeaders]);

  // Fetch KPI Dashboard / Intelligence data for LA benchmarks and demographic cohort
  // This runs separately from the DfE data fetch and waits for scopedSchools to be populated
  useEffect(() => {
    // Skip if not authenticated or no schools yet
    if (!accessToken || !selectedKpiSchool) {
      setKpiLoading(false);
      setKpiError(null);
      setLaBenchmarks(null);
      setDemographicCohort(null);
      setSchoolKpiData(null);
      return;
    }

    if (urnValidationLoading || !urnValidationChecked) {
      setKpiLoading(true);
      return;
    }

    if (urnValidation && ["mismatch", "not_found", "missing_urn"].includes(urnValidation.status)) {
      setKpiLoading(false);
      setKpiError(urnValidation.message);
      setLaBenchmarks(null);
      setDemographicCohort(null);
      setSchoolKpiData(null);
      return;
    }

    if (!selectedKpiSchool.urn) {
      setKpiError("No school URN available for intelligence data");
      setKpiLoading(false);
      setLaBenchmarks(null);
      setDemographicCohort(null);
      setSchoolKpiData(null);
      return;
    }

    (async () => {
      setKpiLoading(true);
      setKpiError(null);
      setLaBenchmarks(null);
      setDemographicCohort(null);
      setSchoolKpiData(null);
      try {
        // Fetch fresh DfE-powered KPI data for the primary school. School KPI
        // data is loaded from the DfE warehouse, not uploaded trust spreadsheets.
        const [laRes, cohortRes, schoolKpiRes] = await Promise.all([
          fetch(`/api/intelligence/la-benchmarks?urn=${selectedKpiSchool.urn}`, { headers: authHeaders }),
          fetch(`/api/intelligence/demographic-cohort?urn=${selectedKpiSchool.urn}`, { headers: authHeaders }),
          fetch(`/api/intelligence/kpi-dashboard?urn=${selectedKpiSchool.urn}`, { headers: authHeaders }),
        ]);

        if (laRes.ok) {
          const laJson = await laRes.json();
          setLaBenchmarks(laJson.data ?? laJson);
        } else {
          const laJson = await laRes.json();
          setKpiError(laJson.error || "Failed to fetch LA benchmarks");
        }

        if (cohortRes.ok) {
          const cohortJson = await cohortRes.json();
          setDemographicCohort(cohortJson.data ?? cohortJson);
        }

        if (schoolKpiRes.ok) {
          const schoolKpiJson = await schoolKpiRes.json();
          setSchoolKpiData(schoolKpiJson.data ?? schoolKpiJson);
        } else {
          const schoolKpiJson = await schoolKpiRes.json();
          setKpiError(schoolKpiJson.error || "Failed to fetch school KPI data");
        }
      } catch (e) {
        setKpiError(e instanceof Error ? e.message : "Failed to load KPI data");
      } finally {
        setKpiLoading(false);
      }
    })();
  }, [accessToken, selectedKpiSchool, authHeaders, urnValidation, urnValidationLoading, urnValidationChecked]);

  // Process a file (from Drive picker or manual upload). If driveFileId is provided,
  // save the connector to Supabase so it auto-connects on future page loads.
  const processFile = useCallback((file: File, driveFileId?: string, drivePath?: string) => {
    setFileName(file.name);
    setParseError(null);
    setConnectorError(null);
    setParsed(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        if (!ev.target?.result) return;
        const data = new Uint8Array(ev.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const result = parseSpreadsheet(workbook);
        if (result.schools.length === 0) {
          setParseError("No school rows found. Check the spreadsheet format — expected school abbreviations (e.g. GHPS, CHPS) in column A.");
          return;
        }
        setParsed(result);

        // Persist trust-level parsed data so it sticks across sessions
        if (organizationId) {
          fetch('/api/trust-analysis/trust-spreadsheet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
              organizationId,
              fileName: file.name,
              parsedData: result,
            }),
          }).catch((err) => console.error('[trust-spreadsheet] save failed:', err));
        }

        // If this came from Drive, save the connector to Supabase (NOT localStorage)
        if (driveFileId && organizationId) {
          fetch(`/api/app-connectors?organizationId=${organizationId}`, {
            method: 'POST',
            credentials: 'include',
            headers: authHeaders,
            body: JSON.stringify({
              app_id: 'trust-assessor',
              source_type: 'google_drive',
              source_file_id: driveFileId,
              source_file_name: file.name,
              source_path: drivePath,
              source_mime_type: file.type,
              connector_name: file.name,
              data_categories: ['school_attainment', 'year_group_data', 'fsm_counts', 'send_counts'],
              processing_purpose: 'Cross-referencing trust self-reported mid-year data against validated DfE outcomes for school improvement analysis',
            }),
          }).then(async (res) => {
            const json = await res.json();
            if (!res.ok) {
              console.error('[Trust Assessor] Failed to save connector:', res.status, json);
              return;
            }
            const saved = Array.isArray(json) ? json[0] : json.data ?? json;
            if (saved?.id) {
              console.log('[Trust Assessor] Connector saved:', saved.id, saved.source_file_name);
              setConnector(saved);
            }
          }).catch((err) => {
            console.error('[Trust Assessor] Connector save error:', err);
          });
        }
      } catch (err) {
        setParseError(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [organizationId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  // Process a per-school Data Summary file
  const processSummaryFile = useCallback((file: File, abbrev?: string) => {
    setSummaryFileName(file.name);
    setSummaryParseError(null);
    setSummaryData(null);

    // Infer school from filename if not provided
    let resolvedAbbrev = abbrev ?? summarySchoolAbbrev;
    const match = resolveSchoolByName(file.name, scopedSchools);
    if (match) {
      const abbrev = Object.keys(abbrevLookup).find(a => abbrevLookup[a].id === match.id);
      if (abbrev) {
        resolvedAbbrev = abbrev;
        setSummarySchoolAbbrev(abbrev);
      }
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        if (!ev.target?.result) return;
        const data = new Uint8Array(ev.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const result = parseSchoolDataSummary(workbook, resolvedAbbrev, file.name);
        if (result.yearGroupProgressions.length === 0) {
          setSummaryParseError('No year group progression data found. Expected sheets named Year 1–Year 6 or Y1–Y6.');
          return;
        }
        setSummaryData(result);

        // Persist to server so the report sticks across sessions
        if (organizationId) {
          fetch('/api/trust-analysis/school-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
              organizationId,
              schoolAbbrev: resolvedAbbrev,
              fileName: file.name,
              parsedData: result,
            }),
          }).catch((err) => console.error('[school-summary] save failed:', err));
        }
      } catch (err) {
        setSummaryParseError(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [summarySchoolAbbrev, organizationId, authHeaders, scopedSchools, abbrevLookup]);

  // Load persisted school summary on mount / org change
  const summaryLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!organizationId || !accessToken) return;
    if (summaryLoadedRef.current === organizationId) return; // already loaded for this org
    summaryLoadedRef.current = organizationId;

    (async () => {
      try {
        const res = await fetch(`/api/trust-analysis/school-summary?organizationId=${organizationId}`, { headers: authHeaders });
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.parsed_data) {
          setSummaryData(data.parsed_data);
          setSummaryFileName(data.file_name);
          if (data.school_abbrev) setSummarySchoolAbbrev(data.school_abbrev);
        }
      } catch (e) {
        console.warn('[school-summary] load failed:', e);
      }
    })();
  }, [organizationId, accessToken, authHeaders]);

  // Load persisted trust spreadsheet on mount / org change (resolves parent trust automatically server-side)
  const trustSpreadsheetLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!organizationId || !accessToken) return;
    if (trustSpreadsheetLoadedRef.current === organizationId) return;
    trustSpreadsheetLoadedRef.current = organizationId;
    setParsed(null);
    setFileName(null);
    setCapturesByPeriod({});
    setCurrentCapturePeriod(null);

    (async () => {
      try {
        const res = await fetch(`/api/trust-analysis/trust-spreadsheet?organizationId=${organizationId}`, { headers: authHeaders });
        if (!res.ok) return;
        const data = await res.json();
        // New shape: { captures: { autumn_term: {...}, mid_year: {...} }, current, currentPeriod }
        if (data && data.captures) {
          setCapturesByPeriod(data.captures);
          setCurrentCapturePeriod(data.currentPeriod ?? null);
          if (data.current?.parsed_data) {
            setParsed(data.current.parsed_data);
            setFileName(data.current.file_name);
          }
        } else if (data && data.parsed_data) {
          // Back-compat: old response shape (single row)
          setParsed(data.parsed_data);
          setFileName(data.file_name);
          const period = (data.capture_period as CapturePeriod | undefined) ?? null;
          if (period) {
            setCapturesByPeriod({ [period]: { parsed_data: data.parsed_data, file_name: data.file_name } });
            setCurrentCapturePeriod(period);
          }
        }
      } catch (e) {
        console.warn('[trust-spreadsheet] load failed:', e);
      }
    })();
  }, [organizationId, accessToken, authHeaders]);

  const handleSummaryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSummaryFile(file);
  };

  // Build findings for Phase 2
  const findings: string[] = [];
  if (parsed && dfeData) {
    for (const abbrev of parsed.schools) {
      const info = abbrevLookup[abbrev];
      if (!info?.urn) continue;
      const y6Data = parsed.data[abbrev]?.["Year 6"];
      const selfReportY6 = y6Data ? getCombinedARE(y6Data.all_pupils) : null;
      if (selfReportY6 === null) continue;

      const schoolUrn = info.urn;
      const ks2Years = [2023, 2024, 2025];
      const historical = ks2Years.map((year) => getKs2CombinedForUrn(dfeData.ks2Results, schoolUrn, year)).filter((v): v is number => v !== null);
      if (historical.length === 0) continue;

      const bestEver = Math.max(...historical);
      const diff = selfReportY6 - bestEver;
      if (diff > 10) {
        findings.push(`${abbrev} claims ${selfReportY6}% Combined (Y6) — best-ever KS2 was ${bestEver}%. That's ${Math.round(diff)}pp above track record.`);
      } else if (diff > 5) {
        findings.push(`${abbrev} self-reports ${selfReportY6}% Combined (Y6) — slightly above best KS2 of ${bestEver}%. Worth monitoring.`);
      } else if (diff < -15) {
        findings.push(`${abbrev} reports ${selfReportY6}% Combined (Y6) — significantly below their best KS2 of ${bestEver}%. May indicate a weaker cohort or honest reporting.`);
      }
    }
  }

  const activeCapture = currentCapturePeriod ? capturesByPeriod[currentCapturePeriod] : null;
  const activeSubmissionName = activeCapture?.capture_name ?? activeCapture?.file_name ?? fileName ?? "Latest submission";
  const inferredCapturePeriod = currentCapturePeriod
    ?? (/mid/i.test(activeSubmissionName) ? "mid_year" : /autumn/i.test(activeSubmissionName) ? "autumn_term" : null);
  const activeSubmissionDate = formatShortDate(activeCapture?.created_at);
  const activeSubmissionLabel = inferredCapturePeriod === "mid_year"
    ? "Mid-year submission"
    : inferredCapturePeriod === "autumn_term"
      ? "Autumn submission"
      : isTrustLevel
        ? `${organisationLabelTitle} data capture`
        : "School submission";
  const showFullCapturePanel = !parsed;

  return (
    <AbbrevLookupContext.Provider value={tabSchoolLookup}>
    <div className="trust-assessor-page min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{isLocalAuthorityLevel ? "Local Authority School Improvement Assessor" : "Trust Assessor"}</h1>
              <p className="text-sm text-muted-foreground">Upload mid-year data. Cross-reference with DfE. No AI — pure numbers.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ─── Data captures for the active org ──────────────────────────── */}
        {/* Always visible at the top so school-level users (no spreadsheet yet) */}
        {/* can create captures directly. For trust users it shows the trust's  */}
        {/* own captures; each school's captures still render inside SchoolTab. */}
        {organizationId && accessToken && showFullCapturePanel && (
          <CapturesPanel
            organizationId={organizationId}
            authHeaders={authHeaders}
          />
        )}
        {organizationId && accessToken && !showFullCapturePanel && (
          <details className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm">
            <summary className="cursor-pointer list-none text-muted-foreground hover:text-foreground">
              <span className="font-medium text-foreground">Data captures</span>
              <span className="mx-2 text-border">·</span>
              <span>{activeSubmissionLabel}</span>
              {activeSubmissionDate && <span className="ml-2">updated {activeSubmissionDate}</span>}
              <span className="ml-2 text-xs text-muted-foreground/70">(open to manage)</span>
            </summary>
            <div className="mt-4">
              <CapturesPanel
                organizationId={organizationId}
                authHeaders={authHeaders}
              />
            </div>
          </details>
        )}

        {/* ─── Connector Strip (minimal) ─────────────────────────────────── */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          {/* Connector 1: Spreadsheet */}
          <div className="flex items-center gap-1.5">
            {parsed ? (
              <>
                <Cloud size={12} className="text-emerald-500" />
                <span className="text-foreground font-medium truncate max-w-[220px]">{activeSubmissionLabel}</span>
                <span className="text-muted-foreground/70 truncate max-w-[220px]">{activeSubmissionName}</span>
                {activeSubmissionDate && <span className="text-muted-foreground/70">{activeSubmissionDate}</span>}
                {connector && <span className="text-emerald-500">●</span>}
                <button
                  onClick={async () => {
                    if (connector?.id && organizationId) {
                      await fetch(`/api/app-connectors?id=${connector.id}&organizationId=${organizationId}`, { method: 'DELETE', credentials: 'include', headers: authHeaders });
                    }
                    setParsed(null); setFileName(null); setConnector(null); setConnectorError(null);
                  }}
                  className="text-muted-foreground/50 hover:text-red-500"
                  title="Disconnect"
                >✕</button>
              </>
            ) : connector && !driveConnected ? (
              <>
                <Cloud size={12} className="text-amber-400" />
                <span className="text-amber-600 truncate max-w-[200px]">{connector.source_file_name}</span>
                <span className="text-amber-400">⚠</span>
              </>
            ) : connectorLoading ? (
              <>
                <Cloud size={12} className="text-blue-400 animate-pulse" />
                <span className="text-muted-foreground">Loading...</span>
              </>
            ) : (
              <>
                <Cloud size={12} className="text-muted-foreground/50" />
                <button onClick={() => setShowDrivePicker(true)} className="text-blue-600 hover:text-blue-800 font-medium">Connect</button>
                <span className="text-border">|</span>
                <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground">upload</button>
              </>
            )}
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
          </div>
          <span className="text-border">·</span>
          {/* Connector 2: DfE */}
          <div className="flex items-center gap-1" title="Schoolgle DfE Database">
            <Database size={12} className={dfeData ? "text-blue-500" : "text-muted-foreground/50"} />
            <span className={dfeData ? "text-muted-foreground" : "text-muted-foreground/70"}>{dfeData ? "DfE loaded" : "DfE loading"}</span>
          </div>
          <span className="text-border">·</span>
          {/* Connector 3: School Data Summary (per-school) */}
          <div className="flex items-center gap-1.5" title="School Data Summary — per-school Autumn/Mid/Target/EOY breakdown">
            <FileSpreadsheet size={12} className={summaryData ? "text-orange-500" : "text-gray-300"} />
            {summaryData ? (
              <>
                <span className="text-foreground font-medium truncate max-w-[180px]">{summaryFileName}</span>
                <span className="text-orange-500 text-[10px] font-semibold">{summaryData.schoolAbbrev}</span>
                <button
                  onClick={() => {
                    setSummaryData(null);
                    setSummaryFileName(null);
                    setSummaryParseError(null);
                    if (organizationId) {
                      fetch(`/api/trust-analysis/school-summary?organizationId=${organizationId}`, {
                        method: 'DELETE',
                        headers: authHeaders,
                      }).catch((err) => console.error('[school-summary] delete failed:', err));
                    }
                  }}
                  className="text-muted-foreground/50 hover:text-red-500"
                  title="Remove school data summary"
                >✕</button>
              </>
            ) : (
              <>
                <button onClick={() => summaryFileInputRef.current?.click()} className="text-orange-600 hover:text-orange-800 font-medium">
                  + Add school summary
                </button>
              </>
            )}
            <input ref={summaryFileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleSummaryFileChange} />
          </div>
          <span className="text-border">·</span>
          {/* Connector 4: Per-pupil */}
          <div className="flex items-center gap-1" title="Per-pupil assessment data">
            <UserCheck size={12} className={perPupilStats ? "text-emerald-500" : "text-muted-foreground/50"} />
            <span className={perPupilStats ? "text-emerald-600 font-medium" : "text-muted-foreground/70"}>
              {perPupilStats
                ? `Pupil data connected (${perPupilStats.totalPupils} pupils)`
                : activeSchoolTab === "overview"
                  ? "Open a school for pupil data"
                  : "Pupil data not connected"}
            </span>
          </div>
        </div>
        {summaryParseError && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700 mt-2">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <span><span className="font-semibold">School Summary parse error:</span> {summaryParseError}</span>
          </div>
        )}

        {/* Connector error — with clear action buttons */}
        {connectorError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={18} className="flex-shrink-0 mt-0.5 text-amber-500" />
              <div>
                <div className="font-semibold mb-1">Could not load your spreadsheet</div>
                <div className="text-amber-700">{connectorError}</div>
              </div>
            </div>
            <div className="flex gap-3 ml-7">
              <button
                onClick={() => setShowDrivePicker(true)}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Cloud size={14} />
                Reconnect to Google Drive
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-amber-700 border border-amber-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Upload size={14} />
                Upload file instead
              </button>
            </div>
          </div>
        )}

        {/* Drive picker modal */}
        {showDrivePicker && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowDrivePicker(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Connect to Google Drive</h3>
              <p className="text-sm text-gray-500 mb-4">Select your {organisationLabel}&apos;s mid-year data capture spreadsheet. This connection will be saved — the report will always use the latest version of this file.</p>
              <DriveFilePicker onFileSelected={(file, driveFileId, drivePath) => {
                processFile(file, driveFileId, drivePath);
                setShowDrivePicker(false);
              }} />
            </div>
          </div>
        )}

        {/* Key Findings ? visible once product data is loaded */}
        {parsed && <KeyFindingsBanner parsed={parsed} isTrustLevel={isTrustLevel} audience={audience} />}
        {!parsed && publicDataPrimaryReport && !isSingleSchoolPublicDataReport && (
          <KeyFindingsBanner parsed={buildDfeDerivedParsedSpreadsheet(publicDataPrimaryReport)} isTrustLevel={isTrustLevel} audience={audience} sourceLabel="from validated DfE data" />
        )}

        {!parsed && publicDataReport && !isSingleSchoolPublicDataReport && (
          <PhaseAwarePublicDataSpine
            report={publicDataReport}
            activePhase={activePublicDataPhase}
            onPhaseChange={setActivePublicDataPhase}
            selectedYear={selectedPublicDataYear}
            onYearChange={setSelectedPublicDataYear}
            onSelectSchool={(schoolName) => {
              setActiveSchoolTab(abbreviateSchoolName(schoolName));
              const el = document.getElementById("school-tabs-section");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        )}

        {parsed && publicDataReport && !isSingleSchoolPublicDataReport && (
          <PublicDataTrustOverview
            report={publicDataReport}
            selectedYear={selectedPublicDataYear}
            onYearChange={setSelectedPublicDataYear}
            onSelectSchool={(schoolName) => {
              setActiveSchoolTab(abbreviateSchoolName(schoolName));
              const el = document.getElementById("school-tabs-section");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        )}

        {publicDataReportError && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold">Public DfE report unavailable</div>
              <div className="text-xs">{publicDataReportError}</div>
            </div>
          </div>
        )}

        {/* No data — step-by-step guide */}
        {!parsed && !publicDataReport && !showDrivePicker && !connectorLoading && !connectorError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-8 dark:border-slate-700 dark:bg-slate-900"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1 dark:text-white">
              {publicDataReport ? "Public DfE report is live — add richer school data when ready" : "Get started in 3 steps"}
            </h2>
            <p className="text-sm text-gray-500 mb-6 dark:text-slate-400">
              {publicDataReport
                ? "The product now works from the organisation's schools and URNs. A spreadsheet is optional and adds self-reported assessment layers on top of the live DfE report."
                : `Connect your ${organisationLabel}'s data sources to unlock each layer of analysis.`}
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-4 border border-blue-200 bg-blue-50 rounded-lg dark:border-blue-500/30 dark:bg-blue-950/30">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1 dark:text-blue-100">{publicDataReport ? "Optional: connect your mid-year data spreadsheet" : "Connect your mid-year data spreadsheet"}</div>
                  <p className="text-sm text-gray-600 mb-3 dark:text-slate-300">
                    The Excel spreadsheet your {organisationLabel} uses to capture mid-year assessment data (EYFS to Year 6).
                    We&apos;ll analyse it instantly — no changes to your file.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDrivePicker(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Cloud size={14} />
                      Connect from Google Drive
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      <Upload size={14} />
                      Upload file
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 — shown but locked */}
              <div className="flex items-start gap-4 p-4 border border-gray-200 bg-gray-50 rounded-lg opacity-60 dark:border-slate-700 dark:bg-slate-800/70">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <div>
                  <div className="font-semibold text-gray-500 dark:text-slate-300">DfE Intelligence unlocks automatically</div>
                  <p className="text-sm text-gray-400 dark:text-slate-400">
                    Once your spreadsheet is connected, we cross-reference it against 3 years of validated KS2 results
                    and census data from the DfE. {dfeData ? '877 KS2 records ready.' : 'Loading DfE data...'}
                  </p>
                </div>
              </div>

              {/* Step 3 — shown but locked */}
              <div className="flex items-start gap-4 p-4 border border-gray-200 bg-gray-50 rounded-lg opacity-60 dark:border-slate-700 dark:bg-slate-800/70">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <div>
                  <div className="font-semibold text-gray-500 dark:text-slate-300">Per-pupil analytics (optional)</div>
                  <p className="text-sm text-gray-400 dark:text-slate-400">
                    Connect your CTF assessment files for per-pupil tracking from EYFS to KS2.
                    Shows individual pupil journeys, SEND overlay, and assessment accuracy validation.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {publicDataReport && !parsed && (
          <section id="school-tabs-section" className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">
                {isSingleSchoolPublicDataReport ? "School report" : "School-level reports"}
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {isSingleSchoolPublicDataReport ? "DfE-backed school view" : `DfE-backed tabs for ${activePublicDataPhaseLabel}`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isSingleSchoolPublicDataReport
                  ? "This view uses the school's registered URN and the Schoolgle DfE warehouse. Assessment captures and CTF/MIS files can add current in-year and pupil-level layers later."
                  : `Showing ${phaseFilteredPublicDataSchools.length} ${activePublicDataPhaseLabel}. Choose Overview in the phase selector above to bring every school back into this list.`}
              </p>
            </div>
            {isTrustLevel && (
              <div className="mb-5 flex items-center gap-1 overflow-x-auto border-b border-border pb-1">
                <button
                  onClick={() => setActiveSchoolTab("overview")}
                  className={`flex-shrink-0 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${activeSchoolTab === "overview" ? "border border-b-card border-border bg-card -mb-px text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                >
                  Overview
                </button>
                {visibleSchoolAbbrevs.map((school) => {
                  const schoolInfo = tabSchoolLookup[school];
                  return (
                    <button
                      key={school}
                      onClick={() => setActiveSchoolTab(school)}
                      className={`inline-flex max-w-[260px] flex-shrink-0 items-center gap-2 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${activeSchoolTab === school ? "border border-b-card border-border bg-card -mb-px text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                      title={schoolInfo?.name ?? school}
                    >
                      <SchoolLogoMark school={school} info={schoolInfo} size="sm" />
                      <span className="truncate">{schoolInfo?.name ?? school}</span>
                    </button>
                  );
                })}
              </div>
            )}
            {activeSchoolTab === "overview" && isTrustLevel ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                Choose a school tab to see its DfE-backed school report. The overview cards above show the local authority-wide picture.
              </div>
            ) : (
              <DfeOnlySchoolTab schoolKey={activePublicDataSchoolKey} report={publicDataReport} />
            )}
          </section>
        )}

        {/* Parse error */}
        {parseError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Could not parse spreadsheet</div>
              <div>{parseError}</div>
            </div>
          </div>
        )}

        {/* ─── Phase 1: Your Data ──────────────────────────────────────────── */}
        <AnimatePresence>
          {parsed && (
            <motion.section
              key="phase1"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl p-6 space-y-8"
            >
              <SectionHeader
                number={1}
                title={isTrustLevel ? `${organisationLabelTitle} Data` : "School Report"}
                subtitle={isTrustLevel
                  ? `${organisationLabelTitle}-level capture parsed deterministically from the connected submission.`
                  : "Headline findings, DfE review, cohort gaps and evidence for this school."}
                complete
              />

              <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                <div className="font-semibold text-foreground">{activeSubmissionLabel}: {activeSubmissionName}</div>
                <div className="mt-1">
                  {isTrustLevel
                    ? `These figures summarise the schools included in the selected ${organisationLabel} capture.`
                    : `${parsed.schools[0] ?? "This school"} figures summarise what was submitted in this capture. If EYFS or other year groups were not included, they are intentionally not counted here.`}
                  {activeSubmissionDate && <span> Last updated {activeSubmissionDate}.</span>}
                </div>
              </div>

              {isTrustLevel && (
                <TrustExecutiveOverview
                  parsed={parsed}
                  audience={audience}
                  parentBranding={publicDataReport?.parent ?? null}
                />
              )}

              {/* ── 1. Trust Summary Bar ── */}
              {isTrustLevel && (() => {
                const submittedYearGroups = getSubmittedYearGroups(parsed);
                let totalPupils = 0;
                let totalFsmRaw = 0;
                let totalSend = 0;
                for (const school of parsed.schools) {
                  for (const yg of submittedYearGroups) {
                    const d = parsed.data[school]?.[yg];
                    if (!d) continue;
                    const cohortN = d.cohort.number_in_cohort;
                    if (cohortN !== null) totalPupils += cohortN;
                    if (d.cohort.number_fsm !== null) {
                      // Guard: if number_fsm > cohort size it was probably stored as a percentage-like number
                      // Only add if it's a plausible raw count (≤ cohort size or cohort unknown)
                      const fsm = d.cohort.number_fsm;
                      const isPlausibleCount = cohortN === null || fsm <= cohortN;
                      if (isPlausibleCount) {
                        totalFsmRaw += fsm;
                      } else {
                        // Treat as percentage — compute count from cohort
                        const pct = fsm > 100 ? fsm / 100 : fsm;
                        totalFsmRaw += Math.round(pct * (cohortN ?? 0) / 100);
                      }
                    }
                    if (d.cohort.number_send !== null) totalSend += d.cohort.number_send;
                  }
                }
                const fsmPct = totalPupils > 0 ? Math.round((totalFsmRaw / totalPupils) * 1000) / 10 : null;
                const sendPct = totalPupils > 0 ? Math.round((totalSend / totalPupils) * 1000) / 10 : null;

                // Compute same aggregates for the OTHER capture so we can show prior-capture subtitles.
                const otherKey: 'autumn_term' | 'mid_year' = currentCapturePeriod === 'autumn_term' ? 'mid_year' : 'autumn_term';
                const otherParsed = capturesByPeriod[otherKey]?.parsed_data ?? null;
                let otherTotalPupils = 0, otherTotalFsm = 0;
                if (otherParsed) {
                  const otherYearGroups = getSubmittedYearGroups(otherParsed);
                  for (const sch of otherParsed.schools) {
                    for (const yg of otherYearGroups) {
                      const d = otherParsed.data[sch]?.[yg];
                      if (!d) continue;
                      if (d.cohort.number_in_cohort !== null) otherTotalPupils += d.cohort.number_in_cohort;
                      if (d.cohort.number_fsm !== null && d.cohort.number_fsm <= (d.cohort.number_in_cohort ?? Infinity)) otherTotalFsm += d.cohort.number_fsm;
                    }
                  }
                }
                const currentSource: StatSource = currentCapturePeriod === 'mid_year' ? 'mid_year' : currentCapturePeriod === 'autumn_term' ? 'autumn' : 'trust_spreadsheet';
                const otherLabel = otherKey === 'mid_year' ? 'Mid-Year' : 'Autumn';
                const sourceLabel = isTrustLevel ? undefined : activeSubmissionLabel;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {isTrustLevel && <StatCard label="Schools" value={parsed.schools.length} sub={parsed.schools.join(", ")} source={currentSource} sourceLabel={sourceLabel} />}
                    <StatCard label={isTrustLevel ? "Year groups" : "Submitted year groups"} value={submittedYearGroups.length} sub={submittedYearGroups.join(", ")} source={currentSource} sourceLabel={sourceLabel} />
                    <StatCard label="Data points" value={parsed.totalDataPoints.toLocaleString()} source={currentSource} sourceLabel={sourceLabel} />
                    <StatCard
                      label={isTrustLevel ? "Total pupils" : "Pupils in submission"}
                      value={totalPupils > 0 ? totalPupils.toLocaleString() : "—"}
                      sub={isTrustLevel ? "included year groups" : "not the DfE census roll"}
                      source={currentSource}
                      sourceLabel={sourceLabel}
                      priorValue={otherParsed && otherTotalPupils > 0 ? otherTotalPupils.toLocaleString() : undefined}
                      priorLabel={`${otherLabel}`}
                    />
                    <StatCard
                      label="FSM pupils"
                      value={totalFsmRaw > 0 ? Math.round(totalFsmRaw).toLocaleString() : "—"}
                      sub={fsmPct !== null ? `${Math.round(fsmPct)}% ${isTrustLevel ? "trust-wide" : "of submitted pupils"}` : undefined}
                      source={currentSource}
                      sourceLabel={sourceLabel}
                      priorValue={otherParsed && otherTotalFsm > 0 ? Math.round(otherTotalFsm).toLocaleString() : undefined}
                      priorLabel={`${otherLabel}`}
                    />
                    <StatCard label="Quality flags" value={parsed.qualityFlags.length} sub={parsed.qualityFlags.length > 0 ? "See below" : "None"} source={currentSource} sourceLabel={sourceLabel} />
                  </div>
                );
              })()}

              {/* ── 2. Traffic Light Summary Grid ── */}
              {isTrustLevel && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Y6 Summary — Traffic Light View</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Schools sorted by Year 6 cohort size (largest first). Click a school name to drill into its detail.</p>
                  </div>
                </div>
                <TrafficLightGrid
                  parsed={parsed}
                  onSchoolClick={(school) => {
                    setActiveSchoolTab(school);
                    const el = document.getElementById("school-tabs-section");
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                  <Info size={10} />
                  Source: Trust mid-year data capture spreadsheet (2025/26). Self-reported — not externally validated.
                </div>
              </div>
              )}

              {/* ── 2b. Full Year Group Heatmap (collapsed by default) ── */}
              {isTrustLevel && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowFullHeatmap((o) => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                >
                  <span className="font-medium text-gray-700">Full Year Group Detail (all subjects, all year groups)</span>
                  {showFullHeatmap ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                <AnimatePresence>
                  {showFullHeatmap && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 border-t border-gray-100">
                        <SubjectHeatmap
                          parsed={parsed}
                          onSchoolClick={(school) => {
                            setActiveSchoolTab(school);
                            const el = document.getElementById("school-tabs-section");
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                          }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              )}

              {/* ── 3. School Tabs ── */}
              <div id="school-tabs-section">
                {/* Tab bar */}
                {isTrustLevel && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-4 border-b border-gray-200">
                  {isTrustLevel && (
                    <button
                      onClick={() => setActiveSchoolTab("overview")}
                      className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSchoolTab === "overview" ? "bg-card border border-b-card border-border -mb-px text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                    >
                      Trust Overview
                    </button>
                  )}
                  {visibleSchoolAbbrevs.map((school) => {
                    const schoolInfo = tabSchoolLookup[school];
                    return (
                      <motion.button
                        key={school}
                        onClick={() => setActiveSchoolTab(school)}
                        whileHover={activeSchoolTab !== school ? { scale: 1.04 } : {}}
                        className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors inline-flex items-center gap-2 ${activeSchoolTab === school ? "bg-card border border-b-card border-border -mb-px text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
                      >
                        <SchoolLogoMark school={school} info={schoolInfo} size="sm" />
                        {school}
                      </motion.button>
                    );
                  })}
                </div>
                )}

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  {activeSchoolTab === "overview" && isTrustLevel ? (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TrustInsights parsed={parsed} audience={audience} onSchoolClick={(school) => {
                        setActiveSchoolTab(school);
                        const el = document.getElementById("school-tabs-section");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeSchoolTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
            {parsed.schools.includes(activeSchoolTab) ? (
              <>
                    <SchoolTab key={activeSchoolTab} school={activeSchoolTab} parsed={parsed} dfeData={dfeData} staffingSnapshots={staffingSnapshots} summaryData={summaryData?.schoolAbbrev === activeSchoolTab ? summaryData : null} authToken={accessToken ?? undefined} organizationId={organizationId ?? undefined} capturesByPeriod={capturesByPeriod} urnToOrgId={urnToOrgId} showCapturesPanel={isTrustLevel} pupilRecords={perPupilData?.cohortJourneys ?? []} spotlightPupilId={perPupilData?.spotlightPupil?.pupilId ?? null} defendNumbersData={perPupilData?.demographicDisaggregation ?? null} currentProfileDisaggregation={perPupilData?.currentProfileDisaggregation ?? null} assessmentIntelligence={perPupilData?.assessmentIntelligence ?? null} unifiedEvidenceTimeline={perPupilData?.unifiedEvidenceTimeline ?? null} kpiLoading={kpiLoading} kpiError={kpiError} laBenchmarks={laBenchmarks} demographicCohort={demographicCohort} schoolKpiData={schoolKpiData} urnValidation={urnValidation} kpiSchoolName={selectedKpiSchool?.name ?? null} audience={audience} />
                {publicDataReport && (
                  <div className="mt-6">
                    <DfeOnlySchoolTab schoolKey={activeSchoolTab} report={publicDataReport} />
                  </div>
                )}
              </>
            ) : (
              <DfeOnlySchoolTab schoolKey={activeSchoolTab} report={publicDataReport} />
            )}

                      {/* BUILD 4: No-CTF upsell for non-GHPS schools */}
                      {!perPupilData && activeSchoolTab !== 'overview' && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-6"
                        >
                          <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
                            <div className="h-1 bg-sky-500" />
                            <div className="p-6">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase tracking-wider">Tier 3 — Per-Pupil Analysis</span>
                              </div>
                              <h3 className="text-lg font-semibold text-foreground mb-2">Connect CTF data for {tabSchoolLookup[activeSchoolTab]?.name ?? activeSchoolTab}</h3>
                              <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
                                You&apos;re seeing the spreadsheet + DfE forensic layer. The per-pupil analysis — tracking every child&apos;s journey from EYFS through KS1 and generating named intervention plans — activates when CTF files are connected.
                              </p>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                  <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Individual Child Tracking</div>
                                  <div className="text-sm text-foreground">See every pupil&apos;s journey from Reception to Y6. Identify who may need support and why.</div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                  <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Cohort Analysis</div>
                                  <div className="text-sm text-foreground">Cross-reference cohort trends with research-backed demographic benchmarks.</div>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                                  <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Ed Intervention Plans</div>
                                  <div className="text-sm text-foreground">AI-generated 6-week plans for named pupils. EEF-evidenced strategies.</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <span className="bg-sky-600 text-white rounded px-3 py-1.5 font-semibold cursor-pointer hover:bg-sky-700 transition-colors">
                                  Book CTF upload session &rarr;
                                </span>
                                <span className="text-muted-foreground text-xs">Takes ~15 minutes to connect</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── 4. Data Quality Flags ── */}
              {(() => {
                // Compute additional quality flags from parsed data
                const extraFlags: QualityFlag[] = [];

                // Missing or blank EYFS
                for (const school of parsed.schools) {
                  const eyfs = parsed.data[school]?.["EYFS"];
                  const hasEyfsCohort = Boolean(eyfs?.cohort.number_in_cohort);
                  const hasEyfsOutcome = eyfs?.all_pupils.gld !== null && eyfs?.all_pupils.gld !== undefined;
                  if (!eyfs || (!hasEyfsCohort && !hasEyfsOutcome)) {
                    extraFlags.push({ school, yearGroup: "EYFS", field: "gld", issue: `${school} has not submitted EYFS data`, severity: "warning" });
                  } else if (!hasEyfsOutcome) {
                    extraFlags.push({ school, yearGroup: "EYFS", field: "gld", issue: `${school} has EYFS cohort data but no GLD outcome`, severity: "warning" });
                  }
                }

                // Zero GD Writing across multiple year groups
                for (const school of parsed.schools) {
                  const zeroYgs: string[] = [];
                  for (const yg of HEATMAP_YEAR_GROUPS) {
                    const d = parsed.data[school]?.[yg];
                    if (d && d.all_pupils.w_gd === 0) zeroYgs.push(yg.replace("Year ", "Y"));
                  }
                  if (zeroYgs.length >= 2) {
                    extraFlags.push({ school, yearGroup: zeroYgs.join(", "), field: "w_gd", issue: `Zero Greater Depth in Writing across ${zeroYgs.join(", ")}`, severity: "warning" });
                  }
                }

                // Implausible pipeline jumps
                for (const school of parsed.schools) {
                  for (let i = 1; i < HEATMAP_YEAR_GROUPS.length; i++) {
                    const prev = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i - 1]]?.all_pupils.c_are ?? null;
                    const curr = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i]]?.all_pupils.c_are ?? null;
                    if (prev !== null && curr !== null && Math.abs(curr - prev) > 15) {
                      extraFlags.push({
                        school,
                        yearGroup: `${HEATMAP_YEAR_GROUPS[i - 1].replace("Year ", "Y")}→${HEATMAP_YEAR_GROUPS[i].replace("Year ", "Y")}`,
                        field: "c_are",
                        issue: `Implausible pipeline jump: ${prev}% → ${curr}% (${curr > prev ? "+" : ""}${Math.round(curr - prev)}pp)`,
                        severity: "warning",
                      });
                    }
                  }
                }

                const allFlags = [...parsed.qualityFlags, ...extraFlags];
                if (allFlags.length === 0) return null;

                const errors = allFlags.filter((f) => f.severity === "error");
                const warnings = allFlags.filter((f) => f.severity === "warning");
                const visibleAll = showAllFlags ? allFlags : allFlags.slice(0, 6);

                return (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Data Quality</h3>
                      <div className="flex items-center gap-2">
                        {errors.length > 0 && (
                          <span className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">{errors.length} error{errors.length > 1 ? "s" : ""}</span>
                        )}
                        {warnings.length > 0 && (
                          <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">{warnings.length} warning{warnings.length > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {visibleAll.map((flag, i) => (
                        <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${flag.severity === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
                          {flag.severity === "error" ? <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />}
                          <span>
                            <span className="font-semibold">{flag.school}</span>
                            {flag.yearGroup ? ` / ${flag.yearGroup}` : ""}
                            {flag.field ? ` / ${flag.field}` : ""}
                            {": "}
                            {flag.issue}
                          </span>
                        </div>
                      ))}
                    </div>
                    {allFlags.length > 6 && (
                      <button
                        onClick={() => setShowAllFlags(!showAllFlags)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        {showAllFlags ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {showAllFlags ? "Show fewer" : `Show all ${allFlags.length} flags`}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* ── 6. Data Source Label ── */}
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                <Info size={12} />
                Source: Trust mid-year data capture spreadsheet (2025/26). Self-reported by each school — not externally validated.
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {!parsed && (
        <>
        {/* ─── Phase 1 → Phase 2 Divider ──────────────────────────────────── */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-gray-200" />
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {/* Connector 1 status */}
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium ${parsed ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-gray-100 border-gray-200 text-gray-400"}`}>
              <FileSpreadsheet size={11} />
              Spreadsheet {parsed ? "connected" : "not connected"}
            </span>
            <span className="text-gray-300">→</span>
            {/* Connector 2 status */}
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-medium ${dfeData ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-gray-100 border-gray-200 text-gray-400"}`}>
              <Database size={11} />
              DfE {dfeData ? "live" : dfeLoading ? "loading..." : "unavailable"}
            </span>
            <span className="text-gray-300">→</span>
            {/* Connector 3 status */}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-gray-100 border-gray-200 text-gray-400 font-medium">
              <Lock size={11} />
              Per-pupil locked
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* ─── Phase 2: DfE Intelligence ──────────────────────────────────── */}
        {(!publicDataReport || parsed) && (
        <section id="dfe-intelligence-section" className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionHeader
            number={2}
            title="DfE Intelligence"
            subtitle="Validated KS2 results and census data, cross-referenced against self-reported figures."
            complete={!!dfeData}
          />

          {dfeLoading && (
            <div className="flex items-center gap-3 text-sm text-gray-500 py-8 justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
              Loading DfE data...
            </div>
          )}

          {dfeError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Could not load DfE data</div>
                <div className="text-xs mt-0.5">{dfeError}</div>
                <button onClick={() => window.location.reload()} className="text-xs underline mt-1">Retry</button>
              </div>
            </div>
          )}

          {dfeData && (
            <>
              {/* Source note */}
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-5">
                <Info size={13} />
                Source: DfE performance tables (KS2) and annual school census. Validated data — not self-reported.
                KS2 results: {dfeData.ks2Results.length.toLocaleString()} rows. Census: {dfeData.census.length.toLocaleString()} rows.
              </div>

              {parsed && (
                <>
                  <UrnValidationWarning validation={urnValidation} />

                  <DfeSchoolNarrativeCard
                    schoolName={selectedKpiSchool?.name ?? "this school"}
                    schoolData={schoolKpiData}
                    laBenchmarks={laBenchmarks}
                    demographicCohort={demographicCohort}
                  />

                  {kpiLoading && (
                    <div className="mb-6 flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-10">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                        <p className="text-sm text-gray-500">Loading DfE comparison dashboard...</p>
                      </div>
                    </div>
                  )}
                  {!kpiLoading && kpiError && (
                    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {kpiError}
                    </div>
                  )}
                  {!kpiLoading && !kpiError && laBenchmarks && schoolKpiData && (
                    <div className="mb-8">
                      <KpiDashboard
                        laBenchmarks={laBenchmarks}
                        demographicCohort={demographicCohort}
                        schoolData={schoolKpiData}
                        selectedSchoolName={selectedKpiSchool?.name ?? null}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Findings */}
              {findings.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Findings</h3>
                  <div className="space-y-2">
                    {findings.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                        <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!parsed && (
                <div className="text-center py-8 text-sm text-gray-400">
                  <School size={32} className="mx-auto mb-3 text-gray-300" />
                  Upload a spreadsheet in Phase 1 to see KS2 track record comparisons.
                </div>
              )}

              {/* KS2 Track Record — per school */}
              {parsed && (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">KS2 Combined % Track Record — DfE history + this year's self-reported captures</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        <span className="inline-flex items-center gap-1 mr-3"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500" /> KS2 2023–2025 — DfE validated</span>
                        <span className="inline-flex items-center gap-1 mr-3"><span className="inline-block w-3 h-3 rounded-sm bg-amber-400" /> Autumn Term 2025/26 — school self-report</span>
                        <span className="inline-flex items-center gap-1 mr-3"><span className="inline-block w-3 h-3 rounded-sm bg-purple-500" /> Mid-Year 2025/26 — school self-report</span>
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Dashed line = national average (61%). Red bar = self-report 10pp+ above best-ever KS2 — flagged as suspect. Self-reports are teacher-assessed, not DfE-moderated — trajectory between them is the forensic signal.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {(parsed as ParsedSpreadsheet).schools.map((abbrev: string) => {
                      const autumnY6 = capturesByPeriod.autumn_term?.parsed_data?.data?.[abbrev]?.["Year 6"];
                      const midYearY6 = capturesByPeriod.mid_year?.parsed_data?.data?.[abbrev]?.["Year 6"];
                      const selfReports = {
                        autumn_term: autumnY6 ? { combined: autumnY6.all_pupils.c_are ?? null } : null,
                        mid_year: midYearY6 ? { combined: midYearY6.all_pupils.c_are ?? null } : null,
                      };
                      const info = abbrevLookup[abbrev];
                      return (
                        <KS2TrackRecordChart
                          key={abbrev}
                          school={info?.name ?? abbrev}
                          abbrev={abbrev}
                          ks2Results={dfeData.ks2Results}
                          selfReports={selfReports}
                          selfReportLabels={selfReportLabels}
                        />
                      );
                    })}
                  </div>

                  {/* FSM Trends */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">FSM % Trend (DfE Census + this year&apos;s self-reports)</h3>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Info size={10} />
                      Source: DfE Annual School Census (blue) + Autumn (amber) &amp; Mid-Year (purple) self-report from trust spreadsheets.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(parsed as ParsedSpreadsheet).schools.map((abbrev: string) => {
                      // Compute each capture's FSM% = totalFsm / totalPupils across all year groups.
                      const fsmPctFor = (captureData?: ParsedSpreadsheet | null) => {
                        if (!captureData?.data?.[abbrev]) return null;
                        let fsm = 0, pupils = 0;
                        for (const yg of YEAR_GROUPS) {
                          const c = captureData.data[abbrev][yg]?.cohort;
                          if (!c) continue;
                          if (c.number_in_cohort !== null) pupils += c.number_in_cohort;
                          if (c.number_fsm !== null) fsm += c.number_fsm;
                        }
                        return pupils > 0 ? Math.round((fsm / pupils) * 1000) / 10 : null;
                      };
                      const selfReportFsmPcts = {
                        autumn_term: fsmPctFor(capturesByPeriod.autumn_term?.parsed_data ?? null),
                        mid_year: fsmPctFor(capturesByPeriod.mid_year?.parsed_data ?? null),
                      };
                      return (
                        <FsmTrendChart
                          key={abbrev}
                          abbrev={abbrev}
                          census={dfeData.census}
                          selfReportFsmPcts={selfReportFsmPcts}
                          selfReportLabels={selfReportLabels}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {/* No spreadsheet: render the SAME track-record and FSM-trend
                charts we show at trust level, just scoped to this school's URN.
                  Self-report bars stay empty (nothing to compare against yet
                  — spreadsheet or in-app captures fill them later), but the
                  DfE-blue historic bars and trend lines render for any URN. */}
              {!parsed && scopedSchools.length > 0 && (
                <>
                  <UrnValidationWarning validation={urnValidation} />

                  <DfeSchoolNarrativeCard
                    schoolName={selectedKpiSchool?.name ?? "this school"}
                    schoolData={schoolKpiData}
                    laBenchmarks={laBenchmarks}
                    demographicCohort={demographicCohort}
                  />

                  {kpiLoading && (
                    <div className="mb-6 flex items-center justify-center rounded-2xl border border-gray-200 bg-white py-10">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3"></div>
                        <p className="text-sm text-gray-500">Loading DfE comparison dashboard...</p>
                      </div>
                    </div>
                  )}
                  {!kpiLoading && kpiError && (
                    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      {kpiError}
                    </div>
                  )}
                  {!kpiLoading && !kpiError && laBenchmarks && schoolKpiData && (
                    <div className="mb-8">
                      <KpiDashboard
                        laBenchmarks={laBenchmarks}
                        demographicCohort={demographicCohort}
                        schoolData={schoolKpiData}
                        selectedSchoolName={selectedKpiSchool?.name ?? null}
                      />
                    </div>
                  )}

                  {/* Demographic snapshot — always external (DfE census).
                      Renders for any school with a URN; no self-report needed. */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Demographic Snapshot</h3>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Info size={10} />
                      Source: DfE Annual School Census — latest validated year with 3-year change.
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {scopedSchools.filter(s => s.urn).map((school) => (
                      <DemographicSnapshotCard
                        key={`demo-${school.id}`}
                        urn={school.urn!}
                        label={school.name}
                        census={dfeData.census}
                      />
                    ))}
                  </div>

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">
                        {scopedSchools.length === 1
                          ? `KS2 Combined % Track Record — ${scopedSchools[0].name}`
                          : 'Trust KS2 Combined % Track Record — DfE history'}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        <span className="inline-flex items-center gap-1 mr-3"><span className="inline-block w-3 h-3 rounded-sm bg-blue-500" /> KS2 2023–2025 — DfE validated</span>
                        <span className="text-gray-400">Add data captures to overlay school-named self-report snapshots.</span>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {scopedSchools.filter(s => s.urn).map((school) => (
                      <KS2TrackRecordChart
                        key={school.id}
                        school={school.name}
                        urn={school.urn!}
                        ks2Results={dfeData.ks2Results}
                        selfReports={null}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">FSM % Trend (DfE Annual School Census)</h3>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Info size={10} />
                      Source: DfE Annual School Census — validated, multi-year trend per school.
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scopedSchools.filter(s => s.urn).map((school) => (
                      <FsmTrendChart
                        key={school.id}
                        urn={school.urn!}
                        label={school.name}
                        census={dfeData.census}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>
        )}
        </>
        )}

        {!parsed && (
        <>
        {/* ─── Phase 3: Per-Pupil Deep Analytics ───────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionHeader number={3} title="Deep Analytics" subtitle={perPupilData ? `Per-pupil tracking from CTF assessment files. ${perPupilData.summary?.totalPupils || ''} pupils.` : "Per-pupil tracking from CTF assessment files. Connect your CTF to unlock pupil-level analysis."} />

          {!perPupilData ? (
            /* Locked state — no data yet */
            <div className="space-y-4">
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm max-w-md mx-auto text-left">
                <div className="flex items-center gap-2 mb-3">
                  <Lock size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-800">Connect your data to unlock</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-2 mb-4">
                  <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gray-400" /> Per-pupil cohort tracking from EYFS to KS2</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gray-400" /> SEND / FSM / EAL overlay at pupil level</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gray-400" /> Teacher assessment accuracy validation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={13} className="text-gray-400" /> AI-powered intervention recommendations</li>
                </ul>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Users size={12} />
                  Upload CTF assessment data to enable this module
                </div>
              </div>
            </div>
            </div>
          ) : (
            <div className="space-y-8">

              {/* ── Section 1: Grove House Profile ── */}
              <div>
                <div className="mb-1">
                  <h3 className="text-base font-semibold text-gray-900">
                    {(() => {
                      const activeSchoolName =
                        activeSchoolTab === "overview"
                          ? "Trust"
                         : tabSchoolLookup[activeSchoolTab]?.name ?? activeSchoolTab;
                      return `${activeSchoolName} — Per-Pupil Deep Dive`;
                    })()}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Data source: CTF assessment files (EYFS, KS1, Phonics). {perPupilData.summary.totalPupils} unique pupils across {perPupilData.summary.yearsSpan.length} years (includes leavers — not current roll).
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {[
                    { label: "Unique pupils (all years)", value: perPupilData.summary.totalPupils },
                    { label: "Trackable across years", value: perPupilData.summary.trackablePupils },
                    { label: "Years of data", value: perPupilData.summary.yearsSpan.length },
                    { label: "Assessment records", value: perPupilData.summary.totalRecords.toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="text-2xl font-bold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Section 2: EYFS GLD Trend ── */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">EYFS Good Level of Development (GLD) — Trend</h4>
                {perPupilData.eyfsGld.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                            <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pupils</th>
                            <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">GLD %</th>
                            <th className="text-left py-2 pl-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perPupilData.eyfsGld.map((row) => (
                            <tr key={row.year} className="border-b border-gray-100">
                              <td className="py-2 pr-4 text-gray-700 font-medium">{row.year}/{String(row.year + 1).slice(2)}</td>
                              <td className="py-2 px-4 text-right text-gray-600">{row.pupils}</td>
                              <td className={`py-2 px-4 text-right font-semibold ${row.gldPct < 60 ? 'text-red-600' : row.gldPct < 70 ? 'text-amber-600' : 'text-green-700'}`}>
                                {row.gldPct}%
                              </td>
                              <td className="py-2 pl-4">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-32">
                                    <div
                                      className={`h-2 rounded-full ${row.gldPct < 60 ? 'bg-red-500' : row.gldPct < 70 ? 'bg-amber-400' : 'bg-green-500'}`}
                                      style={{ width: `${Math.min(row.gldPct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {perPupilData.eyfsGld.length >= 2 && (() => {
                      const first = perPupilData.eyfsGld[0];
                      const last = perPupilData.eyfsGld[perPupilData.eyfsGld.length - 1];
                      const drop = first.gldPct - last.gldPct;
                      if (drop > 0) return (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
                          <span className="font-semibold">EYFS GLD is declining</span> — {first.gldPct}% to {last.gldPct}% over {perPupilData.eyfsGld.length} years
                          ({drop}pp drop). Fewer children entering Y1 with expected foundation skills.
                          <div className="text-xs text-red-600 mt-1">Source: CTF EYFS Profile data — validated per-pupil assessment, not self-reported</div>
                        </div>
                      );
                      return null;
                    })()}
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    EYFS GLD is not connected for this organisation yet. Upload CTF/EYFS profile data to unlock this validated per-pupil layer.
                  </div>
                )}
              </div>

              {/* ── Section 3: KS1 Anchor Points ── */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">KS1 Anchor Points — Expected Standard by Subject</h4>
                {perPupilData.ks1Data.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                            <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pupils</th>
                            <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reading</th>
                            <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Writing</th>
                            <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Maths</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perPupilData.ks1Data.map((row) => {
                            const pct = (subj: string) => {
                              const s = row.subjects[subj];
                              if (!s || s.total === 0) return null;
                              return Math.round(100 * (s.exs + s.gds) / s.total);
                            };
                            const r = pct('reading'); const w = pct('writing'); const m = pct('maths');
                            return (
                              <tr key={row.year} className="border-b border-gray-100">
                                <td className="py-2 pr-4 text-gray-700 font-medium">{row.year}/{String(row.year + 1).slice(2)}</td>
                                <td className="py-2 px-4 text-right text-gray-600">{row.pupils}</td>
                                <td className={`py-2 px-4 text-right font-semibold ${r !== null && r < 60 ? 'text-red-600' : r !== null && r < 70 ? 'text-amber-600' : 'text-green-700'}`}>{r !== null ? `${r}%` : '—'}</td>
                                <td className={`py-2 px-4 text-right font-semibold ${w !== null && w < 55 ? 'text-red-600' : w !== null && w < 65 ? 'text-amber-600' : 'text-green-700'}`}>{w !== null ? `${w}%` : '—'}</td>
                                <td className={`py-2 px-4 text-right font-semibold ${m !== null && m < 60 ? 'text-red-600' : m !== null && m < 70 ? 'text-amber-600' : 'text-green-700'}`}>{m !== null ? `${m}%` : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                      <span className="font-semibold">Writing has been consistently the weakest subject at KS1.</span> Cohorts entering KS2 with low Writing attainment carry that deficit forward into Y3-Y6.
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    KS1 anchor-point data is not connected for this organisation yet. Upload CTF/assessment exports to unlock this layer.
                  </div>
                )}
              </div>

              {/* -- Section 4: Live Cohort Forensics -- */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Live Cohort Forensics</h4>
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-600">
                  Cohort-forensic narratives only render when connected CTF, KS1 or school assessment data exists for this organisation. Schoolgle will not show illustrative pupil or cohort figures as if they were real.
                </div>
              </div>
              {/* -- Section 5: Pipeline Outlook ── */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Pipeline Outlook — Combined % by Current Year Group</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {["Y1", "Y2", "Y3", "Y4", "Y5", "Y6"].map((yg) => (
                          <th key={yg} className="py-2 px-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{yg}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {[
                          { yg: "Y1", pct: 44, note: "Concern" },
                          { yg: "Y2", pct: 62, note: "Strong" },
                          { yg: "Y3", pct: 44, note: "Concern" },
                          { yg: "Y4", pct: 51, note: "Watch" },
                          { yg: "Y5", pct: 71, note: "Strong" },
                          { yg: "Y6", pct: 48, note: "Urgent" },
                        ].map(({ yg, pct, note }) => (
                          <td key={yg} className="py-3 px-3 text-center">
                            <div className={`text-xl font-bold ${pct >= 65 ? 'text-green-700' : pct >= 55 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</div>
                            <div className={`text-xs mt-0.5 px-1.5 py-0.5 rounded inline-block ${pct >= 65 ? 'bg-green-50 text-green-700' : pct >= 55 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{note}</div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                  Y5 at 71% Combined suggests next year&apos;s KS2 cohort could be significantly stronger. But Y1 and Y3 at 44% are concerning for the 4-year pipeline. This is the data an Ofsted inspector would want to see before judging the direction of travel.
                </div>
              </div>

              {/* ── Section 6: Per-Pupil Journey Cards ── */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Per-Pupil Journey Tracking</h4>
                <p className="text-xs text-gray-500 mb-4">Pseudonymised pupil journeys from CTF data. Each card shows one child&apos;s assessment path from EYFS through KS1, with demographic context and support recommendations.</p>

                {/* Spotlight pupil first — full featured card */}
                {perPupilData.spotlightPupil && (() => {
                  const sp = perPupilData.spotlightPupil!;
                  const demo = sp.demographics;
                  const flags = [demo.isFsm && 'FSM', demo.isSend && 'SEND', demo.isEal && 'EAL'].filter(Boolean) as string[];

                  const levelValue = (l: string) => l === 'GDS' ? 3 : l === 'EXS' || l === '2' ? 2 : 1;
                  const trajectory = (levels: string[]) => {
                    if (levels.length < 2) return 'insufficient';
                    const first = levelValue(levels[0]);
                    const last = levelValue(levels[levels.length - 1]);
                    if (last > first) return 'improving';
                    if (last < first) return 'declining';
                    return 'stable';
                  };

                  return (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-sm font-bold text-blue-700">
                            {sp.pupilId.split(' ').map(w => w[0]).join('')}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">Pupil {sp.pupilId}</div>
                            <div className="text-xs text-gray-500">{sp.journey.length} assessment records across {[...new Set(sp.journey.map(j => j.year))].length} years</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {flags.map(f => (
                            <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              f === 'FSM' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              f === 'SEND' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                              'bg-cyan-100 text-cyan-700 border border-cyan-200'
                            }`}>{f}</span>
                          ))}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${demo.gender === 'M' ? 'bg-blue-100 text-blue-600' : demo.gender === 'F' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'}`}>
                            {demo.gender === 'M' ? 'Male' : demo.gender === 'F' ? 'Female' : demo.gender}
                          </span>
                        </div>
                      </div>

                      {/* Journey timeline */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        {['reading', 'writing', 'maths'].map(subj => {
                          const entries = sp.journey.filter(j => j.subject === subj);
                          const traj = trajectory(entries.map(e => e.level));
                          return (
                            <div key={subj} className="bg-white rounded-lg border border-gray-200 p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-600 uppercase">{subj}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  traj === 'improving' ? 'bg-green-100 text-green-700' :
                                  traj === 'declining' ? 'bg-red-100 text-red-700' :
                                  traj === 'stable' ? 'bg-gray-100 text-gray-600' :
                                  'bg-gray-50 text-gray-400'
                                }`}>
                                  {traj === 'improving' ? '↑ Improving' : traj === 'declining' ? '↓ Declining' : traj === 'stable' ? '→ Stable' : '—'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {entries.map((e, i) => (
                                  <div key={i} className="flex items-center gap-1">
                                    {i > 0 && <span className="text-gray-300 text-xs">→</span>}
                                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                      e.level === 'GDS' ? 'bg-green-100 text-green-700' :
                                      e.level === 'EXS' || e.level === '2' ? 'bg-blue-100 text-blue-700' :
                                      'bg-red-100 text-red-700'
                                    }`} title={`Y${e.yearGroup} (${e.year})`}>
                                      {e.level}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {entries.map(e => `Y${e.yearGroup}`).join(' → ')}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Support recommendation based on demographics + trajectory */}
                      <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs text-gray-600">
                        <span className="font-semibold text-gray-700">Support recommendation: </span>
                        {demo.isFsm && demo.isSend ?
                          'Dual-disadvantaged pupil (FSM + SEND). EEF evidence shows these pupils benefit most from structured 1:1 tuition and metacognition strategies. Priority for Pupil Premium intervention funding.' :
                         demo.isFsm ?
                          'Pupil Premium eligible. Monitor attainment gaps against non-FSM peers. EEF Toolkit recommends feedback, metacognition, and reading comprehension strategies (5+ months impact).' :
                         demo.isSend ?
                          'SEND registered. Review whether current provision (EHCP/SEN Support) is accelerating progress. Check graduated approach evidence is being maintained.' :
                         demo.isEal ?
                          'EAL learner. If new to English, expect rapid progress in Years 2-3 of immersion. If long-term EAL with persistent gaps, investigate whether language or curriculum knowledge is the barrier.' :
                          'No additional vulnerability flags. Monitor progress against year group expectations and investigate any subject-specific decline.'
                        }
                      </div>

                      {/* BUILD 2: Weakest subject + Plan with Ed */}
                      {(() => {
                        const weak = weakestSubject(sp.journey);
                        if (!weak) return null;
                        return (
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-500">Focus subject:</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                weak.avgLevel < 1.5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {weak.subject.charAt(0).toUpperCase() + weak.subject.slice(1)}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const edPrompt = `Create an intervention plan for pupil ${sp.pupilId} who needs focus on ${weak.subject}. ` +
                                  `Demographics: ${[demo.isFsm && 'FSM', demo.isSend && 'SEND', demo.isEal && 'EAL'].filter(Boolean).join(', ') || 'no additional flags'}. ` +
                                  `Year groups in journey: ${[...new Set(sp.journey.map(j => 'Y' + j.yearGroup))].join(', ')}. ` +
                                  `Use EEF-evidenced strategies and produce a 6-week plan with weekly check-ins.`;
                                const url = `/dashboard/ed?prompt=${encodeURIComponent(edPrompt)}`;
                                window.open(url, '_blank');
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium flex items-center gap-1"
                              title="Open Ed AI assistant to generate a tailored intervention plan"
                            >
                              Plan with Ed &rarr;
                            </button>
                          </div>
                        );
                      })()}

                      {/* BUILD 2b: Top 3 patterns across cohort — which subject is weakest for most pupils */}
                      {perPupilData && perPupilData.cohortJourneys.length > 0 && (() => {
                        const subjectCounts: Record<string, number> = { reading: 0, writing: 0, maths: 0 };
                        for (const p of perPupilData.cohortJourneys) {
                          const w = weakestSubject(p.journey);
                          if (w && w.subject in subjectCounts) subjectCounts[w.subject]++;
                        }
                        const total = perPupilData.cohortJourneys.length;
                        if (total === 0) return null;
                        const sorted = Object.entries(subjectCounts).sort(([, a], [, b]) => b - a);
                        return (
                          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Cohort pattern — weakest subject per pupil</div>
                            <div className="flex items-center gap-3">
                              {sorted.map(([subj, count]) => (
                                <div key={subj} className="flex-1 text-center">
                                  <div className={`text-sm font-bold ${count === sorted[0][1] ? 'text-red-600' : 'text-gray-600'}`}>{count}</div>
                                  <div className="text-[10px] text-gray-500 mt-0.5">{subj.charAt(0).toUpperCase() + subj.slice(1)}</div>
                                  <div className={`text-[10px] mt-0.5 ${count === sorted[0][1] ? 'text-red-500' : 'text-gray-400'}`}>
                                    {total > 0 ? Math.round(100 * count / total) : 0}%
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-2">Across {total} tracked pupils. Highest = most common focus area for Ed plans.</div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                {/* Grid of pupil journey cards — year-group filtered */}
                {perPupilData.cohortJourneys.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">{perPupilData.cohortJourneys.length} trackable pupils with multi-year data</span>
                    </div>
                    <PupilCardGrid
                      pupils={perPupilData.cohortJourneys}
                      spotlightPupilId={perPupilData.spotlightPupil?.pupilId ?? null}
                    />

                    {/* Demographic summary */}
                    {(() => {
                      const total = perPupilData.cohortJourneys.length;
                      const fsmCount = perPupilData.cohortJourneys.filter(p => p.demographics.isFsm).length;
                      const sendCount = perPupilData.cohortJourneys.filter(p => p.demographics.isSend).length;
                      const ealCount = perPupilData.cohortJourneys.filter(p => p.demographics.isEal).length;
                      const levelValue = (l: string) => l === 'GDS' ? 3 : l === 'EXS' || l === '2' ? 2 : 1;
                      const decliningCount = perPupilData.cohortJourneys.filter(p => {
                        const levels = p.journey.map(j => levelValue(j.level));
                        return levels.length >= 2 && levels[levels.length - 1] < levels[0];
                      }).length;

                      return (
                        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                          <div className="font-semibold text-gray-800 mb-2">Demographic Impact Summary</div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <div className="text-lg font-bold text-amber-600">{fsmCount}</div>
                              <div className="text-xs text-gray-500">FSM pupils ({total > 0 ? Math.round(100 * fsmCount / total) : 0}%)</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-purple-600">{sendCount}</div>
                              <div className="text-xs text-gray-500">SEND pupils ({total > 0 ? Math.round(100 * sendCount / total) : 0}%)</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-cyan-600">{ealCount}</div>
                              <div className="text-xs text-gray-500">EAL pupils ({total > 0 ? Math.round(100 * ealCount / total) : 0}%)</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-red-600">{decliningCount}</div>
                              <div className="text-xs text-gray-500">Declining trajectory ({total > 0 ? Math.round(100 * decliningCount / total) : 0}%)</div>
                            </div>
                          </div>
                          {fsmCount > 0 && decliningCount > 0 && (
                            <div className="mt-3 text-xs text-gray-600 bg-white rounded-lg border border-gray-200 p-3">
                              <span className="font-semibold">Ofsted focus area:</span> {(() => {
                                const fsmDeclining = perPupilData.cohortJourneys.filter(p => {
                                  const levels = p.journey.map(j => levelValue(j.level));
                                  return p.demographics.isFsm && levels.length >= 2 && levels[levels.length - 1] < levels[0];
                                }).length;
                                return `${fsmDeclining} of ${fsmCount} FSM pupils show declining trajectories. A governor might reasonably explore: "Does the Pupil Premium strategy address these specific pupils, and what evidence is there of impact from current interventions?"`;
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* ── BUILD 3: Data Enrichment Opportunities ── */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-5 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-200 text-violet-900 uppercase tracking-wider">Data Enrichment</span>
                  </div>
                  <h5 className="text-sm font-semibold text-violet-900 mb-2">These fields are in your CTF files but not currently imported</h5>
                  <p className="text-xs text-violet-800 mb-3">
                    Schoolgle can extract deeper analysis from CTF imports when these fields are populated. Each one unlocks a specific layer of insight governors and inspectors value.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    <div className="bg-white rounded-lg border border-violet-200 p-3 text-xs">
                      <div className="font-semibold text-violet-900">SEND category (VI, HI, ASD, SEMH, SLCN, MLD)</div>
                      <div className="text-violet-700 mt-0.5">Unlocks: &quot;3 pupils in VI resource unit — their Reading scores reflect visual access, not literacy&quot;</div>
                    </div>
                    <div className="bg-white rounded-lg border border-violet-200 p-3 text-xs">
                      <div className="font-semibold text-violet-900">EHCP status (separate from SEN Support)</div>
                      <div className="text-violet-700 mt-0.5">Unlocks: Progress against individual EHCP outcomes, not age-related expectations</div>
                    </div>
                    <div className="bg-white rounded-lg border border-violet-200 p-3 text-xs">
                      <div className="font-semibold text-violet-900">FSM6 (ever-eligible in last 6 years)</div>
                      <div className="text-violet-700 mt-0.5">Unlocks: True disadvantage analysis — FSM6 is the DfE statutory measure, not current FSM</div>
                    </div>
                    <div className="bg-white rounded-lg border border-violet-200 p-3 text-xs">
                      <div className="font-semibold text-violet-900">Prior attainment band</div>
                      <div className="text-violet-700 mt-0.5">Unlocks: Progress measure per pupil — are low prior attainers catching up?</div>
                    </div>
                    <div className="bg-white rounded-lg border border-violet-200 p-3 text-xs">
                      <div className="font-semibold text-violet-900">Date of arrival in UK (EAL pupils)</div>
                      <div className="text-violet-700 mt-0.5">Unlocks: Language exposure vs attainment — have they had enough time?</div>
                    </div>
                    <div className="bg-white rounded-lg border border-violet-200 p-3 text-xs">
                      <div className="font-semibold text-violet-900">Mobility / admission date</div>
                      <div className="text-violet-700 mt-0.5">Unlocks: Separating stable cohort from churn — fairer comparison</div>
                    </div>
                  </div>

                  <div className="text-xs text-violet-800 bg-white rounded-lg border border-violet-200 p-3">
                    <span className="font-semibold">These aren&apos;t missing from your school&apos;s MIS</span> — they&apos;re in Arbor, SIMS, Bromcom, and CTF files by default.
                    Schoolgle&apos;s enhanced CTF import will surface them. Ask your admin or book a data enrichment session.
                  </div>
                </div>
              </motion.div>

              {/* ── Section 7: Cohort Journey — Milestone Track ── */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Cohort Milestone Journey</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Each card follows a Reception cohort through their key assessment milestones — EYFS GLD, Y1 Phonics, and KS1 subject attainment.
                  Dots are colour-coded green (at/above national), amber (within 5pp), or red (more than 5pp below).
                </p>

                {perPupilData.cohortMilestones && perPupilData.cohortMilestones.length > 0 ? (
                  <div className="space-y-5">
                    {perPupilData.cohortMilestones.map((cohort) => {
                      // Build summary sentence
                      const eyfsMilestone = cohort.milestones.find(m => m.label === 'EYFS GLD');
                      const phonicsMilestone = cohort.milestones.find(m => m.label === 'Y1 Phonics');
                      const ks1Milestones = cohort.milestones.filter(m => m.label.startsWith('Y2 KS1'));

                      const deltaLabel = (m: typeof cohort.milestones[number]) => {
                        if (m.percentAt === null || m.nationalBenchmark === null) return null;
                        return m.percentAt - m.nationalBenchmark;
                      };

                      const allDeltas = cohort.milestones
                        .map(m => ({ label: m.label, delta: deltaLabel(m) }))
                        .filter((x): x is { label: string; delta: number } => x.delta !== null);
                      const bestMilestone = allDeltas.reduce((a, b) => (a.delta > b.delta ? a : b), allDeltas[0]);
                      const worstMilestone = allDeltas.reduce((a, b) => (a.delta < b.delta ? a : b), allDeltas[0]);

                      const summaryParts: string[] = [];
                      if (eyfsMilestone?.percentAt !== null && eyfsMilestone?.nationalBenchmark !== null && eyfsMilestone) {
                        summaryParts.push(`EYFS GLD at ${eyfsMilestone.percentAt}% vs national ${eyfsMilestone.nationalBenchmark}%.`);
                      }
                      if (ks1Milestones.length > 0) {
                        const ks1Summary = ks1Milestones.map(m => `${m.label.replace('Y2 KS1 ', '')} ${m.percentAt}%`).join(', ');
                        summaryParts.push(`At KS1: ${ks1Summary}.`);
                      }
                      if (bestMilestone && worstMilestone && bestMilestone.label !== worstMilestone.label) {
                        const strongWord = bestMilestone.delta >= 0 ? 'strongest' : 'least weak';
                        summaryParts.push(`The ${strongWord} milestone was ${bestMilestone.label} (${bestMilestone.delta > 0 ? '+' : ''}${bestMilestone.delta}pp vs national).`);
                      }

                      return (
                        <motion.div
                          key={cohort.cohortLabel}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-5"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{cohort.cohortLabel}</div>
                              <div className="text-xs text-gray-500 mt-0.5">Now approx Y{Math.max(0, cohort.currentYearGroup)} · {cohort.milestones[0]?.pupilCount ?? 0} pupils tracked</div>
                            </div>
                            <div className="text-xs text-gray-400 bg-white border border-gray-200 rounded-lg px-2 py-1">
                              {cohort.milestones.length} milestone{cohort.milestones.length !== 1 ? 's' : ''} recorded
                            </div>
                          </div>

                          {/* Milestone track */}
                          <div className="relative">
                            {/* Connecting line */}
                            <div className="absolute top-8 left-0 right-0 h-px bg-gray-200 z-0" />

                            <div className="relative z-10 flex items-start gap-0 overflow-x-auto pb-2">
                              {cohort.milestones.map((m, i) => {
                                const delta = m.percentAt !== null && m.nationalBenchmark !== null ? m.percentAt - m.nationalBenchmark : null;
                                const dotColor = delta === null ? 'bg-gray-300' : delta >= 0 ? 'bg-emerald-500' : delta >= -5 ? 'bg-amber-400' : 'bg-red-500';
                                const textColor = delta === null ? 'text-gray-400' : delta >= 0 ? 'text-emerald-700' : delta >= -5 ? 'text-amber-700' : 'text-red-700';

                                return (
                                  <div key={m.label} className="flex-1 flex flex-col items-center min-w-[90px] px-2">
                                    {/* % label above dot */}
                                    <div className={`text-sm font-bold mb-1.5 ${textColor}`}>
                                      {m.percentAt !== null ? `${m.percentAt}%` : '—'}
                                    </div>

                                    {/* Dot */}
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.15 * i, duration: 0.4, type: "spring" }}
                                      className={`w-5 h-5 rounded-full ${dotColor} border-2 border-white shadow-md z-10`}
                                      title={m.nationalBenchmark !== null ? `National: ${m.nationalBenchmark}%` : ''}
                                    />

                                    {/* Delta badge */}
                                    {delta !== null && (
                                      <div className={`text-[10px] font-semibold mt-1 ${textColor}`}>
                                        {delta > 0 ? '+' : ''}{delta}pp
                                      </div>
                                    )}

                                    {/* Milestone label below */}
                                    <div className="text-[10px] text-gray-500 mt-1 text-center leading-tight">{m.label}</div>
                                    <div className="text-[10px] text-gray-400">{m.academicYear}/{String(m.academicYear + 1).slice(2)}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* National reference key */}
                          <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> At/above national</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Within 5pp</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> More than 5pp below</span>
                            <span className="text-gray-300 ml-1">Delta = vs national average</span>
                          </div>

                          {/* Summary sentence */}
                          {summaryParts.length > 0 && (
                            <p className="text-xs text-gray-600 mt-3 bg-white border border-gray-100 rounded-lg px-3 py-2 leading-relaxed">
                              {summaryParts.join(' ')}
                            </p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  /* Fallback — no cohort milestone data (pre-Reception cohorts or empty CTF) */
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center">
                    <div className="text-sm text-gray-500 mb-1">No complete cohort milestones found in the CTF data.</div>
                    <p className="text-xs text-gray-400">
                      Milestones require Reception (EYFS) entry data with at least 5 pupils. Cohorts that started before Reception, or have fewer than 5 pupils at each milestone, are excluded.
                      {perPupilData.cohortTracking && perPupilData.cohortTracking.length > 0 && (
                        <span> The data does include {perPupilData.cohortTracking.length} tracked cohort(s) — milestone mapping may be limited by the subjects available in the CTF files.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Section 8: Demographic Disaggregation — Defend Your Numbers ── */}
              {perPupilData.demographicDisaggregation && !perPupilData.demographicDisaggregation.cohortGapLens && (
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Defend Your Numbers — Demographic Impact Analysis</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    What happens to attainment when you isolate specific pupil groups? This shows exactly which demographics are driving the headline figures up or down.
                  </p>

                  {(() => {
                    const dd = perPupilData.demographicDisaggregation!;
                    const groups = [
                      { key: 'all', label: 'All pupils', data: dd.all.attainment, count: dd.all.count, highlight: false },
                      { key: 'withoutSend', label: `Remove SEND (${dd.withoutSend.removed} pupils)`, data: dd.withoutSend.attainment, count: dd.withoutSend.remaining, highlight: true },
                      { key: 'withoutFsm', label: `Remove FSM (${dd.withoutFsm.removed} pupils)`, data: dd.withoutFsm.attainment, count: dd.withoutFsm.remaining, highlight: true },
                      { key: 'withoutEal', label: `Remove EAL (${dd.withoutEal.removed} pupils)`, data: dd.withoutEal.attainment, count: dd.withoutEal.remaining, highlight: true },
                      { key: 'sendOnly', label: `SEND only (${dd.sendOnly.count} pupils)`, data: dd.sendOnly.attainment, count: dd.sendOnly.count, highlight: false },
                      { key: 'fsmOnly', label: `FSM only (${dd.fsmOnly.count} pupils)`, data: dd.fsmOnly.attainment, count: dd.fsmOnly.count, highlight: false },
                    ];

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Group</th>
                              <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pupils</th>
                              <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reading</th>
                              <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Writing</th>
                              <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Maths</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groups.map(({ key, label, data, count, highlight }) => {
                              const allBaseline = dd.all.attainment;
                              return (
                                <tr key={key} className={`border-b border-gray-100 ${highlight ? 'bg-green-50/50' : key.endsWith('Only') ? 'bg-amber-50/50' : ''}`}>
                                  <td className={`py-2 pr-4 ${highlight ? 'font-semibold text-green-800' : key.endsWith('Only') ? 'font-medium text-amber-800' : 'text-gray-700 font-medium'}`}>{label}</td>
                                  <td className="py-2 px-4 text-right text-gray-600">{count}</td>
                                  {['reading', 'writing', 'maths'].map(subj => {
                                    const pct = data[subj]?.pct ?? 0;
                                    const baseline = allBaseline[subj]?.pct ?? 0;
                                    const diff = pct - baseline;
                                    return (
                                      <td key={subj} className="py-2 px-4 text-right">
                                        <span className={`font-semibold ${pct >= 65 ? 'text-green-700' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</span>
                                        {key !== 'all' && diff !== 0 && (
                                          <span className={`text-xs ml-1 ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ({diff > 0 ? '+' : ''}{diff})
                                          </span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}

                  {/* Ofsted defence narrative */}
                  {(() => {
                    const dd = perPupilData.demographicDisaggregation!;
                    const sendImpact = (dd.all.attainment.reading?.pct ?? 0) - (dd.withoutSend.attainment.reading?.pct ?? 0);
                    const fsmImpact = (dd.all.attainment.reading?.pct ?? 0) - (dd.withoutFsm.attainment.reading?.pct ?? 0);
                    const biggestImpact = Math.abs(sendImpact) > Math.abs(fsmImpact) ? 'SEND' : 'FSM';
                    const impactPp = Math.abs(biggestImpact === 'SEND' ? sendImpact : fsmImpact);

                    return (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800">
                        <div className="font-semibold mb-1">How to defend these numbers to an inspector:</div>
                        <p>
                          Removing {biggestImpact} pupils shifts Reading by {impactPp}pp.
                          {dd.sendOnly.count > 0 && ` The ${dd.sendOnly.count} SEND pupils have specific barriers (visual impairment, SEMH, cognition & learning) that directly impact standardised assessment performance.`}
                          {' '}The school should prepare evidence showing: (1) individual progress trajectories for these pupils against their own baselines, not national expectations; (2) the graduated approach documentation for each SEND pupil; (3) Pupil Premium strategy impact evidence for FSM pupils. An inspector wants to see that the school knows these children and can explain their specific journeys.
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}
        </section>
        </>
        )}

      </div>
    </div>
    </AbbrevLookupContext.Provider>
  );
}
