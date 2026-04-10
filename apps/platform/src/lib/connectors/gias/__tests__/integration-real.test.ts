import { describe, it, expect } from "vitest";
import * as fs from "fs";

// Real integration test — makes actual HTTP calls to GIAS open data API
// No mocks. This validates the real DfE data source is available and correct.

const GIAS_BASE_URL = "https://dfe-digital.github.io/gias-data/schools";
const GROVE_HOUSE_URN = 148201;

describe("GIAS Real Integration", () => {
  it("fetches Grove House Primary (URN 148201) from live GIAS API", async () => {
    const response = await fetch(`${GIAS_BASE_URL}/${GROVE_HOUSE_URN}.json`);
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);

    const school = await response.json();

    // Save raw response for evidence
    fs.writeFileSync(
      "/tmp/gias-grove-house-raw.json",
      JSON.stringify(school, null, 2),
    );

    // Validate known facts about Grove House Primary
    expect(school.urn).toBe(148201);
    expect(school.name).toBe("Grove House Primary School");
    expect(school.postcode).toBe("BD2 4ED");
    expect(school.local_authority).toBe("Bradford");
    expect(school.phase_of_education).toBe("Primary");
    expect(school.status).toBe("Open");
    expect(school.type).toBe("Academy converter");

    // Validate structure has expected fields
    expect(school).toHaveProperty("ukprn");
    expect(school).toHaveProperty("latitude");
    expect(school).toHaveProperty("longitude");
    expect(school).toHaveProperty("phone");
    expect(school).toHaveProperty("school_website");
    expect(school).toHaveProperty("type_code");
    expect(school).toHaveProperty("status_code");
  });

  it("returns 404 for non-existent URN", async () => {
    const response = await fetch(`${GIAS_BASE_URL}/999999.json`);
    expect(response.status).toBe(404);
  });

  it("validates data types in GIAS response", async () => {
    const response = await fetch(`${GIAS_BASE_URL}/${GROVE_HOUSE_URN}.json`);
    const school = await response.json();

    expect(typeof school.urn).toBe("number");
    expect(typeof school.name).toBe("string");
    expect(typeof school.latitude).toBe("number");
    expect(typeof school.longitude).toBe("number");
    expect(typeof school.type_code).toBe("number");
    expect(typeof school.status_code).toBe("number");
    expect(typeof school.phase_of_education_code).toBe("number");
  });
});
