// ─── Trust Assessor Event Emitter ────────────────────────────────────────────
// Converts computed Trust Assessor findings into structured school_events rows.
// Called client-side (useEffect) when a SchoolTab mounts with computed data.

import type { SchoolEventInsert } from './types';
import { EVENT_TYPES } from './registry';

export interface TrustAssessorEmitParams {
  organizationId?: string;  // Optional — API uses authenticated user's org
  school: string;            // Abbreviation e.g. "GHPS"
  schoolName: string;        // Full name e.g. "Grove House Primary"
  schoolUrn: number;

  // Computed findings from the SchoolTab
  nationalPercentile: { pct: number; percentile: number; rank: number; totalSchools: number } | null;
  threeYearAverage: { averagePct: number; yearsUsed: number } | null;
  y6Combined: number | null;

  statAlerts: { severity: 'low' | 'medium' | 'high'; title: string; explanation: string }[];

  forensicVerdict: { severity: 'strong' | 'secure' | 'attention' | 'urgent'; summary: string } | null;

  researchKpis: {
    id: string;
    name: string;
    passed: boolean | null;
    actual: string | null;
    target: string;
    explanation: string;
    citationId: string;
  }[];

  ealTrajectoryConcern: boolean;
  cohortMismatchDetected: boolean;
  authToken?: string;
}

/**
 * Emits Trust Assessor findings as school_events via the batch API.
 *
 * De-duplicates by checking whether any events for this school + academic year
 * already exist before inserting.  This is a best-effort check — if the check
 * fails we still insert (so analytics aren't lost).
 */
