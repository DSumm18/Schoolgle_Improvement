"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Briefcase } from "lucide-react";
import { UrlInput } from "@/components/deal-finder/UrlInput";
import { ComparisonResults } from "@/components/deal-finder/ComparisonResults";
import { LoadingSteps } from "@/components/deal-finder/LoadingSteps";
import { ShareDealModal } from "@/components/deal-finder/ShareDealModal";
import { CategoryGrid } from "@/components/deal-finder/CategoryGrid";
import { ThresholdDashboard } from "@/components/deal-finder/ThresholdDashboard";
import { useAuth } from "@/context/SupabaseAuthContext";
import type { ScrapeResponse } from "@/lib/deal-finder/types";

export default function DealFinderPage() {
  const { organizationId, session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (stepInterval.current) clearInterval(stepInterval.current);
    };
  }, []);

  const handleSubmit = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    // Animate loading steps
    stepInterval.current = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 3));
    }, 1500);

    try {
      const res = await fetch(`/api/tools/deal-finder/scrape?organizationId=${organizationId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
        },
        body: JSON.stringify({ url }),
      });

      const data: ScrapeResponse = await res.json();
      setResult(data);

      if (data.status === "failed" && data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compare prices");
    } finally {
      setIsLoading(false);
      if (stepInterval.current) {
        clearInterval(stepInterval.current);
        stepInterval.current = null;
      }
    }
  }, []);

  const handleCategorySelect = useCallback(async (category: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);

    stepInterval.current = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 3));
    }, 1500);

    try {
      const res = await fetch(`/api/tools/deal-finder/search?organizationId=${organizationId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
        },
        body: JSON.stringify({ 
          title: category, 
          category: category.toLowerCase(), 
          source_url: `https://schoolgle.com/category/${category.toLowerCase()}`,
          source_domain: "schoolgle.com"
        }),
      });

      const data = await res.json();
      
      // Transform search response into ScrapeResponse format for the UI
      setResult({
        job_id: "cat-" + Date.now(),
        status: "complete",
        product: {
          id: "cat",
          name: `${category} Deals`,
          currency: "GBP",
          source_url: "",
          pack_quantity: 1,
          pack_unit: "each",
          unit_weight_g: null,
          unit_price_each: null,
          comparison_unit_label: "each",
          rating_value: null,
          rating_count: null,
        },
        matches: (data.data?.alternatives || []).map((alt: any) => ({
          product_id: alt.id,
          product_name: alt.title,
          supplier_id: alt.supplier,
          supplier_name: alt.supplier,
          price_gbp: alt.price,
          image_url: null,
          source_url: alt.source_url,
          match_type: "brand_category",
          match_score: 100,
          saving_gbp: alt.saving,
          saving_pct: alt.saving_pct,
          pack_quantity: alt.pack_qty || 1,
          pack_unit: "each",
          unit_price_each: alt.unit_price,
          unit_saving_gbp: alt.unit_saving,
          unit_saving_pct: alt.unit_saving_pct,
          equivalence_type: "alternative",
          value_score: 80,
          is_best_value: false,
          price_date: null,
          comparison_unit_label: "each",
          rating_value: null,
          rating_count: null,
        })),
        best_saving_gbp: null,
        best_saving_pct: null,
        best_unit_saving_gbp: null,
        best_unit_saving_pct: null,
        best_value_match_id: null,
        match_count: data.data?.alternatives?.length || 0,
        duration_ms: 100,
        discovery_pending: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category");
    } finally {
      setIsLoading(false);
      if (stepInterval.current) {
        clearInterval(stepInterval.current);
        stepInterval.current = null;
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white -m-6 p-8 rounded-tl-xl border-l border-t border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-2 relative">
        {/* Share a Deal CTA */}
        <div className="absolute top-0 right-4">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/50 rounded-full font-medium text-sm transition-colors flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Share a Deal
          </button>
        </div>

        {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-900/30 border border-blue-800 rounded-xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">DealFind</h1>
        </div>
        <p className="text-gray-400 max-w-xl mx-auto">
          Paste a product URL and instantly find cheaper alternatives across 13+ education suppliers.
          Every comparison is logged as procurement compliance evidence.
        </p>
      </div>

      <ThresholdDashboard organizationId={organizationId || undefined} />

      {/* URL Input */}
      <UrlInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        size="large"
        className="mb-8"
      />

      {/* Loading State */}
      {isLoading && <LoadingSteps currentStep={loadingStep} />}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-400 text-sm font-medium mb-1">
            Something went wrong
          </p>
          <p className="text-red-300 text-sm">{error}</p>
          <p className="text-red-500/80 text-xs mt-2">
            Tip: Try removing tracking parameters from the URL (everything after the &quot;?&quot;) or paste a URL from a different supplier.
          </p>
        </div>
      )}

      {/* Empty State / Categories */}
      {!result && !isLoading && !error && (
        <CategoryGrid onCategorySelect={handleCategorySelect} />
      )}

      {/* Results */}
      {result && result.status === "complete" && !isLoading && (
        <ComparisonResults data={result} organizationId={organizationId || undefined} />
      )}

      {/* Modals */}
      <ShareDealModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)}
        organizationId={organizationId || undefined}
      />
      </div>
    </div>
  );
}
