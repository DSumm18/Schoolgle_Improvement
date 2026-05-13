import { describe, expect, it } from "vitest";
import { getWarrantyRoutingRecommendation } from "./warranty-routing";

describe("getWarrantyRoutingRecommendation", () => {
  it("routes active warranty issues back to the supplier before paid work", () => {
    const recommendation = getWarrantyRoutingRecommendation({
      warranty_status: "active",
      warranty_provider: "ABC Heating",
      warranty_expiry: "2027-02-01",
      warranty_days_remaining: 281,
      supplier_contact: {
        company_name: "ABC Heating Ltd",
        contact_name: "Alex Boiler",
        email: "service@example.com",
        phone: "01234 567890",
      },
    });

    expect(recommendation.route).toBe("warranty_supplier");
    expect(recommendation.requiresOverrideForPaidWork).toBe(true);
    expect(recommendation.title).toContain("under warranty");
    expect(recommendation.primaryContact).toBe("ABC Heating Ltd");
  });

  it("treats expiring warranty as urgent warranty route", () => {
    const recommendation = getWarrantyRoutingRecommendation({
      warranty_status: "expiring_soon",
      warranty_provider: "KitchenCare",
      warranty_expiry: "2026-05-10",
      warranty_days_remaining: 14,
      supplier_contact: null,
    });

    expect(recommendation.route).toBe("warranty_supplier");
    expect(recommendation.severity).toBe("warning");
    expect(recommendation.requiresOverrideForPaidWork).toBe(true);
  });

  it("allows normal contractor routing for expired warranty", () => {
    const recommendation = getWarrantyRoutingRecommendation({
      warranty_status: "expired",
      warranty_provider: "FireCo",
      warranty_expiry: "2024-01-01",
      warranty_days_remaining: null,
      supplier_contact: null,
    });

    expect(recommendation.route).toBe("normal_contractor");
    expect(recommendation.requiresOverrideForPaidWork).toBe(false);
  });

  it("asks users to enrich the asset record when no warranty data exists", () => {
    const recommendation = getWarrantyRoutingRecommendation({
      warranty_status: "none",
      warranty_provider: null,
      warranty_expiry: null,
      warranty_days_remaining: null,
      supplier_contact: null,
    });

    expect(recommendation.route).toBe("unknown");
    expect(recommendation.title).toContain("No warranty");
  });
});
