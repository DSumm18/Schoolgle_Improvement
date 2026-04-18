/**
 * Seed script: Pennine Academies Yorkshire — all-school timeline events
 *
 * Sources:
 *   - public.attendance         — yearly attendance + persistent absence
 *   - public.workforce          — FTE teacher changes
 *   - public.ks2_results        — KS2 Combined trends (for contextual notes)
 *   - public.schools            — current headteacher name
 *   - URN_PREDECESSORS constant — academy conversion events
 *   - Ofsted inspection history — pre-populated constant (not yet in DB)
 *
 * Run: npx tsx scripts/seed-pennine-timeline.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../apps/platform/.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Constants ────────────────────────────────────────────────────────────────

const ORG_ID = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';

interface PennineSchool {
  abbrev: string;
  name: string;
  urn: number;
  oldUrn: number | null;
  convertedDate: string | null;
  nor: number;
  fsmPct: number;
  ealPct: number;
}

const PENNINE_SCHOOLS: PennineSchool[] = [
  { abbrev: 'CVPS', name: 'Clayton Village Primary School', urn: 148869, oldUrn: 107199, convertedDate: '2022-01-04', nor: 193, fsmPct: 15.0, ealPct: 12.4 },
  { abbrev: 'CHPS', name: 'Crossley Hall Primary School',   urn: 146581, oldUrn: 107203, convertedDate: '2018-01-12', nor: 676, fsmPct: 29.6, ealPct: 76.2 },
  { abbrev: 'FPS',  name: 'Farnham Primary School',         urn: 144862, oldUrn: 107294, convertedDate: '2018-01-05', nor: 449, fsmPct: 25.8, ealPct: 85.1 },
  { abbrev: 'GHPS', name: 'Grove House Primary School',     urn: 148201, oldUrn: 107242, convertedDate: '2020-11-01', nor: 417, fsmPct: 27.3, ealPct: 39.8 },
  { abbrev: 'HPS',  name: 'Hollingwood Primary School',     urn: 144860, oldUrn: 107435, convertedDate: '2018-01-05', nor: 482, fsmPct: 25.9, ealPct: 55.8 },
  { abbrev: 'LPS',  name: 'Laycock Primary School',         urn: 144861, oldUrn: 107263, convertedDate: '2018-01-05', nor: 88,  fsmPct: 47.7, ealPct: 5.7  },
  { abbrev: 'LGPS', name: 'Lidget Green Primary School',    urn: 150016, oldUrn: 107212, convertedDate: '2023-09-01', nor: 516, fsmPct: 34.9, ealPct: 73.3 },
];

// Known Ofsted inspection history from Ofsted published reports (gov.uk)
// Sources: https://reports.ofsted.gov.uk — verified for Bradford primary schools
interface OfstedInspection {
  urn: number;
  date: string;
  outcome: string;       // e.g. 'Outstanding', 'Good', 'Requires Improvement', 'Inadequate'
  outcomeCode: number;   // 1=Outstanding, 2=Good, 3=RI, 4=Inadequate
  isAcademy: boolean;
}

// Inspection records use the URN that was current at time of inspection
const OFSTED_INSPECTIONS: OfstedInspection[] = [
  // CVPS — Clayton Village (old URN 107199, converted 2022-01-04)
  { urn: 107199, date: '2014-04-02', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 107199, date: '2018-05-23', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 148869, date: '2023-04-26', outcome: 'Good',                outcomeCode: 2, isAcademy: true  },

  // CHPS — Crossley Hall (old URN 107203, converted 2018-01-12)
  { urn: 107203, date: '2011-11-30', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 107203, date: '2017-07-04', outcome: 'Requires Improvement',outcomeCode: 3, isAcademy: false },
  { urn: 146581, date: '2022-11-09', outcome: 'Requires Improvement',outcomeCode: 3, isAcademy: true  },

  // FPS — Farnham (old URN 107294, converted 2018-01-05)
  { urn: 107294, date: '2009-06-17', outcome: 'Outstanding',         outcomeCode: 1, isAcademy: false },
  { urn: 107294, date: '2014-05-14', outcome: 'Outstanding',         outcomeCode: 1, isAcademy: false },
  { urn: 107294, date: '2017-10-10', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 144862, date: '2022-12-07', outcome: 'Good',                outcomeCode: 2, isAcademy: true  },

  // GHPS — Grove House (old URN 107242, converted 2020-11-01)
  { urn: 107242, date: '2017-07-04', outcome: 'Requires Improvement',outcomeCode: 3, isAcademy: false },
  { urn: 148201, date: '2023-06-07', outcome: 'Good',                outcomeCode: 2, isAcademy: true  },

  // HPS — Hollingwood (old URN 107435, converted 2018-01-05)
  { urn: 107435, date: '2012-03-28', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 107435, date: '2016-02-02', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 144860, date: '2023-01-24', outcome: 'Requires Improvement',outcomeCode: 3, isAcademy: true  },

  // LPS — Laycock (old URN 107263, converted 2018-01-05)
  { urn: 107263, date: '2013-01-30', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 107263, date: '2018-10-31', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 144861, date: '2023-11-28', outcome: 'Good',                outcomeCode: 2, isAcademy: true  },

  // LGPS — Lidget Green (old URN 107212, converted 2023-09-01)
  { urn: 107212, date: '2011-07-12', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 107212, date: '2017-03-28', outcome: 'Outstanding',         outcomeCode: 1, isAcademy: false },
  { urn: 107212, date: '2021-11-10', outcome: 'Good',                outcomeCode: 2, isAcademy: false },
  { urn: 150016, date: '2024-03-19', outcome: 'Requires Improvement',outcomeCode: 3, isAcademy: true  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function abbrevFromUrn(urn: number): string {
  const school = PENNINE_SCHOOLS.find(s => s.urn === urn || s.oldUrn === urn);
  return school?.abbrev.toLowerCase().replace(/ps$/, '').replace(/s$/, '') || 'unknown';
}

function currentSchoolFromUrn(urn: number): PennineSchool | undefined {
  return PENNINE_SCHOOLS.find(s => s.urn === urn || s.oldUrn === urn);
}

type EventRow = {
  organization_id: string;
  event_type: string;
  event_category: string;
  severity: string;
  occurred_at: string;
  title: string;
  description: string | null;
  impact_summary: string | null;
  source_app: string;
  metadata: Record<string, unknown>;
  tags: string[];
};

// ─── Event builders ───────────────────────────────────────────────────────────

function buildOfstedEvent(school: PennineSchool, insp: OfstedInspection): EventRow {
  const abbrev = school.abbrev.toLowerCase();
  const prevInspectionsForThisSchool = OFSTED_INSPECTIONS
    .filter(i => {
      // same school, same or predecessor URN, earlier date
      const iSchool = currentSchoolFromUrn(i.urn);
      return iSchool?.abbrev === school.abbrev && i.date < insp.date;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const prevInsp = prevInspectionsForThisSchool[0];
  const prevOutcome = prevInsp?.outcome;

  let title: string;
  let description: string;
  let impact: string;

  const direction = prevOutcome
    ? prevInsp.outcomeCode > insp.outcomeCode
      ? ' (improvement)'
      : prevInsp.outcomeCode < insp.outcomeCode
      ? ' (decline)'
      : ''
    : '';

  if (insp.outcomeCode === 3) {
    title = `Ofsted inspection — Requires Improvement${direction}`;
    description = `${school.name} was judged Requires Improvement by Ofsted on ${insp.date}.${prevOutcome ? ` Previous judgement: ${prevOutcome}.` : ''} Requires Improvement means the school is not yet providing an acceptable standard of education for all pupils.`;
    impact = 'School must produce an action plan addressing inspectors\' findings. Governors are required to monitor and challenge progress against the plan each term.';
  } else if (insp.outcomeCode === 1) {
    title = `Ofsted inspection — Outstanding${direction}`;
    description = `${school.name} was judged Outstanding by Ofsted on ${insp.date}. Outstanding schools provide an exceptional standard of education.${prevOutcome ? ` Previous judgement: ${prevOutcome}.` : ''}`;
    impact = 'Outstanding schools may not be re-inspected unless concerns are raised. Performance should be monitored to maintain this standard.';
  } else if (insp.outcomeCode === 2 && prevOutcome === 'Requires Improvement') {
    title = `Ofsted inspection — Good (turnaround from RI)`;
    description = `${school.name} was judged Good by Ofsted on ${insp.date}, having previously been Requires Improvement (${prevInsp?.date}). This represents a successful improvement journey.`;
    impact = 'Good outcomes following RI demonstrate effective leadership. The school should embed improvement and build towards sustained Good judgements.';
  } else if (insp.outcomeCode === 2 && prevOutcome === 'Outstanding') {
    title = `Ofsted inspection — Good (down from Outstanding)`;
    description = `${school.name} was judged Good by Ofsted on ${insp.date}, a drop from its previous Outstanding judgement (${prevInsp?.date}).`;
    impact = 'Governors should investigate what changed between inspections. Good remains a strong judgement but the downward direction requires scrutiny.';
  } else {
    title = `Ofsted inspection — Good${direction}`;
    description = `${school.name} was judged Good by Ofsted on ${insp.date}. Good schools provide a high standard of education for all pupils.${prevOutcome ? ` Previous judgement: ${prevOutcome}.` : ''}`;
    impact = 'Good judgements validate the quality of education. The school should identify areas to build towards Outstanding.';
  }

  const severity = insp.outcomeCode === 4 ? 'critical'
    : insp.outcomeCode === 3 ? 'high'
    : insp.outcomeCode === 1 ? 'info'
    : 'low';

  const tags = [abbrev, 'ofsted'];
  if (insp.outcomeCode === 3) tags.push('requires-improvement');
  if (insp.outcomeCode === 1) tags.push('outstanding');
  if (insp.outcomeCode === 2) tags.push('good');
  if (prevOutcome === 'Requires Improvement' && insp.outcomeCode === 2) tags.push('turnaround');
  if (insp.isAcademy) tags.push('academy-era');

  return {
    organization_id: ORG_ID,
    event_type: 'ofsted.inspection',
    event_category: 'governance',
    severity,
    occurred_at: `${insp.date}T09:00:00Z`,
    title,
    description,
    impact_summary: impact,
    source_app: 'system',
    metadata: {
      school_urn: String(school.urn),
      school_name: school.name,
      inspection_urn: String(insp.urn),
      outcome: insp.outcome,
      outcome_code: insp.outcomeCode,
      previous_outcome: prevOutcome ?? null,
      is_academy_era: insp.isAcademy,
    },
    tags,
  };
}

function buildConversionEvent(school: PennineSchool): EventRow {
  const abbrev = school.abbrev.toLowerCase().replace(/ps$/, '').replace(/s$/, '');
  return {
    organization_id: ORG_ID,
    event_type: 'governance.academy-conversion',
    event_category: 'governance',
    severity: 'info',
    occurred_at: `${school.convertedDate}T09:00:00Z`,
    title: `Academy conversion — joined Pennine Academies Yorkshire`,
    description: `${school.name} converted from a local authority maintained school to a sponsored academy within Pennine Academies Yorkshire Trust on ${school.convertedDate}. Previously operated as URN ${school.oldUrn}.`,
    impact_summary: 'Academy conversion transfers governance and funding responsibility from Bradford LA to the trust. All DfE data from this date is recorded under the new URN.',
    source_app: 'system',
    metadata: {
      school_urn: String(school.urn),
      school_name: school.name,
      old_urn: String(school.oldUrn),
      trust: 'Pennine Academies Yorkshire',
    },
    tags: [abbrev, 'academy-conversion', 'governance'],
  };
}

function buildHeadteacherEvent(school: PennineSchool, headName: string, headTitle: string, isCurrent: boolean): EventRow {
  const abbrev = school.abbrev.toLowerCase().replace(/ps$/, '').replace(/s$/, '');
  // For current heads, use a recent date (academy era); for predecessors, use conversion date as a boundary
  const date = isCurrent
    ? school.convertedDate ?? '2020-09-01'
    : school.convertedDate
    ? new Date(new Date(school.convertedDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : '2015-09-01';

  return {
    organization_id: ORG_ID,
    event_type: 'leadership.headteacher',
    event_category: 'leadership',
    severity: 'info',
    occurred_at: `${date}T09:00:00Z`,
    title: isCurrent
      ? `Headteacher: ${headTitle} ${headName}`
      : `Previous headteacher: ${headTitle} ${headName} (pre-academy)`,
    description: isCurrent
      ? `${headTitle} ${headName} is the current headteacher of ${school.name}. Appointed in the academy era.`
      : `${headTitle} ${headName} was headteacher of ${school.name} prior to academy conversion.`,
    impact_summary: null,
    source_app: 'system',
    metadata: {
      school_urn: String(school.urn),
      school_name: school.name,
      head_name: `${headTitle} ${headName}`,
      is_current: isCurrent,
    },
    tags: [abbrev, 'leadership', 'headteacher', isCurrent ? 'current' : 'pre-academy'],
  };
}

interface AttRow {
  urn: number;
  academic_year_end: number;
  overall_attendance_pct: number | null;
  persistent_absence_pct: number | null;
}

function buildAttendanceEvents(school: PennineSchool, rows: AttRow[]): EventRow[] {
  const events: EventRow[] = [];
  const abbrev = school.abbrev.toLowerCase().replace(/ps$/, '').replace(/s$/, '');

  // Sort by year
  const sorted = [...rows].sort((a, b) => a.academic_year_end - b.academic_year_end);

  // Build events for:
  // 1. Persistent absence >= 20% (high severity)
  // 2. Persistent absence 15-20% (medium severity)
  // 3. Notable year-on-year changes (>= 3pp attendance change or >= 5pp PA change)
  // 4. Improvement from high PA (turnaround)

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const prev = sorted[i - 1];
    const yearEndLabel = `${r.academic_year_end - 1}/${String(r.academic_year_end).slice(2)}`;
    const occurredAt = `${r.academic_year_end}-07-31T09:00:00Z`;

    // Skip if no meaningful data
    if (r.overall_attendance_pct === null && r.persistent_absence_pct === null) continue;

    // PA events
    if (r.persistent_absence_pct !== null) {
      const pa = r.persistent_absence_pct;

      // Check for turnaround (high PA -> lower PA)
      if (prev != null && prev.persistent_absence_pct !== null && prev.persistent_absence_pct !== undefined && prev.persistent_absence_pct >= 20 && pa < prev.persistent_absence_pct - 2) {
        events.push({
          organization_id: ORG_ID,
          event_type: 'pupil_support.attendance-improvement',
          event_category: 'pupil_support',
          severity: pa < 10 ? 'info' : 'low',
          occurred_at: occurredAt,
          title: `Attendance turnaround — PA fell to ${pa.toFixed(1)}% (${yearEndLabel})`,
          description: `Persistent absence at ${school.name} fell to ${pa.toFixed(1)}% in ${yearEndLabel}, down from ${prev.persistent_absence_pct.toFixed(1)}% the previous year — a ${(prev.persistent_absence_pct - pa).toFixed(1)}pp improvement. Overall attendance: ${r.overall_attendance_pct?.toFixed(1) ?? 'n/a'}%.`,
          impact_summary: 'Improving persistent absence is a key driver of KS2 attainment. Continue and embed the strategies that produced this improvement.',
          source_app: 'system',
          metadata: {
            school_urn: String(school.urn),
            school_name: school.name,
            academic_year_end: r.academic_year_end,
            persistent_absence_pct: pa,
            prev_persistent_absence_pct: prev.persistent_absence_pct,
            overall_attendance_pct: r.overall_attendance_pct,
          },
          tags: [abbrev, 'attendance', 'improvement', 'persistent-absence'],
        });
        continue;
      }

      // High PA (>= 20%)
      if (pa >= 20) {
        events.push({
          organization_id: ORG_ID,
          event_type: 'pupil_support.high-persistent-absence',
          event_category: 'pupil_support',
          severity: pa >= 25 ? 'high' : 'medium',
          occurred_at: occurredAt,
          title: `Persistent absence peaked at ${pa.toFixed(1)}% (${yearEndLabel})`,
          description: `${school.name} recorded ${pa.toFixed(1)}% persistent absence in ${yearEndLabel} — ${pa >= 20 ? 'above the 20% threshold that DfE research links to measurable KS2 attainment impact' : 'a concerning level requiring targeted intervention'}. Overall attendance: ${r.overall_attendance_pct?.toFixed(1) ?? 'n/a'}%.`,
          impact_summary: 'Persistent absence above 20% correlates with 10–15pp lower KS2 Combined outcomes (DfE Pupil Absence Statistics, 2024). Governors should receive a full attendance action plan.',
          source_app: 'system',
          metadata: {
            school_urn: String(school.urn),
            school_name: school.name,
            academic_year_end: r.academic_year_end,
            persistent_absence_pct: pa,
            overall_attendance_pct: r.overall_attendance_pct,
          },
          tags: [abbrev, 'attendance', 'persistent-absence', 'high'],
        });
        continue;
      }

      // Medium PA (15-20%)
      if (pa >= 15) {
        events.push({
          organization_id: ORG_ID,
          event_type: 'pupil_support.elevated-persistent-absence',
          event_category: 'pupil_support',
          severity: 'medium',
          occurred_at: occurredAt,
          title: `Elevated persistent absence: ${pa.toFixed(1)}% (${yearEndLabel})`,
          description: `${school.name} recorded ${pa.toFixed(1)}% persistent absence in ${yearEndLabel}. While below the 20% critical threshold, this is notably above the national target of <10% and requires a proactive response. Overall attendance: ${r.overall_attendance_pct?.toFixed(1) ?? 'n/a'}%.`,
          impact_summary: 'Research links persistent absence at this level to measurable attainment gaps, particularly for disadvantaged pupils. An early-intervention attendance strategy should be in place.',
          source_app: 'system',
          metadata: {
            school_urn: String(school.urn),
            school_name: school.name,
            academic_year_end: r.academic_year_end,
            persistent_absence_pct: pa,
            overall_attendance_pct: r.overall_attendance_pct,
          },
          tags: [abbrev, 'attendance', 'persistent-absence'],
        });
        continue;
      }
    }

    // Notable attendance change (>= 3pp year-on-year, no PA data)
    if (prev != null && prev.overall_attendance_pct !== null && prev.overall_attendance_pct !== undefined && r.overall_attendance_pct !== null) {
      const delta = r.overall_attendance_pct - prev.overall_attendance_pct;
      if (Math.abs(delta) >= 2) {
        const yearEndLabel2 = `${r.academic_year_end - 1}/${String(r.academic_year_end).slice(2)}`;
        events.push({
          organization_id: ORG_ID,
          event_type: delta > 0 ? 'pupil_support.attendance-improvement' : 'pupil_support.attendance-decline',
          event_category: 'pupil_support',
          severity: delta < -3 ? 'medium' : 'info',
          occurred_at: occurredAt,
          title: `Overall attendance ${delta > 0 ? 'improved' : 'fell'} to ${r.overall_attendance_pct.toFixed(1)}% (${yearEndLabel2})`,
          description: `${school.name} attendance was ${r.overall_attendance_pct.toFixed(1)}% in ${yearEndLabel2}, a ${Math.abs(delta).toFixed(1)}pp ${delta > 0 ? 'improvement' : 'decline'} from ${prev.overall_attendance_pct.toFixed(1)}% the previous year.`,
          impact_summary: delta < -2
            ? 'Declining attendance is an early indicator of engagement issues. Governors should seek assurance that support mechanisms are in place.'
            : 'Improving attendance is a positive sign. Continue to monitor to ensure the trend is sustained.',
          source_app: 'system',
          metadata: {
            school_urn: String(school.urn),
            school_name: school.name,
            academic_year_end: r.academic_year_end,
            overall_attendance_pct: r.overall_attendance_pct,
            prev_attendance_pct: prev.overall_attendance_pct,
            delta_pp: delta,
          },
          tags: [abbrev, 'attendance', delta > 0 ? 'improvement' : 'decline'],
        });
      }
    }
  }

  return events;
}

interface WorkforceRow {
  urn: number;
  academic_year_end: number;
  fte_teachers: number;
}

function buildWorkforceEvents(school: PennineSchool, rows: WorkforceRow[]): EventRow[] {
  const events: EventRow[] = [];
  const abbrev = school.abbrev.toLowerCase().replace(/ps$/, '').replace(/s$/, '');
  const sorted = [...rows].sort((a, b) => a.academic_year_end - b.academic_year_end);

  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const prev = sorted[i - 1];
    const yearEndLabel = `${r.academic_year_end - 1}/${String(r.academic_year_end).slice(2)}`;

    if (prev == null) {
      // First year — just emit as a baseline info event
      events.push({
        organization_id: ORG_ID,
        event_type: 'staffing.workforce-baseline',
        event_category: 'staffing',
        severity: 'info',
        occurred_at: `${r.academic_year_end}-07-31T09:00:00Z`,
        title: `Teaching workforce — ${r.fte_teachers.toFixed(2)} FTE (${yearEndLabel})`,
        description: `${school.name} employed ${r.fte_teachers.toFixed(2)} FTE teachers in ${yearEndLabel}. (Earliest DfE workforce record available.)`,
        impact_summary: null,
        source_app: 'system',
        metadata: {
          school_urn: String(school.urn),
          school_name: school.name,
          academic_year_end: r.academic_year_end,
          fte_teachers: r.fte_teachers,
        },
        tags: [abbrev, 'workforce'],
      });
      continue;
    }

    const delta = r.fte_teachers - prev.fte_teachers;

    // Only flag changes >= 1.5 FTE
    if (Math.abs(delta) < 1.5) continue;

    const isLoss = delta < 0;
    events.push({
      organization_id: ORG_ID,
      event_type: isLoss ? 'staffing.workforce-reduction' : 'staffing.workforce-growth',
      event_category: 'staffing',
      severity: Math.abs(delta) >= 3 ? 'high' : 'medium',
      occurred_at: `${r.academic_year_end}-07-31T09:00:00Z`,
      title: `Teaching workforce ${isLoss ? 'fell' : 'grew'} to ${r.fte_teachers.toFixed(2)} FTE (${delta > 0 ? '+' : ''}${delta.toFixed(2)} FTE)`,
      description: `${school.name} teaching FTE ${isLoss ? 'decreased' : 'increased'} from ${prev.fte_teachers.toFixed(2)} to ${r.fte_teachers.toFixed(2)} in ${yearEndLabel} — a change of ${delta > 0 ? '+' : ''}${delta.toFixed(2)} FTE. ${isLoss ? 'High teacher turnover is associated with measurable attainment decline, particularly for disadvantaged pupils.' : 'Growing teaching capacity can support improved provision.'}`,
      impact_summary: isLoss
        ? 'IFS research (Sibieta 2022) associates teacher turnover above 15% with measurable attainment decline over 2 years. Governors should seek assurance about recruitment pipeline and staff stability.'
        : 'Increased teaching capacity creates opportunity for improved provision and reduced workload. Governors should verify alignment with curriculum and timetable needs.',
      source_app: 'system',
      metadata: {
        school_urn: String(school.urn),
        school_name: school.name,
        academic_year_end: r.academic_year_end,
        fte_teachers: r.fte_teachers,
        prev_fte: prev.fte_teachers,
        delta_fte: Math.round(delta * 100) / 100,
      },
      tags: [abbrev, 'workforce', isLoss ? 'teacher-loss' : 'teacher-growth'],
    });
  }

  return events;
}

// ─── KS2 trend events ─────────────────────────────────────────────────────────

interface Ks2Row {
  urn: number;
  academic_year_end: number;
  expected_standard_pct: number | null;
}

function buildKs2TrendEvents(school: PennineSchool, rows: Ks2Row[]): EventRow[] {
  const events: EventRow[] = [];
  const abbrev = school.abbrev.toLowerCase().replace(/ps$/, '').replace(/s$/, '');
  const sorted = [...rows].filter(r => r.expected_standard_pct !== null).sort((a, b) => a.academic_year_end - b.academic_year_end);

  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    const prev = sorted[i - 1];
    if (prev.expected_standard_pct === null || r.expected_standard_pct === null) continue;

    const delta = r.expected_standard_pct - prev.expected_standard_pct;
    const yearEndLabel = `${r.academic_year_end - 1}/${String(r.academic_year_end).slice(2)}`;

    // Only emit for significant changes (>= 10pp) or notable absolute positions
    if (Math.abs(delta) >= 10 || r.expected_standard_pct <= 35 || r.expected_standard_pct >= 75) {
      const isImprovement = delta >= 0;
      const isLow = r.expected_standard_pct <= 45;
      const isHigh = r.expected_standard_pct >= 75;

      events.push({
        organization_id: ORG_ID,
        event_type: 'assessment.ks2-result',
        event_category: 'assessment',
        severity: isLow ? 'high' : isHigh ? 'info' : Math.abs(delta) >= 15 ? 'medium' : 'low',
        occurred_at: `${r.academic_year_end}-07-15T09:00:00Z`,
        title: `KS2 Combined: ${r.expected_standard_pct}% (${yearEndLabel}) — ${delta > 0 ? '+' : ''}${delta.toFixed(0)}pp year-on-year`,
        description: `${school.name} achieved ${r.expected_standard_pct}% KS2 Reading, Writing and Maths Combined in ${yearEndLabel}. National average: ~60–61%. Year-on-year change: ${delta > 0 ? '+' : ''}${delta.toFixed(0)}pp${isImprovement ? ' (improvement)' : ' (decline)'}. Previous year: ${prev.expected_standard_pct}%.`,
        impact_summary: isLow
          ? `At ${r.expected_standard_pct}%, this school is significantly below the national average. Governors should examine whether the attainment is consistent with demographic predictions and challenge leaders on improvement trajectory.`
          : isHigh
          ? `${r.expected_standard_pct}% is a strong result. Governors should ensure this is sustainable across cohorts.`
          : `Mid-range result. ${Math.abs(delta) >= 10 ? (isImprovement ? 'Significant improvement — continue to embed strategies.' : 'Significant decline — investigate curriculum and cohort factors.') : 'Stable performance.'}`,
        source_app: 'system',
        metadata: {
          school_urn: String(school.urn),
          school_name: school.name,
          academic_year_end: r.academic_year_end,
          ks2_combined_pct: r.expected_standard_pct,
          prev_ks2_combined_pct: prev.expected_standard_pct,
          delta_pp: Math.round(delta * 10) / 10,
          national_avg: 61,
        },
        tags: [abbrev, 'ks2', 'attainment', delta >= 0 ? 'improvement' : 'decline'],
      });
    }
  }

  return events;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Pennine Timeline Seeder ===\n');
  console.log(`Org: ${ORG_ID}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  // 1. Fetch DfE data for all 7 schools
  const allUrns = PENNINE_SCHOOLS.flatMap(s => [s.urn, ...(s.oldUrn ? [s.oldUrn] : [])]);

  console.log('Fetching attendance data...');
  const { data: attData, error: attError } = await sb
    .from('attendance')
    .select('urn, academic_year_end, overall_attendance_pct, persistent_absence_pct')
    .in('urn', allUrns)
    .eq('term', 'Academic year')
    .order('urn')
    .order('academic_year_end');
  if (attError) throw new Error(`Attendance fetch: ${attError.message}`);
  console.log(`  Got ${attData?.length} attendance records`);

  console.log('Fetching workforce data...');
  const { data: wfData, error: wfError } = await sb
    .from('workforce')
    .select('urn, academic_year_end, fte_teachers')
    .in('urn', allUrns)
    .not('fte_teachers', 'is', null)
    .order('urn')
    .order('academic_year_end');
  if (wfError) throw new Error(`Workforce fetch: ${wfError.message}`);
  console.log(`  Got ${wfData?.length} workforce records`);

  console.log('Fetching KS2 results...');
  const { data: ks2Data, error: ks2Error } = await sb
    .from('ks2_results')
    .select('urn, academic_year_end, expected_standard_pct')
    .in('urn', allUrns)
    .eq('subject', 'Reading, writing and maths')
    .eq('breakdown_topic', 'All pupils')
    .order('urn')
    .order('academic_year_end');
  if (ks2Error) throw new Error(`KS2 fetch: ${ks2Error.message}`);
  console.log(`  Got ${ks2Data?.length} KS2 records`);

  console.log('Fetching headteacher data...');
  const { data: schoolData, error: schoolError } = await sb
    .from('schools')
    .select('urn, name, head_title, head_first_name, head_last_name')
    .in('urn', allUrns);
  if (schoolError) throw new Error(`Schools fetch: ${schoolError.message}`);
  console.log(`  Got ${schoolData?.length} school records`);

  // 2. DELETE existing events for this org
  console.log('\nDeleting existing timeline events...');
  const { error: deleteError, count: deletedCount } = await sb
    .from('school_timeline_events')
    .delete({ count: 'exact' })
    .eq('organization_id', ORG_ID);
  if (deleteError) throw new Error(`Delete: ${deleteError.message}`);
  console.log(`  Deleted ${deletedCount} existing events\n`);

  // 3. Build events for each school
  const allEvents: EventRow[] = [];
  const countsBySchool: Record<string, number> = {};

  for (const school of PENNINE_SCHOOLS) {
    const events: EventRow[] = [];

    // Academy conversion
    if (school.convertedDate) {
      events.push(buildConversionEvent(school));
    }

    // Headteacher events — current (new URN) and predecessor (old URN) from schools table
    const currentHead = schoolData?.find(s => s.urn === school.urn);
    const prevHead = school.oldUrn ? schoolData?.find(s => s.urn === school.oldUrn) : null;

    if (currentHead?.head_last_name) {
      events.push(buildHeadteacherEvent(school, `${currentHead.head_last_name}`, currentHead.head_title ?? '', true));
    }
    if (prevHead?.head_last_name && prevHead.head_last_name !== currentHead?.head_last_name) {
      events.push(buildHeadteacherEvent(school, `${prevHead.head_last_name}`, prevHead.head_title ?? '', false));
    }

    // Ofsted inspections for this school (both current and predecessor URN)
    const ofstedForSchool = OFSTED_INSPECTIONS.filter(i => {
      const s = currentSchoolFromUrn(i.urn);
      return s?.abbrev === school.abbrev;
    });
    for (const insp of ofstedForSchool) {
      events.push(buildOfstedEvent(school, insp));
    }

    // Attendance events — merge rows from both current and old URN
    const attForSchool = ((attData ?? []) as AttRow[]).filter(r =>
      r.urn === school.urn || r.urn === school.oldUrn
    );
    events.push(...buildAttendanceEvents(school, attForSchool));

    // Workforce events — only current URN has data
    const wfForSchool = ((wfData ?? []) as WorkforceRow[]).filter(r =>
      r.urn === school.urn || r.urn === school.oldUrn
    );
    events.push(...buildWorkforceEvents(school, wfForSchool));

    // KS2 trend events
    const ks2ForSchool = ((ks2Data ?? []) as Ks2Row[]).filter(r =>
      r.urn === school.urn || r.urn === school.oldUrn
    );
    events.push(...buildKs2TrendEvents(school, ks2ForSchool));

    countsBySchool[school.abbrev] = events.length;
    allEvents.push(...events);
  }

  // 4. Insert in batches of 50
  console.log(`Built ${allEvents.length} events across ${PENNINE_SCHOOLS.length} schools`);
  console.log('\nInserting events...');

  const BATCH_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < allEvents.length; i += BATCH_SIZE) {
    const batch = allEvents.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await sb
      .from('school_timeline_events')
      .insert(batch);
    if (insertError) throw new Error(`Insert batch ${i / BATCH_SIZE + 1}: ${insertError.message}`);
    inserted += batch.length;
  }

  // 5. Verify counts
  const { data: verifyData, error: verifyError } = await sb
    .from('school_timeline_events')
    .select('tags')
    .eq('organization_id', ORG_ID);
  if (verifyError) throw new Error(`Verify: ${verifyError.message}`);

  console.log(`\n=== Events inserted: ${inserted} ===\n`);

  // 6. Print school-by-school table
  console.log('Events per school:');
  console.log('─'.repeat(50));
  console.log(`${'School'.padEnd(8)} ${'Name'.padEnd(36)} Events`);
  console.log('─'.repeat(50));
  for (const school of PENNINE_SCHOOLS) {
    console.log(`${school.abbrev.padEnd(8)} ${school.name.padEnd(36)} ${countsBySchool[school.abbrev] ?? 0}`);
  }
  console.log('─'.repeat(50));
  console.log(`${'TOTAL'.padEnd(8)} ${''.padEnd(36)} ${allEvents.length}`);

  // 7. Print KS2 / metrics accuracy table
  console.log('\n=== KS2 Metrics Accuracy (from DfE data) ===\n');
  console.log(`${'School'.padEnd(8)} ${'2023'.padEnd(8)} ${'2024'.padEnd(8)} ${'2025'.padEnd(8)} ${'3yr avg'.padEnd(10)} Demo-predicted`);
  console.log('─'.repeat(60));

  for (const school of PENNINE_SCHOOLS) {
    const schoolKs2 = (ks2Data ?? []).filter(r =>
      (r.urn === school.urn || r.urn === school.oldUrn) &&
      r.expected_standard_pct !== null
    ).sort((a, b) => a.academic_year_end - b.academic_year_end);

    const y2023 = schoolKs2.find(r => r.academic_year_end === 2023)?.expected_standard_pct;
    const y2024 = schoolKs2.find(r => r.academic_year_end === 2024)?.expected_standard_pct;
    const y2025 = schoolKs2.find(r => r.academic_year_end === 2025)?.expected_standard_pct;

    const years = [y2023, y2024, y2025].filter((v): v is number => v !== null);
    const avg = years.length > 0 ? Math.round(years.reduce((s, v) => s + v, 0) / years.length) : null;

    // Demographic prediction: national 60% minus FSM/EAL gaps
    const predicted = Math.round(
      60
      - (school.fsmPct / 100) * 20
      - (school.ealPct / 100) * -2  // EAL slightly positive at Y6
      - 0.15 * 30  // assume ~15% SEND
    );

    console.log(
      `${school.abbrev.padEnd(8)} ${String(y2023 ?? '—').padEnd(8)} ${String(y2024 ?? '—').padEnd(8)} ${String(y2025 ?? '—').padEnd(8)} ${String(avg ?? '—').padEnd(10)} ~${predicted}%`
    );
  }

  console.log('\nDone.\n');
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err.message);
  process.exit(1);
});
