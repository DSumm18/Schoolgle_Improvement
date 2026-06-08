"use client";

import { useState } from "react";
import { ExternalLink, Package, ArrowDown, ArrowUp, Crown, Clock, Star } from "lucide-react";
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
  category_equivalence: "Same product type",
};

const equivalenceBadge: Record<string, { label: string; className: string }> = {
  identical: { label: "Same Product", className: "bg-green-100 text-green-700 border-green-200" },
  alternative: { label: "Brand Alternative", className: "bg-blue-100 text-blue-700 border-blue-200" },
  different: { label: "Different", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

function formatPackLabel(match: ProductMatch): string | null {
  if (!match.pack_quantity || match.pack_quantity <= 1) return null;
  if (match.comparison_unit_label === "per ream") {
    return `${match.pack_quantity} ream${match.pack_quantity === 1 ? "" : "s"}`;
  }
  const unit = !match.pack_unit || match.pack_unit === "each" ? "pack" : match.pack_unit;
  return `${unit.charAt(0).toUpperCase() + unit.slice(1)} of ${match.pack_quantity}`;
}

function getFreshnessStatus(dateString: string | null): { label: string; colorClass: string; dotClass: string } {
  if (!dateString) return { label: "Unknown age", colorClass: "text-gray-500", dotClass: "bg-gray-400" };
  
  const ageInDays = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
  
  if (ageInDays <= 7) {
    return { label: ageInDays === 0 ? "Live" : `${ageInDays}d ago`, colorClass: "text-green-600", dotClass: "bg-green-500 animate-pulse" };
  } else if (ageInDays <= 30) {
    return { label: `${ageInDays}d ago`, colorClass: "text-amber-600", dotClass: "bg-amber-500" };
  } else {
    return { label: `Stale (${Math.floor(ageInDays/30)}mo)`, colorClass: "text-red-500", dotClass: "bg-red-500" };
  }
}

function isAmazonUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.toLowerCase().includes("amazon.");
  } catch {
    return url.toLowerCase().includes("amazon.");
  }
}

function formatSourceUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname}`;
  } catch {
    return url;
  }
}

const establishedSchoolSuppliers = [
  "ypo",
  "espo",
  "kcs",
  "tts",
  "gls",
  "hope",
  "findel",
  "consortium",
];

function getSupplierFriction(match: ProductMatch): { label: string; className: string } {
  const supplier = match.supplier_name.toLowerCase();
  const source = match.source_url?.toLowerCase() || "";
  const isSchoolSupplier = establishedSchoolSuppliers.some(
    (name) => supplier.includes(name) || source.includes(name),
  );

  if (isSchoolSupplier) {
    return {
      label: "School-account friendly",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  return {
    label: "May need supplier setup",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  };
}

export function MatchCard({ match, rank }: MatchCardProps) {
  const hasSaving = match.saving_gbp !== null && match.saving_gbp > 0;
  const isMoreExpensive = match.saving_gbp !== null && match.saving_gbp < 0;
  const hasUnitSaving = match.unit_saving_gbp !== null && match.unit_saving_gbp > 0;
  const packLabel = formatPackLabel(match);
  const equiv = equivalenceBadge[match.equivalence_type];
  const [imgError, setImgError] = useState(false);
  const freshness = getFreshnessStatus(match.price_date);
  const affiliateLink = isAmazonUrl(match.source_url);
  const supplierFriction = getSupplierFriction(match);
  const sourceLabel = formatSourceUrl(match.source_url);
  const equivalentLabel =
    match.source_comparison_quantity &&
    match.equivalent_total_price !== null &&
    match.comparison_unit_label !== "each"
      ? `Compared as ${match.source_comparison_quantity} ${match.comparison_unit_label.replace(/^per\s+/, "")}${match.source_comparison_quantity === 1 ? "" : "s"}: £${match.equivalent_total_price.toFixed(2)}`
      : null;

  return (
    <a
      href={match.source_url || "#"}
      target={match.source_url ? "_blank" : undefined}
      rel={match.source_url ? "noopener noreferrer" : undefined}
      className={`group block border rounded-xl p-4 transition-all duration-200 hover:shadow-md bg-white ${
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
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 hover:text-cyan-600 transition-colors">{match.product_name}</h4>
          {match.product_description && (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {match.product_description}
            </p>
          )}
          {packLabel && <p className="text-xs text-gray-500 mt-0.5">{packLabel}</p>}
          {equivalentLabel && (
            <p className="mt-1 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
              {equivalentLabel}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-sm font-medium text-gray-700">{match.supplier_name}</p>
            {match.rating_value && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span className="font-bold">{match.rating_value.toFixed(1)}</span>
                {match.rating_count && <span className="text-amber-700/70">({match.rating_count})</span>}
              </div>
            )}
            <div className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-50 border border-gray-100 ${freshness.colorClass}`} title={match.price_date ? new Date(match.price_date).toLocaleDateString() : 'Unknown date'}>
              <span className={`w-1.5 h-1.5 rounded-full ${freshness.dotClass}`} />
              {freshness.label}
            </div>
            <div className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${supplierFriction.className}`}>
              {supplierFriction.label}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
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
          {sourceLabel && (
            <p className="mt-2 break-all rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-500">
              Source: {sourceLabel}
            </p>
          )}
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
                    Save £{match.unit_saving_gbp!.toFixed(2)} {match.comparison_unit_label} ({match.unit_saving_pct?.toFixed(0)}%)
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
                  <span className="text-xs">
                    £{Math.abs(match.saving_gbp!).toFixed(2)} more
                    {match.equivalent_total_price !== null && match.equivalent_quantity
                      ? " for same quantity"
                      : ""}
                  </span>
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
              <span className="text-xs text-cyan-500 font-medium flex items-center gap-1 group-hover:underline">
                View Deal <ExternalLink className="w-3 h-3" />
              </span>
            )}
            {affiliateLink && (
              <span className="block text-[10px] font-medium text-slate-400">
                Affiliate link · no extra cost
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
