"use client";

import { useState } from "react";
import { ExternalLink, Package, ArrowDown, ArrowUp, Crown } from "lucide-react";
import type { ProductMatch } from "@/lib/deal-finder/types";

interface MatchCardProps {
  match: ProductMatch;
  rank: number;
}

const matchTypeLabels: Record<string, string> = {
  exact_sku: "Exact Match",
  barcode: "Barcode Match",
  fingerprint: "Same Product",
  fuzzy_name: "Similar Product",
  brand_category: "Same Brand",
};

const equivalenceBadge: Record<string, { label: string; className: string }> = {
  identical: { label: "Same Product", className: "bg-green-100 text-green-700 border-green-200" },
  alternative: { label: "Brand Alternative", className: "bg-blue-100 text-blue-700 border-blue-200" },
  different: { label: "Different", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

function formatPackLabel(match: ProductMatch): string | null {
  if (!match.pack_quantity || match.pack_quantity <= 1) return null;
  const unit = !match.pack_unit || match.pack_unit === "each" ? "pack" : match.pack_unit;
  return `${unit.charAt(0).toUpperCase() + unit.slice(1)} of ${match.pack_quantity}`;
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const hasSaving = match.saving_gbp !== null && match.saving_gbp > 0;
  const isMoreExpensive = match.saving_gbp !== null && match.saving_gbp < 0;
  const hasUnitSaving = match.unit_saving_gbp !== null && match.unit_saving_gbp > 0;
  const packLabel = formatPackLabel(match);
  const equiv = equivalenceBadge[match.equivalence_type];
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md bg-white ${
        hasSaving ? "border-green-200 bg-green-50/30" : ""
      } ${match.is_best_value ? "ring-2 ring-amber-400" : rank === 0 && hasSaving ? "ring-2 ring-green-300" : ""}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
            {rank + 1}
          </div>
          {match.is_best_value && <Crown className="w-4 h-4 text-amber-500" />}
        </div>

        {match.image_url && !imgError ? (
          <img
            src={match.image_url}
            alt={match.product_name}
            className="w-16 h-16 object-contain rounded bg-white border flex-shrink-0"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{match.product_name}</h4>
          {packLabel && <p className="text-xs text-gray-500 mt-0.5">{packLabel}</p>}
          <p className="text-sm font-medium text-gray-700">{match.supplier_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-gray-200 text-gray-600">
              {matchTypeLabels[match.match_type] || match.match_type}
            </span>
            {equiv && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${equiv.className}`}>
                {equiv.label}
              </span>
            )}
            <span className="text-xs text-gray-400">{match.match_score}% match</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {match.price_gbp !== null ? (
            <>
              <p className="text-lg font-bold text-gray-900">£{match.price_gbp.toFixed(2)}</p>
              {match.unit_price_each !== null && match.pack_quantity > 1 && (
                <p className="text-xs text-gray-500">
                  £{match.unit_price_each.toFixed(2)} {match.comparison_unit_label || "each"}
                </p>
              )}
              {hasUnitSaving ? (
                <div className="flex items-center gap-1 justify-end text-green-600">
                  <ArrowDown className="w-3 h-3" />
                  <span className="text-sm font-medium">
                    Save £{match.unit_saving_gbp!.toFixed(2)}/item ({match.unit_saving_pct?.toFixed(0)}%)
                  </span>
                </div>
              ) : hasSaving ? (
                <div className="flex items-center gap-1 justify-end text-green-600">
                  <ArrowDown className="w-3 h-3" />
                  <span className="text-sm font-medium">
                    Save £{match.saving_gbp!.toFixed(2)} ({match.saving_pct?.toFixed(0)}%)
                  </span>
                </div>
              ) : null}
              {isMoreExpensive && (
                <div className="flex items-center gap-1 justify-end text-red-500">
                  <ArrowUp className="w-3 h-3" />
                  <span className="text-xs">£{Math.abs(match.saving_gbp!).toFixed(2)} more</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">No price</p>
          )}
          <div className="flex items-center gap-2 justify-end mt-1">
            {match.value_score > 0 && (
              <span className="text-xs text-gray-400">{match.value_score}pts</span>
            )}
            {match.source_url && (
              <a
                href={match.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-500 hover:underline flex items-center gap-1"
              >
                View <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
