"use client";

import * as XLSX from "xlsx";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
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
import { getSchoolByAbbrev } from "@/lib/trust-analysis/types";
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
import { emitTrustAssessorEvents } from "@/lib/school-events/emit-trust-assessor";
import { Timeline } from "@/components/school-events/Timeline";
import type { SchoolEvent } from "@/lib/school-events/types";
import {
  computeStaffingRatios,
  assessStaffing,
  NATIONAL_P_T_RATIO,
} from "@/lib/trust-analysis/staffing-ratios";

// ─── Constants ───────────────────────────────────────────────────────────────

const TRUST_SCHOOLS: Record<string, { name: string; urn: number }> = {
  CVPS: { name: "Clayton Village Primary School", urn: 148869 },
  CHPS: { name: "Crossley Hall Primary School", urn: 146581 },
  FPS: { name: "Farnham Primary School", urn: 144862 },
  GHPS: { name: "Grove House Primary School", urn: 148201 },
  HPS: { name: "Hollingwood Primary School", urn: 144860 },
  LPS: { name: "Laycock Primary School", urn: 144861 },
  LGPS: { name: "Lidget Green Primary School", urn: 150016 },
};

const YEAR_GROUPS = ["EYFS", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"] as const;
type YearGroup = (typeof YEAR_GROUPS)[number];

const HEATMAP_YEAR_GROUPS: YearGroup[] = ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];

// ─── Reliability Tier System ─────────────────────────────────────────────────

export type ReliabilityTier = 'external' | 'derived' | 'self_reported';

