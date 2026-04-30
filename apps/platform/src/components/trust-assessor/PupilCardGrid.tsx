"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface JourneyEntry {
  year: number;
  yearGroup: number;
  subject: string;
  level: string;
  scaledScore?: number;
}

interface PupilRecord {
  pupilId: string;
  demographics: {
    isFsm: boolean;
    isSend: boolean;
    isEal: boolean;
    gender: string;
    isEhcp?: boolean;
    hasEhcp?: boolean;
    isCp?: boolean;
    hasChildProtection?: boolean;
  };
  journey: JourneyEntry[];
}

interface PupilCardGridProps {
  pupils: PupilRecord[];
  spotlightPupilId?: string | null;
}

export interface PupilRegisterRow {
  pupil: PupilRecord;
  pupilId: string;
  yearGroup: number;
  className: string;
  reading: string;
  writing: string;
  maths: string;
  expectedCount: number;
  totalSubjects: number;
  trend: "improving" | "declining" | "stable" | "insufficient";
  flags: string[];
}

export interface PupilRegisterGroup {
  yearGroup: number;
  label: string;
  rows: PupilRegisterRow[];
}

const YG_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;
type YGOption = (typeof YG_OPTIONS)[number];

function ygLabel(yg: number): string {
  return yg === 0 ? "EYFS" : `Y${yg}`;
}

function levelValue(level: string): number {
  return level === "GDS" ? 3 : level === "EXS" || level === "2" ? 2 : level === "WTS" || level === "WT" || level === "1" ? 1 : 0;
}

function levelBadgeClass(level: string): string {
  if (level === "GDS") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (level === "EXS" || level === "2") return "bg-sky-500/10 text-sky-600 border-sky-500/20";
  if (level === "—") return "bg-muted text-muted-foreground border-border";
  return "bg-rose-500/10 text-rose-600 border-rose-500/20";
}

function trendLabel(trend: PupilRegisterRow["trend"]): string {
  if (trend === "improving") return "Improving";
  if (trend === "declining") return "Needs attention";
  if (trend === "stable") return "Stable";
  return "Insufficient";
}

function trendClass(trend: PupilRegisterRow["trend"]): string {
  if (trend === "improving") return "text-emerald-600";
  if (trend === "declining") return "text-rose-600";
  return "text-muted-foreground";
}

function vulnerabilityFlags(demo: PupilRecord["demographics"]): string[] {
  return [
    demo.isFsm && "FSM",
    demo.isSend && "SEND",
    demo.isEal && "EAL",
    (demo.isEhcp || demo.hasEhcp) && "EHCP",
    (demo.isCp || demo.hasChildProtection) && "CP",
  ].filter(Boolean) as string[];
}

function latestEntryForSubject(pupil: PupilRecord, subject: string): JourneyEntry | undefined {
  return pupil.journey
    .filter((entry) => entry.subject === subject)
    .sort((a, b) => b.year - a.year || b.yearGroup - a.yearGroup)[0];
}

function latestYearGroup(pupil: PupilRecord): number {
  if (pupil.journey.length === 0) return 0;
  return Math.max(...pupil.journey.map((entry) => entry.yearGroup));
}

function weakestSubject(journey: JourneyEntry[]): { subject: string; avgLevel: number } | null {
  const subjects = [...new Set(journey.map((entry) => entry.subject).filter((subject) => ["reading", "writing", "maths"].includes(subject)))];
  if (subjects.length === 0) return null;

  const scored = subjects.map((subject) => {
    const levels = journey.filter((entry) => entry.subject === subject).map((entry) => levelValue(entry.level));
    const avgLevel = levels.length > 0 ? levels.reduce((total, value) => total + value, 0) / levels.length : 0;
    return { subject, avgLevel };
  });

  scored.sort((a, b) => a.avgLevel - b.avgLevel);
  return scored[0];
}

function overallTrend(journey: JourneyEntry[]): PupilRegisterRow["trend"] {
  const levels = [...journey]
    .sort((a, b) => a.year - b.year || a.yearGroup - b.yearGroup)
    .map((entry) => levelValue(entry.level));

  if (levels.length < 2) return "insufficient";
  if (levels[levels.length - 1] > levels[0]) return "improving";
  if (levels[levels.length - 1] < levels[0]) return "declining";
  return "stable";
}

function contextPanel(demo: PupilRecord["demographics"], trend: PupilRegisterRow["trend"]): string {
  const { isFsm, isSend, isEal } = demo;

  if (isSend && isFsm) {
    return "This pupil carries dual disadvantage markers. Review whether provision and Pupil Premium support are being tracked against the pupil's own starting point.";
  }
  if (isSend) {
    return "SEND-registered. Read attainment alongside individual provision, the graduated approach and progress from the pupil's own baseline.";
  }
  if (isEal && isFsm) {
    return "EAL and Pupil Premium eligible. Language acquisition and disadvantage should both be considered before interpreting attainment in isolation.";
  }
  if (isEal) {
    return "EAL learner. Consider time in English-medium education and whether language exposure explains current attainment patterns.";
  }
  if (isFsm) {
    return "Pupil Premium eligible. Check whether strategy actions are specific, tracked and matched to the pupil's main barrier.";
  }
  if (trend === "declining") {
    return "No recorded vulnerability flags. A declining profile without obvious context is worth checking for attendance, wellbeing or unidentified need.";
  }
  return "No additional vulnerability flags on record. Keep the focus on the journey and any subject-specific changes.";
}

