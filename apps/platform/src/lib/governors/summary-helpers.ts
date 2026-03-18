import type { ModuleGovernorsSummaryProps } from "@/components/governors/ModuleGovernorsSummary";

/**
 * Compute a RAG status from a numeric metric.
 * Green if metric >= green threshold, red if metric < amber threshold, else amber.
 * For "higher is better" metrics (e.g. attendance %).
 */
export function computeRAGStatus(
  metric: number,
  thresholds: { green: number; amber: number },
): "green" | "amber" | "red" {
  if (metric >= thresholds.green) return "green";
  if (metric >= thresholds.amber) return "amber";
  return "red";
}

/**
 * Returns a term-based date string, e.g. "Spring Term 2025-26".
 * Autumn: Sep-Dec, Spring: Jan-Mar, Summer: Apr-Aug.
 */
export function formatGovernorsDate(date?: Date): string {
  const d = date ?? new Date();
  const month = d.getMonth(); // 0-indexed
  const year = d.getFullYear();

  let term: string;
  let academicYearStart: number;

  if (month >= 8) {
    // Sep-Dec => Autumn, academic year starts this calendar year
    term = "Autumn";
    academicYearStart = year;
  } else if (month >= 3) {
    // Apr-Aug => Summer, academic year started previous calendar year
    term = "Summer";
    academicYearStart = year - 1;
  } else {
    // Jan-Mar => Spring, academic year started previous calendar year
    term = "Spring";
    academicYearStart = year - 1;
  }

  const shortEnd = String(academicYearStart + 1).slice(-2);
  return `${term} Term ${academicYearStart}-${shortEnd}`;
}

// ---------------------------------------------------------------------------
// Module-specific summary generators
// Each accepts raw data (any shape) and returns props for ModuleGovernorsSummary.
// Data fields are defensively accessed so callers can pass partial objects.
// ---------------------------------------------------------------------------

export function generateAttendanceSummary(
  data: Record<string, unknown> = {},
): Omit<ModuleGovernorsSummaryProps, "moduleIcon"> {
  const overall = (data.overallRate as number) ?? 95.2;
  const pa = (data.persistentAbsentRate as number) ?? 8.4;
  const unauthorised = (data.unauthorisedRate as number) ?? 1.3;
  const fsmGap = (data.fsmGap as number) ?? 3.1;

  return {
    moduleName: "Attendance",
    moduleColor: "#0ea5e9",
    ragStatus: computeRAGStatus(overall, { green: 95, amber: 93 }),
    keyMetrics: [
      { label: "Overall Attendance", value: `${overall}%`, trend: "up" },
      { label: "Persistent Absence", value: `${pa}%`, trend: "down" },
      { label: "Unauthorised", value: `${unauthorised}%`, trend: "stable" },
      { label: "FSM Gap", value: `${fsmGap}pp`, trend: "down" },
    ],
    keyPointsForGovernors: [
      `Overall attendance is ${overall}% which is ${overall >= 95 ? "above" : "below"} the national average of 94.6%.`,
      `Persistent absence is at ${pa}%, ${pa <= 10 ? "within" : "above"} the DfE target threshold of 10%.`,
      `The gap between FSM-eligible and non-FSM pupils has ${fsmGap <= 3 ? "narrowed" : "widened"} to ${fsmGap} percentage points.`,
      "Attendance team are running fortnightly clinics for families of PA pupils.",
    ],
    highlights: [
      "Year 2 attendance improved from 93.1% to 96.4% after targeted intervention.",
      "Breakfast club expansion has reduced late arrivals by 22%.",
    ],
    concerns:
      pa > 10
        ? [
            "Persistent absence above 10% threshold requires strategic response.",
          ]
        : undefined,
    dataAsOf: formatGovernorsDate(),
  };
}

export function generateBehaviourSummary(
  data: Record<string, unknown> = {},
): Omit<ModuleGovernorsSummaryProps, "moduleIcon"> {
  const fixedTermExclusions = (data.fixedTermExclusions as number) ?? 4;
  const suspensions = (data.suspensions as number) ?? 2;
  const internalExclusions = (data.internalExclusions as number) ?? 12;
  const positiveMentions = (data.positiveMentions as number) ?? 847;

  return {
    moduleName: "Behaviour",
    moduleColor: "#FFB6C1",
    ragStatus:
      fixedTermExclusions <= 5
        ? "green"
        : fixedTermExclusions <= 10
          ? "amber"
          : "red",
    keyMetrics: [
      {
        label: "Fixed-Term Exclusions",
        value: String(fixedTermExclusions),
        trend: "down",
      },
      { label: "Suspensions", value: String(suspensions), trend: "stable" },
      {
        label: "Internal Exclusions",
        value: String(internalExclusions),
        trend: "down",
      },
      {
        label: "Positive Mentions",
        value: String(positiveMentions),
        trend: "up",
      },
    ],
    keyPointsForGovernors: [
      `There have been ${fixedTermExclusions} fixed-term exclusions this term, down from 7 in the same period last year.`,
      `${positiveMentions} positive behaviour mentions have been recorded, reflecting the success of the new reward system.`,
      "No permanent exclusions this academic year.",
      "SEND pupils account for 40% of behaviour incidents; additional de-escalation training has been scheduled.",
    ],
    highlights: [
      "New restorative justice approach reducing repeat incidents by 30%.",
      "Lunchtime clubs have significantly reduced playground incidents.",
    ],
    concerns:
      suspensions > 3
        ? [
            "Suspension rate above expected level; review of behaviour policy recommended.",
          ]
        : undefined,
    dataAsOf: formatGovernorsDate(),
  };
}

