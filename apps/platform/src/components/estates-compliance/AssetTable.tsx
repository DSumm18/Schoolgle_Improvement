"use client";

/**
 * AssetTable Component
 *
 * Table view for displaying multiple assets with sorting and filtering support.
 */

import Link from "next/link";
import { Asset, AssetStatus } from "@/types/estates-compliance";
import { getPathfinderPin } from "@/lib/pathfinder/estates-integration";

interface AssetTableProps {
  assets: Asset[];
}

const statusConfig: Record<AssetStatus, { label: string; className: string }> =
  {
    active: { label: "Active", className: "bg-green-100 text-green-800" },
    inactive: { label: "Inactive", className: "bg-gray-100 text-gray-800" },
    disposed: { label: "Disposed", className: "bg-gray-100 text-gray-800" },
    under_repair: {
      label: "Under Repair",
      className: "bg-yellow-100 text-yellow-800",
    },
    under_maintenance: {
      label: "Maintenance",
      className: "bg-yellow-100 text-yellow-800",
    },
    requires_inspection: {
      label: "Inspection Due",
      className: "bg-orange-100 text-orange-800",
    },
    retired: { label: "Retired", className: "bg-red-100 text-red-800" },
  };

export function AssetTable({ assets }: AssetTableProps) {
  if (assets.length === 0) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="p-12 text-center text-muted-foreground">
          No assets found matching your filters.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr className="text-left text-sm">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Domains</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assets.map((asset) => {
              const status = statusConfig[asset.status] || statusConfig.active;

              return (
                <tr key={asset.id} className="text-sm hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {asset.code || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{asset.name}</div>
                    {asset.manufacturer && (
                      <div className="text-xs text-muted-foreground">
                        {asset.manufacturer}
                        {asset.model && ` ${asset.model}`}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="capitalize">
                      {asset.asset_type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {(() => {
                      const pin = getPathfinderPin(asset.location_details);
                      const pinColor = !pin
                        ? "text-slate-300"
                        : pin.status === "needs_review"
                          ? "text-amber-500"
                          : "text-emerald-500";
                      const pinTitle = !pin
                        ? "Not placed on Pathfinder"
                        : pin.status === "needs_review"
                          ? "Pin needs review — location changed in a revision"
                          : "Mapped on Pathfinder";
                      return (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden
                            title={pinTitle}
                            className={`h-2 w-2 rounded-full ${pin ? "bg-current" : "bg-slate-200"} ${pinColor}`}
                          />
                          {asset.location || "-"}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {asset.compliance_domains?.slice(0, 2).map((domain) => (
                        <span
                          key={domain}
                          className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs"
                        >
                          {domain}
                        </span>
                      ))}
                      {asset.compliance_domains &&
                        asset.compliance_domains.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{asset.compliance_domains.length - 2}
                          </span>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/estates-compliance/assets/${asset.id}`}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        View
                      </Link>
                      <Link
                        href={`/estates-compliance/pathfinder?placeAsset=${asset.id}`}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
                        title="Place or review this asset on the Pathfinder site plan"
                      >
                        Pathfinder
                      </Link>
                      <Link
                        href={`/estates-compliance/assets/${asset.id}/edit`}
                        className="inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium hover:bg-accent"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
