"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Clock, XCircle, ExternalLink } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CheckpointStatus = "external" | "self-reported" | "mixed" | "future" | "no-data" | "loading";

export interface Checkpoint {
  id: string;
  label: string;
  yearGroup: string;
  academicYearLabel: string;
  validation: CheckpointStatus;
  value: string | null;
  source: string;
  note?: string;
}

export interface CohortPathway {
  receptionYear: number;
  cohortLabel: string;
  currentYearGroup: string;
  checkpoints: Checkpoint[];
}

export interface CohortPassportData {
  cohorts: CohortPathway[];
  phonicsAvailable: boolean;
  mtcAvailable: boolean;
}

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  CheckpointStatus,
  { icon: React.ComponentType<{ size: number; className?: string }>; label: string; cellBg: string; cellBorder: string; badgeBg: string; iconClass: string }
> = {
  external: {
    icon: CheckCircle2,
    label: "External",
    cellBg: "bg-emerald-500/8",
    cellBorder: "border-emerald-500/20",
    badgeBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    iconClass: "text-emerald-500",
  },
  "self-reported": {
    icon: AlertTriangle,
    label: "Self-reported",
    cellBg: "bg-amber-500/8",
    cellBorder: "border-amber-500/20",
    badgeBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    iconClass: "text-amber-500",
  },
  mixed: {
    icon: AlertTriangle,
    label: "Mixed",
    cellBg: "bg-amber-500/5",
    cellBorder: "border-amber-500/15",
    badgeBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    iconClass: "text-amber-400",
  },
  future: {
    icon: Clock,
    label: "Not yet taken",
    cellBg: "bg-muted/30",
    cellBorder: "border-border",
    badgeBg: "bg-muted text-muted-foreground border-border",
    iconClass: "text-muted-foreground/50",
  },
  "no-data": {
    icon: XCircle,
    label: "No data",
    cellBg: "bg-red-500/8",
    cellBorder: "border-red-500/20",
    badgeBg: "bg-red-500/10 text-red-600 border-red-500/20",
    iconClass: "text-red-500",
  },
  loading: {
    icon: Clock,
    label: "Loading…",
    cellBg: "bg-muted/20",
    cellBorder: "border-border",
    badgeBg: "bg-muted text-muted-foreground border-border",
    iconClass: "text-muted-foreground/40",
  },
};

// ─── Checkpoint header config ─────────────────────────────────────────────────

const CHECKPOINT_HEADERS = [
  { id: "eyfs-gld", label: "EYFS GLD", yearGroup: "Reception", validation: "Teacher/moderated" },
  { id: "phonics-y1", label: "Phonics Y1", yearGroup: "Year 1", validation: "External test" },
  { id: "phonics-y2", label: "Phonics Y2 retake", yearGroup: "Year 2", validation: "External test" },
  { id: "ks1", label: "KS1 SATs", yearGroup: "Year 2", validation: "External (to 2022/23) then self-reported" },
  { id: "mtc-y4", label: "MTC Y4", yearGroup: "Year 4", validation: "External test" },
  { id: "mid-year", label: "Mid-year assessments", yearGroup: "Y3–Y5", validation: "Self-reported" },
  { id: "ks2", label: "KS2 SATs", yearGroup: "Year 6", validation: "Fully external" },
];

// ─── Cell component ───────────────────────────────────────────────────────────

