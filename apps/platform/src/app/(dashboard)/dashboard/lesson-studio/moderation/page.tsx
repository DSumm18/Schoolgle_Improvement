"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  Users,
  Target,
  GitCompare,
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types ──────────────────────────────────────────────────────────────

type AttainmentLevel = "emerging" | "expected" | "exceeding";
type ConfidenceTrend = "up" | "down" | "stable";
type TabId = "pupils" | "objectives" | "moderation" | "evidence";

interface PupilProgress {
  hash: string;
  objectivesCovered: number;
  totalObjectives: number;
  attainment: AttainmentLevel;
  lastLessonDate: string;
  confidenceScore: number;
  confidenceTrend: ConfidenceTrend;
  className: string;
}

interface ObjectiveCoverage {
  id: string;
  code: string;
  description: string;
  timesTaught: number;
  classes: string[];
  lastTaught: string;
  coveragePercent: number;
}

interface ModerationEntry {
  objectiveCode: string;
  objectiveDescription: string;
  pupils: {
    hash: string;
    response: string;
    score: number;
    attainment: AttainmentLevel;
  }[];
}

interface EvidenceEntry {
  id: string;
  lessonDate: string;
  lessonTitle: string;
  className: string;
  objectivesCovered: string[];
  pupilCount: number;
  avgEngagement: number;
  avgConfidence: number;
  resources: string[];
}

// ── Mock Data ──────────────────────────────────────────────────────────

const MOCK_PUPILS: PupilProgress[] = [
  { hash: "a3f8c1", objectivesCovered: 18, totalObjectives: 24, attainment: "expected", lastLessonDate: "2026-04-03", confidenceScore: 72, confidenceTrend: "up", className: "Year 4 Maple" },
  { hash: "b7d2e5", objectivesCovered: 22, totalObjectives: 24, attainment: "exceeding", lastLessonDate: "2026-04-03", confidenceScore: 91, confidenceTrend: "up", className: "Year 4 Maple" },
  { hash: "c1a9f3", objectivesCovered: 11, totalObjectives: 24, attainment: "emerging", lastLessonDate: "2026-04-02", confidenceScore: 45, confidenceTrend: "down", className: "Year 4 Maple" },
  { hash: "d4b6e8", objectivesCovered: 16, totalObjectives: 24, attainment: "expected", lastLessonDate: "2026-04-03", confidenceScore: 68, confidenceTrend: "stable", className: "Year 4 Oak" },
  { hash: "e9c3a7", objectivesCovered: 20, totalObjectives: 24, attainment: "exceeding", lastLessonDate: "2026-04-03", confidenceScore: 85, confidenceTrend: "up", className: "Year 4 Oak" },
  { hash: "f2d8b1", objectivesCovered: 8, totalObjectives: 24, attainment: "emerging", lastLessonDate: "2026-04-01", confidenceScore: 38, confidenceTrend: "down", className: "Year 4 Oak" },
  { hash: "a5e7c9", objectivesCovered: 15, totalObjectives: 24, attainment: "expected", lastLessonDate: "2026-04-03", confidenceScore: 63, confidenceTrend: "stable", className: "Year 4 Maple" },
  { hash: "b8f1d4", objectivesCovered: 19, totalObjectives: 24, attainment: "expected", lastLessonDate: "2026-04-03", confidenceScore: 77, confidenceTrend: "up", className: "Year 4 Maple" },
  { hash: "c3a6e2", objectivesCovered: 13, totalObjectives: 24, attainment: "emerging", lastLessonDate: "2026-04-02", confidenceScore: 52, confidenceTrend: "stable", className: "Year 4 Oak" },
  { hash: "d6b9f5", objectivesCovered: 21, totalObjectives: 24, attainment: "exceeding", lastLessonDate: "2026-04-03", confidenceScore: 88, confidenceTrend: "up", className: "Year 4 Oak" },
];

