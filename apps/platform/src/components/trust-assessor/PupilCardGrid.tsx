"use client";

/**
 * PupilCardGrid — Year-group-filtered pupil journey cards
 * Used in Trust Assessor "Per-Pupil Journey Tracking" section.
 *
 * Framing principle: findings are presented as questions to explore,
 * never as accusations. Context panels use constructive, research-backed
 * language appropriate for headteachers as well as governors.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  };
  journey: JourneyEntry[];
}

interface PupilCardGridProps {
  pupils: PupilRecord[];
  /** If provided, this pupil is already shown in a spotlight card above — exclude from grid */
  spotlightPupilId?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function levelValue(l: string): number {
  return l === "GDS" ? 3 : l === "EXS" || l === "2" ? 2 : l === "WTS" || l === "WT" || l === "1" ? 1 : 0;
}

function weakestSubject(journey: JourneyEntry[]): { subject: string; avgLevel: number } | null {
  const subjects = [...new Set(journey.map((j) => j.subject).filter((s) => ["reading", "writing", "maths"].includes(s)))];
  if (subjects.length === 0) return null;
  const scored = subjects.map((s) => {
    const levels = journey.filter((j) => j.subject === s).map((j) => levelValue(j.level));
    const avg = levels.length > 0 ? levels.reduce((a, b) => a + b, 0) / levels.length : 0;
    return { subject: s, avgLevel: avg };
  });
  scored.sort((a, b) => a.avgLevel - b.avgLevel);
  return scored[0];
}

function overallTrend(journey: JourneyEntry[]): "improving" | "declining" | "stable" | "insufficient" {
  const levels = journey.map((j) => levelValue(j.level));
  if (levels.length < 2) return "insufficient";
  const first = levels[0];
  const last = levels[levels.length - 1];
  if (last > first) return "improving";
  if (last < first) return "declining";
  return "stable";
}

/** Auto-generate a constructive, non-accusatory context panel. */
function contextPanel(
  demo: PupilRecord["demographics"],
  trend: "improving" | "declining" | "stable" | "insufficient"
): string {
  const { isFsm, isSend, isEal } = demo;
  const flags = [isFsm && "FSM", isSend && "SEND", isEal && "EAL"].filter(Boolean);

  if (isSend && isFsm) {
    return "This pupil carries dual disadvantage markers (FSM-eligible and SEND-registered). EEF research indicates a 9+ month average attainment gap for pupils with both markers. Questions to explore: Is the Pupil Premium strategy specifically addressing this pupil? Is the EHCP or SEN Support plan being reviewed regularly?";
  }
  if (isSend) {
    return "SEND-registered. Any attainment gap may reflect processing, communication, or specific learning needs rather than a literacy or numeracy deficit. It is worth asking: Does current provision align with the graduated approach, and is progress being measured against this pupil's own baseline rather than national norms?";
  }
  if (isEal && isFsm) {
    return "EAL and Pupil Premium eligible. Language acquisition curve typically takes 5–7 years for academic fluency — earlier shortfalls often reflect exposure time rather than ability. Questions to explore: How long has this pupil been in English-medium education? Is the Pupil Premium strategy accounting for language development as well as academic gaps?";
  }
  if (isEal) {
    return "EAL learner. Research (Strand & Demie, 2018) shows EAL pupils typically reach or exceed peers by KS2 once they have had sufficient language exposure. If this pupil is in their first 3 years of English immersion, current attainment scores should be read in that context.";
  }
  if (isFsm) {
    return "Pupil Premium eligible. The EEF Toolkit identifies feedback, metacognition, and reading comprehension strategies as highest-impact approaches for FSM pupils (5+ months additional progress). It is worth asking: Is this pupil included in the Pupil Premium strategy review, and is impact being tracked?";
  }

  // No flags, but declining
  if (trend === "declining" && flags.length === 0) {
    return "No recorded demographic vulnerability flags. A declining trajectory without obvious contextual factors is worth investigating — possible areas to explore include attendance, wellbeing, specific learning needs not yet identified, or a transition between year groups.";
  }

  return "No additional vulnerability flags on record. Progress is within the expected range for this cohort.";
}

// ─── Year-group chip bar ──────────────────────────────────────────────────────

const YG_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;
type YGOption = (typeof YG_OPTIONS)[number];

function ygLabel(yg: YGOption): string {
  return yg === 0 ? "EYFS" : `Y${yg}`;
}

// ─── Pupil Detail Drawer ──────────────────────────────────────────────────────