export function buildPupilRegisterGroups(pupils: PupilRecord[]): PupilRegisterGroup[] {
  const rows: PupilRegisterRow[] = pupils.map((pupil) => {
    const reading = latestEntryForSubject(pupil, "reading")?.level ?? "—";
    const writing = latestEntryForSubject(pupil, "writing")?.level ?? "—";
    const maths = latestEntryForSubject(pupil, "maths")?.level ?? "—";
    const levels = [reading, writing, maths].filter((level) => level !== "—");
    const yearGroup = latestYearGroup(pupil);

    return {
      pupil,
      pupilId: pupil.pupilId,
      yearGroup,
      className: `${ygLabel(yearGroup)} cohort`,
      reading,
      writing,
      maths,
      expectedCount: levels.filter((level) => ["EXS", "GDS", "2"].includes(level)).length,
      totalSubjects: levels.length,
      trend: overallTrend(pupil.journey),
      flags: vulnerabilityFlags(pupil.demographics),
    };
  });

  const groupedRows = rows.reduce<Record<number, PupilRegisterRow[]>>((acc, row) => {
    acc[row.yearGroup] = acc[row.yearGroup] || [];
    acc[row.yearGroup].push(row);
    return acc;
  }, {});

  return Object.entries(groupedRows)
    .map(([yearGroup, groupRows]) => ({
      yearGroup: Number(yearGroup),
      label: `${ygLabel(Number(yearGroup))} cohort`,
      rows: groupRows.sort((a, b) => a.pupilId.localeCompare(b.pupilId)),
    }))
    .sort((a, b) => a.yearGroup - b.yearGroup);
}

