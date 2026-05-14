import { describe, expect, it } from "vitest";
import { parseClassUploadCsv } from "./class-upload";

describe("class upload", () => {
  it("parses classes with staff references and tidy labels", () => {
    const csv = [
      "Year explainer,Class explainer,Room,Location,Academic year,Teacher email,Teacher ID,TA email,TA ID",
      "year_group,class_name,room,location_code,academic_year,teacher_email,teacher_employee_id,ta_email,ta_employee_id",
      "y4,4:00 am, room 4 , r022 ,2025-26,TEACHER@SCHOOL.CO.UK,STF001,ta@school.co.uk,STF002",
    ].join("\n");

    const parsed = parseClassUploadCsv(csv);

    expect(parsed.errors).toEqual([]);
    expect(parsed.classes[0]).toMatchObject({
      year_group: "Year 4",
      year_group_number: 4,
      class_name: "4A",
      room: "Room 4",
      location_code: "R022",
      teacher_email: "teacher@school.co.uk",
    });
  });

  it("parses completed styled Excel template rows with guidance above the header", () => {
    const csv = [
      "Schoolgle Classes Upload Template",
      "Rows 1-3 are guidance, row 4 explains the columns, row 5 is the exact import header. Start real class data on row 6.",
      "Tip: upload staff first.",
      "Year explainer,Class explainer,Room,Location,Academic year,Teacher email,Teacher ID,TA email,TA ID",
      "year_group,class_name,room,location_code,academic_year,teacher_email,teacher_employee_id,ta_email,ta_employee_id",
      "Year 4,4B,Room 32,R032,2025-26,teacher.4b@school.co.uk,STF005,,",
    ].join("\n");

    const parsed = parseClassUploadCsv(csv);

    expect(parsed.errors).toEqual([]);
    expect(parsed.classes[0]).toMatchObject({
      year_group: "Year 4",
      class_name: "4B",
      room: "Room 32",
      location_code: "R032",
    });
  });
});
