import { describe, it, expect } from 'vitest';
import { buildAttendancePrompt } from '../prompt-builder';
import type { AttendanceStoryData } from '../types';

describe('attendance prompt builder', () => {
  const baseData: AttendanceStoryData = {
    school: {
      urn: 148201,
      name: 'Grove House Primary School',
      la_name: 'Bradford',
      phase_name: 'Primary',
      type_name: 'Academy converter',
      number_of_pupils: 417,
      head_first_name: 'Alex',
      head_last_name: 'Summerscales',
    },
    attendanceRows: [
      {
        time_period: '202425',
        term: 'Autumn term',
        overall_attendance_pct: 94.48,
        overall_absence_pct: 5.52,
        authorized_absence_pct: 3.2,
        unauthorized_absence_pct: 2.32,
        persistent_absence_pct: 16.95,
        persistent_absence_count: null,
      },
      {
        time_period: '202324',
        term: 'Academic year',
        overall_attendance_pct: 93.18,
        overall_absence_pct: 6.82,
        authorized_absence_pct: 4.36,
        unauthorized_absence_pct: 2.47,
        persistent_absence_pct: 24.65,
        persistent_absence_count: null,
      },
    ],
    censusRows: [
      { time_period: '202425', number_on_roll: 417, fsm_pct: 27.3, eal_pct: 39.8 },
    ],
    contextualFactors: [],
  };

  it('includes the school name and LA in the user prompt', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.user).toContain('Grove House Primary School');
    expect(result.user).toContain('Bradford');
  });

  it('includes real attendance numbers from the fetched rows', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.user).toContain('93.18');
    expect(result.user).toContain('24.65');
  });

  it('includes the autumn snapshot when present', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.user).toContain('94.48');
  });

  it('notes missing contextual factors', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.user).toContain('No contextual factors');
  });

  it('allowlists the school name and head teacher variants', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.allowlist).toContain('Grove House Primary School');
    expect(result.allowlist).toContain('Mrs Alex Summerscales');
    expect(result.allowlist).toContain('Alex Summerscales');
  });

  it('system prompt forbids fabrication', () => {
    const result = buildAttendancePrompt(baseData);
    expect(result.system.toLowerCase()).toContain('no fabrication');
  });

  it('handles empty attendance rows gracefully (no crash)', () => {
    const data = { ...baseData, attendanceRows: [] };
    const result = buildAttendancePrompt(data);
    expect(result.user).toContain('no academic-year attendance rows found');
  });
});
