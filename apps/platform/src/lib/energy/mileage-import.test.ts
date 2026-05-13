import { describe, expect, it } from "vitest";

import { parseMileageClaimsCsv } from "./mileage-import";

describe("parseMileageClaimsCsv", () => {
  it("parses flexible mileage CSV headers into import rows", () => {
    const result = parseMileageClaimsCsv(`Date,Staff,From,To,Miles,Purpose,Rate,Vehicle
2026-04-01,Jane Smith,School,Trust HQ,18.5,Heads meeting,45p,car
2026-04-02,Alex Jones,School,Training Centre,32,CPD,0.45,motorcycle`);

    expect(result.validRows).toEqual([
      {
        staff_name: "Jane Smith",
        claim_date: "2026-04-01",
        from_location: "School",
        to_location: "Trust HQ",
        miles: 18.5,
        purpose: "Heads meeting",
        rate_pence: 45,
        vehicle_type: "car",
      },
      {
        staff_name: "Alex Jones",
        claim_date: "2026-04-02",
        from_location: "School",
        to_location: "Training Centre",
        miles: 32,
        purpose: "CPD",
        rate_pence: 45,
        vehicle_type: "motorcycle",
      },
    ]);
    expect(result.errors).toEqual([]);
  });

  it("reports row-level errors without blocking valid rows", () => {
    const result = parseMileageClaimsCsv(`claim_date,staff_name,from_location,to_location,mileage
2026-04-01,Jane Smith,School,Trust HQ,18
,Missing Date,School,Trust HQ,10
2026-04-03,Missing Miles,School,Trust HQ,`);

    expect(result.validRows).toHaveLength(1);
    expect(result.errors).toEqual([
      "Row 3: claim date is required.",
      "Row 4: miles must be greater than zero.",
    ]);
  });

  it("handles quoted fields and UK date formats", () => {
    const result = parseMileageClaimsCsv(`Staff Name,Claim Date,From Location,To Location,Miles,Purpose
"Jane Smith","28/04/2026","School","LA Offices","12.4","SEND, finance and estates meeting"`);

    expect(result.validRows[0]).toMatchObject({
      staff_name: "Jane Smith",
      claim_date: "2026-04-28",
      purpose: "SEND, finance and estates meeting",
      miles: 12.4,
    });
  });
});
