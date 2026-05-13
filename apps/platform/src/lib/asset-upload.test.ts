import { describe, expect, it } from "vitest";
import { parseAssetUploadCsv } from "./asset-upload";

describe("asset upload", () => {
  it("parses assets with locations and tidy asset type aliases", () => {
    const parsed = parseAssetUploadCsv(
      [
        "Code,Name,Type,Category,Subcategory,Location,Status,Condition,Manufacturer,Model,Serial,Purchase,Warranty,Notes",
        "asset_code,asset_name,asset_type,category,subcategory,location_code,status,condition_grade,manufacturer,model,serial_number,purchase_date,warranty_expiry,notes",
        " fe-001 , co2 extinguisher , extinguisher, fire safety, co2, r022, under repair, b, Chubb, CO2 2kg, SN1, 2024-01-01, 2029-01-01, check bracket",
      ].join("\n"),
    );

    expect(parsed.errors).toEqual([]);
    expect(parsed.assets[0]).toMatchObject({
      asset_code: "FE-001",
      asset_name: "Co2 Extinguisher",
      asset_type: "fire_extinguisher",
      category: "Fire Safety",
      location_code: "R022",
      status: "under_repair",
      condition_grade: "B",
    });
  });

  it("rejects unknown asset types", () => {
    const parsed = parseAssetUploadCsv("asset_code,asset_name,asset_type\nA1,Magic Thing,magic");

    expect(parsed.errors[0]).toContain("asset_type");
  });
});
