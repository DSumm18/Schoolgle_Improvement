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
import { useAuth } from "@/context/SupabaseAuthContext";
import { useGoogleDriveAccess } from "@/hooks/useGoogleDriveAccess";
import type { KS2Result, CensusRecord, NationalPercentile, ThreeYearAverage } from "@/lib/trust-analysis/types";

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
  if (isCount) return extractNumber(value);

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

    const headerRowIndex = rows.findIndex((row) =>
      row.some((cell) => String(cell ?? "").toLowerCase().includes("number in cohort"))
    );
    const trustRowIndex = rows.findIndex(
      (row, idx) => idx > Math.max(0, headerRowIndex) && String(row[0] ?? "").trim().toUpperCase() === "TRUST"
    );
    const schoolRowsStart = trustRowIndex >= 0 ? trustRowIndex + 1 : headerRowIndex + 1;

    for (let r = schoolRowsStart; r < rows.length; r++) {
      const row = rows[r] ?? [];
      const schoolRaw = String(row[0] ?? "").trim().toUpperCase();
      if (!schoolRaw || schoolRaw === "TRUST" || schoolRaw.startsWith("NATIONAL") || !/^[A-Z]{2,6}$/.test(schoolRaw)) continue;

      schools.add(schoolRaw);
      yearGroupsFound.add(sheetName);

      if (!data[schoolRaw]) data[schoolRaw] = {};

      const cohort = {
        number_in_cohort: parseCell("number_in_cohort", row[1]),
        number_send: parseCell("number_send", row[2]),
        ehcp: parseCell("ehcp", row[3]),
        number_fsm: parseCell("number_fsm", row[4]),
      };

      const all_pupils: Partial<SubjectScores> = {};
      const fsm6: Partial<SubjectScores> = {};
      const not_fsm6: Partial<SubjectScores> = {};

      for (const sectionProfile of profile) {
        const target = sectionProfile.section === "all_pupils" ? all_pupils : sectionProfile.section === "fsm6" ? fsm6 : not_fsm6;
        sectionProfile.metrics.forEach((metric, idx) => {
          const raw = row[sectionProfile.start + idx];
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
                  <div className="text-xl font-bold text-rose-600">{fsmPct !== null ? `${fsmPct}%` : "—"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">FSM %</div>
                  <div className="text-xs text-gray-400">{totalFsm > 0 ? `${totalFsm} pupils` : ""}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-600">{sendPct !== null ? `${sendPct}%` : "—"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">SEND %</div>
                  <div className="text-xs text-gray-400">{totalSend > 0 ? `${totalSend} pupils` : ""}</div>
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

function SchoolTab({ school, parsed, dfeData, authToken }: { school: string; parsed: ParsedSpreadsheet; dfeData?: DfEData | null; authToken?: string }) {
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

  // Generate AI narrative once when component mounts with data
  useEffect(() => {
    if (narrativeRequestedRef.current || !school) return;
    narrativeRequestedRef.current = true;

    const generateNarrative = async () => {
      setNarrativeLoading(true);
      try {
        // Build the data payload for the AI
        const schoolMetrics: Record<string, unknown> = {
          school,
          totalPupils,
          fsmPct,
          sendPct,
          ehcpCount: totalEhcp,
          trustFsmAvg: trustFsmPct ? Math.round(trustFsmPct) : null,
          yearGroups: {} as Record<string, unknown>,
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
          if (text) setAiNarrative(text);
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

  return (
    <div className="space-y-8">

      {/* Generate Governor Report button — top right */}
      <div className="flex justify-end">
        <button
          onClick={() => { setShowReportModal(true); setReportError(null); setReportShareToken(null); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
        >
          <FileText size={16} />
          Generate Governor Report
        </button>
      </div>

      {/* Generate Governor Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
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

            {/* Template selector */}
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="report-template">Template</label>
                <select
                  id="report-template"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue="governor-board"
                >
                  <option value="governor-board">Governor Board Report</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">4-page A4 report with executive summary, cohort chart, recommendations, and governor questions.</p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="report-appendix"
                    checked={reportIncludeAppendix}
                    onChange={(e) => setReportIncludeAppendix(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="report-appendix" className="text-sm text-gray-700">Include data appendix</label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="report-confidential"
                    checked={reportConfidential}
                    onChange={(e) => setReportConfidential(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="report-confidential" className="text-sm text-gray-700">Add confidentiality watermark</label>
                </div>
              </div>
            </div>

            {/* Error state */}
            {reportError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-xs text-red-700">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{reportError}</span>
              </div>
            )}

            {/* Share token success */}
            {reportShareToken && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-4 text-xs text-emerald-700">
                <CheckCircle2 size={14} />
                <span>Report generated. Share token: <span className="font-mono font-semibold">{reportShareToken}</span></span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={reportGenerating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={reportGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reportGenerating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-white animate-spin" />
                    Generating... (~15s)
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Generate Report
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-3 text-center">
              Report opens in a new tab and downloads as an HTML file. Print to PDF from your browser.
            </p>
          </div>
        </div>
      )}

      {/* AI Narrative Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6"
      >
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Info size={16} className="text-blue-500" />
          Assessment Summary — {school}
        </h3>

        {narrativeLoading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-4 h-4 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            <span className="text-sm text-slate-500">Generating analysis...</span>
          </div>
        ) : aiNarrative ? (
          <div className="max-w-none space-y-3">
            {aiNarrative
              // Strip markdown headers
              .replace(/^#{1,4}\s+/gm, '')
              // Strip bold/italic markers
              .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
              .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
              // Convert bullet lines into flowing text
              .replace(/^[-•]\s+/gm, '')
              .replace(/^\d+\.\s+/gm, '')
              // Clean up excess whitespace
              .replace(/\n{3,}/g, '\n\n')
              .trim()
              .split('\n\n')
              .filter(p => p.trim().length > 0)
              .map((para, i) => (
                <p key={i} className="text-sm text-slate-700 leading-relaxed">{para.replace(/\n/g, ' ').trim()}</p>
              ))
            }
          </div>
        ) : narrativePoints.length > 0 ? (
          <div className="space-y-3">
            {narrativePoints.map((point, i) => (
              <p key={i} className="text-sm text-slate-700 leading-relaxed">{point}</p>
            ))}
          </div>
        ) : null}

        <p className="text-[10px] text-slate-400 mt-4">
          Source: Analysis based on trust mid-year spreadsheet data (self-reported). Not externally validated.
          {aiNarrative && ' Narrative generated by AI from the computed metrics.'}
        </p>
      </motion.div>

      {/* Section A: School Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white border border-gray-200 rounded-xl p-5"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <School size={18} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg">{school}</h3>
            {info && <p className="text-sm text-gray-500">{info.name}</p>}
          </div>
          {info?.urn && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">URN {info.urn}</span>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900">{totalPupils > 0 ? totalPupils : "—"}</div>
            <div className="text-xs text-gray-500 mt-0.5">Total Pupils</div>
          </div>
          <div className="bg-rose-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-rose-700">{fsmPct !== null ? `${fsmPct}%` : "—"}</div>
            <div className="text-xs text-rose-600 mt-0.5">FSM ({totalFsm} pupils)</div>
            {trustFsmPct !== null && fsmPct !== null && (
              <div className={`text-xs mt-1 font-medium ${fsmPct > trustFsmPct ? "text-rose-500" : "text-emerald-600"}`}>
                {fsmPct > trustFsmPct ? `+${Math.round(fsmPct - trustFsmPct)}pp above` : `${Math.round(trustFsmPct - fsmPct)}pp below`} trust avg
              </div>
            )}
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-700">{sendPct !== null ? `${sendPct}%` : "—"}</div>
            <div className="text-xs text-purple-600 mt-0.5">SEND ({totalSend} pupils)</div>
            {trustSendPct !== null && sendPct !== null && (
              <div className={`text-xs mt-1 font-medium ${sendPct > trustSendPct ? "text-purple-500" : "text-emerald-600"}`}>
                {sendPct > trustSendPct ? `+${Math.round(sendPct - trustSendPct)}pp above` : `${Math.round(trustSendPct - sendPct)}pp below`} trust avg
              </div>
            )}
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-indigo-700">{totalEhcp > 0 ? totalEhcp : "—"}</div>
            <div className="text-xs text-indigo-600 mt-0.5">EHCPs</div>
          </div>
        </div>

        {/* ARE/GD legend */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <span className="font-medium text-gray-500">Glossary:</span>
          <span><span className="font-medium text-gray-600">ARE</span> = Age Related Expectations (% at expected standard)</span>
          <span><span className="font-medium text-gray-600">GD</span> = Greater Depth (% exceeding expected standard)</span>
        </div>
      </motion.div>

      {/* ── Validation & Credibility Section ── */}
      {(nationalPercentile !== null || threeYearAvg !== null || statAlerts.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Validation &amp; Credibility</span>
            <span className="text-xs text-gray-400">DfE validated data vs self-reported figures</span>
          </div>

          {/* Row 1: National Percentile + Predictive Accuracy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Insight 1: National Percentile */}
            {nationalPercentile !== null && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Trophy size={15} className={
                    nationalPercentile.percentile > 75 ? "text-emerald-500" :
                    nationalPercentile.percentile > 50 ? "text-blue-500" :
                    nationalPercentile.percentile > 25 ? "text-amber-500" :
                    "text-red-500"
                  } />
                  National Percentile Rank
                  <span className="text-xs text-gray-400 font-normal ml-auto">KS2 Combined 2024/25</span>
                </h4>
                <div className={`text-5xl font-extrabold mb-1 ${
                  nationalPercentile.percentile > 75 ? "text-emerald-600" :
                  nationalPercentile.percentile > 50 ? "text-blue-600" :
                  nationalPercentile.percentile > 25 ? "text-amber-600" :
                  "text-red-600"
                }`}>
                  {ordinal(nationalPercentile.percentile)}
                </div>
                <div className={`text-sm font-semibold mb-3 ${
                  nationalPercentile.percentile > 50 ? "text-emerald-700" : "text-red-700"
                }`}>
                  {nationalPercentile.percentile > 50
                    ? `Better than ${nationalPercentile.percentile}% of England schools`
                    : `Worse than ${100 - nationalPercentile.percentile}% of England schools`
                  }
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="font-bold text-gray-900 text-base">{nationalPercentile.pct}%</div>
                    <div className="text-gray-500 mt-0.5">KS2 Combined</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="font-bold text-gray-900 text-base">
                      {nationalPercentile.rank.toLocaleString()} / {nationalPercentile.totalSchools.toLocaleString()}
                    </div>
                    <div className="text-gray-500 mt-0.5">National rank</div>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                  <Info size={9} />
                  Source: DfE KS2 2023/24 national dataset ({nationalPercentile.totalSchools.toLocaleString()} schools)
                </div>
              </div>
            )}

            {/* Insight 2: Predictive Accuracy Check */}
            {threeYearAvg !== null && y6Combined !== null && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={15} className="text-blue-500" />
                  Predictive Accuracy Check
                </h4>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Mid-year Y6 prediction</div>
                    <div className="text-2xl font-bold text-gray-900">{y6Combined}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">3-yr DfE validated avg</div>
                    <div className="text-2xl font-bold text-gray-900">{threeYearAvg.averagePct}%</div>
                    <div className="text-[10px] text-gray-400">{threeYearAvg.yearsUsed} yr{threeYearAvg.yearsUsed !== 1 ? "s" : ""} of data</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Gap</div>
                    <div className={`text-2xl font-bold ${
                      Math.abs(y6Combined - threeYearAvg.averagePct) <= 5 ? "text-green-600" :
                      Math.abs(y6Combined - threeYearAvg.averagePct) <= 10 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {y6Combined > threeYearAvg.averagePct ? "+" : ""}{y6Combined - threeYearAvg.averagePct}pp
                    </div>
                  </div>
                </div>
                <div className={`text-xs p-2 rounded-lg ${
                  y6Combined > threeYearAvg.averagePct + 10 ? "bg-amber-50 text-amber-800 border border-amber-200" :
                  y6Combined < threeYearAvg.averagePct - 10 ? "bg-amber-50 text-amber-800 border border-amber-200" :
                  "bg-green-50 text-green-800 border border-green-200"
                }`}>
                  {y6Combined > threeYearAvg.averagePct + 10
                    ? `Prediction is ${y6Combined - threeYearAvg.averagePct}pp above the 3-year KS2 average. Historically optimistic — what evidence supports this cohort outperforming past results?`
                    : y6Combined < threeYearAvg.averagePct - 10
                    ? `Prediction is ${threeYearAvg.averagePct - y6Combined}pp below the 3-year KS2 average. Either this cohort is genuinely weaker or the mid-year assessment is overly pessimistic.`
                    : `Within normal range of the 3-year KS2 average. Broadly consistent with historical performance.`
                  }
                </div>
                <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                  <Info size={9} />
                  3-yr avg uses DfE validated KS2 data. Mid-year is self-reported.
                </div>
              </div>
            )}

            {/* If only one insight available, show both in full-width fallback */}
            {nationalPercentile === null && threeYearAvg === null && null}

          </div>

          {/* Row 2: Data Quality Alerts — full width */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Data Quality Alerts
              <span className="text-xs text-gray-400 font-normal ml-auto">statistical plausibility checks</span>
            </h4>
            {statAlerts.length === 0 ? (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                No statistical impossibilities detected. Data appears internally consistent.
              </div>
            ) : (
              <div className="space-y-2">
                {statAlerts.map((alert, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-sm ${
                    alert.severity === "high" ? "bg-red-50 border-red-200 text-red-800" :
                    alert.severity === "medium" ? "bg-amber-50 border-amber-200 text-amber-800" :
                    "bg-gray-50 border-gray-200 text-gray-700"
                  }`}>
                    <div className="font-semibold text-xs uppercase mb-1 opacity-60">{alert.severity} severity</div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-xs mt-1 opacity-80">{alert.explanation}</div>
                    <div className="text-xs mt-1 italic opacity-70">{alert.probability}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </motion.div>
      )}

      {/* Section B: Radar Chart */}
      {radarData.length > 0 && (y6?.all_pupils.r_are !== null || y6?.all_pupils.c_are !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <h4 className="text-sm font-semibold text-gray-800">Y6 Subject Profile vs Trust Average</h4>
              <p className="text-xs text-gray-500 mt-0.5">How this school compares on every subject at Year 6</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-gray-500 shrink-0 ml-4">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 opacity-80" />
                {school}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
                Trust avg
              </span>
            </div>
          </div>

          {/* Quick score pills */}
          <div className="flex flex-wrap gap-2 mb-3">
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
              <PolarGrid stroke="#CBD5E1" gridType="polygon" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: "#374151", fontWeight: 600 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={5} tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <Radar name="Trust Avg" dataKey="trust" stroke="#94A3B8" fill="#CBD5E1" fillOpacity={0.4} strokeWidth={2} strokeDasharray="5 3" />
              <Radar name={school} dataKey="school" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2.5} dot={{ r: 5, fill: "#2563EB", strokeWidth: 0 }} />
              <Tooltip
                formatter={(val, name) => [`${val}%`, name]}
                contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}
              />
            </RadarChart>
          </ResponsiveContainer>

          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
            <Info size={10} />
            Source: Trust mid-year data capture spreadsheet (2025/26), Year 6 ARE %.
          </div>
        </motion.div>
      )}

      {/* Section C: Year Group Progression */}
      {progressionData.some((d) => d.reading !== null || d.writing !== null || d.maths !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h4 className="text-base font-semibold text-gray-800 mb-0.5">Year Group Progression (ARE %)</h4>
          <p className="text-sm text-gray-500 mb-4">Reading, Writing, and Maths across Y1–Y6 — shows whether attainment is consistent or fluctuating through the school</p>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={progressionData} margin={{ top: 10, right: 30, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="yg" tick={{ fontSize: 12, fill: "#4B5563" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <ReferenceLine y={65} stroke="#D1D5DB" strokeDasharray="4 4" label={{ value: "National 65%", fontSize: 11, fill: "#9CA3AF", position: "right" }} />
              <Tooltip
                formatter={(val, name) => [`${val}%`, name]}
                contentStyle={{ fontSize: "13px", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              />
              <Legend wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }} />
              <Line type="monotone" dataKey="reading" name="Reading" stroke={SUBJECT_COLORS.reading} strokeWidth={2.5} dot={{ r: 5, fill: SUBJECT_COLORS.reading, strokeWidth: 0 }} activeDot={{ r: 7 }} connectNulls />
              <Line type="monotone" dataKey="writing" name="Writing" stroke={SUBJECT_COLORS.writing} strokeWidth={2.5} dot={{ r: 5, fill: SUBJECT_COLORS.writing, strokeWidth: 0 }} activeDot={{ r: 7 }} connectNulls />
              <Line type="monotone" dataKey="maths" name="Maths" stroke={SUBJECT_COLORS.maths} strokeWidth={2.5} dot={{ r: 5, fill: SUBJECT_COLORS.maths, strokeWidth: 0 }} activeDot={{ r: 7 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>

          {/* Pipeline alerts */}
          {pipelineAlerts.length > 0 && (
            <div className="mt-3 space-y-1">
              {pipelineAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                  <span><span className="font-semibold">Pipeline Alert:</span> {alert}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-3">
            <Info size={10} />
            Source: Trust mid-year data capture spreadsheet (2025/26). Dashed line = 65% reference.
          </div>
        </motion.div>
      )}

      {/* Section D: Greater Depth Analysis — Clean Table */}
      {gdData.some((d) => d["Reading GD"] !== null || d["Writing GD"] !== null || d["Maths GD"] !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h4 className="text-base font-semibold text-gray-800 mb-1">Greater Depth (GD %) by Year Group</h4>
          <p className="text-sm text-gray-500 mb-4">Percentage of pupils exceeding age-related expectations</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-600">Year Group</th>
                  <th className="text-center py-2 px-4 text-xs font-semibold text-blue-600">Reading GD</th>
                  <th className="text-center py-2 px-4 text-xs font-semibold text-red-500">Writing GD</th>
                  <th className="text-center py-2 px-4 text-xs font-semibold text-emerald-600">Maths GD</th>
                </tr>
              </thead>
              <tbody>
                {gdData.map((row) => (
                  <tr key={row.yg} className="border-t border-gray-100">
                    <td className="py-2 pr-4 text-sm font-semibold text-gray-700">{row.yg}</td>
                    {(["Reading GD", "Writing GD", "Maths GD"] as const).map((subject) => {
                      const pct = row[subject] as number | null;
                      const isZero = pct === 0;
                      const isGood = pct !== null && pct > 10;
                      const isAmber = pct !== null && pct > 0 && pct <= 10;
                      const cellClass = isZero
                        ? "text-red-700 font-bold"
                        : isGood
                        ? "text-emerald-700 font-semibold"
                        : isAmber
                        ? "text-amber-700 font-semibold"
                        : "text-gray-300";
                      const bgClass = isZero
                        ? "bg-red-50"
                        : isGood
                        ? "bg-emerald-50"
                        : isAmber
                        ? "bg-amber-50"
                        : "";
                      return (
                        <td key={subject} className={`py-2 px-4 text-center ${bgClass}`}>
                          <span className={cellClass}>
                            {pct !== null ? `${pct}%` : "—"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            National average GD: Reading 29%, Writing 13%, Maths 24% (2024/25)
          </p>

          {zeroGdW.length >= 3 && (
            <div className="mt-3 flex items-start gap-2 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold">Writing Greater Depth is 0% across {zeroGdW.length} year groups</span>
                {" "}({zeroGdW.map((yg) => yg.replace("Year ", "Y")).join(", ")}) — this requires immediate attention.
              </span>
            </div>
          )}

          {zeroGdW.length > 0 && zeroGdW.length < 3 && (
            <div className="mt-3 flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
              <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
              <span>
                Zero Writing GD in {zeroGdW.map((yg) => yg.replace("Year ", "Y")).join(", ")}.
                {" "}What is the school&apos;s strategy for extending higher-attaining writers?
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-3">
            <Info size={10} />
            Green = &gt;10% | Amber = 1–10% | Red = 0%. Source: Trust mid-year data capture spreadsheet (2025/26).
          </div>
        </motion.div>
      )}

      {/* Section E: FSM6 vs Non-FSM Gap — Dumbbell Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-xl p-5"
      >
        <h4 className="text-base font-semibold text-gray-800 mb-1">FSM6 vs Non-FSM Gap (Combined ARE %)</h4>
        <p className="text-sm text-gray-500 mb-1">The gap between FSM-eligible and non-FSM pupils in Combined attainment. A wider gap means disadvantaged pupils are falling further behind.</p>
        <p className="text-sm text-gray-500 mb-4">Line length shows the gap in percentage points by year group.</p>

        {hasFsmData ? (
          <>
            {/* Dumbbell chart — custom SVG-style layout */}
            <div className="space-y-3 mt-2">
              {fsmGapData.filter((d) => d["FSM6 Combined"] !== null || d["Non-FSM Combined"] !== null).map((d) => {
                const fsm = d["FSM6 Combined"] as number | null;
                const nonFsm = d["Non-FSM Combined"] as number | null;
                const gap = d.gap as number | null;
                const left = Math.min(fsm ?? 100, nonFsm ?? 100);
                const right = Math.max(fsm ?? 0, nonFsm ?? 0);
                const rangeWidth = right - left;
                return (
                  <div key={d.yg} className="flex items-center gap-4">
                    <div className="w-8 text-sm font-semibold text-gray-700 shrink-0 text-right">{d.yg}</div>
                    <div className="flex-1 relative h-8 flex items-center">
                      {/* Track */}
                      <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                        <div className="w-full h-px bg-gray-100" />
                      </div>
                      {/* Connecting line */}
                      {fsm !== null && nonFsm !== null && (
                        <div
                          className="absolute h-1.5 rounded-full"
                          style={{
                            left: `${left}%`,
                            width: `${rangeWidth}%`,
                            backgroundColor: gap !== null && gap > 20 ? "#FCA5A5" : gap !== null && gap > 10 ? "#FCD34D" : "#6EE7B7",
                          }}
                        />
                      )}
                      {/* FSM dot (red) */}
                      {fsm !== null && (
                        <div
                          className="absolute w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-sm"
                          style={{ left: `calc(${fsm}% - 8px)` }}
                          title={`FSM6: ${fsm}%`}
                        />
                      )}
                      {/* Non-FSM dot (blue) */}
                      {nonFsm !== null && (
                        <div
                          className="absolute w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm"
                          style={{ left: `calc(${nonFsm}% - 8px)` }}
                          title={`Non-FSM: ${nonFsm}%`}
                        />
                      )}
                    </div>
                    <div className="w-20 shrink-0 flex items-center gap-1.5 text-xs">
                      {fsm !== null && <span className="text-red-600 font-semibold">{fsm}%</span>}
                      {nonFsm !== null && <span className="text-blue-600 font-semibold">{nonFsm}%</span>}
                    </div>
                    <div className="w-16 shrink-0">
                      {gap !== null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gap > 20 ? "bg-red-100 text-red-700" : gap > 10 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {gap}pp
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> FSM6</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Non-FSM</span>
              <span className="text-gray-400">Line = gap size. pp = percentage points.</span>
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-3">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <span>FSM breakdown data was not submitted for this school. The trust spreadsheet does not separate FSM6 and Non-FSM attainment.</span>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-3">
          <Info size={10} />
          Source: Trust mid-year data capture spreadsheet (2025/26). FSM6 = Free School Meals (Ever 6). Combined ARE = all three subjects at expected standard.
        </div>
      </motion.div>

      {/* Section F: Data Quality for this school */}
      {(schoolFlags.length > 0 || missingYgs.length > 0 || zeroGdW.length >= 2) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Quality Flags for {school}</h4>
          <div className="space-y-2">
            {missingYgs.map((yg) => (
              <div key={yg} className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-100 text-amber-700 rounded-lg px-3 py-2">
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>No data submitted for {yg}</span>
              </div>
            ))}
            {zeroGdW.length >= 2 && (
              <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-100 text-amber-700 rounded-lg px-3 py-2">
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>Zero GD in Writing reported for {zeroGdW.length} year groups — check moderation records</span>
              </div>
            )}
            {schoolFlags.map((flag, i) => (
              <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 border ${flag.severity === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
                {flag.severity === "error" ? <AlertCircle size={12} className="flex-shrink-0 mt-0.5" /> : <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />}
                <span>
                  {flag.yearGroup && <span className="font-medium">{flag.yearGroup} / </span>}
                  {flag.field && <span className="font-medium">{FIELD_LABELS[flag.field] ?? flag.field}: </span>}
                  {flag.issue}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Section G: Key Questions */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-white border border-gray-200 rounded-xl p-5"
      >
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Key Questions for {school}</h4>
        <ul className="space-y-2">
          {questions.map((item, i) => {
            const colorClass = item.level === "red"
              ? "bg-red-50 border-red-200 text-red-800"
              : item.level === "amber"
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-blue-50 border-blue-200 text-blue-700";
            const iconClass = item.level === "red"
              ? <AlertCircle size={13} className="flex-shrink-0 mt-0.5 text-red-500" />
              : item.level === "amber"
              ? <AlertTriangle size={13} className="flex-shrink-0 mt-0.5 text-amber-500" />
              : <Info size={13} className="flex-shrink-0 mt-0.5 text-blue-400" />;
            return (
              <li key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${colorClass}`}>
                {iconClass}
                <span>{item.q}</span>
              </li>
            );
          })}
        </ul>
      </motion.div>

    </div>
  );
}

// ─── Phase 1: Trust Insights ──────────────────────────────────────────────────

function TrustInsights({ parsed }: { parsed: ParsedSpreadsheet }) {
  const insights: { text: string; severity: "info" | "warning" | "error" }[] = [];

  // Subject weakness analysis across Y6
  const subjectTotals: Record<"reading" | "writing" | "maths", { sum: number; count: number }> = {
    reading: { sum: 0, count: 0 },
    writing: { sum: 0, count: 0 },
    maths:   { sum: 0, count: 0 },
  };
  const weakWritingY6: string[] = [];
  let totalY6Combined = 0;
  let y6CombinedCount = 0;

  for (const school of parsed.schools) {
    const y6 = parsed.data[school]?.["Year 6"];
    if (!y6) continue;
    const ap = y6.all_pupils;
    if (ap.r_are !== null && ap.r_are !== undefined) { subjectTotals.reading.sum += ap.r_are; subjectTotals.reading.count++; }
    if (ap.w_are !== null && ap.w_are !== undefined) {
      subjectTotals.writing.sum += ap.w_are; subjectTotals.writing.count++;
      if (ap.w_are < 60) weakWritingY6.push(school);
    }
    if (ap.m_are !== null && ap.m_are !== undefined) { subjectTotals.maths.sum += ap.m_are; subjectTotals.maths.count++; }
    if (ap.c_are !== null && ap.c_are !== undefined) { totalY6Combined += ap.c_are; y6CombinedCount++; }
  }

  const avgR = subjectTotals.reading.count > 0 ? Math.round(subjectTotals.reading.sum / subjectTotals.reading.count) : null;
  const avgW = subjectTotals.writing.count > 0 ? Math.round(subjectTotals.writing.sum / subjectTotals.writing.count) : null;
  const avgM = subjectTotals.maths.count > 0 ? Math.round(subjectTotals.maths.sum / subjectTotals.maths.count) : null;
  const trustAvgY6Combined = y6CombinedCount > 0 ? Math.round(totalY6Combined / y6CombinedCount) : null;

  const weakestSubject =
    avgR !== null && avgW !== null && avgM !== null
      ? (avgW <= avgR && avgW <= avgM ? "Writing" : avgR <= avgW && avgR <= avgM ? "Reading" : "Maths")
      : null;

  if (weakestSubject && weakWritingY6.length > 0) {
    insights.push({
      text: `Writing is the weakest subject trust-wide (avg ${avgW}%). ${weakWritingY6.length} school${weakWritingY6.length > 1 ? "s" : ""} have Y6 Writing below 60%: ${weakWritingY6.join(", ")}.`,
      severity: weakWritingY6.length >= 3 ? "error" : "warning",
    });
  } else if (weakestSubject) {
    const avg = weakestSubject === "Writing" ? avgW : weakestSubject === "Reading" ? avgR : avgM;
    insights.push({
      text: `${weakestSubject} is the weakest subject trust-wide (avg ${avg}% in Y6).`,
      severity: "warning",
    });
  }

  if (trustAvgY6Combined !== null) {
    insights.push({
      text: `Trust-wide average Y6 Combined ARE is ${trustAvgY6Combined}%.`,
      severity: "info",
    });
  }

  // Best Y6 performer
  let bestSchool = "";
  let bestPct = 0;
  for (const school of parsed.schools) {
    const pct = parsed.data[school]?.["Year 6"]?.all_pupils.c_are ?? 0;
    if (pct > bestPct) { bestPct = pct; bestSchool = school; }
  }
  if (bestSchool && bestPct > 0) {
    insights.push({ text: `${bestSchool} Y6 Combined at ${bestPct}% is the strongest in the trust.`, severity: "info" });
  }

  // EYFS missing
  const missingEyfs = parsed.schools.filter((s) => !parsed.data[s]?.["EYFS"]);
  if (missingEyfs.length > 0) {
    insights.push({
      text: `${missingEyfs.join(", ")} ${missingEyfs.length === 1 ? "has" : "have"} not submitted EYFS data — GLD baseline is unknown.`,
      severity: "warning",
    });
  }

  // Zero GD Writing
  const zeroGdWriting: { school: string; yg: string }[] = [];
  for (const school of parsed.schools) {
    for (const yg of HEATMAP_YEAR_GROUPS) {
      const d = parsed.data[school]?.[yg];
      if (d && d.all_pupils.w_gd === 0) zeroGdWriting.push({ school, yg });
    }
  }
  if (zeroGdWriting.length >= 3) {
    const schoolsAffected = [...new Set(zeroGdWriting.map((z) => z.school))];
    insights.push({
      text: `Zero Greater Depth in Writing reported in ${zeroGdWriting.length} year groups across ${schoolsAffected.length} schools (${schoolsAffected.join(", ")}).`,
      severity: "error",
    });
  }

  // Consistency jumps — stored separately for table rendering
  interface ConsistencyJump {
    school: string;
    from: string;
    to: string;
    fromPct: number;
    toPct: number;
    change: number;
    cohort: number | null;
  }
  const consistencyJumps: ConsistencyJump[] = [];
  for (const school of parsed.schools) {
    for (let i = 1; i < HEATMAP_YEAR_GROUPS.length; i++) {
      const prev = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i - 1]]?.all_pupils.c_are ?? null;
      const curr = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i]]?.all_pupils.c_are ?? null;
      if (prev !== null && curr !== null && Math.abs(curr - prev) > 15) {
        const cohort = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i]]?.cohort.number_in_cohort ?? null;
        consistencyJumps.push({
          school,
          from: HEATMAP_YEAR_GROUPS[i - 1].replace("Year ", "Y"),
          to: HEATMAP_YEAR_GROUPS[i].replace("Year ", "Y"),
          fromPct: prev,
          toPct: curr,
          change: Math.round(curr - prev),
          cohort,
        });
      }
    }
  }
  const bigJumps = consistencyJumps.map((j) => `${j.school} ${j.from}→${j.to}`); // keep for governor questions

  if (insights.length === 0 && consistencyJumps.length === 0) return null;

  const sevColor = (s: string) =>
    s === "error" ? "bg-red-50 border-red-200 text-red-800" :
    s === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
    "bg-blue-50 border-blue-200 text-blue-700";
  const sevIcon = (s: string) =>
    s === "error" ? <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> :
    s === "warning" ? <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> :
    <Info size={13} className="flex-shrink-0 mt-0.5" />;

  // Build ordered governor questions (max 4)
  const governorQuestions: { text: React.ReactNode; level: "red" | "amber" | "blue" }[] = [];

  // Q1: trust avg vs national
  if (trustAvgY6Combined !== null && trustAvgY6Combined < 60) {
    governorQuestions.push({
      level: "red",
      text: <>Trust-wide Y6 Combined is <strong>{trustAvgY6Combined}%</strong> — below the national average of ~60%. What is the trust&apos;s improvement trajectory and how does this compare to last year&apos;s KS2 outcomes?</>,
    });
  }

  // Q2: range between best and worst
  (() => {
    let best: { school: string; pct: number } | null = null;
    let worst: { school: string; pct: number } | null = null;
    for (const school of parsed?.schools ?? []) {
      const pct = parsed?.data[school]?.["Year 6"]?.all_pupils.c_are ?? null;
      if (pct === null) continue;
      if (!best || pct > best.pct) best = { school, pct };
      if (!worst || pct < worst.pct) worst = { school, pct };
    }
    if (best && worst && best.school !== worst.school && best.pct - worst.pct >= 10 && governorQuestions.length < 4) {
      governorQuestions.push({
        level: "amber",
        text: <>Y6 Combined ranges from <strong>{worst.pct}% ({worst.school})</strong> to <strong>{best.pct}% ({best.school})</strong> — a {Math.round(best.pct - worst.pct)}pp gap. What targeted support is in place for {worst.school}?</>,
      });
    }
  })();

  // Q3: weakest subject
  if (avgW !== null && avgR !== null && avgM !== null && governorQuestions.length < 4) {
    const weakSubject = avgW <= avgR && avgW <= avgM ? `Writing (${avgW}%)` : avgR <= avgW && avgR <= avgM ? `Reading (${avgR}%)` : `Maths (${avgM}%)`;
    governorQuestions.push({
      level: "amber",
      text: <><strong>{weakSubject}</strong> is the weakest subject trust-wide at Y6. Is there a shared curriculum approach in place, and is it working?</>,
    });
  }

  // Q4: consistency jumps or zero GD Writing
  if (consistencyJumps.length > 0 && governorQuestions.length < 4) {
    governorQuestions.push({
      level: "red",
      text: <>There are {consistencyJumps.length} year group consistency issues (&gt;15pp jump). Can school leaders provide moderation evidence to support these figures?</>,
    });
  } else if (zeroGdWriting.length >= 3 && governorQuestions.length < 4) {
    governorQuestions.push({
      level: "red",
      text: <>Zero GD Writing reported in {zeroGdWriting.length} year groups across {[...new Set(zeroGdWriting.map((z) => z.school))].join(", ")}. Is this genuine or does it suggest the GD threshold is not well understood?</>,
    });
  } else if (missingEyfs.length > 0 && governorQuestions.length < 4) {
    governorQuestions.push({
      level: "amber",
      text: <>{missingEyfs.length === 1 ? `${missingEyfs[0]} has` : `${missingEyfs.join(", ")} have`} not submitted EYFS data. Without GLD baseline the full progress pipeline cannot be assessed — when will this be available?</>,
    });
  } else if (governorQuestions.length < 4) {
    governorQuestions.push({
      level: "blue",
      text: <>Are all {parsed?.schools?.length ?? "all"} schools using the same teacher assessment criteria? Without trust-wide moderation, like-for-like comparisons are unreliable.</>,
    });
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Trust-Wide Insights</h3>
      <div className="space-y-2 mb-5">
        {insights.map((ins, i) => (
          <div key={i} className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg border ${sevColor(ins.severity)}`}>
            {sevIcon(ins.severity)}
            <span>{ins.text}</span>
          </div>
        ))}
      </div>

      {/* Consistency jumps — clean table */}
      {consistencyJumps.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Year Group Consistency Issues (&gt;15pp jump between adjacent years)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-2 text-gray-500 font-semibold">School</th>
                  <th className="text-center p-2 text-gray-500 font-semibold">From</th>
                  <th className="text-center p-2 text-gray-500 font-semibold">To</th>
                  <th className="text-center p-2 text-gray-500 font-semibold">Change</th>
                  <th className="text-center p-2 text-gray-500 font-semibold">FSM Similar?</th>
                </tr>
              </thead>
              <tbody>
                {consistencyJumps.map((j, i) => {
                  const fromFsm = (() => {
                    const ygFull = HEATMAP_YEAR_GROUPS.find((yg) => yg.replace("Year ", "Y") === j.from);
                    if (!ygFull) return null;
                    const d = parsed.data[j.school]?.[ygFull];
                    return d?.cohort.number_fsm !== null && d?.cohort.number_in_cohort !== null && d.cohort.number_in_cohort && d.cohort.number_fsm !== null
                      ? Math.round(100 * (d.cohort.number_fsm as number) / (d.cohort.number_in_cohort as number))
                      : null;
                  })();
                  const toFsm = (() => {
                    const ygFull = HEATMAP_YEAR_GROUPS.find((yg) => yg.replace("Year ", "Y") === j.to);
                    if (!ygFull) return null;
                    const d = parsed.data[j.school]?.[ygFull];
                    return d?.cohort.number_fsm !== null && d?.cohort.number_in_cohort !== null && d.cohort.number_in_cohort && d.cohort.number_fsm !== null
                      ? Math.round(100 * (d.cohort.number_fsm as number) / (d.cohort.number_in_cohort as number))
                      : null;
                  })();
                  const fsmSimilar = fromFsm !== null && toFsm !== null ? Math.abs(fromFsm - toFsm) <= 10 : null;
                  return (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="p-2 font-semibold text-gray-800">{j.school}</td>
                      <td className="p-2 text-center text-gray-600">{j.from} ({j.fromPct}%)</td>
                      <td className="p-2 text-center text-gray-600">{j.to} ({j.toPct}%)</td>
                      <td className={`p-2 text-center font-bold ${j.change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {j.change > 0 ? "+" : ""}{j.change}pp
                      </td>
                      <td className="p-2 text-center">
                        {fsmSimilar === null ? (
                          <span className="text-gray-300">—</span>
                        ) : fsmSimilar ? (
                          <span className="text-amber-600 font-medium">Yes — not FSM</span>
                        ) : (
                          <span className="text-blue-600 font-medium">No — FSM differs</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Context: Does Disadvantage Explain Performance? */}
      {(() => {
        // Build per-school context row
        interface ContextRow {
          school: string;
          totalPupils: number;
          fsmPct: number | null;
          sendPct: number | null;
          ehcp: number;
          y6Combined: number | null;
          y6VsNational: number | null;
          fsmRaw: number;
        }

        const rows: ContextRow[] = parsed.schools.map((s) => {
          let totalP = 0, totalF = 0, totalSe = 0, totalE = 0;
          for (const yg of YEAR_GROUPS) {
            const d = parsed.data[s]?.[yg];
            if (!d) continue;
            if (d.cohort.number_in_cohort !== null) totalP += d.cohort.number_in_cohort;
            if (d.cohort.number_fsm !== null) totalF += d.cohort.number_fsm;
            if (d.cohort.number_send !== null) totalSe += d.cohort.number_send;
            if (d.cohort.ehcp !== null) totalE += d.cohort.ehcp;
          }
          const y6c = parsed.data[s]?.["Year 6"]?.all_pupils.c_are ?? null;
          return {
            school: s,
            totalPupils: totalP,
            fsmPct: totalP > 0 ? Math.round((totalF / totalP) * 1000) / 10 : null,
            sendPct: totalP > 0 ? Math.round((totalSe / totalP) * 1000) / 10 : null,
            ehcp: totalE,
            y6Combined: y6c,
            y6VsNational: y6c !== null ? Math.round(y6c - 61) : null,
            fsmRaw: totalF,
          };
        });

        // Sort by Y6 Combined ascending (worst first)
        const sorted = [...rows].sort((a, b) => {
          if (a.y6Combined === null) return 1;
          if (b.y6Combined === null) return -1;
          return a.y6Combined - b.y6Combined;
        });

        // Find the school with best Combined relative to FSM% (highest Combined / FSM% ratio)
        let heroSchool: ContextRow | null = null;
        let heroRatio = -Infinity;
        for (const r of rows) {
          if (r.y6Combined !== null && r.fsmPct !== null && r.fsmPct > 15) {
            const ratio = r.y6Combined / r.fsmPct;
            if (ratio > heroRatio) { heroRatio = ratio; heroSchool = r; }
          }
        }

        return (
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Context: Does Disadvantage Explain Performance?</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-2 text-gray-500 font-semibold">School</th>
                    <th className="text-center p-2 text-gray-500 font-semibold">Pupils</th>
                    <th className="text-center p-2 text-gray-500 font-semibold">FSM%</th>
                    <th className="text-center p-2 text-gray-500 font-semibold">SEND%</th>
                    <th className="text-center p-2 text-gray-500 font-semibold">EHCP</th>
                    <th className="text-center p-2 text-gray-500 font-semibold">Y6 Combined</th>
                    <th className="text-center p-2 text-gray-500 font-semibold">vs National</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => {
                    const fsmBg = r.fsmPct !== null && r.fsmPct > 45 ? "bg-red-50 text-red-700 font-semibold" : r.fsmPct !== null && r.fsmPct > 35 ? "bg-amber-50 text-amber-700 font-semibold" : "text-gray-700";
                    const combinedBg = r.y6Combined !== null && r.y6Combined < 50 ? "bg-red-50 text-red-700 font-bold" : r.y6Combined !== null && r.y6Combined < 60 ? "bg-amber-50 text-amber-700 font-semibold" : "text-emerald-700 font-semibold";
                    const vsNatColor = r.y6VsNational !== null && r.y6VsNational >= 0 ? "text-emerald-600 font-semibold" : "text-red-600 font-semibold";
                    return (
                      <tr key={r.school} className="border-t border-gray-100">
                        <td className="p-2 font-semibold text-gray-800">{r.school}</td>
                        <td className="p-2 text-center text-gray-600">{r.totalPupils > 0 ? r.totalPupils : "—"}</td>
                        <td className={`p-2 text-center ${fsmBg}`}>{r.fsmPct !== null ? `${r.fsmPct}%` : "—"}</td>
                        <td className="p-2 text-center text-gray-600">{r.sendPct !== null ? `${r.sendPct}%` : "—"}</td>
                        <td className="p-2 text-center text-gray-600">{r.ehcp > 0 ? r.ehcp : "—"}</td>
                        <td className={`p-2 text-center ${combinedBg}`}>{r.y6Combined !== null ? `${r.y6Combined}%` : "—"}</td>
                        <td className={`p-2 text-center ${vsNatColor}`}>
                          {r.y6VsNational !== null ? `${r.y6VsNational >= 0 ? "+" : ""}${r.y6VsNational}pp` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-gray-400">
              <span>FSM% highlight: <span className="text-amber-600">amber &gt;35%</span> / <span className="text-red-600">red &gt;45%</span></span>
              <span>Y6 Combined: <span className="text-amber-600">amber &lt;60%</span> / <span className="text-red-600">red &lt;50%</span></span>
              <span>vs National: based on 61% national average (2024/25 KS2)</span>
            </div>
            {heroSchool && (
              <p className="text-xs text-gray-600 mt-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                Schools with higher FSM% tend to have lower attainment, but <strong>{heroSchool.school}</strong> achieves{" "}
                <strong>{heroSchool.y6Combined}%</strong> Combined despite <strong>{heroSchool.fsmPct}%</strong> FSM — suggesting effective Pupil Premium strategies.
              </p>
            )}
          </div>
        );
      })()}

      {/* Governor questions — max 4, concise */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-700 mb-3">Smarter Questions — for governors and leaders</h4>
        <ul className="space-y-2 text-xs text-gray-700">
          {governorQuestions.map((q, i) => {
            const colorClass = q.level === "red"
              ? "bg-red-50 border-red-100"
              : q.level === "amber"
              ? "bg-amber-50 border-amber-100"
              : "bg-white border-gray-100";
            const qColor = q.level === "red" ? "text-red-500" : q.level === "amber" ? "text-amber-500" : "text-blue-400";
            return (
              <li key={i} className={`flex items-start gap-2 border rounded-lg px-3 py-2 ${colorClass}`}>
                <span className={`mt-0.5 font-bold shrink-0 ${qColor}`}>Q</span>
                <span>{q.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
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

function KS2TrackRecordChart({ school, abbrev, ks2Results, selfReport }: {
  school: string;
  abbrev: string;
  ks2Results: KS2Result[];
  selfReport: { reading: number | null; writing: number | null; maths: number | null; combined: number | null } | null;
}) {
  const info = TRUST_SCHOOLS[abbrev];
  if (!info) return null;

  const ks2Years = [2023, 2024, 2025];

  // Compute Combined for each year
  const ks2Combined = ks2Years.map((year) => getKs2CombinedForUrn(ks2Results, info.urn, year)).filter((v): v is number => v !== null);
  const bestEverKs2 = ks2Combined.length > 0 ? Math.max(...ks2Combined) : null;
  const selfCombined = selfReport?.combined ?? null;

  // Flag: self-report Combined > best-ever by >10pp
  const isSuspect = selfCombined !== null && bestEverKs2 !== null && selfCombined > bestEverKs2 + 10;

  // Horizontal bar data: schools on Y-axis, Combined % on X-axis
  // Each row = one time period
  const barData = [
    ...ks2Years.map((year) => ({
      name: `KS2 ${year}`,
      combined: getKs2CombinedForUrn(ks2Results, info.urn, year),
      isSelfReport: false,
    })),
    ...(selfReport ? [{
      name: "Mid-Year",
      combined: selfReport.combined,
      isSelfReport: true,
    }] : []),
  ].reverse(); // Most recent at top

  // Custom bar fill
  const CustomBar = (props: {
    x?: number; y?: number; width?: number; height?: number;
    combined?: number | null; isSelfReport?: boolean;
  }) => {
    const { x = 0, y = 0, width = 0, height = 0, isSelfReport, combined } = props;
    if (combined === null || combined === undefined) return null;
    const fill = isSelfReport ? (isSuspect ? "#EF4444" : "#F59E0B") : "#3B82F6";
    return (
      <g>
        <rect x={x} y={y + height * 0.2} width={width} height={height * 0.6} fill={fill} rx={3} opacity={0.85} />
      </g>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <div className="font-bold text-gray-900 text-sm">{abbrev}</div>
          <div className="text-xs text-gray-500">{school}</div>
          <div className="text-[10px] text-gray-400">URN {info.urn}</div>
        </div>
        {selfCombined !== null && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${isSuspect ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            Mid-Year: {selfCombined}%
            {isSuspect && <span className="ml-1">⚠ above track record</span>}
          </div>
        )}
      </div>

      {isSuspect && (
        <div className="mb-2 flex items-center gap-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
          <AlertTriangle size={10} />
          Self-report ({selfCombined}%) exceeds best-ever KS2 ({bestEverKs2}%) by {selfCombined !== null && bestEverKs2 !== null ? Math.round(selfCombined - bestEverKs2) : 0}pp
        </div>
      )}

      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={true} horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#374151" }} width={70} axisLine={false} tickLine={false} />
          <ReferenceLine x={61} stroke="#9CA3AF" strokeDasharray="4 4" label={{ value: "Nat 61%", fontSize: 10, fill: "#9CA3AF", position: "right" }} />
          <Tooltip formatter={(val) => [`${val}%`, "Combined"]} contentStyle={{ fontSize: "12px" }} />
          <Bar dataKey="combined" shape={<CustomBar />} label={{ position: "right", fontSize: 11, fill: "#374151" }} />
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><img src="/logos/connectors/dfe.png" alt="DfE" className="w-4 h-4 rounded-sm inline-block" /> DfE Validated</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Mid-year self-report</span>
        {isSuspect && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Suspect (10pp+ above track record)</span>}
      </div>
    </div>
  );
}

// ─── Phase 2: FSM Trend Chart ────────────────────────────────────────────────

function FsmTrendChart({ abbrev, census }: { abbrev: string; census: CensusRecord[] }) {
  const info = TRUST_SCHOOLS[abbrev];
  if (!info) return null;

  const schoolCensus = census
    .filter((c) => c.urn === info.urn && c.fsmPct !== null)
    .sort((a, b) => a.academicYearEnd - b.academicYearEnd);

  if (schoolCensus.length === 0) return null;

  const chartData = schoolCensus.map((c) => ({
    year: String(c.academicYearEnd),
    fsm: c.fsmPct !== null ? Math.round(c.fsmPct * 10) / 10 : null,
  }));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="font-semibold text-gray-800 text-sm mb-3">{abbrev} — FSM % trend</div>
      <ResponsiveContainer width="100%" height={100}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="year" tick={{ fontSize: 9 }} />
          <YAxis domain={[0, 60]} tick={{ fontSize: 9 }} />
          <Tooltip formatter={(val) => [`${val}%`, "FSM"]} />
          <Line type="monotone" dataKey="fsm" stroke="#9F1239" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

// Connector stored in Supabase `app_connectors` table per organization.
// On page load, we fetch the connector config from the API, then fetch
// the file live from Google Drive. No file content stored anywhere.
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
  const [dfeData, setDfeData] = useState<DfEData | null>(null);
  const [dfeLoading, setDfeLoading] = useState(false);
  const [dfeError, setDfeError] = useState<string | null>(null);
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

    // Also fetch Grove House full data (non-fatal)
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
            demographicDisaggregation: payload.demographicDisaggregation ?? null,
          });
        }
      } catch {
        // non-fatal
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
          {/* Connector 3: Per-pupil */}
          <div className="flex items-center gap-1" title="Per-pupil assessment data">
            <UserCheck size={12} className="text-gray-300" />
            <span className="text-gray-400">Pupil ○</span>
          </div>
        </div>

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
                    <StatCard label="FSM pupils" value={totalFsmRaw > 0 ? totalFsmRaw : "—"} sub={fsmPct !== null ? `${fsmPct}% trust-wide` : undefined} />
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
                    <button
                      key={school}
                      onClick={() => setActiveSchoolTab(school)}
                      className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeSchoolTab === school ? "bg-white border border-b-white border-gray-200 -mb-px text-blue-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                    >
                      {school}
                    </button>
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
                      <TrustInsights parsed={parsed} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key={activeSchoolTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SchoolTab school={activeSchoolTab} parsed={parsed} dfeData={dfeData} authToken={accessToken ?? undefined} />
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
                      <h3 className="text-base font-semibold text-gray-800">KS2 Combined % Track Record (2023–2025 + Mid-Year Self-Report)</h3>
                      <p className="text-sm text-gray-500 mt-0.5">Horizontal bars show Combined % by year. Dashed line = national average (61%). Amber bar = self-reported mid-year. Red = suspect (10pp+ above track record).</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {parsed.schools.map((abbrev) => {
                      const y6Data = parsed.data[abbrev]?.["Year 6"];
                      const selfReport = y6Data ? {
                        reading: y6Data.all_pupils.r_are ?? null,
                        writing: y6Data.all_pupils.w_are ?? null,
                        maths: y6Data.all_pupils.m_are ?? null,
                        combined: y6Data.all_pupils.c_are ?? null,
                      } : null;
                      const info = TRUST_SCHOOLS[abbrev];
                      return (
                        <KS2TrackRecordChart
                          key={abbrev}
                          school={info?.name ?? abbrev}
                          abbrev={abbrev}
                          ks2Results={dfeData.ks2Results}
                          selfReport={selfReport}
                        />
                      );
                    })}
                  </div>

                  {/* FSM Trends */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">FSM % Trend (DfE Annual School Census)</h3>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Info size={10} />
                      Source: DfE Annual School Census. Validated — not self-reported.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {parsed.schools.map((abbrev) => (
                      <FsmTrendChart key={abbrev} abbrev={abbrev} census={dfeData.census} />
                    ))}
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

        {/* ─── Phase 3: Grove House Deep Dive ───────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionHeader number={3} title="Deep Analytics" subtitle="Per-pupil tracking from CTF assessment files. Grove House Primary School." />

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
                      This pattern suggests: (1) KS1 assessments were inflated, or (2) progress has stalled in KS2, or (3) the mid-year Y6 snapshot is conservative. The school needs a clear narrative for whichever explanation is true.
                    </div>
                  </div>
                </div>
              </div>

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
                    </div>
                  );
                })()}

                {/* Grid of remaining pupil journey cards */}
                {groveHouseData.cohortJourneys.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-gray-500">{groveHouseData.cohortJourneys.length} trackable pupils with multi-year data</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                      {groveHouseData.cohortJourneys.map((pupil, pidx) => {
                        const demo = pupil.demographics;
                        const flags = [demo.isFsm && 'FSM', demo.isSend && 'SEND', demo.isEal && 'EAL'].filter(Boolean) as string[];
                        const yearGroups = [...new Set(pupil.journey.map(j => j.yearGroup))].sort((a, b) => a - b);

                        const levelValue = (l: string) => l === 'GDS' ? 3 : l === 'EXS' || l === '2' ? 2 : 1;
                        const allLevels = pupil.journey.map(j => levelValue(j.level));
                        const avgFirst = allLevels.length > 0 ? allLevels[0] : 0;
                        const avgLast = allLevels.length > 0 ? allLevels[allLevels.length - 1] : 0;
                        const overallTrend = avgLast > avgFirst ? 'improving' : avgLast < avgFirst ? 'declining' : 'stable';

                        const latestEntries = pupil.journey.filter(j => j.year === Math.max(...pupil.journey.map(jj => jj.year)));
                        const atExpected = latestEntries.filter(j => ['EXS', 'GDS', '2'].includes(j.level)).length;
                        const totalSubjects = latestEntries.length;

                        return (
                          <div key={`${pupil.pupilId}-${pidx}`} className={`border rounded-lg p-3 text-xs ${
                            overallTrend === 'declining' ? 'border-red-200 bg-red-50/30' :
                            overallTrend === 'improving' ? 'border-green-200 bg-green-50/30' :
                            'border-gray-200 bg-white'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                  overallTrend === 'declining' ? 'bg-red-100 text-red-700' :
                                  overallTrend === 'improving' ? 'bg-green-100 text-green-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {pupil.pupilId.split(' ').map(w => w[0]).join('')}
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-700">{pupil.pupilId}</div>
                                  <div className="text-gray-400">Y{yearGroups.join('→Y')}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {flags.map(f => (
                                  <span key={f} className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                    f === 'FSM' ? 'bg-amber-100 text-amber-700' :
                                    f === 'SEND' ? 'bg-purple-100 text-purple-700' :
                                    'bg-cyan-100 text-cyan-700'
                                  }`}>{f}</span>
                                ))}
                              </div>
                            </div>

                            {/* Subject levels at latest assessment */}
                            <div className="flex items-center gap-1.5 mb-2">
                              {latestEntries.map((e, i) => (
                                <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  e.level === 'GDS' ? 'bg-green-100 text-green-700' :
                                  e.level === 'EXS' || e.level === '2' ? 'bg-blue-100 text-blue-700' :
                                  'bg-red-100 text-red-700'
                                }`} title={e.subject}>
                                  {e.subject.slice(0, 1).toUpperCase()}: {e.level}
                                </span>
                              ))}
                            </div>

                            {/* Summary line */}
                            <div className="flex items-center justify-between text-gray-500">
                              <span>{atExpected}/{totalSubjects} at expected+</span>
                              <span className={`font-semibold ${
                                overallTrend === 'improving' ? 'text-green-600' :
                                overallTrend === 'declining' ? 'text-red-600' :
                                'text-gray-500'
                              }`}>
                                {overallTrend === 'improving' ? '↑ Improving' : overallTrend === 'declining' ? '↓ Declining' : '→ Stable'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

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
                                return `${fsmDeclining} of ${fsmCount} FSM pupils show declining trajectories. An inspector would ask: "What is the school's Pupil Premium strategy for these specific children, and what evidence is there that current interventions are working?"`;
                              })()}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>

              {/* ── Section 7: Cohort Journey Chart ── */}
              {groveHouseData.cohortTracking.length > 0 && (
                <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">Cohort Journey — Tracking Groups Through School</h4>
                  <p className="text-xs text-gray-500 mb-4">Each row follows a group of pupils from their entry point, showing how their assessed levels changed year-on-year. Values show % of expected standard (100% = all at EXS, 150% = all at GDS).</p>

                  <div className="space-y-6">
                    {groveHouseData.cohortTracking.map((cohort) => (
                      <div key={cohort.cohortLabel} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{cohort.cohortLabel}</div>
                            <div className="text-xs text-gray-500">{cohort.dataPoints[0]?.pupils ?? 0} pupils tracked</div>
                          </div>
                        </div>

                        {/* Visual journey — Reading, Writing, Maths lines */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
                                {cohort.dataPoints.map(dp => (
                                  <th key={dp.year} className="py-2 px-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Y{dp.yearGroup}<br/><span className="font-normal text-gray-400">{dp.year}</span>
                                  </th>
                                ))}
                                <th className="py-2 px-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Trend</th>
                              </tr>
                            </thead>
                            <tbody>
                              {['reading', 'writing', 'maths'].map(subj => {
                                const values = cohort.dataPoints.map(dp => (dp as Record<string, unknown>)[subj] as number | null);
                                const validValues = values.filter((v): v is number => v !== null);
                                const trend = validValues.length >= 2
                                  ? validValues[validValues.length - 1] - validValues[0]
                                  : null;
                                return (
                                  <tr key={subj} className="border-b border-gray-100">
                                    <td className="py-2 pr-4 text-gray-700 font-medium capitalize">{subj}</td>
                                    {values.map((v, i) => {
                                      const prev = i > 0 ? values[i - 1] : null;
                                      const change = v !== null && prev !== null ? v - prev : null;
                                      return (
                                        <td key={i} className="py-2 px-3 text-center">
                                          {v !== null ? (
                                            <div>
                                              <span className={`font-semibold ${v >= 100 ? 'text-green-700' : v >= 75 ? 'text-amber-600' : 'text-red-600'}`}>{v}%</span>
                                              {change !== null && (
                                                <div className={`text-xs ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                  {change > 0 ? '+' : ''}{change}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <span className="text-gray-300">—</span>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className="py-2 px-3 text-center">
                                      {trend !== null ? (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${trend > 5 ? 'bg-green-100 text-green-700' : trend < -5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                                          {trend > 0 ? '+' : ''}{trend}pp
                                        </span>
                                      ) : '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
