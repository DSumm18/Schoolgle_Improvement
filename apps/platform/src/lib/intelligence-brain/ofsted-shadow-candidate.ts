import type { SupabaseClient } from "@supabase/supabase-js";

export interface OfstedShadowCandidateSnapshot {
  baselineComparable: Record<string, number | string | null>;
  candidateVersion: string;
  evidenceAreaCount: number;
}

interface EvidenceGapRow {
  status: "present" | "missing" | "outdated" | "weak";
  evidence_count: number | null;
  analyzed_at: string | null;
}

const STATUS_TO_READINESS_POINTS: Record<EvidenceGapRow["status"], number> = {
  present: 100,
  weak: 70,
  outdated: 40,
  missing: 10,
};

/**
 * Build a comparable readiness snapshot from cached framework gap rows.
 *
 * Notes:
 * - This is a shadow candidate only. It does not replace the primary Ofsted
 *   readiness calculation in phase 1.
 * - It intentionally uses a coarse deterministic status-to-points mapping
 *   so we can run safe parallel comparisons before any production switch.
 */
export async function buildOfstedShadowCandidate(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OfstedShadowCandidateSnapshot | null> {
  const { data, error } = await supabase
    .from("evidence_gap_results")
    .select("status, evidence_count, analyzed_at")
    .eq("organization_id", organizationId)
    .eq("framework", "ofsted");

  if (error || !data || data.length === 0) {
    return null;
  }

  const rows = data as EvidenceGapRow[];
  const totalAreas = rows.length;

  const readinessPoints = rows.reduce((sum, row) => {
    return sum + STATUS_TO_READINESS_POINTS[row.status];
  }, 0);

  const overallScore = Math.round(readinessPoints / totalAreas);

  const criticalGaps = rows.filter(
    (row) => row.status === "missing" || row.status === "outdated",
  ).length;

  const totalEvidence = rows.reduce(
    (sum, row) => sum + (row.evidence_count ?? 0),
    0,
  );

  const latestAnalyzedAt = rows
    .map((row) => row.analyzed_at)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse()[0];

  return {
    baselineComparable: {
      overall_score: overallScore,
      critical_gaps: criticalGaps,
      total_evidence: totalEvidence,
      areas_analyzed: totalAreas,
      candidate_last_analyzed_at: latestAnalyzedAt ?? null,
    },
    candidateVersion: "gap-cache-v1",
    evidenceAreaCount: totalAreas,
  };
}
