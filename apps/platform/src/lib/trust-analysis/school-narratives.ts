import {
  SchoolNarrative,
  SchoolSelfReport,
  KS2Result,
  CensusRecord,
  DivergenceFlag,
  DataQualityFlag,
  getSchoolByAbbrev,
} from './types';

/**
 * Generates a per-school written narrative report for the Pennine trust analysis.
 *
 * Analyses Y6 KS2 performance, divergence from self-reported data, data quality,
 * FSM disadvantage gaps, census context, and trajectory across year groups.
 */
export function generateSchoolNarrative(
  report: SchoolSelfReport,
  ks2Results: KS2Result[],
  census: CensusRecord[],
  divergences: DivergenceFlag[],
  qualityFlags: DataQualityFlag[],
): SchoolNarrative {
  const strengths: string[] = [];
  const concerns: string[] = [];
  const ofstedQuestions: string[] = [];

  const school = getSchoolByAbbrev(report.school);
  const nor = school?.nor ?? 0;

  // ─── Small School Caveat ─────────────────────────────────────────────
  if (nor > 0 && nor < 100) {
    concerns.push(
      `Small school (NOR ${nor}): percentage-based results are statistically unreliable — ` +
        `small cohort sizes mean one or two pupils can shift headline figures significantly.`,
    );
  }

  // ─── Y6 Performance ──────────────────────────────────────────────────
  const y6Data = report.yearGroups.find((yg) => yg.yearGroup === 'Y6');

  if (y6Data) {
    const combined = y6Data.allPupils.combined;
    const writing = y6Data.allPupils.writing;
    const gdWriting = y6Data.gd.writing;

    // Combined >= 70 = strength, < 50 = concern
    if (combined !== null) {
      if (combined >= 70) {
        strengths.push(
          `Y6 combined expected standard is strong at ${combined}%, above the typical trust benchmark.`,
        );
      } else if (combined < 50) {
        concerns.push(
          `Y6 combined expected standard is very low at ${combined}%, well below national expectations.`,
        );
      }
    }

    // Writing < 60 = concern (trust-wide pattern flagged)
    if (writing !== null && writing < 60) {
      concerns.push(
        `Y6 writing expected standard is ${writing}%, below the 60% threshold that is a recurring concern across the trust.`,
      );
    }

    // Zero GD Writing = concern + Ofsted question
    if (gdWriting !== null && gdWriting === 0) {
      concerns.push(
        `No pupils achieved Greater Depth in Y6 writing — zero GD Writing is a significant outlier.`,
      );
      ofstedQuestions.push(
        `What specific barriers are preventing any pupils from reaching Greater Depth in writing, ` +
          `and what targeted approaches have been trialled?`,
      );
    }
  }

  // ─── Divergence Flags ────────────────────────────────────────────────
  const schoolDivergences = divergences.filter((d) => d.school === report.school);
  for (const d of schoolDivergences) {
    if (d.rag === 'red') {
      if (d.divergencePp > 0) {
        // Self-reported higher than validated: over-claim
        concerns.push(
          `${d.subject}: self-reported figure (${d.selfReportedPct}%) is ${d.divergencePp}pp above ` +
            `the validated DfE figure (${d.validatedPct}%) — a significant over-claim requiring scrutiny.`,
        );
        ofstedQuestions.push(
          `Self-reported ${d.subject} data exceeds validated outcomes by ${d.divergencePp}pp. ` +
            `What evidence underpins the school's own assessment, and how is moderation assured?`,
        );
      } else {
        // Self-reported lower than validated: unexplained decline
        const gap = Math.abs(d.divergencePp);
        concerns.push(
          `${d.subject}: validated DfE figure (${d.validatedPct}%) is ${gap}pp above the school's ` +
            `own reported figure (${d.selfReportedPct}%) — an unexplained gap in self-assessment.`,
        );
        ofstedQuestions.push(
          `Validated ${d.subject} outcomes are ${gap}pp higher than the school's self-reported figure. ` +
            `Does the school have an accurate picture of its own performance, and how is this monitored?`,
        );
      }
    }
  }

  // ─── Data Quality ────────────────────────────────────────────────────
  const schoolQualityFlags = qualityFlags.filter((f) => f.school === report.school);
  for (const flag of schoolQualityFlags) {
    if (flag.severity === 'error') {
      concerns.push(
        `Data quality issue in ${flag.yearGroup}: ${flag.issue}`,
      );
    }
  }

  // ─── FSM Disadvantage Gap ────────────────────────────────────────────
  const y6ForFsm = report.yearGroups.find((yg) => yg.yearGroup === 'Y6');
  if (y6ForFsm) {
    const allCombined = y6ForFsm.allPupils.combined;
    const fsmCombined = y6ForFsm.fsm6.combined;
    const nonFsmCombined = y6ForFsm.nonFsm.combined;

    if (fsmCombined !== null && nonFsmCombined !== null) {
      const gap = nonFsmCombined - fsmCombined;

      if (gap > 20) {
        concerns.push(
          `FSM disadvantage gap in Y6 combined is ${gap}pp (FSM: ${fsmCombined}%, non-FSM: ${nonFsmCombined}%) — ` +
            `significantly above the 20pp threshold warranting scrutiny of Pupil Premium effectiveness.`,
        );
        ofstedQuestions.push(
          `The FSM gap in Y6 combined is ${gap}pp. How is Pupil Premium funding being deployed, ` +
            `and what evidence demonstrates impact on disadvantaged pupils?`,
        );
      } else if (gap <= 10) {
        strengths.push(
          `FSM disadvantage gap in Y6 combined is narrow at ${gap}pp (FSM: ${fsmCombined}%, non-FSM: ${nonFsmCombined}%) — ` +
            `a notable achievement given the school's context.`,
        );
      }
    } else if (allCombined !== null) {
      // Partial data — note absence of FSM breakdown
    }
  }

  // ─── Census Context: FSM Rise ────────────────────────────────────────
  const schoolUrn = school?.urn;
  if (schoolUrn) {
    const schoolCensus = census
      .filter((c) => c.urn === schoolUrn && c.fsmPct !== null)
      .sort((a, b) => a.academicYearEnd - b.academicYearEnd);

    if (schoolCensus.length >= 2) {
      const earliest = schoolCensus[0].fsmPct as number;
      const latest = schoolCensus[schoolCensus.length - 1].fsmPct as number;
      const fsmRise = latest - earliest;

      if (fsmRise > 10) {
        concerns.push(
          `FSM eligibility has risen by ${fsmRise.toFixed(1)}pp over the census period ` +
            `(${earliest.toFixed(1)}% → ${latest.toFixed(1)}%) — the school is serving an ` +
            `increasingly disadvantaged community.`,
        );
        ofstedQuestions.push(
          `FSM has risen by ${fsmRise.toFixed(1)}pp over recent years. How has the school adapted ` +
            `its provision, pastoral support, and Pupil Premium strategy in response to this demographic shift?`,
        );
      }
    }
  }

  // ─── Trajectory Across Year Groups ──────────────────────────────────
  // Look at Combined scores for the most recent data per year group.
  // Take the last 3 year groups with Combined data and assess the trend.
  const yearGroupsWithCombined = report.yearGroups
    .filter((yg) => yg.allPupils.combined !== null)
    .slice(-3); // last 3 with data (order preserved from YEAR_GROUPS array)

  if (yearGroupsWithCombined.length >= 2) {
    const first = yearGroupsWithCombined[0].allPupils.combined as number;
    const last =
      yearGroupsWithCombined[yearGroupsWithCombined.length - 1].allPupils.combined as number;
    const trend = last - first;

    if (trend > 10) {
      const from = yearGroupsWithCombined[0].yearGroup;
      const to = yearGroupsWithCombined[yearGroupsWithCombined.length - 1].yearGroup;
      strengths.push(
        `Combined expected standard has improved by ${trend}pp from ${from} to ${to} ` +
          `(${first}% → ${last}%) — a positive trajectory across year groups.`,
      );
    } else if (trend < -10) {
      const from = yearGroupsWithCombined[0].yearGroup;
      const to = yearGroupsWithCombined[yearGroupsWithCombined.length - 1].yearGroup;
      concerns.push(
        `Combined expected standard has declined by ${Math.abs(trend)}pp from ${from} to ${to} ` +
          `(${first}% → ${last}%) — a downward trajectory requiring investigation.`,
      );
    }
  }

  // ─── Overall Assessment ──────────────────────────────────────────────
  let overallAssessment: string;
  if (concerns.length === 0) {
    overallAssessment =
      `${report.school} presents as a strong performer with no significant concerns identified ` +
      `from available data. Strengths are evident across multiple dimensions.`;
  } else if (concerns.length <= 2) {
    overallAssessment =
      `${report.school} shows some areas requiring attention. With ${concerns.length} concern(s) ` +
      `identified, targeted support and monitoring is recommended in the areas noted above.`;
  } else {
    overallAssessment =
      `${report.school} has multiple concerns (${concerns.length}) that require active trust support. ` +
      `A structured improvement plan and closer monitoring is strongly recommended.`;
  }

  return {
    school: report.school,
    strengths,
    concerns,
    ofstedQuestions,
    overallAssessment,
  };
}