export function generateSENDSummary(
  data: Record<string, unknown> = {},
): Omit<ModuleGovernorsSummaryProps, "moduleIcon"> {
  const registerTotal = (data.registerTotal as number) ?? 42;
  const ehcpCount = (data.ehcpCount as number) ?? 8;
  const kCount = (data.kCount as number) ?? 34;
  const provisionMapCompletion = (data.provisionMapCompletion as number) ?? 91;

  return {
    moduleName: "SEND",
    moduleColor: "#98FF98",
    ragStatus: computeRAGStatus(provisionMapCompletion, {
      green: 85,
      amber: 70,
    }),
    keyMetrics: [
      { label: "SEN Register", value: String(registerTotal), trend: "stable" },
      { label: "EHCPs", value: String(ehcpCount), trend: "up" },
      { label: "SEN Support (K)", value: String(kCount), trend: "stable" },
      {
        label: "Provision Map",
        value: `${provisionMapCompletion}%`,
        trend: "up",
      },
    ],
    keyPointsForGovernors: [
      `${registerTotal} pupils are on the SEN register (${Math.round((registerTotal / 210) * 100)}% of cohort), which is in line with national averages.`,
      `${ehcpCount} pupils have EHCPs; all annual reviews are up to date.`,
      `Provision map completion is at ${provisionMapCompletion}%, ensuring all pupils have documented support plans.`,
      "SENCO has completed the National Award and is leading a graduated approach audit across all year groups.",
    ],
    highlights: [
      "Two EHCP applications submitted and accepted this term.",
      "Speech and language intervention showing measurable progress for 85% of participants.",
    ],
    concerns:
      provisionMapCompletion < 80
        ? [
            "Provision map completion below 80%; some pupils lack documented support.",
          ]
        : undefined,
    dataAsOf: formatGovernorsDate(),
  };
}

export function generateFinanceSummary(
  data: Record<string, unknown> = {},
): Omit<ModuleGovernorsSummaryProps, "moduleIcon"> {
  const budgetVariance = (data.budgetVariance as number) ?? 1.8;
  const staffingRatio = (data.staffingRatio as number) ?? 78;
  const reservePercent = (data.reservePercent as number) ?? 8.2;
  const ppSpend = (data.ppSpendPercent as number) ?? 94;

  return {
    moduleName: "Finance",
    moduleColor: "#FFAA4C",
    ragStatus: computeRAGStatus(100 - Math.abs(budgetVariance), {
      green: 97,
      amber: 93,
    }),
    keyMetrics: [
      {
        label: "Budget Variance",
        value: `${budgetVariance > 0 ? "+" : ""}${budgetVariance}%`,
        trend: "stable",
      },
      { label: "Staffing Ratio", value: `${staffingRatio}%`, trend: "stable" },
      { label: "Reserve", value: `${reservePercent}%`, trend: "up" },
      { label: "PP Spend", value: `${ppSpend}%`, trend: "up" },
    ],
    keyPointsForGovernors: [
      `Budget is tracking at ${budgetVariance > 0 ? "+" : ""}${budgetVariance}% variance against plan, within the acceptable +/-3% tolerance.`,
      `Staffing costs represent ${staffingRatio}% of total expenditure (national avg 75-80%).`,
      `Revenue reserves stand at ${reservePercent}% of annual income, above the recommended 5% minimum.`,
      `${ppSpend}% of Pupil Premium funding has been allocated against the published strategy.`,
    ],
    highlights: [
      "Energy costs reduced 14% year-on-year following LED retrofit.",
      "Successful SCA bid of \u00a345,000 for roof repairs approved.",
    ],
    concerns:
      staffingRatio > 82
        ? [
            `Staffing ratio at ${staffingRatio}% is above the recommended ceiling of 82%.`,
          ]
        : undefined,
    dataAsOf: formatGovernorsDate(),
  };
}

