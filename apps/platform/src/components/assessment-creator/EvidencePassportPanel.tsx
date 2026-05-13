"use client";

import type { EvidencePassport } from "@/lib/assessment-creator/types";

export function EvidencePassportPanel({ passport }: { passport: EvidencePassport }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Evidence Passport</p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">Teacher-reviewed assessment evidence</h2>
          <p className="mt-1 text-sm text-gray-600">Ready to feed Trust Assessor confidence and Ofsted Readiness evidence mapping.</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">{passport.evidenceConfidence} confidence</span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Objective coverage" value={`${Math.round(passport.objectiveCoverage * 100)}%`} />
        <Metric label="Review complete" value={`${Math.round(passport.markingReviewCompletion * 100)}%`} />
        <Metric label="Uncertainty" value={`${Math.round(passport.unresolvedUncertainty * 100)}%`} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Confidence reasons</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {passport.confidenceReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Next teaching actions</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {passport.nextTeachingActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-950">Trust Assessor can now compare submitted levels against reviewed evidence.</div>
        <div className="rounded-lg bg-purple-50 p-4 text-sm text-purple-950">Ofsted Readiness can link this as normal assessment practice, not inspection paperwork.</div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
