import { describe, expect, it } from "vitest";
import {
  parseGiasExtendedProfileHtml,
  reconcileGiasExtendedProfile,
} from "./gias-extended-profile";

const shawcloughStyleHtml = `
<dl>
  <dt>Type of SEN provision</dt><dd>ASD - Autistic Spectrum Disorder and PMLD - Profound and Multiple Learning Difficulty</dd>
  <dt>Type of resourced provision</dt><dd>Resourced provision and SEN unit</dd>
  <dt>Resourced provision number on roll</dt><dd>7</dd>
  <dt>Resourced provision capacity</dt><dd>8</dd>
  <dt>Special Educational Needs (SEN) unit number on roll</dt><dd>21</dd>
  <dt>Special Educational Needs (SEN) unit capacity</dt><dd>20</dd>
  <dt>Date last changed / confirmed</dt><dd>22 January 2026</dd>
</dl>`;

describe("parseGiasExtendedProfileHtml", () => {
  it("extracts SEN provision fields from a GIAS details page", () => {
    const profile = parseGiasExtendedProfileHtml({
      urn: 105766,
      schoolName: "Shawclough Community Primary School",
      sourceUrl:
        "https://www.get-information-schools.service.gov.uk/establishments/establishment/details/105766",
      html: shawcloughStyleHtml,
      fetchedAt: "2026-05-06T10:00:00.000Z",
    });

    expect(profile.sen_provision_type).toBe(
      "ASD - Autistic Spectrum Disorder and PMLD - Profound and Multiple Learning Difficulty",
    );
    expect(profile.resourced_provision_type).toBe("Resourced provision and SEN unit");
    expect(profile.resourced_provision_on_roll).toBe(7);
    expect(profile.resourced_provision_capacity).toBe(8);
    expect(profile.sen_unit_on_roll).toBe(21);
    expect(profile.sen_unit_capacity).toBe(20);
    expect(profile.gias_last_confirmed).toBe("2026-01-22");
    expect(profile.source_method).toBe("gias_page_scrape");
    expect(profile.confidence_status).toBe("verified");
  });

  it("marks missing provision fields instead of inventing values", () => {
    const profile = parseGiasExtendedProfileHtml({
      urn: 105765,
      schoolName: "Castleton Primary School",
      sourceUrl:
        "https://www.get-information-schools.service.gov.uk/establishments/establishment/details/105765",
      html: "<dl><dt>Type of resourced provision</dt><dd>Not recorded</dd></dl>",
      fetchedAt: "2026-05-06T10:00:00.000Z",
    });

    expect(profile.sen_provision_type).toBeNull();
    expect(profile.resourced_provision_type).toBeNull();
    expect(profile.confidence_status).toBe("missing");
    expect(profile.validation_notes).toContain("No GIAS extended SEN provision fields were found.");
  });
});

describe("reconcileGiasExtendedProfile", () => {
  it("verifies matching GIAS and SEN-file provision flags", () => {
    const result = reconcileGiasExtendedProfile(
      {
        urn: 105766,
        school_name: "Shawclough Community Primary School",
        resourced_provision_type: "Resourced provision and SEN unit",
        sen_provision_type: "ASD - Autistic Spectrum Disorder",
        resourced_provision_on_roll: 7,
        resourced_provision_capacity: 8,
        sen_unit_on_roll: 21,
        sen_unit_capacity: 20,
        confidence_status: "missing",
        validation_notes: [],
      },
      { urn: 105766, SEN_Unit: 1, RP_Unit: 1 },
    );

    expect(result.confidence_status).toBe("verified");
    expect(result.validation_notes).toContain(
      "GIAS provision flags align with DfE SEN school-level file.",
    );
  });

  it("flags conflicting provision indicators", () => {
    const result = reconcileGiasExtendedProfile(
      {
        urn: 105778,
        school_name: "Marland Hill Community Primary School",
        resourced_provision_type: "Resourced provision",
        sen_provision_type: "HI - Hearing Impairment",
        resourced_provision_on_roll: null,
        resourced_provision_capacity: null,
        sen_unit_on_roll: null,
        sen_unit_capacity: null,
        confidence_status: "missing",
        validation_notes: [],
      },
      { urn: 105778, SEN_Unit: 0, RP_Unit: 0 },
    );

    expect(result.confidence_status).toBe("conflicting");
    expect(result.validation_notes.join(" ")).toContain("GIAS indicates resourced provision");
  });

  it("warns when on-roll counts exceed recorded capacity", () => {
    const result = reconcileGiasExtendedProfile(
      {
        urn: 105766,
        school_name: "Shawclough Community Primary School",
        resourced_provision_type: "Resourced provision and SEN unit",
        sen_provision_type: "ASD - Autistic Spectrum Disorder",
        resourced_provision_on_roll: 9,
        resourced_provision_capacity: 8,
        sen_unit_on_roll: 21,
        sen_unit_capacity: 20,
        confidence_status: "verified",
        validation_notes: [],
      },
      { urn: 105766, SEN_Unit: 1, RP_Unit: 1 },
    );

    expect(result.confidence_status).toBe("verified");
    expect(result.validation_notes).toContain("Resourced provision on-roll exceeds capacity.");
    expect(result.validation_notes).toContain("SEN unit on-roll exceeds capacity.");
  });
});
