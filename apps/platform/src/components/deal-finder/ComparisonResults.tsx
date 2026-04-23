"use client";

import { useState } from "react";
import { LayoutGrid, Search, AlertTriangle, ArrowRight, Sparkles, Activity } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { ScrapedProductCard } from "./ScrapedProductCard";
import { SavingsBanner } from "./SavingsBanner";
import { MatchCard } from "./MatchCard";
import type { ScrapeResponse } from "@/lib/deal-finder/types";
import { suggestRotation, type ThresholdAlert } from "@/lib/deal-finder/services/threshold-intelligence";

interface ComparisonResultsProps {
  data: ScrapeResponse;
  organizationId: string | undefined;
}

type EquivalenceFilter = "all" | "identical" | "alternative";

export function ComparisonResults({ data, organizationId }: ComparisonResultsProps) {
  const { session } = useAuth();
  const [eqFilter, setEqFilter] = useState<EquivalenceFilter>("all");
  const [thresholds, setThresholds] = useState<ThresholdAlert[]>([]);

  // Fetch thresholds so we can suggest rotation if needed
  import("react").then((React) => {
    React.useEffect(() => {
      if (!organizationId) return;
      fetch(`/api/tools/deal-finder/thresholds?organizationId=${organizationId}`, {
        headers: {
          "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
        }
      })
        .then(r => r.json())
        .then(j => {
          if (j.data?.alerts) setThresholds(j.data.alerts);
        })
        .catch(console.error);
    }, []);
  });

  if (!data.product) return null;

  const filtered =
    eqFilter === "all"
      ? data.matches
      : data.matches.filter((m) => m.equivalence_type === eqFilter);

  const sortedMatches = [...filtered].sort((a, b) => {
    if (a.value_score !== b.value_score) return b.value_score - a.value_score;
    if (a.saving_gbp !== null && b.saving_gbp !== null) {
      return b.saving_gbp - a.saving_gbp;
    }
    return b.match_score - a.match_score;
  });

  // Calculate if we need to suggest a rotation
  let rotationWarning: any = { should_rotate: false, reason: "", alternatives: [] };
  
  if (sortedMatches.length > 0 && thresholds.length > 0) {
    const topMatch = sortedMatches[0];
    const topSupplierAlert = thresholds.find(t => 
      t.supplier_name.toLowerCase() === topMatch.supplier_name.toLowerCase()
    );

    if (topSupplierAlert && topMatch.price_gbp !== null) {
      // Create alternatives array in the format expected by suggestRotation
      const formattedAlternatives = sortedMatches.map(m => ({
        supplier: m.supplier_name,
        price: m.price_gbp || 0,
        product_name: m.product_name
      }));

      rotationWarning = suggestRotation(
        topMatch.supplier_name,
        formattedAlternatives,
        topSupplierAlert.current_spend,
        topMatch.price_gbp * (topMatch.pack_quantity || 1) // Estimated purchase amount
      );
    }
  }

  const hasIdentical = data.matches.some((m) => m.equivalence_type === "identical");
  const hasAlternative = data.matches.some((m) => m.equivalence_type === "alternative");

  return (
    <div className="space-y-6">
      <ScrapedProductCard product={data.product} />

      {data.best_saving_gbp !== null && data.best_saving_pct !== null && (
        <SavingsBanner
          savingGbp={data.best_saving_gbp}
          savingPct={data.best_saving_pct}
          unitSavingGbp={data.best_unit_saving_gbp}
          unitSavingPct={data.best_unit_saving_pct}
        />
      )}

      {rotationWarning.should_rotate && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">Procurement Compliance Warning</h3>
              <p className="text-gray-300 text-sm mb-3">{rotationWarning.reason}</p>
              
              {rotationWarning.alternatives.length > 0 && (
                <div className="bg-[#0a0a0f] border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider font-semibold">Suggested Compliant Rotation</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-white">{rotationWarning.alternatives[0].supplier}</span>
                      <span className="text-sm text-gray-400">£{rotationWarning.alternatives[0].price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-500 font-medium">+£{rotationWarning.alternatives[0].price_diff.toFixed(2)} diff</span>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {data.discovery_pending && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl p-5 border border-indigo-500/30 shadow-lg mb-6 group cursor-wait">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-blue-500/10 blur-xl group-hover:bg-blue-400/20 transition-all duration-700"></div>
          {/* Sweeping radar effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          
          <div className="relative flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-25"></div>
                <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center relative">
                  <Activity className="w-5 h-5 text-blue-300 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-300" />
                  AI Deep Search Active
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Our intelligence engine is currently scanning the web for deeper discounts. Refresh shortly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {data.match_count > 0
              ? `${data.match_count} alternative${data.match_count !== 1 ? "s" : ""} found`
              : "Alternatives"}
          </h2>
          <p className="text-sm text-gray-500">
            Searched in {(data.duration_ms / 1000).toFixed(1)}s
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {(hasIdentical || hasAlternative) && (
        <div className="flex gap-2">
          <button
            onClick={() => setEqFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-lg border ${
              eqFilter === "all" ? "bg-gray-100 border-gray-300" : "border-gray-200"
            }`}
          >
            All
          </button>
          {hasIdentical && (
            <button
              onClick={() => setEqFilter("identical")}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                eqFilter === "identical"
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "border-green-200 text-green-700 hover:bg-green-50"
              }`}
            >
              Same Product
            </button>
          )}
          {hasAlternative && (
            <button
              onClick={() => setEqFilter("alternative")}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                eqFilter === "alternative"
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "border-blue-200 text-blue-700 hover:bg-blue-50"
              }`}
            >
              Alternatives
            </button>
          )}
        </div>
      )}

      {sortedMatches.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            We couldn&apos;t find alternative suppliers for this product. Try a different product URL.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMatches.map((match, i) => (
            <MatchCard key={match.product_id} match={match} rank={i} />
          ))}
        </div>
      )}
    </div>
  );
}