const MOCK_OBJECTIVES: ObjectiveCoverage[] = [
  { id: "obj-1", code: "4M.1", description: "Recall multiplication and division facts for times tables up to 12 × 12", timesTaught: 8, classes: ["Year 4 Maple", "Year 4 Oak"], lastTaught: "2026-04-03", coveragePercent: 95 },
  { id: "obj-2", code: "4M.2", description: "Use place value, known and derived facts to multiply and divide mentally", timesTaught: 6, classes: ["Year 4 Maple", "Year 4 Oak"], lastTaught: "2026-04-02", coveragePercent: 85 },
  { id: "obj-3", code: "4M.3", description: "Multiply two-digit and three-digit numbers by a one-digit number using formal written layout", timesTaught: 5, classes: ["Year 4 Maple"], lastTaught: "2026-04-01", coveragePercent: 60 },
  { id: "obj-4", code: "4F.1", description: "Recognise and show families of common equivalent fractions", timesTaught: 4, classes: ["Year 4 Maple", "Year 4 Oak"], lastTaught: "2026-03-28", coveragePercent: 75 },
  { id: "obj-5", code: "4F.2", description: "Count up and down in hundredths", timesTaught: 3, classes: ["Year 4 Oak"], lastTaught: "2026-03-27", coveragePercent: 45 },
  { id: "obj-6", code: "4F.3", description: "Add and subtract fractions with the same denominator", timesTaught: 4, classes: ["Year 4 Maple", "Year 4 Oak"], lastTaught: "2026-03-31", coveragePercent: 70 },
  { id: "obj-7", code: "4G.1", description: "Compare and classify geometric shapes based on their properties", timesTaught: 2, classes: ["Year 4 Maple"], lastTaught: "2026-03-25", coveragePercent: 30 },
  { id: "obj-8", code: "4G.2", description: "Identify lines of symmetry in 2-D shapes presented in different orientations", timesTaught: 1, classes: ["Year 4 Oak"], lastTaught: "2026-03-20", coveragePercent: 20 },
  { id: "obj-9", code: "4S.1", description: "Interpret and present discrete and continuous data using appropriate graphical methods", timesTaught: 3, classes: ["Year 4 Maple", "Year 4 Oak"], lastTaught: "2026-03-29", coveragePercent: 55 },
  { id: "obj-10", code: "4S.2", description: "Solve comparison, sum and difference problems using information presented in bar charts, pictograms, tables", timesTaught: 2, classes: ["Year 4 Maple"], lastTaught: "2026-03-26", coveragePercent: 40 },
];

const MOCK_MODERATION: ModerationEntry[] = [
  {
    objectiveCode: "4M.1",
    objectiveDescription: "Recall multiplication and division facts for times tables up to 12 × 12",
    pupils: [
      { hash: "a3f8c1", response: "Answered 9/10 rapid recall questions correctly in 60s. Hesitated on 7×8 and 12×9.", score: 72, attainment: "expected" },
      { hash: "b7d2e5", response: "Perfect 10/10 in under 45s. Self-corrected 6×7 immediately. Applied to word problems unprompted.", score: 95, attainment: "exceeding" },
      { hash: "c1a9f3", response: "Answered 5/10. Used finger counting for 6× and above. Required concrete manipulatives for 8× and 9×.", score: 42, attainment: "emerging" },
    ],
  },
  {
    objectiveCode: "4F.1",
    objectiveDescription: "Recognise and show families of common equivalent fractions",
    pupils: [
      { hash: "a3f8c1", response: "Identified 1/2 = 2/4 = 4/8 correctly. Struggled with thirds/sixths equivalence without fraction wall.", score: 65, attainment: "expected" },
      { hash: "b7d2e5", response: "Generated equivalent fraction families independently. Explained reasoning using diagrams. Extended to fifths/tenths.", score: 92, attainment: "exceeding" },
      { hash: "c1a9f3", response: "Matched visual fraction representations but could not generate equivalents without support. Needs fraction wall scaffolding.", score: 35, attainment: "emerging" },
    ],
  },
];