export async function emitTrustAssessorEvents(params: TrustAssessorEmitParams): Promise<void> {
  const now = new Date();
  const academicYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const occurredAt = new Date().toISOString();

  // ── 1. Check for existing events (de-dup) ────────────────────────────────
  try {
    const checkRes = await fetch(
      `/api/events?source_app=trust-assessor&school_urn=${params.schoolUrn}&from=${academicYear}-08-01T00:00:00Z&limit=1`,
      {
        headers: authHeaders(params.authToken),
      }
    );
    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (existing?.events?.length > 0) {
        // Events already emitted for this school this academic year — skip
        return;
      }
    }
  } catch {
    // Non-fatal: proceed with insertion
  }

  // ── 2. Build events ─────────────────────────────────────────────────────
  const events: Partial<SchoolEventInsert>[] = [];
  const commonMeta = {
    school: params.school,
    school_urn: params.schoolUrn,
    school_name: params.schoolName,
    academic_year: `${academicYear}/${(academicYear + 1).toString().slice(2)}`,
  };

  // National percentile
  if (params.nationalPercentile) {
    const { percentile, rank, totalSchools } = params.nationalPercentile;
    const isLow = percentile <= 25;
    events.push({
      event_type: 'ta.national-percentile',
      event_category: EVENT_TYPES['ta.national-percentile'].category,
      severity: isLow ? 'high' : percentile <= 50 ? 'medium' : 'info',
      occurred_at: occurredAt,
      title: `${params.schoolName} ranked ${ordinal(percentile)} nationally`,
      description: `KS2 Combined: ${params.y6Combined ?? 'n/a'}% — ranked ${rank} of ${totalSchools} England primary schools (${percentile}th percentile).`,
      impact_summary: isLow
        ? `Bottom quarter nationally. Governors should scrutinise with reference to demographic context.`
        : percentile >= 75
        ? `Top quarter nationally. Strong performance relative to England schools.`
        : `Mid-range nationally. Improvement trajectory should be monitored term-by-term.`,
      source_app: 'trust-assessor',
      metadata: { ...commonMeta, percentile, rank, total_schools: totalSchools, y6_combined: params.y6Combined },
    });
  }

  // Predictive accuracy gap (mid-year vs 3-yr DfE)
  if (params.threeYearAverage && params.y6Combined !== null) {
    const gap = params.y6Combined - params.threeYearAverage.averagePct;
    if (Math.abs(gap) > 8) {
      events.push({
        event_type: 'ta.predictive-accuracy-gap',
        event_category: EVENT_TYPES['ta.predictive-accuracy-gap'].category,
        severity: Math.abs(gap) > 15 ? 'high' : 'medium',
        occurred_at: occurredAt,
        title: `Mid-year vs DfE average gap: ${gap > 0 ? '+' : ''}${gap.toFixed(1)}pp`,
        description: `Self-reported Y6 Combined (${params.y6Combined}%) differs from 3-year DfE average (${params.threeYearAverage.averagePct}%) by ${Math.abs(gap).toFixed(1)}pp.`,
        impact_summary: gap > 0
          ? `School may be over-assessing. Requires rigorous moderation evidence before end-of-year submission.`
          : `School may be under-assessing or facing cohort-specific challenges. Investigate with year group leaders.`,
        source_app: 'trust-assessor',
        metadata: {
          ...commonMeta,
          y6_combined: params.y6Combined,
          dfe_average: params.threeYearAverage.averagePct,
          years_used: params.threeYearAverage.yearsUsed,
          gap_pp: gap,
        },
      });
    }
  }

  // Statistical alerts
  for (const alert of params.statAlerts) {
    events.push({
      event_type: 'ta.statistical-alert',
      event_category: EVENT_TYPES['ta.statistical-alert'].category,
      severity: alert.severity,
      occurred_at: occurredAt,
      title: alert.title,
      description: alert.explanation,
      impact_summary: `Data integrity issue detected. Verify source assessment records before trust board reporting.`,
      source_app: 'trust-assessor',
      metadata: { ...commonMeta, alert_title: alert.title },
    });
  }

  // Forensic verdict
  if (params.forensicVerdict) {
    const fv = params.forensicVerdict;
    const severityMap: Record<string, SchoolEventInsert['severity']> = {
      strong: 'info',
      secure: 'low',
      attention: 'medium',
      urgent: 'high',
    };
    events.push({
      event_type: 'ta.forensic-finding',
      event_category: EVENT_TYPES['ta.forensic-finding'].category,
      severity: severityMap[fv.severity] ?? 'medium',
      occurred_at: occurredAt,
      title: `Forensic verdict: ${fv.severity.charAt(0).toUpperCase() + fv.severity.slice(1)}`,
      description: fv.summary,
      impact_summary: fv.severity === 'urgent'
        ? `Requires immediate governor-level review. Commission external moderation.`
        : fv.severity === 'attention'
        ? `School leader should review demographic-adjusted expectations with year group leads.`
        : `Assessment appears broadly proportionate to demographic profile.`,
      source_app: 'trust-assessor',
      metadata: { ...commonMeta, forensic_severity: fv.severity },
    });
  }

  // Failed research KPIs
  const failedKpis = params.researchKpis.filter((k) => k.passed === false);
  for (const kpi of failedKpis) {
    events.push({
      event_type: 'ta.research-kpi-failed',
      event_category: EVENT_TYPES['ta.research-kpi-failed'].category,
      severity: 'high',
      occurred_at: occurredAt,
      title: `Research KPI failed: ${kpi.name}`,
      description: `${kpi.explanation} Target: ${kpi.target}. Actual: ${kpi.actual ?? 'no data'}.`,
      impact_summary: `This school is not meeting the benchmark expected by peer-reviewed research for schools of this demographic. The gap requires a targeted improvement plan.`,
      source_app: 'trust-assessor',
      metadata: { ...commonMeta, kpi_id: kpi.id, kpi_name: kpi.name, kpi_target: kpi.target, kpi_actual: kpi.actual, citation_id: kpi.citationId },
    });
  }

  // EAL trajectory concern
  if (params.ealTrajectoryConcern) {
    events.push({
      event_type: 'ta.eal-trajectory-concern',
      event_category: EVENT_TYPES['ta.eal-trajectory-concern'].category,
      severity: 'medium',
      occurred_at: occurredAt,
      title: `EAL pupil trajectory below national EAL average`,
      description: `Pupils with English as an additional language at this school are progressing below the national average for EAL cohorts. This may indicate insufficient EAL support staffing or resources.`,
      impact_summary: `Review EAL support provision. Consider additional staff training or specialist EAL teacher deployment.`,
      source_app: 'trust-assessor',
      metadata: { ...commonMeta },
    });
  }

  // Cohort mismatch
  if (params.cohortMismatchDetected) {
    events.push({
      event_type: 'ta.cohort-mismatch',
      event_category: EVENT_TYPES['ta.cohort-mismatch'].category,
      severity: 'high',
      occurred_at: occurredAt,
      title: `Cohort size mismatch detected across year groups`,
      description: `Significant unexplained variation in reported cohort sizes between year groups has been detected. This may indicate data entry errors, unreported pupil movements, or census timing discrepancies.`,
      impact_summary: `Verify census data against MIS rolls. Ensure all in-year transfers are recorded correctly before DfE submission.`,
      source_app: 'trust-assessor',
      metadata: { ...commonMeta },
    });
  }

  if (events.length === 0) return;

  // ── 3. Batch insert ───────────────────────────────────────────────────────
  try {
    await fetch('/api/events/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(params.authToken),
      },
      body: JSON.stringify({ events }),
    });
  } catch (err) {
    // Non-fatal — analytics should not block UI
    console.warn('[emitTrustAssessorEvents] Failed to emit events:', err);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function authHeaders(token?: string): Record<string, string> {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
