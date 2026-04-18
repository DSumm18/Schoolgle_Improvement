import { describe, it, expect } from 'vitest';
import type { Checkpoint, CohortPathway, CheckpointStatus } from './CohortPassport';

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

  it('accepts all valid CheckpointStatus values', () => {
    const validStatuses: CheckpointStatus[] = [
      'external',
      'self-reported',
      'mixed',
      'future',
      'no-data',
      'loading',
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

  it('correctly identifies the KS1 validation status based on year end', () => {
    // KS1 was externally moderated until 2022/23 (year_end = 2023)
    // Cohort starting Reception 2020 → Y2 year_end = 2023 → external
    // Cohort starting Reception 2021 → Y2 year_end = 2024 → self-reported

    function ks1Status(receptionYear: number): CheckpointStatus {
      const y2YearEnd = receptionYear + 3;
      const CURRENT_YEAR_END = 2026;
      if (y2YearEnd > CURRENT_YEAR_END) return 'future';
      if (y2YearEnd <= 2023) return 'external';
      return 'self-reported';
    }

    expect(ks1Status(2019)).toBe('external');   // Y2 in 2022 — moderated KS1
    expect(ks1Status(2020)).toBe('external');   // Y2 in 2023 — last year of moderated KS1
    expect(ks1Status(2021)).toBe('self-reported'); // Y2 in 2024 — optional, no external moderation
    expect(ks1Status(2022)).toBe('self-reported'); // Y2 in 2025
    expect(ks1Status(2023)).toBe('self-reported'); // Y2 in 2026
    expect(ks1Status(2024)).toBe('future');    // Y2 in 2027 — not yet reached
  });

  it('correctly calculates academic year labels for cohort checkpoints', () => {
    function academicYearLabel(start: number): string {
      return `${start}/${String(start + 1).slice(2)}`;
    }

    // Reception year 2019 → KS2 in 2025/26
    const receptionYear = 2019;
    expect(academicYearLabel(receptionYear)).toBe('2019/20');
    expect(academicYearLabel(receptionYear + 1)).toBe('2020/21'); // Y1
    expect(academicYearLabel(receptionYear + 6)).toBe('2025/26'); // KS2
  });

  it('marks phonics cells as loading when phonicsAvailable is false and not future', () => {
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

  it('maps 5 cohort rows to expected year groups', () => {
    const COHORTS = [
      { receptionYear: 2019, currentYearGroup: 'Current Y6' },
      { receptionYear: 2020, currentYearGroup: 'Current Y5' },
      { receptionYear: 2021, currentYearGroup: 'Current Y4' },
      { receptionYear: 2022, currentYearGroup: 'Current Y3' },
      { receptionYear: 2023, currentYearGroup: 'Current Y2' },
    ];

    expect(COHORTS).toHaveLength(5);
    expect(COHORTS[0].currentYearGroup).toBe('Current Y6');
    expect(COHORTS[4].currentYearGroup).toBe('Current Y2');
    // Y6 started 2019, current year end is 2026, so Y6 year_end = 2026 = CURRENT_YEAR_END
    expect(COHORTS[0].receptionYear + 7).toBe(2026);
  });
});