const MOCK_EVIDENCE: EvidenceEntry[] = [
  { id: "ev-1", lessonDate: "2026-04-03", lessonTitle: "Times Tables Mastery — Speed & Accuracy", className: "Year 4 Maple", objectivesCovered: ["4M.1", "4M.2"], pupilCount: 28, avgEngagement: 87, avgConfidence: 74, resources: ["Rapid recall cards", "Interactive whiteboard quiz", "Exit ticket"] },
  { id: "ev-2", lessonDate: "2026-04-03", lessonTitle: "Times Tables Mastery — Speed & Accuracy", className: "Year 4 Oak", objectivesCovered: ["4M.1", "4M.2"], pupilCount: 26, avgEngagement: 82, avgConfidence: 71, resources: ["Rapid recall cards", "Interactive whiteboard quiz", "Exit ticket"] },
  { id: "ev-3", lessonDate: "2026-04-02", lessonTitle: "Place Value in Multiplication", className: "Year 4 Maple", objectivesCovered: ["4M.2", "4M.3"], pupilCount: 28, avgEngagement: 79, avgConfidence: 68, resources: ["Place value counters", "Worksheet", "Peer assessment"] },
  { id: "ev-4", lessonDate: "2026-04-01", lessonTitle: "Formal Written Multiplication", className: "Year 4 Maple", objectivesCovered: ["4M.3"], pupilCount: 27, avgEngagement: 75, avgConfidence: 62, resources: ["Worked examples", "Scaffolded worksheet", "Mini whiteboard practice"] },
  { id: "ev-5", lessonDate: "2026-03-31", lessonTitle: "Adding Fractions — Same Denominator", className: "Year 4 Maple", objectivesCovered: ["4F.3", "4F.1"], pupilCount: 28, avgEngagement: 83, avgConfidence: 70, resources: ["Fraction wall", "Bar model diagrams", "Exit ticket"] },
  { id: "ev-6", lessonDate: "2026-03-31", lessonTitle: "Adding Fractions — Same Denominator", className: "Year 4 Oak", objectivesCovered: ["4F.3", "4F.1"], pupilCount: 26, avgEngagement: 80, avgConfidence: 67, resources: ["Fraction wall", "Bar model diagrams", "Exit ticket"] },
  { id: "ev-7", lessonDate: "2026-03-29", lessonTitle: "Interpreting Bar Charts", className: "Year 4 Maple", objectivesCovered: ["4S.1"], pupilCount: 28, avgEngagement: 76, avgConfidence: 65, resources: ["Data collection activity", "Graph paper", "Digital chart tool"] },
  { id: "ev-8", lessonDate: "2026-03-29", lessonTitle: "Interpreting Bar Charts", className: "Year 4 Oak", objectivesCovered: ["4S.1"], pupilCount: 25, avgEngagement: 78, avgConfidence: 63, resources: ["Data collection activity", "Graph paper", "Digital chart tool"] },
  { id: "ev-9", lessonDate: "2026-03-28", lessonTitle: "Equivalent Fractions — Families", className: "Year 4 Maple", objectivesCovered: ["4F.1", "4F.2"], pupilCount: 28, avgEngagement: 81, avgConfidence: 69, resources: ["Fraction wall", "Number line", "Matching cards"] },
  { id: "ev-10", lessonDate: "2026-03-28", lessonTitle: "Equivalent Fractions — Families", className: "Year 4 Oak", objectivesCovered: ["4F.1"], pupilCount: 26, avgEngagement: 77, avgConfidence: 64, resources: ["Fraction wall", "Number line", "Matching cards"] },
];

// ── Helpers ────────────────────────────────────────────────────────────

const ATTAINMENT_STYLES: Record<AttainmentLevel, { bg: string; text: string; label: string }> = {
  emerging: { bg: "bg-amber-100 dark:bg-amber-900/20", text: "text-amber-700 dark:text-amber-300", label: "Emerging" },
  expected: { bg: "bg-emerald-100 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-300", label: "Expected" },
  exceeding: { bg: "bg-sky-100 dark:bg-sky-900/20", text: "text-sky-700 dark:text-sky-300", label: "Exceeding" },
};

