"use client";

import type { AssessmentBlueprint } from "@/lib/assessment-creator/types";

interface BlueprintReviewProps {
  blueprint: AssessmentBlueprint;
  onChange: (blueprint: AssessmentBlueprint) => void;
  onApprove: () => void;
  onBack: () => void;
}

export function BlueprintReview({ blueprint, onChange, onApprove, onBack }: BlueprintReviewProps) {
  function updateBlend(key: keyof AssessmentBlueprint["blend"], value: number) {
    onChange({
      ...blueprint,
      blend: {
        ...blueprint.blend,
        [key]: value,
      },
    });
  }

  function updateMetric(key: "pressureRating" | "workloadRating", value: number) {
    onChange({
      ...blueprint,
      [key]: value as AssessmentBlueprint[typeof key],
    });
  }

  const blend = [
    ["Taught curriculum", "taughtCurriculum", blueprint.blend.taughtCurriculum, "What the school says has been taught"] as const,
    ["National expectation", "nationalExpectation", blueprint.blend.nationalExpectation, "Public year-group expectations"] as const,
    ["Retention", "retention", blueprint.blend.retention, "Earlier learning pupils may have forgotten"] as const,
    ["Statutory readiness", "statutoryReadiness", blueprint.blend.statutoryReadiness, "Light SATs-style exposure, kept low in Pilot 1"] as const,
  ] as const;

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Review and tune blueprint</h2>
          <p className="mt-1 text-sm text-muted-foreground">Nothing is issued until a teacher agrees the balance, pressure and workload feel right.</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          <p className="font-semibold">Teacher decision point</p>
          <p className="mt-1 text-xs">Change these settings before approving the paper pack.</p>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Curriculum source</p>
            <h3 className="mt-1 text-base font-semibold text-blue-950">{blueprint.curriculumScheme.name}</h3>
            <p className="mt-1 text-sm text-blue-900">{blueprint.curriculumScheme.coverageNote}</p>
          </div>
          <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-blue-800">
            {blueprint.curriculumScheme.provider}
          </span>
        </div>
        {blueprint.curriculumScheme.status === "sample" && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Prototype sample only. Live papers should be generated from the school’s own taught curriculum map and any source material the school is allowed to use.
          </p>
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {blend.map(([label, key, value, helper]) => (
            <div key={label} className="rounded-lg border border-border p-3">
              <div className="mb-1 flex justify-between text-xs font-medium text-gray-600">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${value}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={80}
                step={5}
                value={value}
                onChange={(event) => updateBlend(key, Number(event.target.value))}
                className="mt-3 w-full accent-blue-600"
                aria-label={`${label} weighting`}
              />
              <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-lg border border-border p-4">
          <EditableRating
            label="Pupil pressure"
            value={blueprint.pressureRating}
            helper="How test-like this should feel for pupils."
            onChange={(value) => updateMetric("pressureRating", value)}
          />
          <EditableRating
            label="Teacher workload"
            value={blueprint.workloadRating}
            helper="How much marking and review burden this creates."
            onChange={(value) => updateMetric("workloadRating", value)}
          />
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-foreground">Duration</span>
              <span className="text-muted-foreground">{blueprint.durationMinutes} min</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={blueprint.durationMinutes}
              onChange={(event) => onChange({ ...blueprint, durationMinutes: Number(event.target.value) })}
              className="w-full accent-blue-600"
              aria-label="Assessment duration"
            />
          </div>
          <Metric label="Mode" value={blueprint.mode.replaceAll("_", " ")} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-foreground">Objectives checked</h3>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {blueprint.objectives.map((objective) => (
            <div key={objective.id} className="rounded-md border border-border p-3">
              <p className="text-sm font-medium text-foreground">{objective.label}</p>
              <p className="mt-1 text-xs text-gray-500">{objective.source.replaceAll("_", " ")} - {objective.strand}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={onBack} className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted">
          Back
        </button>
        <button type="button" onClick={onApprove} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Approve blueprint
        </button>
      </div>
    </section>
  );
}

function EditableRating({ label, value, helper, onChange }: { label: string; value: number; helper: string; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`h-8 flex-1 rounded-md border text-xs font-semibold transition ${rating <= value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            {rating}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}
