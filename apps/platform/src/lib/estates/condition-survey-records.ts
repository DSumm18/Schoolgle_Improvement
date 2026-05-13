import type {
  ConditionElement,
  ConditionGrade,
  ElementCategory,
} from "@/lib/condition-survey";

export interface ConditionSurveyLocation {
  id: string;
  name: string;
  type?: string;
}

export interface ConditionSurveyRecord {
  id: string;
  location_id: string | null;
  category: string;
  element: string;
  grade: string;
  description: string | null;
  estimated_cost: number | string | null;
  priority: string | null;
  surveyed_by_name: string | null;
  surveyed_at: string;
  next_survey_due: string | null;
}

export interface EstatesLocationRecord {
  id: string;
  name: string;
  location_type?: string | null;
}

const VALID_GRADES: ConditionGrade[] = ["A", "B", "C", "D"];
const VALID_CATEGORIES: ElementCategory[] = [
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

const VALID_PRIORITIES: ConditionElement["priority"][] = [
  "urgent",
  "essential",
  "desirable",
  "cosmetic",
];

function asGrade(value: string): ConditionGrade {
  return VALID_GRADES.includes(value as ConditionGrade)
    ? (value as ConditionGrade)
    : "B";
}

function asCategory(value: string): ElementCategory {
  return VALID_CATEGORIES.includes(value as ElementCategory)
    ? (value as ElementCategory)
    : "structure";
}

function asPriority(value: string | null): ConditionElement["priority"] {
  return VALID_PRIORITIES.includes(value as ConditionElement["priority"])
    ? (value as ConditionElement["priority"])
    : "desirable";
}

function asMoney(value: number | string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function dateOnly(value: string | null): string | undefined {
  return value?.slice(0, 10) || undefined;
}

export function mapConditionSurveyLocation(
  location: EstatesLocationRecord,
): ConditionSurveyLocation {
  return {
    id: location.id,
    name: location.name,
    type: location.location_type ?? undefined,
  };
}

export function mapConditionSurveyRecord(
  record: ConditionSurveyRecord,
  locationNames: Map<string, string>,
): ConditionElement {
  const locationId = record.location_id ?? "unassigned";

  return {
    id: record.id,
    locationId,
    locationName: locationNames.get(locationId) ?? "Unassigned Location",
    category: asCategory(record.category),
    element: record.element,
    grade: asGrade(record.grade),
    description: record.description ?? "",
    estimatedCost: asMoney(record.estimated_cost),
    priority: asPriority(record.priority),
    surveyedBy: record.surveyed_by_name ?? "Unknown",
    surveyedAt: dateOnly(record.surveyed_at) ?? "",
    nextSurveyDue: dateOnly(record.next_survey_due),
  };
}