function AttainmentBadge({ level }: { level: AttainmentLevel }) {
  const s = ATTAINMENT_STYLES[level];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.bg} ${s.text}`}>{s.label}</span>;
}

function TrendIcon({ trend }: { trend: ConfidenceTrend }) {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (trend === "down") return <TrendingDown className="h-4 w-4 text-rose-500" />;
  return <Minus className="h-4 w-4 text-slate-400" />;
}

function CoverageBar({ percent }: { percent: number }) {
  const color = percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{percent}%</span>
    </div>
  );
}

function exportEvidenceCSV() {
  const headers = ["Date", "Lesson", "Class", "Objectives", "Pupils", "Avg Engagement %", "Avg Confidence %", "Resources"];
  const rows = MOCK_EVIDENCE.map((e) => [
    e.lessonDate,
    e.lessonTitle,
    e.className,
    e.objectivesCovered.join("; "),
    e.pupilCount.toString(),
    e.avgEngagement.toString(),
    e.avgConfidence.toString(),
    e.resources.join("; "),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lesson-studio-evidence-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Stats Cards ────────────────────────────────────────────────────────

function StatsRow() {
  const totalPupils = MOCK_PUPILS.length;
  const emerging = MOCK_PUPILS.filter((p) => p.attainment === "emerging").length;
  const expected = MOCK_PUPILS.filter((p) => p.attainment === "expected").length;
  const exceeding = MOCK_PUPILS.filter((p) => p.attainment === "exceeding").length;
  const avgCoverage = Math.round(MOCK_PUPILS.reduce((s, p) => s + (p.objectivesCovered / p.totalObjectives) * 100, 0) / totalPupils);
  const objectivesFullyCovered = MOCK_OBJECTIVES.filter((o) => o.coveragePercent >= 80).length;

  const stats = [
    { label: "Pupils Tracked", value: totalPupils, icon: Users, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-100 dark:bg-pink-900/20" },
    { label: "Avg Coverage", value: `${avgCoverage}%`, icon: Target, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
    { label: "Objectives Met (80%+)", value: `${objectivesFullyCovered}/${MOCK_OBJECTIVES.length}`, icon: ClipboardCheck, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-900/20" },
    { label: "Emerging", value: emerging, icon: TrendingDown, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/20" },
    { label: "Expected", value: expected, icon: Minus, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
    { label: "Exceeding", value: exceeding, icon: TrendingUp, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-100 dark:bg-sky-900/20" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${s.bg}`}>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Tab Components ─────────────────────────────────────────────────────

