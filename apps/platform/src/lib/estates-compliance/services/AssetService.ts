/**
 * Asset Service
 *
 * Business logic layer for asset management
 */

import {
  getAssets,
  getAssetById,
  createAsset as dbCreateAsset,
  updateAsset as dbUpdateAsset,
  deleteAsset as dbDeleteAsset,
  getAssetsByDomain,
  getChildAssets,
  searchAssets,
  getAssetStats,
} from '../database/assets';
import type {
  Asset,
  AssetInput,
  AssetFilters,
  PaginatedResponse,
} from '@/types/estates-compliance';

/**
 * Asset Service class
 */
export class AssetService {
  /**
   * Get assets with filters and pagination
   */
  static async list(
    organizationId: string,
    filters?: AssetFilters,
    pagination?: { page: number; pageSize: number }
  ): Promise<PaginatedResponse<Asset>> {
    return getAssets(organizationId, filters, pagination);
  }

  /**
   * Get a single asset by ID
   */
  static async get(assetId: string): Promise<Asset | null> {
    return getAssetById(assetId);
  }

  /**
   * Create a new asset with validation
   */
  static async create(organizationId: string, input: AssetInput): Promise<Asset> {
    // Validate asset type
    const validAssetTypes = [
      'building',
      'room',
      'outlet',
      'equipment',
      'fire_extinguisher',
      'emergency_light',
      'lift',
      'playground_equipment',
      'accessibility_equipment',
      'vehicle',
    ];

    if (!validAssetTypes.includes(input.asset_type)) {
      throw new Error(`Invalid asset_type: ${input.asset_type}`);
    }

    // Validate that parent asset exists if provided
    if (input.parent_asset_id) {
      const parent = await getAssetById(input.parent_asset_id);
      if (!parent) {
        throw new Error(`Parent asset not found: ${input.parent_asset_id}`);
      }

      // Parent must belong to same organization
      if (parent.organization_id !== organizationId) {
        throw new Error('Parent asset must belong to the same organization');
      }
    }

    // Generate asset code if not provided
    let assetCode = input.code;
    if (!assetCode) {
      const prefix = this.getAssetCodePrefix(input.asset_type);
      const timestamp = Date.now().toString(36).toUpperCase();
      assetCode = `${prefix}-${timestamp}`;
    }

    return dbCreateAsset(organizationId, {
      ...input,
      code: assetCode,
    });
  }

  /**
   * Update an existing asset with validation
   */
  static async update(assetId: string, updates: Partial<AssetInput>): Promise<Asset> {
    // Check asset exists
    const existing = await getAssetById(assetId);
    if (!existing) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Validate parent asset if being changed
    if (updates.parent_asset_id) {
      if (updates.parent_asset_id === assetId) {
        throw new Error('Asset cannot be its own parent');
      }

      const parent = await getAssetById(updates.parent_asset_id);
      if (!parent) {
        throw new Error(`Parent asset not found: ${updates.parent_asset_id}`);
      }
    }

    return dbUpdateAsset(assetId, updates);
  }

  /**
   * Delete an asset with dependency checks
   */
  static async delete(assetId: string): Promise<void> {
    // Check if asset exists
    const asset = await getAssetById(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Check for child assets
    const children = await getChildAssets(assetId);
    if (children.length > 0) {
      throw new Error(
        `Cannot delete asset with ${children.length} child assets. Reassign or delete children first.`
      );
    }

    // TODO: Check for related tasks, helpdesk tickets, etc.
    // For now, just delete
    return dbDeleteAsset(assetId);
  }

  /**
   * Get assets by compliance domain
   */
  static async getByDomain(organizationId: string, domain: string): Promise<Asset[]> {
    return getAssetsByDomain(organizationId, domain);
  }

  /**
   * Get child assets
   */
  static async getChildren(parentAssetId: string): Promise<Asset[]> {
    return getChildAssets(parentAssetId);
  }

  /**
   * Search assets
   */
  static async search(organizationId: string, searchTerm: string, limit?: number): Promise<Asset[]> {
    return searchAssets(organizationId, searchTerm, limit);
  }

  /**
   * Get asset statistics
   */
  static async getStats(organizationId: string) {
    return getAssetStats(organizationId);
  }

  /**
   * Generate QR code for an asset
   */
  static async generateQRCode(assetId: string): Promise<string> {
    const asset = await getAssetById(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    if (!asset.code) {
      throw new Error('Asset must have a code to generate QR code');
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://schoolgle.co.uk';
    const qrUrl = `${baseUrl}/estates/assets/scan/${asset.code}`;

    // Update asset with QR code
    await dbUpdateAsset(assetId, { qr_code: qrUrl });

    return qrUrl;
  }

  /**
   * Deactivate an asset (soft delete)
   */
  static async deactivate(assetId: string): Promise<Asset> {
    return this.update(assetId, { status: 'inactive' });
  }

  /**
   * Get asset hierarchy (with parents and children)
   */
  static async getHierarchy(assetId: string): Promise<{
    asset: Asset;
    parent?: Asset;
    children: Asset[];
    path: Asset[];
  }> {
    const asset = await getAssetById(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    const children = await getChildAssets(assetId);
    const path: Asset[] = [asset];

    // Build path to root
    let currentAsset = asset;
    while (currentAsset.parent_asset_id) {
      const parent = await getAssetById(currentAsset.parent_asset_id);
      if (parent) {
        path.unshift(parent);
        currentAsset = parent;
      } else {
        break;
      }
    }

    return {
      asset,
      parent: asset.parent_asset_id ? await getAssetById(asset.parent_asset_id) : undefined,
      children,
      path,
    };
  }

  /**
   * Bulk import assets from CSV/data
   */
  static async bulkImport(
    organizationId: string,
    assets: Array<AssetInput & { temp_id?: string }>
  ): Promise<{
    created: Asset[];
    errors: Array<{ temp_id?: string; row: number; error: string }>;
  }> {
    const created: Asset[] = [];
    const errors: Array<{ temp_id?: string; row: number; error: string }> = [];

    // Create a map of temporary IDs to actual IDs for parent references
    const tempIdMap = new Map<string, string>();

    for (let i = 0; i < assets.length; i++) {
      const input = assets[i];

      try {
        // Resolve parent_asset_id if it's a temporary ID
        let finalInput = { ...input };
        if (input.parent_asset_id && tempIdMap.has(input.parent_asset_id)) {
          finalInput = {
            ...input,
            parent_asset_id: tempIdMap.get(input.parent_asset_id),
          };
        }

        const asset = await this.create(organizationId, finalInput);
        created.push(asset);

        // Store mapping if temp_id was provided
        if (input.temp_id) {
          tempIdMap.set(input.temp_id, asset.id);
        }
      } catch (error) {
        errors.push({
          temp_id: input.temp_id,
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { created, errors };
  }

  /**
   * Get asset code prefix based on asset type
   */
  private static getAssetCodePrefix(assetType: string): string {
    const prefixes: Record<string, string> = {
      building: 'BLD',
      room: 'ROM',
      outlet: 'OUT',
      equipment: 'EQP',
      fire_extinguisher: 'FE',
      emergency_light: 'EL',
      lift: 'LFT',
      playground_equipment: 'PGE',
      accessibility_equipment: 'ACE',
      vehicle: 'VHC',
    };

    return prefixes[assetType] || 'AST';
  }
}

/**
 * Alias for backward compatibility
 */
export const assetService = AssetService;
