import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { URN_PREDECESSORS } from '@/lib/trust-analysis/types';
import { computeStaffingRatios } from '@/lib/trust-analysis/staffing-ratios';

/**
 * GET /api/trust-analysis/staffing
 * Returns per-school workforce data (FTE teachers, TAs, support, total)
 * joined with number_of_pupils from dfe_data.schools for pupil-teacher ratio computation.
 *
 * Scoped to the caller's organization tree (their own org + any child schools).
 * Previously hardcoded ALL_PENNINE_URNS — meant every trust saw PAYMAT data.
 *
 * Uses most recent year where fte_teachers is populated for each school.
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  // ── Resolve which URNs this caller's org actually covers ─────────────────
  const orgId = req.nextUrl.searchParams.get('organizationId') || auth.organizationId;
  const effectiveUrns = new Set<number>();

  if (orgId) {
    const { data: orgRows } = await supabase
      .from('organizations')
      .select('id, urn')
      .or(`id.eq.${orgId},parent_organization_id.eq.${orgId}`);
    for (const row of orgRows ?? []) {
      const raw = row.urn;
      if (raw === null || raw === undefined) continue;
      const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
      if (Number.isFinite(n)) effectiveUrns.add(n);
    }
    for (const urn of Array.from(effectiveUrns)) {
      const pred = URN_PREDECESSORS[urn];
      if (pred) effectiveUrns.add(pred.oldUrn);
    }
  }

  if (effectiveUrns.size === 0) {
    // No URNs in scope — return empty rather than leak other trusts' data.
    return apiSuccess({ staffing: {} });
  }

  const urnList = Array.from(effectiveUrns);

  // Build reverse map: old URN → current URN
  const oldToNew = new Map<number, number>();
  for (const [currentUrn, { oldUrn }] of Object.entries(URN_PREDECESSORS)) {
    oldToNew.set(oldUrn, Number(currentUrn));
  }

  // Fetch workforce data — most recent row per URN where fte_teachers is not null.
  // We order by urn + academic_year_end desc so we can pick the top per URN.
  const { data: workforceRaw, error: workforceError } = await supabase
    .from('workforce')
    .select('urn, academic_year_end, fte_teachers, fte_teaching_assistants, fte_support_staff, fte_total')
    .in('urn', urnList)
    .not('fte_teachers', 'is', null)
    .order('urn', { ascending: true })
    .order('academic_year_end', { ascending: false });

  if (workforceError) {
    return apiError(`Failed to fetch workforce data: ${workforceError.message}`, 500);
  }

  // Fetch schools for number_of_pupils
  const { data: schoolsRaw, error: schoolsError } = await supabase
    .from('schools')
    .select('urn, number_of_pupils')
    .in('urn', urnList);

  if (schoolsError) {
    return apiError(`Failed to fetch schools data: ${schoolsError.message}`, 500);
  }

  // Build pupil count map (resolve old URN → current URN)
  const pupilsByUrn = new Map<number, number | null>();
  for (const row of (schoolsRaw ?? []) as { urn: number; number_of_pupils: number | null }[]) {
    const rawUrn = Number(row.urn);
    const currentUrn = oldToNew.get(rawUrn) ?? rawUrn;
    if (!pupilsByUrn.has(currentUrn)) {
      pupilsByUrn.set(currentUrn, row.number_of_pupils != null ? Number(row.number_of_pupils) : null);
    }
  }

  // Pick most recent row per URN (rows are already ordered desc by year)
  const seenUrns = new Set<number>();
  const staffingByUrn: Record<number, {
    urn: number;
    numberOfPupils: number | null;
    fteTeachers: number | null;
    fteTA: number | null;
    fteSupport: number | null;
    fteTotal: number | null;
    year: number;
    pupilTeacherRatio: number | null;
    pupilAdultRatio: number | null;
  }> = {};

  for (const row of (workforceRaw ?? []) as {
    urn: number;
    academic_year_end: number;
    fte_teachers: number | null;
    fte_teaching_assistants: number | null;
    fte_support_staff: number | null;
    fte_total: number | null;
  }[]) {
    const rawUrn = Number(row.urn);
    const currentUrn = oldToNew.get(rawUrn) ?? rawUrn;

    if (seenUrns.has(currentUrn)) continue;
    seenUrns.add(currentUrn);

    const numberOfPupils = pupilsByUrn.get(currentUrn) ?? null;
    const fteTeachers = row.fte_teachers != null ? Number(row.fte_teachers) : null;
    const fteTA = row.fte_teaching_assistants != null ? Number(row.fte_teaching_assistants) : null;
    const fteSupport = row.fte_support_staff != null ? Number(row.fte_support_staff) : null;
    const fteTotal = row.fte_total != null ? Number(row.fte_total) : null;

    const { pupilTeacherRatio, pupilAdultRatio } = computeStaffingRatios({
      numberOfPupils,
      fteTeachers,
      fteTotal,
      fteTeachingAssistants: fteTA,
    });

    staffingByUrn[currentUrn] = {
      urn: currentUrn,
      numberOfPupils,
      fteTeachers,
      fteTA,
      fteSupport,
      fteTotal,
      year: Number(row.academic_year_end),
      pupilTeacherRatio,
      pupilAdultRatio,
    };
  }

  return apiSuccess({ staffing: staffingByUrn });
}, { orgOptional: true });
