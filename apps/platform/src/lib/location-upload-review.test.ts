import { describe, expect, it } from "vitest";
import { reviewLocationUploadCsv } from "./location-upload-review";

describe("location upload review", () => {
  it("shows a clear validation summary before import", () => {
    const review = reviewLocationUploadCsv(
      [
        "Schoolgle Locations Upload Template",
        "Tip row",
        "Another guidance row",
        "Descriptions row",
        "location_code,location_name,location_type,parent_location_code,current_use,area_sqm,capacity",
        "R001,Room 1,Classroom,MAIN-GF,Year 1 classroom,45 sqm,30",
        "R002,Room 2,odd cupboard,MAIN-GF,Small group room,12 sqm,6",
        "R003,Room 3,,,,,",
      ].join("\n"),
      "locations.xlsx",
    );

    expect(review.errors).toEqual([]);
    expect(review.filename).toBe("locations.xlsx");
    expect(review.headerRow).toBe(5);
    expect(review.totalRows).toBe(3);
    expect(review.validRows).toBe(3);
    expect(review.stats.parentLinks).toBe(2);
    expect(review.stats.tbcCount).toBe(2);
    expect(review.warnings).toEqual(
      expect.arrayContaining([
        'Row 7: location_type "odd cupboard" is not in the controlled list and will import as TBC / Other.',
        "Row 8: location_type is blank and will import as TBC / Other.",
      ]),
    );
  });

  it("blocks duplicate location codes", () => {
    const review = reviewLocationUploadCsv("location_code,location_name\nR001,Room 1\nr001,Room One Duplicate");

    expect(review.validRows).toBe(1);
    expect(review.errors).toContain("Row 3: duplicate location_code also used on row 2.");
  });
});
