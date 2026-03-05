'use client';

/**
 * Assets Register Page
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Asset } from '@/types/estates-compliance';
import { AssetTable } from '@/components/estates-compliance/AssetTable';
import { AssetCard } from '@/components/estates-compliance/AssetCard';
import { useAuth } from '@/context/SupabaseAuthContext';

type ViewMode = 'table' | 'grid';

export default function AssetsPage() {
  const { organizationId, session } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState({
    asset_type: '',
    building: '',
    search: '',
  });

  useEffect(() => {
    if (organizationId) {
      fetchAssets();
    }
  }, [organizationId]);

  const fetchAssets = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('organization_id', organizationId || '');
      if (filters.asset_type) params.append('asset_type', filters.asset_type);
      if (filters.building) params.append('building', filters.building);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/estates/assets?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data.assets || []);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load assets');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchAssets();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Register</h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading assets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Asset Register</h1>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Error: {error}
        </div>
      </div>
    );
  }

  const hasAssets = assets.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/estates-compliance" className="hover:text-foreground">
              Estates Compliance
            </Link>
            <span>/</span>
            <span>Assets</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight">Asset Register</h1>
          <p className="text-muted-foreground mt-1">
            {hasAssets ? `${assets.length} asset${assets.length !== 1 ? 's' : ''} registered` : 'Manage buildings, rooms, equipment, and compliance assets'}
          </p>
        </div>
        <div className="flex gap-2">
          {hasAssets && (
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              {viewMode === 'table' ? 'Grid View' : 'Table View'}
            </button>
          )}
          <Link
            href="/estates-compliance/assets/new"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add Asset
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex gap-4">
          <select
            className="rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.asset_type}
            onChange={(e) => handleFilterChange('asset_type', e.target.value)}
          >
            <option value="">All Asset Types</option>
            <option value="building">Building</option>
            <option value="room">Room</option>
            <option value="outlet">Outlet</option>
            <option value="equipment">Equipment</option>
            <option value="fire_extinguisher">Fire Extinguisher</option>
            <option value="emergency_light">Emergency Light</option>
          </select>

          <input
            type="text"
            placeholder="Search assets..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />

          <button
            onClick={applyFilters}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Assets */}
      {hasAssets ? (
        <>
          {viewMode === 'table' ? <AssetTable assets={assets} /> : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <span className="text-2xl">🏢</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
            Get started by adding your first asset. You can add buildings, rooms, equipment, and more.
          </p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/estates-compliance/assets/new"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add Your First Asset
            </Link>
            <Link
              href="/estates-compliance/assets/import"
              className="inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Import from CSV
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