function PupilProgressTab() {
  const [sortField, setSortField] = useState<"coverage" | "confidence" | "attainment">("coverage");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...MOCK_PUPILS].sort((a, b) => {
    const dir = sortAsc ? 1 : -1;
    if (sortField === "coverage") return dir * ((a.objectivesCovered / a.totalObjectives) - (b.objectivesCovered / b.totalObjectives));
    if (sortField === "confidence") return dir * (a.confidenceScore - b.confidenceScore);
    const order: Record<AttainmentLevel, number> = { emerging: 0, expected: 1, exceeding: 2 };
    return dir * (order[a.attainment] - order[b.attainment]);
  });

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  }

  const SortIndicator = ({ field }: { field: typeof sortField }) => (
    sortField === field ? (sortAsc ? <ChevronUp className="inline h-3 w-3 ml-1" /> : <ChevronDown className="inline h-3 w-3 ml-1" />) : null
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Per-Pupil Progress</CardTitle>
        <CardDescription>Pupil-level attainment and objective coverage (pseudonymised hashes — no PII)</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pupil Hash</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("coverage")}>
                Objectives <SortIndicator field="coverage" />
              </TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("attainment")}>
                Attainment <SortIndicator field="attainment" />
              </TableHead>
              <TableHead>Last Lesson</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("confidence")}>
                Confidence <SortIndicator field="confidence" />
              </TableHead>
              <TableHead>Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((p) => (
              <TableRow key={p.hash}>
                <TableCell className="font-mono text-sm">{p.hash}</TableCell>
                <TableCell>{p.className}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{p.objectivesCovered}/{p.totalObjectives}</span>
                    <CoverageBar percent={Math.round((p.objectivesCovered / p.totalObjectives) * 100)} />
                  </div>
                </TableCell>
                <TableCell><AttainmentBadge level={p.attainment} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{p.lastLessonDate}</TableCell>
                <TableCell>
                  <span className={`font-semibold ${p.confidenceScore >= 70 ? "text-emerald-600" : p.confidenceScore >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                    {p.confidenceScore}%
                  </span>
                </TableCell>
                <TableCell><TrendIcon trend={p.confidenceTrend} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ObjectiveCoverageTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Per-Objective Coverage</CardTitle>
        <CardDescription>Which objectives have been taught, how many times, and to which classes</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Objective</TableHead>
              <TableHead>Times Taught</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Last Taught</TableHead>
              <TableHead>Coverage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_OBJECTIVES.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">{o.code}</Badge>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm leading-snug">{o.description}</p>
                </TableCell>
                <TableCell className="font-semibold">{o.timesTaught}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {o.classes.map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{o.lastTaught}</TableCell>
                <TableCell><CoverageBar percent={o.coveragePercent} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ModerationComparisonTab() {
  return (
    <div className="space-y-6">
      {MOCK_MODERATION.map((entry) => (
        <Card key={entry.objectiveCode}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">{entry.objectiveCode}</Badge>
              <CardTitle className="text-lg">{entry.objectiveDescription}</CardTitle>
            </div>
            <CardDescription>Side-by-side comparison of pupil responses for moderation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {entry.pupils.map((p) => (
                <div key={p.hash} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-muted-foreground">{p.hash}</span>
                    <AttainmentBadge level={p.attainment} />
                  </div>
                  <p className="text-sm leading-relaxed">{p.response}</p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Score</span>
                    <span className={`text-sm font-bold ${p.score >= 70 ? "text-emerald-600" : p.score >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                      {p.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EvidenceTrailTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Evidence Trail</CardTitle>
            <CardDescription>Lesson-by-lesson record with objectives, engagement, and resources</CardDescription>
          </div>
          <button
            onClick={exportEvidenceCSV}
            className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Lesson</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Objectives</TableHead>
              <TableHead>Pupils</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Resources</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_EVIDENCE.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-sm whitespace-nowrap">{e.lessonDate}</TableCell>
                <TableCell className="font-medium max-w-xs">
                  <p className="text-sm leading-snug">{e.lessonTitle}</p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">{e.className}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {e.objectivesCovered.map((o) => (
                      <Badge key={o} variant="outline" className="font-mono text-xs">{o}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-semibold">{e.pupilCount}</TableCell>
                <TableCell>
                  <span className={`font-semibold ${e.avgEngagement >= 80 ? "text-emerald-600" : e.avgEngagement >= 60 ? "text-amber-600" : "text-rose-600"}`}>
                    {e.avgEngagement}%
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${e.avgConfidence >= 70 ? "text-emerald-600" : e.avgConfidence >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                    {e.avgConfidence}%
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {e.resources.map((r) => (
                      <span key={r} className="inline-block rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-xs">{r}</span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ── Tab Navigation ─────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "pupils", label: "Pupil Progress", icon: Users },
  { id: "objectives", label: "Objective Coverage", icon: Target },
  { id: "moderation", label: "Moderation", icon: GitCompare },
  { id: "evidence", label: "Evidence Trail", icon: FileText },
];

// ── Page ───────────────────────────────────────────────────────────────

export default function ModerationDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>("pupils");

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-pink-100 dark:bg-pink-900/20 p-3">
          <ClipboardCheck className="h-8 w-8 text-pink-600 dark:text-pink-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-pink-600 dark:text-pink-400">
            Teaching &amp; Learning
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Moderation &amp; Evidence Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Ofsted-ready evidence of pupil progress, objective coverage, and teaching impact. All pupil data is pseudonymised.
          </p>
        </div>
        <a
          href="/dashboard/lesson-studio"
          className="hidden sm:inline-flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 font-medium"
        >
          Lesson Studio <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Stats */}
      <StatsRow />

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-700 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "pupils" && <PupilProgressTab />}
      {activeTab === "objectives" && <ObjectiveCoverageTab />}
      {activeTab === "moderation" && <ModerationComparisonTab />}
      {activeTab === "evidence" && <EvidenceTrailTab />}
    </div>
  );
}
