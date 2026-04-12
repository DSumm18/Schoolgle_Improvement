/**
 * Asset warranty status API
 *
 * GET /api/estates/assets/[id]/warranty
 * Returns warranty status, days remaining, and supplier contact (if linked).
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { getAssetWithWarranty } from "@/lib/estates-compliance/database/assets";

export const GET = protectedRoute(async (auth, request: NextRequest) => {
  // Extract asset ID from URL pathname
  const parts = request.nextUrl.pathname.split("/");
  const idIdx = parts.indexOf("assets") + 1;
  const assetId = parts[idIdx];

  if (!assetId) {
    return apiError("asset id is required", 400);
  }

  // Pass organizationId to enforce tenant isolation — service role bypasses RLS
  const asset = await getAssetWithWarranty(assetId, auth.organizationId);
  if (!asset) {
    return apiError("Asset not found", 404);
  }

  // Compose a recommended action for the caller
  let recommended_action: "call_supplier" | "warranty_expiring" | "out_of_warranty" | "unknown";
  switch (asset.warranty_status) {
    case "active":
      recommended_action = "call_supplier";
      break;
    case "expiring_soon":
      recommended_action = "warranty_expiring";
      break;
    case "expired":
      recommended_action = "out_of_warranty";
      break;
    default:
      recommended_action = "unknown";
  }

  return apiSuccess({
    asset_id: asset.id,
    asset_name: asset.name,
    asset_code: asset.code,
    warranty_status: asset.warranty_status,
    warranty_expiry: asset.warranty_expiry,
    warranty_provider: asset.warranty_provider,
    warranty_terms: asset.warranty_terms,
    warranty_days_remaining: asset.warranty_days_remaining,
    supplier_contact: asset.supplier_contact,
    purchase_date: asset.purchase_date,
    purchase_price: asset.purchase_price,
    invoice_number: asset.invoice_number,
    purchase_order_number: asset.purchase_order_number,
    recommended_action,
  });
});