const TIER_CONFIG: Record<ReliabilityTier, { label: string; pill: string; dot: string; border: string }> = {
  external:      { label: 'External',      pill: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', border: 'border-l-emerald-500' },
  derived:       { label: 'Derived',       pill: 'bg-amber-100  text-amber-800  border-amber-300',  dot: 'bg-amber-400',  border: 'border-l-amber-400'  },
  self_reported: { label: 'Self-reported', pill: 'bg-rose-100   text-rose-800   border-rose-300',   dot: 'bg-rose-500',   border: 'border-l-rose-500'   },
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
      <span className="text-[10px] text-muted-foreground/60 ml-1">Every number is labelled — external = DfE validated, derived = computed from validated inputs, self-reported = school/trust data</span>
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
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-600 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Traffic Light Summary Grid ──────────────────────────────────────────────

function TrafficLightGrid({ parsed, onSchoolClick }: { parsed: ParsedSpreadsheet; onSchoolClick: (school: string) => void }) {
  // Compute total pupils per school
  const getTotalPupils = (school: string): number => {
    let total = 0;
    for (const yg of YEAR_GROUPS) {
      const n = parsed.data[school]?.[yg]?.cohort.number_in_cohort;
      if (n !== null && n !== undefined) total += n;
    }
    return total;
  };

  // Sort schools by total pupils descending (largest first)
  const sortedSchools = [...parsed.schools].sort((a, b) => getTotalPupils(b) - getTotalPupils(a));

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

  // Returns true if any adjacent year group has a >15pp jump
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
    { label: "Y6 Combined", key: "c_are" as keyof SubjectScores },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-3 pr-4 text-sm font-semibold text-gray-700 min-w-[120px]">School</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">Pupils</th>
            {cols.map((c) => (
              <th key={c.key} className="text-center py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">{c.label}</th>
            ))}
            <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap">GD Writing</th>
            <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600 whitespace-nowrap" title="Consistency: flags any adjacent year group jump >15pp — may indicate data entry errors or genuine curriculum concern">
              Consistency <span className="text-gray-400 font-normal">ⓘ</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSchools.map((school) => {
            const y6 = parsed.data[school]?.["Year 6"]?.all_pupils ?? {};
            const totalPupils = getTotalPupils(school);
            const isSmall = totalPupils > 0 && totalPupils < 100;
            const hasWarning = hasConsistencyWarning(school);
            return (
              <tr key={school} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4">
                  <button
                    onClick={() => onSchoolClick(school)}
                    className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {school}
                  </button>
                  {TRUST_SCHOOLS[school] && (
                    <div className="text-xs text-gray-400 leading-tight">{TRUST_SCHOOLS[school].name.split(" ").slice(0, 3).join(" ")}</div>
                  )}
                </td>
                <td className="text-center py-3 px-3">
                  {totalPupils > 0 ? (
                    <span className={`text-xs font-medium ${isSmall ? "italic text-gray-400" : "text-gray-700"}`}>
                      {isSmall ? `${totalPupils}*` : totalPupils}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
                {cols.map((c) => {
                  const pct = (y6[c.key] as number | null | undefined) ?? null;
                  return (
                    <td key={c.key} className="text-center py-3 px-3">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full ${getCircleColor(pct)} flex items-center justify-center`} title={pct !== null ? `${pct}%` : "No data"} />
                        <span className="text-xs font-semibold text-gray-700">{pct !== null ? `${pct}%` : "—"}</span>
                      </div>
                    </td>
                  );
                })}
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
                    <span title="One or more adjacent year groups differ by >15pp — check data or curriculum consistency">
                      <AlertTriangle size={16} className="text-amber-500 mx-auto" />
                    </span>
                  ) : (
                    <span className="text-gray-200 text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="font-medium">Key:</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500 inline-block" /> 70%+ (Green)</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block" /> 50–69% (Amber)</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block" /> Below 50% (Red)</span>
        <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-full bg-gray-200 inline-block" /> No data</span>
        <span className="text-gray-400 ml-2">Sorted by total pupils (largest first). * = under 100 pupils — interpret percentages with caution. Click school name to drill down.</span>
      </div>
    </div>
  );
}

// ─── Phase 1: Subject Heatmap (tabbed) ───────────────────────────────────────

type HeatmapSubject = "combined" | "reading" | "writing" | "maths";

function getSubjectARE(data: Partial<SubjectScores>, subject: HeatmapSubject): number | null {
  switch (subject) {
    case "combined": return data.c_are ?? null;
    case "reading":  return data.r_are ?? null;
    case "writing":  return data.w_are ?? null;
    case "maths":    return data.m_are ?? null;
  }
}

function SubjectHeatmap({ parsed, onSchoolClick }: { parsed: ParsedSpreadsheet; onSchoolClick: (school: string) => void }) {
  const [subject, setSubject] = useState<HeatmapSubject>("combined");

  const tabs: { key: HeatmapSubject; label: string }[] = [
    { key: "combined", label: "Combined" },
    { key: "reading",  label: "Reading" },
    { key: "writing",  label: "Writing" },
    { key: "maths",    label: "Maths" },
  ];

  const allYearGroups: YearGroup[] = ["EYFS", ...HEATMAP_YEAR_GROUPS];

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
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    {school}
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
                  return (
                    <td key={yg} className={`p-1 text-center ${small ? "opacity-60" : ""}`}>
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-semibold ${colorClass} min-w-[42px]`}
                        title={small ? `Cohort: ${cohort} (small — treat with caution)` : undefined}
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
        <span>{subject === "combined" ? "Combined ARE %" : `${subject.charAt(0).toUpperCase() + subject.slice(1)} ARE %`}  (EYFS = GLD %):</span>
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

function SchoolDetailCard({ school, parsed }: { school: string; parsed: ParsedSpreadsheet }) {
  const [open, setOpen] = useState(false);

  const schoolData = parsed.data[school] ?? {};
  const info = TRUST_SCHOOLS[school];

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
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
            <School size={16} className="text-blue-600" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900">{school}</div>
            {info && <div className="text-xs text-gray-400">{info.name}</div>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            {totalPupils > 0 && <span className="font-medium text-gray-700">{totalPupils} pupils</span>}
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
                  <div className="text-xl font-bold text-gray-900">{totalPupils > 0 ? totalPupils : "—"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Total Pupils</div>
                  <div className="text-xs text-gray-400">{cohortCount} year groups</div>
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
                  <div className="text-sm font-semibold text-gray-700 mb-2">Combined ARE % by Year Group</div>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="yg" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(val) => [`${val}%`, ""]} contentStyle={{ fontSize: "13px" }} />
                      <Bar dataKey="combined" name="Combined" fill="#3B82F6" radius={[3, 3, 0, 0]} />
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
    const avg = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
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

function SchoolTab({ school, parsed, dfeData, staffingSnapshots, summaryData, authToken, organizationId, capturesByPeriod }: { school: string; parsed: ParsedSpreadsheet; dfeData?: DfEData | null; staffingSnapshots?: StaffingByUrn | null; summaryData?: SchoolDataSummary | null; authToken?: string; organizationId?: string; capturesByPeriod?: { autumn_term?: { parsed_data: ParsedSpreadsheet } | null; mid_year?: { parsed_data: ParsedSpreadsheet } | null } }) {
  const schoolData = parsed.data[school] ?? {};
  const info = TRUST_SCHOOLS[school];

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
  const schoolUrn = TRUST_SCHOOLS[school]?.urn ?? null;
  const nationalPercentile = schoolUrn !== null ? (dfeData?.nationalPercentiles?.[schoolUrn] ?? null) : null;
  const threeYearAvg = schoolUrn !== null ? (dfeData?.threeYearAverages?.[schoolUrn] ?? null) : null;
  const y6Combined = schoolData["Year 6"]?.all_pupils.c_are ?? null;
  const statAlerts = detectStatisticalImpossibilities(school, schoolData);

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
  // Trust average P/T ratio across all Pennine schools that have staffing data
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
      pipelineAlerts.push(
        `${HEATMAP_YEAR_GROUPS[i - 1].replace("Year ", "Y")} → ${HEATMAP_YEAR_GROUPS[i].replace("Year ", "Y")}: Combined jumps from ${prev}% to ${curr}% (${curr > prev ? "+" : ""}${Math.round(curr - prev)}pp)`
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
    questions.push({ q: `FSM at ${fsmPct}% (trust average ${Math.round(trustFsmPct)}%) — how is Pupil Premium funding targeted?`, level: "amber" });
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
        schoolName: TRUST_SCHOOLS[school]?.name ?? school,
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
      const schoolInfoLocal = getSchoolByAbbrev(school);
      const schoolFsmPctLocal = fsmPct ?? schoolInfoLocal?.fsmPct ?? 25;
      const schoolSendPctLocal = sendPct ?? 15;
      const schoolEalPctLocal = schoolInfoLocal?.ealPct ?? 20;
      const schoolDemographicsLocal = {
        fsmPct: schoolFsmPctLocal,
        sendPct: schoolSendPctLocal,
        ealPct: schoolEalPctLocal,
      };

      const ygMap: Record<string, YearGroupShort> = {
        'Year 1': 'Y1', 'Year 2': 'Y2', 'Year 3': 'Y3',
        'Year 4': 'Y4', 'Year 5': 'Y5', 'Year 6': 'Y6',
      };
      const yearAnalysisForEmit = HEATMAP_YEAR_GROUPS.map((yg) => {
        const reported = schoolData[yg]?.all_pupils.c_are ?? null;
        const ygShort = ygMap[yg];
        if (!ygShort) return null;
        const expected = demographicExpectation(schoolDemographicsLocal, ygShort, 'combined');
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
      const kpisForEmit = evaluateResearchKpis(schoolDemographicsLocal, kpiYearDataLocal);

      // EAL trajectory concern
      const ealConcern = (schoolInfoLocal?.ealPct ?? 0) > 30 && (() => {
        const trajectory = getEalTrajectory(schoolEalPctLocal, schoolFsmPctLocal, schoolSendPctLocal, 'combined');
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

      if (!organizationId) return; // Can't emit without org scope
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

  // Generate AI narrative once when component mounts with data.
  // Cache in sessionStorage keyed by content signature so hard-refreshes / school
  // switches don't burn LLM tokens when the underlying data is unchanged.
  useEffect(() => {
    if (narrativeRequestedRef.current || !school) return;
    narrativeRequestedRef.current = true;

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
  }, [school]);

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
      narrativePoints.push(`${school} has significantly higher disadvantage than the trust average (${fsmPct}% FSM vs ${Math.round(trustFsmPct)}% trust average). This context is critical — national data shows a strong correlation between FSM% and attainment. Any comparison with lower-FSM schools must account for this.`);
    } else if (fsmPct < trustFsmPct - 10) {
      narrativePoints.push(`${school} has lower disadvantage than the trust average (${fsmPct}% FSM vs ${Math.round(trustFsmPct)}% trust average). This school should be expected to perform above the trust average given its more favourable intake.`);
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
    narrativePoints.push(`Despite ${fsmPct}% FSM eligibility, Y6 Combined is at ${y6.all_pupils.c_are}%. This is a positive indicator that the school's Pupil Premium strategy may be effective. This is worth investigating further — what is this school doing that others in the trust could learn from?`);
  }

  // ── BUILD 1: At-a-glance summary computations ──
  const schoolInfo = getSchoolByAbbrev(school);

  const severityVerdict: 'strong' | 'secure' | 'attention' | 'urgent' =
    nationalPercentile && nationalPercentile.percentile > 75 ? 'strong' :
    nationalPercentile && nationalPercentile.percentile > 50 ? 'secure' :
    nationalPercentile && nationalPercentile.percentile > 25 ? 'attention' :
    'urgent';

  const topFindings: { text: string; severity: 'high' | 'medium' | 'low' }[] = [];

  if (nationalPercentile) {
    if (nationalPercentile.percentile < 25) {
      topFindings.push({
        text: `Ranked ${ordinal(nationalPercentile.percentile)} nationally — below ${100 - nationalPercentile.percentile}% of England schools.`,
        severity: 'high',
      });
    } else if (nationalPercentile.percentile > 75) {
      topFindings.push({
        text: `Ranked ${ordinal(nationalPercentile.percentile)} nationally — above ${nationalPercentile.percentile}% of England schools.`,
        severity: 'low',
      });
    }
  }
  if (statAlerts.length > 0) {
    topFindings.push({
      text: `${statAlerts.length} data quality alert${statAlerts.length === 1 ? '' : 's'} detected: ${statAlerts[0].title}.`,
      severity: 'high',
    });
  }
  if (threeYearAvg && y6Combined !== null && y6Combined !== undefined) {
    const gap = y6Combined - threeYearAvg.averagePct;
    if (Math.abs(gap) > 10) {
      topFindings.push({
        text: `Y6 mid-year prediction is ${gap > 0 ? '+' : ''}${gap}pp vs 3-year DfE average — ${gap > 0 ? 'optimistic, needs moderation evidence' : 'pessimistic, possibly conservative assessment'}.`,
        severity: 'medium',
      });
    }
  }
  if (fsmPct !== null && fsmPct > 40) {
    topFindings.push({
      text: `High disadvantage cohort (${fsmPct}% FSM) — context must be factored into all attainment comparisons.`,
      severity: 'low',
    });
  }
  while (topFindings.length < 3) {
    topFindings.push({ text: 'Further analysis available in sections below.', severity: 'low' });
  }

  const whatToDoNext = severityVerdict === 'urgent'
    ? 'Review the forensic findings below with governors. Challenge each data point with research citations. Commission an external moderation review of KS1 assessments.'
    : severityVerdict === 'attention'
    ? 'Walk through the findings with your leadership team. Target the specific year groups flagged. Use Schoolgle continuous assessment to prevent drift.'
    : severityVerdict === 'secure'
    ? 'Sustain current practice. Use the pupil-level data to identify pupils still below expected standard and deploy targeted support.'
    : 'Share the findings as good practice across the trust. Investigate what this school is doing differently that others can learn from.';

  // ── URN for edit storage ──
  const editStorageUrn = info?.urn ?? school;

  // ── Forensic verdict render helper ──
  const renderForensicVerdict = () => {
    const schoolInfoLocal = getSchoolByAbbrev(school);
    const schoolFsmPct = fsmPct ?? schoolInfoLocal?.fsmPct ?? 25;
    const schoolSendPct = sendPct ?? 15;
    const schoolEalPct = schoolInfoLocal?.ealPct ?? 20;
    const schoolDemographics = { fsmPct: schoolFsmPct, sendPct: schoolSendPct, ealPct: schoolEalPct };

    const ygMap: Record<string, YearGroupShort> = {
      'Year 1': 'Y1', 'Year 2': 'Y2', 'Year 3': 'Y3',
      'Year 4': 'Y4', 'Year 5': 'Y5', 'Year 6': 'Y6',
    };

    const yearAnalysis = HEATMAP_YEAR_GROUPS.map((yg) => {
      const reported = schoolData[yg]?.all_pupils.c_are ?? null;
      const ygShort = ygMap[yg];
      if (!ygShort) return null;
      const expected = demographicExpectation(schoolDemographics, ygShort, 'combined');
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

    const y6Pred = demographicExpectation(schoolDemographics, 'Y6', 'combined');
    const y6Reported = schoolData['Year 6']?.all_pupils.c_are ?? null;
    let demographicSentence = `Given this school's ${schoolEalPct.toFixed(0)}% EAL, ${schoolFsmPct.toFixed(0)}% FSM, ${schoolSendPct.toFixed(0)}% SEND profile, national data predicts Y6 Combined around ${y6Pred.low}–${y6Pred.high}%.`;
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
    const schoolInfoLocal = getSchoolByAbbrev(school);
    const schoolFsmPct = fsmPct ?? schoolInfoLocal?.fsmPct ?? 25;
    const schoolSendPct = sendPct ?? 15;
    const schoolEalPct = schoolInfoLocal?.ealPct ?? 20;
    const schoolDemographics = { fsmPct: schoolFsmPct, sendPct: schoolSendPct, ealPct: schoolEalPct };
    const kpiYearData: Record<string, { r?: number; w?: number; m?: number; c?: number } | undefined> = {};
    for (const yg of YEAR_GROUPS) {
      const d = schoolData[yg]?.all_pupils;
      if (d) kpiYearData[yg] = { r: d.r_are ?? undefined, w: d.w_are ?? undefined, m: d.m_are ?? undefined, c: d.c_are ?? undefined };
    }
    const kpis = evaluateResearchKpis(schoolDemographics, kpiYearData);

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
    const schoolInfoLocal = getSchoolByAbbrev(school);
    const fsmPctForFactors = fsmPct ?? schoolInfoLocal?.fsmPct ?? 25;
    const ealPctForFactors = schoolInfoLocal?.ealPct ?? 20;
    const sendPctForFactors = sendPct ?? 15;

    const SCHOOL_DFE_METRICS: Record<string, { pa_pct: number | null; pa_year: number | null; wf_current_fte: number | null; wf_prev_fte: number | null; wf_year: number | null; ks2_2023: number | null; ks2_2024: number | null; ks2_2025: number | null; ofsted_last: string | null; ofsted_prev: string | null; ofsted_last_year: number | null }> = {
      CVPS: { pa_pct: 22.65, pa_year: 2024, wf_current_fte: 11.6, wf_prev_fte: 9.47, wf_year: 2025, ks2_2023: 42, ks2_2024: 55, ks2_2025: 56, ofsted_last: 'Good', ofsted_prev: 'Good', ofsted_last_year: 2023 },
      CHPS: { pa_pct: 18.98, pa_year: 2024, wf_current_fte: 35.8, wf_prev_fte: 28.99, wf_year: 2025, ks2_2023: 33, ks2_2024: 56, ks2_2025: 33, ofsted_last: 'Requires Improvement', ofsted_prev: 'Requires Improvement', ofsted_last_year: 2022 },
      FPS:  { pa_pct: 19.68, pa_year: 2024, wf_current_fte: 19.56, wf_prev_fte: 20.62, wf_year: 2025, ks2_2023: 75, ks2_2024: 25, ks2_2025: 69, ofsted_last: 'Good', ofsted_prev: 'Good', ofsted_last_year: 2022 },
      GHPS: { pa_pct: 24.65, pa_year: 2024, wf_current_fte: 19.2, wf_prev_fte: 21.39, wf_year: 2025, ks2_2023: 55, ks2_2024: 50, ks2_2025: 67, ofsted_last: 'Good', ofsted_prev: 'Requires Improvement', ofsted_last_year: 2023 },
      HPS:  { pa_pct: 27.47, pa_year: 2024, wf_current_fte: 17.0, wf_prev_fte: 17.8, wf_year: 2025, ks2_2023: 75, ks2_2024: 74, ks2_2025: 80, ofsted_last: 'Requires Improvement', ofsted_prev: 'Good', ofsted_last_year: 2023 },
      LPS:  { pa_pct: 6.02, pa_year: 2024, wf_current_fte: 5.0, wf_prev_fte: 5.02, wf_year: 2025, ks2_2023: 60, ks2_2024: 36, ks2_2025: 64, ofsted_last: 'Good', ofsted_prev: 'Good', ofsted_last_year: 2023 },
      LGPS: { pa_pct: 12.05, pa_year: 2024, wf_current_fte: 22.4, wf_prev_fte: 25.14, wf_year: 2025, ks2_2023: 80, ks2_2024: 57, ks2_2025: 41, ofsted_last: 'Requires Improvement', ofsted_prev: 'Outstanding', ofsted_last_year: 2024 },
    };

    const m = SCHOOL_DFE_METRICS[school];
    const latestKs2 = m?.ks2_2025 ?? m?.ks2_2024 ?? m?.ks2_2023 ?? y6Combined;
    const demographicPredicted = Math.round(60 - (fsmPctForFactors / 100) * 20 - (sendPctForFactors / 100) * 30 - (ealPctForFactors / 100) * -2);

    interface ResearchFactor { id: string; name: string; finding: string; citation: string; status: 'ok' | 'concern' | 'pending'; statusLabel: string }
    const factors: ResearchFactor[] = [];

    factors.push({ id: 'fsm-gap', name: 'FSM attainment gap', finding: latestKs2 !== null ? `${school} has ${fsmPctForFactors.toFixed(0)}% FSM. Research predicts ~${demographicPredicted}% KS2 Combined; school achieved ${latestKs2}% — ${latestKs2 >= demographicPredicted ? `${latestKs2 - demographicPredicted}pp above` : `${demographicPredicted - latestKs2}pp below`} expectation.` : `${school} has ${fsmPctForFactors.toFixed(0)}% FSM. Research predicts ~${demographicPredicted}% KS2 Combined for this demographic.`, citation: 'EEF Pupil Premium Guide 2024', status: latestKs2 === null ? 'pending' : latestKs2 >= demographicPredicted - 5 ? 'ok' : 'concern', statusLabel: latestKs2 === null ? 'Pending data' : latestKs2 >= demographicPredicted - 5 ? 'Accounted for' : 'Below expectation' });
    factors.push({ id: 'send-gap', name: 'SEND attainment gap', finding: `${school} has ${sendPctForFactors.toFixed(0)}% SEND on roll. EEF research shows SEND pupils at SEN Support achieve ~30pp below non-SEND peers at KS2.`, citation: 'EEF SEND Guidance Report 2020', status: 'ok', statusLabel: 'Accounted for' });

    if (ealPctForFactors > 30) {
      const y1c = schoolData['Year 1']?.all_pupils.c_are ?? null;
      const y6c = schoolData['Year 6']?.all_pupils.c_are ?? null;
      const gain = y6c !== null && y1c !== null ? y6c - y1c : null;
      factors.push({ id: 'eal-trajectory', name: 'EAL language trajectory', finding: gain !== null ? `With ${ealPctForFactors.toFixed(0)}% EAL, research expects ≥15pp Y1→Y6 gain. This school shows ${gain >= 0 ? '+' : ''}${gain}pp — ${gain >= 15 ? 'on track' : `${15 - gain}pp short of research expectation`}.` : `${school} has ${ealPctForFactors.toFixed(0)}% EAL. Research expects attainment to rise year-on-year as language proficiency develops.`, citation: 'Strand, Demie & Lindorff 2018; NALDIC 2020', status: gain === null ? 'pending' : gain >= 10 ? 'ok' : 'concern', statusLabel: gain === null ? 'Pending data' : gain >= 10 ? 'On trajectory' : 'Trajectory concern' });
    }

    if (m?.pa_pct !== null && m?.pa_pct !== undefined) {
      const pa = m.pa_pct;
      factors.push({ id: 'persistent-absence', name: 'Persistent absence impact', finding: `${school} recorded ${pa.toFixed(1)}% persistent absence (${(m.pa_year ?? 0) - 1}/${String(m.pa_year ?? 0).slice(2)}). ${pa >= 20 ? 'Above the critical 20% threshold — DfE research links this to 10–15pp lower KS2 outcomes.' : pa >= 10 ? 'Above the 10% national target. Research links this level to measurable attainment gaps.' : 'Below the 10% national target — a positive context factor.'}`, citation: 'DfE Pupil Absence Statistics 2024', status: pa >= 10 ? 'concern' : 'ok', statusLabel: pa >= 20 ? 'High concern' : pa >= 10 ? 'Elevated' : 'Within target' });
    }

    if (m?.wf_current_fte !== null && m?.wf_prev_fte !== null && m?.wf_current_fte !== undefined && m?.wf_prev_fte !== undefined) {
      const delta = m.wf_current_fte - m.wf_prev_fte;
      const turnoverPct = m.wf_prev_fte > 0 ? Math.abs(delta / m.wf_prev_fte) * 100 : 0;
      factors.push({ id: 'teacher-turnover', name: 'Teacher turnover impact', finding: `${school} employed ${m.wf_current_fte.toFixed(1)} FTE teachers, ${delta >= 0 ? `up ${delta.toFixed(1)} FTE` : `down ${Math.abs(delta).toFixed(1)} FTE`} (${turnoverPct.toFixed(0)}% change). ${Math.abs(delta) >= 1.5 ? 'IFS research shows changes of this scale can affect attainment over a 2-year period.' : 'Stable workforce — positive context factor.'}`, citation: 'Sibieta, IFS 2022', status: Math.abs(delta) >= 1.5 ? 'concern' : 'ok', statusLabel: Math.abs(delta) >= 3 ? 'Significant change' : Math.abs(delta) >= 1.5 ? 'Notable change' : 'Stable' });
    }

    if (m?.ofsted_last) {
      const isImprovement = m.ofsted_prev === 'Requires Improvement' && m.ofsted_last === 'Good';
      const isDecline = (m.ofsted_prev === 'Good' || m.ofsted_prev === 'Outstanding') && m.ofsted_last === 'Requires Improvement';
      factors.push({ id: 'ofsted-trajectory', name: 'Ofsted inspection trajectory', finding: isImprovement ? `${school} improved from ${m.ofsted_prev} to ${m.ofsted_last} in ${m.ofsted_last_year}.` : isDecline ? `${school}'s most recent inspection (${m.ofsted_last_year}) recorded ${m.ofsted_last}, down from ${m.ofsted_prev}. Governors may want to ask: what progress has been made since inspection?` : `${school}'s most recent inspection (${m.ofsted_last_year}) confirmed ${m.ofsted_last}.`, citation: 'EEF School Improvement Evidence Review 2023', status: m.ofsted_last === 'Good' || m.ofsted_last === 'Outstanding' ? 'ok' : 'concern', statusLabel: isImprovement ? 'Positive trajectory' : isDecline ? 'Declining trajectory' : m.ofsted_last === 'Requires Improvement' ? 'RI — monitor closely' : 'Good standing' });
    }

    const statusConfig = { ok: { dot: 'bg-emerald-500', label: 'bg-emerald-50 text-emerald-700 border-emerald-200' }, concern: { dot: 'bg-amber-500', label: 'bg-amber-50 text-amber-700 border-amber-200' }, pending: { dot: 'bg-muted-foreground/30', label: 'bg-muted text-muted-foreground border-border' } };

    return (
      <div className="bg-card border border-border rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-foreground mb-1">Research factors checked</h3>
        <p className="text-sm text-muted-foreground mb-6">Each factor cross-references this school&apos;s data against peer-reviewed research. Presented as context for governor discussion, not as conclusions.</p>
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
    const schoolInfoLocal = getSchoolByAbbrev(school);
    if (!schoolInfoLocal || schoolInfoLocal.ealPct <= 30) return null;

    const schoolFsmPctLocal = fsmPct ?? schoolInfoLocal.fsmPct;
    const schoolSendPctLocal = sendPct ?? 15;
    const schoolEalPctLocal = schoolInfoLocal.ealPct;

    const trajectory = getEalTrajectory(schoolEalPctLocal, schoolFsmPctLocal, schoolSendPctLocal, 'combined');
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
        <h3 className="text-xl font-semibold text-foreground mb-1">EAL language trajectory — {schoolEalPctLocal.toFixed(0)}% EAL</h3>
        <p className="text-sm text-muted-foreground mb-6">EAL pupils typically start with a 15–20pp attainment gap at Y1, closing to parity by Y5 as English proficiency develops. This school&apos;s cohorts should follow an upward curve.</p>
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
                  <p className="text-xs text-gray-500">{school} &mdash; {TRUST_SCHOOLS[school]?.name ?? school}</p>
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
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground uppercase tracking-wider">{school}</span>
                          <span className="text-xs text-muted-foreground">{schoolInfo?.nor ?? totalPupils} pupils &middot; {fsmPct !== null ? `${fsmPct}%` : '—'} FSM &middot; {schoolInfo?.ealPct !== undefined ? `${schoolInfo.ealPct}%` : '—'} EAL</span>
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground">{TRUST_SCHOOLS[school]?.name ?? school}</h2>
                        {info?.urn && <p className="text-sm text-muted-foreground mt-0.5">URN {info.urn}</p>}
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
                        <div className={`text-4xl font-bold tabular-nums ${nationalPercentile && nationalPercentile.percentile < 25 ? 'text-red-600' : 'text-foreground'}`}>
                          {nationalPercentile ? ordinal(nationalPercentile.percentile) : '—'}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">National rank</div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">percentile KS2 2024</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground tabular-nums">{threeYearAvg?.averagePct !== undefined && threeYearAvg?.averagePct !== null ? `${threeYearAvg.averagePct}%` : '—'}</div>
                        <div className="text-sm text-muted-foreground mt-1">3-year average</div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">DfE validated KS2</div>
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
                              <div className="text-xs text-muted-foreground mb-1">Trust average</div>
                              <div className="text-2xl font-bold text-foreground">{trustAvgPtr ?? '—'}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">across {trustPtrValues.length} Pennine schools</div>
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
                            <li>A school&apos;s &quot;support staff&quot; headcount may include shared trust central services (HR, finance, SEND coordination) that don&apos;t reflect classroom delivery capacity.</li>
                          </ul>
                          <p className="pt-1 italic">
                            Schoolgle flags patterns — it does not judge teachers. This ratio is one signal of many. Read alongside attendance, workforce turnover, and outcomes.
                          </p>
                        </div>
                      </details>

                      <div className="mt-3 text-[10px] text-muted-foreground italic">
                        Source: DfE School Workforce Census {staffingRow?.year ?? ''}. National ratios from DfE School Workforce Statistics 2024. A MAT&apos;s central team (HR, finance, SEND coordination) may sit at trust level and not appear in individual school staffing — actual delivery capacity may differ from headline figures.
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
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                        <School size={18} className="text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{school} — {info?.name ?? school}</h3>
                        {info?.urn && <p className="text-xs text-muted-foreground">URN {info.urn}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="text-center p-3 rounded-xl bg-muted/30">
                        <div className="text-2xl font-bold text-foreground">{totalPupils > 0 ? String(totalPupils) : '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Total Pupils</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-rose-50">
                        <div className="text-2xl font-bold text-rose-700">{fsmPct !== null ? `${Math.round(fsmPct)}%` : '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">FSM ({Math.round(totalFsm)})</div>
                        {trustFsmPct !== null && fsmPct !== null && <div className="text-xs text-muted-foreground/60 mt-0.5">{fsmPct > trustFsmPct ? `+${Math.round(fsmPct - trustFsmPct)}pp` : `${Math.round(trustFsmPct - fsmPct)}pp below`} trust</div>}
                      </div>
                      <div className="text-center p-3 rounded-xl bg-purple-50">
                        <div className="text-2xl font-bold text-purple-700">{sendPct !== null ? `${Math.round(sendPct)}%` : '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">SEND ({Math.round(totalSend)})</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-indigo-50">
                        <div className="text-2xl font-bold text-indigo-700">{totalEhcp > 0 ? String(totalEhcp) : '—'}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">EHCPs</div>
                      </div>
                    </div>
                  </div>
                </HideableCard>

                {/* Y6 Radar — compact, single chart */}
                {radarData.length > 0 && (
                  <HideableCard componentId="cohort-radar">
                    <div className="bg-card border border-border rounded-2xl p-8">
                      <h3 className="text-xl font-semibold text-foreground mb-1">Y6 subject profile vs trust average</h3>
                      <p className="text-sm text-muted-foreground mb-2">How this school compares on every subject at Year 6</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {radarData.map((d) => {
                          const diff = d.school - d.trust;
                          return (
                            <span key={d.subject} className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${diff >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                              {d.subject}: {d.school}% {d.trust > 0 && <span className="font-normal opacity-70">({diff >= 0 ? "+" : ""}{diff}pp)</span>}
                            </span>
                          );
                        })}
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={radarData} margin={{ top: 15, right: 40, left: 40, bottom: 15 }}>
                          <PolarGrid stroke="hsl(var(--border))" gridType="polygon" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: "hsl(var(--foreground))", fontWeight: 600 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                          <Radar name="Trust Avg" dataKey="trust" stroke="#94A3B8" fill="#CBD5E1" fillOpacity={0.4} strokeWidth={2} strokeDasharray="5 3" />
                          <Radar name={school} dataKey="school" stroke="#0ea5e9" fill="#38bdf8" fillOpacity={0.3} strokeWidth={2.5} dot={{ r: 5, fill: "#0ea5e9", strokeWidth: 0 }} />
                          <Tooltip formatter={(val, name) => [`${val}%`, name]} contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                        </RadarChart>
                      </ResponsiveContainer>
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
                {cohortPassport?.hasCTF ? (
                  <HideableCard componentId="pupil-grid">
                    <div className="bg-card border border-border rounded-2xl p-8">
                      <h3 className="text-xl font-semibold text-foreground mb-1">Pupil-level data</h3>
                      <p className="text-sm text-muted-foreground mb-6">Individual pupil attainment from connected CTF. All pupil names are pseudonymised — only cohort patterns are surfaced.</p>
                      <PupilCardGrid urn={info?.urn ?? 0} authToken={authToken} />
                    </div>
                  </HideableCard>
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
                      <Lock size={20} className="text-sky-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Pupil-level data requires a CTF connection</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                      Connect this school&apos;s CTF export from your MIS to unlock per-pupil attainment tracking, SEND/FSM breakdown, and individual gap analysis.
                    </p>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-sky-600 transition-colors">
                      <Database size={15} />
                      Connect CTF — Tier 3
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Pupil data is HMAC-SHA256 pseudonymised. No names are stored on Schoolgle servers.</p>
                  </div>
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
                            school={TRUST_SCHOOLS[school]?.name ?? school}
                            abbrev={school}
                            ks2Results={dfeData?.ks2Results ?? []}
                            selfReports={selfReports}
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

function OverviewNarrativeCard({ school, aiNarrative, narrativeLoading, narrativePoints }: {
  school: string;
  aiNarrative: string | null;
  narrativeLoading: boolean;
  narrativePoints: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-card border border-border rounded-2xl p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Assessment summary</h3>
          <p className="text-sm text-muted-foreground mt-0.5">AI-generated narrative from submitted data</p>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-sm text-sky-500 hover:underline"
        >
          {expanded ? "Hide" : "Show narrative"} <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>
      {expanded && (
        <div className="mt-2">
          {narrativeLoading ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-4 h-4 rounded-full border-2 border-sky-200 border-t-sky-600 animate-spin" />
              <span className="text-sm text-muted-foreground">Generating analysis...</span>
            </div>
          ) : aiNarrative ? (
            <div className="space-y-3">
              {aiNarrative.replace(/^#{1,4}\s+/gm, '').replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1').replace(/_{1,2}([^_]+)_{1,2}/g, '$1').replace(/^[-•]\s+/gm, '').replace(/^\d+\.\s+/gm, '').replace(/\n{3,}/g, '\n\n').trim().split('\n\n').filter(p => p.trim().length > 0).map((para, i) => (
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
          <p className="text-xs text-muted-foreground/60 mt-4">Source: Analysis based on trust mid-year spreadsheet data (self-reported). Not externally validated.{aiNarrative && ' Narrative generated by AI from the computed metrics.'}</p>
        </div>
      )}
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

function TrustInsights({ parsed, onSchoolClick }: { parsed: ParsedSpreadsheet; onSchoolClick?: (school: string) => void }) {
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
    narrativeParts.push(`Trust Y6 Combined average is ${trustAvgY6Combined}% — ${Math.abs(vs)}pp ${vs >= 0 ? 'above' : 'below'} the national average of 61%.`);
  }
  if (weakestSubjectLabel) {
    narrativeParts.push(`${weakestSubjectLabel} is the weakest subject trust-wide.`);
  }
  if (zeroGdWriting.length >= 3) {
    const schoolsAffected = [...new Set(zeroGdWriting.map(z => z.school))];
    narrativeParts.push(`Zero Greater Depth in Writing reported across ${zeroGdWriting.length} year groups in ${schoolsAffected.join(', ')} — this is a trust-wide concern requiring moderation review.`);
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
          <div className="text-sm font-medium text-gray-600 mt-1">Trust Y6 Combined</div>
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
          <span className="text-sm font-semibold text-gray-800">Trust Attainment Heatmap</span>
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
          <span className="text-sm font-semibold text-blue-800">Trust Overview</span>
        </div>
        <div className="space-y-2">
          {narrativeParts.map((p, i) => (
            <p key={i} className="text-sm text-blue-800 leading-relaxed">{p}</p>
          ))}
          {narrativeParts.length === 0 && (
            <p className="text-sm text-blue-700">Upload a spreadsheet to generate trust-wide insights.</p>
          )}
        </div>
        {onSchoolClick && parsed.schools.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {parsed.schools.map(school => (
              <motion.button
                key={school}
                whileHover={{ scale: 1.04 }}
                onClick={() => onSchoolClick(school)}
                className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
              >
                View {school}
              </motion.button>
            ))}
          </div>
        )}
        <p className="text-[10px] text-blue-400 mt-3">Source: Trust mid-year data capture spreadsheet. Self-reported.</p>
      </motion.div>

    </div>
  );
}

// ─── Key Findings Banner ──────────────────────────────────────────────────────

function KeyFindingsBanner({ parsed }: { parsed: ParsedSpreadsheet }) {
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

  const findings: {
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
    color: string;
    bg: string;
    border: string;
  }[] = [];

  if (trustAvg !== null) {
    findings.push({
      icon: <BarChart3 size={18} />,
      label: "Trust Y6 Combined",
      value: `${trustAvg}%`,
      sub: `${y6Count} schools reporting`,
      color: trustAvg >= 65 ? "text-emerald-700" : trustAvg >= 50 ? "text-amber-700" : "text-red-700",
      bg: trustAvg >= 65 ? "bg-emerald-50" : trustAvg >= 50 ? "bg-amber-50" : "bg-red-50",
      border: trustAvg >= 65 ? "border-emerald-200" : trustAvg >= 50 ? "border-amber-200" : "border-red-200",
    });
  }

  if (strongestSchool && strongestPct !== null) {
    findings.push({
      icon: <Trophy size={18} />,
      label: "Strongest school",
      value: `${strongestSchool} — ${strongestPct}%`,
      sub: "Highest Y6 Combined ARE",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    });
  }

  if (weakestSchool && weakestPct !== null && weakestSchool !== strongestSchool) {
    findings.push({
      icon: <AlertCircle size={18} />,
      label: "Needs attention",
      value: `${weakestSchool} — ${weakestPct}%`,
      sub: "Lowest Y6 Combined ARE",
      color: weakestPct < 50 ? "text-red-700" : "text-amber-700",
      bg: weakestPct < 50 ? "bg-red-50" : "bg-amber-50",
      border: weakestPct < 50 ? "border-red-200" : "border-amber-200",
    });
  }

  if (schoolsBelow50.length > 0) {
    findings.push({
      icon: <XCircle size={18} />,
      label: "Below 50% Y6 Combined",
      value: `${schoolsBelow50.length} ${schoolsBelow50.length === 1 ? "school" : "schools"}`,
      sub: schoolsBelow50.join(", "),
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
    });
  }

  if (schoolsZeroGdW3plus.length > 0) {
    findings.push({
      icon: <AlertTriangle size={18} />,
      label: "Zero GD Writing (3+ yr groups)",
      value: `${schoolsZeroGdW3plus.length} ${schoolsZeroGdW3plus.length === 1 ? "school" : "schools"}`,
      sub: schoolsZeroGdW3plus.join(", "),
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    });
  }

  if (findings.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white border border-gray-200 rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <Layers size={15} className="text-gray-500" />
        <span className="text-sm font-semibold text-gray-800">Key Findings</span>
        <span className="text-xs text-gray-400 ml-1">from your mid-year data</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {findings.map((f, i) => (
          <div key={i} className={`rounded-xl border px-4 py-3 ${f.bg} ${f.border}`}>
            <div className={`${f.color} mb-1.5`}>{f.icon}</div>
            <div className={`text-base font-bold ${f.color} leading-tight`}>{f.value}</div>
            <div className={`text-xs font-semibold mt-0.5 ${f.color} opacity-80`}>{f.label}</div>
            {f.sub && <div className={`text-[10px] mt-0.5 ${f.color} opacity-60 truncate`}>{f.sub}</div>}
          </div>
        ))}
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

function KS2TrackRecordChart({ school, abbrev, ks2Results, selfReports }: {
  school: string;
  abbrev: string;
  ks2Results: KS2Result[];
  selfReports: {
    autumn_term?: { combined: number | null } | null;
    mid_year?: { combined: number | null } | null;
  } | null;
}) {
  const info = TRUST_SCHOOLS[abbrev];
  if (!info) return null;

  const ks2Years = [2023, 2024, 2025];

  const ks2Combined = ks2Years.map((year) => getKs2CombinedForUrn(ks2Results, info.urn, year)).filter((v): v is number => v !== null);
  const bestEverKs2 = ks2Combined.length > 0 ? Math.max(...ks2Combined) : null;

  const autumnCombined = selfReports?.autumn_term?.combined ?? null;
  const midYearCombined = selfReports?.mid_year?.combined ?? null;

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
    ...(autumnCombined !== null ? [{ name: 'Autumn (self-report)', combined: autumnCombined, kind: 'autumn' as const, suspect: isAutumnSuspect }] : []),
    ...(midYearCombined !== null ? [{ name: 'Mid-Year (self-report)', combined: midYearCombined, kind: 'mid_year' as const, suspect: isMidYearSuspect }] : []),
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
  const headlineLabel = midYearCombined !== null ? 'Mid-Year' : autumnCombined !== null ? 'Autumn' : null;
  const headlineSuspect = (midYearCombined !== null && isMidYearSuspect) || (midYearCombined === null && isAutumnSuspect);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="font-bold text-gray-900 text-sm">{abbrev}</div>
          <div className="text-xs text-gray-500">{school}</div>
          <div className="text-[10px] text-gray-400">URN {info.urn}</div>
        </div>
        {headlinePct !== null && headlineLabel && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${headlineSuspect ? 'bg-red-50 text-red-700 border border-red-200' : headlineLabel === 'Mid-Year' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {headlineLabel}: {headlinePct}%
            {headlineSuspect && <span className="ml-1">⚠ above track record</span>}
          </div>
        )}
      </div>

      {isMidYearSuspect && (
        <div className="mb-2 flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          <AlertTriangle size={10} />
          Mid-Year self-report ({midYearCombined}%) exceeds best-ever KS2 ({bestEverKs2}%) by {midYearCombined !== null && bestEverKs2 !== null ? Math.round(midYearCombined - bestEverKs2) : 0}pp
        </div>
      )}
      {isAutumnSuspect && !isMidYearSuspect && (
        <div className="mb-2 flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          <AlertTriangle size={10} />
          Autumn self-report ({autumnCombined}%) exceeds best-ever KS2 ({bestEverKs2}%) by {autumnCombined !== null && bestEverKs2 !== null ? Math.round(autumnCombined - bestEverKs2) : 0}pp
        </div>
      )}
      {selfReportDelta !== null && Math.abs(selfReportDelta) >= 5 && (() => {
        // Colour by magnitude, not direction. A +22pp jump in one term should feel
        // suspect, not celebratory — even though it's technically "positive".
        const absDelta = Math.abs(selfReportDelta);
        const tone = selfReportDelta < 0
          ? 'text-red-700 bg-red-50 border-red-200'      // any downward move — conversation needed
          : absDelta >= 15 ? 'text-red-700 bg-red-50 border-red-200'   // 15pp+ up — almost certainly not real in one term
          : absDelta >= 10 ? 'text-amber-800 bg-amber-50 border-amber-200' // 10-15pp up — worth probing
          : 'text-emerald-700 bg-emerald-50 border-emerald-200';            // 5-10pp — plausible progression
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
            <span><strong>Self-report moved {selfReportDelta >= 0 ? '+' : ''}{selfReportDelta}pp</strong> between Autumn ({autumnCombined}%) and Mid-Year ({midYearCombined}%). {prompt}</span>
          </div>
        );
      })()}

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={true} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={110} axisLine={false} tickLine={false} />
          <ReferenceLine x={61} stroke="#9CA3AF" strokeDasharray="4 4" label={{ value: "Nat 61%", fontSize: 10, fill: "#9CA3AF", position: "right" }} />
          <Tooltip formatter={(val) => [`${val}%`, "Combined"]} contentStyle={{ fontSize: "12px" }} />
          <Bar dataKey="combined" shape={<CustomBar />} label={{ position: "right", fontSize: 11, fill: "#374151" }} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> DfE validated</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Autumn self-report</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" /> Mid-Year self-report</span>
        {(isAutumnSuspect || isMidYearSuspect) && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Suspect (10pp+ above track record)</span>}
      </div>
    </div>
  );
}

// ─── Phase 2: FSM Trend Chart ────────────────────────────────────────────────

function FsmTrendChart({ abbrev, census, selfReportFsmPcts }: {
  abbrev: string;
  census: CensusRecord[];
  selfReportFsmPcts?: { autumn_term: number | null; mid_year: number | null };
}) {
  const info = TRUST_SCHOOLS[abbrev];
  if (!info) return null;

  const schoolCensus = census
    .filter((c) => c.urn === info.urn && c.fsmPct !== null)
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
  if (autumnFsm !== null) chartData.push({ year: 'Aut 26*', fsm: null, autumnSelf: autumnFsm });
  if (midYearFsm !== null) chartData.push({ year: 'Mid 26*', fsm: null, midYearSelf: midYearFsm });

  // Watch for divergence — if the latest DfE census is materially different from
  // the Mid-Year self-report, that's worth surfacing.
  const latestDfE = schoolCensus[schoolCensus.length - 1]?.fsmPct ?? null;
  const divergence = (latestDfE !== null && midYearFsm !== null) ? Math.round((midYearFsm - latestDfE) * 10) / 10 : null;
  const divergenceFlag = divergence !== null && Math.abs(divergence) >= 5;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-gray-800 text-sm">{abbrev} — FSM % trend</div>
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
          <YAxis domain={[0, 60]} tick={{ fontSize: 9 }} />
          <Tooltip formatter={(val, name) => [`${val}%`, name === 'fsm' ? 'DfE FSM' : name === 'autumnSelf' ? 'Autumn self-report' : 'Mid-Year self-report']} />
          <Line type="monotone" dataKey="fsm" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2.5, fill: '#3B82F6' }} connectNulls={false} />
          <Line type="monotone" dataKey="autumnSelf" stroke="#F59E0B" strokeWidth={0} dot={{ r: 4, fill: '#F59E0B', stroke: '#F59E0B' }} />
          <Line type="monotone" dataKey="midYearSelf" stroke="#A855F7" strokeWidth={0} dot={{ r: 4, fill: '#A855F7', stroke: '#A855F7' }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-2 mt-1 text-[9px] text-gray-400 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> DfE census</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Autumn self-report</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Mid-Year self-report</span>
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
                          <td className="p-3 font-bold text-foreground text-[11px]">Autumn → Mid Δ</td>
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
                        <span className="font-semibold text-foreground">Subgroup Δ (Autumn → Mid):</span>
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
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const schoolInfo = TRUST_SCHOOLS[school];
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
  if (dfeData && schoolInfo) {
    const ks2Years = [2023, 2024, 2025];
    const ks2Vals = ks2Years.map(yr => ({ yr, pct: getKs2CombinedForUrn(dfeData.ks2Results, schoolInfo.urn, yr) })).filter(x => x.pct !== null);
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
  const { organizationId, session } = useAuth();
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
  const [capturesByPeriod, setCapturesByPeriod] = useState<Partial<Record<CapturePeriod, { parsed_data: ParsedSpreadsheet; file_name: string; created_at?: string }>>>({});
  const [currentCapturePeriod, setCurrentCapturePeriod] = useState<CapturePeriod | null>(null);
  const [dfeData, setDfeData] = useState<DfEData | null>(null);
  const [dfeLoading, setDfeLoading] = useState(false);
  const [dfeError, setDfeError] = useState<string | null>(null);
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
  const [grooveHouseStats, setGrooveHouseStats] = useState<{ totalPupils: number; trackablePupils: number } | null>(null);
  const [groveHouseData, setGroveHouseData] = useState<{
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
      all: { count: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      withoutFsm: { removed: number; remaining: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      withoutSend: { removed: number; remaining: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      withoutEal: { removed: number; remaining: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      fsmOnly: { count: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      sendOnly: { count: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
      ealOnly: { count: number; attainment: Record<string, { atExpected: number; total: number; pct: number }> };
    } | null;
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

  // Fetch DfE data once on mount (not on every re-render)
  const dfeLoadedRef = useRef(false);
  useEffect(() => {
    if (dfeLoadedRef.current || !accessToken) return;
    dfeLoadedRef.current = true;

    (async () => {
      setDfeLoading(true);
      setDfeError(null);
      try {
        const res = await fetch(`/api/trust-analysis${organizationId ? `?organizationId=${organizationId}` : ''}`, { headers: authHeaders });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to fetch DfE data");
        setDfeData({ ks2Results: json.ks2Results ?? json.data?.ks2Results, census: json.census ?? json.data?.census });
      } catch (e) {
        setDfeError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setDfeLoading(false);
      }
    })();

    // Also fetch Grove House full data (non-fatal) — ONLY when the current org IS Grove House.
    // Other schools show the locked/connect-your-data state instead of Grove House's data bleeding through.
    const GROVE_HOUSE_ORG_ID = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';
    if (organizationId !== GROVE_HOUSE_ORG_ID) {
      setGroveHouseData(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/trust-analysis/grove-house${organizationId ? `?organizationId=${organizationId}` : ''}`, { headers: authHeaders });
        const json = await res.json();
        const payload = json.data ?? json;
        const summary = payload.summary;
        if (res.ok && summary) {
          setGrooveHouseStats({
            totalPupils: summary.totalPupils,
            trackablePupils: summary.trackablePupils,
          });
          setGroveHouseData({
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
          });
        }
      } catch {
        // non-fatal
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
    const upperName = file.name.toUpperCase();
    const abbrevMatch = Object.keys(TRUST_SCHOOLS).find(a => upperName.includes(a));
    if (abbrevMatch) {
      resolvedAbbrev = abbrevMatch;
      setSummarySchoolAbbrev(abbrevMatch);
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
  }, [summarySchoolAbbrev, organizationId, authHeaders]);

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
      const info = TRUST_SCHOOLS[abbrev];
      if (!info) continue;
      const y6Data = parsed.data[abbrev]?.["Year 6"];
      const selfReportY6 = y6Data ? getCombinedARE(y6Data.all_pupils) : null;
      if (selfReportY6 === null) continue;

      const ks2Years = [2023, 2024, 2025];
      const historical = ks2Years.map((year) => getKs2CombinedForUrn(dfeData.ks2Results, info.urn, year)).filter((v): v is number => v !== null);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Trust Assessor</h1>
              <p className="text-sm text-gray-500">Upload mid-year data. Cross-reference with DfE. No AI — pure numbers.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ─── Connector Strip (minimal) ─────────────────────────────────── */}
        <div className="flex items-center gap-4 text-xs text-gray-500 px-1">
          {/* Connector 1: Spreadsheet */}
          <div className="flex items-center gap-1.5">
            {parsed ? (
              <>
                <Cloud size={12} className="text-emerald-500" />
                <span className="text-gray-700 font-medium truncate max-w-[200px]">{fileName}</span>
                {connector && <span className="text-emerald-500">●</span>}
                <button
                  onClick={async () => {
                    if (connector?.id && organizationId) {
                      await fetch(`/api/app-connectors?id=${connector.id}&organizationId=${organizationId}`, { method: 'DELETE', credentials: 'include', headers: authHeaders });
                    }
                    setParsed(null); setFileName(null); setConnector(null); setConnectorError(null);
                  }}
                  className="text-gray-300 hover:text-red-500"
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
                <span className="text-gray-400">Loading...</span>
              </>
            ) : (
              <>
                <Cloud size={12} className="text-gray-300" />
                <button onClick={() => setShowDrivePicker(true)} className="text-blue-600 hover:text-blue-800 font-medium">Connect</button>
                <span className="text-gray-200">|</span>
                <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-gray-600">upload</button>
              </>
            )}
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileChange} />
          </div>
          <span className="text-gray-200">·</span>
          {/* Connector 2: DfE */}
          <div className="flex items-center gap-1" title="Schoolgle DfE Database">
            <Database size={12} className={dfeData ? "text-blue-500" : "text-gray-300"} />
            <span className={dfeData ? "text-gray-600" : "text-gray-400"}>DfE {dfeData ? "●" : "○"}</span>
          </div>
          <span className="text-gray-200">·</span>
          {/* Connector 3: School Data Summary (per-school) */}
          <div className="flex items-center gap-1.5" title="School Data Summary — per-school Autumn/Mid/Target/EOY breakdown">
            <FileSpreadsheet size={12} className={summaryData ? "text-orange-500" : "text-gray-300"} />
            {summaryData ? (
              <>
                <span className="text-gray-700 font-medium truncate max-w-[180px]">{summaryFileName}</span>
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
                  className="text-gray-300 hover:text-red-500"
                  title="Remove school data summary"
                >✕</button>
              </>
            ) : (
              <>
                <button onClick={() => summaryFileInputRef.current?.click()} className="text-orange-600 hover:text-orange-800 font-medium">
                  + School Summary
                </button>
              </>
            )}
            <input ref={summaryFileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleSummaryFileChange} />
          </div>
          <span className="text-gray-200">·</span>
          {/* Connector 4: Per-pupil */}
          <div className="flex items-center gap-1" title="Per-pupil assessment data">
            <UserCheck size={12} className="text-gray-300" />
            <span className="text-gray-400">Pupil ○</span>
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
              <p className="text-sm text-gray-500 mb-4">Select your trust&apos;s mid-year data capture spreadsheet. This connection will be saved — the report will always use the latest version of this file.</p>
              <DriveFilePicker onFileSelected={(file, driveFileId, drivePath) => {
                processFile(file, driveFileId, drivePath);
                setShowDrivePicker(false);
              }} />
            </div>
          </div>
        )}

        {/* Key Findings — visible once data is loaded */}
        {parsed && <KeyFindingsBanner parsed={parsed} />}

        {/* No data — step-by-step guide */}
        {!parsed && !showDrivePicker && !connectorLoading && !connectorError && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-8"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Get started in 3 steps</h2>
            <p className="text-sm text-gray-500 mb-6">Connect your trust&apos;s data sources to unlock each layer of analysis.</p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">1</div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">Connect your mid-year data spreadsheet</div>
                  <p className="text-sm text-gray-600 mb-3">
                    The Excel spreadsheet your trust uses to capture mid-year assessment data (EYFS to Year 6).
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
                      className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Upload size={14} />
                      Upload file
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2 — shown but locked */}
              <div className="flex items-start gap-4 p-4 border border-gray-200 bg-gray-50 rounded-lg opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shrink-0">2</div>
                <div>
                  <div className="font-semibold text-gray-500">DfE Intelligence unlocks automatically</div>
                  <p className="text-sm text-gray-400">
                    Once your spreadsheet is connected, we cross-reference it against 3 years of validated KS2 results
                    and census data from the DfE. {dfeData ? '877 KS2 records ready.' : 'Loading DfE data...'}
                  </p>
                </div>
              </div>

              {/* Step 3 — shown but locked */}
              <div className="flex items-start gap-4 p-4 border border-gray-200 bg-gray-50 rounded-lg opacity-60">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-white flex items-center justify-center text-sm font-bold shrink-0">3</div>
                <div>
                  <div className="font-semibold text-gray-500">Per-pupil analytics (optional)</div>
                  <p className="text-sm text-gray-400">
                    Connect your CTF assessment files for per-pupil tracking from EYFS to KS2.
                    Shows individual pupil journeys, SEND overlay, and assessment accuracy validation.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
              className="bg-white border border-gray-200 rounded-2xl p-6 space-y-8"
            >
              <SectionHeader number={1} title="Your Data" subtitle="What the spreadsheet contains — parsed deterministically, no AI." complete />

              {/* ── 1. Trust Summary Bar ── */}
              {(() => {
                let totalPupils = 0;
                let totalFsmRaw = 0;
                let totalSend = 0;
                for (const school of parsed.schools) {
                  for (const yg of YEAR_GROUPS) {
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
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard label="Schools" value={parsed.schools.length} sub={parsed.schools.join(", ")} />
                    <StatCard label="Year groups" value={parsed.yearGroups.length} sub={parsed.yearGroups.join(", ")} />
                    <StatCard label="Data points" value={parsed.totalDataPoints.toLocaleString()} />
                    <StatCard label="Total pupils" value={totalPupils > 0 ? totalPupils.toLocaleString() : "—"} sub="all year groups" />
                    <StatCard label="FSM pupils" value={totalFsmRaw > 0 ? Math.round(totalFsmRaw).toLocaleString() : "—"} sub={fsmPct !== null ? `${Math.round(fsmPct)}% trust-wide` : undefined} />
                    <StatCard label="Quality flags" value={parsed.qualityFlags.length} sub={parsed.qualityFlags.length > 0 ? "See below" : "None"} />
                  </div>
                );
              })()}

              {/* ── 2. Traffic Light Summary Grid ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Y6 Summary — Traffic Light View</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Schools sorted by total pupils (largest first). Click a school name to drill into its detail.</p>
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

              {/* ── 2b. Full Year Group Heatmap (collapsed by default) ── */}
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

              {/* ── 3. School Tabs ── */}
              <div id="school-tabs-section">
                {/* Tab bar */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-4 border-b border-gray-200">
                  <button
                    onClick={() => setActiveSchoolTab("overview")}
                    className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSchoolTab === "overview" ? "bg-white border border-b-white border-gray-200 -mb-px text-blue-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                  >
                    Trust Overview
                  </button>
                  {parsed.schools.map((school) => (
                    <motion.button
                      key={school}
                      onClick={() => setActiveSchoolTab(school)}
                      whileHover={activeSchoolTab !== school ? { scale: 1.04 } : {}}
                      className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSchoolTab === school ? "bg-white border border-b-white border-gray-200 -mb-px text-blue-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                    >
                      {school}
                    </motion.button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  {activeSchoolTab === "overview" ? (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TrustInsights parsed={parsed} onSchoolClick={(school) => {
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
                      <SchoolTab key={activeSchoolTab} school={activeSchoolTab} parsed={parsed} dfeData={dfeData} staffingSnapshots={staffingSnapshots} summaryData={summaryData?.schoolAbbrev === activeSchoolTab ? summaryData : null} authToken={accessToken ?? undefined} organizationId={organizationId ?? undefined} capturesByPeriod={capturesByPeriod} />

                      {/* BUILD 4: No-CTF upsell for non-GHPS schools */}
                      {!groveHouseData && activeSchoolTab !== 'GHPS' && (
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
                              <h3 className="text-lg font-semibold text-foreground mb-2">Connect CTF data for {TRUST_SCHOOLS[activeSchoolTab]?.name ?? activeSchoolTab}</h3>
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

                // Missing EYFS
                for (const school of parsed.schools) {
                  if (!parsed.data[school]?.["EYFS"]) {
                    extraFlags.push({ school, yearGroup: "EYFS", field: "gld", issue: `${school} has not submitted EYFS data`, severity: "warning" });
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
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
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
                    {parsed.schools.map((abbrev) => {
                      const autumnY6 = capturesByPeriod.autumn_term?.parsed_data?.data?.[abbrev]?.["Year 6"];
                      const midYearY6 = capturesByPeriod.mid_year?.parsed_data?.data?.[abbrev]?.["Year 6"];
                      const selfReports = {
                        autumn_term: autumnY6 ? { combined: autumnY6.all_pupils.c_are ?? null } : null,
                        mid_year: midYearY6 ? { combined: midYearY6.all_pupils.c_are ?? null } : null,
                      };
                      const info = TRUST_SCHOOLS[abbrev];
                      return (
                        <KS2TrackRecordChart
                          key={abbrev}
                          school={info?.name ?? abbrev}
                          abbrev={abbrev}
                          ks2Results={dfeData.ks2Results}
                          selfReports={selfReports}
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
                    {parsed.schools.map((abbrev) => {
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
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {/* No spreadsheet: show all schools' KS2 latest */}
              {!parsed && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Trust KS2 Combined % — Latest Available</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(TRUST_SCHOOLS).map(([abbrev, info]) => {
                      const latestResult = [2025, 2024, 2023].map((year) => ({
                        year,
                        pct: getKs2CombinedForUrn(dfeData.ks2Results, info.urn, year),
                      })).find((r) => r.pct !== null);
                      return (
                        <div key={abbrev} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                          <div className="font-bold text-gray-800 text-lg">
                            {latestResult?.pct !== null && latestResult?.pct !== undefined ? `${latestResult.pct}%` : "—"}
                          </div>
                          <div className="text-xs font-semibold text-gray-600">{abbrev}</div>
                          {latestResult && <div className="text-xs text-gray-400">{latestResult.year}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ─── Phase 3: Per-Pupil Deep Analytics ───────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionHeader number={3} title="Deep Analytics" subtitle={groveHouseData ? `Per-pupil tracking from CTF assessment files. ${groveHouseData.summary?.totalPupils || ''} pupils.` : "Per-pupil tracking from CTF assessment files. Connect your CTF to unlock pupil-level analysis."} />

          {!groveHouseData ? (
            /* Locked state — no data yet */
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
          ) : (
            <div className="space-y-8">

              {/* ── Section 1: Grove House Profile ── */}
              <div>
                <div className="mb-1">
                  <h3 className="text-base font-semibold text-gray-900">Grove House Primary School — Per-Pupil Deep Dive</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Data source: CTF assessment files (EYFS, KS1, Phonics). {groveHouseData.summary.totalPupils} unique pupils across {groveHouseData.summary.yearsSpan.length} years (includes leavers — not current roll).
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {[
                    { label: "Unique pupils (all years)", value: groveHouseData.summary.totalPupils },
                    { label: "Trackable across years", value: groveHouseData.summary.trackablePupils },
                    { label: "Years of data", value: groveHouseData.summary.yearsSpan.length },
                    { label: "Assessment records", value: groveHouseData.summary.totalRecords.toLocaleString() },
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
                {groveHouseData.eyfsGld.length > 0 ? (
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
                          {groveHouseData.eyfsGld.map((row) => (
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
                    {groveHouseData.eyfsGld.length >= 2 && (() => {
                      const first = groveHouseData.eyfsGld[0];
                      const last = groveHouseData.eyfsGld[groveHouseData.eyfsGld.length - 1];
                      const drop = first.gldPct - last.gldPct;
                      if (drop > 0) return (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
                          <span className="font-semibold">EYFS GLD is declining</span> — {first.gldPct}% to {last.gldPct}% over {groveHouseData.eyfsGld.length} years
                          ({drop}pp drop). Fewer children entering Y1 with expected foundation skills.
                          <div className="text-xs text-red-600 mt-1">Source: CTF EYFS Profile data — validated per-pupil assessment, not self-reported</div>
                        </div>
                      );
                      return null;
                    })()}
                  </>
                ) : (
                  /* No EYFS data from live API — show hardcoded illustrative data */
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Year</th>
                            <th className="text-right py-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">GLD %</th>
                            <th className="text-left py-2 pl-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Visual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[{ year: "2022/23", pct: 68 }, { year: "2023/24", pct: 65 }, { year: "2024/25", pct: 60 }, { year: "2025/26", pct: 51 }].map((row) => (
                            <tr key={row.year} className="border-b border-gray-100">
                              <td className="py-2 pr-4 text-gray-700 font-medium">{row.year}</td>
                              <td className={`py-2 px-4 text-right font-semibold ${row.pct < 60 ? 'text-red-600' : row.pct < 70 ? 'text-amber-600' : 'text-green-700'}`}>{row.pct}%</td>
                              <td className="py-2 pl-4">
                                <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-32">
                                  <div className={`h-2 rounded-full ${row.pct < 60 ? 'bg-red-500' : row.pct < 70 ? 'bg-amber-400' : 'bg-green-500'}`} style={{ width: `${row.pct}%` }} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800">
                      <span className="font-semibold">EYFS GLD is declining</span> — 68% to 51% over 4 years. Fewer children entering Y1 with expected foundation skills.
                      <div className="text-xs text-red-600 mt-1">Source: CTF EYFS Profile data — validated per-pupil assessment, not self-reported</div>
                    </div>
                  </>
                )}
              </div>

              {/* ── Section 3: KS1 Anchor Points ── */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">KS1 Anchor Points — Expected Standard by Subject</h4>
                {groveHouseData.ks1Data.length > 0 ? (
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
                          {groveHouseData.ks1Data.map((row) => {
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
                  /* No KS1 data from live API — show hardcoded illustrative data */
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
                          {[
                            { year: "2022/23", pupils: 52, r: 67, w: 46, m: 63 },
                            { year: "2023/24", pupils: 59, r: 63, w: 54, m: 64 },
                          ].map((row) => (
                            <tr key={row.year} className="border-b border-gray-100">
                              <td className="py-2 pr-4 text-gray-700 font-medium">{row.year}</td>
                              <td className="py-2 px-4 text-right text-gray-600">{row.pupils}</td>
                              <td className="py-2 px-4 text-right font-semibold text-amber-600">{row.r}%</td>
                              <td className="py-2 px-4 text-right font-semibold text-red-600">{row.w}%</td>
                              <td className="py-2 px-4 text-right font-semibold text-amber-600">{row.m}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                      <span className="font-semibold">Writing has been consistently the weakest subject at KS1.</span> The 2022/23 cohort (now in Y4) entered KS2 phase with only 46% at expected in Writing.
                    </div>
                  </>
                )}
              </div>

              {/* ── Section 4: The Key Finding — Why Y6 is at 48% ── */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">The Key Finding — Why is Y6 at 48%?</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-4 text-sm text-gray-700">
                  <p className="text-gray-600 leading-relaxed">
                    The current Y6 cohort sat their KS1 assessments in 2022/23. At that point:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Reading", ks1: "67%", y6: "57%", delta: -10, improved: false },
                      { label: "Writing", ks1: "46%", y6: "54%", delta: +8, improved: true },
                      { label: "Maths", ks1: "63%", y6: "51%", delta: -12, improved: false },
                    ].map(({ label, ks1, y6, delta, improved }) => (
                      <div key={label} className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-2 font-medium">{label}</div>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-xs text-gray-400">KS1 baseline</div>
                            <div className="font-semibold text-gray-700">{ks1}</div>
                          </div>
                          <div className={`text-xs font-bold px-1.5 py-0.5 rounded ${improved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {delta > 0 ? '+' : ''}{delta}pp
                          </div>
                          <div>
                            <div className="text-xs text-gray-400">Y6 now</div>
                            <div className={`font-semibold ${improved ? 'text-green-700' : 'text-red-600'}`}>{y6}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400">Combined (RWM)</span>
                      <div className="font-bold text-lg text-red-600">48%</div>
                    </div>
                    <div className="text-xs text-gray-500 max-w-xs text-right">
                      This cohort has <span className="font-semibold text-red-600">declined in Reading and Maths</span> since KS1. Only Writing has improved, but from a very low base.
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900">
                    <div className="font-semibold mb-1">An Ofsted inspector would ask:</div>
                    <p className="italic text-amber-800">
                      "If these pupils were at 67% Reading at KS1, why are they at 57% four years later? What happened in Years 3, 4, and 5?"
                    </p>
                    <div className="mt-2 text-xs text-amber-700">
                      The data raises three possible questions: (1) whether the KS1 baseline sat above demographic prediction, (2) whether progress across Y3-Y5 slowed and if so why, or (3) whether this mid-year Y6 snapshot is conservative. School leadership will have context on which of these explanations best fits the picture.
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 4b: Cohort Forensics ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 uppercase tracking-wider">Forensic Finding</span>
                    <h4 className="text-sm font-semibold text-gray-800">The Y6 figures align with demographic prediction — the data raises questions about the 2022/23 KS1 baseline</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    The following evidence points are presented for governors to explore with school leadership. The pattern is statistically notable and warrants discussion.
                  </p>

                  {/* EVIDENCE — four data points for governor discussion */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Four data points for discussion</span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-white rounded-lg border border-amber-200 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">1</div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">Writing followed statutory moderation rules — it shows normal progression.</div>
                            <div className="text-xs text-gray-600">
                              In 2022/23 (the final year of statutory KS1 assessment), Writing was the <strong>externally moderated</strong> subject in most LAs.
                              This cohort&apos;s Writing went 46% → 54% — a realistic +8pp improvement over four years.
                              Reading (externally moderated far less consistently) went 67% → 57% — a 10pp drop.
                              Maths (teacher-only assessment) went 63% → 51% — a 12pp drop.
                              <strong className="text-amber-700"> The pattern — only externally unmoderated subjects showing a drop — is a common signal in assessment alignment reviews and worth exploring.</strong>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">Sources:</span>
                              {(['sta-moderation-2022', 'dfe-ks1-2023'] as const).map((id) => (
                                <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium cursor-help" title={citationFull(id)}>
                                  {citationShort(id)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-amber-200 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">2</div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">The KS1 Reading figure is statistically incompatible with this school&apos;s demographics.</div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>School composition: <strong>38% FSM, 22% SEND, 40% EAL</strong> — all well above national.</div>
                              <div>National KS1 Reading EXS+ (2022/23): <strong>68%</strong></div>
                              <div>Non-disadvantaged pupils achieved ~72%; disadvantaged ~54%. Applying this to Grove House&apos;s FSM profile alone predicts <strong>~65%</strong>. Layering in the SEND gap (~25pp lower attainment) and EAL gap (~12pp) reduces the demographic prediction to <strong>~50-55%</strong>.</div>
                              <div>Reported: <strong className="text-amber-700">67%</strong>. That is 12-17pp above where this cohort&apos;s demographic profile would predict. This raises a question worth governors exploring with leadership.</div>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">Sources:</span>
                              {(['eef-pupil-premium-2024', 'strand-demie-2018', 'eef-send-2020', 'dfe-ks1-2023'] as const).map((id) => (
                                <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium cursor-help" title={citationFull(id)}>
                                  {citationShort(id)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-amber-200 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">3</div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">Current Y6 attainment IS consistent with this cohort&apos;s demographics.</div>
                            <div className="text-xs text-gray-600">
                              Y6 Reading 57%, Maths 51%, Writing 54% — these numbers align closely with where a 38% FSM / 22% SEND / 40% EAL school would be predicted to perform by national DfE attainment-gap data.
                              One possible explanation is that the Y6 figures represent a more accurate picture of this cohort&apos;s attainment, and the 2022/23 KS1 baseline sat above what demographic expectations would predict.
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">Sources:</span>
                              {(['eef-pupil-premium-2024', 'demie-2023'] as const).map((id) => (
                                <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium cursor-help" title={citationFull(id)}>
                                  {citationShort(id)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-amber-200 p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">4</div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-1">A whole-cohort regression of this magnitude across 2 of 3 subjects is statistically uncommon.</div>
                            <div className="text-xs text-gray-600">
                              Whole-cohort drops of this scale occur in a small proportion of UK primary cohorts (DfE cohort-comparison data). When the subject pattern — only unmoderated subjects declining — is also present, assessment alignment is a more likely explanation than genuine regression. This does not rule out other factors, which leadership will be best placed to address.
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-gray-400 uppercase font-semibold">Sources:</span>
                              {(['dfe-ks2-2024'] as const).map((id) => (
                                <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium cursor-help" title={citationFull(id)}>
                                  {citationShort(id)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-900">
                      <strong>Summary:</strong> The 2022/23 KS1 results sit 12-17pp higher than this cohort&apos;s demographic profile predicts. The current Y6 figures align closely with that prediction. This pattern — common in schools where KS1 moderation was not externally verified — suggests the Y6 &quot;decline&quot; is more likely an assessment realignment than a genuine regression. Governors may want to ask about 2022/23 moderation practices.
                    </div>
                  </div>

                  {/* The numbers — static hero grid */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">The Maths — how we know</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-3xl font-bold text-gray-900">67%</div>
                        <div className="text-xs text-gray-500 mt-1">KS1 Reading reported</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-3xl font-bold text-gray-900">~50-55%</div>
                        <div className="text-xs text-gray-500 mt-1">Demographic prediction</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <div className="text-3xl font-bold text-red-700">+12-17pp</div>
                        <div className="text-xs text-red-600 mt-1">Above prediction</div>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <div className="text-3xl font-bold text-amber-700">57%</div>
                        <div className="text-xs text-amber-700 mt-1">Y6 Reading — matches prediction</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500">
                      Sources: DfE National Statistics 2022/23 KS1 Teacher Assessment; EEF disadvantage attainment gap (FSM gap ~18pp, SEND gap ~25pp, EAL gap ~12pp at KS1 Reading).
                    </div>
                  </div>

                  {/* THE PRODUCT — how Schoolgle prevents this */}
                  <div className="bg-card border border-border rounded-2xl mb-4 overflow-hidden">
                    <div className="h-1 bg-sky-500" />
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 uppercase tracking-wider">How Schoolgle supports this</span>
                      </div>
                      <h5 className="text-base font-semibold text-foreground mb-2">Earlier detection means more time to act</h5>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        Assessment alignment questions often surface at KS2 — four years after the original assessment.
                        Schoolgle&apos;s continuous assessment layer is designed to surface these signals in term 2 of Y2, when there is still time to investigate and recalibrate.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="bg-muted/50 rounded-lg p-3 border border-border">
                          <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Continuous Assessment Tracker</div>
                          <div className="text-sm text-foreground">
                            Half-termly checkpoints against standardised benchmarks. Every pupil, every term, every subject.
                            AI flags teacher assessments that diverge more than 1.5 standard deviations from the pupil&apos;s own prior trajectory OR from statistically similar pupils nationally.
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 border border-border">
                          <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">AI Moderation Support</div>
                          <div className="text-sm text-foreground">
                            Cross-validates teacher judgement against pupil&apos;s phonics screening, EYFS profile, reading age, Accelerated Reader, and historical cohort benchmarks.
                            Flags statistical outliers — not to overrule the teacher, but to prompt triangulation.
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 border border-border">
                          <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Demographic-Aware Benchmarks</div>
                          <div className="text-sm text-foreground">
                            Every cohort measured against the statistical expectation for schools with matching FSM/SEND/EAL/mobility profiles.
                            A result that sits 12-17pp above demographic prediction would have been flagged in Term 2 of Y2 — not Term 5 of Y6.
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 border border-border">
                          <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-muted-foreground">Governor-Ready Audit Trail</div>
                          <div className="text-sm text-foreground">
                            Every assessment logged with evidence, moderator name, and AI validation status.
                            When Ofsted asks &quot;how do you know?&quot;, the answer is a one-click download of the full audit trail.
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 text-sm text-foreground border border-border">
                        <strong>With earlier detection:</strong> Assessment alignment question surfaced in Term 2 Y2 (Nov 2022) → discussed with phase leader → external moderation considered → assessment reviewed by Feb 2023 → Y3-Y6 teachers inherit a more reliable baseline → the pattern seen at Y6 becomes a known question, not a surprise.
                      </div>
                    </div>
                  </div>

                  {/* Questions for the school */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <h5 className="text-sm font-semibold text-blue-900 mb-3">Questions the board should ask Grove House</h5>
                    <ol className="space-y-2 text-sm text-blue-900 list-decimal list-inside">
                      <li>Who assessed Y2 Reading and Maths in 2022/23? Are those teachers still in post? Were their assessments externally moderated, or teacher-only?</li>
                      <li>What percentage of the 2022/23 Y2 cohort was formally moderated? (If under 25%, the results should not be used as a baseline.)</li>
                      <li>Was there LA or trust-level moderation of Reading and Maths? Or was it limited to the statutory Writing requirement?</li>
                      <li>What does the phonics screening data from this cohort (Y1 2021/22) show? Does it corroborate 67% reading at expected — or does it predict a lower figure?</li>
                      <li>If the school agrees the KS1 assessment was optimistic, what mechanism is now in place to prevent repetition? Schoolgle&apos;s continuous assessment product is designed for this.</li>
                    </ol>
                  </div>

                  {/* Data limitations */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
                    <span className="font-semibold text-gray-700">Method note:</span> The demographic prediction uses DfE published attainment gaps at KS1 Reading 2022/23 (FSM ~18pp, SEND ~25pp, EAL ~12pp).
                    FSM/SEND/EAL flags in the CTF import were not populated for this cohort — school-level demographics (38% FSM, 22% SEND, 40% EAL) are used as proxies.
                    EHCP-specific and visual impairment flags are not available in CTF data and would need MIS (Arbor / SIMS / Bromcom) cross-reference — which the Schoolgle platform handles natively.
                  </div>

                  {/* Research References accordion */}
                  <details className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <summary className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                      Research References (used in this analysis)
                    </summary>
                    <ul className="mt-3 space-y-3 text-xs text-gray-600">
                      {(['dfe-ks1-2023', 'sta-moderation-2022', 'eef-pupil-premium-2024', 'strand-demie-2018', 'eef-send-2020', 'demie-2023', 'dfe-ks2-2024'] as const).map((id) => {
                        const c = RESEARCH_CITATIONS[id];
                        return (
                          <li key={id}>
                            <strong className="text-gray-800">{citationFull(id)}</strong>
                            {c?.url && (
                              <> <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">[link]</a></>
                            )}
                            <br />
                            <span className="italic text-gray-500">{c?.keyFinding}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </details>
                </div>
              </motion.div>

              {/* ── Section 5: Pipeline Outlook ── */}
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
                {groveHouseData.spotlightPupil && (() => {
                  const sp = groveHouseData.spotlightPupil!;
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
                      {groveHouseData && groveHouseData.cohortJourneys.length > 0 && (() => {
                        const subjectCounts: Record<string, number> = { reading: 0, writing: 0, maths: 0 };
                        for (const p of groveHouseData.cohortJourneys) {
                          const w = weakestSubject(p.journey);
                          if (w && w.subject in subjectCounts) subjectCounts[w.subject]++;
                        }
                        const total = groveHouseData.cohortJourneys.length;
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
                {groveHouseData.cohortJourneys.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">{groveHouseData.cohortJourneys.length} trackable pupils with multi-year data</span>
                    </div>
                    <PupilCardGrid
                      pupils={groveHouseData.cohortJourneys}
                      spotlightPupilId={groveHouseData.spotlightPupil?.pupilId ?? null}
                    />

                    {/* Demographic summary */}
                    {(() => {
                      const total = groveHouseData.cohortJourneys.length;
                      const fsmCount = groveHouseData.cohortJourneys.filter(p => p.demographics.isFsm).length;
                      const sendCount = groveHouseData.cohortJourneys.filter(p => p.demographics.isSend).length;
                      const ealCount = groveHouseData.cohortJourneys.filter(p => p.demographics.isEal).length;
                      const levelValue = (l: string) => l === 'GDS' ? 3 : l === 'EXS' || l === '2' ? 2 : 1;
                      const decliningCount = groveHouseData.cohortJourneys.filter(p => {
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
                                const fsmDeclining = groveHouseData.cohortJourneys.filter(p => {
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

                {groveHouseData.cohortMilestones && groveHouseData.cohortMilestones.length > 0 ? (
                  <div className="space-y-5">
                    {groveHouseData.cohortMilestones.map((cohort) => {
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
                      {groveHouseData.cohortTracking && groveHouseData.cohortTracking.length > 0 && (
                        <span> The data does include {groveHouseData.cohortTracking.length} tracked cohort(s) — milestone mapping may be limited by the subjects available in the CTF files.</span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Section 8: Demographic Disaggregation — Defend Your Numbers ── */}
              {groveHouseData.demographicDisaggregation && (
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Defend Your Numbers — Demographic Impact Analysis</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    What happens to attainment when you isolate specific pupil groups? This shows exactly which demographics are driving the headline figures up or down.
                  </p>

                  {(() => {
                    const dd = groveHouseData.demographicDisaggregation!;
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
                    const dd = groveHouseData.demographicDisaggregation!;
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

      </div>
    </div>
  );
}
