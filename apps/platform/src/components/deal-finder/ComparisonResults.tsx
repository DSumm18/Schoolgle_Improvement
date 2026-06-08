"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Info,
  LayoutGrid,
  Search,
  Sparkles,
} from "lucide-react";
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

function getRecommendation(data: ScrapeResponse) {
  const pricedMatches = data.matches.filter((match) => match.price_gbp !== null);
  const bestValue =
    pricedMatches.find((match) => match.is_best_value) ||
    [...pricedMatches].sort((a, b) => b.value_score - a.value_score)[0];
  const bestSaving = [...pricedMatches]
    .filter((match) => match.saving_gbp !== null && match.saving_gbp > 0)
    .sort((a, b) => (b.saving_gbp || 0) - (a.saving_gbp || 0))[0];
  const bestUnitSaving = [...pricedMatches]
    .filter((match) => match.unit_saving_gbp !== null && match.unit_saving_gbp > 0)
    .sort((a, b) => (b.unit_saving_pct || 0) - (a.unit_saving_pct || 0))[0];

  if (bestUnitSaving) {
    const unitName = bestUnitSaving.comparison_unit_label.replace(/^per\s+/, "");
    const quantity = bestUnitSaving.source_comparison_quantity;
    return {
      title: "Best value: buy this way if you need the quantity",
      body: `${bestUnitSaving.supplier_name} is cheaper on a like-for-like unit basis. The useful comparison is ${quantity ? `${quantity} ${unitName}${quantity === 1 ? "" : "s"}` : "the same quantity"}, not just the headline checkout price.`,
      detail: `Unit saving: £${bestUnitSaving.unit_saving_gbp?.toFixed(2)} ${bestUnitSaving.comparison_unit_label}`,
    };
  }

  if (bestSaving) {
    return {
      title: "Best immediate saving",
      body: `${bestSaving.supplier_name} appears cheaper than the original product and is the best first option to review.`,
      detail: `Potential saving: £${bestSaving.saving_gbp?.toFixed(2)}`,
    };
  }

  if (bestValue) {
    return {
      title: "Original product looks best value so far",
      body: `The alternatives we found are comparable, but none beat the original on a like-for-like unit basis. Keep the original unless you prefer a school-account supplier or need a different ordering route.`,
      detail: "No verified saving against the pasted product",
    };
  }

  if (data.discovery_pending) {
    return {
      title: "We have saved the product and are still searching",
      body: "No verified alternatives are ready yet. Deal Finder has added this product to the community database and is checking supplier sources in the background.",
      detail: "No fake supplier results shown",
    };
  }

  return {
    title: "No verified alternatives yet",
    body: "We could read the product, but we could not verify a comparable supplier result. Try another URL or share the deal manually if you already know a supplier.",
    detail: "Product saved for future matching",
  };
}

export function ComparisonResults({ data, organizationId }: ComparisonResultsProps) {
  const { session } = useAuth();
  const [eqFilter, setEqFilter] = useState<EquivalenceFilter>("all");
  const [thresholds, setThresholds] = useState<ThresholdAlert[]>([]);

  useEffect(() => {
    if (!organizationId) return;

    fetch(`/api/tools/deal-finder/thresholds?organizationId=${organizationId}`, {
      headers: {
        Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
      },
    })
      .then((response) => response.json())
      .then((json) => {
        if (json.data?.alerts) setThresholds(json.data.alerts);
      })
      .catch(console.error);
  }, [organizationId, session?.access_token]);

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
  const recommendation = getRecommendation(data);

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

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white p-2 shadow-sm">
            <Sparkles className="h-4 w-4 text-emerald-700" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              Smart buying recommendation
            </p>
            <h3 className="mt-1 text-lg font-semibold">{recommendation.title}</h3>
            <p className="mt-1 text-sm text-emerald-900/80">{recommendation.body}</p>
            <p className="mt-3 inline-flex rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-800">
              {recommendation.detail}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-700" />
          <div>
            <p className="text-sm font-bold text-blue-950">Fair comparison note</p>
            <p className="mt-1 text-sm leading-6 text-blue-900/80">
              Schools often prefer suppliers they already use, such as YPO,
              ESPO, KCS or existing office accounts. We show alternatives so the
              office can weigh price against account setup, delivery and ordering
              friction.
            </p>
          </div>
        </div>
      </div>

      {data.retailer_search_links.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-orange-950">
                Amazon live price check
              </p>
              <p className="mt-1 text-sm leading-6 text-orange-900/80">
                We have not verified an Amazon product price for this comparison
                yet, so Amazon is not ranked as a saving. Use this tagged search
                link as a quick manual check.
              </p>
              <p className="mt-2 text-xs leading-5 text-orange-800">
                {data.retailer_search_links[0].reason}
              </p>
            </div>
            <a
              href={data.retailer_search_links[0].url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-800 shadow-sm hover:bg-orange-100"
            >
              Check Amazon
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {rotationWarning.should_rotate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Procurement Compliance Warning</h3>
              <p className="text-amber-900/80 text-sm mb-3">{rotationWarning.reason}</p>
              
              {rotationWarning.alternatives.length > 0 && (
                <div className="bg-white border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 mb-2 uppercase tracking-wider font-semibold">Suggested Compliant Rotation</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-950">{rotationWarning.alternatives[0].supplier}</span>
                      <span className="text-sm text-slate-500">£{rotationWarning.alternatives[0].price.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-amber-700 font-medium">+£{rotationWarning.alternatives[0].price_diff.toFixed(2)} diff</span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {data.discovery_pending && (
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-indigo-100 shadow-sm mb-6 group cursor-wait">
          {/* Animated background glow */}
          <div className="absolute inset-0 bg-blue-200/20 blur-xl group-hover:bg-blue-200/30 transition-all duration-700"></div>
          {/* Sweeping radar effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
          
          <div className="relative flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-25"></div>
                <div className="w-10 h-10 bg-white border border-blue-100 rounded-full flex items-center justify-center relative">
                  <Activity className="w-5 h-5 text-blue-700 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  Supplier discovery active
                </h3>
                <p className="text-xs text-blue-900/70 mt-0.5">
                  This product is saved. We are checking trusted supplier sources and will only show verified matches.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
          <p className="text-sm leading-6 text-slate-600">
            Some retailer links may be affiliate links. They do not cost the
            school extra and help keep Deal Finder free. Results should stay
            ordered by value, confidence and school feedback — not commission.
          </p>
        </div>
      </div>

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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No verified matches yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            We won&apos;t invent supplier results. This product has been saved, and the next pass should check trusted suppliers and community submissions for real alternatives.
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
