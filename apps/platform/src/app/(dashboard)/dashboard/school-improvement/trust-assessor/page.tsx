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
} from "lucide-react";
import { DriveFilePicker } from "@/components/canvas/DriveFilePicker";
import { useAuth } from "@/context/SupabaseAuthContext";
import { useGoogleDriveAccess } from "@/hooks/useGoogleDriveAccess";
import type { KS2Result, CensusRecord } from "@/lib/trust-analysis/types";

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
    (r) => r.urn === urn && r.academicYearEnd === year && r.subject === "KS2" && r.breakdownTopic === "All pupils" && r.breakdown === "All pupils"
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
                  <div className="text-xs font-semibold text-gray-600 mb-2">Combined ARE % by Year Group</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="yg" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(val) => [`${val}%`, ""]} />
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

function SchoolTab({ school, parsed }: { school: string; parsed: ParsedSpreadsheet }) {
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

  return (
    <div className="space-y-8">

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
          <h4 className="text-sm font-semibold text-gray-700 mb-0.5">Year Group Progression (ARE %)</h4>
          <p className="text-xs text-gray-400 mb-4">Reading, Writing, and Maths across Y1–Y6 — shows whether attainment is consistent or fluctuating through the school</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={progressionData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradR-${school}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#3B82F6" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`gradW-${school}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#EF4444" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`gradM-${school}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                  <stop offset="60%" stopColor="#10B981" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="yg" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <ReferenceLine y={65} stroke="#D1D5DB" strokeDasharray="4 4" label={{ value: "65%", fontSize: 9, fill: "#9CA3AF", position: "right" }} />
              <Tooltip
                formatter={(val, name) => [`${val}%`, name]}
                contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Area type="monotone" dataKey="reading" name="Reading" stroke={SUBJECT_COLORS.reading} fill={`url(#gradR-${school})`} strokeWidth={2.5} dot={{ r: 4, fill: SUBJECT_COLORS.reading, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
              <Area type="monotone" dataKey="writing" name="Writing" stroke={SUBJECT_COLORS.writing} fill={`url(#gradW-${school})`} strokeWidth={2.5} dot={{ r: 4, fill: SUBJECT_COLORS.writing, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
              <Area type="monotone" dataKey="maths" name="Maths" stroke={SUBJECT_COLORS.maths} fill={`url(#gradM-${school})`} strokeWidth={2.5} dot={{ r: 4, fill: SUBJECT_COLORS.maths, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
            </AreaChart>
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

      {/* Section D: Greater Depth Analysis */}
      {gdData.some((d) => d["Reading GD"] !== null || d["Writing GD"] !== null || d["Maths GD"] !== null) && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="bg-white border border-gray-200 rounded-xl p-5"
        >
          <h4 className="text-sm font-semibold text-gray-700 mb-1">Greater Depth (GD %) by Year Group</h4>
          <p className="text-xs text-gray-400 mb-4">Percentage of pupils exceeding age-related expectations</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gdData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="yg" tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(val) => [`${val}%`, ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Reading GD" fill={SUBJECT_COLORS.reading} radius={[0, 3, 3, 0]} />
              <Bar dataKey="Writing GD" fill={SUBJECT_COLORS.writing} radius={[0, 3, 3, 0]} />
              <Bar dataKey="Maths GD" fill={SUBJECT_COLORS.maths} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {zeroGdW.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
              <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
              <span>
                <span className="font-semibold">{zeroGdW.length} of {HEATMAP_YEAR_GROUPS.length} year groups report zero Greater Depth in Writing</span>
                {" "}({zeroGdW.map((yg) => yg.replace("Year ", "Y")).join(", ")}).
                {" "}What is the school&apos;s strategy for extending higher-attaining pupils?
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-3">
            <Info size={10} />
            Source: Trust mid-year data capture spreadsheet (2025/26). GD = Greater Depth (% exceeding age-related expectations).
          </div>
        </motion.div>
      )}

      {/* Section E: FSM6 vs Non-FSM Gap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-xl p-5"
      >
        <h4 className="text-sm font-semibold text-gray-700 mb-1">FSM6 vs Non-FSM Gap (Combined ARE %)</h4>
        <p className="text-xs text-gray-400 mb-4">Pupil Premium gap by year group</p>

        {hasFsmData ? (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={fsmGapData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="yg" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(val) => [`${val}%`, ""]} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="FSM6 Combined" fill="#FB7185" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Non-FSM Combined" fill="#34D399" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap gap-2">
              {fsmGapData.filter((d) => d.gap !== null).map((d) => (
                <span
                  key={d.yg}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${(d.gap as number) > 20 ? "bg-red-100 text-red-700" : (d.gap as number) > 10 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {d.yg}: {d.gap}pp gap
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-3">
            <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" />
            <span>No FSM breakdown submitted for this school. Unable to calculate Pupil Premium gap.</span>
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

  // Implausible pipeline jumps
  const bigJumps: string[] = [];
  for (const school of parsed.schools) {
    for (let i = 1; i < HEATMAP_YEAR_GROUPS.length; i++) {
      const prev = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i - 1]]?.all_pupils.c_are ?? null;
      const curr = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i]]?.all_pupils.c_are ?? null;
      if (prev !== null && curr !== null && Math.abs(curr - prev) > 15) {
        const cohort = parsed.data[school]?.[HEATMAP_YEAR_GROUPS[i]]?.cohort.number_in_cohort ?? null;
        const ppPerPupil = cohort && cohort > 0 ? Math.round(100 / cohort) : null;
        bigJumps.push(
          `${school} ${HEATMAP_YEAR_GROUPS[i - 1].replace("Year ", "Y")}→${HEATMAP_YEAR_GROUPS[i].replace("Year ", "Y")}: ${prev}%→${curr}%` +
          (ppPerPupil ? ` (cohort ${cohort} — each pupil ≈${ppPerPupil}pp)` : "")
        );
      }
    }
  }
  if (bigJumps.length > 0) {
    insights.push({
      text: `Implausible pipeline jumps (>15pp between adjacent year groups): ${bigJumps.join("; ")}.`,
      severity: "warning",
    });
  }

  if (insights.length === 0) return null;

  const sevColor = (s: string) =>
    s === "error" ? "bg-red-50 border-red-200 text-red-800" :
    s === "warning" ? "bg-amber-50 border-amber-200 text-amber-800" :
    "bg-blue-50 border-blue-200 text-blue-700";
  const sevIcon = (s: string) =>
    s === "error" ? <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /> :
    s === "warning" ? <AlertTriangle size={13} className="flex-shrink-0 mt-0.5" /> :
    <Info size={13} className="flex-shrink-0 mt-0.5" />;

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

      {/* Questions box */}
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-700 mb-3">Governor Questions — drawn from this data</h4>
        <ul className="space-y-2 text-xs text-gray-700">
          {/* Always-on governance questions */}
          <li className="flex items-start gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2">
            <span className="text-blue-400 mt-0.5 font-bold shrink-0">Q</span>
            <span>Are all {parsed?.schools?.length ?? "all"} schools using the same teacher assessment criteria and moderation process? Without trust-wide moderation, like-for-like comparisons are unreliable.</span>
          </li>

          {/* Data-driven: large gap between strongest and weakest Y6 */}
          {(() => {
            let best: { school: string; pct: number } | null = null;
            let worst: { school: string; pct: number } | null = null;
            for (const school of parsed?.schools ?? []) {
              const pct = parsed?.data[school]?.["Year 6"]?.all_pupils.c_are ?? null;
              if (pct === null) continue;
              if (!best || pct > best.pct) best = { school, pct };
              if (!worst || pct < worst.pct) worst = { school, pct };
            }
            if (best && worst && best.school !== worst.school && best.pct - worst.pct >= 10) {
              return (
                <li className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <span className="text-amber-500 mt-0.5 font-bold shrink-0">Q</span>
                  <span>Y6 Combined ranges from <strong>{worst.pct}% ({worst.school})</strong> to <strong>{best.pct}% ({best.school})</strong> — a {Math.round(best.pct - worst.pct)}pp gap. What targeted support is in place for {worst.school} and what can be learned from {best.school}?</span>
                </li>
              );
            }
            return null;
          })()}

          {/* Data-driven: weakest subject trust-wide */}
          {avgW !== null && avgR !== null && avgM !== null && (() => {
            const weakSubject = avgW <= avgR && avgW <= avgM ? `Writing (${avgW}%)` : avgR <= avgW && avgR <= avgM ? `Reading (${avgR}%)` : `Maths (${avgM}%)`;
            const weakAvg = avgW <= avgR && avgW <= avgM ? avgW : avgR <= avgW && avgR <= avgM ? avgR : avgM;
            return (
              <li className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                <span className="text-amber-500 mt-0.5 font-bold shrink-0">Q</span>
                <span><strong>{weakSubject}</strong> is the weakest subject trust-wide at Y6. What is the trust&apos;s plan to close this gap — is there a shared curriculum approach, and is it working?</span>
              </li>
            );
          })()}

          {/* Data-driven: missing EYFS */}
          {missingEyfs.length > 0 && (
            <li className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <span className="text-amber-500 mt-0.5 font-bold shrink-0">Q</span>
              <span>{missingEyfs.length === 1 ? `${missingEyfs[0]} has` : `${missingEyfs.join(", ")} have`} not submitted EYFS data. Without GLD baseline, we cannot assess the full progress pipeline. When will this be available?</span>
            </li>
          )}

          {/* Data-driven: pipeline jumps */}
          {bigJumps.length > 0 && (
            <li className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="text-red-500 mt-0.5 font-bold shrink-0">Q</span>
              <span>There are {bigJumps.length} implausible pipeline jumps (&gt;15pp between adjacent year groups). These may indicate data entry errors or genuine concerns. Can school leaders provide lesson observation or moderation evidence to support the figures for these year groups?</span>
            </li>
          )}

          {/* Data-driven: zero GD Writing */}
          {zeroGdWriting.length >= 3 && (
            <li className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="text-red-500 mt-0.5 font-bold shrink-0">Q</span>
              <span>Zero Greater Depth in Writing is reported across {zeroGdWriting.length} year groups in {[...new Set(zeroGdWriting.map((z) => z.school))].join(", ")}. Is this a genuine reflection of attainment or does it suggest the writing GD threshold is not well understood? What does the writing moderation evidence show?</span>
            </li>
          )}

          {/* Data-driven: trustAvgY6Combined vs national */}
          {trustAvgY6Combined !== null && trustAvgY6Combined < 60 && (
            <li className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="text-red-500 mt-0.5 font-bold shrink-0">Q</span>
              <span>Trust-wide Y6 Combined is <strong>{trustAvgY6Combined}%</strong> at this mid-year point — significantly below the national KS2 average of ~60%. What is the trust-level improvement trajectory and how does this compare to last year&apos;s validated KS2 outcomes?</span>
            </li>
          )}
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

  const subjects = [
    { key: "Reading", dfeSubject: "Reading", color: SUBJECT_COLORS.reading },
    { key: "Writing", dfeSubject: "Writing", color: SUBJECT_COLORS.writing },
    { key: "Maths", dfeSubject: "Maths", color: SUBJECT_COLORS.maths },
    { key: "Combined", dfeSubject: "Reading, writing and maths", color: SUBJECT_COLORS.combined },
  ];

  const ks2Years = [2023, 2024, 2025];

  // Build chart data: each row = one year, columns = subjects
  const chartData = [
    ...ks2Years.map((year) => {
      const row: Record<string, number | string | null> = { name: `KS2 ${year}` };
      for (const subj of subjects) {
        row[subj.key] = getKs2SubjectForUrn(ks2Results, info.urn, year, subj.dfeSubject);
      }
      return row;
    }),
    // Add self-report as final group
    ...(selfReport ? [{
      name: "Mid-Year",
      Reading: selfReport.reading,
      Writing: selfReport.writing,
      Maths: selfReport.maths,
      Combined: selfReport.combined,
    } as Record<string, number | string | null>] : []),
  ];

  // Check for flags: any subject where self-report exceeds best-ever KS2 by >10pp
  const flags: string[] = [];
  if (selfReport) {
    for (const subj of subjects) {
      const selfVal = selfReport[subj.key.toLowerCase() as keyof typeof selfReport];
      if (selfVal === null) continue;
      const historical = ks2Years.map((y) => getKs2SubjectForUrn(ks2Results, info.urn, y, subj.dfeSubject)).filter((v): v is number => v !== null);
      if (historical.length === 0) continue;
      const best = Math.max(...historical);
      if (selfVal > best + 10) {
        flags.push(`${subj.key}: claims ${selfVal}% — best-ever KS2 was ${best}% (+${Math.round(selfVal - best)}pp)`);
      }
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2 gap-2">
        <div>
          <div className="font-semibold text-gray-800 text-sm">{school}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">URN {info.urn}</div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-end text-[10px] text-gray-600 shrink-0">
          {subjects.map((s) => (
            <span key={s.key} className="flex items-center gap-1 font-medium" style={{ color: s.color }}>
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.key}
            </span>
          ))}
        </div>
      </div>

      {flags.length > 0 && (
        <div className="mb-2 space-y-1">
          {flags.map((f, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              <AlertTriangle size={10} />
              {f}
            </div>
          ))}
        </div>
      )}

      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(val, name) => [`${val}%`, name]}
            contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #E2E8F0" }}
          />
          {subjects.map((subj) => (
            <Bar key={subj.key} dataKey={subj.key} fill={subj.color} radius={[3, 3, 0, 0]} maxBarSize={20} />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
        <Info size={9} />
        <span>KS2 2023–2025: DfE validated SATs results. Mid-Year: self-reported in trust spreadsheet.</span>
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
  const [activeSchoolTab, setActiveSchoolTab] = useState<string>("overview");
  const [grooveHouseStats, setGrooveHouseStats] = useState<{ totalPupils: number; trackablePupils: number } | null>(null);
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

    // Also fetch Grove House stats (non-fatal)
    (async () => {
      try {
        const res = await fetch(`/api/trust-analysis/grove-house${organizationId ? `?organizationId=${organizationId}` : ''}`, { headers: authHeaders });
        const json = await res.json();
        const summary = json.summary ?? json.data?.summary;
        if (res.ok && summary) {
          setGrooveHouseStats({
            totalPupils: summary.totalPupils,
            trackablePupils: summary.trackablePupils,
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
                let totalFsm = 0;
                let totalSend = 0;
                for (const school of parsed.schools) {
                  for (const yg of YEAR_GROUPS) {
                    const d = parsed.data[school]?.[yg];
                    if (!d) continue;
                    if (d.cohort.number_in_cohort !== null) totalPupils += d.cohort.number_in_cohort;
                    if (d.cohort.number_fsm !== null) totalFsm += d.cohort.number_fsm;
                    if (d.cohort.number_send !== null) totalSend += d.cohort.number_send;
                  }
                }
                const fsmPct = totalPupils > 0 ? Math.round((totalFsm / totalPupils) * 1000) / 10 : null;
                const sendPct = totalPupils > 0 ? Math.round((totalSend / totalPupils) * 1000) / 10 : null;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard label="Schools" value={parsed.schools.length} sub={parsed.schools.join(", ")} />
                    <StatCard label="Year groups" value={parsed.yearGroups.length} sub={parsed.yearGroups.join(", ")} />
                    <StatCard label="Data points" value={parsed.totalDataPoints.toLocaleString()} />
                    <StatCard label="Total pupils" value={totalPupils > 0 ? totalPupils.toLocaleString() : "—"} sub="all year groups" />
                    <StatCard label="FSM pupils" value={totalFsm > 0 ? totalFsm : "—"} sub={fsmPct !== null ? `${fsmPct}% trust-wide` : undefined} />
                    <StatCard label="Quality flags" value={parsed.qualityFlags.length} sub={parsed.qualityFlags.length > 0 ? "See below" : "None"} />
                  </div>
                );
              })()}

              {/* ── 2. Subject Selector Heatmap ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">ARE % — Heatmap by Subject</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Colour-coded at-a-glance view across all schools and year groups</p>
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded shrink-0 ml-3">Click school name to drill down</span>
                </div>
                <SubjectHeatmap
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
                      <SchoolTab school={activeSchoolTab} parsed={parsed} />
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
                      <h3 className="text-sm font-semibold text-gray-700">KS2 Track Record by Subject (2023–2025 + Mid-Year Self-Report)</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Reading (blue), Writing (red), Maths (green), Combined (purple) — bars show each year side by side</p>
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

        {/* ─── Phase 3: Deep Analytics (locked) ───────────────────────────── */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <SectionHeader number={3} title="Deep Analytics" subtitle="Per-pupil tracking, SEND overlay, teacher accuracy, AI recommendations." />

          <div className="relative bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center overflow-hidden">
            {/* Blurred preview */}
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-xl z-10 flex flex-col items-center justify-center">
              <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm max-w-md text-left">
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
                {grooveHouseStats && grooveHouseStats.totalPupils > 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
                    <div className="font-semibold mb-0.5">Grove House data detected</div>
                    <div>{grooveHouseStats.totalPupils} pseudonymised pupils, {grooveHouseStats.trackablePupils} trackable across years</div>
                    <a href="/dashboard/school-improvement/trust-analysis/grove-house" className="underline mt-1 block hover:text-blue-900">
                      View Grove House deep analytics
                    </a>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Users size={12} />
                    Upload CTF assessment data to enable this module
                  </div>
                )}
              </div>
            </div>

            {/* Background preview (blurred) */}
            <div className="blur-sm pointer-events-none">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {["Cohort Journey", "SEND Gap Analysis", "Teacher Accuracy"].map((label) => (
                  <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 h-32">
                    <div className="text-xs text-gray-400 mb-2">{label}</div>
                    <div className="h-16 bg-gray-100 rounded" />
                  </div>
                ))}
              </div>
              <div className="h-24 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
