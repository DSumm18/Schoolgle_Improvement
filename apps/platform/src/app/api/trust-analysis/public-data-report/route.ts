import { NextRequest } from 'next/server';
import { protectedRoute, apiError, apiSuccess } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  buildOldToCurrentUrnMap,
  expandUrnsWithLineage,
  resolveUrnLineage,
} from '@/lib/trust-analysis/urn-lineage';
import {
  analyseAcademisationImpact,
  type AcademisationImpactOutput,
  type AcademisationMetricRow,
} from '@/lib/trust-analysis/academisation-impact-engine';

type OrgRow = {
  id: string;
  name: string;
  urn: string | number | null;
  organization_type?: string | null;
  school_type?: string | null;
  local_authority?: string | null;
  la_code?: string | null;
  logo_url?: string | null;
  website_url?: string | null;
  address?: string | null;
  settings?: Record<string, unknown> | null;
};

type SchoolRow = {
  urn: number;
  name: string;
  la_code: string | null;
  la_name: string | null;
  type_name: string | null;
  type_group_name: string | null;
  phase_name: string | null;
  status_name: string | null;
  trust_name: string | null;
  number_of_pupils: number | null;
  school_capacity: number | null;
  percentage_fsm: number | null;
  website: string | null;
  telephone: string | null;
  head_title: string | null;
  head_first_name: string | null;
  head_last_name: string | null;
  inspectorate_name: string | null;
  date_of_last_inspection: string | null;
};

type CensusRow = {
  urn: number;
  academic_year_end: number;
  number_on_roll: number | null;
  fsm_pct: number | null;
  eal_pct: number | null;
  sen_pct: number | null;
};

type AttendanceRow = {
  urn: number;
  academic_year_end: number;
  overall_attendance_pct: number | null;
  overall_absence_pct: number | null;
  persistent_absence_pct: number | null;
};

type Ks2Row = {
  urn: number;
  academic_year_end: number;
  subject: string;
  expected_standard_pct: number | null;
  progress_measure_score: number | null;
};

type Ks4Row = {
  urn: number;
  academic_year_end: number;
  time_period: string | null;
  breakdown_topic: string | null;
  breakdown: string | null;
  t_pupils: number | null;
  avg_att8: number | null;
  avg_p8score: number | null;
  pt_5em_94: number | null;
  pt_ebacc_e_ptq_ee: number | null;
  avg_ebaccaps: number | null;
  is_suppressed: boolean | null;
};

type GiasExtendedProfileRow = {
  urn: number;
  school_name: string | null;
  sen_provision_type: string | null;
  resourced_provision_type: string | null;
  resourced_provision_on_roll: number | null;
  resourced_provision_capacity: number | null;
  sen_unit_on_roll: number | null;
  sen_unit_capacity: number | null;
  gias_last_confirmed: string | null;
  source_url: string | null;
  source_method: string | null;
  source_fetched_at: string | null;
  confidence_status: string | null;
  validation_notes: unknown;
  raw_snapshot: {
    total_pupils?: number | null;
    sen_support?: number | null;
    ehc_plan?: number | null;
    sen_unit_flag?: number | null;
    resource_provision_flag?: number | null;
    provision_needs?: Array<{ code: string; label: string; count: number }>;
  } | null;
};

type AcademyImpactReport = AcademisationImpactOutput & {
  conversion_date: string | null;
  predecessor_urn: number;
  predecessor_name: string | null;
};

const LA_MAINTAINED_TYPES = new Set([
  'Community school',
  'Foundation school',
  'Voluntary aided school',
  'Voluntary controlled school',
]);

function asUrn(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return Number.isFinite(n) ? n : null;
}

function round(value: number | null | undefined, dp = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** dp;
  return Math.round(value * factor) / factor;
}

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (valid.length === 0) return null;
  return round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function latestByUrn<T extends { urn: number; academic_year_end: number }>(rows: T[]) {
  const byUrn = new Map<number, T>();
  for (const row of rows) {
    const existing = byUrn.get(row.urn);
    if (!existing || row.academic_year_end > existing.academic_year_end) byUrn.set(row.urn, row);
  }
  return byUrn;
}

function latestValueByUrn<T extends { urn: number; academic_year_end: number }>(
  rows: T[],
  hasValue: (row: T) => boolean,
) {
  const byUrn = new Map<number, T>();
  for (const row of rows) {
    if (!hasValue(row)) continue;
    const existing = byUrn.get(row.urn);
    if (!existing || row.academic_year_end > existing.academic_year_end) byUrn.set(row.urn, row);
  }
  return byUrn;
}

function latestKs2ByUrnAndSubject(rows: Ks2Row[]) {
  const byUrn = new Map<number, Record<string, Ks2Row>>();
  for (const row of rows) {
    const current = byUrn.get(row.urn) ?? {};
    const existing = current[row.subject];
    if (!existing || row.academic_year_end > existing.academic_year_end) current[row.subject] = row;
    byUrn.set(row.urn, current);
  }
  return byUrn;
}

function latestKs4ByUrn(rows: Ks4Row[]) {
  const byUrn = new Map<number, Ks4Row>();
  for (const row of rows) {
    if (row.breakdown_topic !== 'Total' || row.breakdown !== 'Total') continue;
    const existing = byUrn.get(row.urn);
    if (!existing || row.academic_year_end > existing.academic_year_end) byUrn.set(row.urn, row);
  }
  return byUrn;
}

