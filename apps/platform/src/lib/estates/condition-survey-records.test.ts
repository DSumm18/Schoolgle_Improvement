import { describe, expect, it } from "vitest";

import {
  mapConditionSurveyRecord,
  mapConditionSurveyLocation,
} from "./condition-survey-records";

describe("condition survey record mapping", () => {
  it("maps a persisted survey element into the UI condition model", () => {
    const element = mapConditionSurveyRecord(
      {
        id: "survey-1",
        location_id: "location-1",
        category: "mechanical",
        element: "Main boiler",
        grade: "D",
        description: "Life expired and repeated flame failure.",
        estimated_cost: 35000,
        priority: "urgent",
        surveyed_by_name: "J. Mitchell",
        surveyed_at: "2026-01-15T09:00:00+00:00",
        next_survey_due: "2026-04-15",
      },
      new Map([["location-1", "Plant Room"]]),
    );

    expect(element).toEqual({
      id: "survey-1",
      locationId: "location-1",
      locationName: "Plant Room",
      category: "mechanical",
      element: "Main boiler",
      grade: "D",
      description: "Life expired and repeated flame failure.",
      estimatedCost: 35000,
      priority: "urgent",
      surveyedBy: "J. Mitchell",
      surveyedAt: "2026-01-15",
      nextSurveyDue: "2026-04-15",
    });
  });

  it("maps live estate locations into picker options", () => {
    expect(
      mapConditionSurveyLocation({
        id: "location-1",
        name: "Science Lab",
        location_type: "room",
      }),
    ).toEqual({
      id: "location-1",
      name: "Science Lab",
      type: "room",
    });
  });
});