function PupilDetailPanel({ pupil, onClose }: { pupil: PupilRecord | null; onClose: () => void }) {
  if (!pupil) {
    return (
      <aside className="rounded-2xl border border-border bg-muted/20 p-5 min-h-[320px] flex items-center justify-center text-center">
        <div>
          <div className="text-sm font-semibold text-foreground">Select a pupil</div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Choose a row to view the journey, flags and suggested focus without cluttering the register.
          </p>
        </div>
      </aside>
    );
  }

  const flags = vulnerabilityFlags(pupil.demographics);
  const trend = overallTrend(pupil.journey);
  const weak = weakestSubject(pupil.journey);
  const subjectsByYear = ["reading", "writing", "maths"].map((subject) => ({
    subject,
    entries: pupil.journey
      .filter((entry) => entry.subject === subject)
      .sort((a, b) => a.yearGroup - b.yearGroup || a.year - b.year),
  }));

  const edPrompt = weak
    ? `Create an intervention plan for pupil ${pupil.pupilId} who needs focus on ${weak.subject}. Demographics: ${flags.join(", ") || "no additional flags"}. Use EEF-evidenced strategies and produce a 6-week plan with weekly check-ins.`
    : null;

  return (
    <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full border border-border bg-muted/40 flex items-center justify-center text-sm font-bold text-foreground shrink-0">
            {pupil.pupilId.split(" ").map((word) => word[0]).join("")}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">{pupil.pupilId}</h4>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {flags.length === 0 ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border bg-background text-muted-foreground">No flags</span>
              ) : flags.map((flag) => (
                <span key={flag} className="text-[10px] px-1.5 py-0.5 rounded-full border border-border bg-background text-muted-foreground">{flag}</span>
              ))}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border bg-background text-muted-foreground">
                {pupil.demographics.gender === "M" ? "Male" : pupil.demographics.gender === "F" ? "Female" : pupil.demographics.gender}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label="Clear selected pupil">
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Trend</div>
          <div className={`text-sm font-bold mt-1 ${trendClass(trend)}`}>{trendLabel(trend)}</div>
        </div>
        <div className="rounded-xl border border-border bg-background p-3">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Focus</div>
          <div className="text-sm font-bold text-foreground mt-1">{weak?.subject ?? "Review"}</div>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assessment journey</div>
        {subjectsByYear.map(({ subject, entries }) => (
          <div key={subject} className="rounded-xl border border-border bg-background p-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">{subject}</div>
            {entries.length === 0 ? (
              <span className="text-xs text-muted-foreground">No data</span>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {entries.map((entry, index) => (
                  <div key={`${subject}-${entry.year}-${entry.yearGroup}-${index}`} className="flex items-center gap-1">
                    {index > 0 && <span className="text-muted-foreground text-xs">→</span>}
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${levelBadgeClass(entry.level)}`} title={`Y${entry.yearGroup} (${entry.year})`}>
                      {entry.level}
                    </span>
                    <span className="text-[9px] text-muted-foreground">Y{entry.yearGroup}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mb-4 bg-sky-500/10 border border-sky-500/20 rounded-xl p-3">
        <div className="text-xs font-semibold text-sky-700 dark:text-sky-300 mb-1">Context & considerations</div>
        <p className="text-xs text-sky-800 dark:text-sky-100 leading-relaxed">{contextPanel(pupil.demographics, trend)}</p>
      </div>

      {weak && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
          <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Suggested focus area</div>
          <p className="text-xs text-amber-800 dark:text-amber-100 leading-relaxed">
            {weak.subject.charAt(0).toUpperCase() + weak.subject.slice(1)} has the lowest average across recorded assessments.
          </p>
          {edPrompt && (
            <button
              onClick={() => window.open(`/dashboard/ed?prompt=${encodeURIComponent(edPrompt)}`, "_blank")}
              className="mt-2 text-[10px] px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium"
            >
              Generate 6-week plan with Ed →
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

function LevelBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className={`inline-flex min-w-[58px] justify-center rounded-md border px-2 py-1 text-[11px] font-bold ${levelBadgeClass(value)}`}>
      {label}: {value}
    </span>
  );
}

function PupilRegisterTable({
  group,
  selectedPupilId,
  onSelect,
}: {
  group: PupilRegisterGroup;
  selectedPupilId: string | null;
  onSelect: (pupil: PupilRecord) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/25 px-4 py-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{group.label}</h4>
          <p className="text-xs text-muted-foreground">Class grouping will appear here when class metadata is imported.</p>
        </div>
        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {group.rows.length} pupils
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left font-semibold px-4 py-2">Pupil</th>
              <th className="text-left font-semibold px-3 py-2">Flags</th>
              <th className="text-left font-semibold px-3 py-2">Levels</th>
              <th className="text-center font-semibold px-3 py-2">Expected+</th>
              <th className="text-left font-semibold px-3 py-2">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {group.rows.map((row) => {
                const selected = row.pupilId === selectedPupilId;
                return (
                  <motion.tr
                    key={row.pupilId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onSelect(row.pupil)}
                    className={`cursor-pointer transition-colors hover:bg-muted/35 ${selected ? "bg-sky-500/10" : "bg-card"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{row.pupilId}</div>
                      <div className="text-xs text-muted-foreground">{row.className}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {row.flags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : row.flags.map((flag) => (
                          <span key={flag} className="rounded-full border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {flag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <LevelBadge label="R" value={row.reading} />
                        <LevelBadge label="W" value={row.writing} />
                        <LevelBadge label="M" value={row.maths} />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-semibold text-foreground">{row.expectedCount}/{row.totalSubjects || 3}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-semibold ${trendClass(row.trend)}`}>{trendLabel(row.trend)}</span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PupilCardGrid({ pupils, spotlightPupilId }: PupilCardGridProps) {
  const [selectedYg, setSelectedYg] = useState<YGOption | "all">("all");
  const visiblePupils = useMemo(
    () => spotlightPupilId ? pupils.filter((pupil) => pupil.pupilId !== spotlightPupilId) : pupils,
    [pupils, spotlightPupilId],
  );
  const groups = useMemo(() => buildPupilRegisterGroups(visiblePupils), [visiblePupils]);
  const filteredGroups = selectedYg === "all" ? groups : groups.filter((group) => group.yearGroup === selectedYg);
  const firstPupil = filteredGroups[0]?.rows[0]?.pupil ?? null;
  const [selectedPupilId, setSelectedPupilId] = useState<string | null>(null);
  const selectedPupil = visiblePupils.find((pupil) => pupil.pupilId === selectedPupilId) ?? firstPupil;

  const availableYearGroups = groups.map((group) => group.yearGroup);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setSelectedYg("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            selectedYg === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All ({visiblePupils.length})
        </button>
        {availableYearGroups.map((yearGroup) => {
          const active = selectedYg === yearGroup;
          const count = groups.find((group) => group.yearGroup === yearGroup)?.rows.length ?? 0;
          return (
            <button
              key={yearGroup}
              onClick={() => setSelectedYg(yearGroup as YGOption)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                active ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {ygLabel(yearGroup)} ({count})
            </button>
          );
        })}
      </div>

      {visiblePupils.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4">No pupils with multi-year tracking data.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
          <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
            {filteredGroups.map((group) => (
              <PupilRegisterTable
                key={group.yearGroup}
                group={group}
                selectedPupilId={selectedPupil?.pupilId ?? null}
                onSelect={(pupil) => setSelectedPupilId(pupil.pupilId)}
              />
            ))}
          </div>
          <PupilDetailPanel pupil={selectedPupil} onClose={() => setSelectedPupilId(null)} />
        </div>
      )}
    </div>
  );
}
