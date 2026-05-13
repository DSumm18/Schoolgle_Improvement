import { describe, expect, it } from "vitest";

import { mapAssetToTagAsset } from "./asset-tags";

describe("mapAssetToTagAsset", () => {
  it("uses real asset identity, QR code, type, and best available location", () => {
    const tagAsset = mapAssetToTagAsset({
      id: "asset-123",
      name: "Main Boiler",
      asset_type: "equipment",
      category: "Heating",
      qr_code: "SG-BOILER-001",
      building: "Main Block",
      floor: "Ground",
      room: "Plant Room",
    });

    expect(tagAsset).toEqual({
      id: "asset-123",
      name: "Main Boiler",
      location: "Main Block · Ground · Plant Room",
      assetType: "Heating",
      qrCodeId: "SG-BOILER-001",
    });
  });

  it("falls back to the asset id when no QR code has been assigned", () => {
    const tagAsset = mapAssetToTagAsset({
      id: "asset-456",
      name: "Water Heater",
      asset_type: "equipment",
      location: "Kitchen cupboard",
    });

    expect(tagAsset.qrCodeId).toBe("asset-456");
    expect(tagAsset.location).toBe("Kitchen cupboard");
    expect(tagAsset.assetType).toBe("equipment");
  });
});
