import { describe, expect, it } from "vitest";
import { buildPupilImportReconciliation } from "./pupil-import-reconciliation";

describe("pupil import reconciliation", () => {
  it("flags pupils missing from a new import as archive candidates rather than deletes", () => {
    const reconciliation = buildPupilImportReconciliation({
      existingPupils: [
        { pupil_id: "P1", source_pupil_ref: "A001", first_name: "Ava", last_name: "Adams", year_group: "6", current_class: "6A", is_active: true },
        { pupil_id: "P2", source_pupil_ref: "A002", first_name: "Ben", last_name: "Brown", year_group: "6", current_class: "6A", is_active: true },
      ],
      importedPupils: [
        { pupil_id: "P1", source_pupil_ref: "A001", first_name: "Ava", last_name: "Adams", year_group: "6", current_class: "6A" },
      ],
    });

    expect(reconciliation.archiveCandidates).toEqual([
      expect.objectContaining({
        pupil_id: "P2",
        source_pupil_ref: "A002",
        reason: "not_in_latest_import",
      }),
    ]);
    expect(reconciliation.deleteCandidates).toEqual([]);
  });

  it("detects changed year group and class fields for import review", () => {
    const reconciliation = buildPupilImportReconciliation({
      existingPupils: [
        { pupil_id: "P1", source_pupil_ref: "A001", first_name: "Ava", last_name: "Adams", year_group: "5", current_class: "5A", is_active: true },
      ],
      importedPupils: [
        { pupil_id: "P1", source_pupil_ref: "A001", first_name: "Ava", last_name: "Adams", year_group: "6", current_class: "6A" },
      ],
    });

    expect(reconciliation.changed).toEqual([
      {
        pupil_id: "P1",
        changes: [
          { field: "year_group", before: "5", after: "6" },
          { field: "current_class", before: "5A", after: "6A" },
        ],
      },
    ]);
  });

  it("matches imported pupils by source reference when local pupil IDs differ", () => {
    const reconciliation = buildPupilImportReconciliation({
      existingPupils: [
        { pupil_id: "LOCAL-1", source_pupil_ref: "A001", first_name: "Ava", last_name: "Adams", year_group: "5", current_class: "5A", is_active: true },
      ],
      importedPupils: [
        { pupil_id: "ARBOR-1", source_pupil_ref: "A001", first_name: "Ava", last_name: "Adams", year_group: "5", current_class: "5A" },
      ],
    });

    expect(reconciliation.matched).toEqual([
      expect.objectContaining({
        existing_pupil_id: "LOCAL-1",
        imported_pupil_id: "ARBOR-1",
        match_key: "source_pupil_ref",
      }),
    ]);
    expect(reconciliation.newPupils).toEqual([]);
  });
});
