// Condition Survey Engine
// Visual grading of school building condition with backlog costing
// Based on DfE Condition Data Collection (CDC) methodology

export type ConditionGrade = "A" | "B" | "C" | "D";
// A = Good (no action needed)
// B = Satisfactory (minor deterioration)
// C = Poor (major repair/replacement needed within 2 years)
// D = Bad (urgent, risk to health/safety)

export type ElementCategory =
  | "structure"
  | "roof"
  | "external_walls"
  | "windows_doors"
  | "internal_finishes"
  | "floors"
  | "ceilings"
  | "mechanical"
  | "electrical"
  | "fire_safety"
  | "accessibility"
  | "external_areas";

export interface ConditionElement {
  id: string;
  locationId: string;
  locationName: string;
  category: ElementCategory;
  element: string; // e.g., "Roof covering", "Window frames", "Boiler"
  grade: ConditionGrade;
  description: string;
  estimatedCost?: number;
  priority: "urgent" | "essential" | "desirable" | "cosmetic";
  photoUrl?: string;
  surveyedBy: string;
  surveyedAt: string;
  nextSurveyDue?: string;
}

export interface ConditionSummary {
  totalElements: number;
  byGrade: Record<ConditionGrade, number>;
  totalBacklog: number; // cost of all C+D items
  urgentItems: number; // D grade count
  byCategory: Record<
    ElementCategory,
    { worstGrade: ConditionGrade; count: number }
  >;
}

// ── Grade helpers ──────────────────────────────────────────────

export function getGradeColor(grade: ConditionGrade): string {
  switch (grade) {
    case "A":
      return "#22c55e"; // green-500
    case "B":
      return "#f59e0b"; // amber-500
    case "C":
      return "#f97316"; // orange-500
    case "D":
      return "#ef4444"; // red-500
  }
}

export function getGradeBgClass(grade: ConditionGrade): string {
  switch (grade) {
    case "A":
      return "bg-green-100 text-green-800 border-green-300";
    case "B":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "C":
      return "bg-orange-100 text-orange-800 border-orange-300";
    case "D":
      return "bg-red-100 text-red-800 border-red-300";
  }
}

export function getGradeLabel(grade: ConditionGrade): string {
  switch (grade) {
    case "A":
      return "Good";
    case "B":
      return "Satisfactory";
    case "C":
      return "Poor";
    case "D":
      return "Bad";
  }
}

export function getGradeDescription(grade: ConditionGrade): string {
  switch (grade) {
    case "A":
      return "Performing as intended and operating efficiently. No action needed.";
    case "B":
      return "Minor deterioration but still operational. Planned maintenance within 3-5 years.";
    case "C":
      return "Major repair or replacement needed within 2 years. Not performing as intended.";
    case "D":
      return "Life-expired or serious risk to health and safety. Urgent action required.";
  }
}

// ── Category helpers ───────────────────────────────────────────

export function getCategoryLabel(category: ElementCategory): string {
  const labels: Record<ElementCategory, string> = {
    structure: "Structure",
    roof: "Roof",
    external_walls: "External Walls",
    windows_doors: "Windows & Doors",
    internal_finishes: "Internal Finishes",
    floors: "Floors",
    ceilings: "Ceilings",
    mechanical: "Mechanical Services",
    electrical: "Electrical Services",
    fire_safety: "Fire Safety",
    accessibility: "Accessibility",
    external_areas: "External Areas",
  };
  return labels[category];
}

export const ALL_CATEGORIES: ElementCategory[] = [
  "structure",
  "roof",
  "external_walls",
  "windows_doors",
  "internal_finishes",
  "floors",
  "ceilings",
  "mechanical",
  "electrical",
  "fire_safety",
  "accessibility",
  "external_areas",
];

// ── Priority helpers ───────────────────────────────────────────

export function getPriorityLabel(
  priority: ConditionElement["priority"],
): string {
  switch (priority) {
    case "urgent":
      return "Urgent";
    case "essential":
      return "Essential";
    case "desirable":
      return "Desirable";
    case "cosmetic":
      return "Cosmetic";
  }
}

export function getPriorityBgClass(
  priority: ConditionElement["priority"],
): string {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800";
    case "essential":
      return "bg-orange-100 text-orange-800";
    case "desirable":
      return "bg-blue-100 text-blue-800";
    case "cosmetic":
      return "bg-gray-100 text-gray-700";
  }
}

// ── Calculation functions ──────────────────────────────────────

const GRADE_ORDER: Record<ConditionGrade, number> = { A: 0, B: 1, C: 2, D: 3 };

function worstGrade(a: ConditionGrade, b: ConditionGrade): ConditionGrade {
  return GRADE_ORDER[a] >= GRADE_ORDER[b] ? a : b;
}

