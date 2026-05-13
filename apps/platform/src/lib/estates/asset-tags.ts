import type { Asset } from "@/types/estates-compliance";

export interface TagAsset {
  id: string;
  name: string;
  location?: string;
  assetType?: string;
  qrCodeId?: string;
}

type AssetTagSource = Pick<
  Asset,
  | "id"
  | "name"
  | "asset_type"
  | "category"
  | "subcategory"
  | "qr_code"
  | "code"
  | "building"
  | "floor"
  | "room"
  | "location"
>;

function clean(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function formatAssetType(asset: AssetTagSource): string | undefined {
  return (
    clean(asset.category) ||
    clean(asset.subcategory) ||
    clean(asset.asset_type?.replace(/_/g, " "))
  );
}

function formatAssetLocation(asset: AssetTagSource): string | undefined {
  const explicitLocation = clean(asset.location);
  if (explicitLocation) return explicitLocation;

  const locationParts = [asset.building, asset.floor, asset.room]
    .map(clean)
    .filter(Boolean);

  return locationParts.length > 0 ? locationParts.join(" · ") : undefined;
}

export function mapAssetToTagAsset(asset: AssetTagSource): TagAsset {
  return {
    id: asset.id,
    name: asset.name,
    location: formatAssetLocation(asset),
    assetType: formatAssetType(asset),
    qrCodeId: clean(asset.qr_code) || clean(asset.code) || asset.id,
  };
}

export function mapAssetsToTagAssets(assets: AssetTagSource[]): TagAsset[] {
  return assets.map(mapAssetToTagAsset);
}