function buildAcademisationMetricRows(args: {
  currentUrn: number;
  predecessorUrn: number;
  censusRows: CensusRow[];
  attendanceRows: AttendanceRow[];
  ks2Rows: Ks2Row[];
}): AcademisationMetricRow[] {
  const urns = new Set([args.currentUrn, args.predecessorUrn]);
  const years = new Set<number>();
  for (const row of args.censusRows) if (urns.has(Number(row.urn))) years.add(Number(row.academic_year_end));
  for (const row of args.attendanceRows) if (urns.has(Number(row.urn))) years.add(Number(row.academic_year_end));
  for (const row of args.ks2Rows) if (urns.has(Number(row.urn))) years.add(Number(row.academic_year_end));

  return [...years].sort((a, b) => a - b).map((year) => {
    const census = args.censusRows.find((row) => urns.has(Number(row.urn)) && Number(row.academic_year_end) === year);
    const attendance = args.attendanceRows.find((row) => urns.has(Number(row.urn)) && Number(row.academic_year_end) === year);
    const ks2ForYear = args.ks2Rows.filter((row) => urns.has(Number(row.urn)) && Number(row.academic_year_end) === year);
    const subjectValue = (subject: string) =>
      ks2ForYear.find((row) => row.subject === subject)?.expected_standard_pct ?? null;

    return {
      urn: Number(census?.urn ?? attendance?.urn ?? ks2ForYear[0]?.urn ?? args.currentUrn),
      academicYearEnd: year,
      ks2CombinedExpectedPct: subjectValue('Reading, writing and maths'),
      ks2ReadingExpectedPct: subjectValue('Reading'),
      ks2WritingExpectedPct: subjectValue('Writing'),
      ks2MathsExpectedPct: subjectValue('Maths'),
      attendancePct: getAttendancePct(attendance),
      persistentAbsencePct: attendance?.persistent_absence_pct ?? null,
      fsmPct: census?.fsm_pct ?? null,
      ealPct: census?.eal_pct ?? null,
      senPct: census?.sen_pct ?? null,
      numberOnRoll: census?.number_on_roll ?? null,
    };
  });
}

function getAttendancePct(row: AttendanceRow | undefined) {
  if (!row) return null;
  if (row.overall_attendance_pct !== null && row.overall_attendance_pct !== undefined) return round(row.overall_attendance_pct);
  if (row.overall_absence_pct !== null && row.overall_absence_pct !== undefined) return round(100 - row.overall_absence_pct);
  return null;
}

function headteacherName(profile?: SchoolRow) {
  if (!profile) return null;
  return [profile.head_title, profile.head_first_name, profile.head_last_name].filter(Boolean).join(' ') || null;
}

function settingString(settings: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = settings?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function settingIncludes(settings: Record<string, unknown> | null | undefined, keys: string[], needle: RegExp) {
  return keys.some((key) => {
    const value = settings?.[key];
    return typeof value === 'string' && needle.test(value);
  });
}

function isExplicitLocalAuthorityContainer(parent: OrgRow, childCount: number) {
  const typeText = `${parent.organization_type ?? ''} ${parent.school_type ?? ''}`;
  return (
    childCount > 0 &&
    (
      /local[_ -]?authority|council|borough/i.test(typeText) ||
      settingIncludes(parent.settings, ['trust_label', 'organisation_label', 'organization_label', 'demo_context', 'display_name'], /local authority|council|borough/i)
    )
  );
}

function academicYearLabel(year: number | null | undefined) {
  if (!year) return 'latest available year';
  return `${year - 1}/${String(year).slice(-2)}`;
}

function pctLabel(value: number | null | undefined) {
  return value === null || value === undefined ? 'not available' : `${value}%`;
}

function ppGapLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return 'no comparator gap available';
  if (value === 0) return 'in line with';
  return `${Math.abs(value)}pp ${value > 0 ? 'above' : 'below'}`;
}

