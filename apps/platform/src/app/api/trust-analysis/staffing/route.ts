import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  buildOldToCurrentUrnMap,
  expandUrnsWithLineage,
  resolveUrnLineage,
} from '@/lib/trust-analysis/urn-lineage';
import { resolveRequestedTrustAnalysisOrganization } from '@/lib/trust-analysis/organization-access';
import { computeStaffingRatios } from '@/lib/trust-analysis/staffing-ratios';

/**
 * GET /api/trust-analysis/staffing
 * Returns per-school workforce data (FTE teachers, TAs, support, total)
 * joined with number_of_pupils from dfe_data.schools for pupil-teacher ratio computation.
 *
 * Scoped to the caller's organization tree (their own org + any child schools).
 * Previously hardcoded to one trust's URNs — meant every trust saw another organisation's data.
 *
 * Uses most recent year where fte_teachers is populated for each school.
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  // Resolve which URNs this caller's org actually covers.
  const access = await resolveRequestedTrustAnalysisOrganization(
    supabase,
    auth.organizationId,
    req.nextUrl.searchParams.get('organizationId'),
  );
  if (!access.allowed) {
    return apiError('You do not have access to this trust or school', 403);
  }

  const orgId = access.organizationId;
  const currentUrns = new Set<number>();

  if (orgId) {
    const { data: orgRows } = await supabase
      .from('organizations')
      .select('id, urn')
      .or(`id.eq.${orgId},parent_organization_id.eq.${orgId}`);

    for (const row of orgRows ?? []) {
      const raw = row.urn;
      if (raw === null || raw === undefined) continue;
      const n = typeof raw === 'string' ? parseInt(raw, 10) : Number(raw);
      if (Number.isFinite(n)) currentUrns.add(n);
    }
  }

  if (currentUrns.size === 0) {
    return apiSuccess({ staffing: {} });
  }

  const currentUrnList = Array.from(currentUrns);
  const urnLineage = await resolveUrnLineage(supabase, currentUrnList);
  const oldToNew = buildOldToCurrentUrnMap(urnLineage);
  const urnList = expandUrnsWithLineage(currentUrnList, urnLineage);

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

  const { data: schoolsRaw, error: schoolsError } = await supabase
    .from('schools')
    .select('urn, number_of_pupils')
    .in('urn', urnList);

  if (schoolsError) {
    return apiError(`Failed to fetch schools data: ${schoolsError.message}`, 500);
  }

  const pupilsByUrn = new Map<number, number | null>();
  for (const row of (schoolsRaw ?? []) as { urn: number; number_of_pupils: number | null }[]) {
    const rawUrn = Number(row.urn);
    const currentUrn = oldToNew.get(rawUrn) ?? rawUrn;
    if (!pupilsByUrn.has(currentUrn)) {
      pupilsByUrn.set(currentUrn, row.number_of_pupils != null ? Number(row.number_of_pupils) : null);
    }
  }

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