function PassportCell({ checkpoint }: { checkpoint: Checkpoint }) {
  const cfg = STATUS_CONFIG[checkpoint.validation];
  const Icon = cfg.icon;

  return (
    <div
      className={`rounded-lg border p-2.5 min-h-[72px] flex flex-col gap-1.5 ${cfg.cellBg} ${cfg.cellBorder}`}
      title={checkpoint.source + (checkpoint.note ? "\n" + checkpoint.note : "")}
    >
      <div className="flex items-center gap-1.5">
        <Icon size={13} className={cfg.iconClass} />
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cfg.badgeBg}`}>
          {cfg.label}
        </span>
      </div>
      {checkpoint.value ? (
        <span className="text-sm font-bold text-foreground leading-none">{checkpoint.value}</span>
      ) : checkpoint.validation === "future" ? (
        <span className="text-xs text-muted-foreground/50">—</span>
      ) : checkpoint.validation === "loading" ? (
        <span className="text-xs text-muted-foreground/50 italic">coming soon</span>
      ) : (
        <span className="text-xs text-muted-foreground/60 italic">no data</span>
      )}
      {checkpoint.note && (
        <span className="text-[10px] text-muted-foreground/60 leading-tight">{checkpoint.note}</span>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CohortPassportProps {
  cohorts: CohortPathway[];
  loading?: boolean;
  phonicsAvailable?: boolean;
  mtcAvailable?: boolean;
  schoolName: string;
}

export function CohortPassport({
  cohorts,
  loading = false,
  phonicsAvailable = false,
  mtcAvailable = false,
  schoolName,
}: CohortPassportProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", damping: 30, stiffness: 250 }}
    >
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 uppercase tracking-wider">
                Cohort Validation Passport
              </span>
            </div>
            <h4 className="text-base font-semibold text-foreground leading-tight">
              Trust the external — scrutinise the self-reported
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Every external checkpoint {schoolName}&apos;s cohorts have been through, mapped against teacher-assessed judgements. Green is verified. Amber is trust.
            </p>
          </div>
        </div>

        {/* Callout above: the gap */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/8 px-4 py-3.5 space-y-1">
          <p className="text-sm font-semibold text-sky-600">
            Four years of teacher-assessed judgement with no external check
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            Between Y2 KS1 (externally moderated until 2022/23) and Y6 KS2 (externally marked), there are{" "}
            <span className="font-semibold">four years of teacher-assessed judgement</span> with no external verification. This is where assessment drift happens unnoticed — and where a surprise at KS2 becomes a crisis rather than a data point. Schoolgle&apos;s continuous assessment layer closes this gap.
          </p>
        </div>

        {/* Data availability notice */}
        {(!phonicsAvailable || !mtcAvailable) && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-2.5 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              {!phonicsAvailable && !mtcAvailable
                ? "Phonics Screening and MTC data imports are still loading from DfE sources. Cells will update automatically when complete."
                : !phonicsAvailable
                ? "Phonics Screening data is still loading from DfE sources."
                : "Multiplication Tables Check (MTC) data is still loading from DfE sources."}
              {" "}KS2 data (fully external) is available now.
            </p>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="min-w-[700px]">
            {/* Column headers */}
            <div className="grid grid-cols-[140px_repeat(7,minmax(90px,1fr))] gap-2 mb-2">
              <div className="text-xs font-semibold text-muted-foreground px-1 py-2 flex items-end">
                Cohort
              </div>
              {CHECKPOINT_HEADERS.map((h) => (
                <div key={h.id} className="text-center px-1 py-1.5">
                  <div className="text-xs font-semibold text-foreground leading-tight">{h.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{h.yearGroup}</div>
                  <div
                    className={`mt-1 inline-block text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${
                      h.validation.startsWith("External")
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : h.validation.startsWith("Self")
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {h.validation.startsWith("External") ? "External" : h.validation.startsWith("Self") ? "Self-reported" : "Mixed"}
                  </div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[140px_repeat(7,minmax(90px,1fr))] gap-2 mb-2 animate-pulse">
                  <div className="h-[72px] bg-muted/40 rounded-lg" />
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="h-[72px] bg-muted/20 rounded-lg" />
                  ))}
                </div>
              ))
            ) : (
              cohorts.map((cohort, rowIdx) => (
                <motion.div
                  key={cohort.receptionYear}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ type: "spring", damping: 30, stiffness: 250, delay: rowIdx * 0.07 }}
                  className="grid grid-cols-[140px_repeat(7,minmax(90px,1fr))] gap-2 mb-2"
                >
                  {/* Cohort label cell */}
                  <div className="flex flex-col justify-center px-2 py-2">
                    <span className="text-xs font-semibold text-foreground leading-tight">{cohort.currentYearGroup}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Started Reception</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {cohort.receptionYear}/{String(cohort.receptionYear + 1).slice(2)}
                    </span>
                  </div>
                  {/* Checkpoint cells */}
                  {CHECKPOINT_HEADERS.map((h) => {
                    const checkpoint = cohort.checkpoints.find((c) => c.id === h.id);
                    if (!checkpoint) {
                      return (
                        <PassportCell
                          key={h.id}
                          checkpoint={{
                            id: h.id,
                            label: h.label,
                            yearGroup: h.yearGroup,
                            academicYearLabel: "",
                            validation: "future",
                            value: null,
                            source: "Not yet reached",
                          }}
                        />
                      );
                    }
                    return <PassportCell key={h.id} checkpoint={checkpoint} />;
                  })}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 flex-wrap pt-1 border-t border-border">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Legend:</span>
          {(["external", "self-reported", "future", "no-data"] as CheckpointStatus[]).map((status) => {
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <span key={status} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Icon size={12} className={cfg.iconClass} />
                {cfg.label}
              </span>
            );
          })}
        </div>

        {/* Callout below: the insight */}
        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3.5">
          <p className="text-sm text-foreground/80 leading-relaxed">
            <span className="font-semibold text-foreground">Every ✅ is checked externally. Every ⚠ is trust.</span>{" "}
            When you see a cohort with multiple amber cells between external checkpoints and then a surprise at KS2, the question isn&apos;t &ldquo;why did they decline&rdquo; — it&apos;s &ldquo;why weren&apos;t they checked sooner.&rdquo; The passport shows you where your trust&apos;s blind spots are, before Ofsted finds them.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