function buildNarrative(args: {
  schoolName: string;
  localAuthorityName: string;
  ks2Combined: number | null;
  ks2Year: number | null;
  readingPct: number | null;
  writingPct: number | null;
  mathsPct: number | null;
  laKs2Average: number | null;
  attendance: number | null;
  attendanceYear: number | null;
  laAttendanceAverage: number | null;
  persistentAbsence: number | null;
  laPersistentAbsenceAverage: number | null;
  fsmPct: number | null;
  senPct: number | null;
  ealPct: number | null;
  censusYear: number | null;
  similarSchoolCount: number;
  senProvisionType?: string | null;
  senUnitFlag?: number | null;
  resourceProvisionFlag?: number | null;
  ehcPlanCount?: number | null;
  senSupportCount?: number | null;
}) {
  const strengths: string[] = [];
  const watch: string[] = [];
  const questions: string[] = [];
  const priorityRationale: string[] = [];
  const sourceNotes: string[] = [];

  const ks2Diff = args.ks2Combined !== null && args.laKs2Average !== null
    ? round(args.ks2Combined - args.laKs2Average)
    : null;
  const attendanceDiff = args.attendance !== null && args.laAttendanceAverage !== null
    ? round(args.attendance - args.laAttendanceAverage)
    : null;
  const persistentAbsenceDiff = args.persistentAbsence !== null && args.laPersistentAbsenceAverage !== null
    ? round(args.persistentAbsence - args.laPersistentAbsenceAverage)
    : null;

  if (args.ks2Combined !== null) {
    const subjectValues: Array<readonly [string, number]> = [];
    if (args.readingPct !== null) subjectValues.push(['reading', args.readingPct]);
    if (args.writingPct !== null) subjectValues.push(['writing', args.writingPct]);
    if (args.mathsPct !== null) subjectValues.push(['maths', args.mathsPct]);
    const weakestSubject = subjectValues
      .sort((a, b) => a[1] - b[1])[0];
    const weakestClause = weakestSubject
      ? ` Weakest subject signal: ${weakestSubject[0]} at ${weakestSubject[1]}%.`
      : '';
    priorityRationale.push(
      `Source: DfE KS2 ${academicYearLabel(args.ks2Year)} — combined RWM+ is ${pctLabel(args.ks2Combined)}, ${ppGapLabel(ks2Diff)} ${args.localAuthorityName} LA primary average (${pctLabel(args.laKs2Average)}).${weakestClause}`,
    );
  } else {
    sourceNotes.push(`DfE KS2 ${academicYearLabel(args.ks2Year)}: no combined RWM+ value found for this school.`);
  }

  if (args.attendance !== null || args.persistentAbsence !== null) {
    priorityRationale.push(
      `Source: DfE attendance ${academicYearLabel(args.attendanceYear)} — attendance is ${pctLabel(args.attendance)} (${ppGapLabel(attendanceDiff)} LA average ${pctLabel(args.laAttendanceAverage)}); persistent absence is ${pctLabel(args.persistentAbsence)} (${ppGapLabel(persistentAbsenceDiff)} LA average ${pctLabel(args.laPersistentAbsenceAverage)}).`,
    );
  } else {
    sourceNotes.push(`DfE attendance ${academicYearLabel(args.attendanceYear)}: no attendance or persistent absence value found for this school.`);
  }

  if (args.fsmPct !== null || args.senPct !== null || args.ealPct !== null) {
    priorityRationale.push(
      `Source: DfE census ${academicYearLabel(args.censusYear)} — FSM ${pctLabel(args.fsmPct)}, SEND ${pctLabel(args.senPct)}, EAL ${pctLabel(args.ealPct)}. Use this as context: it may explain pressure, but it does not on its own explain weak outcomes.`,
    );
  } else {
    sourceNotes.push(`DfE census ${academicYearLabel(args.censusYear)}: no FSM, SEND or EAL context found for this school.`);
  }

  if (args.ks2Combined !== null && args.laKs2Average !== null) {
    if (ks2Diff !== null && ks2Diff >= 5) {
      strengths.push(`DfE KS2 ${academicYearLabel(args.ks2Year)}: combined RWM+ is ${ks2Diff}pp above the local authority comparator.`);
    } else if (ks2Diff !== null && ks2Diff <= -5) {
      watch.push(`DfE KS2 ${academicYearLabel(args.ks2Year)}: combined RWM+ is ${Math.abs(ks2Diff)}pp below the local authority comparator.`);
      questions.push('What is the school doing to improve combined Reading, Writing and Maths outcomes, and where is the weakest subject driving the gap?');
    }
  }

  if (args.attendance !== null && args.laAttendanceAverage !== null) {
    if (attendanceDiff !== null && attendanceDiff >= 1) strengths.push(`DfE attendance ${academicYearLabel(args.attendanceYear)}: attendance is ${attendanceDiff}pp above the LA comparator.`);
    if (attendanceDiff !== null && attendanceDiff <= -1) {
      watch.push(`DfE attendance ${academicYearLabel(args.attendanceYear)}: attendance is ${Math.abs(attendanceDiff)}pp below the LA comparator.`);
      questions.push('Which pupil groups are driving absence, and are attendance interventions linked to attainment priorities?');
    }
  }

  if (args.persistentAbsence !== null && args.laPersistentAbsenceAverage !== null) {
    if (persistentAbsenceDiff !== null && persistentAbsenceDiff >= 2) {
      watch.push(`DfE attendance ${academicYearLabel(args.attendanceYear)}: persistent absence is ${persistentAbsenceDiff}pp above the LA comparator.`);
      questions.push('How are leaders evidencing the impact of persistent absence work for disadvantaged and SEND pupils?');
    }
  }

  if ((args.fsmPct ?? 0) >= 35) {
    watch.push(`DfE census ${academicYearLabel(args.censusYear)}: high-disadvantage context, FSM is ${args.fsmPct}%, so crude attainment comparisons need contextual challenge.`);
  }
  if ((args.senPct ?? 0) >= 18) {
    watch.push(`DfE census ${academicYearLabel(args.censusYear)}: SEND context is notable at ${args.senPct}%; compare outcomes with similar SEN-profile schools as well as LA averages.`);
  }
  if (args.senProvisionType) {
    const provisionFlags = [
      (args.resourceProvisionFlag ?? 0) > 0 ? 'resource provision' : null,
      (args.senUnitFlag ?? 0) > 0 ? 'SEN unit' : null,
    ].filter(Boolean).join(' and ');
    const provisionDescriptor = provisionFlags || args.senProvisionType;
    priorityRationale.push(
      `Source: DfE SEN 2024/25 school-level file — ${args.schoolName} is flagged with ${provisionDescriptor}. The same source records ${args.ehcPlanCount ?? 'no published'} EHCP pupils and ${args.senSupportCount ?? 'no published'} SEN support pupils, so headline outcomes should be challenged through a provision-quality and pupil-progress lens, not only a raw attainment lens.`,
    );
    watch.push(
      `DfE SEN 2024/25: specialist provision flag present (${args.senProvisionType}); ask how leaders evidence progress, access arrangements and curriculum adaptation for this cohort.`,
    );
    questions.push(
      'For pupils in the SEN unit/resource provision, what evidence shows progress from individual starting points, and how is that separated from whole-school KS2 headline performance?',
    );
  }
  if ((args.ealPct ?? 0) >= 40) {
    strengths.push(`DfE census ${academicYearLabel(args.censusYear)}: EAL context is substantial at ${args.ealPct}%; inspect language acquisition and curriculum access evidence.`);
  }

  if (args.similarSchoolCount > 0) {
    questions.push(`Against ${args.similarSchoolCount} similar demographic schools, which outcomes are genuinely outliers rather than context effects?`);
  }

  return {
    headline:
      watch.length > 0
        ? `${args.schoolName} has ${watch.length} public-data signal${watch.length === 1 ? '' : 's'} worth exploring before any school visit.`
        : `${args.schoolName} has no major public-data red flags from the available DfE indicators, but the report should still triangulate with school-submitted assessment data.`,
    strengths: strengths.slice(0, 3),
    watch: watch.slice(0, 4),
    questions: questions.slice(0, 4),
    priorityRationale: priorityRationale.slice(0, 3),
    sourceNotes: sourceNotes.slice(0, 3),
  };
}

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const organizationId = req.nextUrl.searchParams.get('organizationId') || auth.organizationId;
  if (!organizationId) return apiError('organizationId required', 400);

  const supabase = createServiceRoleClient();

  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('organization_id', organizationId)
    .or(`user_id.eq.${auth.userId},auth_id.eq.${auth.userId}`)
    .maybeSingle();

  if (!member) return apiError('Not authorised to view this organisation', 403);

  const { data: parent, error: parentError } = await supabase
    .from('organizations')
    .select('id, name, urn, organization_type, school_type, local_authority, la_code, logo_url, website_url, address, settings')
    .eq('id', organizationId)
    .single();
  if (parentError) return apiError(parentError.message, 500);

  const { data: childRows, error: childError } = await supabase
    .from('organizations')
    .select('id, name, urn, organization_type, school_type, local_authority, la_code, logo_url, website_url, address, settings')
    .eq('parent_organization_id', organizationId)
    .order('name');
  if (childError) return apiError(childError.message, 500);

  const registeredOrgRows = ((childRows?.length ? childRows : [parent]) ?? []) as OrgRow[];
  const registeredUrns = registeredOrgRows.map((org) => asUrn(org.urn)).filter((urn): urn is number => urn !== null);

  if (registeredUrns.length === 0 && !parent.local_authority) {
    return apiSuccess({
      parent,
      coverage: { scopedSchoolCount: registeredOrgRows.length, urnCount: 0 },
      schools: [],
      dataQuality: ['No URNs are registered for this organisation tree, so DfE warehouse data cannot be resolved.'],
    });
  }

  const { data: profilesRaw, error: profileError } = await supabase
    .from('schools')
    .select('urn, name, la_code, la_name, type_name, type_group_name, phase_name, status_name, trust_name, number_of_pupils, school_capacity, percentage_fsm, website, telephone, head_title, head_first_name, head_last_name, inspectorate_name, date_of_last_inspection')
    .in('urn', registeredUrns.length > 0 ? registeredUrns : [-1]);
  if (profileError) return apiError(profileError.message, 500);

  const profiles = (profilesRaw ?? []) as SchoolRow[];
  const firstProfile = profiles[0];
  const laName = String(parent.local_authority ?? firstProfile?.la_name ?? 'Local authority');
  const laCode = firstProfile?.la_code ?? String(parent.la_code ?? '');

  const { data: laPrimaryRaw } = await supabase
    .from('schools')
    .select('urn, name, la_code, la_name, type_name, type_group_name, phase_name, status_name, trust_name, number_of_pupils, school_capacity, percentage_fsm, website, telephone, head_title, head_first_name, head_last_name, inspectorate_name, date_of_last_inspection')
    .eq('la_name', laName)
    .eq('phase_name', 'Primary')
    .eq('status_name', 'Open')
    .limit(500);

  const laPrimary = ((laPrimaryRaw ?? []) as SchoolRow[]);
  const laMaintained = laPrimary.filter((school) =>
    school.type_group_name === 'Local authority maintained schools' ||
    LA_MAINTAINED_TYPES.has(String(school.type_name ?? '')) ||
    !school.trust_name,
  );

  const registeredUrnSet = new Set(registeredUrns);
  const registeredLogoByUrn = new Map(
    registeredOrgRows
      .map((org) => [asUrn(org.urn), org] as const)
      .filter((entry): entry is readonly [number, OrgRow] => entry[0] !== null),
  );
  const isLocalAuthorityGroup =
    isExplicitLocalAuthorityContainer(parent as OrgRow, childRows?.length ?? 0);
  const virtualLaRows: OrgRow[] = isLocalAuthorityGroup
    ? laMaintained
        .filter((school) => !registeredUrnSet.has(school.urn))
        .map((school) => ({
          id: `dfe-${school.urn}`,
          name: school.name,
          urn: school.urn,
          local_authority: school.la_name,
          la_code: school.la_code,
          logo_url: null,
          website_url: school.website,
          address: null,
          settings: { virtual_dfe_school: true },
        }))
    : [];
  const reportOrgRows = [...registeredOrgRows, ...virtualLaRows].sort((a, b) => a.name.localeCompare(b.name));
  const urns = reportOrgRows.map((org) => asUrn(org.urn)).filter((urn): urn is number => urn !== null);
  const profileByUrn = new Map([...laPrimary, ...profiles].map((profile) => [profile.urn, profile] as const));
  const laUrns = laPrimary.map((school) => school.urn);
  const currentComparisonUrns = Array.from(new Set([...urns, ...laUrns]));
  const urnLineage = await resolveUrnLineage(supabase, currentComparisonUrns);
  const oldToNew = buildOldToCurrentUrnMap(urnLineage);
  const comparisonUrns = expandUrnsWithLineage(currentComparisonUrns, urnLineage);

  const [censusResult, attendanceResult, ks2Result, ks4Result, provisionResult] = await Promise.all([
    supabase
      .from('census')
      .select('urn, academic_year_end, number_on_roll, fsm_pct, eal_pct, sen_pct')
      .in('urn', comparisonUrns)
      .order('academic_year_end', { ascending: false }),
    supabase
      .from('attendance')
      .select('urn, academic_year_end, overall_attendance_pct, overall_absence_pct, persistent_absence_pct')
      .in('urn', comparisonUrns)
      .order('academic_year_end', { ascending: false }),
    supabase
      .from('ks2_results')
      .select('urn, academic_year_end, subject, expected_standard_pct, progress_measure_score')
      .in('urn', comparisonUrns)
      .eq('breakdown_topic', 'All pupils')
      .eq('breakdown', 'Total')
      .in('subject', ['Reading, writing and maths', 'Reading', 'Writing', 'Maths'])
      .not('expected_standard_pct', 'is', null)
      .limit(10000)
      .order('urn', { ascending: true })
      .order('academic_year_end', { ascending: false }),
    supabase
      .from('ks4_results')
      .select('urn, academic_year_end, time_period, breakdown_topic, breakdown, t_pupils, avg_att8, avg_p8score, pt_5em_94, pt_ebacc_e_ptq_ee, avg_ebaccaps, is_suppressed')
      .in('urn', comparisonUrns)
      .eq('breakdown_topic', 'Total')
      .eq('breakdown', 'Total')
      .limit(10000)
      .order('urn', { ascending: true })
      .order('academic_year_end', { ascending: false }),
    supabase
      .from('school_gias_extended_profiles')
      .select('urn, school_name, sen_provision_type, resourced_provision_type, resourced_provision_on_roll, resourced_provision_capacity, sen_unit_on_roll, sen_unit_capacity, gias_last_confirmed, source_url, source_method, source_fetched_at, confidence_status, validation_notes, raw_snapshot')
      .in('urn', currentComparisonUrns),
  ]);

  if (censusResult.error) return apiError(censusResult.error.message, 500);
  if (attendanceResult.error) return apiError(attendanceResult.error.message, 500);
  if (ks2Result.error) return apiError(ks2Result.error.message, 500);
  if (ks4Result.error) return apiError(ks4Result.error.message, 500);
  const provisionTableMissing = Boolean(provisionResult.error);

  const rawCensusRows = (censusResult.data ?? []) as CensusRow[];
  const rawAttendanceRows = (attendanceResult.data ?? []) as AttendanceRow[];
  const rawKs2Rows = (ks2Result.data ?? []) as Ks2Row[];
  const rawKs4Rows = (ks4Result.data ?? []) as Ks4Row[];

  const censusRows = rawCensusRows.map((row) => ({
    ...row,
    urn: oldToNew.get(Number(row.urn)) ?? Number(row.urn),
  }));
  const attendanceRows = rawAttendanceRows.map((row) => ({
    ...row,
    urn: oldToNew.get(Number(row.urn)) ?? Number(row.urn),
  }));
  const ks2Rows = rawKs2Rows.map((row) => ({
    ...row,
    urn: oldToNew.get(Number(row.urn)) ?? Number(row.urn),
  }));
  const ks4Rows = rawKs4Rows.map((row) => ({
    ...row,
    urn: oldToNew.get(Number(row.urn)) ?? Number(row.urn),
  }));

  const latestCensus = latestByUrn(censusRows);
  const latestAttendance = latestValueByUrn(attendanceRows, (row) =>
    row.overall_attendance_pct !== null || row.overall_absence_pct !== null,
  );
  const latestPersistentAbsence = latestValueByUrn(attendanceRows, (row) =>
    row.persistent_absence_pct !== null && row.persistent_absence_pct !== undefined,
  );
  const latestKs2 = latestKs2ByUrnAndSubject(ks2Rows);
  const latestKs4 = latestKs4ByUrn(ks4Rows);
  const provisionByUrn = new Map(
    (((provisionResult.error ? [] : provisionResult.data) ?? []) as GiasExtendedProfileRow[])
      .map((profile) => [Number(profile.urn), profile] as const),
  );

  const laCombinedValues = laUrns.map((urn) => latestKs2.get(urn)?.['Reading, writing and maths']?.expected_standard_pct);
  const laAttendanceValues = laUrns.map((urn) => getAttendancePct(latestAttendance.get(urn)));
  const laPaValues = laUrns.map((urn) => latestPersistentAbsence.get(urn)?.persistent_absence_pct);
  const laFsmValues = laUrns.map((urn) => latestCensus.get(urn)?.fsm_pct);
  const laSenValues = laUrns.map((urn) => latestCensus.get(urn)?.sen_pct);
  const laEalValues = laUrns.map((urn) => latestCensus.get(urn)?.eal_pct);

  const laBenchmarks = {
    la_name: laName,
    la_code: laCode,
    primary_count: laPrimary.length,
    maintained_primary_count: laMaintained.length,
    academy_primary_count: Math.max(0, laPrimary.length - laMaintained.length),
    ks2_combined_avg: average(laCombinedValues),
    attendance_avg: average(laAttendanceValues),
    persistent_absence_avg: average(laPaValues),
    fsm_avg: average(laFsmValues),
    sen_avg: average(laSenValues),
    eal_avg: average(laEalValues),
  };

  const schools = reportOrgRows.map((org) => {
    const urn = asUrn(org.urn);
    const profile = urn ? profileByUrn.get(urn) : undefined;
    const lineage = urn ? urnLineage.get(urn) : undefined;
    const provision = urn ? provisionByUrn.get(urn) : undefined;
    const academyImpact: AcademyImpactReport | null = urn && lineage ? {
      ...analyseAcademisationImpact({
        rows: buildAcademisationMetricRows({
          currentUrn: urn,
          predecessorUrn: lineage.predecessorUrn,
          censusRows: rawCensusRows,
          attendanceRows: rawAttendanceRows,
          ks2Rows: rawKs2Rows,
        }),
        conversionDate: lineage.convertedDate,
        currentUrn: urn,
        predecessorUrns: [lineage.predecessorUrn],
      }),
      conversion_date: lineage.convertedDate,
      predecessor_urn: lineage.predecessorUrn,
      predecessor_name: lineage.predecessorName,
    } : null;
    const census = urn ? latestCensus.get(urn) : undefined;
    const attendance = urn ? latestAttendance.get(urn) : undefined;
    const persistentAbsence = urn ? latestPersistentAbsence.get(urn) : undefined;
    const ks2 = urn ? latestKs2.get(urn) : undefined;
    const ks4 = urn ? latestKs4.get(urn) : undefined;
    const fsmPct = round(census?.fsm_pct ?? profile?.percentage_fsm ?? null);
    const senPct = round(census?.sen_pct ?? null);
    const ealPct = round(census?.eal_pct ?? null);

    const similarUrns = laUrns.filter((candidateUrn) => {
      if (!urn || candidateUrn === urn) return false;
      const candidate = latestCensus.get(candidateUrn);
      if (!candidate) return false;
      const fsmOk = fsmPct === null || candidate.fsm_pct === null || Math.abs(candidate.fsm_pct - fsmPct) <= 10;
      const senOk = senPct === null || candidate.sen_pct === null || Math.abs(candidate.sen_pct - senPct) <= 6;
      const ealOk = ealPct === null || candidate.eal_pct === null || Math.abs(candidate.eal_pct - ealPct) <= 15;
      return fsmOk && senOk && ealOk;
    });

    const ks2Combined = round(ks2?.['Reading, writing and maths']?.expected_standard_pct ?? null);
    const attendancePct = getAttendancePct(attendance);
    const paPct = round(persistentAbsence?.persistent_absence_pct ?? null);
    const websiteUrl = org.website_url ?? settingString(org.settings, ['website', 'website_url']) ?? profile?.website ?? null;
    const address = org.address ?? settingString(org.settings, ['address']) ?? null;
    const telephone = settingString(org.settings, ['telephone', 'phone']) ?? profile?.telephone ?? null;
    const headteacher = settingString(org.settings, ['headteacher', 'head_teacher']) ?? headteacherName(profile);
    const email = settingString(org.settings, ['email', 'school_email', 'contact_email']);
    const narrative = buildNarrative({
      schoolName: org.name,
      localAuthorityName: laName,
      ks2Combined,
      ks2Year: ks2?.['Reading, writing and maths']?.academic_year_end ?? null,
      readingPct: round(ks2?.Reading?.expected_standard_pct ?? null),
      writingPct: round(ks2?.Writing?.expected_standard_pct ?? null),
      mathsPct: round(ks2?.Maths?.expected_standard_pct ?? null),
      laKs2Average: laBenchmarks.ks2_combined_avg,
      attendance: attendancePct,
      attendanceYear: attendance?.academic_year_end ?? persistentAbsence?.academic_year_end ?? null,
      laAttendanceAverage: laBenchmarks.attendance_avg,
      persistentAbsence: paPct,
      laPersistentAbsenceAverage: laBenchmarks.persistent_absence_avg,
      fsmPct,
      senPct,
      ealPct,
      censusYear: census?.academic_year_end ?? null,
      similarSchoolCount: similarUrns.length,
      senProvisionType: provision?.resourced_provision_type ?? provision?.sen_provision_type ?? null,
      senUnitFlag: provision?.raw_snapshot?.sen_unit_flag ?? null,
      resourceProvisionFlag: provision?.raw_snapshot?.resource_provision_flag ?? null,
      ehcPlanCount: provision?.raw_snapshot?.ehc_plan ?? null,
      senSupportCount: provision?.raw_snapshot?.sen_support ?? null,
    });

    return {
      id: org.id,
      name: org.name,
      urn,
      logo_url: org.logo_url ?? registeredLogoByUrn.get(urn ?? -1)?.logo_url ?? (typeof org.settings?.logo_url === 'string' ? org.settings.logo_url : null),
      website_url: websiteUrl,
      address,
      contact: {
        headteacher,
        email,
        telephone,
        website: websiteUrl,
        address,
      },
      setup: {
        marketing_priority: settingString(org.settings, ['marketing_priority']),
        priority_reason: settingString(org.settings, ['priority_reason']),
        ofsted_result: settingString(org.settings, ['ofsted_result']),
        ofsted_inspection_date: settingString(org.settings, ['ofsted_inspection_date']),
        email_source: settingString(org.settings, ['email_source']),
        logo_review_status: settingString(org.settings, ['logo_review_status']),
        data_enriched_at: settingString(org.settings, ['data_enriched_at']),
      },
      profile: profile ? {
        type_name: profile.type_name,
        type_group_name: profile.type_group_name,
        phase_name: profile.phase_name,
        status_name: profile.status_name,
        trust_name: profile.trust_name,
        number_of_pupils: profile.number_of_pupils,
        school_capacity: profile.school_capacity,
        headteacher,
        telephone,
        inspectorate_name: profile.inspectorate_name,
        date_of_last_inspection: profile.date_of_last_inspection,
      } : null,
      academy_history: lineage ? {
        predecessor_urn: lineage.predecessorUrn,
        predecessor_name: lineage.predecessorName,
        converted_date: lineage.convertedDate,
        confidence: lineage.confidence,
        match_reasons: lineage.matchReasons,
      } : null,
      academy_impact: academyImpact,
      latest: {
        census_year: census?.academic_year_end ?? null,
        number_on_roll: census?.number_on_roll ?? profile?.number_of_pupils ?? null,
        fsm_pct: fsmPct,
        eal_pct: ealPct,
        sen_pct: senPct,
        attendance_year: attendance?.academic_year_end ?? null,
        attendance_pct: attendancePct,
        persistent_absence_pct: paPct,
        ks2_year: ks2?.['Reading, writing and maths']?.academic_year_end ?? null,
        ks2_combined_pct: ks2Combined,
        reading_pct: round(ks2?.Reading?.expected_standard_pct ?? null),
        writing_pct: round(ks2?.Writing?.expected_standard_pct ?? null),
        maths_pct: round(ks2?.Maths?.expected_standard_pct ?? null),
        ks4_year: ks4?.academic_year_end ?? null,
        ks4_pupils: ks4?.t_pupils ?? null,
        attainment8: round(ks4?.avg_att8 ?? null),
        progress8: round(ks4?.avg_p8score ?? null, 2),
        english_maths_4_plus_pct: round(ks4?.pt_5em_94 ?? null),
        ebacc_entry_pct: round(ks4?.pt_ebacc_e_ptq_ee ?? null),
        ebacc_aps: round(ks4?.avg_ebaccaps ?? null, 2),
      },
      comparators: {
        similar_school_count: similarUrns.length,
        similar_urns: similarUrns.slice(0, 20),
        provision_specific: provision ? {
          sen_provision_type: provision.sen_provision_type,
          resourced_provision_type: provision.resourced_provision_type,
          resourced_provision_on_roll: provision.resourced_provision_on_roll,
          resourced_provision_capacity: provision.resourced_provision_capacity,
          sen_unit_on_roll: provision.sen_unit_on_roll,
          sen_unit_capacity: provision.sen_unit_capacity,
          gias_last_confirmed: provision.gias_last_confirmed,
          source_url: provision.source_url,
          source_method: provision.source_method,
          source_fetched_at: provision.source_fetched_at,
          confidence_status: provision.confidence_status,
          validation_notes: Array.isArray(provision.validation_notes) ? provision.validation_notes : [],
          sen_support: provision.raw_snapshot?.sen_support ?? null,
          ehc_plan: provision.raw_snapshot?.ehc_plan ?? null,
          sen_unit_flag: provision.raw_snapshot?.sen_unit_flag ?? null,
          resource_provision_flag: provision.raw_snapshot?.resource_provision_flag ?? null,
          provision_needs: provision.raw_snapshot?.provision_needs ?? [],
        } : null,
      },
      is_virtual_dfe_school: Boolean(org.settings?.virtual_dfe_school),
      narrative,
    };
  });

  const specialSchools = schools.filter((school) =>
    String(school.profile?.type_name ?? '').toLowerCase().includes('special') ||
    (String(school.profile?.phase_name ?? '').toLowerCase().includes('not applicable') &&
      (school.latest.sen_pct ?? 0) >= 95),
  );
  const specialSchoolIds = new Set(specialSchools.map((school) => school.id));
  const primarySchools = schools.filter((school) => school.profile?.phase_name === 'Primary' && !specialSchoolIds.has(school.id));
  const secondarySchools = schools.filter((school) => school.profile?.phase_name === 'Secondary' && !specialSchoolIds.has(school.id));
  const phaseSummary = {
    primary: primarySchools.length,
    secondary: secondarySchools.length,
    special: specialSchools.length,
    other: Math.max(0, schools.length - primarySchools.length - secondarySchools.length - specialSchools.length),
  };
  const secondaryBenchmarks = {
    secondary_count: secondarySchools.length,
    ks4_year: Math.max(0, ...secondarySchools.map((school) => school.latest.ks4_year ?? 0)) || null,
    attainment8_avg: average(secondarySchools.map((school) => school.latest.attainment8)),
    progress8_avg: average(secondarySchools.map((school) => school.latest.progress8)),
    english_maths_4_plus_avg: average(secondarySchools.map((school) => school.latest.english_maths_4_plus_pct)),
    ebacc_entry_avg: average(secondarySchools.map((school) => school.latest.ebacc_entry_pct)),
    ebacc_aps_avg: average(secondarySchools.map((school) => school.latest.ebacc_aps)),
    attendance_avg: average(secondarySchools.map((school) => school.latest.attendance_pct)),
    persistent_absence_avg: average(secondarySchools.map((school) => school.latest.persistent_absence_pct)),
  };

  const ranked = [...schools].sort((a, b) => {
    const aScore =
      (a.latest.ks2_combined_pct !== null && laBenchmarks.ks2_combined_avg !== null && a.latest.ks2_combined_pct < laBenchmarks.ks2_combined_avg ? 2 : 0) +
      (a.latest.attendance_pct !== null && laBenchmarks.attendance_avg !== null && a.latest.attendance_pct < laBenchmarks.attendance_avg ? 1 : 0) +
      (a.latest.persistent_absence_pct !== null && laBenchmarks.persistent_absence_avg !== null && a.latest.persistent_absence_pct > laBenchmarks.persistent_absence_avg ? 1 : 0);
    const bScore =
      (b.latest.ks2_combined_pct !== null && laBenchmarks.ks2_combined_avg !== null && b.latest.ks2_combined_pct < laBenchmarks.ks2_combined_avg ? 2 : 0) +
      (b.latest.attendance_pct !== null && laBenchmarks.attendance_avg !== null && b.latest.attendance_pct < laBenchmarks.attendance_avg ? 1 : 0) +
      (b.latest.persistent_absence_pct !== null && laBenchmarks.persistent_absence_avg !== null && b.latest.persistent_absence_pct > laBenchmarks.persistent_absence_avg ? 1 : 0);
    return bScore - aScore;
  });
  const dataCoverage = {
    logos: schools.filter((school) => Boolean(school.logo_url)).length,
    headteachers: schools.filter((school) => Boolean(school.contact?.headteacher ?? school.profile?.headteacher)).length,
    emails: schools.filter((school) => Boolean(school.contact?.email)).length,
    telephones: schools.filter((school) => Boolean(school.contact?.telephone ?? school.profile?.telephone)).length,
    websites: schools.filter((school) => Boolean(school.contact?.website ?? school.website_url)).length,
    addresses: schools.filter((school) => Boolean(school.contact?.address ?? school.address)).length,
    fsm: schools.filter((school) => school.latest.fsm_pct !== null).length,
    eal: schools.filter((school) => school.latest.eal_pct !== null).length,
    sen: schools.filter((school) => school.latest.sen_pct !== null).length,
    attendance: schools.filter((school) => school.latest.attendance_pct !== null).length,
    persistent_absence: schools.filter((school) => school.latest.persistent_absence_pct !== null).length,
    ks2_combined: schools.filter((school) => school.latest.ks2_combined_pct !== null).length,
    reading: schools.filter((school) => school.latest.reading_pct !== null).length,
    writing: schools.filter((school) => school.latest.writing_pct !== null).length,
    maths: schools.filter((school) => school.latest.maths_pct !== null).length,
    ks4: schools.filter((school) => school.latest.attainment8 !== null || school.latest.english_maths_4_plus_pct !== null).length,
    attainment8: schools.filter((school) => school.latest.attainment8 !== null).length,
    progress8: schools.filter((school) => school.latest.progress8 !== null).length,
    english_maths_4_plus: schools.filter((school) => school.latest.english_maths_4_plus_pct !== null).length,
    academy_history: schools.filter((school) => school.academy_history !== null).length,
    academy_impact: schools.filter((school) => school.academy_impact !== null).length,
    sen_profile: schools.filter((school) => school.comparators.provision_specific !== null).length,
    provision_specific: schools.filter((school) => Boolean(
      school.comparators.provision_specific?.resourced_provision_type ||
      school.comparators.provision_specific?.sen_provision_type ||
      (school.comparators.provision_specific?.sen_unit_flag ?? 0) > 0 ||
      (school.comparators.provision_specific?.resource_provision_flag ?? 0) > 0,
    )).length,
  };

  return apiSuccess({
    parent: {
      id: parent.id,
      name: parent.name,
      logo_url: parent.logo_url ?? (typeof parent.settings?.logo_url === 'string' ? parent.settings.logo_url : null),
    },
    coverage: {
      scoped_school_count: registeredOrgRows.length,
      report_school_count: reportOrgRows.length,
      virtual_dfe_school_count: virtualLaRows.length,
      urn_count: urns.length,
      la_primary_count: laPrimary.length,
      la_maintained_primary_count: laMaintained.length,
      la_academy_primary_count: Math.max(0, laPrimary.length - laMaintained.length),
      onboarded_maintained_coverage: laMaintained.length > 0 ? `${registeredOrgRows.length}/${laMaintained.length}` : null,
    },
    laBenchmarks,
    secondaryBenchmarks,
    phaseSummary,
    dataCoverage,
    schools,
    prioritySchools: ranked.slice(0, 6),
    dataQuality: [
      'This report uses live Schoolgle organisation URNs plus the DfE warehouse; it does not use another organisation’s data.',
      'Academy predecessor URNs are resolved from DfE school identity fields (LAESTAB, establishment number, postcode, name and conversion dates), then historic rows are mapped back onto the current URN.',
      'Persistent absence is selected from the latest attendance row with a PA value, so blank term/annual rows cannot mask a populated DfE PA row.',
      provisionTableMissing
        ? 'Provision-specific fields such as VI/HI/ASD resource bases require the GIAS extended provision import; the table is not available in this environment yet.'
        : 'Provision-specific fields such as VI/HI/ASD resource bases are read from school_gias_extended_profiles when imported, with source and confidence labels.',
      'Uploaded trust assessment captures and CTF/MIS files add self-reported and pupil-level layers; public DfE intelligence still renders without them.',
    ],
  });
}, { orgOptional: true });
