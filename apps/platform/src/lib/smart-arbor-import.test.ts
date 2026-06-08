import { describe, expect, it } from "vitest";
import { analyseSmartArborImport } from "./smart-arbor-import";

describe("smart Arbor import analyser", () => {
  it("detects an Arbor pupil roll even when only useful fields are populated", () => {
    const analysis = analyseSmartArborImport(
      [
        '"Globally Unique Student ID","Arbor Student ID","Legal First Name","Legal Last Name","Sex","Year group(s) this academic year","Date of Birth","Courses/classes","SEN status"',
        'G001,ARB001,Ava,Adams,Female,Year 4,2017-09-15,4A,SEN Support',
      ].join("\n"),
      "pupil-roll.csv",
    );

    expect(analysis.detectedType).toBe("pupil_roll");
    expect(analysis.confidence).toBeGreaterThanOrEqual(0.8);
    expect(analysis.canImport).toBe(true);
    expect(analysis.availableFields).toEqual(expect.arrayContaining(["pupil_id", "source_pupil_ref", "date_of_birth"]));
  });

  it("detects a SEND status report and treats missing funding amount as a data-quality gap", () => {
    const analysis = analyseSmartArborImport(
      [
        'UPN,Name,"Year group(s) this academic year","Registration form(s) this academic year","Date of Birth","SEN status","Sen Need","SEN Need Ranking","Funded Hours","SEN status"',
        'A001,"Adams, Ava","Year 4",4A,2017-09-15,"SEN Support","Speech, Language and Communication Needs",1,"15h 0m",K',
      ].join("\n"),
      "sen-report.csv",
    );

    expect(analysis.detectedType).toBe("send_status");
    expect(analysis.canImport).toBe(true);
    expect(analysis.availableFields).toEqual(expect.arrayContaining(["sen_status", "primary_need", "funded_hours"]));
    expect(analysis.dataQualityGaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "funding_amount" }),
    ]));
  });

  it("detects daily attendance as a class and staff seed rather than a full timetable", () => {
    const analysis = analyseSmartArborImport(
      [
        'Time,Lesson/Event,"Year Group","Event Type",Teacher,Marks',
        '"12:30 - 15:15","Year 4: 4 Mian",,Lesson,"Patrick Bland, Alisha Naveed and Gemma Smith","Present: 26 Absent: 1 Late: 0"',
      ].join("\n"),
      "daily-attendance.csv",
    );

    expect(analysis.detectedType).toBe("daily_attendance_class_seed");
    expect(analysis.canImport).toBe(true);
    expect(analysis.recommendedIntent).toBe("class_staff_seed");
    expect(analysis.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining("not a full weekly timetable"),
    ]));
  });

  it("returns a review-required result for unknown partial exports", () => {
    const analysis = analyseSmartArborImport("Name,Notes\nAva Adams,Something", "unknown.csv");

    expect(analysis.detectedType).toBe("unknown");
    expect(analysis.canImport).toBe(false);
    expect(analysis.nextBestActions.length).toBeGreaterThan(0);
  });
});
