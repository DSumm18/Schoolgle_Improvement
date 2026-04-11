import type { AttendanceStoryData } from './types';

/**
 * Assemble the prompt for the LLM from REAL data.
 * The LLM does all the analysis — this function only formats numbers
 * from the passed-in data into a structured prompt.
 */
export function buildAttendancePrompt(data: AttendanceStoryData): {
  system: string;
  user: string;
  allowlist: string[];
} {
  const { school, attendanceRows, censusRows, contextualFactors } = data;

  const annualRows = attendanceRows
    .filter((r) => r.term === 'Academic year' || r.term === 'Annual' || r.term === 'Full year')
    .slice(0, 6);

  const attendanceTable = annualRows.length > 0
    ? annualRows
        .map((r) => {
          const attendance = r.overall_attendance_pct != null ? `${r.overall_attendance_pct.toFixed(2)}%` : 'n/a';
          const absence = r.overall_absence_pct != null ? `${r.overall_absence_pct.toFixed(2)}%` : 'n/a';
          const pa = r.persistent_absence_pct != null ? `${r.persistent_absence_pct.toFixed(2)}%` : 'n/a';
          return `- ${r.time_period}: attendance ${attendance}, overall absence ${absence}, persistent absence ${pa}`;
        })
        .join('\n')
    : '(no academic-year attendance rows found)';

  const autumnRows = attendanceRows.filter(
    (r) => r.term === 'Autumn term' || r.term === 'Autumn',
  );
  const latestAutumn = autumnRows[0];
  const autumnSnapshot = latestAutumn
    ? `Most recent autumn term (${latestAutumn.time_period}): attendance ${latestAutumn.overall_attendance_pct?.toFixed(2) ?? 'n/a'}%, persistent absence ${latestAutumn.persistent_absence_pct?.toFixed(2) ?? 'n/a'}%`
    : 'No autumn term snapshot available';

  const censusTable = censusRows.length > 0
    ? censusRows
        .slice(0, 4)
        .map(
          (r) =>
            `- ${r.time_period}: roll ${r.number_on_roll ?? 'n/a'}, FSM ${r.fsm_pct?.toFixed(1) ?? 'n/a'}%, EAL ${r.eal_pct?.toFixed(1) ?? 'n/a'}%`,
        )
        .join('\n')
    : '(no census data found — encourage the school to connect the DfE Census connector)';

  const factorsSection = contextualFactors.length > 0
    ? contextualFactors
        .slice(0, 5)
        .map((f) => `- ${f.start_date ?? 'undated'}: ${f.factor_type} — ${f.description}`)
        .join('\n')
    : '(No contextual factors logged — encourage the school to add these to explain trends)';

  const headName =
    school.head_first_name && school.head_last_name
      ? `${school.head_first_name} ${school.head_last_name}`
      : 'the headteacher';

  const system = `You are writing a factual attendance report for school governors. Your role is to:
1. Summarise the attendance story from the real data provided below.
2. Identify clear trends (improving, declining, stable) — state them plainly.
3. Highlight strengths and areas of concern an Ofsted inspector would notice.
4. Suggest 2-3 concrete actions the governors should discuss.
5. Reference the contextual factors where they explain trends.

Write in professional, plain English. No jargon. No false positivity. No fabrication — only use the numbers provided. If data is missing, say so. Produce a narrative of 400-600 words suitable for a governor meeting paper.

Structure your response with these sections:
- Headline
- Attendance Story (2-3 paragraphs)
- Persistent Absence
- Context (only if contextual factors or census data add meaningful context)
- Suggested Actions for Governors`;

  const user = `School: ${school.name}, ${school.la_name} (URN ${school.urn})
Phase: ${school.phase_name}, Type: ${school.type_name}
Headteacher: ${headName}
Current roll: ${school.number_of_pupils ?? 'n/a'}

ATTENDANCE DATA (most recent first):
${attendanceTable}

${autumnSnapshot}

CENSUS / DEMOGRAPHICS:
${censusTable}

CONTEXTUAL FACTORS LOGGED BY SCHOOL:
${factorsSection}

Write the attendance report now.`;

  // School name and head teacher name are public GIAS data — allowlist them so
  // the Guardian lets them through and the narrative reads naturally.
  const allowlist: string[] = [school.name];
  if (school.head_first_name && school.head_last_name) {
    const full = `${school.head_first_name} ${school.head_last_name}`;
    allowlist.push(full);
    for (const title of ['Mr', 'Mrs', 'Ms', 'Miss', 'Dr']) {
      allowlist.push(`${title} ${full}`);
      allowlist.push(`${title}. ${full}`);
    }
  }

  return { system, user, allowlist };
}
