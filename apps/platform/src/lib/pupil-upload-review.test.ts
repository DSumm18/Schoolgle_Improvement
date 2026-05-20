import { describe, expect, it } from "vitest";
import { reviewPupilUploadCsv } from "./pupil-upload-review";

describe("reviewPupilUploadCsv", () => {
  it("uses row two as headers when row one contains explanations", () => {
    const csv = [
      "Explainer,Explainer,Explainer,Explainer,Explainer",
      "pupil_id,first_name,last_name,year_group,current_class",
      "P1,Ada,Lovelace,4,Oak",
      "P2,Alan,Turing,4,Oak",
    ].join("\n");

    const review = reviewPupilUploadCsv(csv, "pupils.csv");

    expect(review.headerRow).toBe(2);
    expect(review.totalRows).toBe(2);
    expect(review.validRows).toBe(2);
    expect(review.sampleRows[0]).toMatchObject({ rowNumber: 3, first_name: "Ada" });
  });

  it("finds the styled Excel template header on row five", () => {
    const csv = [
      "Schoolgle Pupil Upload Template,,,,",
      "Rows 1-3 are guidance row 4 explains columns,,,,",
      "Tip: keep pupil_id stable,,,,",
      "Unique pupil ID,Pupil first name,Pupil last name,Year group,Current class",
      "pupil_id,first_name,last_name,year_group,current_class",
      "759,Toby,Hulbert,Year 2,Ash",
      "804,Edwyn,Daniel,Year 2,Ash",
    ].join("\n");

    const review = reviewPupilUploadCsv(csv, "Student List.xlsx");

    expect(review.errors).toEqual([]);
    expect(review.headerRow).toBe(5);
    expect(review.totalRows).toBe(2);
    expect(review.validRows).toBe(2);
    expect(review.rows).toHaveLength(2);
    expect(review.sampleRows[0]).toMatchObject({
      rowNumber: 6,
      first_name: "Toby",
      year_group: "2",
      current_class: "Ash",
    });
  });

  it("shows gender and active status in the review sample", () => {
    const csv = [
      "pupil_id,first_name,last_name,year_group,current_class,gender,is_active",
      "P1,Ada,Lovelace,Year R,Beech,Female,true",
    ].join("\n");

    const review = reviewPupilUploadCsv(csv, "pupils.csv");

    expect(review.sampleRows[0]).toMatchObject({
      year_group: "R",
      gender: "Female",
      is_active: "true",
      primary_need: "",
      pass_colour: "",
    });
  });

  it("reports required field and duplicate pupil id errors", () => {
    const csv = [
      "pupil_id,first_name,last_name,year_group,current_class",
      "P1,Ada,Lovelace,4,Oak",
      "P1,Alan,Turing,4,Oak",
      "P3,Grace,,4,Oak",
    ].join("\n");

    const review = reviewPupilUploadCsv(csv);

    expect(review.errors).toContain("Row 3: duplicate pupil_id also used on row 2.");
    expect(review.errors).toContain("Row 4: last_name is required.");
    expect(review.validRows).toBe(1);
  });

  it("shows normalised values in the review preview", () => {
    const csv = [
      "pupil_id,first_name,last_name,year_group,current_class,gender,send_status",
      "P1,  lola ,O'NEILL, year 4 , 4 b , female, ehcp",
    ].join("\n");

    const review = reviewPupilUploadCsv(csv);

    expect(review.sampleRows[0]).toMatchObject({
      first_name: "Lola",
      last_name: "O'Neill",
      year_group: "4",
      current_class: "4B",
      send_status: "E",
    });
    expect(review.stats.classes).toEqual([{ value: "4B", count: 1 }]);
  });

  it("samples across larger files including row five", () => {
    const rows = ["pupil_id,first_name,last_name,year_group,current_class"];
    for (let index = 1; index <= 30; index += 1) {
      rows.push(`P${index},First${index},Last${index},${index % 2 ? "4" : "5"},Class${index % 3}`);
    }

    const review = reviewPupilUploadCsv(rows.join("\n"));

    expect(review.totalRows).toBe(30);
    expect(review.sampleRows.map((row) => row.rowNumber)).toContain(5);
    expect(review.sampleRows).toHaveLength(5);
  });
});
