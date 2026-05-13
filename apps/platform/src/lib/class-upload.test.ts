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
});
