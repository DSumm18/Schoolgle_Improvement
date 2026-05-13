import { describe, expect, it } from "vitest";

import { estateAssetToPathfinderAsset, mergePathfinderPin } from "./estates-integration";
import type { Asset } from "@/types/estates-compliance";

function assetWithPathfinderPin(status: "mapped" | "needs_position" | "needs_review"): Asset {
  return {
    id: "asset-1",
    organization_id: "org-1",
    name: "Fire extinguisher - Reception",
    code: "FE-001",
    asset_type: "fire_extinguisher",
    category: "Fire safety",
    subcategory: null,
    description: null,
    manufacturer: null,
    model: null,
    serial_number: null,
    purchase_date: null,
    installation_date: null,
    warranty_expiry: null,
    expected_lifespan_years: null,
    condition: "good",
    status: "active",
    building: "Main",
    floor: "Ground",
    room: "Reception",
    location_id: null,
    location_details: mergePathfinderPin(null, {
      modelId: "model-1",
      roomId: "room-1",
      x: 100,
      y: 120,
      confidence: 0.2,
      status,
    }),
    qr_code: "QR-FE-001",
    barcode: null,
    rfid_tag: null,
    parent_asset_id: null,
    supplier: null,
    purchase_cost: null,
    replacement_cost: null,
    annual_maintenance_cost: null,
    last_inspection_date: null,
    next_inspection_due: null,
    inspection_frequency_months: null,
    maintenance_notes: null,
    compliance_requirements: [],
    documents: [],
    images: [],
    metadata: {},
    created_at: "2026-04-23T12:00:00.000Z",
    updated_at: "2026-04-23T12:00:00.000Z",
    created_by: null,
    updated_by: null,
  } as Asset;
}

describe("Pathfinder Estates asset integration", () => {
  it("preserves a needs_review Pathfinder pin instead of showing it as mapped", () => {
    const draft = estateAssetToPathfinderAsset(assetWithPathfinderPin("needs_review"));

    expect(draft.status).toBe("needs_review");
    expect(draft.confidence).toBe(0.2);
  });

  it("preserves a mapped Pathfinder pin when the asset has been placed", () => {
    const draft = estateAssetToPathfinderAsset(assetWithPathfinderPin("mapped"));

    expect(draft.status).toBe("mapped");
  });
});
