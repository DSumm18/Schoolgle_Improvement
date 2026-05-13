export type WarrantyStatus = "active" | "expiring_soon" | "expired" | "none";

export interface WarrantySupplierContact {
  company_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface WarrantyRoutingInput {
  warranty_status: WarrantyStatus;
  warranty_provider: string | null;
  warranty_expiry: string | null;
  warranty_days_remaining: number | null;
  supplier_contact: WarrantySupplierContact | null;
}

export interface WarrantyRoutingRecommendation {
  route: "warranty_supplier" | "normal_contractor" | "unknown";
  severity: "success" | "warning" | "neutral";
  title: string;
  guidance: string;
  requiresOverrideForPaidWork: boolean;
  primaryContact: string | null;
}

export function getWarrantyRoutingRecommendation(
  warranty: WarrantyRoutingInput | null,
): WarrantyRoutingRecommendation | null {
  if (!warranty) return null;

  const primaryContact =
    warranty.supplier_contact?.company_name || warranty.warranty_provider;

  if (warranty.warranty_status === "active") {
    return {
      route: "warranty_supplier",
      severity: "success",
      title: "Asset is under warranty",
      guidance: [
        primaryContact
          ? `Contact ${primaryContact} before booking paid repair work.`
          : "Contact the warranty provider before booking paid repair work.",
        warranty.warranty_expiry
          ? `Warranty runs until ${warranty.warranty_expiry}.`
          : "Warranty is currently recorded as active.",
        "If the school chooses to use a different contractor, record the reason for the audit trail.",
      ].join(" "),
      requiresOverrideForPaidWork: true,
      primaryContact,
    };
  }

  if (warranty.warranty_status === "expiring_soon") {
    return {
      route: "warranty_supplier",
      severity: "warning",
      title: "Warranty is about to expire",
      guidance: [
        warranty.warranty_days_remaining !== null
          ? `There are ${warranty.warranty_days_remaining} days of cover left.`
          : "Warranty cover is close to expiry.",
        primaryContact
          ? `Contact ${primaryContact} urgently before paid repair work.`
          : "Contact the warranty provider urgently before paid repair work.",
      ].join(" "),
      requiresOverrideForPaidWork: true,
      primaryContact,
    };
  }

  if (warranty.warranty_status === "expired") {
    return {
      route: "normal_contractor",
      severity: "neutral",
      title: "Warranty has expired",
      guidance: warranty.warranty_expiry
        ? `Warranty expired on ${warranty.warranty_expiry}; normal contractor routing is appropriate.`
        : "Warranty has expired; normal contractor routing is appropriate.",
      requiresOverrideForPaidWork: false,
      primaryContact,
    };
  }

  return {
    route: "unknown",
    severity: "neutral",
    title: "No warranty information recorded",
    guidance:
      "Check purchase records if this is a recent asset, then update the asset register with warranty details for next time.",
    requiresOverrideForPaidWork: false,
    primaryContact,
  };
}
