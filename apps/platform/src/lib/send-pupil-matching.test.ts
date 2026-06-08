import { describe, expect, it } from "vitest";
import { matchSendRowsToPupils } from "./send-pupil-matching";

describe("SEND pupil matching", () => {
  it("uses canonical pupil ID when SEND UPN matches pupil source reference", () => {
    const result = matchSendRowsToPupils({
      sendRows: [
        { pupil_id: "UPN001", display_name: "Adams, Ava", date_of_birth: "2017-09-15" },
      ],
      pupils: [
        { pupil_id: "ARB001", source_pupil_ref: "UPN001", first_name: "Ava", last_name: "Adams", date_of_birth: "2017-09-15" },
      ],
    });

    expect(result.rows[0]).toMatchObject({
      pupil_id: "ARB001",
      source_pupil_ref: "UPN001",
      match_method: "source_pupil_ref",
    });
    expect(result.unmatched).toEqual([]);
  });

  it("falls back to name and DOB when Arbor exports use different IDs", () => {
    const result = matchSendRowsToPupils({
      sendRows: [
        { pupil_id: "UPN999", display_name: "Adams, Ava", date_of_birth: "2017-09-15" },
      ],
      pupils: [
        { pupil_id: "ARB001", source_pupil_ref: "UK_BRD_1", first_name: "Ava", last_name: "Adams", date_of_birth: "2017-09-15" },
      ],
    });

    expect(result.rows[0]).toMatchObject({
      pupil_id: "ARB001",
      source_pupil_ref: "UPN999",
      match_method: "name_date_of_birth",
    });
  });

  it("matches Arbor preferred-name differences when DOB and last name agree", () => {
    const result = matchSendRowsToPupils({
      sendRows: [
        { pupil_id: "UPN999", display_name: "Garside, Elias", date_of_birth: "2022-06-15" },
      ],
      pupils: [
        { pupil_id: "ARB001", source_pupil_ref: "UK_BRD_1", first_name: "Elias-Louis", last_name: "Garside", date_of_birth: "2022-06-15" },
      ],
    });

    expect(result.rows[0]).toMatchObject({
      pupil_id: "ARB001",
      match_method: "date_of_birth_last_name",
    });
    expect(result.unmatched).toEqual([]);
  });

  it("matches Arbor middle-name differences when DOB and first name agree", () => {
    const result = matchSendRowsToPupils({
      sendRows: [
        { pupil_id: "UPN999", display_name: "India, Harley", date_of_birth: "2017-04-12", year_group: "4", class_name: "4 Mian" },
      ],
      pupils: [
        { pupil_id: "ARB001", source_pupil_ref: "UK_BRD_1", first_name: "Harley", last_name: "Bray", date_of_birth: "2017-04-12", year_group: "4", current_class: "4 Mian" },
      ],
    });

    expect(result.rows[0]).toMatchObject({
      pupil_id: "ARB001",
      match_method: "date_of_birth_first_name_class",
    });
  });

  it("keeps unmatched SEND rows for review", () => {
    const result = matchSendRowsToPupils({
      sendRows: [
        { pupil_id: "UPN999", display_name: "Missing, Pupil", date_of_birth: "2017-09-15" },
      ],
      pupils: [],
    });

    expect(result.rows[0]).toMatchObject({
      pupil_id: "UPN999",
      match_method: "unmatched",
    });
    expect(result.unmatched).toEqual([
      expect.objectContaining({ pupil_id: "UPN999", display_name: "Missing, Pupil" }),
    ]);
  });
});
