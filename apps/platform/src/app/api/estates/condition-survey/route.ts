import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import type {
  ConditionElement,
  ConditionGrade,
  ElementCategory,
} from "@/lib/condition-survey";
import {
  summarizeEstateFindingTriage,
  triageEstateFinding,
} from "@/lib/estates-compliance/finding-triage";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  mapConditionSurveyLocation,
  mapConditionSurveyRecord,
  type ConditionSurveyRecord,
  type EstatesLocationRecord,
} from "@/lib/estates/condition-survey-records";

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

const CONDITION_SELECT = `
  id,
  location_id,
  category,
  element,
  grade,
  description,
  estimated_cost,
  priority,
  surveyed_by_name,
  surveyed_at,
  next_survey_due
`;

function withTriage(element: ConditionElement) {
  return {
    ...element,
    triage: triageEstateFinding({
      assetName: element.element,
      description: element.description,
      estimatedCost: element.estimatedCost ?? null,
      priority: element.priority,
      conditionGrade: element.grade,
      complianceDomain: element.category,
    }),
  };
}

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();

  const [locationsResult, elementsResult, organizationResult] =
    await Promise.all([
      supabase
        .from("estates_locations")
        .select("id, name, location_type")
        .eq("organization_id", auth.organizationId)
        .order("name", { ascending: true }),
      supabase
        .from("condition_survey_elements")
        .select(CONDITION_SELECT)
        .eq("organization_id", auth.organizationId)
        .order("surveyed_at", { ascending: false }),
      supabase
        .from("organizations")
        .select("name")
        .eq("id", auth.organizationId)
        .maybeSingle(),
    ]);

  if (locationsResult.error) throw locationsResult.error;
  if (elementsResult.error) throw elementsResult.error;
  if (organizationResult.error) throw organizationResult.error;

  const locations = (locationsResult.data ?? []).map((location) =>
    mapConditionSurveyLocation(location as EstatesLocationRecord),
  );
  const locationNames = new Map(
    locations.map((location) => [location.id, location.name]),
  );
  const elements = (elementsResult.data ?? [])
    .map((record) =>
      mapConditionSurveyRecord(record as ConditionSurveyRecord, locationNames),
    )
    .map(withTriage);

  return apiSuccess({
    elements,
    locations,
    triageSummary: summarizeEstateFindingTriage(
      elements.map((element) => element.triage),
    ),
    meta: {
      source: "live",
      schoolName: organizationResult.data?.name ?? "Current school",
      surveyDate: elements[0]?.surveyedAt ?? null,
      nextFullSurvey: elements[0]?.nextSurveyDue ?? null,
    },
  });
});

export const POST = protectedRoute(
  async (auth, request) => {
    const body = await request.json();

    const {
      locationId,
      locationName,
      category,
      element,
      grade,
      description,
      estimatedCost,
      priority,
      surveyedBy,
      nextSurveyDue,
    } = body;

    if (
      !category ||
      !element ||
      !grade ||
      !description ||
      !priority
    ) {
      return apiError(
        "Missing required fields: locationId, category, element, grade, description, priority",
        400,
      );
    }

    if (!locationId && !locationName) {
      return apiError("Missing required field: locationId or locationName", 400);
    }

    if (!VALID_GRADES.includes(grade)) {
      return apiError("Invalid grade. Must be A, B, C, or D.", 400);
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return apiError(
        `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        400,
      );
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return apiError(
        `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}`,
        400,
      );
    }

    const supabase = createServiceRoleClient();

    let persistedLocationId = locationId as string | null;
    let persistedLocationName = locationName as string | null;

    if (persistedLocationId) {
      const { data: location, error: locationError } = await supabase
        .from("estates_locations")
        .select("id, name")
        .eq("organization_id", auth.organizationId)
        .eq("id", persistedLocationId)
        .maybeSingle();

      if (locationError) throw locationError;
      if (!location) {
        return apiError("Location not found for this organization", 404);
      }
      persistedLocationName = location.name as string;
    } else {
      const { data: location, error: locationCreateError } = await supabase
        .from("estates_locations")
        .insert({
          organization_id: auth.organizationId,
          name: persistedLocationName,
          location_type: "room",
        })
        .select("id, name")
        .single();

      if (locationCreateError) throw locationCreateError;
      persistedLocationId = location.id as string;
      persistedLocationName = location.name as string;
    }

    const { data, error } = await supabase
      .from("condition_survey_elements")
      .insert({
        organization_id: auth.organizationId,
        location_id: persistedLocationId,
        category,
        element,
        grade,
        description,
        estimated_cost:
          estimatedCost !== undefined && estimatedCost !== ""
            ? Number(estimatedCost)
            : null,
        priority,
        surveyed_by: auth.userId,
        surveyed_by_name: surveyedBy || auth.email || "Current User",
        next_survey_due: nextSurveyDue || null,
      })
      .select(CONDITION_SELECT)
      .single();

    if (error) throw error;

    const { data: locations, error: locationsError } = await supabase
      .from("estates_locations")
      .select("id, name")
      .eq("organization_id", auth.organizationId)
      .eq("id", persistedLocationId);

    if (locationsError) throw locationsError;

    const locationNames = new Map(
      (locations ?? []).map((row) => [row.id as string, row.name as string]),
    );
    if (persistedLocationId && persistedLocationName) {
      locationNames.set(persistedLocationId, persistedLocationName);
    }
    const persisted = withTriage(
      mapConditionSurveyRecord(data as ConditionSurveyRecord, locationNames),
    );

    return apiSuccess({ element: persisted, success: true }, 201);
  },
  { requiredRole: "teacher" },
);
