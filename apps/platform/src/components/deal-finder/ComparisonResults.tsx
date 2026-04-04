"use client";

import { useState } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { ScrapedProductCard } from "./ScrapedProductCard";
import { SavingsBanner } from "./SavingsBanner";
import { MatchCard } from "./MatchCard";
import type { ScrapeResponse } from "@/lib/deal-finder/types";

interface ComparisonResultsProps {
  data: ScrapeResponse;
}

type EquivalenceFilter = "all" | "identical" | "alternative";

export function ComparisonResults({ data }: ComparisonResultsProps) {
  const [eqFilter, setEqFilter] = useState<EquivalenceFilter>("all");

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

  const hasIdentical = data.matches.some((m) => m.equivalence_type === "identical");
  const hasAlternative = data.matches.some((m) => m.equivalence_type === "alternative");

  return (
    <div className="space-y-6">
      <ScrapedProductCard product={data.product} />

      {data.best_saving_gbp && data.best_saving_pct && data.best_saving_gbp > 0 && (
        <SavingsBanner
          savingGbp={data.best_saving_gbp}
          savingPct={data.best_saving_pct}
          unitSavingGbp={data.best_unit_saving_gbp}
          unitSavingPct={data.best_unit_saving_pct}
        />
      )}

      {data.discovery_pending && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <Search className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <span>Searching additional suppliers... Refresh in a few seconds for more results.</span>
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
