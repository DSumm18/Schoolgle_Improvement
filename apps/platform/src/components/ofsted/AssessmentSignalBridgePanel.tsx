"use client";

import { useState } from "react";
import { ArrowRight, ClipboardCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AssessmentSignalBridgePanel({
  organizationId,
  onFindingsCreated,
}: {
  organizationId: string;
  onFindingsCreated?: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function generateFindings() {
    if (!organizationId) return;
    setLoading(true);
    try {
      const response = await fetch("/api/ofsted/findings/assessment-signals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Could not create assessment signal findings");
      }
      const total = payload?.data?.total ?? payload?.total ?? 0;
      toast.success(
        total > 0
          ? `Created or refreshed ${total} assessment intelligence finding${total === 1 ? "" : "s"}.`
          : "No assessment intelligence findings need action right now.",
      );
      onFindingsCreated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create assessment signal findings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-950 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:text-indigo-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-indigo-600 p-2 text-white">
            <ClipboardCheck size={18} />
          </div>
          <div>
            <h2 className="text-base font-semibold">Assessment Intelligence → Ofsted Readiness</h2>
            <p className="mt-1 max-w-3xl text-sm opacity-80">
              Pull teacher-locked captures, CTF/MIS imports and Assessment Creator evidence into source-labelled Ofsted findings.
              This creates the action trail without changing the original Drive or MIS files.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={generateFindings}
          disabled={loading || !organizationId}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
          Generate findings
        </button>
      </div>
    </section>
  );
}
