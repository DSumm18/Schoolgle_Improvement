import { describe, expect, it } from "vitest";
import { parseClassUploadCsv, uniqueClassesForRegisterUpsert } from "./class-upload";

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

  it("accepts mixed-year class labels for split classes", () => {
    const csv = [
      "year_group,class_name,room,location_code,academic_year,teacher_email,teacher_employee_id,ta_email,ta_employee_id",
      "Year 1/2,Ash,,,,f.friis@rawdonstpeters.co.uk,47,,",
      "Y3-4,Chestnut,,,,b.smith@rawdonstpeters.co.uk,,,",
      "5/6,Hazel,,,,l.watson@rawdonstpeters.co.uk,66,,",
    ].join("\n");

    const parsed = parseClassUploadCsv(csv);

    expect(parsed.errors).toEqual([]);
    expect(parsed.classes.map((classRow) => classRow.year_group)).toEqual(["Year 1/2", "Year 3/4", "Year 5/6"]);
    expect(parsed.classes.map((classRow) => classRow.year_group_number)).toEqual([1, 3, 5]);
  });

  it("deduplicates class register rows while keeping multiple staff rows usable", () => {
    const csv = [
      "year_group,class_name,room,location_code,academic_year,teacher_email,teacher_employee_id,ta_email,ta_employee_id",
      "Year 3,Sycamore,,,,c.sharkey@rawdonstpeters.co.uk,146,,",
      "Year 3,Sycamore,Room 12,R012,,k.etheridge@rawdonstpeters.co.uk,326,,",
    ].join("\n");

    const parsed = parseClassUploadCsv(csv);
    const uniqueClasses = uniqueClassesForRegisterUpsert(parsed.classes);

    expect(parsed.classes).toHaveLength(2);
    expect(uniqueClasses).toHaveLength(1);
    expect(uniqueClasses[0]).toMatchObject({
      class_name: "Sycamore",
      room: "Room 12",
      location_code: "R012",
    });
  });
});
