"use client";

import { ArrowRight, CheckCircle2, CircleDashed, Lock } from "lucide-react";
import type { AssessmentJourneyLayer } from "@/lib/assessment-intelligence/spine-adapter";

const STATUS_STYLES: Record<AssessmentJourneyLayer["status"], string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-100",
  optional: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-100",
  locked: "border-border bg-muted/30 text-muted-foreground",
};

export function DataFoundationJourney({ layers }: { layers: AssessmentJourneyLayer[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            School improvement data journey
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            From DfE overview to Ofsted-ready action trail
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Each layer stays labelled so public data, school judgements and pupil-level evidence never get blended into one misleading number.
          </p>
        </div>
        <a
          href="/dashboard/ofsted-readiness"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
        >
          Open Ofsted Readiness
          <ArrowRight size={14} />
        </a>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {layers.map((layer) => (
          <article
            key={layer.id}
            className={`rounded-xl border p-4 ${STATUS_STYLES[layer.status]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm font-semibold">{layer.title}</div>
              {layer.status === "ready" ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : layer.status === "optional" ? (
                <CircleDashed size={16} className="text-blue-600" />
              ) : (
                <Lock size={16} />
              )}
            </div>
            <div className="mt-3 inline-flex rounded-full border border-current/15 bg-white/50 px-2 py-0.5 text-[11px] font-semibold dark:bg-black/10">
              {layer.badge}
            </div>
            <p className="mt-3 text-xs leading-relaxed opacity-80">{layer.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
