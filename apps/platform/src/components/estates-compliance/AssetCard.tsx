'use client';

/**
 * AssetCard Component
 *
 * Displays a single asset with key information and quick actions.
 */

import Link from 'next/link';
import { Asset, AssetStatus } from '@/types/estates-compliance';

interface AssetCardProps {
  asset: Asset;
}

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-800' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-800' },
  under_maintenance: { label: 'Under Maintenance', className: 'bg-yellow-100 text-yellow-800' },
  retired: { label: 'Retired', className: 'bg-red-100 text-red-800' },
  requires_inspection: { label: 'Requires Inspection', className: 'bg-orange-100 text-orange-800' },
};

export function AssetCard({ asset }: AssetCardProps) {
  const status = statusConfig[asset.status] || statusConfig.active;

  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{asset.code || 'No code'}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
          <h3 className="font-semibold text-base">{asset.name}</h3>
          <p className="text-sm text-muted-foreground">{asset.asset_type.replace('_', ' ')}</p>
        </div>
        {asset.qr_code && (
          <div className="ml-4 flex-shrink-0">
            <img src={asset.qr_code} alt="QR Code" className="w-16 h-16 rounded border" />
          </div>
        )}
      </div>

      <div className="space-y-1 text-sm text-muted-foreground mb-3">
        {asset.location && (
          <p>
            <span className="font-medium">Location:</span> {asset.location}
          </p>
        )}
        {asset.manufacturer && (
          <p>
            <span className="font-medium">Manufacturer:</span> {asset.manufacturer}
            {asset.model && ` (${asset.model})`}
          </p>
        )}
      </div>

      {asset.compliance_domains && asset.compliance_domains.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {asset.compliance_domains.map((domain) => (
            <span
              key={domain}
              className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs"
            >
              {domain}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t">
        <Link
          href={`/estates-compliance/assets/${asset.id}`}
          className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          View Details
        </Link>
        <Link
          href={`/estates-compliance/assets/${asset.id}/edit`}
          className="inline-flex items-center justify-center rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
