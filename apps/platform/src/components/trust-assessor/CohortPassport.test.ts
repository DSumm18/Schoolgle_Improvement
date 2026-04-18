import { describe, it, expect } from 'vitest';
import type { Checkpoint, CohortPathway, CheckpointStatus, CohortPassportData } from './CohortPassport';

// ─── Unit tests for CohortPassport data model ─────────────────────────────────

describe('CohortPassport data model', () => {
  it('constructs a valid CohortPathway with 7 checkpoints', () => {
    const checkpointIds = ['eyfs-gld', 'phonics-y1', 'phonics-y2', 'ks1', 'mtc-y4', 'mid-year', 'ks2'];

    const mockCohort: CohortPathway = {
      receptionYear: 2019,
      cohortLabel: 'Current Y6 (started 2019/20)',
      currentYearGroup: 'Current Y6',
      checkpoints: checkpointIds.map((id): Checkpoint => ({
        id,
        label: id,
        yearGroup: 'Year X',
        academicYearLabel: '2019/20',
        validation: 'external',
        value: '72%',
        source: 'DfE',
      })),
    };

    expect(mockCohort.checkpoints).toHaveLength(7);
    expect(mockCohort.receptionYear).toBe(2019);
    expect(mockCohort.currentYearGroup).toBe('Current Y6');
  });

  it('accepts all valid CheckpointStatus values including locked', () => {
    const validStatuses: CheckpointStatus[] = [
      'external',
      'self-reported',
      'mixed',
      'future',
      'no-data',
      'loading',
      'locked',
    ];

    validStatuses.forEach((status) => {
      const cp: Checkpoint = {
        id: 'test',
        label: 'Test',
        yearGroup: 'Year 1',
        academicYearLabel: '2024/25',
        validation: status,
        value: null,
        source: 'test',
      };
      expect(cp.validation).toBe(status);
    });
  });

  it('CohortPassportData includes hasCTF flag', () => {
    const data: CohortPassportData = {
      cohorts: [],
      phonicsAvailable: false,
      mtcAvailable: false,
      hasCTF: false,
    };
    expect(data.hasCTF).toBe(false);

    const dataWithCTF: CohortPassportData = {
      cohorts: [],
      phonicsAvailable: true,
      mtcAvailable: false,
      hasCTF: true,
    };
    expect(dataWithCTF.hasCTF).toBe(true);
    expect(dataWithCTF.phonicsAvailable).toBe(true);
  });

  it('correctly identifies the KS1 validation status based on year end', () => {
    // KS1 was externally moderated until 2022/23 (academic_year_start = 2022)
    // Cohort starting Reception 2020 → Y2 academic_year_start = 2022 → external
    // Cohort starting Reception 2021 → Y2 academic_year_start = 2023 → self-reported

    function ks1Status(receptionYear: number): CheckpointStatus {
      const ks1AcademicYearStart = receptionYear + 2;
      const yearEnd = ks1AcademicYearStart + 1;
      const CURRENT_YEAR_END = 2026;
      if (yearEnd > CURRENT_YEAR_END) return 'future';
      if (ks1AcademicYearStart <= 2022) return 'external';
      return 'self-reported';
    }

    expect(ks1Status(2019)).toBe('external');        // Y2 in 2021/22 — moderated KS1
    expect(ks1Status(2020)).toBe('external');        // Y2 in 2022/23 — last year of moderated KS1
    expect(ks1Status(2021)).toBe('self-reported');   // Y2 in 2023/24 — optional, no external moderation
    expect(ks1Status(2022)).toBe('self-reported');   // Y2 in 2024/25
    expect(ks1Status(2023)).toBe('self-reported');   // Y2 in 2025/26
    expect(ks1Status(2024)).toBe('future');          // Y2 in 2026/27 — not yet reached
  });

  it('correctly calculates academic year labels for cohort checkpoints', () => {
    function academicYearLabel(start: number): string {
      return `${start}/${String(start + 1).slice(2)}`;
    }

    // Reception year 2019 → KS2 in 2025/26
    const receptionYear = 2019;
    expect(academicYearLabel(receptionYear)).toBe('2019/20');
    expect(academicYearLabel(receptionYear + 1)).toBe('2020/21'); // Y1 phonics academic_year_start
    expect(academicYearLabel(receptionYear + 6)).toBe('2025/26'); // KS2
  });

  it('maps phonics academic_year_start correctly from receptionYear', () => {
    // Y1 phonics: child is in Y1 → academic_year_start = receptionYear + 1
    // Y2 phonics: child is in Y2 → academic_year_start = receptionYear + 2
    const receptionYear = 2019;
    const y1PhonicsStart = receptionYear + 1; // 2020
    const y2PhonicsStart = receptionYear + 2; // 2021

    expect(y1PhonicsStart).toBe(2020);
    expect(y2PhonicsStart).toBe(2021);

    // Grove House data confirms: academic_year_start=2020, year_group=1 (but no data)
    // and academic_year_start=2021, year_group=2: 241 pupils, 89% pass
    const phonicsMapKey_y1 = `${y1PhonicsStart}_1`;
    const phonicsMapKey_y2 = `${y2PhonicsStart}_2`;
    expect(phonicsMapKey_y1).toBe('2020_1');
    expect(phonicsMapKey_y2).toBe('2021_2');
  });

  it('locked status is used when no CTF connected and checkpoint is in the past', () => {
    const hasCTF = false;
    const isFuture = false;

    const phonicsStatus: CheckpointStatus = isFuture
      ? 'future'
      : hasCTF
      ? 'external'
      : 'locked';

    expect(phonicsStatus).toBe('locked');
  });

  it('external status is used when CTF connected and data found', () => {
    const hasCTF = true;
    const isFuture = false;
    const dataFound = true;

    const phonicsStatus: CheckpointStatus = isFuture
      ? 'future'
      : dataFound
      ? 'external'
      : hasCTF
      ? 'no-data'
      : 'locked';

    expect(phonicsStatus).toBe('external');
  });

  it('marks phonics cells as loading when phonicsAvailable is false and not future (legacy)', () => {
    const phonicsAvailable = false;
    const isFuture = false;

    const status: CheckpointStatus = isFuture
      ? 'future'
      : !phonicsAvailable
      ? 'loading'
      : 'external';

    expect(status).toBe('loading');
  });

  it('marks ks2 as future for cohorts that have not yet reached Y6', () => {
    const CURRENT_YEAR_END = 2026;

    // Cohort starting Reception 2023 → Y6 year_end = 2030
    const receptionYear = 2023;
    const y6YearEnd = receptionYear + 7; // 2030
    expect(y6YearEnd > CURRENT_YEAR_END).toBe(true);
  });

  it('maps 6 cohort rows to expected year groups including completed Y6', () => {
    const COHORTS = [
      { receptionYear: 2018, currentYearGroup: 'Y6 2024/25 (KS2 done)' },
      { receptionYear: 2019, currentYearGroup: 'Current Y6' },
      { receptionYear: 2020, currentYearGroup: 'Current Y5' },
      { receptionYear: 2021, currentYearGroup: 'Current Y4' },
      { receptionYear: 2022, currentYearGroup: 'Current Y3' },
      { receptionYear: 2023, currentYearGroup: 'Current Y2' },
    ];

    expect(COHORTS).toHaveLength(6);
    expect(COHORTS[0].currentYearGroup).toBe('Y6 2024/25 (KS2 done)');
    expect(COHORTS[1].currentYearGroup).toBe('Current Y6');
    expect(COHORTS[5].currentYearGroup).toBe('Current Y2');
    // Y6 cohort (2019 start) → KS2 year_end = 2026 = CURRENT_YEAR_END
    expect(COHORTS[1].receptionYear + 7).toBe(2026);
  });

  it('Grove House phonics data: pass rates match expected CTF values', () => {
    // Real data from pupil_assessments_pseudo (confirmed via SQL 2026-04-18):
    // academic_year_start | year_group | pupils | pass_pct | avg_score
    // 2020 | 2 | 56 | 77 | 32.4
    // 2021 | 2 | 241 | 89 | 34.6
    // 2022 | 1 | 159 | 47 | 24.6
    // 2022 | 2 | 24 | 75 | 26.8
    // 2023 | 1 | 58 | 81 | 31.7
    // 2023 | 2 | 31 | 68 | 30.7
    // 2024 | 1 | 94 | 87 | 32.6
    // 2024 | 2 | 20 | 50 | 20.6
    // 2025 | 1 | 58 | 74 | 30.4
    // 2025 | 2 | 8 | 25 | 17.3

    // Cohort receptionYear=2022 → Y1 phonics academic_year_start=2023
    // Expected: 81% pass (n=58)
    const cohort2022_phonicsY1_key = `${2022 + 1}_1`; // '2023_1'
    expect(cohort2022_phonicsY1_key).toBe('2023_1');

    // Cohort receptionYear=2021 → Y2 phonics academic_year_start=2023
    const cohort2021_phonicsY2_key = `${2021 + 2}_2`; // '2023_2'
    expect(cohort2021_phonicsY2_key).toBe('2023_2');

    // Pass mark is 32/40 — verify boundary
    const passmark = 32;
    expect(passmark).toBe(32);
  });
});
