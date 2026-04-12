/**
 * Unit tests for pure functions in the estates-compliance module.
 *
 * These tests cover:
 *   - computeWarrantyStatus (assets.ts)
 *   - computeMaintenanceSpend (assets.ts)
 *   - allocateCosts (service-records.ts)
 *   - scoreAssetMatch (ai/asset-matcher.ts)
 *
 * No database or network calls — all pure functions.
 * Supabase clients are mocked at module level to prevent init failures.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock supabase-server before any imports that call createServiceRoleClient
// at module initialisation time.
vi.mock("@/lib/supabase-server", () => ({
  createServiceRoleClient: () => ({
    from: () => ({ select: () => ({}) }),
  }),
}));

// Mock Google generative AI used by asset-matcher's transitive imports
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({})),
}));

import { computeWarrantyStatus, computeMaintenanceSpend } from "./assets";
import { allocateCosts } from "./service-records";
import { scoreAssetMatch } from "../ai/asset-matcher";
import type { Asset } from "@/types/estates-compliance";
import type { ExtractedAssetFinding } from "../ai/contractor-report-extractor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: "asset-1",
    organization_id: "org-1",
    asset_type: "equipment",
    name: "Test Asset",
    status: "active",
    compliance_domains: [],
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    maintenance_history: [],
    ...overrides,
  };
}

function makeFinding(overrides: Partial<ExtractedAssetFinding> = {}): ExtractedAssetFinding {
  return {
    identifier: "BOILER-01",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeWarrantyStatus
// ---------------------------------------------------------------------------

describe("computeWarrantyStatus", () => {
  beforeEach(() => {
    // Pin "now" to a known date so relative calculations are deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "none" when warranty_expiry is null', () => {
    const asset = makeAsset({ warranty_expiry: null });
    const result = computeWarrantyStatus(asset);
    expect(result.status).toBe("none");
    expect(result.daysRemaining).toBeNull();
  });

  it('returns "active" when expiry is more than 30 days away', () => {
    const asset = makeAsset({ warranty_expiry: "2025-08-01" }); // 61 days from Jun 1
    const result = computeWarrantyStatus(asset);
    expect(result.status).toBe("active");
    expect(result.daysRemaining).toBeGreaterThan(30);
  });

  it('returns "expiring_soon" when expiry is 15 days away', () => {
    // System time: 2025-06-01T12:00:00Z
    // Expiry: 2025-06-16T00:00:00Z → diff ≈ 14.5 days → floor = 14
    const asset = makeAsset({ warranty_expiry: "2025-06-16" });
    const result = computeWarrantyStatus(asset);
    expect(result.status).toBe("expiring_soon");
    expect(result.daysRemaining).toBe(14);
  });

  it('returns "expiring_soon" when expiry is 5 days away', () => {
    // 2025-06-06T00:00:00Z → diff ≈ 4.5 days → floor = 4
    const asset = makeAsset({ warranty_expiry: "2025-06-06" });
    const result = computeWarrantyStatus(asset);
    expect(result.status).toBe("expiring_soon");
    expect(result.daysRemaining).toBe(4);
  });

  it('returns "expired" when expiry was 31 days ago', () => {
    // 2025-05-01T00:00:00Z — before "now" of Jun 1
    const asset = makeAsset({ warranty_expiry: "2025-05-01" });
    const result = computeWarrantyStatus(asset);
    expect(result.status).toBe("expired");
    expect(result.daysRemaining).toBeLessThan(0);
  });

  it('returns "expired" when expiry date string is today but time has passed', () => {
    // System time: 2025-06-01T12:00:00Z; date-only expiry parses as midnight UTC
    // So diff = -12h → floor(-0.5) = -1 → expired
    const asset = makeAsset({ warranty_expiry: "2025-06-01" });
    const result = computeWarrantyStatus(asset);
    expect(result.status).toBe("expired");
    expect(result.daysRemaining).toBeLessThan(0);
  });
});

// ---------------------------------------------------------------------------
// computeMaintenanceSpend
// ---------------------------------------------------------------------------

describe("computeMaintenanceSpend", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-01T00:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 spend and ok for empty maintenance history", () => {
    const asset = makeAsset({ maintenance_history: [], replacement_cost_estimate: 10000 });
    const result = computeMaintenanceSpend(asset);
    expect(result.totalSpend).toBe(0);
    expect(result.entryCount).toBe(0);
    expect(result.recommendation).toBe("ok");
  });

  it("sums costs correctly from maintenance_history", () => {
    const asset = makeAsset({
      maintenance_history: [
        { date: "2024-01-01", action: "Fix", performed_by: "Bob", cost: 150 },
        { date: "2024-03-01", action: "Replace part", performed_by: "Alice", cost: 300 },
      ],
    });
    const result = computeMaintenanceSpend(asset);
    expect(result.totalSpend).toBe(450);
    expect(result.entryCount).toBe(2);
  });

  it('returns "ok" when spend is below 25% of replacement cost', () => {
    const asset = makeAsset({
      replacement_cost_estimate: 10000,
      maintenance_history: [
        { date: "2024-01-01", action: "Fix", performed_by: "Bob", cost: 2000 },
      ],
    });
    const result = computeMaintenanceSpend(asset);
    expect(result.recommendation).toBe("ok");
    expect(result.percentOfReplacement).toBeCloseTo(20);
  });

  it('returns "monitor" when spend is 25-50% of replacement cost', () => {
    const asset = makeAsset({
      replacement_cost_estimate: 10000,
      maintenance_history: [
        { date: "2024-01-01", action: "Fix", performed_by: "Bob", cost: 3000 },
      ],
    });
    const result = computeMaintenanceSpend(asset);
    expect(result.recommendation).toBe("monitor");
    expect(result.percentOfReplacement).toBeCloseTo(30);
  });

  it('returns "consider_replacement" when spend is 50-75% of replacement cost', () => {
    const asset = makeAsset({
      replacement_cost_estimate: 10000,
      maintenance_history: [
        { date: "2024-01-01", action: "Repair", performed_by: "Bob", cost: 6000 },
      ],
    });
    const result = computeMaintenanceSpend(asset);
    expect(result.recommendation).toBe("consider_replacement");
    expect(result.percentOfReplacement).toBeCloseTo(60);
  });

  it('returns "replace_urgently" when spend is >= 75% of replacement cost', () => {
    const asset = makeAsset({
      replacement_cost_estimate: 10000,
      maintenance_history: [
        { date: "2024-01-01", action: "Major repair", performed_by: "Bob", cost: 8000 },
      ],
    });
    const result = computeMaintenanceSpend(asset);
    expect(result.recommendation).toBe("replace_urgently");
    expect(result.percentOfReplacement).toBeCloseTo(80);
  });

  it('flags "monitor" for 3+ entries in last 12 months even if spend is low', () => {
    // All 3 entries within the past year, but total cost only 5% of replacement
    const asset = makeAsset({
      replacement_cost_estimate: 10000,
      maintenance_history: [
        { date: "2025-01-01", action: "Service", performed_by: "Bob", cost: 100 },
        { date: "2025-02-01", action: "Service", performed_by: "Bob", cost: 100 },
        { date: "2025-03-01", action: "Service", performed_by: "Bob", cost: 300 },
      ],
    });
    const result = computeMaintenanceSpend(asset);
    expect(result.totalSpend).toBe(500); // only 5% of 10000
    expect(result.recommendation).toBe("monitor");
    expect(result.recommendationMessage).toMatch(/serviced 3 times/i);
  });

  it("returns null percentOfReplacement when no replacement_cost_estimate", () => {
    const asset = makeAsset({
      maintenance_history: [
        { date: "2024-01-01", action: "Fix", performed_by: "Bob", cost: 500 },
      ],
      replacement_cost_estimate: null,
    });
    const result = computeMaintenanceSpend(asset);
    expect(result.percentOfReplacement).toBeNull();
    expect(result.recommendation).toBe("ok");
  });
});

// ---------------------------------------------------------------------------
// allocateCosts
// ---------------------------------------------------------------------------

describe("allocateCosts", () => {
  it("splits equally for equal_split strategy", () => {
    const assets = [
      { id: "a1" },
      { id: "a2" },
      { id: "a3" },
    ];
    const result = allocateCosts(300, assets, "equal_split");
    expect(result["a1"]).toBe(100);
    expect(result["a2"]).toBe(100);
    expect(result["a3"]).toBe(100);
  });

  it("handles rounding without drift — sum equals total", () => {
    // £100 divided by 3 assets — can't be exact; last asset absorbs remainder
    const assets = [{ id: "a1" }, { id: "a2" }, { id: "a3" }];
    const result = allocateCosts(100, assets, "equal_split");
    const total = result["a1"] + result["a2"] + result["a3"];
    expect(Math.round(total * 100) / 100).toBe(100);
  });

  it("weights by capacity_kw for weighted_capacity strategy", () => {
    const assets = [
      { id: "a1", specifications: { capacity_kw: 10 } },
      { id: "a2", specifications: { capacity_kw: 30 } },
    ];
    const result = allocateCosts(400, assets, "weighted_capacity");
    // a1 gets 10/40 = 25% = £100; a2 gets 30/40 = 75% = £300
    expect(result["a1"]).toBe(100);
    expect(result["a2"]).toBe(300);
  });

  it("handles empty asset list — returns empty object", () => {
    const result = allocateCosts(500, [], "equal_split");
    expect(Object.keys(result)).toHaveLength(0);
  });

  it("handles zero total cost — all allocations are 0", () => {
    const assets = [{ id: "a1" }, { id: "a2" }];
    const result = allocateCosts(0, assets, "equal_split");
    expect(result["a1"]).toBe(0);
    expect(result["a2"]).toBe(0);
  });

  it("equal_split and manual strategy both split equally", () => {
    const assets = [{ id: "a1" }, { id: "a2" }];
    const r1 = allocateCosts(200, assets, "equal_split");
    const r2 = allocateCosts(200, assets, "manual");
    expect(r1["a1"]).toBe(r2["a1"]);
    expect(r1["a2"]).toBe(r2["a2"]);
  });

  it("invoice_line_item strategy returns 0 for all (caller pre-allocates)", () => {
    const assets = [{ id: "a1" }, { id: "a2" }];
    const result = allocateCosts(300, assets, "invoice_line_item");
    expect(result["a1"]).toBe(0);
    expect(result["a2"]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// scoreAssetMatch
// ---------------------------------------------------------------------------

describe("scoreAssetMatch", () => {
  it("scores 0.5 for serial number match", () => {
    const asset = makeAsset({ serial_number: "SN-12345" });
    const finding = makeFinding({ serial_number: "SN-12345" });
    const { score, reasons } = scoreAssetMatch(asset, finding);
    expect(score).toBeGreaterThanOrEqual(0.5);
    expect(reasons).toContain("Serial number matches (SN-12345)");
  });

  it("scores 0.3 for asset code match", () => {
    const asset = makeAsset({ code: "BOILER-01" });
    const finding = makeFinding({ identifier: "BOILER-01" });
    const { score, reasons } = scoreAssetMatch(asset, finding);
    expect(score).toBeGreaterThanOrEqual(0.3);
    expect(reasons.some((r) => r.includes("Asset code matches"))).toBe(true);
  });

  it("combines manufacturer + model for additional 0.2 score", () => {
    const asset = makeAsset({ manufacturer: "Ideal", model: "Logic+30" });
    const finding = makeFinding({ manufacturer: "Ideal", model: "Logic+30" });
    const { score } = scoreAssetMatch(asset, finding);
    expect(score).toBeGreaterThanOrEqual(0.2);
  });

  it("scores 0 for a completely unmatched asset", () => {
    const asset = makeAsset({
      code: "PUMP-99",
      serial_number: "XYZ-000",
      manufacturer: "Grundfos",
      model: "UPS3",
    });
    const finding = makeFinding({
      identifier: "BOILER-01",
      serial_number: "SN-12345",
      manufacturer: "Ideal",
      model: "Logic+30",
    });
    // All 4 fields mismatch
    const { score } = scoreAssetMatch(asset, finding);
    expect(score).toBe(0);
  });

  it("normalises whitespace and casing for serial number comparison", () => {
    const asset = makeAsset({ serial_number: "SN 123 ABC" });
    const finding = makeFinding({ serial_number: "sn123abc" });
    const { score } = scoreAssetMatch(asset, finding);
    expect(score).toBeGreaterThanOrEqual(0.5);
  });

  it("clamps maximum score to 1.0", () => {
    // Serial (0.5) + code (0.3) + manufacturer (0.1) + model (0.1) = 1.0
    const asset = makeAsset({
      code: "UNIT-01",
      serial_number: "SN-99",
      manufacturer: "Viessmann",
      model: "Vitocal",
    });
    const finding = makeFinding({
      identifier: "UNIT-01",
      serial_number: "SN-99",
      manufacturer: "Viessmann",
      model: "Vitocal",
    });
    const { score } = scoreAssetMatch(asset, finding);
    expect(score).toBeLessThanOrEqual(1.0);
  });
});
