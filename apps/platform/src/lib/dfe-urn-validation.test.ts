import { describe, expect, it } from "vitest";
import { validateOrganizationUrn } from "./dfe-urn-validation";

describe("validateOrganizationUrn", () => {
  it("flags a high-confidence mismatch when both name and postcode conflict", () => {
    const result = validateOrganizationUrn(
      {
        id: "org-1",
        name: "Rawdon St Peter's C of E Primary School",
        urn: "107903",
        address: { postcode: "LS19 6PP" },
        local_authority: "Leeds",
      },
      {
        urn: 107903,
        name: "Chapel Allerton Primary School",
        postcode: "LS7 3PD",
        la_name: "Leeds",
      },
    );

    expect(result.status).toBe("mismatch");
    expect(result.confidence).toBe("high");
    expect(result.checks.nameMatch).toBe(false);
    expect(result.checks.postcodeMatch).toBe(false);
  });

  it("accepts abbreviated church school names when postcode and key name tokens match", () => {
    const result = validateOrganizationUrn(
      {
        id: "org-1",
        name: "Rawdon St Peter's C of E Primary School",
        urn: "107986",
        address: { postcode: "LS19 6PP" },
        local_authority: "Leeds",
      },
      {
        urn: 107986,
        name: "Rawdon St Peter's Church of England Voluntary Controlled Primary School",
        postcode: "LS19 6PP",
        la_name: "Leeds",
      },
    );

    expect(result.status).toBe("valid");
    expect(result.confidence).toBe("high");
  });

  it("warns instead of blocking when a current URN is missing from a stale GIAS snapshot but candidates match", () => {
    const result = validateOrganizationUrn(
      {
        id: "grove",
        name: "Grove House Primary School",
        urn: "148201",
        address: { postcode: "BD2 4ED" },
        local_authority: "",
      },
      null,
      [
        {
          urn: 107242,
          name: "Grove House Primary School",
          postcode: "BD2 4ED",
          la_name: "Bradford",
          phase_name: "Primary",
          status_name: "Closed",
          match_reasons: ["same postcode", "similar school name"],
        },
      ],
    );

    expect(result.status).toBe("warning");
    expect(result.confidence).toBe("medium");
  });
});
