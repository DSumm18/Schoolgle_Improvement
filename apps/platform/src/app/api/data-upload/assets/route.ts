import { protectedRoute, apiError, apiSuccess } from "@/lib/api-utils";
import { parseAssetUploadCsv } from "@/lib/asset-upload";
import { createServiceRoleClient } from "@/lib/supabase-server";

type LocationLookup = {
  id: string;
  room_code: string | null;
  name: string;
  metadata: Record<string, unknown> | null;
};

type ExistingAsset = {
  id: string;
  code: string | null;
};

export const GET = protectedRoute(async (auth) => {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("estates_assets")
    .select("id,code,name,category,subcategory,asset_type,status,room,building,floor,location_id,updated_at")
    .eq("organization_id", auth.organizationId)
    .order("code");

  if (error) return apiError(error.message, 500);

  return apiSuccess({
    assets: data ?? [],
  });
}, { requiredRole: "slt", rateLimit: false });

export const POST = protectedRoute(async (auth, request) => {
  const body = await request.json();
  const parsed = parseAssetUploadCsv(String(body.csvText || body.csv || ""));
  if (parsed.errors.length > 0) {
    return apiError("Asset upload has validation errors", 400, "INVALID_CSV", {
      errors: parsed.errors,
    });
  }
  if (parsed.assets.length === 0) return apiError("No asset rows found", 400);

  const supabase = createServiceRoleClient();
  const locationCodes = [...new Set(parsed.assets.map((asset) => asset.location_code).filter(Boolean))] as string[];
  const assetCodes = parsed.assets.map((asset) => asset.asset_code);

  const { data: locations, error: locationError } = locationCodes.length
    ? await supabase
        .from("estates_locations")
        .select("id,room_code,name,metadata")
        .eq("organization_id", auth.organizationId)
        .in("room_code", locationCodes)
    : { data: [], error: null };
  if (locationError) return apiError(locationError.message, 500);

  const { data: existingRows, error: existingError } = await supabase
    .from("estates_assets")
    .select("id,code")
    .eq("organization_id", auth.organizationId)
    .in("code", assetCodes);
  if (existingError) return apiError(existingError.message, 500);

  const locationsByCode = new Map<string, LocationLookup>(
    ((locations ?? []) as LocationLookup[])
      .filter((location) => location.room_code)
      .map((location) => [location.room_code!.toUpperCase(), location]),
  );
  const assetsByCode = new Map<string, ExistingAsset>(
    ((existingRows ?? []) as ExistingAsset[])
      .filter((asset) => asset.code)
      .map((asset) => [asset.code!.toUpperCase(), asset]),
  );

  let imported = 0;
  let updated = 0;
  const warnings: string[] = [];

  for (const asset of parsed.assets) {
    const location = asset.location_code ? locationsByCode.get(asset.location_code) : null;
    if (asset.location_code && !location) warnings.push(`${asset.asset_code} location ${asset.location_code} was not found.`);

    const row = {
      organization_id: auth.organizationId,
      asset_type: asset.asset_type,
      category: asset.category,
      subcategory: asset.subcategory,
      name: asset.asset_name,
      code: asset.asset_code,
      building: location?.metadata?.building_or_block ? String(location.metadata.building_or_block) : null,
      floor: location?.metadata?.floor ? String(location.metadata.floor) : null,
      room: location?.name ?? asset.location_code,
      location_id: location?.id ?? null,
      location_details: asset.location_code ? `Imported against location_code ${asset.location_code}` : null,
      status: asset.status,
      condition_grade: asset.condition_grade,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      purchase_date: asset.purchase_date,
      warranty_expiry: asset.warranty_expiry,
      notes: asset.notes,
      updated_at: new Date().toISOString(),
    };

    const existing = assetsByCode.get(asset.asset_code);
    if (existing) {
      const { error } = await supabase
        .from("estates_assets")
        .update(row)
        .eq("id", existing.id)
        .eq("organization_id", auth.organizationId);
      if (error) return apiError(error.message, 500);
      updated += 1;
      continue;
    }

    const { error } = await supabase.from("estates_assets").insert(row);
    if (error) {
      if (error.code === "23505") {
        return apiError(
          `${asset.asset_code} already exists. Use a school-specific asset_code, e.g. RSP-${asset.asset_code}.`,
          409,
          "DUPLICATE_ASSET_CODE",
        );
      }
      return apiError(error.message, 500);
    }
    imported += 1;
  }

  return apiSuccess({
    imported,
    updated,
    warnings,
    assets: parsed.assets.map((asset) => asset.asset_code),
  });
}, { requiredRole: "slt" });
