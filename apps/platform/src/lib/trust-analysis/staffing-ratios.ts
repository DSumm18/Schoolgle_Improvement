// ─── Staffing Ratios — Pupil-Teacher Ratio context for Trust Assessor ────────

export interface StaffingSnapshot {
  urn: number;
  academicYearEnd: number;
  fteTeachers: number | null;
  fteTeachingAssistants: number | null;
  fteSupport: number | null;
  fteTotal: number | null;
  numberOfPupils: number | null;
  pupilTeacherRatio: number | null;
  pupilAdultRatio: number | null;
  taPerPupil: number | null;
}

export const NATIONAL_P_T_RATIO = {
  primary: 20.6,
  secondary: 17.0,
} as const;

export function computeStaffingRatios(snapshot: {
  numberOfPupils: number | null;
  fteTeachers: number | null;
  fteTotal: number | null;
  fteTeachingAssistants: number | null;
}): { pupilTeacherRatio: number | null; pupilAdultRatio: number | null; taPerPupil: number | null } {
  const { numberOfPupils, fteTeachers, fteTotal, fteTeachingAssistants } = snapshot;
  return {
    pupilTeacherRatio:
      numberOfPupils && fteTeachers
        ? Math.round((numberOfPupils / fteTeachers) * 10) / 10
        : null,
    pupilAdultRatio:
      numberOfPupils && fteTotal
        ? Math.round((numberOfPupils / fteTotal) * 10) / 10
        : null,
    taPerPupil:
      numberOfPupils && fteTeachingAssistants
        ? Math.round((numberOfPupils / fteTeachingAssistants) * 10) / 10
        : null,
  };
}

export interface StaffingVerdict {
  severity:
    | 'lean-high-performing'
    | 'lean-underperforming'
    | 'well-staffed-high-performing'
    | 'well-staffed-underperforming'
    | 'typical'
    | 'no-data';
  label: string;
  governorQuestion: string;
}

export function assessStaffing(
  pupilTeacherRatio: number | null,
  phase: 'primary' | 'secondary',
  combined3yrAverage: number | null,
): StaffingVerdict {
  if (pupilTeacherRatio === null) {
    return { severity: 'no-data', label: 'Workforce data unavailable', governorQuestion: '' };
  }
  const national = NATIONAL_P_T_RATIO[phase];
  const isLean = pupilTeacherRatio > national + 2;
  const isWellStaffed = pupilTeacherRatio < national - 2;
  const isAttainmentStrong = combined3yrAverage !== null && combined3yrAverage >= 65;
  const isAttainmentWeak = combined3yrAverage !== null && combined3yrAverage < 55;

  if (isLean && isAttainmentStrong) {
    return {
      severity: 'lean-high-performing',
      label: 'Lean staffing, strong outcomes',
      governorQuestion:
        'Pupil-teacher ratio is above national (leaner), with attainment above average. How is this being sustained without workload risk? What is transferable to other schools in the trust?',
    };
  }
  if (isLean && isAttainmentWeak) {
    return {
      severity: 'lean-underperforming',
      label: 'Lean staffing, below-average outcomes',
      governorQuestion:
        'Pupil-teacher ratio is above national (leaner). Is under-resourcing contributing to below-average outcomes? Are teacher workload and pupil support adequate?',
    };
  }
  if (isWellStaffed && isAttainmentStrong) {
    return {
      severity: 'well-staffed-high-performing',
      label: 'Well-staffed, strong outcomes',
      governorQuestion:
        'Both staffing levels and attainment sit above average. Investment appears to be converting into outcomes. Is this financially sustainable at current intake?',
    };
  }
  if (isWellStaffed && isAttainmentWeak) {
    return {
      severity: 'well-staffed-underperforming',
      label: 'Well-staffed, below-average outcomes',
      governorQuestion:
        'Pupil-teacher ratio is below national (more generously staffed) but attainment is below average. Governors may want to explore whether the investment is converting into outcomes and what the intervention strategy is.',
    };
  }
  return {
    severity: 'typical',
    label: 'Staffing and outcomes within normal range',
    governorQuestion: 'Staffing levels and outcomes are broadly in line with national benchmarks.',
  };
}