export function calculateConditionSummary(
  elements: ConditionElement[],
): ConditionSummary {
  const byGrade: Record<ConditionGrade, number> = { A: 0, B: 0, C: 0, D: 0 };
  const byCategory: Record<
    string,
    { worstGrade: ConditionGrade; count: number }
  > = {};

  let totalBacklog = 0;
  let urgentItems = 0;

  for (const el of elements) {
    byGrade[el.grade]++;

    if (el.grade === "C" || el.grade === "D") {
      totalBacklog += el.estimatedCost ?? 0;
    }
    if (el.grade === "D") {
      urgentItems++;
    }

    if (!byCategory[el.category]) {
      byCategory[el.category] = { worstGrade: el.grade, count: 1 };
    } else {
      byCategory[el.category].count++;
      byCategory[el.category].worstGrade = worstGrade(
        byCategory[el.category].worstGrade,
        el.grade,
      );
    }
  }

  return {
    totalElements: elements.length,
    byGrade,
    totalBacklog,
    urgentItems,
    byCategory: byCategory as Record<
      ElementCategory,
      { worstGrade: ConditionGrade; count: number }
    >,
  };
}

export function calculateBacklogCost(elements: ConditionElement[]): number {
  return elements
    .filter((el) => el.grade === "C" || el.grade === "D")
    .reduce((sum, el) => sum + (el.estimatedCost ?? 0), 0);
}

export function getRoomConditionGrade(
  elements: ConditionElement[],
): ConditionGrade {
  if (elements.length === 0) return "A";
  return elements.reduce<ConditionGrade>(
    (worst, el) => worstGrade(worst, el.grade),
    "A",
  );
}

export function shouldCreateRisk(element: ConditionElement): boolean {
  if (element.grade === "D") return true;
  if (element.grade === "C" && (element.estimatedCost ?? 0) > 10_000)
    return true;
  return false;
}

// ── Report generation ──────────────────────────────────────────

export function generateConditionReport(
  elements: ConditionElement[],
  schoolName: string,
): string {
  const summary = calculateConditionSummary(elements);
  const backlog = calculateBacklogCost(elements);
  const now = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const gradeLines = (["A", "B", "C", "D"] as ConditionGrade[])
    .map(
      (g) =>
        `- **Grade ${g} (${getGradeLabel(g)})**: ${summary.byGrade[g]} elements`,
    )
    .join("\n");

  const urgentElements = elements.filter((el) => el.grade === "D");
  const urgentSection =
    urgentElements.length > 0
      ? `\n## Urgent Items (Grade D)\n\n${urgentElements
          .map(
            (el) =>
              `- **${el.element}** (${el.locationName}) — ${el.description}${
                el.estimatedCost
                  ? ` — Est. £${el.estimatedCost.toLocaleString()}`
                  : ""
              }`,
          )
          .join("\n")}`
      : "\n## Urgent Items\n\nNone identified.";

  const poorElements = elements.filter((el) => el.grade === "C");
  const poorSection =
    poorElements.length > 0
      ? `\n## Poor Condition Items (Grade C)\n\n${poorElements
          .map(
            (el) =>
              `- **${el.element}** (${el.locationName}) — ${el.description}${
                el.estimatedCost
                  ? ` — Est. £${el.estimatedCost.toLocaleString()}`
                  : ""
              }`,
          )
          .join("\n")}`
      : "";

  return `# Condition Survey Report — ${schoolName}

**Date**: ${now}
**Total Elements Surveyed**: ${summary.totalElements}
**Maintenance Backlog**: £${backlog.toLocaleString()}

## Grade Distribution

${gradeLines}
${urgentSection}
${poorSection}

## Recommendations

${summary.urgentItems > 0 ? `1. Address ${summary.urgentItems} Grade D item(s) immediately — these pose a risk to health and safety.\n` : ""}${
    poorElements.length > 0
      ? `${summary.urgentItems > 0 ? "2" : "1"}. Schedule remedial works for ${poorElements.length} Grade C item(s) within the next 2 years.\n`
      : ""
  }${
    backlog > 50_000
      ? `${summary.urgentItems > 0 ? "3" : poorElements.length > 0 ? "2" : "1"}. Total backlog of £${backlog.toLocaleString()} should be reported to governors and included in the capital strategy.\n`
      : ""
  }
---
*Generated by Schoolgle Condition Survey on ${now}*
`;
}

// ── Five-year backlog projection ───────────────────────────────

export function projectBacklog(
  currentBacklog: number,
  annualDeteriorationRate: number = 0.05, // 5% per year default
  annualBudget: number = 0,
): { year: number; backlog: number }[] {
  const projection: { year: number; backlog: number }[] = [];
  let backlog = currentBacklog;
  const currentYear = new Date().getFullYear();

  for (let i = 0; i <= 5; i++) {
    projection.push({ year: currentYear + i, backlog: Math.round(backlog) });
    backlog = backlog * (1 + annualDeteriorationRate) - annualBudget;
    if (backlog < 0) backlog = 0;
  }

  return projection;
}
