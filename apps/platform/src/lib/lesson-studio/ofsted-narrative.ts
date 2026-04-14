import type { LSIntervention, LSInterventionSession } from "@/types/lesson-studio";

/**
 * Generates an Ofsted-ready narrative for a pupil's intervention.
 *
 * This is a pure template-based generator -- no AI calls.
 * It fills in professional prose from the provided data.
 */
export function generateOfstedNarrative(data: {
  pupilName: string;
  subject: string;
  currentGrade: string;
  previousGrade: string;
  intervention: LSIntervention;
  sessions: LSInterventionSession[];
  assessmentHistory: Array<{ date: string; grade: string; source: string }>;
}): string {
  const { pupilName, subject, currentGrade, previousGrade, intervention, sessions, assessmentHistory } = data;

  const formatMap: Record<string, string> = {
    one_to_one: "one-to-one tuition",
    small_group: "small group intervention",
    in_class: "in-class targeted support",
    catch_up: "catch-up programme",
    homework: "structured homework programme",
  };

  const formatLabel = formatMap[intervention.format] ?? intervention.format;

  // Grade improvement detection
  const GRADE_ORDER: Record<string, number> = { PKF: 0, PKE: 1, WTS: 2, EXS: 3, GDS: 4 };
  const prevOrd = GRADE_ORDER[previousGrade] ?? -1;
  const currOrd = GRADE_ORDER[currentGrade] ?? -1;
  const gradeImproved = currOrd > prevOrd;
  const gradeSame = currOrd === prevOrd;

  // Session stats
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const latestSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

  // Assessment timeline
  const sortedHistory = [...assessmentHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const timelineEntries = sortedHistory
    .map((h) => `${h.grade} (${h.source}, ${formatDate(h.date)})`)
    .join(", then ");

  // ---- Paragraph 1: Identification ----
  const para1Parts: string[] = [];
  para1Parts.push(
    `Through rigorous use of ongoing assessment data, ${pupilName} was identified as working at ${previousGrade} in ${subject}.`,
  );
  if (assessmentHistory.length > 1) {
    para1Parts.push(
      `The assessment journey shows: ${timelineEntries}.`,
    );
  }
  para1Parts.push(
    `The target for this intervention is: ${intervention.target}.`,
  );

  // ---- Paragraph 2: Intervention design ----
  const para2Parts: string[] = [];
  para2Parts.push(
    `In response, the school put in place a structured ${formatLabel} programme: "${intervention.title}".`,
  );

  if (intervention.eef_strategy_name) {
    para2Parts.push(
      `This approach is underpinned by the EEF Teaching and Learning Toolkit strategy "${intervention.eef_strategy_name}"` +
        (intervention.eef_impact_months != null
          ? `, which has an evidence base showing an average of +${intervention.eef_impact_months} months of additional progress.`
          : `.`),
    );
  }

  if (intervention.frequency) {
    para2Parts.push(`Sessions are delivered ${intervention.frequency}.`);
  }
  if (intervention.delivered_by) {
    para2Parts.push(`The intervention is delivered by ${intervention.delivered_by}.`);
  }
  if (intervention.success_criteria) {
    para2Parts.push(`Success criteria: ${intervention.success_criteria}.`);
  }

  // ---- Paragraph 3: Session evidence ----
  const para3Parts: string[] = [];
  if (totalSessions > 0) {
    para3Parts.push(
      `To date, ${totalSessions} session${totalSessions !== 1 ? "s" : ""} have been delivered, totalling ${totalMinutes} minutes of focused support.`,
    );
    if (latestSession?.observation) {
      para3Parts.push(
        `In the most recent session (${formatDate(latestSession.session_date)}), the following was observed: "${latestSession.observation}".`,
      );
    }
    if (latestSession?.progress_note) {
      para3Parts.push(`Progress note: ${latestSession.progress_note}.`);
    }

    // CPA stage distribution
    const stageCounts = sessions.reduce(
      (acc, s) => {
        if (s.stage) acc[s.stage] = (acc[s.stage] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const stageEntries = Object.entries(stageCounts);
    if (stageEntries.length > 0) {
      const stageDesc = stageEntries
        .map(([stage, count]) => `${count} at the ${stage} stage`)
        .join(", ");
      para3Parts.push(
        `Sessions have covered the CPA progression: ${stageDesc}.`,
      );
    }
  } else {
    para3Parts.push(
      "The intervention has been planned and is awaiting its first delivery session.",
    );
  }

  // ---- Paragraph 4: Impact and next steps ----
  const para4Parts: string[] = [];
  if (gradeImproved) {
    para4Parts.push(
      `The impact of this intervention is evident: ${pupilName} has progressed from ${previousGrade} to ${currentGrade} in ${subject}, demonstrating that the targeted approach is having a measurable effect on attainment.`,
    );
  } else if (gradeSame) {
    para4Parts.push(
      `${pupilName} is currently assessed at ${currentGrade} in ${subject}. While the grade has not yet changed, qualitative evidence from session observations indicates growing confidence and understanding of the target skills.`,
    );
  } else {
    para4Parts.push(
      `${pupilName} is currently assessed at ${currentGrade} in ${subject}. The school is closely monitoring progress and reviewing the intervention approach to ensure it is having the intended impact.`,
    );
  }

  if (intervention.status === "completed") {
    para4Parts.push(
      "The intervention has been completed. The school will continue to monitor sustained impact through regular assessment.",
    );
  } else if (intervention.target_end_date) {
    para4Parts.push(
      `The intervention is scheduled to continue until ${formatDate(intervention.target_end_date)}.`,
    );
  }

  if (latestSession?.next_session_plan) {
    para4Parts.push(`Next steps: ${latestSession.next_session_plan}.`);
  }

  // Assemble the narrative
  return [
    para1Parts.join(" "),
    para2Parts.join(" "),
    para3Parts.join(" "),
    para4Parts.join(" "),
  ].join("\n\n");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}
