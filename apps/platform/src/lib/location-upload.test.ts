import { describe, expect, it } from "vitest";
import { LOCATION_TYPES, locationUploadXlsxTemplate, parseLocationUploadCsv } from "./location-upload";

describe("location upload", () => {
  it("parses styled-template rows and normalises location data", () => {
    const parsed = parseLocationUploadCsv(
      [
        "Code explainer,Name explainer,Type explainer,Parent,Building,Floor,Use,Area,Capacity,Year,Notes,Active",
        "location_code,location_name,location_type,parent_location_code,building_or_block,floor,current_use,area_sqm,capacity,year_built,notes,active",
        " r022 , room 22 , classroom , main-gf , main building ,0, year 4 classroom, 560 sq ft,30,1890,,yes",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.locations[0]).toMatchObject({
      location_code: "R022",
      location_name: "Room 22",
      location_type: "Classroom",
      broad_type: "room",
      parent_location_code: "MAIN-GF",
      building_or_block: "Main Building",
      area_sqm: 52.03,
      capacity: 30,
      active: true,
    });
  });

  it("sweeps unknown location types into TBC", () => {
    const parsed = parseLocationUploadCsv("location_code,location_name,location_type\nX1,Mystery Place,random cupboard");

    expect(parsed.errors).toEqual([]);
    expect(parsed.locations[0].location_type).toBe("TBC / Other");
  });

  it("allows blank location type and stores it as TBC", () => {
    const parsed = parseLocationUploadCsv("location_code,location_name,location_type\nX2,Unlabelled Room,");

    expect(parsed.errors).toEqual([]);
    expect(parsed.locations[0]).toMatchObject({
      location_code: "X2",
      location_type: "TBC / Other",
      broad_type: "room",
    });
  });

  it("generates an xlsx template with controlled dropdown lists", async () => {
    const JSZip = (await import("jszip")).default;
    const buffer = await locationUploadXlsxTemplate();
    const zip = await JSZip.loadAsync(buffer);
    const worksheet = await zip.file("xl/worksheets/sheet1.xml")?.async("string");
    const lists = await zip.file("xl/worksheets/sheet2.xml")?.async("string");

    expect(worksheet).toContain("sqref=\"C6:C505\"");
    expect(worksheet).toContain(`Lists!$A$1:$A$${LOCATION_TYPES.length}`);
    expect(worksheet).toContain("sqref=\"L6:L505\"");
    expect(worksheet).toContain("<mergeCell ref=\"A1:L1\"/>");
    expect(worksheet).toContain("<mergeCell ref=\"A2:L2\"/>");
    expect(worksheet).toContain("<mergeCell ref=\"A3:L3\"/>");
    expect(lists).toContain("Classroom");
    expect(lists).toContain("TBC / Other");
  });

  it("parses a location row added to the xlsx template upload flow", async () => {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(await locationUploadXlsxTemplate(), { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(
      sheet,
      [["R099", "New Small Group Room", "SEN / Intervention Room", "MAIN-GF", "Main Building", "0", "Intervention", "12 sqm", "6", "", "", "yes"]],
      { origin: "A13" },
    );

    const parsed = parseLocationUploadCsv(XLSX.utils.sheet_to_csv(sheet, { blankrows: false }));

    expect(parsed.errors).toEqual([]);
    expect(parsed.locations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          location_code: "R099",
          location_name: "New Small Group Room",
          location_type: "SEN / Intervention Room",
        }),
      ]),
    );
  });
});
