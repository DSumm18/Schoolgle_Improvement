import { createServiceRoleClient } from '@/lib/supabase-server';
import type {
  AttendanceStoryData,
  SchoolProfile,
  AttendanceRow,
  CensusRow,
  ContextualFactor,
} from './types';

/**
 * Fetch all data the attendance story needs from real Supabase tables.
 * No hardcoding — every value comes from a live query.
 */
export async function fetchAttendanceStoryData(urn: number): Promise<AttendanceStoryData> {
  const supabase = createServiceRoleClient();

  // School profile from GIAS
  const { data: schoolData, error: schoolError } = await supabase
    .from('schools')
    .select('urn, name, la_name, phase_name, type_name, number_of_pupils, head_first_name, head_last_name')
    .eq('urn', urn)
    .single();

  if (schoolError || !schoolData) {
    throw new Error(`School not found in GIAS for URN ${urn}: ${schoolError?.message ?? 'no data'}`);
  }

  // All attendance rows for this URN, most recent first
  const { data: attendanceData } = await supabase
    .from('attendance')
    .select('time_period, term, overall_attendance_pct, overall_absence_pct, authorized_absence_pct, unauthorized_absence_pct, persistent_absence_pct, persistent_absence_count')
    .eq('urn', urn)
    .order('time_period', { ascending: false });

  // Census rows for demographic context
  const { data: censusData } = await supabase
    .from('census')
    .select('time_period, number_on_roll, fsm_pct, eal_pct')
    .eq('urn', urn)
    .order('time_period', { ascending: false });

  // Contextual factors — optional
  let factorsData: Record<string, unknown>[] | null = null;
  try {
    const { data } = await supabase
      .from('school_contextual_factors')
      .select('factor_type, description, start_date, year_groups_affected')
      .eq('urn', urn)
      .order('start_date', { ascending: false });
    factorsData = data;
  } catch {
    factorsData = null;
  }

  const parseFloatOrNull = (v: unknown): number | null => {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return isNaN(n) ? null : n;
  };

  return {
    school: schoolData as SchoolProfile,
    attendanceRows: (attendanceData ?? []).map((r: Record<string, unknown>) => ({
      time_period: String(r.time_period),
      term: (r.term as string | null) ?? null,
      overall_attendance_pct: parseFloatOrNull(r.overall_attendance_pct),
      overall_absence_pct: parseFloatOrNull(r.overall_absence_pct),
      authorized_absence_pct: parseFloatOrNull(r.authorized_absence_pct),
      unauthorized_absence_pct: parseFloatOrNull(r.unauthorized_absence_pct),
      persistent_absence_pct: parseFloatOrNull(r.persistent_absence_pct),
      persistent_absence_count: (r.persistent_absence_count as number | null) ?? null,
    })) as AttendanceRow[],
    censusRows: (censusData ?? []).map((r: Record<string, unknown>) => ({
      time_period: String(r.time_period),
      number_on_roll: (r.number_on_roll as number | null) ?? null,
      fsm_pct: parseFloatOrNull(r.fsm_pct),
      eal_pct: parseFloatOrNull(r.eal_pct),
    })) as CensusRow[],
    contextualFactors: ((factorsData ?? []) as Record<string, unknown>[]).map((r) => ({
      factor_type: String(r.factor_type ?? 'unknown'),
      description: String(r.description ?? ''),
      start_date: (r.start_date as string | null) ?? null,
      year_groups_affected: (r.year_groups_affected as string[] | null) ?? null,
    })) as ContextualFactor[],
  };
}

export function summariseAvailableConnectors(data: AttendanceStoryData): {
  available: string[];
  missing: { id: string; name: string; reason: string }[];
} {
  const available: string[] = [];
  const missing: { id: string; name: string; reason: string }[] = [];

  if (data.attendanceRows.length > 0) {
    available.push('dfe-attendance');
  } else {
    missing.push({
      id: 'dfe-attendance',
      name: 'DfE Attendance',
      reason: 'No historic attendance data found for this school',
    });
  }

  if (data.censusRows.length > 0) {
    available.push('dfe-census');
  } else {
    missing.push({
      id: 'dfe-census',
      name: 'DfE Census',
      reason: 'Adds demographic context (FSM, EAL, roll size)',
    });
  }

  if (data.contextualFactors.length > 0) {
    available.push('contextual-factors');
  } else {
    missing.push({
      id: 'contextual-factors',
      name: 'Contextual Factors',
      reason: 'Log significant events to explain trends (replaced teacher, interventions, etc.)',
    });
  }

  // Always flag live-attendance as a value-add — it isn't an existing connector yet
  missing.push({
    id: 'live-attendance',
    name: 'Live Attendance (MIS)',
    reason: 'Adds current-term view beyond the DfE historic data',
  });

  return { available, missing };
}
