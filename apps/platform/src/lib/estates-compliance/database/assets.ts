/**
 * Assets Database Functions
 *
 * Helper functions for querying estates_assets table
 */

import { supabase } from '@/lib/supabase';
import type { Asset, AssetInput, AssetFilters, PaginatedResponse } from '@/types/estates-compliance';

/**
 * Get assets for an organization with optional filters
 */
export async function getAssets(
  organizationId: string,
  filters?: AssetFilters,
  pagination?: { page: number; pageSize: number }
): Promise<PaginatedResponse<Asset>> {
  let query = supabase
    .from('estates_assets')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  // Apply filters
  if (filters?.asset_type) {
    query = query.eq('asset_type', filters.asset_type);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.building) {
    query = query.eq('building', filters.building);
  }
  if (filters?.floor) {
    query = query.eq('floor', filters.floor);
  }
  if (filters?.room) {
    query = query.eq('room', filters.room);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.compliance_domain) {
    query = query.contains('compliance_domains', [filters.compliance_domain]);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`);
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  // Order by updated_at desc
  query = query.order('updated_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    page: pagination?.page || 1,
    page_size: pagination?.pageSize || count || 0,
    has_more: (count || 0) > ((pagination?.page || 1) * (pagination?.pageSize || count || 0)),
  };
}

/**
 * Get a single asset by ID
 */
export async function getAssetById(assetId: string): Promise<Asset | null> {
  const { data, error } = await supabase
    .from('estates_assets')
    .select('*')
    .eq('id', assetId)
    .single();

  if (error) {
    console.error('Error fetching asset:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new asset
 */
export async function createAsset(
  organizationId: string,
  asset: AssetInput
): Promise<Asset> {
  // Generate QR code URL if not provided
  const qrCode = asset.code
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://schoolgle.co.uk'}/estates/assets/scan/${asset.code}`
    : undefined;

  const { data, error } = await supabase
    .from('estates_assets')
    .insert({
      organization_id: organizationId,
      ...asset,
      qr_code: qrCode,
      status: asset.status || 'active',
      compliance_domains: asset.compliance_domains || [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating asset:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing asset
 */
export async function updateAsset(
  assetId: string,
  updates: Partial<AssetInput & { status?: AssetStatus }>
): Promise<Asset> {
  const { data, error } = await supabase
    .from('estates_assets')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assetId)
    .select()
    .single();

  if (error) {
    console.error('Error updating asset:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an asset
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const { error } = await supabase
    .from('estates_assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
}

/**
 * Get assets by compliance domain
 */
export async function getAssetsByDomain(
  organizationId: string,
  domain: string
): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('estates_assets')
    .select('*')
    .eq('organization_id', organizationId)
    .contains('compliance_domains', [domain])
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching assets by domain:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get child assets (e.g., outlets in a room)
 */
export async function getChildAssets(parentAssetId: string): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('estates_assets')
    .select('*')
    .eq('parent_asset_id', parentAssetId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching child assets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Search assets by code, name, or serial number
 */
export async function searchAssets(
  organizationId: string,
  searchTerm: string,
  limit = 20
): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('estates_assets')
    .select('*')
    .eq('organization_id', organizationId)
    .or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching assets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get asset statistics for an organization
 */
export async function getAssetStats(organizationId: string): Promise<{
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_compliance_domain: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from('estates_assets')
    .select('asset_type, status, compliance_domains')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching asset stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    by_type: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    by_compliance_domain: {} as Record<string, number>,
  };

  for (const asset of data || []) {
    // Count by type
    stats.by_type[asset.asset_type] = (stats.by_type[asset.asset_type] || 0) + 1;

    // Count by status
    stats.by_status[asset.status] = (stats.by_status[asset.status] || 0) + 1;

    // Count by compliance domain
    for (const domain of asset.compliance_domains || []) {
      stats.by_compliance_domain[domain] = (stats.by_compliance_domain[domain] || 0) + 1;
    }
  }

  return stats;
}