function PupilDetailDrawer({ pupil, open, onClose }: { pupil: PupilRecord; open: boolean; onClose: () => void }) {
  const demo = pupil.demographics;
  const flags = [demo.isFsm && "FSM", demo.isSend && "SEND", demo.isEal && "EAL"].filter(Boolean) as string[];
  const trend = overallTrend(pupil.journey);
  const ctx = contextPanel(demo, trend);
  const weak = weakestSubject(pupil.journey);

  const subjectsByYear = ["reading", "writing", "maths"].map((subj) => {
    const entries = pupil.journey
      .filter((j) => j.subject === subj)
      .sort((a, b) => a.yearGroup - b.yearGroup);
    return { subj, entries };
  });

  const edPrompt = weak
    ? `Create an intervention plan for pupil ${pupil.pupilId} who needs focus on ${weak.subject}. ` +
      `Demographics: ${flags.join(", ") || "no additional flags"}. ` +
      `Year groups in journey: ${[...new Set(pupil.journey.map((j) => "Y" + j.yearGroup))].join(", ")}. ` +
      `Use EEF-evidenced strategies and produce a 6-week plan with weekly check-ins.`
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right overflow-y-auto"
          aria-describedby="pupil-detail-desc"
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  trend === "declining" ? "bg-red-100 text-red-700" :
                  trend === "improving" ? "bg-green-100 text-green-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {pupil.pupilId.split(" ").map((w) => w[0]).join("")}
                </div>
                <div>
                  <Dialog.Title className="text-sm font-semibold text-gray-900">{pupil.pupilId}</Dialog.Title>
                  <div className="flex items-center gap-1 mt-0.5">
                    {flags.map((f) => (
                      <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        f === "FSM" ? "bg-amber-100 text-amber-700" :
                        f === "SEND" ? "bg-purple-100 text-purple-700" :
                        "bg-cyan-100 text-cyan-700"
                      }`}>{f}</span>
                    ))}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      demo.gender === "M" ? "bg-blue-100 text-blue-600" :
                      demo.gender === "F" ? "bg-pink-100 text-pink-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {demo.gender === "M" ? "Male" : demo.gender === "F" ? "Female" : demo.gender}
                    </span>
                  </div>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="p-1 rounded hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" aria-label="Close">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description id="pupil-detail-desc" className="sr-only">
              Full assessment journey for {pupil.pupilId}
            </Dialog.Description>

            {/* Full journey per subject */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assessment Journey</div>
              <div className="space-y-2">
                {subjectsByYear.map(({ subj, entries }) => (
                  <div key={subj} className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="text-xs font-semibold text-gray-600 uppercase mb-2">{subj}</div>
                    {entries.length === 0 ? (
                      <span className="text-xs text-gray-400">No data</span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entries.map((e, i) => (
                          <div key={i} className="flex items-center gap-1">
                            {i > 0 && <span className="text-gray-300 text-xs">→</span>}
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                              e.level === "GDS" ? "bg-green-100 text-green-700" :
                              e.level === "EXS" || e.level === "2" ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-700"
                            }`} title={`Y${e.yearGroup} (${e.year})`}>
                              {e.level}
                            </span>
                            <span className="text-[9px] text-gray-400">Y{e.yearGroup}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Context panel */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-blue-900 mb-1">Context &amp; considerations</div>
              <p className="text-xs text-blue-800 leading-relaxed">{ctx}</p>
            </div>

            {/* EEF intervention suggestion */}
            {weak && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-amber-900 mb-1">Suggested focus area</div>
                <p className="text-xs text-amber-800">
                  {weak.subject.charAt(0).toUpperCase() + weak.subject.slice(1)} has the lowest average across recorded assessments (avg level {weak.avgLevel.toFixed(1)}).
                  EEF-evidenced strategies for this area include structured feedback, reciprocal teaching, and targeted small-group intervention.
                </p>
                {edPrompt && (
                  <button
                    onClick={() => window.open(`/dashboard/ed?prompt=${encodeURIComponent(edPrompt)}`, "_blank")}
                    className="mt-2 text-[10px] px-2 py-0.5 rounded bg-amber-600 text-white hover:bg-amber-700 transition-colors font-medium"
                  >
                    Generate 6-week plan with Ed &rarr;
                  </button>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PupilCardGrid({ pupils, spotlightPupilId }: PupilCardGridProps) {
  // Default to Y6 (most relevant for governor discussions)
  const [selectedYg, setSelectedYg] = useState<YGOption | "all">("all");
  const [selectedPupil, setSelectedPupil] = useState<PupilRecord | null>(null);

  // Exclude spotlight pupil from grid
  const gridPupils = spotlightPupilId
    ? pupils.filter((p) => p.pupilId !== spotlightPupilId)
    : pupils;

  // Compute per-year-group counts based on highest yearGroup in journey
  const ygCounts = YG_OPTIONS.reduce<Record<number, number>>((acc, yg) => {
    acc[yg] = gridPupils.filter((p) => {
      const maxYg = Math.max(...p.journey.map((j) => j.yearGroup));
      return yg === 0 ? maxYg === 0 : maxYg === yg;
    }).length;
    return acc;
  }, {} as Record<number, number>);

  // Filter pupils by selected year group
  const filteredPupils = selectedYg === "all"
    ? gridPupils
    : gridPupils.filter((p) => {
        const maxYg = Math.max(...p.journey.map((j) => j.yearGroup));
        return selectedYg === 0 ? maxYg === 0 : maxYg === selectedYg;
      });

  return (
    <div>
      {/* ── Year group filter chips ── */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <button
          onClick={() => setSelectedYg("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selectedYg === "all"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All ({gridPupils.length})
        </button>
        {YG_OPTIONS.map((yg) => {
          const count = ygCounts[yg] ?? 0;
          if (count === 0) return null;
          const active = selectedYg === yg;
          return (
            <button
              key={yg}
              onClick={() => setSelectedYg(yg)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {ygLabel(yg)} ({count})
            </button>
          );
        })}
      </div>

      {filteredPupils.length === 0 ? (
        <p className="text-xs text-gray-400 py-4">No pupils in this year group with multi-year tracking data.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[620px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {filteredPupils.map((pupil, pidx) => {
              const demo = pupil.demographics;
              const flags = [demo.isFsm && "FSM", demo.isSend && "SEND", demo.isEal && "EAL"].filter(Boolean) as string[];
              const yearGroups = [...new Set(pupil.journey.map((j) => j.yearGroup))].sort((a, b) => a - b);
              const trend = overallTrend(pupil.journey);
              const latestEntries = pupil.journey.filter((j) => j.year === Math.max(...pupil.journey.map((jj) => jj.year)));
              const atExpected = latestEntries.filter((j) => ["EXS", "GDS", "2"].includes(j.level)).length;
              const totalSubjects = latestEntries.length;
              const ctx = contextPanel(demo, trend);

              return (
                <motion.div
                  key={`${pupil.pupilId}-${pidx}`}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", damping: 30, stiffness: 250, delay: pidx * 0.015 }}
                  whileHover={{ y: -2, transition: { type: "spring", damping: 30, stiffness: 250 } }}
                  onClick={() => setSelectedPupil(pupil)}
                  className={`border rounded-xl p-3 text-xs cursor-pointer hover:shadow-md transition-shadow ${
                    trend === "declining" ? "border-red-200 bg-red-50/30" :
                    trend === "improving" ? "border-green-200 bg-green-50/30" :
                    "border-gray-200 bg-white"
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        trend === "declining" ? "bg-red-100 text-red-700" :
                        trend === "improving" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {pupil.pupilId.split(" ").map((w) => w[0]).join("")}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">{pupil.pupilId}</div>
                        <div className="text-gray-400">Y{yearGroups.join("→Y")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {flags.map((f) => (
                        <span key={f} className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          f === "FSM" ? "bg-amber-100 text-amber-700" :
                          f === "SEND" ? "bg-purple-100 text-purple-700" :
                          "bg-cyan-100 text-cyan-700"
                        }`}>{f}</span>
                      ))}
                    </div>
                  </div>

                  {/* Latest assessment levels */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {latestEntries.map((e, i) => (
                      <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        e.level === "GDS" ? "bg-green-100 text-green-700" :
                        e.level === "EXS" || e.level === "2" ? "bg-blue-100 text-blue-700" :
                        "bg-red-100 text-red-700"
                      }`} title={e.subject}>
                        {e.subject.slice(0, 1).toUpperCase()}: {e.level}
                      </span>
                    ))}
                  </div>

                  {/* Summary row */}
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span>{atExpected}/{totalSubjects} at expected+</span>
                    <span className={`font-semibold ${
                      trend === "improving" ? "text-green-600" :
                      trend === "declining" ? "text-red-600" :
                      "text-gray-500"
                    }`}>
                      {trend === "improving" ? "↑ Improving" : trend === "declining" ? "↓ Needs attention" : "→ Stable"}
                    </span>
                  </div>

                  {/* Context panel (truncated) */}
                  <div className="bg-gray-50 rounded-lg border border-gray-100 p-2 text-[10px] text-gray-500 leading-relaxed line-clamp-2">
                    {ctx}
                  </div>

                  <div className="mt-2 text-[10px] text-gray-400 text-right">Click for full journey →</div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail drawer */}
      {selectedPupil && (
        <PupilDetailDrawer
          pupil={selectedPupil}
          open={!!selectedPupil}
          onClose={() => setSelectedPupil(null)}
        />
      )}
    </div>
  );
}