export function generateEstatesSummary(
  data: Record<string, unknown> = {},
): Omit<ModuleGovernorsSummaryProps, "moduleIcon"> {
  const complianceRate = (data.complianceRate as number) ?? 94;
  const openHelpdesk = (data.openHelpdeskTickets as number) ?? 7;
  const overdueChecks = (data.overdueChecks as number) ?? 2;
  const asbestosManagement = (data.asbestosManagement as string) ?? "Current";

  return {
    moduleName: "Estates & Compliance",
    moduleColor: "#00D4D4",
    ragStatus: computeRAGStatus(complianceRate, { green: 90, amber: 80 }),
    keyMetrics: [
      { label: "Compliance Rate", value: `${complianceRate}%`, trend: "up" },
      { label: "Open Helpdesk", value: String(openHelpdesk), trend: "down" },
      { label: "Overdue Checks", value: String(overdueChecks), trend: "down" },
      { label: "Asbestos", value: asbestosManagement, trend: "stable" },
    ],
    keyPointsForGovernors: [
      `Statutory compliance is at ${complianceRate}% with ${overdueChecks} overdue checks being actioned.`,
      "Fire risk assessment completed in January; all recommendations addressed within 30 days.",
      "Legionella flushing and monitoring is up to date with no detections.",
      `${openHelpdesk} open helpdesk tickets, average resolution time 3.2 days.`,
    ],
    highlights: [
      "Condition survey completed; building rated B (satisfactory) overall.",
      "New CCTV system installed covering all external entry points.",
    ],
    concerns:
      overdueChecks > 3
        ? [
            `${overdueChecks} statutory checks are overdue; immediate action plan in place.`,
          ]
        : undefined,
    dataAsOf: formatGovernorsDate(),
  };
}

export function generateSafeguardingSummary(
  data: Record<string, unknown> = {},
): Omit<ModuleGovernorsSummaryProps, "moduleIcon"> {
  const scrCompletion = (data.scrCompletion as number) ?? 100;
  const dslTraining = (data.dslTrainingCurrent as boolean) ?? true;
  const referrals = (data.referrals as number) ?? 3;
  const cpomsConcerns = (data.cpomsConcerns as number) ?? 28;

  return {
    moduleName: "Safeguarding",
    moduleColor: "#E6C3FF",
    ragStatus: scrCompletion === 100 && dslTraining ? "green" : "red",
    keyMetrics: [
      { label: "SCR Completion", value: `${scrCompletion}%`, trend: "stable" },
      {
        label: "DSL Training",
        value: dslTraining ? "Current" : "Expired",
        trend: "stable",
      },
      { label: "MA Referrals", value: String(referrals), trend: "stable" },
      { label: "Logged Concerns", value: String(cpomsConcerns), trend: "up" },
    ],
    keyPointsForGovernors: [
      `Single Central Record is ${scrCompletion}% complete. All staff have enhanced DBS checks.`,
      `DSL and Deputy DSL training is ${dslTraining ? "current" : "OVERDUE"} (last refreshed October 2025).`,
      `${referrals} multi-agency referrals made this term; all appropriately escalated.`,
      `${cpomsConcerns} safeguarding concerns logged; increase reflects improved reporting culture after staff training.`,
    ],
    highlights: [
      "All staff completed annual safeguarding refresher training by October deadline.",
      "Governor safeguarding audit completed; 14/14 areas rated compliant.",
    ],
    concerns: !dslTraining
      ? ["DSL training has expired; renewal must be completed immediately."]
      : undefined,
    dataAsOf: formatGovernorsDate(),
  };
}

export function generateHRSummary(
  data: Record<string, unknown> = {},
): Omit<ModuleGovernorsSummaryProps, "moduleIcon"> {
  const staffCount = (data.staffCount as number) ?? 38;
  const vacancies = (data.vacancies as number) ?? 1;
  const sicknessRate = (data.sicknessRate as number) ?? 3.2;
  const cpd = (data.cpdCompletion as number) ?? 87;

  return {
    moduleName: "HR & People",
    moduleColor: "#ADD8E6",
    ragStatus: computeRAGStatus(100 - sicknessRate, { green: 96, amber: 93 }),
    keyMetrics: [
      {
        label: "Staff Count (FTE)",
        value: String(staffCount),
        trend: "stable",
      },
      { label: "Vacancies", value: String(vacancies), trend: "down" },
      { label: "Sickness Rate", value: `${sicknessRate}%`, trend: "down" },
      { label: "CPD Completion", value: `${cpd}%`, trend: "up" },
    ],
    keyPointsForGovernors: [
      `${staffCount} FTE staff in post with ${vacancies} ${vacancies === 1 ? "vacancy" : "vacancies"} currently advertised.`,
      `Sickness absence is ${sicknessRate}% (${sicknessRate <= 3.5 ? "below" : "above"} the sector average of 3.5%).`,
      `${cpd}% of staff have completed their termly CPD targets.`,
      "All performance management reviews completed by the December deadline.",
    ],
    highlights: [
      "Staff wellbeing survey returned 82% positive score, up from 74% last year.",
      "ECT retention rate is 100% with both trainees on track for QTS.",
    ],
    concerns:
      vacancies > 2
        ? [
            `${vacancies} vacancies outstanding; recruitment proving challenging in current market.`,
          ]
        : undefined,
    dataAsOf: formatGovernorsDate(),
  };
}
