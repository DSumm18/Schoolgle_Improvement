import { describe, expect, it } from "vitest";
import { parseSendStatusAssignmentsCsv } from "./send-status-import";

describe("SEND status import", () => {
  it("groups ranked Arbor SEN needs into one SEND register row per pupil", () => {
    const parsed = parseSendStatusAssignmentsCsv(
      [
        'UPN,Name,"Year group(s) this academic year","Registration form(s) this academic year","Date of Birth",Ethnicity,"SEN status","Sen Need","SEN Description","SEN Need Ranking","Start Date","Funded Hours","SEN status"',
        'A001,"Adams, Ava","Year 4","4A",2017-09-15,"White - British","SEN Support","Speech, Language and Communication Needs",,1,"16 Dec 2025","15h 0m",K',
        'A001,"Adams, Ava","Year 4","4A",2017-09-15,"White - British","SEN Support","Social, Emotional & Mental Health",,2,"16 Dec 2025","15h 0m",K',
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual([
      expect.objectContaining({
        pupil_id: "A001",
        display_name: "Adams, Ava",
        year_group: "4",
        class_name: "4A",
        sen_status: "K",
        primary_need: "SLCN",
        secondary_need: "SEMH",
        date_identified: "2025-12-16",
        funded_hours: 15,
      }),
    ]);
  });

  it("filters to live register rows when requested", () => {
    const parsed = parseSendStatusAssignmentsCsv(
      [
        'UPN,Name,"Year group(s) this academic year","Registration form(s) this academic year","Date of Birth",Ethnicity,"SEN status","Sen Need","SEN Description","SEN Need Ranking","Start Date","Funded Hours","SEN status"',
        'A001,"Adams, Ava","Year 4","4A",2017-09-15,"White - British","SEN Support","Speech, Language and Communication Needs",,1,"16 Dec 2025","15h 0m",K',
        'A002,"Brown, Ben","",,2016-09-15,"White - British","Education, Health and Care Plan","Autistic Spectrum Disorder",,1,,"",E',
      ].join("\n"),
      { intent: "live_register" },
    );

    expect(parsed.rows.map((row) => row.pupil_id)).toEqual(["A001"]);
    expect(parsed.excludedRows).toEqual([
      expect.objectContaining({ pupil_id: "A002", reason: "missing_year_group_for_live_register" }),
    ]);
  });

  it("keeps historic rows when imported as a cohort snapshot", () => {
    const parsed = parseSendStatusAssignmentsCsv(
      [
        'UPN,Name,"Year group(s) this academic year","Registration form(s) this academic year","Date of Birth",Ethnicity,"SEN status","Sen Need","SEN Description","SEN Need Ranking","Start Date","Funded Hours","SEN status"',
        'A002,"Brown, Ben","",,2016-09-15,"White - British","Education, Health and Care Plan","Autistic Spectrum Disorder",,1,,"",E',
      ].join("\n"),
      { intent: "historic_snapshot" },
    );

    expect(parsed.rows).toEqual([
      expect.objectContaining({
        pupil_id: "A002",
        sen_status: "E",
        primary_need: "ASD",
        import_intent: "historic_snapshot",
      }),
    ]);
  });
});
